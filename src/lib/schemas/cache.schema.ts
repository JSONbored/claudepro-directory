/**
 * Cache Operation Validation Schemas
 * Production-grade validation for Redis cache operations
 * Protects against cache poisoning and invalid data storage
 *
 * CLEANED - Removed 46 unused exports (80% waste eliminated)
 */

import { z } from "zod";
import {
  cacheKeyString,
  KEY_LIMITS,
} from "@/src/lib/schemas/primitives/api-cache-primitives";
import {
  nonNegativeInt,
  positiveInt,
  viewCount,
} from "@/src/lib/schemas/primitives/base-numbers";
import { slugString } from "@/src/lib/schemas/primitives/base-strings";

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
import { cacheableCategorySchema } from "./shared.schema";

/**
 * Cache category schema - extends cacheableCategorySchema with 'all_content'
 * for combined cache operations across all categories
 */
export const cacheCategorySchema = z
  .union([
    cacheableCategorySchema.describe("Cacheable content category"),
    z.literal("all_content").describe("All content types combined"),
  ])
  .describe(
    "Content category for cache operations, including individual categories and all_content aggregate",
  );

/**
 * Base cache key parameters
 */
export const cacheKeyParamsSchema = z
  .object({
    category: cacheCategorySchema.describe(
      "Content category for cache key construction",
    ),
    slug: slugString.describe("URL-safe content identifier"),
  })
  .describe("Parameters required to construct a cache key for content lookup");

/**
 * Popular items query schema
 */
export const popularItemsQuerySchema = z
  .object({
    category: cacheCategorySchema.describe(
      "Category to retrieve popular items from",
    ),
    limit: positiveInt
      .max(100)
      .default(10)
      .describe("Maximum number of items to return (1-100, default 10)"),
    offset: nonNegativeInt
      .max(1000)
      .optional()
      .default(0)
      .describe("Number of items to skip for pagination (0-1000, default 0)"),
  })
  .describe(
    "Query parameters for retrieving popular items from cache with pagination support",
  );

/**
 * Cache stats response schema
 */
export const cacheStatsSchema = z
  .object({
    totalViews: nonNegativeInt.describe(
      "Total view count across all cached content",
    ),
    totalCopies: nonNegativeInt.describe(
      "Total number of copy operations tracked",
    ),
    topCategories: z
      .array(
        z
          .object({
            category: cacheCategorySchema.describe("Content category"),
            views: viewCount.describe("View count for this category"),
          })
          .describe("Category with view count statistics"),
      )
      .describe("Most popular categories sorted by view count"),
    cacheHitRate: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe("Cache hit rate as decimal (0.0-1.0, optional)"),
    memoryUsage: nonNegativeInt
      .optional()
      .describe("Current memory usage in bytes (optional)"),
  })
  .describe(
    "Aggregated cache statistics including views, copies, and performance metrics",
  );

/**
 * Redis ZRANGE response validation (array with scores)
 */
const redisZRangeResponseSchema = z
  .array(
    z
      .union([
        z.string().describe("Member string value"),
        z.number().describe("Score numeric value"),
      ])
      .describe("Redis ZRANGE member-score pair element"),
  )
  .describe(
    "Raw Redis ZRANGE response array containing alternating member-score pairs",
  );

/**
 * Popular items with scores schema
 */
const popularItemWithScoreSchema = z
  .object({
    slug: cacheKeyString
      .max(KEY_LIMITS.MAX_SLUG_LENGTH)
      .describe("Content identifier slug from cache key"),
    views: viewCount
      .max(CACHE_LIMITS.MAX_VIEW_COUNT)
      .describe("Total view count for this item"),
  })
  .describe("Popular item with its slug identifier and view count");

/**
 * Cache invalidation operation result schema
 */
export const cacheInvalidationResultSchema = z
  .object({
    pattern: z.string().describe("Key pattern used for cache invalidation"),
    keysScanned: nonNegativeInt.describe("Total number of cache keys scanned"),
    keysDeleted: nonNegativeInt.describe(
      "Number of cache keys successfully deleted",
    ),
    scanCycles: positiveInt.describe("Number of SCAN iterations performed"),
    duration: z.number().min(0).describe("Operation duration in milliseconds"),
    rateLimited: z
      .boolean()
      .default(false)
      .describe("Whether operation was throttled due to rate limiting"),
  })
  .describe(
    "Results of a cache invalidation operation with performance metrics",
  );

/**
 * Rate limit tracking schema for production monitoring
 */
const rateLimitTrackingSchema = z
  .object({
    commandCount: nonNegativeInt.describe(
      "Current number of commands executed in time window",
    ),
    limitPerSecond: positiveInt.describe("Maximum commands allowed per second"),
    timeUntilReset: z
      .number()
      .min(0)
      .describe("Seconds until rate limit window resets"),
    isNearLimit: z
      .boolean()
      .describe("Whether current usage is approaching the rate limit"),
    utilizationPercent: z
      .number()
      .min(0)
      .max(100)
      .describe("Percentage of rate limit consumed (0-100)"),
  })
  .describe("Rate limit tracking metrics for Redis command throttling");

/**
 * Helper to safely parse Redis ZRANGE responses
 */
export function parseRedisZRangeResponse(
  items: unknown[],
): Array<{ slug: string; views: number }> {
  try {
    const validatedItems = redisZRangeResponseSchema.parse(items);
    const result: Array<{ slug: string; views: number }> = [];

    // Process pairs of [member, score]
    for (let i = 0; i < validatedItems.length; i += 2) {
      const slug = validatedItems[i];
      const score = validatedItems[i + 1];

      if (typeof slug === "string" && typeof score === "number") {
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
const redisConnectionStatusSchema = z
  .object({
    isConnected: z.boolean().describe("Whether Redis is currently connected"),
    isFallback: z
      .boolean()
      .describe("Whether using fallback mode (in-memory cache)"),
    lastConnectionAttempt: z
      .date()
      .nullable()
      .describe(
        "Timestamp of last connection attempt (null if never attempted)",
      ),
    consecutiveFailures: nonNegativeInt.describe(
      "Number of consecutive connection failures",
    ),
    totalOperations: nonNegativeInt.describe(
      "Total number of cache operations performed",
    ),
    failedOperations: nonNegativeInt.describe(
      "Number of failed cache operations",
    ),
  })
  .describe("Redis connection health status and operation metrics");

/**
 * Type exports (only used types)
 */
export type CacheCategory = z.infer<typeof cacheCategorySchema>;
export type CacheKeyParams = z.infer<typeof cacheKeyParamsSchema>;
export type PopularItemsQuery = z.infer<typeof popularItemsQuerySchema>;
export type CacheStats = z.infer<typeof cacheStatsSchema>;
export type CacheInvalidationResult = z.infer<
  typeof cacheInvalidationResultSchema
>;
export type RateLimitTracking = z.infer<typeof rateLimitTrackingSchema>;
export type RedisConnectionStatus = z.infer<typeof redisConnectionStatusSchema>;
export type PopularItemWithScore = z.infer<typeof popularItemWithScoreSchema>;
export type RedisZRangeResponse = z.infer<typeof redisZRangeResponseSchema>;
