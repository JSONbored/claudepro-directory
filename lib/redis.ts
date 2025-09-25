import { Redis } from '@upstash/redis';
import { logger } from './logger';

// Compression utilities for optimizing storage
const compress = (data: string): string => {
  if (data.length < 100) return data; // Don't compress small data

  try {
    // Simple compression using JSON.stringify optimization
    const compressed = JSON.stringify(JSON.parse(data));
    return compressed.length < data.length ? compressed : data;
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
// Uses KV_REST_API_URL and KV_REST_API_TOKEN from Upstash Vercel integration
const redis = process.env.KV_REST_API_URL
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN!,
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
      // Get items from the last 7 days
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      // Get trending items from the weekly sorted set
      // Use zrange with byScore option for Upstash Redis
      const items = await redis.zrange(`trending:${category}:weekly`, oneWeekAgo, Date.now(), {
        byScore: true,
        rev: true,
        withScores: false,
        offset: 0,
        count: limit,
      });

      return items as string[];
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
      const items = await redis.zrange(`popular:${category}:all`, 0, limit - 1, {
        rev: true,
        withScores: true,
      });

      // Convert to array of objects
      const result: Array<{ slug: string; views: number }> = [];
      for (let i = 0; i < items.length; i += 2) {
        result.push({
          slug: items[i] as string,
          views: Number(items[i + 1]),
        });
      }

      return result;
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
      const key = `copies:${category}:${slug}`;
      await redis.incr(key);

      // Update copy leaderboard
      await redis.zincrby(`copied:${category}:all`, 1, slug);
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
      return {
        totalViews: 0,
        totalCopies: 0,
        topCategories: [],
      };
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
      const categories = ['agents', 'mcp', 'rules', 'commands', 'hooks', 'guides'];
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      for (const category of categories) {
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
      await checkRateLimit();
      const key = `mdx:${path}`;
      const compressedContent = compress(content);
      const sizeReduction = content.length - compressedContent.length;

      await redis.setex(key, ttl, compressedContent);

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
      await checkRateLimit();
      const key = `mdx:${path}`;
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
          const key = `mdx:${item.path}`;
          const compressedContent = compress(item.content);
          const ttl = item.ttl || 24 * 60 * 60;
          pipeline.setex(key, ttl, compressedContent);
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
      const key = `content:${category}:metadata`;
      await redis.setex(key, ttl, JSON.stringify(data));
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
      const key = `content:${category}:metadata`;
      const data = await redis.get<string>(key);
      return data ? JSON.parse(data) : null;
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
      const key = `api:${endpoint}`;
      await redis.setex(key, ttl, JSON.stringify(data));
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
      const key = `api:${endpoint}`;
      const data = await redis.get<string>(key);
      return data ? JSON.parse(data) : null;
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

  // Invalidate cache by pattern
  async invalidatePattern(pattern: string): Promise<void> {
    if (!redis) return;

    try {
      // Note: Upstash Redis doesn't support KEYS command in production
      // This is a simplified version - in production you'd use a different approach
      // or store cache keys in a set for easier invalidation
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error(
        'Failed to invalidate cache pattern',
        error instanceof Error ? error : new Error(String(error)),
        {
          pattern,
        }
      );
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
      // Try to get cached data with TTL
      const cached = await redis.get<string>(key);
      const ttlRemaining = await redis.ttl(key);

      if (cached && ttlRemaining > ttl * (1 - refreshThreshold)) {
        return JSON.parse(cached);
      }

      // Data is stale or doesn't exist, fetch fresh data
      const freshData = await fetcher();

      // Cache the fresh data
      await redis.setex(key, ttl, JSON.stringify(freshData));

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

  // Batch operations with intelligent pipeline usage
  async batchIncrements(operations: Array<{ key: string; increment?: number }>): Promise<number[]> {
    if (!redis || operations.length === 0) return [];

    try {
      const results: number[] = [];

      // Process operations in batches
      for (let i = 0; i < operations.length; i += BATCH_SIZE) {
        await checkRateLimit();
        const batch = operations.slice(i, i + BATCH_SIZE);
        const pipeline = redis.pipeline();

        for (const op of batch) {
          if (op.increment && op.increment !== 1) {
            pipeline.incrby(op.key, op.increment);
          } else {
            pipeline.incr(op.key);
          }
        }

        const batchResults = await pipeline.exec();
        results.push(...(batchResults as number[]));
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
      const results: Record<string, T | null> = {};

      // Process keys in batches
      for (let i = 0; i < keys.length; i += BATCH_SIZE) {
        await checkRateLimit();
        const batch = keys.slice(i, i + BATCH_SIZE);
        const values = await redis.mget<(string | null)[]>(...batch);

        batch.forEach((key, index) => {
          const value = values[index];
          if (value) {
            try {
              results[key] = JSON.parse(decompress(value));
            } catch {
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
      const categories = ['mdx', 'content', 'api', 'trending', 'popular'];

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
