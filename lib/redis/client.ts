/**
 * Redis Client Configuration and Connection Management
 * Handles Redis connection, fallback logic, and client initialization
 */

import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { logger } from '../logger';
import type { RedisConnectionStatus } from '../schemas/cache.schema';

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

// Re-export type for backward compatibility
export type { RedisConnectionStatus };

/**
 * Redis Client Manager
 * Handles connection management, fallback logic, and operation retry
 */
export class RedisClientManager {
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

  // In-memory fallback storage
  private fallbackStorage = new Map<string, { value: string; expiry: number }>();
  private fallbackCleanupInterval: NodeJS.Timeout | null = null;

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
   * Setup periodic cleanup for fallback storage
   */
  private setupFallbackCleanup(): void {
    if (this.fallbackCleanupInterval) {
      clearInterval(this.fallbackCleanupInterval);
    }

    this.fallbackCleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, data] of this.fallbackStorage.entries()) {
        if (data.expiry > 0 && now > data.expiry) {
          this.fallbackStorage.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug(`Cleaned ${cleaned} expired entries from fallback storage`);
      }
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
      logger.warn(`Redis operation ${operationName} failed`, { error: err.message });

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
   * Fallback storage operations
   */
  async setFallback(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0;
    this.fallbackStorage.set(key, { value, expiry });
  }

  async getFallback(key: string): Promise<string | null> {
    const data = this.fallbackStorage.get(key);
    if (!data) return null;

    if (data.expiry > 0 && Date.now() > data.expiry) {
      this.fallbackStorage.delete(key);
      return null;
    }

    return data.value;
  }

  async delFallback(key: string): Promise<void> {
    this.fallbackStorage.delete(key);
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    fallbackKeys: number;
    redisConnected: boolean;
    totalOperations: number;
    failedOperations: number;
    successRate: number;
  } {
    const { totalOperations, failedOperations } = this.connectionStatus;
    return {
      fallbackKeys: this.fallbackStorage.size,
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

// Health check function
export const isRedisHealthy = async (): Promise<boolean> => {
  return redisClient.testConnection();
};

export default redisClient;
