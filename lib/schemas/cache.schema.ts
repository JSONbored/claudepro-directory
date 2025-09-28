/**
 * Cache Operation Validation Schemas
 * Production-grade validation for Redis cache operations
 * Protects against cache poisoning and invalid data storage
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import type { ContentIndex, ContentItem } from '@/lib/related-content/service';

/**
 * Security constants for cache operations
 */
const CACHE_LIMITS = {
  MAX_KEY_LENGTH: 250,
  MAX_CATEGORY_LENGTH: 50,
  MAX_SLUG_LENGTH: 100,
  MAX_PATH_LENGTH: 500,
  MAX_CONTENT_LENGTH: 10485760, // 10MB
  MAX_TTL: 2592000, // 30 days in seconds
  MIN_TTL: 60, // 1 minute
  MAX_VIEW_COUNT: 9999999999,
  MAX_BATCH_SIZE: 100,
  MAX_SCORE: 999999999999,
  MAX_MEMBERS: 1000,
} as const;

/**
 * Cache key patterns for validation
 */
const KEY_PATTERNS = {
  CACHE_KEY: /^[a-zA-Z0-9:_\-/.]{1,250}$/,
  CATEGORY: /^[a-zA-Z0-9\-_]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  PATH: /^[a-zA-Z0-9\-_/.]+$/,
} as const;

/**
 * Content category enum for cache operations
 */
export const cacheCategorySchema = z.enum([
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'guides',
  'jobs',
  'all_content', // Special category for combined content operations
]);

/**
 * Base cache key parameters
 */
export const cacheKeyParamsSchema = z.object({
  category: cacheCategorySchema,
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(CACHE_LIMITS.MAX_SLUG_LENGTH)
    .regex(KEY_PATTERNS.SLUG, 'Invalid slug format')
    .transform((val) => val.toLowerCase()),
});

/**
 * View tracking schema
 */
export const viewTrackingSchema = z.object({
  category: cacheCategorySchema,
  slug: z
    .string()
    .min(1)
    .max(CACHE_LIMITS.MAX_SLUG_LENGTH)
    .regex(KEY_PATTERNS.SLUG, 'Invalid slug format'),
  timestamp: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(() => Date.now()),
});

/**
 * View count response schema
 */
export const viewCountResponseSchema = z.object({
  count: z.number().int().min(0).max(CACHE_LIMITS.MAX_VIEW_COUNT),
  category: cacheCategorySchema.optional(),
  slug: z.string().optional(),
});

/**
 * Cache trending item schema
 */
export const cacheTrendingItemSchema = z.object({
  slug: z.string(),
  score: z.number().min(0).max(CACHE_LIMITS.MAX_SCORE),
  views: z.number().int().min(0).optional(),
  lastUpdated: z.number().int().min(0).optional(),
});

/**
 * Popular items query schema
 */
export const popularItemsQuerySchema = z.object({
  category: cacheCategorySchema,
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).max(1000).optional().default(0),
});

/**
 * MDX cache schema
 */
export const mdxCacheSchema = z.object({
  path: z
    .string()
    .min(1, 'Path is required')
    .max(CACHE_LIMITS.MAX_PATH_LENGTH)
    .regex(KEY_PATTERNS.PATH, 'Invalid path format')
    .refine((path) => !path.includes('..'), 'Path traversal detected'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(CACHE_LIMITS.MAX_CONTENT_LENGTH, 'Content exceeds maximum size'),
  ttl: z
    .number()
    .int()
    .min(CACHE_LIMITS.MIN_TTL, `TTL must be at least ${CACHE_LIMITS.MIN_TTL} seconds`)
    .max(CACHE_LIMITS.MAX_TTL, `TTL cannot exceed ${CACHE_LIMITS.MAX_TTL} seconds`)
    .optional()
    .default(86400), // 24 hours default
});

/**
 * API response cache schema
 */
export const apiResponseCacheSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(CACHE_LIMITS.MAX_KEY_LENGTH)
    .regex(KEY_PATTERNS.CACHE_KEY, 'Invalid cache key format'),
  data: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
    z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  ]), // Will be JSON stringified
  ttl: z
    .number()
    .int()
    .min(CACHE_LIMITS.MIN_TTL)
    .max(CACHE_LIMITS.MAX_TTL)
    .optional()
    .default(3600), // 1 hour default
  tags: z.array(z.string().max(50)).max(20).optional(),
});

/**
 * Batch operation schema
 */
