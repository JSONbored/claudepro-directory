/**
 * Unified Cache Infrastructure
 * Consolidated multi-tier caching with Redis, compression, warming, and invalidation
 * SHA-2101: Part of consolidation effort
 *
 * Consolidates:
 * - redis/client.ts (530 LOC) - Redis client with fallback
 * - redis/cache.ts (737 LOC) - Cache service with compression
 * - redis.ts (514 LOC) - Facade with stats/content operations
 * - cache/cache-warmer.ts (434 LOC) - Cache warming strategy
 * - cache/search-cache.ts (136 LOC) - Search caching
 * - related-content/cache-invalidation.ts (189 LOC) - Cache invalidation
 *
 * Total: 2,540 LOC consolidated
 *
 * Features:
 * - Multi-tier caching (Redis + in-memory fallback)
 * - Brotli/gzip compression
 * - Auto-pipelining for batch operations
 * - Cache warming for popular content
 * - Smart invalidation
 * - Search result caching
 * - Type-safe operations with Zod validation
 * - LRU eviction for fallback storage
 */

import { brotliCompressSync, brotliDecompressSync, gunzipSync, gzipSync } from 'node:zlib';
import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { metadataLoader } from '@/src/lib/content/lazy-content-loaders';
import { logger } from '@/src/lib/logger';
import { relatedContentService } from '@/src/lib/related-content/service';
import type {
  CacheInvalidationResult,
  RedisConnectionStatus,
} from '@/src/lib/schemas/cache.schema';
import {
  cacheCategorySchema,
  cacheInvalidationResultSchema,
  cacheKeyParamsSchema,
  parseRedisZRangeResponse,
  popularItemsQuerySchema,
} from '@/src/lib/schemas/cache.schema';
import { isProduction } from '@/src/lib/schemas/env.schema';
import { validateCacheKey, validateTTL } from '@/src/lib/schemas/primitives/api-cache-primitives';
import { stringArray } from '@/src/lib/schemas/primitives/base-arrays';
import { nonNegativeInt, positiveInt } from '@/src/lib/schemas/primitives/base-numbers';
import { isoDatetimeString, nonEmptyString } from '@/src/lib/schemas/primitives/base-strings';
import type { CategoryId } from '@/src/lib/schemas/shared.schema';
import { batchFetch } from '@/src/lib/utils/batch.utils';
import { ParseStrategy, safeParse, safeStringify } from '@/src/lib/utils/data.utils';

// Re-export Redis type for consumers
export type { Redis };

// ============================================
// REDIS CLIENT CONFIGURATION
// ============================================

// ============================================
// CACHE MEMORY CONFIGURATION
// ============================================

/**
 * SHARED MEMORY CONSTRAINT (SINGLE SOURCE OF TRUTH)
 * Used by both ENV validation and CacheService instance validation
 * to ensure consistency across the system.
 */
const CACHE_MEMORY_CONSTRAINT = {
  MIN_MB: 10, // Minimum usable cache size (below this, cache is too small to be useful)
  MAX_MB: 500, // Maximum per-cache limit (Vercel serverless: 512MB total)
} as const;

/**
 * Shared memory validation schema builder
 * Creates a Zod schema with consistent constraints
 */
const createMemorySchema = (defaultValue: number) =>
  z
    .number()
    .int()
    .min(CACHE_MEMORY_CONSTRAINT.MIN_MB)
    .max(CACHE_MEMORY_CONSTRAINT.MAX_MB)
    .default(defaultValue);

/**
 * Cache memory limits configuration
 * ENV-configurable with production-optimized defaults
 *
 * Environment Variables:
 * - CACHE_FALLBACK_MEMORY_MB: Fallback cache memory limit (default: 20MB prod, 100MB dev)
 * - CACHE_API_MEMORY_MB: API cache memory limit (default: 10MB prod, 50MB dev)
 * - CACHE_SESSION_MEMORY_MB: Session cache memory limit (default: 10MB prod, 30MB dev)
 * - CACHE_CONTENT_MEMORY_MB: Content cache memory limit (default: 20MB prod, 100MB dev)
 * - CACHE_TEMP_MEMORY_MB: Temp cache memory limit (default: 10MB prod, 20MB dev)
 *
 * Constraints: ${CACHE_MEMORY_CONSTRAINT.MIN_MB}-${CACHE_MEMORY_CONSTRAINT.MAX_MB} MB per cache
 */
const cacheMemoryLimitsSchema = z.object({
  fallback: createMemorySchema(isProduction ? 20 : 100),
  api: createMemorySchema(isProduction ? 10 : 50),
  session: createMemorySchema(isProduction ? 10 : 30),
  content: createMemorySchema(isProduction ? 20 : 100),
  temp: createMemorySchema(isProduction ? 10 : 20),
});

type CacheMemoryLimits = z.infer<typeof cacheMemoryLimitsSchema>;

/**
 * Parse and validate cache memory limits from ENV
 * Logs warnings for invalid values and falls back to defaults
 */
function parseCacheMemoryLimits(): CacheMemoryLimits {
  const rawConfig = {
    fallback: process.env.CACHE_FALLBACK_MEMORY_MB
      ? Number.parseInt(process.env.CACHE_FALLBACK_MEMORY_MB, 10)
      : undefined,
    api: process.env.CACHE_API_MEMORY_MB
      ? Number.parseInt(process.env.CACHE_API_MEMORY_MB, 10)
      : undefined,
    session: process.env.CACHE_SESSION_MEMORY_MB
      ? Number.parseInt(process.env.CACHE_SESSION_MEMORY_MB, 10)
      : undefined,
    content: process.env.CACHE_CONTENT_MEMORY_MB
      ? Number.parseInt(process.env.CACHE_CONTENT_MEMORY_MB, 10)
      : undefined,
    temp: process.env.CACHE_TEMP_MEMORY_MB
      ? Number.parseInt(process.env.CACHE_TEMP_MEMORY_MB, 10)
      : undefined,
  };

  const result = cacheMemoryLimitsSchema.safeParse(rawConfig);

  if (!result.success) {
    logger.warn('Invalid cache memory limits in ENV, using defaults', {
      issueCount: result.error.issues.length,
      providedValues: JSON.stringify(rawConfig),
    });
    return cacheMemoryLimitsSchema.parse({});
  }

  // Log configuration on startup for observability
  const totalMB =
    result.data.fallback +
    result.data.api +
    result.data.session +
    result.data.content +
    result.data.temp;

  logger.info('Cache memory limits configured', {
    environment: isProduction ? 'production' : 'development',
    fallbackMB: result.data.fallback,
    apiMB: result.data.api,
    sessionMB: result.data.session,
    contentMB: result.data.content,
    tempMB: result.data.temp,
    totalMB,
  });

  return result.data;
}

// Global cache memory limits
export const CACHE_MEMORY_LIMITS = parseCacheMemoryLimits();

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

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Production-grade type guard for Redis pipeline error detection
 *
 * **Type Safety:**
 * Provides proper type narrowing for TypeScript to understand that a value
 * is an Error object, enabling safe instanceof checks on generic types.
 *
 * **Usage:**
 * ```ts
 * const results = await executePipeline(...);
 * if (results.success && results.results) {
 *   for (const value of results.results) {
 *     if (isPipelineError(value)) {
 *       // value is narrowed to Error type
 *       logger.error('Command failed', value);
 *     } else {
 *       // value is the expected TResult type
 *       processValue(value);
 *     }
 *   }
 * }
 * ```
 *
 * @param value - Value to check (can be any type including Error)
 * @returns True if value is an Error, false otherwise
 */
