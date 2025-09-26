import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { logger } from './logger';
import {
  apiResponseCacheSchema,
  type CacheInvalidationResult,
  cacheCategorySchema,
  cacheContentMetadataSchema,
  cachedApiResponseSchema,
  cacheInvalidationResultSchema,
  cacheKeyParamsSchema,
  cacheStatsSchema,
  mdxCacheSchema,
  parseCachedJSON,
  parseGenericCachedJSON,
  parseRedisZRangeResponse,
  popularItemsQuerySchema,
  type RateLimitTracking,
  rateLimitTrackingSchema,
  redisScanParamsSchema,
  redisScanResponseSchema,
  validateBatchIncrements,
  validateCacheKey,
  validateTTL,
} from './schemas/cache.schema';
import { redisConfig } from './schemas/env.schema';

// Compression utilities for optimizing storage
const compress = (data: string): string => {
  if (data.length < 100) return data; // Don't compress small data

  try {
    // Validate string before compression
    const validData = z.string().max(10485760).parse(data); // 10MB max
    // Safe JSON compression using Zod validation
    const parsed = parseGenericCachedJSON(validData, { operation: 'compress' });
    if (parsed === null) return validData; // Return original if parse failed

    const compressed = JSON.stringify(parsed);
    return compressed.length < validData.length ? compressed : validData;
  } catch {
    return data;
  }
};

const decompress = (data: string): string => {
  return data; // For now, just return as-is since we're using JSON compression
};

// Batch operation utilities
const BATCH_SIZE = 10;
const COMMAND_LIMIT_PER_SECOND = 50; // Conservative limit for free tier

let commandCount = 0;
let lastReset = Date.now();

