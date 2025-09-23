import { Redis } from '@upstash/redis';
import { logger } from './logger';

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

  // Cache compiled MDX content
  async cacheMDX(
    path: string,
    content: string,
    ttl: number = 24 * 60 * 60 // 24 hours default
  ): Promise<void> {
    if (!redis) return;

    try {
      const key = `mdx:${path}`;
      await redis.setex(key, ttl, content);
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

  // Retrieve cached MDX content
  async getMDX(path: string): Promise<string | null> {
    if (!redis) return null;

    try {
      const key = `mdx:${path}`;
      const content = await redis.get<string>(key);
      return content;
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

export default redis;
