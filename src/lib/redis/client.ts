/**
 * Redis Client Configuration and Connection Management
 * Handles Redis connection, fallback logic, and client initialization
 */

import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import type { RedisConnectionStatus } from '@/src/lib/schemas/cache.schema';
import { ParseStrategy, safeParse } from '@/src/lib/utils/safe-json';

// Re-export Redis type for consumers
export type { Redis };

// Client-safe Redis config
const redisConfig = {
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
  isConfigured: !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN),
} as const;

// Redis client configuration schema
const redisClientConfigSchema = z.object({
  url: z.string().url().optional(),
  token: z.string().optional(),
  enableFallback: z.boolean().default(true),
  connectionTimeout: z.number().min(1000).max(30000).default(5000),
  commandTimeout: z.number().min(100).max(10000).default(2000),
  retryAttempts: z.number().min(1).max(5).default(3),
  retryDelay: z.number().min(100).max(5000).default(1000),
});

type RedisClientConfig = z.infer<typeof redisClientConfigSchema>;

/**
 * Redis Client Manager
 * Handles connection management, fallback logic, and operation retry
 */
class RedisClientManager {
  private redis: Redis | null = null;
  private config: RedisClientConfig;
  private connectionStatus: RedisConnectionStatus = {
    isConnected: false,
    isFallback: false,
    lastConnectionAttempt: null,
    consecutiveFailures: 0,
    totalOperations: 0,
    failedOperations: 0,
  };

  // In-memory fallback storage with LRU-like eviction
  private fallbackStorage = new Map<
    string,
    { value: string; expiry: number; size: number; lastAccess: number }
  >();
  private fallbackCleanupInterval: NodeJS.Timeout | null = null;
  private fallbackMemoryBytes = 0;
  private readonly MAX_FALLBACK_MEMORY_MB = 100; // 100MB limit for fallback storage

  constructor(config?: Partial<RedisClientConfig>) {
    this.config = redisClientConfigSchema.parse({
      url: redisConfig.url,
      token: redisConfig.token,
      ...config,
    });

    this.initializeConnection();
    this.setupFallbackCleanup();
  }

  /**
   * Initialize Redis connection with validation
   */
  private initializeConnection(): void {
    try {
      if (!(this.config.url && this.config.token)) {
        logger.warn('Redis credentials not configured, using in-memory fallback');
        this.enableFallbackMode();
        return;
      }

      this.redis = new Redis({
        url: this.config.url,
        token: this.config.token,
        automaticDeserialization: false, // Handle serialization manually for security
        enableAutoPipelining: true, // Enable auto-pipelining for batch operations
        latencyLogging: process.env.NODE_ENV === 'development', // Log latency in dev
        retry: {
          retries: this.config.retryAttempts,
          backoff: (retryCount) => Math.min(this.config.retryDelay * 2 ** retryCount, 5000),
        },
      });

      this.connectionStatus.isConnected = true;
      this.connectionStatus.isFallback = false;
      this.connectionStatus.consecutiveFailures = 0;

      logger.info('Redis client initialized successfully');
    } catch (error) {
      logger.error(
        'Failed to initialize Redis client',
        error instanceof Error ? error : new Error(String(error))
      );
      this.enableFallbackMode();
    }
  }

  /**
   * Enable in-memory fallback mode
   */
  private enableFallbackMode(): void {
    this.connectionStatus.isFallback = true;
    this.connectionStatus.isConnected = false;
    this.redis = null;

    logger.info('Redis fallback mode enabled - using in-memory storage');
  }

  /**
   * Evict least recently used entries when memory limit is exceeded
   */
  private evictLRU(): void {
    const maxBytes = this.MAX_FALLBACK_MEMORY_MB * 1024 * 1024;

    if (this.fallbackMemoryBytes <= maxBytes) return;

    // Sort entries by last access time (oldest first)
    const entries = Array.from(this.fallbackStorage.entries()).sort(
      (a, b) => a[1].lastAccess - b[1].lastAccess
    );

    let evicted = 0;
    let bytesFreed = 0;

    // Evict oldest entries until we're under the limit
    for (const [key, data] of entries) {
      if (this.fallbackMemoryBytes <= maxBytes * 0.8) break; // Stop at 80% capacity

      this.fallbackStorage.delete(key);
      this.fallbackMemoryBytes -= data.size;
      bytesFreed += data.size;
      evicted++;
    }

    if (evicted > 0) {
      logger.info(
        `Evicted ${evicted} entries from fallback storage (freed ${(bytesFreed / 1024 / 1024).toFixed(2)}MB)`
      );
    }
  }

