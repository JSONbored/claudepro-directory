/**
 * Cache Operation Validation Schemas
 * Production-grade validation for Redis cache operations
 * Protects against cache poisoning and invalid data storage
 *
 * CLEANED - Removed 46 unused exports (80% waste eliminated)
 */

import { z } from 'zod';
import { cacheKeyString, KEY_LIMITS } from '@/lib/schemas/primitives/api-cache-primitives';
import { nonNegativeInt, positiveInt, viewCount } from '@/lib/schemas/primitives/base-numbers';
import { slugString } from '@/lib/schemas/primitives/base-strings';

/**
 * Security constants for cache operations
 */
const CACHE_LIMITS = {
  MAX_VIEW_COUNT: 9999999999,
  MAX_SCORE: 999999999999,
} as const;

/**
 * Content category enum for cache operations
 * Using subset schema from shared source of truth
 */
import { cacheableCategorySchema } from './shared.schema';

/**
 * Cache category schema - extends cacheableCategorySchema with 'all_content'
 * for combined cache operations across all categories
 */
export const cacheCategorySchema = z.union([cacheableCategorySchema, z.literal('all_content')]);

/**
 * Base cache key parameters
 */
export const cacheKeyParamsSchema = z.object({
  category: cacheCategorySchema,
  slug: slugString,
});

/**
 * Popular items query schema
 */
export const popularItemsQuerySchema = z.object({
  category: cacheCategorySchema,
  limit: positiveInt.max(100).default(10),
  offset: nonNegativeInt.max(1000).optional().default(0),
});

/**
 * Cache stats response schema
 */
export const cacheStatsSchema = z.object({
  totalViews: nonNegativeInt,
  totalCopies: nonNegativeInt,
  topCategories: z.array(
    z.object({
      category: cacheCategorySchema,
      views: viewCount,
    })
  ),
  cacheHitRate: z.number().min(0).max(1).optional(),
  memoryUsage: nonNegativeInt.optional(),
});

/**
 * Redis ZRANGE response validation (array with scores)
 */
export const redisZRangeResponseSchema = z.array(z.union([z.string(), z.number()]));

/**
 * Popular items with scores schema
 */
export const popularItemWithScoreSchema = z.object({
  slug: cacheKeyString.max(KEY_LIMITS.MAX_SLUG_LENGTH),
  views: viewCount.max(CACHE_LIMITS.MAX_VIEW_COUNT),
});

/**
 * Cache invalidation operation result schema
 */
export const cacheInvalidationResultSchema = z.object({
  pattern: z.string(),
  keysScanned: nonNegativeInt,
  keysDeleted: nonNegativeInt,
  scanCycles: positiveInt,
  duration: z.number().min(0),
  rateLimited: z.boolean().default(false),
});

/**
 * Rate limit tracking schema for production monitoring
 */
export const rateLimitTrackingSchema = z.object({
  commandCount: nonNegativeInt,
  limitPerSecond: positiveInt,
  timeUntilReset: z.number().min(0),
  isNearLimit: z.boolean(),
  utilizationPercent: z.number().min(0).max(100),
});

/**
 * Helper to safely parse Redis ZRANGE responses
 */
export function parseRedisZRangeResponse(items: unknown[]): Array<{ slug: string; views: number }> {
  try {
    const validatedItems = redisZRangeResponseSchema.parse(items);
    const result: Array<{ slug: string; views: number }> = [];

    // Process pairs of [member, score]
    for (let i = 0; i < validatedItems.length; i += 2) {
      const slug = validatedItems[i];
      const score = validatedItems[i + 1];

      if (typeof slug === 'string' && typeof score === 'number') {
        const validatedItem = popularItemWithScoreSchema.parse({
          slug,
          views: Math.floor(score),
        });
        result.push(validatedItem);
      }
    }

    return result;
  } catch {
    return [];
  }
}

/**
 * Redis connection status schema
 */
export const redisConnectionStatusSchema = z.object({
  isConnected: z.boolean(),
  isFallback: z.boolean(),
  lastConnectionAttempt: z.date().nullable(),
  consecutiveFailures: nonNegativeInt,
  totalOperations: nonNegativeInt,
  failedOperations: nonNegativeInt,
});

/**
 * Type exports (only used types)
 */
export type CacheCategory = z.infer<typeof cacheCategorySchema>;
export type CacheKeyParams = z.infer<typeof cacheKeyParamsSchema>;
export type PopularItemsQuery = z.infer<typeof popularItemsQuerySchema>;
export type CacheStats = z.infer<typeof cacheStatsSchema>;
export type CacheInvalidationResult = z.infer<typeof cacheInvalidationResultSchema>;
export type RateLimitTracking = z.infer<typeof rateLimitTrackingSchema>;
export type RedisConnectionStatus = z.infer<typeof redisConnectionStatusSchema>;
export type PopularItemWithScore = z.infer<typeof popularItemWithScoreSchema>;
export type RedisZRangeResponse = z.infer<typeof redisZRangeResponseSchema>;