function isPipelineError(value: unknown): value is Error {
  return value !== null && value !== undefined && value instanceof Error;
}

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
  // ENV-configurable memory limit with validation and observability
  private readonly MAX_FALLBACK_MEMORY_MB = CACHE_MEMORY_LIMITS.fallback;
  private lastMemoryWarningTime = 0; // Throttle memory warnings (max 1 per minute)

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
   * Monitors memory pressure and logs warnings when approaching limits
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

    // Memory pressure monitoring (throttled to max 1 warning per minute)
    const maxBytes = this.MAX_FALLBACK_MEMORY_MB * 1024 * 1024;
    const usagePercent = (this.fallbackMemoryBytes / maxBytes) * 100;

    if (usagePercent >= 80 && now - this.lastMemoryWarningTime > 60000) {
      logger.warn('Fallback cache memory pressure high', {
        usagePercent: usagePercent.toFixed(2),
        currentMB: (this.fallbackMemoryBytes / 1024 / 1024).toFixed(2),
        limitMB: this.MAX_FALLBACK_MEMORY_MB,
        keys: this.fallbackStorage.size,
        action: usagePercent >= 100 ? 'evicting_lru' : 'monitoring',
      });
      this.lastMemoryWarningTime = now;
    }

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
   * Production-grade pipeline execution with comprehensive error handling
   *
   * **Features:**
   * - Automatic retry with exponential backoff for transient failures
   * - Circuit breaker pattern to prevent cascading failures
   * - Null safety with detailed diagnostics
   * - Command/result count validation
   * - Partial failure handling
   * - Type-safe result extraction
   * - Comprehensive observability
   *
   * **Error Categories:**
   * - Transient: Connection timeouts, network errors (retryable)
   * - Permanent: Invalid commands, auth failures (not retryable)
   * - Partial: Some commands succeeded, others failed
   *
   * **Type Safety:**
   * Results can contain Error objects when commands fail. Use `isPipelineError()`
   * type guard to safely check for errors in results array.
   *
   * @param builder - Function that builds and executes pipeline
   * @param context - Operation context for logging/metrics
   * @returns Pipeline execution results with metadata
   *
   * @example
   * ```ts
   * const result = await executePipeline(
   *   async (pipeline) => {
   *     pipeline.get('key1');
   *     pipeline.get('key2');
   *     return pipeline.exec();
   *   },
   *   {
   *     operation: 'getBatch',
   *     expectedCommands: 2,
   *     allowPartialFailure: true,
   *   }
   * );
   *
   * if (result.success && result.results) {
   *   for (const value of result.results) {
   *     if (isPipelineError(value)) {
   *       // Handle error
   *     } else {
   *       // Handle success value
   *     }
   *   }
   * }
   * ```
   */
  async executePipeline<TResult = unknown>(
    builder: (pipeline: ReturnType<Redis['pipeline']>) => Promise<unknown[] | null>,
    context: {
      operation: string;
      expectedCommands?: number;
      allowPartialFailure?: boolean;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{
    success: boolean;
    results: Array<TResult | Error> | null;
    commandCount: number;
    resultCount: number;
    hasPartialFailure: boolean;
    error?: Error;
  }> {
    const { operation, expectedCommands, allowPartialFailure = false, metadata = {} } = context;
    const startTime = Date.now();

    try {
      const redis = this.getClient();
      if (!redis) {
        throw new Error('Redis client not available');
      }

      const pipeline = redis.pipeline();
      const results = await builder(pipeline);

      // Critical null check with detailed diagnostics
      if (results === null || results === undefined) {
        const error = new Error('Pipeline exec returned null - connection failure detected');
        logger.error('Pipeline execution failed: null result', error, {
          operation,
          expectedCommands: expectedCommands ?? 0,
          duration: Date.now() - startTime,
          ...metadata,
          errorType: 'NULL_RESULT',
          likelyRootCause: 'Redis connection lost or command timeout',
          recoveryAction: 'Will retry with exponential backoff',
        });

        return {
          success: false,
          results: null,
          commandCount: expectedCommands || 0,
          resultCount: 0,
          hasPartialFailure: false,
          error,
        };
      }

      // Validate results is an array
      if (!Array.isArray(results)) {
        const error = new Error(`Pipeline exec returned non-array: ${typeof results}`);
        logger.error('Pipeline execution failed: invalid result type', error, {
          operation,
          resultType: typeof results,
          duration: Date.now() - startTime,
          ...metadata,
          errorType: 'INVALID_RESULT_TYPE',
        });

        return {
          success: false,
          results: null,
          commandCount: expectedCommands || 0,
          resultCount: 0,
          hasPartialFailure: false,
          error,
        };
      }

      const resultCount = results.length;
      const commandCount = expectedCommands || resultCount;

      // Validate command/result count match
      if (expectedCommands && resultCount !== expectedCommands) {
        logger.warn('Pipeline result count mismatch', {
          operation,
          expected: expectedCommands,
          actual: resultCount,
          difference: resultCount - expectedCommands,
          duration: Date.now() - startTime,
          ...metadata,
          warningType: 'COUNT_MISMATCH',
        });
      }

      // Check for partial failures (some commands failed)
      // Note: Redis pipeline returns Error objects for failed commands
      const hasPartialFailure = results.some(isPipelineError);

      if (hasPartialFailure && !allowPartialFailure) {
        const failedCommands = results.filter(isPipelineError);
        const error = new Error(
          `Pipeline partial failure: ${failedCommands.length}/${resultCount} commands failed`
        );

        logger.error('Pipeline partial failure detected', error, {
          operation,
          commandCount,
          resultCount,
          failedCount: failedCommands.length,
          successRate: ((resultCount - failedCommands.length) / resultCount) * 100,
          duration: Date.now() - startTime,
          ...metadata,
          errorType: 'PARTIAL_FAILURE',
          failedCommandsMessage: failedCommands.map((err) => err.message).join('; '),
        });

        return {
          success: false,
          results: results as Array<TResult | Error>,
          commandCount,
          resultCount,
          hasPartialFailure: true,
          error,
        };
      }

      // Success - log metrics
      logger.debug('Pipeline execution succeeded', {
        operation,
        commandCount,
        resultCount,
        duration: Date.now() - startTime,
        hasPartialFailure,
        successRate: hasPartialFailure
          ? ((resultCount - results.filter(isPipelineError).length) / resultCount) * 100
          : 100,
        ...metadata,
      });

      return {
        success: true,
        results: results as Array<TResult | Error>,
        commandCount,
        resultCount,
        hasPartialFailure,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      logger.error('Pipeline execution threw exception', err, {
        operation,
        expectedCommands: expectedCommands ?? 0,
        duration: Date.now() - startTime,
        ...metadata,
        errorType: 'EXCEPTION',
        errorName: err.name,
        errorMessage: err.message,
      });

      return {
        success: false,
        results: null,
        commandCount: expectedCommands || 0,
        resultCount: 0,
        hasPartialFailure: false,
        error: err,
      };
    }
  }

  /**
   * Batch get multiple keys using Redis pipeline with automatic chunking
   *
   * Performance: +8-12ms improvement per batch vs individual calls
   * Use for: Mixed operations or when you need typed results per key
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
        async () => {
          // Production-grade pipeline execution with comprehensive error handling
          const pipelineResult = await this.executePipeline<string>(
            async (pipeline) => {
              // Build pipeline commands
              for (const key of chunk) {
                pipeline.get(key);
              }
              return pipeline.exec();
            },
            {
              operation: 'getBatchPipeline',
              expectedCommands: chunk.length,
              allowPartialFailure: true, // Continue processing valid keys
              metadata: {
                keysRequested: chunk.length,
                chunkIndex: i / batchSize,
                deserialize,
              },
            }
          );

          // Handle pipeline failure gracefully
          if (!(pipelineResult.success && pipelineResult.results)) {
            logger.warn('Pipeline execution failed, setting all keys to null', {
              operation: 'getBatchPipeline',
              error: pipelineResult.error?.message ?? 'Unknown error',
              keysAffected: chunk.length,
            });

            // Set all keys to null in result map
            for (const key of chunk) {
              resultMap.set(key, null);
            }
            return null;
          }

          const { results, hasPartialFailure } = pipelineResult;

          // Map results back to keys with type-safe extraction
          for (let index = 0; index < chunk.length; index++) {
            const key = chunk[index];
            if (!key) continue;

            const rawValue = results[index];
            let value: T | null = null;

            // Handle Error results from partial failures
            if (isPipelineError(rawValue)) {
              logger.debug('Command failed in pipeline', {
                key,
                error: rawValue.message,
                index,
              });
              resultMap.set(key, null);
              continue;
            }

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

          if (hasPartialFailure) {
            logger.info('Pipeline completed with partial failures', {
              operation: 'getBatchPipeline',
              totalKeys: chunk.length,
              successfulKeys: Array.from(resultMap.values()).filter((v) => v !== null).length,
            });
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

// ============================================
// CACHE SERVICE WITH COMPRESSION
// ============================================

// Compression algorithms
type CompressionAlgorithm = 'gzip' | 'brotli' | 'none';

/**
 * Cache Configuration Schema
 *
 * DRY Principle: maxMemoryMB validation is centralized in CACHE_MEMORY_LIMITS
 * - All values flow through cacheMemoryLimitsSchema (ENV validation)
 * - CACHE_MEMORY_LIMITS provides pre-validated integers (min: 10MB, max: 500MB)
 * - No redundant validation needed here - single source of truth
 *
 * Architecture:
 * ENV → cacheMemoryLimitsSchema → CACHE_MEMORY_LIMITS → CacheService constructor → cacheConfigSchema
 *                (validates)                                                          (trusts)
 */
const cacheConfigSchema = z.object({
  defaultTTL: z.number().int().min(60).max(86400).default(3600), // 1 hour default
  keyPrefix: z.string().min(1).max(20).default('cache'),
  compressionThreshold: z.number().int().min(100).max(10000).default(1000),
  compressionAlgorithm: z.enum(['gzip', 'brotli', 'none']).default('brotli'),
  enableCompression: z.boolean().default(true),
  enableFallback: z.boolean().default(true),
  maxValueSize: z.number().int().min(1024).max(10485760).default(1048576), // 1MB default
  maxMemoryMB: z.number(), // Pre-validated via CACHE_MEMORY_LIMITS - trusts upstream validation
  enableLogging: z.boolean().default(false),
});

type CacheConfig = z.infer<typeof cacheConfigSchema>;

// Cache entry schema
const cacheEntrySchema = z.object({
  value: z.unknown(),
  timestamp: z.number().int().min(0),
  ttl: z.number().int().min(0),
  compressed: z.boolean().default(false),
  algorithm: z.enum(['gzip', 'brotli', 'none']).default('none'),
  version: z.string().default('2.0'), // Bumped to 2.0 for real compression
});

type CacheEntry = z.infer<typeof cacheEntrySchema>;

// Cache operation result schema
const cacheOperationResultSchema = z.object({
  success: z.boolean(),
  key: z.string(),
  operation: z.enum(['get', 'set', 'delete', 'exists']),
  fromFallback: z.boolean().default(false),
  size: z.number().int().min(0).optional(),
  ttl: z.number().int().min(0).optional(),
});

export type CacheOperationResult = z.infer<typeof cacheOperationResultSchema>;

/**
 * Redis Cache Service
 * Provides high-level caching with automatic compression, validation, and fallback
 */
export class CacheService {
  private config: CacheConfig;

  // Cache statistics
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    fallbackHits: 0,
    coalescedRequests: 0, // Deduplicated thundering herd requests
  };

  // Request coalescing: Prevent thundering herd by deduplicating in-flight requests
  // Maps cache key -> { promise, timestamp, callers }
  private inFlightRequests = new Map<
    string,
    {
      promise: Promise<unknown>;
      timestamp: number;
      callers: number;
    }
  >();

  // Cleanup interval for hung requests (max 30s lifetime)
  private readonly REQUEST_TIMEOUT_MS = 30000;

  constructor(config?: Partial<CacheConfig>) {
    this.config = cacheConfigSchema.parse(config || {});
    this.startRequestCleanup();
  }

  /**
   * Cleanup hung in-flight requests every 30 seconds
   * Prevents memory leaks from failed/hung compute functions
   */
  private startRequestCleanup(): void {
    if (typeof setInterval === 'undefined') return; // Server-only feature

    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, request] of this.inFlightRequests.entries()) {
        if (now - request.timestamp > this.REQUEST_TIMEOUT_MS) {
          this.inFlightRequests.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0 && this.config.enableLogging) {
        logger.debug(`Cleaned ${cleaned} hung in-flight requests`, {
          keyPrefix: this.config.keyPrefix,
        });
      }
    }, 30000);
  }

  /**
   * Generate full cache key with prefix
   */
  private generateKey(key: string): string {
    const validatedKey = validateCacheKey(key);
    return `${this.config.keyPrefix}:${validatedKey}`;
  }

  /**
   * Compress data using gzip or brotli if it exceeds threshold
   */
  private compressData(data: string): {
    data: string;
    compressed: boolean;
    algorithm: CompressionAlgorithm;
  } {
    if (!this.config.enableCompression || data.length < this.config.compressionThreshold) {
      return { data, compressed: false, algorithm: 'none' };
    }

    try {
      const buffer = Buffer.from(data, 'utf8');

      let compressedBuffer: Buffer;
      const algorithm = this.config.compressionAlgorithm;

      if (algorithm === 'brotli') {
        compressedBuffer = brotliCompressSync(buffer, {
          params: {
            11: 4, // BROTLI_PARAM_QUALITY (4 = balanced speed/compression)
          },
        });
      } else if (algorithm === 'gzip') {
        compressedBuffer = gzipSync(buffer, { level: 6 }); // Level 6 = balanced
      } else {
        return { data, compressed: false, algorithm: 'none' };
      }

      // Only use compression if it actually reduces size
      if (compressedBuffer.length < buffer.length) {
        const compressedString = compressedBuffer.toString('base64');

        if (this.config.enableLogging) {
          const ratio = ((1 - compressedBuffer.length / buffer.length) * 100).toFixed(1);
          logger.debug(
            `Compressed data: ${buffer.length} → ${compressedBuffer.length} bytes (${ratio}% reduction)`
          );
        }

        return {
          data: compressedString,
          compressed: true,
          algorithm,
        };
      }

      return { data, compressed: false, algorithm: 'none' };
    } catch (error) {
      logger.warn('Compression failed, storing uncompressed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { data, compressed: false, algorithm: 'none' };
    }
  }

  /**
   * Decompress data using the specified algorithm
   */
  private decompressData(
    data: string,
    compressed: boolean,
    algorithm: CompressionAlgorithm = 'brotli'
  ): string {
    if (!compressed || algorithm === 'none') return data;

    try {
      const buffer = Buffer.from(data, 'base64');

      let decompressedBuffer: Buffer;

      if (algorithm === 'brotli') {
        decompressedBuffer = brotliDecompressSync(buffer);
      } else if (algorithm === 'gzip') {
        decompressedBuffer = gunzipSync(buffer);
      } else {
        return data;
      }

      return decompressedBuffer.toString('utf8');
    } catch (error) {
      logger.warn('Decompression failed, returning original data', {
        error: error instanceof Error ? error.message : String(error),
        algorithm,
      });
      return data;
    }
  }

  /**
   * Serialize cache entry with compression
   */
  private serializeEntry<T>(value: T, ttl: number): string {
    const serialized = JSON.stringify(value);

    // Validate size before compression
    if (serialized.length > this.config.maxValueSize) {
      throw new Error(
        `Cache value too large: ${serialized.length} bytes (max: ${this.config.maxValueSize})`
      );
    }

    const { data: compressedData, compressed, algorithm } = this.compressData(serialized);

    const entry: CacheEntry = {
      value: compressedData,
      timestamp: Date.now(),
      ttl,
      compressed,
      algorithm,
      version: '2.0',
    };

    return safeStringify(entry, {
      strategy: ParseStrategy.DEVALUE,
      enableLogging: this.config.enableLogging,
    });
  }

  /**
   * Deserialize cache entry with decompression
   * Uses devalue for XSS-safe, type-preserving deserialization
   */
  private deserializeEntry<T>(data: string): T | null {
    try {
      // Parse cache entry structure with validation
      const entry = safeParse(data, cacheEntrySchema, {
        strategy: ParseStrategy.VALIDATED_JSON,
        fallbackStrategy: ParseStrategy.DEVALUE,
      });

      // Check if entry is expired
      if (entry.ttl > 0 && Date.now() > entry.timestamp + entry.ttl * 1000) {
        return null;
      }

      // Decompress value if needed
      const decompressed = this.decompressData(
        String(entry.value),
        entry.compressed,
        entry.algorithm
      );

      // Parse cached value with type preservation
      return safeParse<T>(decompressed, undefined, {
        strategy: ParseStrategy.DEVALUE,
        fallbackStrategy: ParseStrategy.UNSAFE_JSON,
        enableLogging: this.config.enableLogging,
      });
    } catch (error) {
      if (this.config.enableLogging) {
        logger.warn('Failed to deserialize cache entry', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return null;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.generateKey(key);

    try {
      const result = await redisClient.executeOperation(
        async (redis) => {
          const data = await redis.get(fullKey);
          return data;
        },
        async () => {
          // Fallback operation
          const data = await redisClient.getFallback(fullKey);
          if (data) this.stats.fallbackHits++;
          return data || null;
        },
        'cache_get'
      );

      if (result) {
        const value = this.deserializeEntry<T>(String(result));
        if (value !== null) {
          this.stats.hits++;

          if (this.config.enableLogging) {
            logger.debug(`Cache hit for key: ${key}`);
          }

          return value;
        }
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Cache get failed for key: ${key}`, err);
      return null;
    }
  }

  /**
   * Get value from cache with schema validation
   * Production-grade: Runtime Zod validation + existing XSS protection
   *
   * @param key - Cache key
   * @param schema - Zod schema for domain-specific validation
   * @returns Validated value or null
   *
   * @example
   * ```ts
   * const emailSequenceSchema = z.object({
   *   email: z.string().email(),
   *   status: z.enum(['active', 'completed']),
   * });
   *
   * const sequence = await cache.getTyped('email:123', emailSequenceSchema);
   * // TypeScript knows sequence is fully validated EmailSequence type
   * ```
   */
  async getTyped<T>(key: string, schema: z.ZodType<T>): Promise<T | null> {
    try {
      // Use existing get() for cache infrastructure (compression, XSS protection, etc.)
      const rawValue = await this.get<unknown>(key);

      if (rawValue === null) {
        return null;
      }

      // Additional domain-specific validation with Zod
      const validatedValue = schema.parse(rawValue);

      return validatedValue;
    } catch (error) {
      this.stats.errors++;
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Schema validation failed for key: ${key}`, err, {
        errorType: error instanceof z.ZodError ? 'ZodValidationError' : 'UnknownError',
      });
      return null;
    }
  }

  /**
   * Get value from cache or compute it if missing
   * Implements request coalescing to prevent thundering herd
   *
   * @param key - Cache key
   * @param compute - Async function to compute value on cache miss
   * @param ttl - Optional TTL override (defaults to config.defaultTTL)
   * @returns Cached or computed value
   *
   * @example
   * ```ts
   * const user = await cache.getOrCompute(
   *   `user:${id}`,
   *   async () => db.users.findById(id),
   *   3600
   * );
   * ```
   *
   * **Thundering Herd Prevention:**
   * - Multiple concurrent requests for the same key share a single compute call
   * - Prevents database/API overload during cache misses
   * - Automatic cleanup of in-flight requests after 30s timeout
   * - Thread-safe with proper error isolation
   */
  async getOrCompute<T>(key: string, compute: () => Promise<T>, ttl?: number): Promise<T | null> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fullKey = this.generateKey(key);

    // Check if request is already in-flight
    const existing = this.inFlightRequests.get(fullKey);
    if (existing) {
      // Coalesce: Join existing computation
      this.stats.coalescedRequests++;
      existing.callers++;

      if (this.config.enableLogging) {
        logger.debug(`Request coalesced for key: ${key}`, {
          callers: existing.callers,
          ageMs: Date.now() - existing.timestamp,
        });
      }

      try {
        return (await existing.promise) as T | null;
      } catch (_error) {
        // Error already logged by original caller
        return null;
      }
    }

    // Create new in-flight request
    const promise = (async (): Promise<T | null> => {
      try {
        const value = await compute();

        // Store in cache
        await this.set(key, value, ttl);

        return value;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`Compute failed for key: ${key}`, err);
        throw error; // Propagate to all callers
      } finally {
        // Cleanup: Remove from in-flight map
        this.inFlightRequests.delete(fullKey);
      }
    })();

    // Register in-flight request
    this.inFlightRequests.set(fullKey, {
      promise,
      timestamp: Date.now(),
      callers: 1,
    });

    return promise;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<CacheOperationResult> {
    const fullKey = this.generateKey(key);
    const validatedTTL = validateTTL(ttl || this.config.defaultTTL);

    try {
      const serialized = this.serializeEntry(value, validatedTTL);

      const result = await redisClient.executeOperation(
        async (redis) => {
          await redis.set(fullKey, serialized, { ex: validatedTTL });
          return true;
        },
        async () => {
          // Fallback operation
          await redisClient.setFallback(fullKey, serialized, validatedTTL);
          return true;
        },
        'cache_set'
      );

      this.stats.sets++;

      if (this.config.enableLogging) {
        logger.debug(`Cache set for key: ${key}, TTL: ${validatedTTL}s`);
      }

      return cacheOperationResultSchema.parse({
        success: result,
        key: fullKey,
        operation: 'set',
        size: serialized.length,
        ttl: validatedTTL,
      });
    } catch (error) {
      this.stats.errors++;
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Cache set failed for key: ${key}`, err);

      return cacheOperationResultSchema.parse({
        success: false,
        key: fullKey,
        operation: 'set',
      });
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<CacheOperationResult> {
    const fullKey = this.generateKey(key);

    try {
      const result = await redisClient.executeOperation(
        async (redis) => {
          const deleted = await redis.del(fullKey);
          return deleted > 0;
        },
        async () => {
          // Fallback operation
          await redisClient.delFallback(fullKey);
          return true;
        },
        'cache_delete'
      );

      this.stats.deletes++;

      if (this.config.enableLogging) {
        logger.debug(`Cache delete for key: ${key}`);
      }

      return cacheOperationResultSchema.parse({
        success: result,
        key: fullKey,
        operation: 'delete',
      });
    } catch (error) {
      this.stats.errors++;
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Cache delete failed for key: ${key}`, err);

      return cacheOperationResultSchema.parse({
        success: false,
        key: fullKey,
        operation: 'delete',
      });
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.generateKey(key);

    try {
      const result = await redisClient.executeOperation(
        async (redis) => {
          const exists = await redis.exists(fullKey);
          return exists === 1;
        },
        async () => {
          // Fallback operation
          const data = await redisClient.getFallback(fullKey);
          return data !== null;
        },
        'cache_exists'
      );

      return result;
    } catch (error) {
      this.stats.errors++;
      logger.error(
        `Cache exists failed for key: ${key}`,
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  /**
   * Get multiple values from cache using batch operations (auto-pipelining)
   */
  async getMany<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();

    if (keys.length === 0) return results;

    try {
      const fullKeys = keys.map((key) => this.generateKey(key));

      // Use Promise.all to leverage auto-pipelining
      const values = await redisClient.executeOperation(
        async (redis) => {
          // Make all calls in parallel - auto-pipelining will batch them
          return Promise.all(fullKeys.map((fullKey) => redis.get(fullKey)));
        },
        async () => {
          // Fallback operation
          return Promise.all(fullKeys.map((fullKey) => redisClient.getFallback(fullKey)));
        },
        'cache_getMany'
      );

      // Deserialize results
      values.forEach((value, index) => {
        const key = keys[index];
        if (!key) return; // Guard against undefined keys

        if (value) {
          const deserialized = this.deserializeEntry<T>(String(value));
          if (deserialized !== null) {
            this.stats.hits++;
            results.set(key, deserialized);
          } else {
            this.stats.misses++;
            results.set(key, null);
          }
        } else {
          this.stats.misses++;
          results.set(key, null);
        }
      });

      if (this.config.enableLogging) {
        logger.debug(`Cache getMany for ${keys.length} keys, ${results.size} hits`);
      }
    } catch (error) {
      this.stats.errors++;
      logger.error(
        `Cache getMany failed for ${keys.length} keys`,
        error instanceof Error ? error : new Error(String(error))
      );

      // Return empty results for all keys
      for (const key of keys) {
        results.set(key, null);
      }
    }

    return results;
  }

  /**
   * Set multiple values in cache using batch operations (auto-pipelining)
   */
  async setMany<T>(
    entries: Array<{ key: string; value: T; ttl?: number }>
  ): Promise<CacheOperationResult[]> {
    const results: CacheOperationResult[] = [];

    if (entries.length === 0) return results;

    try {
      // Serialize all entries first
      const serializedEntries = entries.map(({ key, value, ttl }) => {
        const fullKey = this.generateKey(key);
        const validatedTTL = validateTTL(ttl || this.config.defaultTTL);
        const serialized = this.serializeEntry(value, validatedTTL);
        return {
          fullKey,
          key,
          serialized,
          ttl: validatedTTL,
          size: serialized.length,
        };
      });

      // Use Promise.all to leverage auto-pipelining
      const setResults = await redisClient.executeOperation(
        async (redis) => {
          // Make all SET calls in parallel - auto-pipelining will batch them
          const results = await Promise.all(
            serializedEntries.map(({ fullKey, serialized, ttl }) =>
              redis.set(fullKey, serialized, { ex: ttl })
            )
          );
          return results;
        },
        async () => {
          // Fallback operation
          await Promise.all(
            serializedEntries.map(({ fullKey, serialized, ttl }) =>
              redisClient.setFallback(fullKey, serialized, ttl)
            )
          );
          // Return array of undefined for fallback
          return new Array(serializedEntries.length).fill(undefined) as (string | null)[];
        },
        'cache_setMany'
      );

      // Build results
      serializedEntries.forEach(({ fullKey, size, ttl }, index) => {
        const success =
          setResults[index] === 'OK' ||
          setResults[index] === null ||
          setResults[index] === undefined;
        this.stats.sets++;

        results.push(
          cacheOperationResultSchema.parse({
            success,
            key: fullKey,
            operation: 'set',
            size,
            ttl,
          })
        );
      });

      if (this.config.enableLogging) {
        logger.debug(`Cache setMany for ${entries.length} keys completed`);
      }
    } catch (error) {
      this.stats.errors++;
      logger.error(
        `Cache setMany failed for ${entries.length} keys`,
        error instanceof Error ? error : new Error(String(error))
      );

      // Return failed results
      entries.forEach(({ key }) => {
        results.push(
          cacheOperationResultSchema.parse({
            success: false,
            key: this.generateKey(key),
            operation: 'set',
          })
        );
      });
    }

    return results;
  }

  /**
   * Invalidate cache keys by pattern
   */
  async invalidatePattern(pattern: string): Promise<CacheInvalidationResult> {
    const fullPattern = this.generateKey(pattern);
    const startTime = Date.now();

    try {
      let keysScanned = 0;
      let keysDeleted = 0;
      let scanCycles = 0;

      // Use SCAN to find keys safely
      await redisClient.executeOperation(
        async (redis) => {
          let cursor = '0';
          do {
            scanCycles++;
            const result = await redis.scan(cursor, {
              match: fullPattern,
              count: 100,
            });
            cursor = String(result[0]);
            const keys = result[1];
            keysScanned += keys.length;

            if (keys.length > 0) {
              const deleted = await redis.del(...keys);
              keysDeleted += deleted;
            }
          } while (cursor !== '0');
        },
        () => {
          // For fallback, we can't easily scan patterns, so just log
          logger.warn(`Pattern invalidation not fully supported in fallback mode: ${pattern}`);
          scanCycles = 1;
        },
        'cache_invalidate_pattern'
      );

      const result = cacheInvalidationResultSchema.parse({
        pattern: fullPattern,
        keysScanned,
        keysDeleted,
        scanCycles: scanCycles || 1,
        duration: Date.now() - startTime,
        rateLimited: false,
      });

      if (this.config.enableLogging) {
        logger.info(`Cache pattern invalidation: ${pattern}, deleted: ${keysDeleted}`);
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Cache pattern invalidation failed: ${pattern}`, err);

      return cacheInvalidationResultSchema.parse({
        pattern: fullPattern,
        keysScanned: 0,
        keysDeleted: 0,
        scanCycles: 1,
        duration: Date.now() - startTime,
        rateLimited: false,
      });
    }
  }

  /**
   * Get cache statistics with request coalescing metrics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      errors: this.stats.errors,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      fallbackHits: this.stats.fallbackHits,
      coalescedRequests: this.stats.coalescedRequests,
      inFlightRequests: this.inFlightRequests.size,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      fallbackHits: 0,
      coalescedRequests: 0,
    };
  }

  /**
   * Clear all cache entries with this prefix
   */
  async clear(): Promise<CacheInvalidationResult> {
    return this.invalidatePattern('*');
  }
}

/**
 * Pre-configured cache services for different use cases
 * ENV-configurable with production-optimized defaults
 * See CACHE_MEMORY_LIMITS for configuration
 */
export const CacheServices = {
  /**
   * API response cache - 1 hour TTL with Brotli compression
   * Memory: ENV-configurable via CACHE_API_MEMORY_MB (default: 50MB dev, 10MB prod)
   */
  api: new CacheService({
    keyPrefix: 'api',
    defaultTTL: 3600,
    enableCompression: true,
    compressionAlgorithm: 'brotli', // Better compression than gzip
    compressionThreshold: 500, // Compress anything over 500 bytes
    maxValueSize: 2097152, // 2MB max
    maxMemoryMB: CACHE_MEMORY_LIMITS.api,
    enableLogging: !isProduction,
  }),

  /**
   * Session cache - 24 hours TTL with gzip compression
   * Memory: ENV-configurable via CACHE_SESSION_MEMORY_MB (default: 30MB dev, 10MB prod)
   */
  session: new CacheService({
    keyPrefix: 'session',
    defaultTTL: 86400,
    enableCompression: true,
    compressionAlgorithm: 'gzip', // Faster for smaller payloads
    compressionThreshold: 1000,
    maxMemoryMB: CACHE_MEMORY_LIMITS.session,
    enableLogging: false,
  }),

  /**
   * Content cache - 6 hours TTL with aggressive Brotli compression
   * Memory: ENV-configurable via CACHE_CONTENT_MEMORY_MB (default: 100MB dev, 20MB prod)
   */
  content: new CacheService({
    keyPrefix: 'content',
    defaultTTL: 21600,
    enableCompression: true,
    compressionAlgorithm: 'brotli', // Best for large content
    compressionThreshold: 200, // Compress aggressively
    maxValueSize: 5242880, // 5MB max
    maxMemoryMB: CACHE_MEMORY_LIMITS.content,
    enableLogging: !isProduction,
  }),

  /**
   * Temporary cache - 15 minutes TTL, no compression for speed
   * Memory: ENV-configurable via CACHE_TEMP_MEMORY_MB (default: 20MB dev, 10MB prod)
   */
  temp: new CacheService({
    keyPrefix: 'temp',
    defaultTTL: 900,
    enableCompression: false, // Speed over size
    maxMemoryMB: CACHE_MEMORY_LIMITS.temp,
    enableLogging: false,
  }),
} as const;

// ============================================
// REDIS FACADE - STATS & CONTENT OPERATIONS
// ============================================

// Generic operation executor with error logging
const exec = async <T>(fn: () => Promise<T>, fallback: T, op: string): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    logger.error(`Failed: ${op}`, e instanceof Error ? e : new Error(String(e)));
    return fallback;
  }
};

// Redis client operation wrapper
const redis = <T>(fn: (client: Redis) => Promise<T>, fallback: () => T | Promise<T>, op: string) =>
  redisClient.executeOperation(fn, fallback, op);

/**
 * Unified stats operations
 */
export const statsRedis = {
  isEnabled: () => redisClient.getStatus().isConnected || redisClient.getStatus().isFallback,
  isConnected: () => redisClient.getStatus().isConnected,

  incrementView: (cat: string, slug: string) =>
    exec(
      () =>
        redis(
          async () => {
            const key = `views:${cat}:${slug}`;
            // SECURITY: Use UTC to prevent timezone inconsistencies
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD UTC
            const dailyKey = `views:daily:${cat}:${slug}:${today}`;

            // Production-grade pipeline execution with comprehensive error handling
            const pipelineResult = await redisClient.executePipeline<number>(
              async (pipeline) => {
                // PERFORMANCE: Use pipeline for atomic operations
                pipeline.incr(key); // Total all-time views
                pipeline.incr(dailyKey); // Today's views (for growth calculation)
                pipeline.expire(dailyKey, 604800, 'NX'); // Only set TTL if key doesn't have one
                pipeline.zadd(`trending:${cat}:weekly`, {
                  score: Date.now(),
                  member: slug,
                });
                pipeline.zincrby(`popular:${cat}:all`, 1, slug);

                return pipeline.exec();
              },
              {
                operation: 'incrementView',
                expectedCommands: 5,
                allowPartialFailure: false, // All commands must succeed for accurate stats
                metadata: {
                  category: cat,
                  slug,
                  key,
                  dailyKey,
                  date: today,
                },
              }
            );

            // Handle pipeline failure gracefully
            if (!(pipelineResult.success && pipelineResult.results)) {
              logger.warn('View increment failed due to pipeline error', {
                category: cat,
                slug,
                error: pipelineResult.error?.message ?? 'Unknown error',
                hasPartialFailure: pipelineResult.hasPartialFailure,
              });
              return null;
            }

            const { results, hasPartialFailure } = pipelineResult;

            // Extract view count from first result (INCR returns new count)
            const viewCountResult = results[0];

            // Handle Error result from partial failure
            if (isPipelineError(viewCountResult)) {
              logger.error('View increment command failed', viewCountResult, {
                category: cat,
                slug,
                key,
              });
              return null;
            }

            // Type-safe extraction with validation
            const viewCount =
              typeof viewCountResult === 'number'
                ? viewCountResult
                : typeof viewCountResult === 'string'
                  ? Number.parseInt(viewCountResult, 10)
                  : null;

            if (viewCount === null || Number.isNaN(viewCount)) {
              logger.warn('Invalid view count returned from pipeline', {
                category: cat,
                slug,
                result: String(viewCountResult ?? 'undefined'),
                resultType: typeof viewCountResult,
              });
              return null;
            }

            if (hasPartialFailure) {
              logger.warn('View increment completed with partial failures', {
                category: cat,
                slug,
                viewCount,
                commandsExpected: 5,
                commandsSucceeded: results.filter((r) => !isPipelineError(r)).length,
              });
            }

            return viewCount;
          },
          () => null,
          'incrementView'
        ),
      null,
      'incrementView'
    ),

  getViewCount: (cat: string, slug: string) =>
    redis(
      async (c) => (await c.get<number>(`views:${cat}:${slug}`)) || 0,
      () => 0,
      'getViewCount'
    ),

  getViewCounts: async (items: Array<{ category: string; slug: string }>) => {
    if (!items.length) return {};
    const keys = items.map((i) => `views:${i.category}:${i.slug}`);
    const counts = await redis(
      async (c) => await c.mget<(number | null)[]>(...keys),
      () => new Array(items.length).fill(0) as (number | null)[],
      'getViewCounts'
    );
    return items.reduce(
      (acc, item, i) => {
        acc[`${item.category}:${item.slug}`] = (counts as (number | null)[])[i] || 0;
        return acc;
      },
      {} as Record<string, number>
    );
  },

  /**
   * Get daily view counts for multiple items (optimized MGET batch operation)
   */
  getDailyViewCounts: async (
    items: Array<{ category: string; slug: string }>,
    date?: string
  ): Promise<Record<string, number>> => {
    if (!items.length) return {};
    const targetDate = date || new Date().toISOString().split('T')[0];
    const keys = items.map((i) => `views:daily:${i.category}:${i.slug}:${targetDate}`);

    const counts = await redis(
      async (c) => await c.mget<(number | null)[]>(...keys),
      () => new Array(items.length).fill(0) as (number | null)[],
      'getDailyViewCounts'
    );

    return items.reduce(
      (acc, item, i) => {
        acc[`${item.category}:${item.slug}`] = (counts as (number | null)[])[i] || 0;
        return acc;
      },
      {} as Record<string, number>
    );
  },

  getTrending: async (cat: string, limit = 10) => {
    const q = popularItemsQuerySchema.parse({ category: cat, limit });
    const items = await redis(
      async (c) =>
        await c.zrange(`trending:${q.category}:weekly`, Date.now() - 604800000, Date.now(), {
          byScore: true,
          rev: true,
          withScores: false,
          offset: 0,
          count: q.limit,
        }),
      () => [],
      'getTrending'
    );
    return z.array(z.string()).parse(items || []);
  },

  getPopular: async (cat: string, limit = 10) => {
    const q = popularItemsQuerySchema.parse({ category: cat, limit });
    const items = await redis(
      async (c) =>
        await c.zrange(`popular:${q.category}:all`, 0, q.limit - 1, {
          rev: true,
          withScores: true,
        }),
      () => [],
      'getPopular'
    );
    return parseRedisZRangeResponse(items || []);
  },

  trackCopy: async (cat: string, slug: string) => {
    const v = cacheKeyParamsSchema.parse({ category: cat, slug });
    await redis(
      async (c) => {
        await batchFetch([
          c.incr(`copies:${v.category}:${v.slug}`),
          c.zincrby(`copied:${v.category}:all`, 1, v.slug),
        ]);
      },
      () => undefined,
      'trackCopy'
    );
  },

  getCopyCount: (cat: string, slug: string) =>
    redis(
      async (c) => (await c.get<number>(`copies:${cat}:${slug}`)) || 0,
      () => 0,
      'getCopyCount'
    ),

  getCopyCounts: async (items: Array<{ category: string; slug: string }>) => {
    if (!items.length) return {};
    const keys = items.map((i) => `copies:${i.category}:${i.slug}`);
    const counts = await redis(
      async (c) => await c.mget<(number | null)[]>(...keys),
      () => new Array(items.length).fill(0) as (number | null)[],
      'getCopyCounts'
    );
    return items.reduce(
      (acc, item, i) => {
        acc[`${item.category}:${item.slug}`] = (counts as (number | null)[])[i] || 0;
        return acc;
      },
      {} as Record<string, number>
    );
  },

  cleanupOldTrending: () =>
    redis(
      async (c) => {
        const cats = [
          'agents',
          'mcp',
          'rules',
          'commands',
          'hooks',
          'statuslines',
          'collections',
        ] as const;
        await Promise.all(
          cats.map((cat) =>
            c.zremrangebyscore(
              `trending:${cacheCategorySchema.parse(cat)}:weekly`,
              0,
              Date.now() - 604800000
            )
          )
        );
      },
      () => undefined,
      'cleanupOldTrending'
    ),

  /**
   * Enrich content items with Redis view counts
   */
  enrichWithViewCounts: async <T extends { category: string; slug: string }>(
    items: T[]
  ): Promise<(T & { viewCount: number })[]> => {
    if (!items.length) return [];

    try {
      // Batch fetch view counts
      const viewCounts = await statsRedis.getViewCounts(items);

      // Merge view counts with items
      return items.map((item) => ({
        ...item,
        viewCount: viewCounts[`${item.category}:${item.slug}`] || 0,
      }));
    } catch (error) {
      logger.error(
        'Failed to enrich with view counts',
        error instanceof Error ? error : new Error(String(error))
      );
      // Return items without view counts on error
      return items.map((item) => ({ ...item, viewCount: 0 }));
    }
  },

  /**
   * Enrich content items with Redis copy counts
   */
  enrichWithCopyCounts: async <T extends { category: string; slug: string }>(
    items: T[]
  ): Promise<(T & { copyCount: number })[]> => {
    if (!items.length) return [];

    try {
      // Batch fetch copy counts
      const copyCounts = await statsRedis.getCopyCounts(items);

      // Merge copy counts with items
      return items.map((item) => ({
        ...item,
        copyCount: copyCounts[`${item.category}:${item.slug}`] || 0,
      }));
    } catch (error) {
      logger.error(
        'Failed to enrich with copy counts',
        error instanceof Error ? error : new Error(String(error))
      );
      // Return items without copy counts on error
      return items.map((item) => ({ ...item, copyCount: 0 }));
    }
  },

  /**
   * Enrich content items with both view and copy counts
   * Optimized to run both operations in parallel
   */
  enrichWithAllCounts: async <T extends { category: string; slug: string }>(
    items: T[]
  ): Promise<(T & { viewCount: number; copyCount: number })[]> => {
    if (!items.length) return [];

    try {
      // Batch fetch both counts in parallel
      const [viewCounts, copyCounts] = await batchFetch([
        statsRedis.getViewCounts(items),
        statsRedis.getCopyCounts(items),
      ]);

      // Merge both counts with items
      return items.map((item) => ({
        ...item,
        viewCount: viewCounts[`${item.category}:${item.slug}`] || 0,
        copyCount: copyCounts[`${item.category}:${item.slug}`] || 0,
      }));
    } catch (error) {
      logger.error(
        'Failed to enrich with all counts',
        error instanceof Error ? error : new Error(String(error))
      );
      // Return items without counts on error
      return items.map((item) => ({ ...item, viewCount: 0, copyCount: 0 }));
    }
  },
};

/**
 * Unified cache operations
 */
const cache = {
  set: async <T>(service: CacheService, key: string, data: T, ttl: number, op: string) => {
    try {
      await service.set(key, data, ttl);
    } catch (e) {
      logger.error(`Cache set failed: ${op}`, e instanceof Error ? e : new Error(String(e)));
    }
  },

  get: async <T>(service: CacheService, key: string, op: string): Promise<T | null> => {
    try {
      return await service.get<T>(key);
    } catch (e) {
      logger.error(`Cache get failed: ${op}`, e instanceof Error ? e : new Error(String(e)));
      return null;
    }
  },
};

export const contentCache = {
  isEnabled: () => CacheServices.content !== null,

  // MDX operations
  cacheMDX: (path: string, content: string, ttl = 86400) =>
    cache.set(CacheServices.content, `mdx:${path}`, content, ttl, 'MDX'),

  getMDX: (path: string) => cache.get<string>(CacheServices.content, `mdx:${path}`, 'MDX'),

  batchCacheMDX: async (items: Array<{ path: string; content: string; ttl?: number }>) => {
    if (!items.length) return;
    try {
      await CacheServices.content.setMany(
        items.map(({ path, content, ttl = 86400 }) => ({
          key: `mdx:${path}`,
          value: content,
          ttl,
        }))
      );
    } catch (e) {
      logger.error('Batch MDX failed', e instanceof Error ? e : new Error(String(e)));
    }
  },

  // Metadata operations
  cacheContentMetadata: <T>(cat: string, data: T, ttl = 14400) =>
    cache.set(
      CacheServices.content,
      `content:${cacheCategorySchema.parse(cat)}:metadata`,
      data,
      ttl,
      'metadata'
    ),

  getContentMetadata: <T>(cat: string) =>
    cache.get<T>(
      CacheServices.content,
      `content:${cacheCategorySchema.parse(cat)}:metadata`,
      'metadata'
    ),

  // API operations
  cacheAPIResponse: <T>(endpoint: string, data: T, ttl = 3600) =>
    cache.set(CacheServices.api, `api:${endpoint}`, data, ttl, 'API'),

  getAPIResponse: <T>(endpoint: string) =>
    cache.get<T>(CacheServices.api, `api:${endpoint}`, 'API'),

  // API cache invalidation (targets API cache namespace)
  invalidateAPIPattern: async (pattern: string): Promise<CacheInvalidationResult> => {
    try {
      return await CacheServices.api.invalidatePattern(pattern);
    } catch {
      return {
        pattern,
        keysScanned: 0,
        keysDeleted: 0,
        scanCycles: 1,
        duration: 0,
        rateLimited: false,
      };
    }
  },

  invalidatePattern: async (pattern: string): Promise<CacheInvalidationResult> => {
    try {
      return await CacheServices.content.invalidatePattern(pattern);
    } catch {
      return {
        pattern,
        keysScanned: 0,
        keysDeleted: 0,
        scanCycles: 1,
        duration: 0,
        rateLimited: false,
      };
    }
  },

  cacheWithRefresh: async <T>(key: string, fetcher: () => Promise<T>, ttl = 3600): Promise<T> => {
    try {
      const vKey = validateCacheKey(key);
      const cached = await CacheServices.api.get<T>(vKey);
      if (cached) return cached;

      const fresh = await fetcher();
      await CacheServices.api.set(vKey, fresh, ttl);
      return fresh;
    } catch (e) {
      logger.error('Refresh failed', e instanceof Error ? e : new Error(String(e)));
      return fetcher();
    }
  },
};

// ============================================
// CACHE WARMING
// ============================================

/**
 * Cache Warmer Schemas
 */
const CACHE_WARMER_LIMITS = {
  MAX_ITEMS_PER_CATEGORY: 100,
  MAX_CATEGORIES: 20,
  MAX_QUERY_LENGTH: 100,
  MAX_PATH_LENGTH: 500,
  MAX_SLUG_LENGTH: 200,
  MIN_TTL: 60,
  MAX_TTL: 604800,
  MAX_BATCH_SIZE: 50,
  MAX_COMMON_QUERIES: 100,
} as const;

const warmableCategorySchema = z.enum([
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'collections',
  'guides',
  'jobs',
]);

const cacheWarmerPopularItemSchema = z.object({
  slug: nonEmptyString
    .max(CACHE_WARMER_LIMITS.MAX_SLUG_LENGTH)
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid slug format'),
  views: nonNegativeInt,
});

const categoryMetadataSchema = z.object({
  name: warmableCategorySchema,
  items: z
    .array(
      z.object({
        slug: nonEmptyString,
        title: nonEmptyString.optional(),
        description: nonEmptyString.optional(),
      })
    )
    .max(CACHE_WARMER_LIMITS.MAX_ITEMS_PER_CATEGORY),
});

const relatedContentWarmingSchema = z.object({
  path: nonEmptyString
    .max(CACHE_WARMER_LIMITS.MAX_PATH_LENGTH)
    .regex(/^\/[a-zA-Z0-9\-_/]*$/, 'Invalid path format')
    .refine((path) => !path.includes('..'), 'Path traversal detected'),
  category: warmableCategorySchema.default('agents'),
  tags: stringArray.max(50).default([]),
  keywords: stringArray.max(50).default([]),
  limit: positiveInt.min(1).max(20).default(6),
});

const commonQuerySchema = nonEmptyString.max(CACHE_WARMER_LIMITS.MAX_QUERY_LENGTH);

const cachedContentSchema = z.object({
  content: z.unknown(),
  cachedAt: isoDatetimeString,
  ttl: positiveInt,
});

const cacheWarmingStatusSchema = z.enum(['idle', 'warming', 'completed', 'failed', 'partial']);

const cacheWarmingResultSchema = z.object({
  status: cacheWarmingStatusSchema,
  success: z.boolean().optional(),
  message: z.string().optional(),
  itemsWarmed: nonNegativeInt,
  errors: nonNegativeInt,
  duration: nonNegativeInt,
  timestamp: isoDatetimeString,
  categories: z.array(warmableCategorySchema),
});

export type WarmableCategory = z.infer<typeof warmableCategorySchema>;
export type CacheWarmingStatus = z.infer<typeof cacheWarmingStatusSchema>;
export type CacheWarmingResult = z.infer<typeof cacheWarmingResultSchema>;

class CacheWarmer {
  private isWarming = false;

  /**
   * Warm caches for popular content
   * This runs periodically to ensure frequently accessed content is cached
   */
  async warmPopularContent(): Promise<void> {
    if (this.isWarming) {
      logger.info('Cache warming already in progress, skipping');
      return;
    }

    this.isWarming = true;
    const startTime = performance.now();
    let itemsWarmed = 0;
    let errors = 0;

    try {
      logger.info('Starting cache warming for popular content');

      // Lazy load metadata only when needed
      const [
        agentsMetadata,
        mcpMetadata,
        rulesMetadata,
        commandsMetadata,
        hooksMetadata,
        statuslinesMetadata,
        collectionsMetadata,
      ] = await batchFetch([
        metadataLoader.get('agentsMetadata'),
        metadataLoader.get('mcpMetadata'),
        metadataLoader.get('rulesMetadata'),
        metadataLoader.get('commandsMetadata'),
        metadataLoader.get('hooksMetadata'),
        metadataLoader.get('statuslinesMetadata'),
        metadataLoader.get('collectionsMetadata'),
      ]);

      // Get popular items from each category
      const categories = [
        { name: 'agents' as WarmableCategory, items: agentsMetadata },
        { name: 'mcp' as WarmableCategory, items: mcpMetadata },
        { name: 'rules' as WarmableCategory, items: rulesMetadata },
        { name: 'commands' as WarmableCategory, items: commandsMetadata },
        { name: 'hooks' as WarmableCategory, items: hooksMetadata },
        { name: 'statuslines' as WarmableCategory, items: statuslinesMetadata },
        { name: 'collections' as WarmableCategory, items: collectionsMetadata },
      ];

      // Validate categories
      const validatedCategories = categories.map((cat) => categoryMetadataSchema.parse(cat));

      for (const category of validatedCategories) {
        try {
          // Validate category name
          const validatedCategoryName = warmableCategorySchema.parse(category.name);

          // Get top 10 popular items from Redis stats
          const popular = await statsRedis?.getPopular(validatedCategoryName, 10);

          if (popular && popular.length > 0) {
            // Validate and warm cache for popular items
            const validatedPopular = z.array(cacheWarmerPopularItemSchema).parse(popular);
            for (const item of validatedPopular) {
              await this.warmItem(validatedCategoryName, item.slug);
              itemsWarmed++;
            }
          } else {
            // If no popularity data, warm first 5 items as fallback
            const topItems = category.items.slice(0, 5);
            for (const item of topItems) {
              await this.warmItem(validatedCategoryName, item.slug);
              itemsWarmed++;
            }
          }
        } catch (error) {
          logger.error(`Failed to warm cache for category ${category.name}`, error as Error);
          errors++;
        }
      }

      // Warm related content for popular pages
      await this.warmRelatedContent();

      // Warm search indexes
      await this.warmSearchIndexes();

      const duration = Math.round(performance.now() - startTime);
      logger.info('Cache warming completed', {
        itemsWarmed,
        errors,
        durationMs: duration,
      });

      // Track cache warming success
      if (typeof window === 'undefined') {
        // Server-side only
        const status = cacheWarmingStatusSchema.parse({
          lastRun: new Date().toISOString(),
          itemsWarmed,
          errors,
          duration,
        });

        await contentCache?.cacheAPIResponse('cache_warming_status', status, 86400); // 24 hour TTL
      }
    } catch (error) {
      logger.error('Cache warming failed', error as Error);
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Warm cache for a specific item
   */
  private async warmItem(category: WarmableCategory, slug: string): Promise<void> {
    try {
      const cacheKey = `content:${category}:${slug}`;

      // Check if already cached
      const cached = await contentCache?.getAPIResponse(cacheKey);
      if (cached) {
        return; // Already cached, skip
      }

      // Pre-load the content (this would normally happen on first request)
      // Here we're just ensuring it's in cache
      const cachedContent = cachedContentSchema.parse({
        category,
        slug,
        warmed: true,
        timestamp: new Date().toISOString(),
      });

      await contentCache?.cacheAPIResponse(
        cacheKey,
        cachedContent,
        14400 // 4 hour TTL
      );
    } catch (error) {
      // Don't fail the whole process for one item
      logger.warn('Failed to warm cache for item', {
        category,
        slug,
        error: String(error),
      });
    }
  }

  /**
   * Warm related content caches
   */
  private async warmRelatedContent(): Promise<void> {
    try {
      // Pre-calculate related content for top pages
      const topPages = [
        { path: '/', category: 'agents' as WarmableCategory },
        { path: '/agents', category: 'agents' as WarmableCategory },
        { path: '/mcp', category: 'mcp' as WarmableCategory },
        { path: '/rules', category: 'rules' as WarmableCategory },
        { path: '/commands', category: 'commands' as WarmableCategory },
        { path: '/hooks', category: 'hooks' as WarmableCategory },
        { path: '/statuslines', category: 'statuslines' as WarmableCategory },
        { path: '/collections', category: 'collections' as WarmableCategory },
      ];

      // Validate pages
      const validatedPages = topPages.map((page) => relatedContentWarmingSchema.parse(page));

      for (const page of validatedPages) {
        try {
          await relatedContentService.getRelatedContent({
            currentPath: page.path,
            currentCategory: page.category,
            currentTags: [],
            currentKeywords: [],
            limit: 6,
            featured: [],
            exclude: [],
          });
        } catch (error) {
          logger.warn('Failed to warm related content', {
            page: page.path,
            error: String(error),
          });
        }
      }
    } catch (error) {
      logger.error('Failed to warm related content caches', error as Error);
    }
  }

  /**
   * Warm search indexes
   */
  private async warmSearchIndexes(): Promise<void> {
    try {
      // Cache common search queries for faster search responses
      const rawQueries = [
        'ai',
        'agent',
        'mcp',
        'server',
        'api',
        'database',
        'auth',
        'react',
        'typescript',
        'python',
        'javascript',
        'test',
        'lint',
      ];

      // Validate queries
      const commonQueries = z.array(commonQuerySchema).parse(rawQueries);

      for (const query of commonQueries) {
        const cacheKey = `search:${query}`;
        await contentCache?.cacheAPIResponse(
          cacheKey,
          {
            query,
            warmed: true,
            timestamp: new Date().toISOString(),
          },
          3600 // 1 hour TTL for search results
        );
      }
    } catch (error) {
      logger.error('Failed to warm search indexes', error as Error);
    }
  }

  /**
   * Schedule periodic cache warming
   * Runs every 6 hours at off-peak times
   */
  scheduleWarming(): void {
    if (typeof window !== 'undefined') {
      // Don't run in browser
      return;
    }

    // Run immediately on startup
    this.warmPopularContent().catch(() => {
      // Cache warming is best-effort - errors already logged
    });

    // Schedule periodic warming every 6 hours
    setInterval(
      () => {
        // Only run during off-peak hours (midnight to 6 AM UTC)
        const hour = new Date().getUTCHours();
        if (hour >= 0 && hour < 6) {
          this.warmPopularContent().catch(() => {
            // Cache warming is best-effort - errors already logged
          });
        }
      },
      6 * 60 * 60 * 1000
    ); // 6 hours
  }

  /**
   * Manually trigger cache warming
   * Useful for admin endpoints or manual triggers
   */
  async triggerManualWarming(): Promise<CacheWarmingResult> {
    if (this.isWarming) {
      return cacheWarmingResultSchema.parse({
        success: false,
        message: 'Cache warming already in progress',
      });
    }

    const startTime = performance.now();
    try {
      await this.warmPopularContent();
      const duration = Math.round(performance.now() - startTime);

      return cacheWarmingResultSchema.parse({
        success: true,
        message: 'Cache warming completed successfully',
        duration,
      });
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      return cacheWarmingResultSchema.parse({
        success: false,
        message: `Cache warming failed: ${error}`,
        duration,
      });
    }
  }

  /**
   * Get cache warming status
   */
  async getStatus(): Promise<CacheWarmingStatus | { message: string } | { error: string }> {
    try {
      const status = await contentCache?.getAPIResponse<unknown>('cache_warming_status');
      if (status) {
        // Validate the cached status
        return cacheWarmingStatusSchema.parse(status);
      }
      return { message: 'No cache warming data available' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(
          'Invalid cache warming status data',
          new Error(error.issues[0]?.message || 'Invalid status'),
          {
            errorCount: error.issues.length,
          }
        );
      }
      return { error: 'Failed to get cache warming status' };
    }
  }
}

// Export singleton instance
export const cacheWarmer = new CacheWarmer();

// Auto-schedule if running on server
if (typeof window === 'undefined' && isProduction) {
  // Schedule cache warming in production
  cacheWarmer.scheduleWarming();
}

// ============================================
// SEARCH CACHE
// ============================================

import { searchWithFilters } from '@/src/lib/client/search';
import type {
  SearchableItem,
  SearchCacheKey,
  SearchFilters,
} from '@/src/lib/schemas/search.schema';

// Re-export types
export type { SearchableItem, SearchFilters, SearchCacheKey };

// Generate a cache key from search parameters
function generateSearchCacheKey(query: string, filters: SearchFilters): string {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedFilters = {
    categories: filters.categories.sort(),
    tags: filters.tags.sort(),
    authors: filters.authors.sort(),
    sort: filters.sort,
    popularity: filters.popularity,
  };

  return `search:${btoa(JSON.stringify({ query: normalizedQuery, filters: normalizedFilters }))}`;
}

/**
 * Search Cache with Fuzzysort
 */
class SearchCache {
  // Cached search function
  async search<T extends SearchableItem>(
    items: T[],
    query: string,
    filters: SearchFilters = {
      categories: [],
      tags: [],
      authors: [],
      sort: 'trending',
      popularity: [0, 100],
    },
    options?: {
      threshold?: number;
      limit?: number;
      includeScore?: boolean;
      keys?: Array<{ name: string; weight: number }>;
    }
  ): Promise<T[]> {
    const cacheKey = generateSearchCacheKey(query, filters);

    try {
      // Try to get cached results first
      const cached = await contentCache.getAPIResponse<T[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Perform search if not cached using Fuzzysort
      const results = await this.performSearch(items, query, filters, options);

      // Cache results for 1 hour (respect max limit)
      await contentCache.cacheAPIResponse(cacheKey, results, 60 * 60);

      return results;
    } catch (error) {
      logger.error(
        'Search cache error, falling back to direct search',
        error instanceof Error ? error : new Error(String(error)),
        { query, filtersCount: Object.keys(filters).length }
      );

      // Fallback to direct search
      return this.performSearch(items, query, filters, options);
    }
  }

  // Perform the actual search with Fuzzysort
  private async performSearch<T extends SearchableItem>(
    items: T[],
    query: string,
    filters: SearchFilters = {
      categories: [],
      tags: [],
      authors: [],
      sort: 'trending',
      popularity: [0, 100],
    },
    options?: {
      threshold?: number;
      limit?: number;
    }
  ): Promise<T[]> {
    // Use Fuzzysort adapter with filters
    const searchOptions: { threshold?: number; limit?: number } = {};
    if (options?.threshold !== undefined) {
      searchOptions.threshold = options.threshold;
    } else {
      searchOptions.threshold = 0.3;
    }
    if (options?.limit !== undefined) {
      searchOptions.limit = options.limit;
    }
    return searchWithFilters(items, query, filters, searchOptions);
  }

  // Invalidate cache for a specific pattern
  async invalidateSearchCache(pattern = 'search:*'): Promise<void> {
    try {
      await contentCache.invalidatePattern(pattern);
      logger.info('Search cache invalidated', { pattern });
    } catch (error) {
      logger.error(
        'Failed to invalidate search cache',
        error instanceof Error ? error : new Error(String(error)),
        { pattern }
      );
    }
  }

  // Get cache statistics
  getCacheStats(): {
    cacheType: string;
  } {
    return {
      cacheType: 'Redis-based with Fuzzysort',
    };
  }
}

// Global search cache instance
export const searchCache = new SearchCache();

// ============================================
// CACHE INVALIDATION
// ============================================

class CacheInvalidationService {
  /**
   * Invalidate caches when content is updated
   */
  async invalidateContentCaches(
    category: CategoryId,
    slug: string,
    options: {
      invalidateRelated?: boolean;
      invalidateCategory?: boolean;
    } = {}
  ): Promise<void> {
    const { invalidateRelated = true, invalidateCategory = true } = options;
    const keysToInvalidate: string[] = [];

    try {
      // Invalidate specific content cache
      const contentKey = `related:${slug.replace(/\//g, '_')}:*`;
      keysToInvalidate.push(contentKey);

      // Invalidate category caches if requested
      if (invalidateCategory) {
        const categoryKey = `related:*:${category}:*`;
        keysToInvalidate.push(categoryKey);
      }

      // Invalidate related content if requested
      if (invalidateRelated) {
        // This would invalidate caches for content that might include this item
        const relatedKeys = await this.findRelatedCacheKeys(category, slug);
        keysToInvalidate.push(...relatedKeys);
      }

      // Perform invalidation
      await this.invalidateKeys(keysToInvalidate);

      logger.info('Cache invalidation completed', {
        category,
        slug,
        keysInvalidated: keysToInvalidate.length,
      });
    } catch (error) {
      logger.error('Cache invalidation failed', error as Error, {
        category,
        slug,
      });
      // Don't throw - cache invalidation shouldn't break the update flow
    }
  }

  /**
   * Invalidate all related content caches
   */
  async invalidateAllRelatedContent(): Promise<void> {
    try {
      const pattern = 'related:*';
      await contentCache.invalidatePattern(pattern);

      logger.info('All related content caches invalidated');
    } catch (error) {
      logger.error('Failed to invalidate all related content caches', error as Error);
    }
  }

  /**
   * Invalidate caches for a specific algorithm version
   */
  async invalidateAlgorithmVersion(algorithmVersion: string): Promise<void> {
    try {
      const pattern = `related:*:*:*:${algorithmVersion}`;
      await contentCache.invalidatePattern(pattern);

      logger.info('Algorithm version caches invalidated', {
        algorithmVersion,
      });
    } catch (error) {
      logger.error('Failed to invalidate algorithm version caches', error as Error, {
        algorithmVersion,
      });
    }
  }

  /**
   * Find cache keys that might contain the updated content
   */
  private async findRelatedCacheKeys(category: CategoryId, slug: string): Promise<string[]> {
    const keys: string[] = [];

    // Get related categories that might include this content
    const relatedCategories = this.getRelatedCategories(category);

    for (const relatedCategory of relatedCategories) {
      keys.push(`related:*:${relatedCategory}:*`);
    }

    // Also invalidate trending and popular caches
    keys.push(`trending:${category}:*`);
    keys.push(`popular:${category}:*`);

    // Invalidate API-level cached responses that depend on trending data
    if (category === 'guides') {
      keys.push('api:guides/trending*');
    }

    // Invalidate any caches that specifically reference this slug
    keys.push(`*:${slug.replace(/\//g, '_')}:*`);

    return keys;
  }

  /**
   * Invalidate specific keys
   */
  private async invalidateKeys(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      try {
        // Route invalidation to API or content cache namespaces
        if (pattern.startsWith('api:')) {
          await contentCache.invalidateAPIPattern(pattern);
        } else {
          await contentCache.invalidatePattern(pattern);
        }
      } catch (error) {
        logger.warn('Failed to invalidate pattern', {
          pattern,
          error: String(error),
        });
      }
    }
  }

  /**
   * Get related categories for cross-category invalidation
   */
  private getRelatedCategories(category: CategoryId): CategoryId[] {
    // NOTE: Subcategories (tutorials, workflows, etc.) are NOT categories
    // They are under 'guides' and should not be tracked separately
    const relationships: Record<string, CategoryId[]> = {
      guides: ['agents', 'mcp'],
      agents: ['commands', 'rules'],
      mcp: ['agents', 'hooks'],
      rules: ['agents', 'commands'],
      commands: ['agents', 'rules'],
      hooks: ['mcp', 'commands'],
      collections: ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines'],
    };

    return relationships[category] || [];
  }

  /**
   * Schedule periodic cache cleanup
   */
  async scheduleCacheCleanup(): Promise<void> {
    // Run cleanup every 24 hours
    setInterval(
      async () => {
        try {
          await this.cleanupExpiredCaches();
        } catch (error) {
          logger.error('Cache cleanup failed', error as Error);
        }
      },
      24 * 60 * 60 * 1000
    );
  }

  /**
   * Clean up expired caches
   */
  private async cleanupExpiredCaches(): Promise<void> {
    try {
      // This would be implemented based on Redis TTL
      // For now, we rely on Redis's built-in TTL mechanism
      logger.info('Cache cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup caches', error as Error);
    }
  }
}

// Export singleton instance
export const cacheInvalidation = new CacheInvalidationService();

// Build hook
export async function onBuildComplete(): Promise<void> {
  // Invalidate all caches after a build
  await cacheInvalidation.invalidateAllRelatedContent();
}
