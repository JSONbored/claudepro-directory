/**
 * Related Content Validation Schemas
 * Production-grade validation for content relationships and recommendations
 * Protects against malicious content injection and ensures data integrity
 */

import { z } from 'zod';

/**
 * Security-focused constants for related content
 */
const RELATED_LIMITS = {
  MAX_RESULTS: 50,
  MIN_SCORE: 0.0,
  MAX_SCORE: 10.0,
  MAX_TAG_LENGTH: 50,
  MAX_TAGS: 100,
  MAX_KEYWORD_LENGTH: 100,
  MAX_KEYWORDS: 50,
  MAX_PATH_LENGTH: 500,
  MAX_URL_LENGTH: 2048,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_SLUG_LENGTH: 200,
  MAX_CATEGORY_LENGTH: 50,
} as const;

/**
 * Valid content categories
 */
export const contentCategorySchema = z.enum([
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'guides',
  'tutorials',
  'comparisons',
  'workflows',
  'use-cases',
  'troubleshooting',
  'jobs',
]);

/**
 * Algorithm weight configuration
 */
export const algorithmWeightsSchema = z.object({
  sameCategory: z.number().min(0).max(1).default(0.15),
  tagMatch: z.number().min(0).max(1).default(0.35),
  keywordMatch: z.number().min(0).max(1).default(0.25),
  trending: z.number().min(0).max(1).default(0.15),
  popular: z.number().min(0).max(1).default(0.05),
  recency: z.number().min(0).max(1).default(0.05),
});

/**
 * Algorithm boost configuration
 */
export const algorithmBoostsSchema = z.object({
  featured: z.number().min(1).max(3).default(1.5),
  recentlyUpdated: z.number().int().min(1).max(30).default(7),
});

/**
 * Algorithm limits configuration
 */
export const algorithmLimitsSchema = z.object({
  maxResults: z.number().int().min(1).max(RELATED_LIMITS.MAX_RESULTS).default(6),
  minScore: z.number().min(RELATED_LIMITS.MIN_SCORE).max(1).default(0.02),
});

/**
 * Full algorithm configuration
 */
export const algorithmConfigSchema = z.object({
  weights: algorithmWeightsSchema,
  boosts: algorithmBoostsSchema,
  limits: algorithmLimitsSchema,
});

/**
 * Content item schema
 */
export const contentItemSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(RELATED_LIMITS.MAX_SLUG_LENGTH)
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid slug format'),
  title: z.string().min(1).max(RELATED_LIMITS.MAX_TITLE_LENGTH),
  description: z.string().max(RELATED_LIMITS.MAX_DESCRIPTION_LENGTH).optional(),
  category: contentCategorySchema,
  url: z
    .string()
    .max(RELATED_LIMITS.MAX_URL_LENGTH)
    .regex(/^\/[a-zA-Z0-9\-_/]*$/, 'Invalid URL format')
    .refine((url) => !url.includes('..'), 'Path traversal detected'),
  tags: z
    .array(
      z
        .string()
        .min(1)
        .max(RELATED_LIMITS.MAX_TAG_LENGTH)
        .regex(/^[a-zA-Z0-9\-_\s.,()/:]+$/, 'Invalid tag format')
    )
    .max(RELATED_LIMITS.MAX_TAGS)
    .optional(),
  keywords: z
    .array(
      z
        .string()
        .min(1)
        .max(RELATED_LIMITS.MAX_KEYWORD_LENGTH)
        .regex(/^[a-zA-Z0-9\-_\s.,()/:]+$/, 'Invalid keyword format')
    )
    .max(RELATED_LIMITS.MAX_KEYWORDS)
    .optional(),
  dateCreated: z
    .string()
    .refine((date) => {
      // Accept ISO datetime (2025-09-16T00:00:00.000Z) or YYYY-MM-DD format
      const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
      return isoDateTimeRegex.test(date) || dateOnlyRegex.test(date);
    }, 'Invalid date format - expected ISO datetime or YYYY-MM-DD')
    .optional(),
  dateUpdated: z
    .string()
    .refine((date) => {
      // Accept ISO datetime (2025-09-16T00:00:00.000Z) or YYYY-MM-DD format
      const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
      return isoDateTimeRegex.test(date) || dateOnlyRegex.test(date);
    }, 'Invalid date format - expected ISO datetime or YYYY-MM-DD')
    .optional(),
  featured: z.boolean().optional(),
  priority: z.number().min(0).max(10).optional(),
});

