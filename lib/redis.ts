/**
 * Streamlined Redis Facade
 * Ultra-optimized interface leveraging modular architecture
 */

import { z } from 'zod';
import { logger } from './logger';
import { type CacheService, CacheServices, RateLimiters, redisClient } from './redis/index';
import type { CacheInvalidationResult } from './schemas/cache.schema';
import {
  cacheCategorySchema,
  cacheKeyParamsSchema,
  parseRedisZRangeResponse,
  popularItemsQuerySchema,
} from './schemas/cache.schema';
import { validateCacheKey } from './schemas/primitives/api-cache-primitives';

const BATCH_SIZE = 50;
const rateLimiter = RateLimiters.api('redis_ops');

// Generic operation executor with rate limiting and logging
const exec = async <T>(
  fn: () => Promise<T>,
  fallback: T,
  op: string,
  skipRateLimit = false
): Promise<T> => {
  if (!skipRateLimit) {
    const { success } = await rateLimiter.checkRateLimit(1);
    if (!success) {
      logger.warn(`Rate limit: ${op}`);
      return fallback;
    }
  }

  try {
    return await fn();
  } catch (e) {
    logger.error(`Failed: ${op}`, e instanceof Error ? e : new Error(String(e)));
    return fallback;
  }
};

// Redis client operation wrapper
const redis = <T>(
  fn: (client: import('@upstash/redis').Redis) => Promise<T>,
  fallback: () => T | Promise<T>,
  op: string
) => redisClient.executeOperation(fn, fallback, op);

/**
 * Unified stats operations
 */
export const statsRedis = {
  isEnabled: () => redisClient.getStatus().isConnected || redisClient.getStatus().isFallback,

  incrementView: (cat: string, slug: string) =>
    exec(
      () =>
        redis(
          async (c) => {
            const key = `views:${cat}:${slug}`;
            const [count] = await Promise.all([
              c.incr(key),
              c.zadd(`trending:${cat}:weekly`, { score: Date.now(), member: slug }),
              c.zincrby(`popular:${cat}:all`, 1, slug),
            ]);
            return count;
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
        await Promise.all([
          c.incr(`copies:${v.category}:${v.slug}`),
          c.zincrby(`copied:${v.category}:all`, 1, v.slug),
        ]);
      },
      () => undefined,
      'trackCopy'
    );
  },

  cleanupOldTrending: () =>
    redis(
      async (c) => {
        const cats = ['agents', 'mcp', 'rules', 'commands', 'hooks'] as const;
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

/**
 * Optimizer utilities
 */
export const redisOptimizer = {
  getRateLimitStats: () => rateLimiter.getStatus(),
  getConnectionStats: () => ({
    status: redisClient.getStatus(),
    storage: redisClient.getStorageStats(),
  }),

  batchIncrements: async (ops: Array<{ key: string; increment?: number }>): Promise<number[]> => {
    if (!ops.length) return [];

    const results: number[] = [];
    for (let i = 0; i < ops.length; i += BATCH_SIZE) {
      const batch = ops.slice(i, i + BATCH_SIZE);
      const batchResults = await redis(
        async (c) => {
          const p = c.pipeline();
          batch.forEach((o) => {
            const k = validateCacheKey(o.key);
            o.increment !== 1 ? p.incrby(k, o.increment ?? 1) : p.incr(k);
          });
          return await p.exec();
        },
        () => new Array(batch.length).fill(0),
        'batchIncrements'
      );
      results.push(...(batchResults as number[]));
    }
    return results;
  },

  batchGet: async <T>(keys: string[]): Promise<Record<string, T | null>> => {
    if (!keys.length) return {};
    const vKeys = keys.map(validateCacheKey);
    const map = await CacheServices.api.getMany<T>(vKeys);
    return Object.fromEntries(map.entries());
  },

  cleanupExpiredKeys: async () => {
    await Promise.all(
      ['mdx:*', 'content:*', 'api:*', 'trending:*', 'popular:*'].map((p) =>
        CacheServices.content.invalidatePattern(p)
      )
    ).catch((e) => logger.error('Cleanup failed', e instanceof Error ? e : new Error(String(e))));
  },

  getOptimizationReport: async () => {
    const [cacheStats, connectionStats, rateLimitStats] = await Promise.all([
      Promise.resolve(CacheServices.api.getStats()),
      Promise.resolve(redisClient.getStorageStats()),
      rateLimiter.getStatus(),
    ]);

    const suggestions: string[] = [];
    if (cacheStats.cacheHitRate && cacheStats.cacheHitRate < 70)
      suggestions.push('Increase cache TTL', 'Review key strategies');
    if (rateLimitStats.utilizationPercent > 80)
      suggestions.push('Add app-level caching', 'Increase batch sizes');
    suggestions.push('Use batch operations', 'Implement cache warming', 'Monitor hit rates');

    return { cacheStats, connectionStats, rateLimitStats, optimizationSuggestions: suggestions };
  },
};

export { redisClient } from './redis/index';
export default redisClient;
