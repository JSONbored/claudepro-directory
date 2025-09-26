/**
 * Static API Generation Validation Schemas
 * Production-grade validation for static API generation
 * Ensures data integrity and type safety for pre-generated APIs
 */

import { z } from 'zod';
import { contentCategorySchema, contentTypeSchema } from './shared.schema';

/**
 * Security constants for static API generation
 */
const STATIC_API_LIMITS = {
  MAX_ITEMS_PER_CATEGORY: 10000,
  MAX_TAG_LENGTH: 50,
  MAX_TAGS: 100,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_URL_LENGTH: 2048,
  MAX_SLUG_LENGTH: 200,
  MAX_POPULAR_TAGS: 50,
  MAX_CATEGORY_TAGS: 20,
} as const;

/**
 * Base content item schema
 */
export const baseContentItemSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(STATIC_API_LIMITS.MAX_SLUG_LENGTH)
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid slug format'),

  title: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH).optional(),

  name: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH).optional(),

  description: z.string().min(1).max(STATIC_API_LIMITS.MAX_DESCRIPTION_LENGTH),

  tags: z
    .array(
      z
        .string()
        .min(1)
        .max(STATIC_API_LIMITS.MAX_TAG_LENGTH)
        .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid tag format')
    )
    .max(STATIC_API_LIMITS.MAX_TAGS)
    .default([]),

  id: z.string().min(1).max(STATIC_API_LIMITS.MAX_SLUG_LENGTH),

  category: z.string().optional(),
});

/**
 * Transformed content item with type and URL
 */
export const transformedContentItemSchema = baseContentItemSchema.extend({
  type: contentTypeSchema,
  url: z
    .string()
    .url()
    .max(STATIC_API_LIMITS.MAX_URL_LENGTH)
    .regex(/^https:\/\/claudepro\.directory\//, 'Invalid URL format'),
});

/**
 * Searchable item schema
 */
export const searchableItemSchema = z.object({
  title: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH),
  name: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH),
  description: z.string().max(STATIC_API_LIMITS.MAX_DESCRIPTION_LENGTH),
  tags: z.array(z.string().max(STATIC_API_LIMITS.MAX_TAG_LENGTH)).max(STATIC_API_LIMITS.MAX_TAGS),
  category: z.string(),
  popularity: z.number().int().min(0).default(0),
  slug: z.string().max(STATIC_API_LIMITS.MAX_SLUG_LENGTH),
  id: z.string().max(STATIC_API_LIMITS.MAX_SLUG_LENGTH),
});

/**
 * Individual content type API response
 */
export const contentTypeApiResponseSchema = z.object({
  agents: z.array(transformedContentItemSchema).optional(),
  mcp: z.array(transformedContentItemSchema).optional(),
  hooks: z.array(transformedContentItemSchema).optional(),
  commands: z.array(transformedContentItemSchema).optional(),
  rules: z.array(transformedContentItemSchema).optional(),
  count: z.number().int().min(0).max(STATIC_API_LIMITS.MAX_ITEMS_PER_CATEGORY),
  lastUpdated: z.string().datetime(),
  generated: z.literal('static'),
});

/**
 * Statistics schema
 */
export const statisticsSchema = z.object({
  totalConfigurations: z.number().int().min(0),
  agents: z.number().int().min(0),
  mcp: z.number().int().min(0),
  rules: z.number().int().min(0),
  commands: z.number().int().min(0),
  hooks: z.number().int().min(0),
});

/**
 * Endpoints schema
 */
export const endpointsSchema = z.object({
  agents: z.string().url(),
  mcp: z.string().url(),
  rules: z.string().url(),
  commands: z.string().url(),
  hooks: z.string().url(),
});

/**
 * All configurations API response
 */
export const allConfigurationsResponseSchema = z.object({
  '@context': z.literal('https://schema.org'),
  '@type': z.literal('Dataset'),
  name: z.string(),
  description: z.string(),
  license: z.string(),
  lastUpdated: z.string().datetime(),
  generated: z.literal('static'),
  statistics: statisticsSchema,
  data: z.object({
    agents: z.array(transformedContentItemSchema),
    mcp: z.array(transformedContentItemSchema),
    rules: z.array(transformedContentItemSchema),
    commands: z.array(transformedContentItemSchema),
    hooks: z.array(transformedContentItemSchema),
  }),
  endpoints: endpointsSchema,
});