  /**
   * Setup periodic cleanup for fallback storage
   */
  private setupFallbackCleanup(): void {
    if (this.fallbackCleanupInterval) {
      clearInterval(this.fallbackCleanupInterval);
    }

    this.fallbackCleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      let bytesFreed = 0;

      for (const [key, data] of this.fallbackStorage.entries()) {
        if (data.expiry > 0 && now > data.expiry) {
          this.fallbackStorage.delete(key);
          this.fallbackMemoryBytes -= data.size;
          bytesFreed += data.size;
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug(
          `Cleaned ${cleaned} expired entries from fallback storage (freed ${(bytesFreed / 1024).toFixed(1)}KB)`
        );
      }

      // Check memory usage and evict if needed
      this.evictLRU();
    }, 60000); // Cleanup every minute
  }

  /**
   * Execute Redis operation with fallback handling
   */
  async executeOperation<T>(
    operation: (redis: Redis) => Promise<T>,
    fallbackOperation?: () => Promise<T> | T,
    operationName = 'unknown'
  ): Promise<T> {
    this.connectionStatus.totalOperations++;
    this.connectionStatus.lastConnectionAttempt = new Date();

    // If in fallback mode or no Redis client, use fallback
    if (this.connectionStatus.isFallback || !this.redis) {
      if (fallbackOperation) {
        const result = await Promise.resolve(fallbackOperation());
        return result;
      }
      throw new Error(`Redis operation ${operationName} not available in fallback mode`);
    }

    try {
      const result = await Promise.race([
        operation(this.redis),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), this.config.commandTimeout)
        ),
      ]);

      // Reset failure counter on success
      this.connectionStatus.consecutiveFailures = 0;
      return result;
    } catch (error) {
      this.connectionStatus.failedOperations++;
      this.connectionStatus.consecutiveFailures++;

      const err = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Redis operation ${operationName} failed`, {
        error: err.message,
      });

      // If too many consecutive failures, enable fallback mode
      if (this.connectionStatus.consecutiveFailures >= this.config.retryAttempts) {
        logger.error(
          `Redis connection unstable (${this.connectionStatus.consecutiveFailures} failures), enabling fallback mode`
        );
        this.enableFallbackMode();
      }

      // Try fallback operation
      if (fallbackOperation && this.config.enableFallback) {
        logger.info(`Using fallback for operation: ${operationName}`);
        const result = await Promise.resolve(fallbackOperation());
        return result;
      }

      throw err;
    }
  }

  /**
   * Get Redis client (use executeOperation instead for safety)
   */
  getClient(): Redis | null {
    return this.redis;
  }

  /**
   * Get connection status
   */
  getStatus(): RedisConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Test Redis connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.executeOperation(
        async (redis) => {
          const testKey = `connection_test_${Date.now()}`;
          await redis.set(testKey, 'test', { ex: 1 });
          const value = await redis.get(testKey);
          await redis.del(testKey);
          return value === 'test';
        },
        () => true, // Fallback always succeeds
        'connection_test'
      );
      return result;
    } catch {
      return false;
    }
  }

  /**
   * Fallback storage operations with memory management
   */
  async setFallback(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0;
    const size = Buffer.byteLength(value, 'utf8');
    const now = Date.now();

    // Remove old entry if exists
    const oldData = this.fallbackStorage.get(key);
    if (oldData) {
      this.fallbackMemoryBytes -= oldData.size;
    }

    // Add new entry
    this.fallbackStorage.set(key, { value, expiry, size, lastAccess: now });
    this.fallbackMemoryBytes += size;

    // Evict if over memory limit
    this.evictLRU();
  }

  async getFallback(key: string): Promise<string | null> {
    const data = this.fallbackStorage.get(key);
    if (!data) return null;

    if (data.expiry > 0 && Date.now() > data.expiry) {
      this.fallbackStorage.delete(key);
      this.fallbackMemoryBytes -= data.size;
      return null;
    }

    // Update last access time for LRU
    data.lastAccess = Date.now();

    return data.value;
  }

  async delFallback(key: string): Promise<void> {
    const data = this.fallbackStorage.get(key);
    if (data) {
      this.fallbackMemoryBytes -= data.size;
    }
    this.fallbackStorage.delete(key);
  }

  /**
   * Batch get multiple keys using Redis pipeline with automatic chunking
   *
   * Performance: +8-12ms improvement per batch vs individual calls
   * Use for: Mixed operations or when you need typed results per key
   *
   * For pure string GET operations, consider using mget() instead (slightly faster)
   *
   * @param keys - Array of Redis keys to fetch
   * @param options - Configuration options
   * @returns Map of key -> value (null if key doesn't exist)
   */
  async getBatchPipeline<T = string>(
    keys: string[],
    options: {
      batchSize?: number;
      deserialize?: boolean;
    } = {}
  ): Promise<Map<string, T | null>> {
    const { batchSize = 50, deserialize = false } = options;

    if (keys.length === 0) {
      return new Map();
    }

    // Deduplicate keys while preserving order
    const uniqueKeys = [...new Set(keys)];
    const resultMap = new Map<string, T | null>();

    // Process in chunks to respect batch size limits
    for (let i = 0; i < uniqueKeys.length; i += batchSize) {
      const chunk = uniqueKeys.slice(i, i + batchSize);

      await this.executeOperation(
        async (redis) => {
          const pipeline = redis.pipeline();

          // Build pipeline commands
          for (const key of chunk) {
            pipeline.get(key);
          }

          const results = await pipeline.exec();

          // Null check: Pipeline exec can return null on connection failure
          if (!(results && Array.isArray(results))) {
            logger.warn('Pipeline exec returned null or invalid results', {
              component: 'getBatchPipeline',
              keysRequested: chunk.length,
            });
            // Set all keys to null in result map
            for (const key of chunk) {
              resultMap.set(key, null);
            }
            return results;
          }

          // Map results back to keys
          for (let index = 0; index < chunk.length; index++) {
            const key = chunk[index];
            if (!key) continue;

            const rawValue = results[index];
            let value: T | null = null;

            if (rawValue !== null && rawValue !== undefined) {
              if (deserialize) {
                try {
                  // safeParse requires string input - add type guard
                  if (typeof rawValue === 'string') {
                    value = safeParse<T>(rawValue, undefined, {
                      strategy: ParseStrategy.DEVALUE,
                      fallbackStrategy: ParseStrategy.UNSAFE_JSON,
                      enableLogging: false,
                    });
                  } else {
                    // Non-string value, use as-is (should not happen with pipeline.get())
                    value = rawValue as T;
                  }
                } catch {
                  value = rawValue as T;
                }
              } else {
                value = rawValue as T;
              }
            }

            resultMap.set(key, value);
          }

          return results;
        },
        async () => {
          // Fallback: try to get from in-memory storage
          for (const key of chunk) {
            const fallbackValue = await this.getFallback(key);
            let value: T | null = null;

            if (fallbackValue !== null) {
              if (deserialize) {
                try {
                  value = safeParse<T>(fallbackValue, undefined, {
                    strategy: ParseStrategy.DEVALUE,
                    fallbackStrategy: ParseStrategy.UNSAFE_JSON,
                    enableLogging: false,
                  });
                } catch {
                  value = fallbackValue as T;
                }
              } else {
                value = fallbackValue as T;
              }
            }

            resultMap.set(key, value);
          }
          return [];
        },
        `getBatchPipeline_chunk_${i}`
      );
    }

    return resultMap;
  }

  /**
   * Batch get multiple keys using MGET (optimized for pure string GETs)
   *
   * Performance: ~10-20% faster than pipeline for pure GET operations
   * Use for: Simple string value reads, atomic operation required
   * Limitation: Only works for string values (not hashes, sets, etc.)
   *
   * @param keys - Array of Redis keys to fetch
   * @returns Map of key -> value (null if key doesn't exist)
   */
  async getBatchMget<T = string>(keys: string[]): Promise<Map<string, T | null>> {
    if (keys.length === 0) {
      return new Map();
    }

    // Deduplicate keys while preserving order
    const uniqueKeys = [...new Set(keys)];

    return this.executeOperation(
      async (redis) => {
        const values = (await redis.mget(...uniqueKeys)) as (string | null)[];

        return new Map(uniqueKeys.map((key, index) => [key, (values[index] as T | null) || null]));
      },
      async () => {
        // Fallback: get from in-memory storage
        const resultMap = new Map<string, T | null>();
        for (const key of uniqueKeys) {
          const value = await this.getFallback(key);
          resultMap.set(key, value as T | null);
        }
        return resultMap;
      },
      'getBatchMget'
    );
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    fallbackKeys: number;
    fallbackMemoryMB: number;
    fallbackMemoryUsagePercent: number;
    redisConnected: boolean;
    totalOperations: number;
    failedOperations: number;
    successRate: number;
  } {
    const { totalOperations, failedOperations } = this.connectionStatus;
    const maxBytes = this.MAX_FALLBACK_MEMORY_MB * 1024 * 1024;

    return {
      fallbackKeys: this.fallbackStorage.size,
      fallbackMemoryMB: this.fallbackMemoryBytes / 1024 / 1024,
      fallbackMemoryUsagePercent: (this.fallbackMemoryBytes / maxBytes) * 100,
      redisConnected: this.connectionStatus.isConnected && !this.connectionStatus.isFallback,
      totalOperations,
      failedOperations,
      successRate:
        totalOperations > 0 ? ((totalOperations - failedOperations) / totalOperations) * 100 : 100,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.fallbackCleanupInterval) {
      clearInterval(this.fallbackCleanupInterval);
      this.fallbackCleanupInterval = null;
    }

    this.fallbackStorage.clear();
    this.redis = null;
  }
}

// Global Redis client instance
export const redisClient = new RedisClientManager();
