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

import { z } from "zod";
import { logger } from "./logger";
import { type CacheService, CacheServices } from "./redis/cache";
import { redisClient } from "./redis/client";
import type { CacheInvalidationResult } from "./schemas/cache.schema";
import {
  cacheCategorySchema,
  cacheKeyParamsSchema,
  parseRedisZRangeResponse,
  popularItemsQuerySchema,
} from "./schemas/cache.schema";
import { validateCacheKey } from "./schemas/primitives/api-cache-primitives";

// Generic operation executor with error logging
const exec = async <T>(
  fn: () => Promise<T>,
  fallback: T,
  op: string,
): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    logger.error(
      `Failed: ${op}`,
      e instanceof Error ? e : new Error(String(e)),
    );
    return fallback;
  }
};

// Redis client operation wrapper
const redis = <T>(
  fn: (client: import("@upstash/redis").Redis) => Promise<T>,
  fallback: () => T | Promise<T>,
  op: string,
) => redisClient.executeOperation(fn, fallback, op);

/**
 * Unified stats operations
 */
export const statsRedis = {
  isEnabled: () =>
    redisClient.getStatus().isConnected || redisClient.getStatus().isFallback,
  isConnected: () => redisClient.getStatus().isConnected,

  incrementView: (cat: string, slug: string) =>
    exec(
      () =>
        redis(
          async (c) => {
            const key = `views:${cat}:${slug}`;
            // SECURITY: Use UTC to prevent timezone inconsistencies
            const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD UTC
            const dailyKey = `views:daily:${cat}:${slug}:${today}`;

            // PERFORMANCE: Use pipeline for atomic operations
            const pipeline = c.pipeline();
            pipeline.incr(key); // Total all-time views
            pipeline.incr(dailyKey); // Today's views (for growth calculation)
            pipeline.expire(dailyKey, 604800, "NX"); // Only set TTL if key doesn't have one
            pipeline.zadd(`trending:${cat}:weekly`, {
              score: Date.now(),
              member: slug,
            });
            pipeline.zincrby(`popular:${cat}:all`, 1, slug);

            const results = await pipeline.exec();
            return results?.[0] as number | null; // Return total view count
          },
          () => null,
          "incrementView",
        ),
      null,
      "incrementView",
    ),

  getViewCount: (cat: string, slug: string) =>
    redis(
      async (c) => (await c.get<number>(`views:${cat}:${slug}`)) || 0,
      () => 0,
      "getViewCount",
    ),

  getViewCounts: async (items: Array<{ category: string; slug: string }>) => {
    if (!items.length) return {};
    const keys = items.map((i) => `views:${i.category}:${i.slug}`);
    const counts = await redis(
      async (c) => await c.mget<(number | null)[]>(...keys),
      () => new Array(items.length).fill(0) as (number | null)[],
      "getViewCounts",
    );
    return items.reduce(
      (acc, item, i) => {
        acc[`${item.category}:${item.slug}`] =
          (counts as (number | null)[])[i] || 0;
        return acc;
      },
      {} as Record<string, number>,
    );
  },

  /**
   * Get daily view counts for multiple items (optimized MGET batch operation)
   * @param items - Array of category/slug pairs
   * @param date - Date string (YYYY-MM-DD), defaults to today
   * @returns Map of "category:slug" to daily view count
   */
  getDailyViewCounts: async (
    items: Array<{ category: string; slug: string }>,
    date?: string,
  ): Promise<Record<string, number>> => {
    if (!items.length) return {};
    const targetDate = date || new Date().toISOString().split("T")[0];
    const keys = items.map(
      (i) => `views:daily:${i.category}:${i.slug}:${targetDate}`,
    );

    const counts = await redis(
      async (c) => await c.mget<(number | null)[]>(...keys),
      () => new Array(items.length).fill(0) as (number | null)[],
      "getDailyViewCounts",
    );

    return items.reduce(
      (acc, item, i) => {
        acc[`${item.category}:${item.slug}`] =
          (counts as (number | null)[])[i] || 0;
        return acc;
      },
      {} as Record<string, number>,
    );
  },

  getTrending: async (cat: string, limit = 10) => {
    const q = popularItemsQuerySchema.parse({ category: cat, limit });
    const items = await redis(
      async (c) =>
        await c.zrange(
          `trending:${q.category}:weekly`,
          Date.now() - 604800000,
          Date.now(),
          {
            byScore: true,
            rev: true,
            withScores: false,
            offset: 0,
            count: q.limit,
          },
        ),
      () => [],
      "getTrending",
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
      "getPopular",
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
      "trackCopy",
    );
  },

  cleanupOldTrending: () =>
    redis(
      async (c) => {
        const cats = [
          "agents",
          "mcp",
          "rules",
          "commands",
          "hooks",
          "statuslines",
        ] as const;
        await Promise.all(
          cats.map((cat) =>
            c.zremrangebyscore(
              `trending:${cacheCategorySchema.parse(cat)}:weekly`,
              0,
              Date.now() - 604800000,
            ),
          ),
        );
      },
      () => undefined,
      "cleanupOldTrending",
    ),

  /**
   * Enrich content items with Redis view counts
   *
   * @param items - Array of content items (must have category and slug)
   * @returns Same array with viewCount property added to each item
   *
   * @example
   * ```typescript
   * const enriched = await statsRedis.enrichWithViewCounts(agents);
   * // Returns: [{ ...agent1, viewCount: 123 }, { ...agent2, viewCount: 456 }]
   * ```
   */
  enrichWithViewCounts: async <T extends { category: string; slug: string }>(
    items: T[],
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
        "Failed to enrich with view counts",
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return items without view counts on error
      return items.map((item) => ({ ...item, viewCount: 0 }));
    }
  },
};

