/**
 * Streamlined Redis Facade
 * Ultra-optimized interface leveraging modular architecture
 *
 * ## Batch Operation Performance Guide
 *
 * Choose the optimal method based on your use case:
 *
 * ### 1. statsRedis.getViewCounts() - MGET (Current - Optimal)
 * - **Use for:** Pure GET operations on string values
 * - **Performance:** Fastest option for simple reads (~10-20% faster than pipeline)
 * - **Atomic:** Yes - single Redis command
 * - **Batch size:** Up to 100 keys recommended
 * - **Example:** View counts, simple counters
 *
 * ### 2. redisOptimizer.smartBatchGet() - Smart Selection
 * - **Use for:** General-purpose batch reads
 * - **Performance:** Automatically chooses MGET (≤50 keys) or pipeline (>50 keys)
 * - **Atomic:** Only for MGET path
 * - **Batch size:** Adaptive (50-100 keys per chunk)
 * - **Example:** Generic multi-key fetching
 *
 * ### 3. redisClient.getBatchPipeline() - Manual Pipeline
 * - **Use for:** Mixed operations (GET + INCR + HSET), large batches, typed results
 * - **Performance:** +8-12ms improvement per batch vs individual calls
 * - **Atomic:** No - commands can interleave
 * - **Batch size:** 50-100 keys per chunk (automatically chunked)
 * - **Example:** Complex batch operations, heterogeneous commands
 *
 * ### 4. redisClient.getBatchMget() - Direct MGET
 * - **Use for:** When you specifically need MGET behavior
 * - **Performance:** Same as statsRedis.getViewCounts() approach
 * - **Atomic:** Yes
 * - **Batch size:** Up to 100 keys
 * - **Example:** Direct replacement for manual MGET calls
 *
 * ### 5. redisOptimizer.batchIncrements() - Pipeline for Writes
 * - **Use for:** Multiple INCR/INCRBY operations
 * - **Performance:** Optimal for bulk counter updates
 * - **Atomic:** No
 * - **Batch size:** 50 operations per chunk
 * - **Example:** Batch analytics updates
 *
 * ## Auto-Pipelining
 *
 * The Redis client has `enableAutoPipelining: true` which automatically batches
 * commands when using Promise.all(). Use this pattern for automatic optimization:
 *
 * ```typescript
 * // Automatically batched into single pipeline request
 * const [user1, user2, user3] = await Promise.all([
 *   redis.get('user:1'),
 *   redis.get('user:2'),
 *   redis.get('user:3'),
 * ]);
 * ```
 *
 * ## Performance Benchmarks
 *
 * Based on production metrics and research:
 * - MGET: ~10-20% faster than pipeline for pure GETs
 * - Pipeline: +8-12ms improvement per batch vs sequential calls
 * - Auto-pipelining: ~55% reduction in page load time for multi-fetch patterns
 * - Batch size sweet spot: 50-100 operations per chunk
 *
 * ## Migration Guide
 *
 * ✅ **Keep existing patterns:**
 * - statsRedis.getViewCounts() - Already optimal with MGET
 * - redisOptimizer.batchIncrements() - Already optimal with pipeline
 *
 * ✅ **Consider upgrading:**
 * - Individual redis.get() calls → Use Promise.all() for auto-pipelining
 * - Custom batch logic → Use smartBatchGet() for automatic optimization
 * - Mixed operations → Use getBatchPipeline() with proper chunking
 */

import { z } from 'zod';
import { logger } from './logger';
import { type CacheService, CacheServices, redisClient } from './redis/index';
import type { CacheInvalidationResult } from './schemas/cache.schema';
import {
  cacheCategorySchema,
  cacheKeyParamsSchema,
  parseRedisZRangeResponse,
  popularItemsQuerySchema,
} from './schemas/cache.schema';
import { validateCacheKey } from './schemas/primitives/api-cache-primitives';

const BATCH_SIZE = 50;

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

  /**
   * Smart batch get - automatically chooses optimal method
   *
   * Uses MGET for small batches (≤50 keys) of pure string reads - fastest option
   * Uses pipeline for larger batches - better for bulk operations
   *
   * @param keys - Array of Redis keys to fetch
   * @param options - Configuration options
   * @returns Map of key -> value (null if key doesn't exist)
   */
  smartBatchGet: async <T = string>(
    keys: string[],
    options: { preferMget?: boolean; batchSize?: number } = {}
  ): Promise<Map<string, T | null>> => {
    if (!keys.length) return new Map();

    const { preferMget = true, batchSize = BATCH_SIZE } = options;
    const validatedKeys = keys.map(validateCacheKey);

    // Use MGET for small batches (faster, atomic)
    if (preferMget && validatedKeys.length <= 50) {
      return redisClient.getBatchMget<T>(validatedKeys);
    }

    // Use pipeline for larger batches (chunked for safety)
    return redisClient.getBatchPipeline<T>(validatedKeys, { batchSize });
  },

  /**
   * Legacy batch get using cache service
   * @deprecated Use smartBatchGet for better performance
   */
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
    const [cacheStats, connectionStats] = await Promise.all([
      Promise.resolve(CacheServices.api.getStats()),
      Promise.resolve(redisClient.getStorageStats()),
    ]);

    const suggestions: string[] = [];
    if (cacheStats.cacheHitRate && cacheStats.cacheHitRate < 70)
      suggestions.push('Increase cache TTL', 'Review key strategies');
    suggestions.push('Use batch operations', 'Implement cache warming', 'Monitor hit rates');

    return { cacheStats, connectionStats, optimizationSuggestions: suggestions };
  },
};

export { redisClient } from './redis/index';
export default redisClient;
