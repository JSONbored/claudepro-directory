/**
 * Redis Cache Service
 * High-level caching interface with compression, validation, and fallback
 */

import { z } from 'zod';
import { logger } from '../logger';
import {
  type CacheInvalidationResult,
  cacheInvalidationResultSchema,
  cacheStatsSchema,
  validateCacheKey,
  validateTTL,
} from '../schemas/cache.schema';
import { redisClient } from './client';

// Cache configuration schema
const cacheConfigSchema = z.object({
  defaultTTL: z.number().int().min(60).max(86400).default(3600), // 1 hour default
  keyPrefix: z.string().min(1).max(20).default('cache'),
  compressionThreshold: z.number().int().min(100).max(10000).default(1000),
  enableCompression: z.boolean().default(true),
  enableFallback: z.boolean().default(true),
  maxValueSize: z.number().int().min(1024).max(10485760).default(1048576), // 1MB default
  enableLogging: z.boolean().default(false),
});

type CacheConfig = z.infer<typeof cacheConfigSchema>;

// Cache entry schema
const cacheEntrySchema = z.object({
  value: z.unknown(),
  timestamp: z.number().int().min(0),
  ttl: z.number().int().min(0),
  compressed: z.boolean().default(false),
  version: z.string().default('1.0'),
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
   * Compress data if it exceeds threshold
   */
  private compressData(data: string): { data: string; compressed: boolean } {
    if (!this.config.enableCompression || data.length < this.config.compressionThreshold) {
      return { data, compressed: false };
    }

    try {
      // Use JSON minification as compression for now
      const parsed = JSON.parse(data);
      const compressed = JSON.stringify(parsed);

      return {
        data: compressed.length < data.length ? compressed : data,
        compressed: compressed.length < data.length,
      };
    } catch {
      return { data, compressed: false };
    }
  }

  /**
   * Decompress data if compressed
   */
  private decompressData(data: string, compressed: boolean): string {
    if (!compressed) return data;

    try {
      // For JSON compression, just parse and stringify to validate
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed);
    } catch {
      return data;
    }
  }

  /**
   * Serialize cache entry
   */
  private serializeEntry<T>(value: T, ttl: number): string {
    const entry: CacheEntry = {
      value,
      timestamp: Date.now(),
      ttl,
      compressed: false,
      version: '1.0',
    };

    const serialized = JSON.stringify(entry);

    // Validate size
    if (serialized.length > this.config.maxValueSize) {
      throw new Error(
        `Cache value too large: ${serialized.length} bytes (max: ${this.config.maxValueSize})`
      );
    }

    const { data, compressed } = this.compressData(serialized);

    if (compressed) {
      const compressedEntry = { ...entry, compressed: true };
      return JSON.stringify(compressedEntry);
    }

    return data;
  }

  /**
   * Deserialize cache entry
   */
  private deserializeEntry<T>(data: string): T | null {
    try {
      const entry = cacheEntrySchema.parse(JSON.parse(data));

      // Check if entry is expired
      if (entry.ttl > 0 && Date.now() > entry.timestamp + entry.ttl * 1000) {
        return null;
      }

      const decompressed = this.decompressData(JSON.stringify(entry.value), entry.compressed);
      return JSON.parse(decompressed) as T;
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
   * Get multiple values from cache
   */
  async getMany<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();

    // Process in parallel but with concurrency limit
    const chunkSize = 10;
    for (let i = 0; i < keys.length; i += chunkSize) {
      const chunk = keys.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(async (key) => {
        const value = await this.get<T>(key);
        return { key, value };
      });

      const chunkResults = await Promise.all(chunkPromises);
      chunkResults.forEach(({ key, value }) => {
        results.set(key, value);
      });
    }

    return results;
  }

  /**
   * Set multiple values in cache
   */
  async setMany<T>(
    entries: Array<{ key: string; value: T; ttl?: number }>
  ): Promise<CacheOperationResult[]> {
    const results: CacheOperationResult[] = [];

    // Process in parallel but with concurrency limit
    const chunkSize = 10;
    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(async ({ key, value, ttl }) => {
        return this.set(key, value, ttl);
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
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
 */
export const CacheServices = {
  /**
   * API response cache - 1 hour TTL with compression
   */
  api: new CacheService({
    keyPrefix: 'api',
    defaultTTL: 3600,
    enableCompression: true,
    compressionThreshold: 500,
    enableLogging: true,
  }),

  /**
   * Session cache - 24 hours TTL
   */
  session: new CacheService({
    keyPrefix: 'session',
    defaultTTL: 86400,
    enableCompression: false,
    enableLogging: false,
  }),

  /**
   * Content cache - 6 hours TTL with high compression
   */
  content: new CacheService({
    keyPrefix: 'content',
    defaultTTL: 21600,
    enableCompression: true,
    compressionThreshold: 200,
    maxValueSize: 5242880, // 5MB
    enableLogging: true,
  }),

  /**
   * Temporary cache - 15 minutes TTL
   */
  temp: new CacheService({
    keyPrefix: 'temp',
    defaultTTL: 900,
    enableCompression: false,
    enableLogging: false,
  }),
} as const;

/**
 * Create a custom cache service
 */
export function createCacheService(config?: Partial<CacheConfig>): CacheService {
  return new CacheService(config);
}

// Default cache service instance
export const cacheService = CacheServices.api;