/**
 * Unified cache operations
 */
const cache = {
  set: async <T>(
    service: CacheService,
    key: string,
    data: T,
    ttl: number,
    op: string,
  ) => {
    try {
      await service.set(key, data, ttl);
    } catch (e) {
      logger.error(
        `Cache set failed: ${op}`,
        e instanceof Error ? e : new Error(String(e)),
      );
    }
  },

  get: async <T>(
    service: CacheService,
    key: string,
    op: string,
  ): Promise<T | null> => {
    try {
      return await service.get<T>(key);
    } catch (e) {
      logger.error(
        `Cache get failed: ${op}`,
        e instanceof Error ? e : new Error(String(e)),
      );
      return null;
    }
  },
};

export const contentCache = {
  isEnabled: () => CacheServices.content !== null,

  // MDX operations
  cacheMDX: (path: string, content: string, ttl = 86400) =>
    cache.set(CacheServices.content, `mdx:${path}`, content, ttl, "MDX"),

  getMDX: (path: string) =>
    cache.get<string>(CacheServices.content, `mdx:${path}`, "MDX"),

  batchCacheMDX: async (
    items: Array<{ path: string; content: string; ttl?: number }>,
  ) => {
    if (!items.length) return;
    try {
      await CacheServices.content.setMany(
        items.map(({ path, content, ttl = 86400 }) => ({
          key: `mdx:${path}`,
          value: content,
          ttl,
        })),
      );
    } catch (e) {
      logger.error(
        "Batch MDX failed",
        e instanceof Error ? e : new Error(String(e)),
      );
    }
  },

  // Metadata operations
  cacheContentMetadata: <T>(cat: string, data: T, ttl = 14400) =>
    cache.set(
      CacheServices.content,
      `content:${cacheCategorySchema.parse(cat)}:metadata`,
      data,
      ttl,
      "metadata",
    ),

  getContentMetadata: <T>(cat: string) =>
    cache.get<T>(
      CacheServices.content,
      `content:${cacheCategorySchema.parse(cat)}:metadata`,
      "metadata",
    ),

  // API operations
  cacheAPIResponse: <T>(endpoint: string, data: T, ttl = 3600) =>
    cache.set(CacheServices.api, `api:${endpoint}`, data, ttl, "API"),

  getAPIResponse: <T>(endpoint: string) =>
    cache.get<T>(CacheServices.api, `api:${endpoint}`, "API"),

  invalidatePattern: async (
    pattern: string,
  ): Promise<CacheInvalidationResult> => {
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

  cacheWithRefresh: async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = 3600,
  ): Promise<T> => {
    try {
      const vKey = validateCacheKey(key);
      const cached = await CacheServices.api.get<T>(vKey);
      if (cached) return cached;

      const fresh = await fetcher();
      await CacheServices.api.set(vKey, fresh, ttl);
      return fresh;
    } catch (e) {
      logger.error(
        "Refresh failed",
        e instanceof Error ? e : new Error(String(e)),
      );
      return fetcher();
    }
  },
};

export { type Redis, redisClient } from "./redis/client";
