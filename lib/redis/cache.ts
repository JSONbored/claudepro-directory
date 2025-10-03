/**
 * Redis Cache Service
 * High-level caching interface with real compression, validation, and fallback
 */

import { brotliCompressSync, brotliDecompressSync, gunzipSync, gzipSync } from 'node:zlib';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  type CacheInvalidationResult,
  cacheInvalidationResultSchema,
  cacheStatsSchema,
} from '@/lib/schemas/cache.schema';
import { validateCacheKey, validateTTL } from '@/lib/schemas/primitives/api-cache-primitives';
import { ParseStrategy, safeParse, safeStringify } from '@/lib/utils/safe-json';
import { redisClient } from './client';

// Compression algorithms
type CompressionAlgorithm = 'gzip' | 'brotli' | 'none';

// Cache configuration schema
const cacheConfigSchema = z.object({
  defaultTTL: z.number().int().min(60).max(86400).default(3600), // 1 hour default
  keyPrefix: z.string().min(1).max(20).default('cache'),
  compressionThreshold: z.number().int().min(100).max(10000).default(1000),
  compressionAlgorithm: z.enum(['gzip', 'brotli', 'none']).default('brotli'),
  enableCompression: z.boolean().default(true),
  enableFallback: z.boolean().default(true),
  maxValueSize: z.number().int().min(1024).max(10485760).default(1048576), // 1MB default
  maxMemoryMB: z.number().int().min(10).max(500).default(100), // Memory limit for fallback
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
  };

  constructor(config?: Partial<CacheConfig>) {
    this.config = cacheConfigSchema.parse(config || {});
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
        return { fullKey, key, serialized, ttl: validatedTTL, size: serialized.length };
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
            const result = await redis.scan(cursor, { match: fullPattern, count: 100 });
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
   * Get cache statistics
   */
  getStats(): z.infer<typeof cacheStatsSchema> {
    const total = this.stats.hits + this.stats.misses;

    return cacheStatsSchema.parse({
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      errors: this.stats.errors,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      fallbackHits: this.stats.fallbackHits,
    });
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
 * Optimized with Brotli compression and memory management
 */
export const CacheServices = {
  /**
   * API response cache - 1 hour TTL with Brotli compression
   */
  api: new CacheService({
    keyPrefix: 'api',
    defaultTTL: 3600,
    enableCompression: true,
    compressionAlgorithm: 'brotli', // Better compression than gzip
    compressionThreshold: 500, // Compress anything over 500 bytes
    maxValueSize: 2097152, // 2MB max
    maxMemoryMB: 50, // 50MB fallback memory limit
    enableLogging: process.env.NODE_ENV === 'development',
  }),

  /**
   * Session cache - 24 hours TTL with gzip compression
   */
  session: new CacheService({
    keyPrefix: 'session',
    defaultTTL: 86400,
    enableCompression: true,
    compressionAlgorithm: 'gzip', // Faster for smaller payloads
    compressionThreshold: 1000,
    maxMemoryMB: 30,
    enableLogging: false,
  }),

  /**
   * Content cache - 6 hours TTL with aggressive Brotli compression
   */
  content: new CacheService({
    keyPrefix: 'content',
    defaultTTL: 21600,
    enableCompression: true,
    compressionAlgorithm: 'brotli', // Best for large content
    compressionThreshold: 200, // Compress aggressively
    maxValueSize: 5242880, // 5MB max
    maxMemoryMB: 100, // Larger memory pool for content
    enableLogging: process.env.NODE_ENV === 'development',
  }),

  /**
   * Temporary cache - 15 minutes TTL, no compression for speed
   */
  temp: new CacheService({
    keyPrefix: 'temp',
    defaultTTL: 900,
    enableCompression: false, // Speed over size
    maxMemoryMB: 20,
    enableLogging: false,
  }),
} as const;