export const batchOperationSchema = z.object({
  operations: z
    .array(
      z.object({
        type: z.enum(['set', 'get', 'del', 'incr', 'zadd']),
        key: z.string().max(CACHE_LIMITS.MAX_KEY_LENGTH),
        value: z
          .union([
            z.string(),
            z.number(),
            z.boolean(),
            z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
          ])
          .optional(),
        ttl: z.number().int().min(0).max(CACHE_LIMITS.MAX_TTL).optional(),
        score: z.number().optional(),
        member: z.string().optional(),
      })
    )
    .min(1, 'At least one operation is required')
    .max(
      CACHE_LIMITS.MAX_BATCH_SIZE,
      `Maximum ${CACHE_LIMITS.MAX_BATCH_SIZE} operations per batch`
    ),
});

/**
 * Cache stats response schema
 */
export const cacheStatsSchema = z.object({
  totalViews: z.number().int().min(0),
  totalCopies: z.number().int().min(0),
  topCategories: z.array(
    z.object({
      category: cacheCategorySchema,
      views: z.number().int().min(0),
    })
  ),
  cacheHitRate: z.number().min(0).max(1).optional(),
  memoryUsage: z.number().int().min(0).optional(),
});

/**
 * Related items cache schema
 */
export const relatedItemsCacheSchema = z.object({
  category: cacheCategorySchema,
  slug: z.string(),
  relatedItems: z
    .array(
      z.object({
        slug: z.string(),
        title: z.string().optional(),
        score: z.number().min(0).max(1),
      })
    )
    .max(50),
  ttl: z.number().int().min(CACHE_LIMITS.MIN_TTL).max(CACHE_LIMITS.MAX_TTL).optional(),
});

/**
 * Search results cache schema
 */
export const searchResultsCacheSchema = z.object({
  query: z.string().min(1).max(200),
  category: cacheCategorySchema.optional(),
  results: z
    .array(
      z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
      ])
    )
    .max(CACHE_LIMITS.MAX_MEMBERS),
  totalCount: z.number().int().min(0),
  ttl: z.number().int().min(60).max(3600).optional().default(600), // 10 minutes default
});

/**
 * Cleanup parameters schema
 */
export const cleanupParamsSchema = z.object({
  categories: z.array(cacheCategorySchema).optional(),
  olderThan: z.number().int().min(0).optional(),
  pattern: z.string().max(100).optional(),
  dryRun: z.boolean().optional().default(false),
});

/**
 * Helper function to validate cache key
 */
export function validateCacheKey(key: string | number): string {
  const schema = z
    .string()
    .min(1, 'Cache key is required')
    .max(CACHE_LIMITS.MAX_KEY_LENGTH, 'Cache key too long')
    .regex(KEY_PATTERNS.CACHE_KEY, 'Invalid cache key format')
    .refine((key) => !key.includes('\0'), 'Null bytes not allowed in cache key');

  return schema.parse(key);
}

/**
 * Helper function to validate TTL
 */
export function validateTTL(ttl: string | number): number {
  const schema = z.coerce
    .number()
    .int('TTL must be an integer')
    .min(CACHE_LIMITS.MIN_TTL, `TTL must be at least ${CACHE_LIMITS.MIN_TTL} seconds`)
    .max(CACHE_LIMITS.MAX_TTL, `TTL cannot exceed ${CACHE_LIMITS.MAX_TTL} seconds`);

  return schema.parse(ttl);
}

/**
 * Cache content metadata schema
 */
export const cacheContentMetadataSchema = z
  .object({
    items: z
      .array(
        z.union([
          z.string(),
          z.number(),
          z.boolean(),
          z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
        ])
      )
      .optional(),
    lastUpdated: z.string().datetime().optional(),
    count: z.number().int().min(0).optional(),
    metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  })
  .passthrough(); // Allow additional fields

/**
 * Generic cached API response schema
 */
const baseValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const cachedApiResponseSchema = z.union([
  z.object({
    data: z.union([
      baseValueSchema,
      z.array(baseValueSchema),
      z.record(z.string(), baseValueSchema),
    ]),
    timestamp: z.number().optional(),
    version: z.string().optional(),
  }),
  z.array(baseValueSchema),
  z.record(z.string(), baseValueSchema),
  z.string(),
  z.number(),
  z.boolean(),
]);

/**
 * Cached string data schema (compressed or uncompressed JSON)
 */
export const cachedStringSchema = z.string().min(0).max(CACHE_LIMITS.MAX_CONTENT_LENGTH);

/**
 * Cache parse result schema
 */