const checkRateLimit = async (): Promise<void> => {
  const now = Date.now();
  if (now - lastReset >= 1000) {
    commandCount = 0;
    lastReset = now;
  }

  if (commandCount >= COMMAND_LIMIT_PER_SECOND) {
    // Wait until next second
    const waitTime = 1000 - (now - lastReset);
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  commandCount++;
};

// Initialize Redis client
// Uses validated environment variables from env schema
const redis = redisConfig.isConfigured
  ? new Redis({
      url: redisConfig.url!,
      token: redisConfig.token!,
    })
  : null;

// Helper functions for stats tracking
export const statsRedis = {
  // Check if Redis is configured
  isEnabled: () => !!redis,

  // Increment view count for a specific item
  async incrementView(category: string, slug: string): Promise<number | null> {
    if (!redis) return null;

    try {
      const key = `views:${category}:${slug}`;
      const count = await redis.incr(key);

      // Also update the sorted set for trending
      await redis.zadd(`trending:${category}:weekly`, {
        score: Date.now(),
        member: slug,
      });

      // Update all-time popular
      await redis.zincrby(`popular:${category}:all`, 1, slug);

      return count;
    } catch (error) {
      logger.error(
        'Failed to increment view count in Redis',
        error instanceof Error ? error : new Error(String(error)),
        {
          category,
          slug,
          key: `views:${category}:${slug}`,
        }
      );
      return null;
    }
  },

  // Get view count for a specific item
  async getViewCount(category: string, slug: string): Promise<number> {
    if (!redis) return 0;

    try {
      const key = `views:${category}:${slug}`;
      const count = await redis.get<number>(key);
      return count || 0;
    } catch (error) {
      logger.error(
        'Failed to get view count from Redis',
        error instanceof Error ? error : new Error(String(error)),
        {
          category,
          slug,
          key: `views:${category}:${slug}`,
        }
      );
      return 0;
    }
  },

  // Get multiple view counts at once
  async getViewCounts(
    items: Array<{ category: string; slug: string }>
  ): Promise<Record<string, number>> {
    if (!redis || items.length === 0) return {};

    try {
      const keys = items.map((item) => `views:${item.category}:${item.slug}`);
      const counts = await redis.mget<(number | null)[]>(...keys);

      const result: Record<string, number> = {};
      items.forEach((item, index) => {
        const key = `${item.category}:${item.slug}`;
        result[key] = counts[index] || 0;
      });

      return result;
    } catch (error) {
      logger.error(
        'Failed to get multiple view counts from Redis',
        error instanceof Error ? error : new Error(String(error)),
        {
          itemCount: items.length,
          keysCount: items.length,
          sampleKey: items.length > 0 ? `views:${items[0]?.category}:${items[0]?.slug}` : '',
        }
      );
      return {};
    }
  },

  // Get trending items for a category
  async getTrending(category: string, limit: number = 10): Promise<string[]> {
    if (!redis) return [];

    try {
      // Validate inputs
      const validatedQuery = popularItemsQuerySchema.parse({ category, limit });

      // Get items from the last 7 days
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      // Get trending items from the weekly sorted set
      // Use zrange with byScore option for Upstash Redis
      const items = await redis.zrange(
        `trending:${validatedQuery.category}:weekly`,
        oneWeekAgo,
        Date.now(),
        {
          byScore: true,
          rev: true,
          withScores: false,
          offset: 0,
          count: validatedQuery.limit,
        }
      );

      return z.array(z.string()).parse(items || []);
    } catch (error) {
      logger.error(
        'Failed to get trending items from Redis',
        error instanceof Error ? error : new Error(String(error)),
        {
          category,
          limit,
          key: `trending:${category}:weekly`,
        }
      );
      return [];
    }
  },

  // Get most popular items all-time
  async getPopular(
    category: string,
    limit: number = 10
  ): Promise<Array<{ slug: string; views: number }>> {
    if (!redis) return [];

    try {
      // Validate inputs
      const validatedQuery = popularItemsQuerySchema.parse({ category, limit });

      const items = await redis.zrange(
        `popular:${validatedQuery.category}:all`,
        0,
        validatedQuery.limit - 1,
        {
          rev: true,
          withScores: true,
        }
      );

      // Convert to array of objects using safe parsing
      return parseRedisZRangeResponse(items, {
        operation: 'getPopular',
        key: `popular:${validatedQuery.category}:all`,
      });
    } catch (error) {
      logger.error(
        'Failed to get popular items from Redis',
        error instanceof Error ? error : new Error(String(error)),
        {
          category,
          limit,
          key: `popular:${category}:all`,
        }
      );
      return [];
    }
  },

  // Track a copy action
  async trackCopy(category: string, slug: string): Promise<void> {
    if (!redis) return;

    try {
      // Validate inputs
      const validated = cacheKeyParamsSchema.parse({ category, slug });

      const key = `copies:${validated.category}:${validated.slug}`;
      await redis.incr(key);

      // Update copy leaderboard
      await redis.zincrby(`copied:${validated.category}:all`, 1, validated.slug);
    } catch (error) {
      logger.error(
        'Failed to track copy action in Redis',
        error instanceof Error ? error : new Error(String(error)),
        {
          category,
          slug,
          copyKey: `copies:${category}:${slug}`,
          leaderboardKey: `copied:${category}:all`,
        }
      );
    }
  },

  // Get overall stats
  async getOverallStats(): Promise<{
    totalViews: number;
    totalCopies: number;
    topCategories: Array<{ category: string; views: number }>;
  }> {
    if (!redis) {
      return { totalViews: 0, totalCopies: 0, topCategories: [] };
    }

    try {
      // This would need to aggregate data - simplified for now
      // In production, you'd maintain running counters
      const stats = cacheStatsSchema.parse({
        totalViews: 0,
        totalCopies: 0,
        topCategories: [],
      });
      return stats;
    } catch (error) {
      logger.error(
        'Failed to get overall stats from Redis',
        error instanceof Error ? error : new Error(String(error))
      );
      return { totalViews: 0, totalCopies: 0, topCategories: [] };
    }
  },

  // Clean up old trending data (run periodically)
  async cleanupOldTrending(): Promise<void> {
    if (!redis) return;

    try {
      const categories = ['agents', 'mcp', 'rules', 'commands', 'hooks'] as const;
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      for (const categoryRaw of categories) {
        // Validate category
        const category = cacheCategorySchema.parse(categoryRaw);
        await redis.zremrangebyscore(`trending:${category}:weekly`, 0, oneWeekAgo);
      }
    } catch (error) {
      logger.error(
        'Failed to cleanup old trending data in Redis',
        error instanceof Error ? error : new Error(String(error)),
        {
          categoriesCount: 6,
          sampleCategory: 'agents',
          cutoffTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
        }
      );
    }
  },
};

// Content caching functions for MDX and heavy operations
export const contentCache = {
  // Check if Redis is enabled
  isEnabled: () => !!redis,

  // Cache compiled MDX content with compression
  async cacheMDX(
    path: string,
    content: string,
    ttl: number = 24 * 60 * 60 // 24 hours default
  ): Promise<void> {
    if (!redis) return;

    try {
      // Validate inputs
      const validated = mdxCacheSchema.parse({ path, content, ttl });

      await checkRateLimit();
      const key = `mdx:${validated.path}`;
      const compressedContent = compress(validated.content);
      const sizeReduction = content.length - compressedContent.length;

      await redis.setex(key, validated.ttl, compressedContent);

      if (sizeReduction > 0) {
        logger.info('MDX content compressed', {
          path,
          originalSize: content.length,
          compressedSize: compressedContent.length,
          savings: `${Math.round((sizeReduction / content.length) * 100)}%`,
        });
      }
    } catch (error) {
      logger.error(
        'Failed to cache MDX content',
        error instanceof Error ? error : new Error(String(error)),
        {
          path,
          key: `mdx:${path}`,
          ttl,
        }
      );
    }
  },

  // Retrieve cached MDX content with decompression
  async getMDX(path: string): Promise<string | null> {
    if (!redis) return null;

    try {
      // Validate path
      const validatedPath = validateCacheKey(`mdx:${path}`);

      await checkRateLimit();
      const key = validatedPath;
      const content = await redis.get<string>(key);
      return content ? decompress(content) : null;
    } catch (error) {
      logger.error(
        'Failed to retrieve cached MDX content',
        error instanceof Error ? error : new Error(String(error)),
        {
          path,
          key: `mdx:${path}`,
        }
      );
      return null;
    }
  },

  // Batch cache multiple items efficiently
  async batchCacheMDX(
    items: Array<{ path: string; content: string; ttl?: number }>
  ): Promise<void> {
    if (!redis || items.length === 0) return;

    try {
      // Process in batches to avoid overwhelming Redis
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const pipeline = redis.pipeline();

        for (const item of batch) {
          // Validate each item
          const validated = mdxCacheSchema.parse(item);
          const key = `mdx:${validated.path}`;
          const compressedContent = compress(validated.content);
          pipeline.setex(key, validated.ttl, compressedContent);
        }

        await pipeline.exec();
        await checkRateLimit();

        logger.info('Batch cached MDX content', {
          batchSize: batch.length,
          startIndex: i,
          totalItems: items.length,
        });
      }
    } catch (error) {
      logger.error(
        'Failed to batch cache MDX content',
        error instanceof Error ? error : new Error(String(error)),
        {
          itemCount: items.length,
          batchSize: BATCH_SIZE,
        }
      );
    }
  },

  // Cache processed content metadata
  async cacheContentMetadata(
    category: string,
    data: unknown,
    ttl: number = 4 * 60 * 60 // 4 hours default
  ): Promise<void> {
    if (!redis) return;

    try {
      // Validate inputs
      const validatedCategory = cacheCategorySchema.parse(category);
      const validatedTTL = validateTTL(ttl);

      const key = `content:${validatedCategory}:metadata`;
      await redis.setex(key, validatedTTL, JSON.stringify(data));
    } catch (error) {
      logger.error(
        'Failed to cache content metadata',
        error instanceof Error ? error : new Error(String(error)),
        {
          category,
          key: `content:${category}:metadata`,
          ttl,
        }
      );
    }
  },

  // Retrieve cached content metadata
  async getContentMetadata<T>(category: string): Promise<T | null> {
    if (!redis) return null;

    try {
      // Validate category
      const validatedCategory = cacheCategorySchema.parse(category);

      const key = `content:${validatedCategory}:metadata`;
      const data = await redis.get<string>(key);

      if (!data) return null;

      // Use safe JSON parsing with content metadata schema
      const parsed = parseCachedJSON(data, cacheContentMetadataSchema, {
        key,
        operation: 'getContentMetadata',
      });

      return parsed as T | null;
    } catch (error) {
      logger.error(
        'Failed to retrieve cached content metadata',
        error instanceof Error ? error : new Error(String(error)),
        {
          category,
          key: `content:${category}:metadata`,
        }
      );
      return null;
    }
  },

  // Cache API responses
  async cacheAPIResponse(
    endpoint: string,
    data: unknown,
    ttl: number = 60 * 60 // 1 hour default
  ): Promise<void> {
    if (!redis) return;

    try {
      // Validate inputs
      const validated = apiResponseCacheSchema.parse({
        key: `api:${endpoint}`,
        data,
        ttl,
      });

      await redis.setex(validated.key, validated.ttl, JSON.stringify(validated.data));
    } catch (error) {
      logger.error(
        'Failed to cache API response',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint,
          key: `api:${endpoint}`,
          ttl,
        }
      );
    }
  },

  // Retrieve cached API response
  async getAPIResponse<T>(endpoint: string): Promise<T | null> {
    if (!redis) return null;

    try {
      // Validate key
      const key = validateCacheKey(`api:${endpoint}`);
      const data = await redis.get<string>(key);

      if (!data) return null;

      // Use safe JSON parsing with cached API response schema
      const parsed = parseCachedJSON(data, cachedApiResponseSchema, {
        key,
        operation: 'getAPIResponse',
      });

      return parsed as T | null;
    } catch (error) {
      logger.error(
        'Failed to retrieve cached API response',
        error instanceof Error ? error : new Error(String(error)),
        {
          endpoint,
          key: `api:${endpoint}`,
        }
      );
      return null;
    }
  },

  // Invalidate cache by pattern using SCAN for production safety with comprehensive monitoring
  async invalidatePattern(pattern: string): Promise<CacheInvalidationResult> {
    const startTime = Date.now();
    let keysScanned = 0;
    let keysDeleted = 0;
    let scanCycles = 0;
    let rateLimited = false;

    // Default result for early returns
    const defaultResult: CacheInvalidationResult = {
      pattern,
      keysScanned: 0,
      keysDeleted: 0,
      scanCycles: 0,
      duration: 0,
      rateLimited: false,
    };

    if (!redis) {
      logger.warn('Redis not configured - cache invalidation skipped', { pattern });
      return defaultResult;
    }

    try {
      // Validate SCAN parameters with production schemas
      const scanParams = redisScanParamsSchema.parse({
        cursor: '0',
        pattern,
        count: 100,
      });

      let cursor = scanParams.cursor;

      do {
        scanCycles++;

        // Check rate limits before each operation
        const rateLimitStats = redisOptimizer.getRateLimitStats();
        if (rateLimitStats.isNearLimit) {
          rateLimited = true;
          logger.warn('Rate limit approaching during cache invalidation', {
            pattern: scanParams.pattern,
            utilizationPercent: rateLimitStats.utilizationPercent,
          });
        }

        await checkRateLimit();

        // Execute SCAN with validated parameters
        const rawResult = await redis.scan(cursor, {
          match: scanParams.pattern,
          count: scanParams.count,
        });

        // Validate SCAN response structure
        const validatedResult = redisScanResponseSchema.parse(rawResult);
        cursor = validatedResult[0];
        const keys = validatedResult[1];

        keysScanned += keys.length;

        if (keys.length > 0) {
          // Delete keys in batches to avoid overwhelming Redis
          for (let i = 0; i < keys.length; i += BATCH_SIZE) {
            const batch = keys.slice(i, i + BATCH_SIZE);

            // Validate each key before deletion (security)
            const validatedKeys = batch.filter((key) => {
              try {
                validateCacheKey(key);
                return true;
              } catch {
                logger.warn('Skipping invalid key during invalidation', {
                  key,
                  pattern: scanParams.pattern,
                });
                return false;
              }
            });

            if (validatedKeys.length > 0) {
              await redis.del(...validatedKeys);
              keysDeleted += validatedKeys.length;
            }

            await checkRateLimit();
          }
        }

        // Safety circuit breaker for runaway operations
        if (scanCycles > 1000) {
          logger.error(
            'Cache invalidation circuit breaker triggered - too many SCAN cycles',
            new Error('Circuit breaker triggered'),
            {
              pattern: scanParams.pattern,
              scanCycles,
              keysScanned,
              keysDeleted,
            }
          );
          break;
        }
      } while (cursor !== '0');

      const duration = Date.now() - startTime;

      // Validate and return comprehensive result
      const result = cacheInvalidationResultSchema.parse({
        pattern: scanParams.pattern,
        keysScanned,
        keysDeleted,
        scanCycles,
        duration,
        rateLimited,
      });

      // Log operation details for production monitoring
      if (keysDeleted > 0) {
        logger.info('Cache pattern invalidation completed', result);
      } else {
        logger.debug('No keys found for invalidation pattern', {
          pattern: scanParams.pattern,
          keysScanned,
          scanCycles,
          duration,
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResult = {
        ...defaultResult,
        keysScanned,
        keysDeleted,
        scanCycles,
        duration,
        rateLimited,
      };

      logger.error(
        'Failed to invalidate cache pattern',
        error instanceof Error ? error : new Error(String(error)),
        {
          ...errorResult,
          errorType: error instanceof z.ZodError ? 'validation' : 'redis_operation',
        }
      );

      return errorResult;
    }
  },

  // Cache with automatic expiration and refresh
  async cacheWithRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 60 * 60,
    refreshThreshold: number = 0.8 // Refresh when 80% of TTL has passed
  ): Promise<T> {
    if (!redis) {
      return await fetcher();
    }

    try {
      // Validate inputs
      const validKey = validateCacheKey(key);
      const validTTL = validateTTL(ttl);
      const validThreshold = z
        .number()
        .min(0, 'Threshold must be at least 0')
        .max(1, 'Threshold cannot exceed 1')
        .parse(refreshThreshold);

      // Try to get cached data with TTL
      const cached = await redis.get<string>(validKey);
      const ttlRemaining = await redis.ttl(validKey);

      if (cached && ttlRemaining > validTTL * (1 - validThreshold)) {
        // Use safe JSON parsing with cached API response schema
        const parsed = parseCachedJSON(cached, cachedApiResponseSchema, {
          key: validKey,
          operation: 'cacheWithRefresh',
        });

        if (parsed !== null) {
          return parsed as T;
        }
        // If parsing fails, fall through to fetch fresh data
      }

      // Data is stale or doesn't exist, fetch fresh data
      const freshData = await fetcher();

      // Cache the fresh data
      await redis.setex(validKey, validTTL, JSON.stringify(freshData));

      return freshData;
    } catch (error) {
      logger.error(
        'Failed in cache-with-refresh operation',
        error instanceof Error ? error : new Error(String(error)),
        {
          key,
          ttl,
          refreshThreshold,
        }
      );
      // Fallback to direct fetch
      return await fetcher();
    }
  },
};

// Redis optimization utilities for free tier
export const redisOptimizer = {
  // Get current command usage stats
  getCommandStats(): { count: number; limitPerSecond: number; timeUntilReset: number } {
    const now = Date.now();
    const timeUntilReset = 1000 - (now - lastReset);

    return {
      count: commandCount,
      limitPerSecond: COMMAND_LIMIT_PER_SECOND,
      timeUntilReset: Math.max(0, timeUntilReset),
    };
  },

  // Get comprehensive rate limit stats for production monitoring
  getRateLimitStats(): RateLimitTracking {
    const now = Date.now();
    const timeUntilReset = Math.max(0, 1000 - (now - lastReset));
    const utilizationPercent = Math.round((commandCount / COMMAND_LIMIT_PER_SECOND) * 100);
    const isNearLimit = utilizationPercent >= 80;

    return rateLimitTrackingSchema.parse({
      commandCount,
      limitPerSecond: COMMAND_LIMIT_PER_SECOND,
      timeUntilReset,
      isNearLimit,
      utilizationPercent,
    });
  },

  // Batch operations with intelligent pipeline usage
  async batchIncrements(operations: Array<{ key: string; increment?: number }>): Promise<number[]> {
    if (!redis || operations.length === 0) return [];

    try {
      // Validate batch increment operations with safe parsing
      const validatedOps = validateBatchIncrements(operations);
      if (validatedOps.length === 0) {
        return [];
      }

      const results: number[] = [];

      // Process operations in batches
      for (let i = 0; i < validatedOps.length; i += BATCH_SIZE) {
        await checkRateLimit();
        const batch = validatedOps.slice(i, i + BATCH_SIZE);
        const pipeline = redis.pipeline();

        for (const op of batch) {
          if (op.increment !== 1) {
            pipeline.incrby(op.key, op.increment);
          } else {
            pipeline.incr(op.key);
          }
        }

        const batchResults = await pipeline.exec();
        // Validate batch results are numbers
        const validatedResults = z.array(z.number()).safeParse(batchResults);
        if (validatedResults.success) {
          results.push(...validatedResults.data);
        }
      }

      return results;
    } catch (error) {
      logger.error(
        'Failed batch increments',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  },

  // Efficient bulk data retrieval with compression
  async batchGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    if (!redis || keys.length === 0) return {};

    try {
      // Validate all keys
      const validatedKeys = keys.map((key) => validateCacheKey(key));
      const results: Record<string, T | null> = {};

      // Process keys in batches
      for (let i = 0; i < validatedKeys.length; i += BATCH_SIZE) {
        await checkRateLimit();
        const batch = validatedKeys.slice(i, i + BATCH_SIZE);
        const values = await redis.mget<(string | null)[]>(...batch);

        batch.forEach((key, index) => {
          const value = values[index];
          if (value) {
            // Use safe JSON parsing with decompression
            const decompressed = decompress(value);
            const parsed = parseGenericCachedJSON(decompressed, {
              key,
              operation: 'batchGet',
            });

            if (parsed !== null) {
              results[key] = parsed as T;
            } else {
              // Fallback to raw value if JSON parsing fails
              results[key] = value as T;
            }
          } else {
            results[key] = null;
          }
        });
      }

      return results;
    } catch (error) {
      logger.error('Failed batch get', error instanceof Error ? error : new Error(String(error)));
      return {};
    }
  },

  // Memory usage optimization by cleaning expired keys
  async cleanupExpiredKeys(): Promise<void> {
    if (!redis) return;

    try {
      // Validate cleanup categories
      const categories = z
        .array(z.enum(['mdx', 'content', 'api', 'trending', 'popular']))
        .parse(['mdx', 'content', 'api', 'trending', 'popular']);

      for (const category of categories) {
        // Use SCAN instead of KEYS for production safety
        let cursor = '0';
        do {
          await checkRateLimit();
          const result = await redis.scan(cursor, { match: `${category}:*`, count: 100 });
          cursor = result[0];
          const keys = result[1];

          if (keys.length > 0) {
            // Check TTL for each key and remove if expired
            for (const key of keys) {
              const ttl = await redis.ttl(key);
              if (ttl === -1) {
                // Key exists but has no expiration
                // Set a default expiration based on category
                const defaultTTL = category === 'mdx' ? 24 * 60 * 60 : 4 * 60 * 60;
                await redis.expire(key, defaultTTL);
              }
            }
          }
        } while (cursor !== '0');
      }

      logger.info('Completed Redis cleanup cycle');
    } catch (error) {
      logger.error(
        'Failed Redis cleanup',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  },

  // Estimate memory usage and optimization suggestions
  async getOptimizationReport(): Promise<{
    estimatedMemoryUsage: string;
    commandsUsedToday: number;
    optimizationSuggestions: string[];
  }> {
    if (!redis) {
      return {
        estimatedMemoryUsage: 'Redis not configured',
        commandsUsedToday: 0,
        optimizationSuggestions: ['Configure Redis for caching'],
      };
    }

    try {
      // Try to get memory info if available (fallback to empty string)
      const info = (redis as any).info ? await (redis as any).info('memory') : '';
      const suggestions: string[] = [];

      // Parse memory info if available
      let memoryUsage = 'Unknown';
      if (info.includes('used_memory_human:')) {
        memoryUsage = info.split('used_memory_human:')[1]?.split('\r')[0] || 'Unknown';
      }

      // Add optimization suggestions based on usage patterns
      if (commandCount > COMMAND_LIMIT_PER_SECOND * 0.8) {
        suggestions.push('Consider reducing Redis command frequency');
      }

      suggestions.push('Use batch operations for bulk data');
      suggestions.push('Enable compression for large content');
      suggestions.push('Set appropriate TTL values');

      return {
        estimatedMemoryUsage: memoryUsage,
        commandsUsedToday: commandCount,
        optimizationSuggestions: suggestions,
      };
    } catch (error) {
      logger.error(
        'Failed to get optimization report',
        error instanceof Error ? error : new Error(String(error))
      );
      return {
        estimatedMemoryUsage: 'Error retrieving info',
        commandsUsedToday: commandCount,
        optimizationSuggestions: ['Check Redis configuration'],
      };
    }
  },
};

export default redis;
