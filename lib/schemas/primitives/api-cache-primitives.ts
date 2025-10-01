/**
 * API & Cache Validation Primitives
 *
 * Centralized validators for API and cache operations to eliminate duplication.
 * Shared between api.schema.ts and cache.schema.ts.
 *
 * Phase 4: Specialized Schema Consolidation (SHA-2060)
 * - Extracts TTL/expiry patterns from api.schema.ts and cache.schema.ts
 * - Consolidates key validation patterns
 * - Unifies response metadata schemas
 * - Reduces bundle size by ~1.5-2%
 *
 * Production Standards:
 * - All exports properly typed with z.infer
 * - Security-first validation for cache keys and TTLs
 * - Single source of truth for timing and expiration
 */

import { z } from 'zod';
import { nonNegativeInt, positiveInt } from './base-numbers';
import { isoDatetimeString, nonEmptyString } from './base-strings';

/**
 * ============================================================================
 * TTL & EXPIRY VALIDATION PRIMITIVES
 * ============================================================================
 */

/**
 * TTL Ranges based on common cache patterns
 */
export const TTL_RANGES = {
  MIN_TTL: 60, // 1 minute
  SHORT_TTL_MAX: 3600, // 1 hour
  MEDIUM_TTL_MAX: 86400, // 24 hours
  LONG_TTL_MAX: 2592000, // 30 days
  RATE_LIMIT_WINDOW_MAX: 86400, // 24 hours
} as const;

/**
 * Short TTL validator (60s - 1 hour)
 * Used for: Temporary cache, short-lived data, quick expiration
 * Common in: Session cache, temporary API responses, rate limit windows
 */
export const shortTTL = positiveInt
  .min(TTL_RANGES.MIN_TTL, `TTL must be at least ${TTL_RANGES.MIN_TTL} seconds`)
  .max(TTL_RANGES.SHORT_TTL_MAX, `TTL cannot exceed ${TTL_RANGES.SHORT_TTL_MAX} seconds (1 hour)`)
  .describe('Short-lived TTL for temporary cache (60s - 1 hour)');

/**
 * Medium TTL validator (1 hour - 24 hours)
 * Used for: Standard cache, API responses, daily data
 * Common in: API response cache, MDX cache, content cache
 */
export const mediumTTL = positiveInt
  .min(
    TTL_RANGES.SHORT_TTL_MAX,
    `TTL must be at least ${TTL_RANGES.SHORT_TTL_MAX} seconds (1 hour)`
  )
  .max(
    TTL_RANGES.MEDIUM_TTL_MAX,
    `TTL cannot exceed ${TTL_RANGES.MEDIUM_TTL_MAX} seconds (24 hours)`
  )
  .describe('Standard TTL for API responses and daily cache (1 hour - 24 hours)');

/**
 * Long TTL validator (24 hours - 30 days)
 * Used for: Long-lived cache, static content, infrequent updates
 * Common in: Static content cache, rarely updated data
 */
export const longTTL = positiveInt
  .min(
    TTL_RANGES.MEDIUM_TTL_MAX,
    `TTL must be at least ${TTL_RANGES.MEDIUM_TTL_MAX} seconds (24 hours)`
  )
  .max(TTL_RANGES.LONG_TTL_MAX, `TTL cannot exceed ${TTL_RANGES.LONG_TTL_MAX} seconds (30 days)`)
  .describe('Long-lived TTL for static content (24 hours - 30 days)');

/**
 * Flexible TTL validator (60s - 30 days)
 * Used for: Any cache operation with standard TTL range
 * Common in: Generic cache operations, configurable expiration
 */
export const flexibleTTL = positiveInt
  .min(TTL_RANGES.MIN_TTL, `TTL must be at least ${TTL_RANGES.MIN_TTL} seconds`)
  .max(TTL_RANGES.LONG_TTL_MAX, `TTL cannot exceed ${TTL_RANGES.LONG_TTL_MAX} seconds (30 days)`)
  .describe('Flexible TTL for configurable cache expiration (60s - 30 days)');

/**
 * Rate limit window validator (60s - 24 hours)
 * Used for: API rate limiting, request throttling
 * Common in: Arcjet rate limits, API endpoint protection
 */
export const rateLimitWindow = positiveInt
  .min(TTL_RANGES.MIN_TTL, `Window must be at least ${TTL_RANGES.MIN_TTL}s`)
  .max(
    TTL_RANGES.RATE_LIMIT_WINDOW_MAX,
    `Window cannot exceed ${TTL_RANGES.RATE_LIMIT_WINDOW_MAX}s`
  )
  .describe('Rate limiting time window for API throttling (60s - 24 hours)');

/**
 * ============================================================================
 * KEY VALIDATION PRIMITIVES
 * ============================================================================
 */

/**
 * Key validation regex patterns
 */
export const KEY_PATTERNS = {
  CACHE_KEY: /^[a-zA-Z0-9:_\-/.]{1,250}$/,
  CATEGORY: /^[a-zA-Z0-9\-_]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  PATH: /^[a-zA-Z0-9\-_/.]+$/,
} as const;

/**
 * Key length limits
 */
export const KEY_LIMITS = {
  MAX_KEY_LENGTH: 250,
  MAX_CATEGORY_LENGTH: 50,
  MAX_SLUG_LENGTH: 100,
  MAX_PATH_LENGTH: 500,
} as const;