export const cacheParseResultSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([
    z.object({ success: z.literal(true), data: schema }),
    z.object({ success: z.literal(false), error: z.string() }),
  ]);

/**
 * Helper to safely parse cached JSON data with logging
 */
export function parseCachedJSON<T>(
  data: string,
  schema: z.ZodSchema<T>,
  context?: { key?: string; operation?: string }
): { success: true; data: T } | { success: false; error: string } {
  try {
    // First validate the raw data string
    const validatedData = cachedStringSchema.parse(data);

    // Parse JSON safely
    const parsed = JSON.parse(validatedData);

    // Validate against schema
    const result = schema.parse(parsed);
    return { success: true, data: result };
  } catch (error) {
    logger.error(
      'Failed to parse cached JSON',
      error instanceof Error ? error : new Error(String(error)),
      {
        contextKeys: String(Object.keys(context || {}).length),
        dataLength: String(data?.length || 0),
        dataPreview: String(data?.slice(0, 100) || ''),
      }
    );
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Helper to safely parse generic cached data without specific schema
 */
export function parseGenericCachedJSON(
  data: string,
  context?: { key?: string; operation?: string }
):
  | { success: true; data: z.infer<typeof cachedApiResponseSchema> }
  | { success: false; error: string } {
  return parseCachedJSON(data, cachedApiResponseSchema, context);
}

/**
 * Redis ZRANGE response validation (array with scores)
 */
export const redisZRangeResponseSchema = z.array(z.union([z.string(), z.number()]));

/**
 * Popular items with scores schema
 */
export const popularItemWithScoreSchema = z.object({
  slug: z.string().min(1).max(CACHE_LIMITS.MAX_SLUG_LENGTH),
  views: z.number().int().min(0).max(CACHE_LIMITS.MAX_VIEW_COUNT),
});

/**
 * Batch increment operations schema
 */
export const batchIncrementOperationSchema = z.object({
  key: z.string().max(CACHE_LIMITS.MAX_KEY_LENGTH),
  increment: z.number().int().min(1).max(1000).optional().default(1),
});

/**
 * Redis SCAN operation parameters schema for production security
 */
export const redisScanParamsSchema = z.object({
  cursor: z.string().regex(/^\d+$/, 'Cursor must be numeric string').default('0'),
  pattern: z
    .string()
    .min(1, 'Pattern is required')
    .max(100, 'Pattern too long')
    .regex(
      /^[a-zA-Z0-9:_\-/*]+$/,
      'Invalid pattern format - only alphanumeric, :, _, -, / and * allowed'
    )
    .refine(
      (pattern) => !(pattern.includes('../') || pattern.includes('..\\')),
      'Path traversal patterns not allowed'
    )
    .refine((pattern) => pattern.split('*').length <= 3, 'Too many wildcards - maximum 2 allowed'),
  count: z.number().int().min(1).max(1000).default(100),
});

/**
 * Redis SCAN response validation schema
 */
export const redisScanResponseSchema = z.tuple([
  z
    .string()
    .regex(/^\d+$/, 'Cursor must be numeric string'), // Next cursor
  z
    .array(z.string().max(CACHE_LIMITS.MAX_KEY_LENGTH))
    .max(1000), // Keys array
]);

/**
 * Cache invalidation operation result schema
 */
export const cacheInvalidationResultSchema = z.object({
  pattern: z.string(),
  keysScanned: z.number().int().min(0),
  keysDeleted: z.number().int().min(0),
  scanCycles: z.number().int().min(1),
  duration: z.number().min(0),
  rateLimited: z.boolean().default(false),
});

/**
 * Rate limit tracking schema for production monitoring
 */
export const rateLimitTrackingSchema = z.object({
  commandCount: z.number().int().min(0),
  limitPerSecond: z.number().int().min(1),
  timeUntilReset: z.number().min(0),
  isNearLimit: z.boolean(),
  utilizationPercent: z.number().min(0).max(100),
});

// Auto-generated type exports
export type MdxCache = z.infer<typeof mdxCacheSchema>;
export type ApiResponseCache = z.infer<typeof apiResponseCacheSchema>;

/**
 * Helper to safely parse Redis ZRANGE responses
 */
export function parseRedisZRangeResponse(
  items: unknown[],
  context?: { operation?: string; key?: string }
): Array<{ slug: string; views: number }> {
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
  } catch (error) {
    logger.error(
      'Failed to parse Redis ZRANGE response',
      error instanceof Error
        ? error
        : new Error(error instanceof z.ZodError ? error.issues.join(', ') : String(error)),
      {
        contextKeys: String(Object.keys(context || {}).length),
        itemsLength: String(Array.isArray(items) ? items.length : 0),
        itemsType: String(typeof items),
      }
    );
    return [];
  }
}

/**
 * Helper to validate batch increment operations
 */
export function validateBatchIncrements(
  operations: Array<{ key: string; increment?: number }>
): Array<z.infer<typeof batchIncrementOperationSchema>> {
  return operations
    .map((op) => {
      try {
        return batchIncrementOperationSchema.parse(op);
      } catch (error) {
        logger.error(
          'Invalid batch increment operation',
          error instanceof Error
            ? error
            : new Error(error instanceof z.ZodError ? error.issues.join(', ') : String(error)),
          {
            operationType: String(typeof op),
          }
        );
        return null;
      }
    })
    .filter(Boolean) as Array<z.infer<typeof batchIncrementOperationSchema>>;
}

/**
 * Content transformation schema for cache storage
 * Transforms ContentIndex items to cache-compatible format
 */
export const contentIndexToCacheSchema = z.object({
  items: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.string(),
      url: z.string(),
      tags: z.string().default(''), // Transform from string[] to comma-separated string
      keywords: z.string().default(''), // Transform from string[] to comma-separated string
      popularity: z.number().default(0),
      dateAdded: z.string(),
      dateUpdated: z.string(),
      dateCreated: z.string(),
      featured: z.boolean().default(false),
    })
  ),
  lastUpdated: z.string().datetime(),
  count: z.number().int().min(0),
});

/**
 * Function to transform ContentIndex to cache format
 */
export function transformContentIndexForCache(index: ContentIndex) {
  return contentIndexToCacheSchema.parse({
    items: index.items.map((item: ContentItem) => ({
      ...item,
      tags: Array.isArray(item.tags) ? item.tags.join(',') : item.tags || '',
      keywords: Array.isArray(item.keywords) ? item.keywords.join(',') : item.keywords || '',
    })),
    lastUpdated: new Date().toISOString(),
    count: index.items.length,
  });
}

/**
 * Type exports
 */
export type CacheCategory = z.infer<typeof cacheCategorySchema>;
export type CacheKeyParams = z.infer<typeof cacheKeyParamsSchema>;
export type ViewTracking = z.infer<typeof viewTrackingSchema>;
export type CacheTrendingItem = z.infer<typeof cacheTrendingItemSchema>;
export type MDXCache = z.infer<typeof mdxCacheSchema>;
export type APIResponseCache = z.infer<typeof apiResponseCacheSchema>;
export type BatchOperation = z.infer<typeof batchOperationSchema>;
export type CacheStats = z.infer<typeof cacheStatsSchema>;
export type RelatedItemsCache = z.infer<typeof relatedItemsCacheSchema>;
export type SearchResultsCache = z.infer<typeof searchResultsCacheSchema>;
export type CleanupParams = z.infer<typeof cleanupParamsSchema>;
export type CacheContentMetadata = z.infer<typeof cacheContentMetadataSchema>;
export type CachedApiResponse = z.infer<typeof cachedApiResponseSchema>;
export type PopularItemWithScore = z.infer<typeof popularItemWithScoreSchema>;
export type BatchIncrementOperation = z.infer<typeof batchIncrementOperationSchema>;
export type ViewCountResponse = z.infer<typeof viewCountResponseSchema>;
export type PopularItemsQuery = z.infer<typeof popularItemsQuerySchema>;
export type CachedString = z.infer<typeof cachedStringSchema>;
export type RedisZRangeResponse = z.infer<typeof redisZRangeResponseSchema>;
export type RedisScanParams = z.infer<typeof redisScanParamsSchema>;
export type RedisScanResponse = z.infer<typeof redisScanResponseSchema>;
export type CacheInvalidationResult = z.infer<typeof cacheInvalidationResultSchema>;
export type RateLimitTracking = z.infer<typeof rateLimitTrackingSchema>;

/**
 * Redis connection status schema
 */
export const redisConnectionStatusSchema = z.object({
  isConnected: z.boolean(),
  isFallback: z.boolean(),
  lastConnectionAttempt: z.date().nullable(),
  consecutiveFailures: z.number().int().min(0),
  totalOperations: z.number().int().min(0),
  failedOperations: z.number().int().min(0),
});

export type RedisConnectionStatus = z.infer<typeof redisConnectionStatusSchema>;