/**
 * Popular tag schema
 */
export const popularTagSchema = z.object({
  tag: z.string().max(STATIC_API_LIMITS.MAX_TAG_LENGTH),
  count: z.number().int().min(1),
});

/**
 * Category count schema
 */
export const categoryCountSchema = z.object({
  category: z.string(),
  count: z.number().int().min(0),
});

/**
 * Search index schema for a category
 */
export const categorySearchIndexSchema = z.object({
  category: contentCategorySchema,
  items: z.array(searchableItemSchema).max(STATIC_API_LIMITS.MAX_ITEMS_PER_CATEGORY),
  count: z.number().int().min(0),
  lastUpdated: z.string().datetime(),
  generated: z.literal('static'),
  tags: z.array(z.string()).max(STATIC_API_LIMITS.MAX_TAGS * 10),
  popularTags: z.array(popularTagSchema).max(STATIC_API_LIMITS.MAX_CATEGORY_TAGS),
});

/**
 * Combined search index schema
 */
export const combinedSearchIndexSchema = z.object({
  items: z.array(searchableItemSchema),
  count: z.number().int().min(0),
  lastUpdated: z.string().datetime(),
  generated: z.literal('static'),
  categories: z.array(categoryCountSchema),
  tags: z.array(z.string()),
  popularTags: z.array(popularTagSchema).max(STATIC_API_LIMITS.MAX_POPULAR_TAGS),
});

/**
 * Health check response schema
 */
export const healthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string().datetime(),
  generated: z.literal('static'),
  version: z.string(),
  environment: z.string(),
  counts: z.object({
    agents: z.number().int().min(0),
    mcp: z.number().int().min(0),
    rules: z.number().int().min(0),
    commands: z.number().int().min(0),
    hooks: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
  features: z.object({
    staticGeneration: z.boolean(),
    searchIndexes: z.boolean(),
    redisCache: z.boolean(),
    rateLimit: z.boolean(),
  }),
});

/**
 * Generation result schema
 */
export const generationResultSchema = z.object({
  success: z.boolean(),
  outputDir: z.string(),
  filesGenerated: z.array(z.string()),
  totalItems: z.number().int().min(0),
  duration: z.number().min(0),
  errors: z.array(z.string()).optional(),
});

/**
 * Helper to validate and transform content item
 */
export function validateContentItem(item: unknown): z.infer<typeof baseContentItemSchema> {
  return baseContentItemSchema.parse(item);
}

/**
 * Helper to validate API response
 */
export function validateApiResponse(
  response: unknown,
  category: string
): z.infer<typeof contentTypeApiResponseSchema> {
  const validated = contentTypeApiResponseSchema.parse(response);

  // Ensure the correct category key exists
  if (!(category in validated)) {
    throw new Error(`Missing ${category} key in API response`);
  }

  return validated;
}

/**
 * Helper to validate search index
 */
export function validateSearchIndex(
  index: unknown,
  type: 'category' | 'combined'
): z.infer<typeof categorySearchIndexSchema | typeof combinedSearchIndexSchema> {
  if (type === 'category') {
    return categorySearchIndexSchema.parse(index);
  }
  return combinedSearchIndexSchema.parse(index);
}

/**
 * Type exports
 */ export type BaseContentItem = z.infer<typeof baseContentItemSchema>;
export type TransformedContentItem = z.infer<typeof transformedContentItemSchema>;
export type SearchableItem = z.infer<typeof searchableItemSchema>;
export type ContentTypeApiResponse = z.infer<typeof contentTypeApiResponseSchema>;
export type AllConfigurationsResponse = z.infer<typeof allConfigurationsResponseSchema>;
export type CategorySearchIndex = z.infer<typeof categorySearchIndexSchema>;
export type CombinedSearchIndex = z.infer<typeof combinedSearchIndexSchema>;
export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;
export type GenerationResult = z.infer<typeof generationResultSchema>;
export type Statistics = z.infer<typeof statisticsSchema>;
export type Endpoints = z.infer<typeof endpointsSchema>;
export type PopularTag = z.infer<typeof popularTagSchema>;
export type CategoryCount = z.infer<typeof categoryCountSchema>;