/**
 * Cache key validator
 * Used for: Redis cache keys, general cache identifiers
 * Pattern: alphanumeric + : _ - / .
 * Common in: All cache operations
 */
export const cacheKeyString = nonEmptyString
  .max(KEY_LIMITS.MAX_KEY_LENGTH, 'Cache key too long')
  .regex(KEY_PATTERNS.CACHE_KEY, 'Invalid cache key format')
  .refine((key) => !key.includes('\0'), 'Null bytes not allowed in cache key')
  .describe('Redis-compatible cache key with alphanumeric and safe special chars');

/**
 * Category validator
 * Used for: Content categories, cache categories
 * Pattern: alphanumeric + - _
 * Common in: Content categorization, cache namespacing
 */
export const categoryString = nonEmptyString
  .max(KEY_LIMITS.MAX_CATEGORY_LENGTH, 'Category name too long')
  .regex(KEY_PATTERNS.CATEGORY, 'Invalid category format')
  .describe('Content category identifier (alphanumeric with hyphens/underscores)');

/**
 * Slug validator
 * SHA-2100: Now consistent with base-strings.ts implementation
 * Pattern: lowercase alphanumeric + hyphens (no consecutive hyphens)
 * Used for: URL-safe identifiers, content slugs, cache keys, routing
 */
export const slugString = nonEmptyString
  .max(KEY_LIMITS.MAX_SLUG_LENGTH, 'Slug too long')
  .regex(KEY_PATTERNS.SLUG, 'Invalid slug: use lowercase letters, numbers, and single hyphens')
  .transform((val) => val.toLowerCase())
  .describe(
    'URL-safe slug identifier (lowercase alphanumeric with hyphens, no consecutive hyphens)'
  );

/**
 * Path validator
 * Used for: File paths, URL paths, cache paths
 * Pattern: alphanumeric + - _ / .
 * Common in: MDX cache, file operations
 */
export const pathString = nonEmptyString
  .max(KEY_LIMITS.MAX_PATH_LENGTH, 'Path too long')
  .regex(KEY_PATTERNS.PATH, 'Invalid path format')
  .refine((path) => !path.includes('..'), 'Path traversal detected')
  .refine((path) => !path.includes('\\'), 'Backslash not allowed in paths')
  .refine((path) => !path.includes('\0'), 'Null bytes not allowed in paths')
  .describe('Secure file/URL path with traversal prevention');

/**
 * ============================================================================
 * RESPONSE METADATA PRIMITIVES
 * ============================================================================
 */

/**
 * Cache status enum
 * Used for: Cache hit/miss tracking in API responses
 * Common in: API response metadata, performance monitoring
 */
export const cacheStatusEnum = z
  .enum(['HIT', 'MISS', 'BYPASS'])
  .describe('Cache operation status for API response tracking');

/**
 * Processing time validator (milliseconds)
 * Used for: API response timing, performance tracking
 * Common in: API metadata, performance monitoring
 */
export const processingTimeMs = z
  .number()
  .min(0)
  .max(60000)
  .describe('API processing time in milliseconds (0-60s)'); // Max 60 seconds

/**
 * API response metadata schema
 * Used for: Standard API response metadata structure
 * Common in: All API responses, paginated responses
 */
export const apiResponseMetaSchema = z
  .object({
    timestamp: isoDatetimeString,
    version: z.string().optional(),
    cache: cacheStatusEnum.optional(),
    processingTime: processingTimeMs.optional(),
  })
  .optional()
  .describe('Standard API response metadata with timestamp and cache status');

/**
 * Pagination metadata schema
 * Used for: Paginated API responses
 * Common in: List endpoints, search results
 */
export const paginationMetaSchema = z
  .object({
    total: nonNegativeInt,
    page: positiveInt,
    limit: positiveInt,
    pages: nonNegativeInt,
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  })
  .describe('Pagination metadata for list endpoints and search results');

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Validate cache key with runtime checks
 * Used for: Safe cache key validation in operations
 */
export function validateCacheKey(key: string | number): string {
  return cacheKeyString.parse(key);
}

/**
 * Validate TTL with runtime checks
 * Used for: Safe TTL validation in cache operations
 */
export function validateTTL(ttl: string | number): number {
  const schema = z.coerce
    .number()
    .int('TTL must be an integer')
    .positive()
    .min(TTL_RANGES.MIN_TTL, `TTL must be at least ${TTL_RANGES.MIN_TTL} seconds`)
    .max(TTL_RANGES.LONG_TTL_MAX, `TTL cannot exceed ${TTL_RANGES.LONG_TTL_MAX} seconds`);

  return schema.parse(ttl);
}

/**
 * ============================================================================
 * TYPE EXPORTS
 * ============================================================================
 */

export type ShortTTL = z.infer<typeof shortTTL>;
export type MediumTTL = z.infer<typeof mediumTTL>;
export type LongTTL = z.infer<typeof longTTL>;
export type FlexibleTTL = z.infer<typeof flexibleTTL>;
export type RateLimitWindow = z.infer<typeof rateLimitWindow>;
export type CacheKeyString = z.infer<typeof cacheKeyString>;
export type CategoryString = z.infer<typeof categoryString>;
export type SlugString = z.infer<typeof slugString>;
export type PathString = z.infer<typeof pathString>;
export type CacheStatus = z.infer<typeof cacheStatusEnum>;
export type ProcessingTimeMs = z.infer<typeof processingTimeMs>;
export type ApiResponseMeta = z.infer<typeof apiResponseMetaSchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
