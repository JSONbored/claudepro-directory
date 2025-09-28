/**
 * Cache Warmer Validation Schemas
 * Production-grade validation for cache warming operations
 * Ensures secure and efficient cache pre-loading
 */

import { z } from 'zod';

/**
 * Security constants for cache warming
 */
const CACHE_WARMER_LIMITS = {
  MAX_ITEMS_PER_CATEGORY: 100,
  MAX_CATEGORIES: 20,
  MAX_QUERY_LENGTH: 100,
  MAX_PATH_LENGTH: 500,
  MAX_SLUG_LENGTH: 200,
  MIN_TTL: 60, // 1 minute
  MAX_TTL: 604800, // 7 days
  MAX_BATCH_SIZE: 50,
  MAX_COMMON_QUERIES: 100,
} as const;

/**
 * Valid content categories for warming
 */
export const warmableCategorySchema = z.enum([
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'guides',
  'jobs',
]);

/**
 * Cache warming item schema
 */
export const cacheWarmingItemSchema = z.object({
  category: warmableCategorySchema,
  slug: z
    .string()
    .min(1)
    .max(CACHE_WARMER_LIMITS.MAX_SLUG_LENGTH)
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid slug format'),
  priority: z.number().min(0).max(10).optional(),
  ttl: z
    .number()
    .int()
    .min(CACHE_WARMER_LIMITS.MIN_TTL)
    .max(CACHE_WARMER_LIMITS.MAX_TTL)
    .optional(),
});

/**
 * Popular item from Redis for cache warming
 */
export const cacheWarmerPopularItemSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(CACHE_WARMER_LIMITS.MAX_SLUG_LENGTH)
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid slug format'),
  views: z.number().int().min(0),
});

/**
 * Category metadata schema
 */
export const categoryMetadataSchema = z.object({
  name: warmableCategorySchema,
  items: z
    .array(
      z.object({
        slug: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .max(CACHE_WARMER_LIMITS.MAX_ITEMS_PER_CATEGORY),
});

/**
 * Related content warming config
 */
export const relatedContentWarmingSchema = z.object({
  path: z
    .string()
    .min(1)
    .max(CACHE_WARMER_LIMITS.MAX_PATH_LENGTH)
    .regex(/^\/[a-zA-Z0-9\-_/]*$/, 'Invalid path format')
    .refine((path) => !path.includes('..'), 'Path traversal detected'),
  category: warmableCategorySchema.default('agents'),
  tags: z.array(z.string()).max(50).default([]),
  keywords: z.array(z.string()).max(50).default([]),
  limit: z.number().int().min(1).max(20).default(6),
});

/**
 * Common search query schema
 */
export const commonQuerySchema = z
  .string()
  .min(1)
  .max(CACHE_WARMER_LIMITS.MAX_QUERY_LENGTH)
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Invalid query format')
  .transform((val) => val.toLowerCase().trim());

/**
 * Cache warming status schema
 */
export const cacheWarmingStatusSchema = z.object({
  lastRun: z.string().datetime(),
  itemsWarmed: z.number().int().min(0),
  errors: z.number().int().min(0),
  duration: z.number().int().min(0),
  isWarming: z.boolean().optional(),
  nextScheduledRun: z.string().datetime().optional(),
});

/**
 * Cache warming result schema
 */
export const cacheWarmingResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  itemsWarmed: z.number().int().min(0).optional(),
  errors: z.number().int().min(0).optional(),
  duration: z.number().int().min(0).optional(),
});

/**
 * Cache warming configuration
 */
export const cacheWarmingConfigSchema = z.object({
  enabled: z.boolean().default(true),
  scheduleInterval: z.number().int().min(3600000).max(86400000).default(21600000), // 1h to 24h, default 6h
  offPeakHours: z
    .object({
      startHour: z.number().int().min(0).max(23).default(0),
      endHour: z.number().int().min(0).max(23).default(6),
    })
    .optional(),
  maxItemsPerCategory: z
    .number()
    .int()
    .min(1)
    .max(CACHE_WARMER_LIMITS.MAX_ITEMS_PER_CATEGORY)
    .default(10),
  categories: z.array(warmableCategorySchema).optional(),
  commonQueries: z.array(commonQuerySchema).max(CACHE_WARMER_LIMITS.MAX_COMMON_QUERIES).optional(),
});

/**
 * Cached content schema
 */
export const cachedContentSchema = z.object({
  category: warmableCategorySchema,
  slug: z.string(),
  warmed: z.boolean(),
  timestamp: z.string().datetime(),
  ttl: z.number().int().min(0).optional(),
  size: z.number().int().min(0).optional(),
});

/**
 * Batch warming request schema
 */
export const batchWarmingRequestSchema = z.object({
  items: z.array(cacheWarmingItemSchema).min(1).max(CACHE_WARMER_LIMITS.MAX_BATCH_SIZE),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  force: z.boolean().default(false),
});

/**
 * Helper function to validate warming item
 */
export function validateWarmingItem(item: unknown): z.infer<typeof cacheWarmingItemSchema> {
  return cacheWarmingItemSchema.parse(item);
}

/**
 * Helper function to validate warming config
 */
export function validateWarmingConfig(config: unknown): z.infer<typeof cacheWarmingConfigSchema> {
  return cacheWarmingConfigSchema.parse(config);
}

/**
 * Helper function to validate common queries
 */
export function validateCommonQueries(queries: unknown[]): string[] {
  return z.array(commonQuerySchema).parse(queries);
}

/**
 * Type exports
 */
export type WarmableCategory = z.infer<typeof warmableCategorySchema>;
export type CacheWarmingItem = z.infer<typeof cacheWarmingItemSchema>;
export type CacheWarmerPopularItem = z.infer<typeof cacheWarmerPopularItemSchema>;
export type CategoryMetadata = z.infer<typeof categoryMetadataSchema>;
export type RelatedContentWarming = z.infer<typeof relatedContentWarmingSchema>;
export type CacheWarmingStatus = z.infer<typeof cacheWarmingStatusSchema>;
export type CacheWarmingResult = z.infer<typeof cacheWarmingResultSchema>;
export type CacheWarmingConfig = z.infer<typeof cacheWarmingConfigSchema>;
export type CachedContent = z.infer<typeof cachedContentSchema>;
export type BatchWarmingRequest = z.infer<typeof batchWarmingRequestSchema>;