/**
 * Related content configuration
 */
export const relatedContentConfigSchema = z.object({
  currentPath: z
    .string()
    .transform((val) => val.trim() || '/')
    .refine((path) => path === '/' || path.startsWith('/'), 'Path must start with /')
    .refine((path) => path.length <= RELATED_LIMITS.MAX_PATH_LENGTH, 'Path too long')
    .refine((path) => !path.includes('..'), 'Path traversal detected'),
  currentCategory: contentCategorySchema.optional(),
  currentTags: z
    .array(z.string())
    .transform((tags) => tags.filter((tag) => tag.trim().length > 0))
    .pipe(
      z
        .array(
          z
            .string()
            .min(1)
            .max(RELATED_LIMITS.MAX_TAG_LENGTH)
            .regex(/^[a-zA-Z0-9\-_\s.,()/:]+$/, 'Invalid tag format')
        )
        .max(RELATED_LIMITS.MAX_TAGS)
    )
    .optional(),
  currentKeywords: z
    .array(z.string())
    .transform((keywords) => keywords.filter((kw) => kw.trim().length > 0))
    .pipe(
      z
        .array(
          z
            .string()
            .min(1)
            .max(RELATED_LIMITS.MAX_KEYWORD_LENGTH)
            .regex(/^[a-zA-Z0-9\-_\s.,()/:]+$/, 'Invalid keyword format')
        )
        .max(RELATED_LIMITS.MAX_KEYWORDS)
    )
    .optional(),
  featured: z
    .array(z.string())
    .transform((items) => items.filter((item) => item.trim().length > 0))
    .pipe(
      z
        .array(
          z
            .string()
            .min(1)
            .max(RELATED_LIMITS.MAX_SLUG_LENGTH)
            .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid slug format')
        )
        .max(10)
    )
    .optional(),
  exclude: z
    .array(z.string())
    .transform((items) => items.filter((item) => item.trim().length > 0))
    .pipe(
      z
        .array(
          z
            .string()
            .min(1)
            .max(RELATED_LIMITS.MAX_SLUG_LENGTH)
            .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid slug format')
        )
        .max(50)
    )
    .optional(),
  limit: z.number().int().min(1).max(RELATED_LIMITS.MAX_RESULTS).optional(),
  algorithm: algorithmConfigSchema.partial().optional(),
});

/**
 * Individual score components
 */
export const scoreComponentsSchema = z.object({
  category: z.number().min(0).max(RELATED_LIMITS.MAX_SCORE),
  tags: z.number().min(0).max(RELATED_LIMITS.MAX_SCORE),
  keywords: z.number().min(0).max(RELATED_LIMITS.MAX_SCORE),
  trending: z.number().min(0).max(RELATED_LIMITS.MAX_SCORE),
  popularity: z.number().min(0).max(RELATED_LIMITS.MAX_SCORE),
  recency: z.number().min(0).max(RELATED_LIMITS.MAX_SCORE),
  featured: z.number().min(0).max(RELATED_LIMITS.MAX_SCORE),
  total: z
    .number()
    .min(0)
    .max(RELATED_LIMITS.MAX_SCORE * 7), // Sum of all components
});

/**
 * Debug information for development
 */
export const debugInfoSchema = z.object({
  matchedTags: z.array(z.string()).optional(),
  matchedKeywords: z.array(z.string()).optional(),
  daysSinceUpdate: z.number().optional(),
  viewCount: z.number().int().min(0).optional(),
});

/**
 * Scoring result schema
 */
export const scoringResultSchema = z.object({
  item: contentItemSchema,
  scores: scoreComponentsSchema,
  debug: debugInfoSchema.optional(),
});

/**
 * Match type enum
 */
export const matchTypeSchema = z.enum([
  'same_category',
  'tag_match',
  'keyword_match',
  'trending',
  'popular',
  'featured',
  'cross_category',
]);

/**
 * Related content item (final result)
 */
