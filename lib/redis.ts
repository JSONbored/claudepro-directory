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
          keys: items.map((item) => `views:${item.category}:${item.slug}`),
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
      const categories = ['agents', 'mcp', 'rules', 'commands', 'hooks'];
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      for (const category of categories) {
        await redis.zremrangebyscore(`trending:${category}:weekly`, 0, oneWeekAgo);
      }
    } catch (error) {
      logger.error(
        'Failed to cleanup old trending data in Redis',
        error instanceof Error ? error : new Error(String(error)),
        {
          categories: ['agents', 'mcp', 'rules', 'commands', 'hooks'],
          cutoffTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
        }
      );
    }
  },
};

export default redis;