export const relatedContentItemSchema = contentItemSchema.extend({
  score: z.number().min(RELATED_LIMITS.MIN_SCORE).max(RELATED_LIMITS.MAX_SCORE),
  matchType: matchTypeSchema,
  matchDetails: z
    .object({
      matchedTags: z.array(z.string()).optional(),
      matchedKeywords: z.array(z.string()).optional(),
      viewCount: z.number().int().min(0).optional(),
    })
    .optional(),
});

/**
 * Related content performance metrics
 */
export const relatedContentPerformanceMetricsSchema = z.object({
  fetchTime: z.number().int().min(0).max(30000), // Max 30s
  cacheHit: z.boolean(),
  itemCount: z.number().int().min(0).max(RELATED_LIMITS.MAX_RESULTS),
  algorithmVersion: z.string().regex(/^v\d+\.\d+\.\d+$/, 'Invalid version format'),
});

/**
 * Related content response
 */
export const relatedContentResponseSchema = z.object({
  items: z.array(relatedContentItemSchema).max(RELATED_LIMITS.MAX_RESULTS),
  performance: relatedContentPerformanceMetricsSchema,
  fromCache: z.boolean(),
  algorithm: z.string().regex(/^v\d+\.\d+\.\d+$/, 'Invalid version format'),
});

/**
 * Content index schema
 */
export const contentIndexSchema = z.object({
  items: z.array(contentItemSchema).max(10000), // Max 10k items
  categories: z.record(contentCategorySchema, z.array(contentItemSchema)),
  tags: z.record(z.string(), z.array(contentItemSchema)),
  keywords: z.record(z.string(), z.array(contentItemSchema)),
  generated: z.string().datetime().optional(),
  version: z.string().optional(),
});

/**
 * Related trending item schema
 */
export const relatedTrendingItemSchema = z.object({
  slug: z.string().min(1).max(RELATED_LIMITS.MAX_SLUG_LENGTH),
  score: z.number().min(0),
  timestamp: z.number().int().min(0).optional(),
});

export const relatedPopularItemSchema = z.object({
  slug: z.string().min(1).max(RELATED_LIMITS.MAX_SLUG_LENGTH),
  views: z.number().int().min(0),
});

/**
 * Cache key validation
 */
export const cacheKeySchema = z
  .string()
  .min(1)
  .max(250)
  .regex(/^[a-zA-Z0-9:_\-/.]+$/, 'Invalid cache key format')
  .refine((key) => !key.includes('\0'), 'Null bytes not allowed in cache key');

// Type export
export type RelatedContentPerformanceMetrics = z.infer<
  typeof relatedContentPerformanceMetricsSchema
>;

/**
 * Helper function to validate and sanitize config
 */
export function validateRelatedContentConfig(
  config: unknown
): z.infer<typeof relatedContentConfigSchema> {
  return relatedContentConfigSchema.parse(config);
}

/**
 * Helper function to validate content item
 */
export function validateContentItem(item: unknown): z.infer<typeof contentItemSchema> {
  return contentItemSchema.parse(item);
}

/**
 * Helper function to validate scoring result
 */
export function validateScoringResult(result: unknown): z.infer<typeof scoringResultSchema> {
  return scoringResultSchema.parse(result);
}

/**
 * Type exports
 */
export type ContentCategory = z.infer<typeof contentCategorySchema>;
export type ContentItem = z.infer<typeof contentItemSchema>;
export type RelatedContentConfig = z.infer<typeof relatedContentConfigSchema>;
export type AlgorithmConfig = z.infer<typeof algorithmConfigSchema>;
export type ScoringResult = z.infer<typeof scoringResultSchema>;
export type RelatedContentItem = z.infer<typeof relatedContentItemSchema>;
export type RelatedContentResponse = z.infer<typeof relatedContentResponseSchema>;
export type ContentIndex = z.infer<typeof contentIndexSchema>;
export type RelatedTrendingItem = z.infer<typeof relatedTrendingItemSchema>;
export type RelatedPopularItem = z.infer<typeof relatedPopularItemSchema>;
export type AlgorithmWeights = z.infer<typeof algorithmWeightsSchema>;
export type AlgorithmBoosts = z.infer<typeof algorithmBoostsSchema>;
export type AlgorithmLimits = z.infer<typeof algorithmLimitsSchema>;
export type ScoreComponents = z.infer<typeof scoreComponentsSchema>;
export type DebugInfo = z.infer<typeof debugInfoSchema>;
export type MatchType = z.infer<typeof matchTypeSchema>;
