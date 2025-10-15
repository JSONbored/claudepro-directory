/**
 * Static API Response Schemas
 *
 * Centralized Zod schemas for all static API endpoint responses.
 * Auto-generates schemas from category metadata to eliminate manual maintenance.
 *
 * Architecture Benefits:
 * - Single source of truth for category metadata
 * - Dynamic schema generation from MAIN_CONTENT_CATEGORIES
 * - Compile-time validation ensures all categories covered
 * - Type-safe with satisfies operator
 * - Reusable across scripts, tests, and API routes
 *
 * Performance Optimizations:
 * - Schemas created once at module load time
 * - No runtime overhead for dynamic generation
 * - Tree-shakeable exports
 *
 * Security:
 * - Strict validation limits on all fields
 * - Regex patterns for slugs, tags, URLs
 * - Max length constraints prevent DoS
 *
 * @see scripts/generate-static-apis.ts - Primary consumer
 * @see lib/constants.ts - MAIN_CONTENT_CATEGORIES source
 */

import { z } from 'zod';
import { APP_CONFIG, MAIN_CONTENT_CATEGORIES } from '@/src/lib/constants';
import { nonNegativeInt, positiveInt } from '@/src/lib/schemas/primitives/base-numbers';
import {
  isoDatetimeString,
  mediumString,
  nonEmptyString,
  urlString,
} from '@/src/lib/schemas/primitives/base-strings';
import {
  type AppContentType,
  appContentTypeSchema,
  contentCategorySchema,
} from '@/src/lib/schemas/shared.schema';

/**
 * Static API Content Category
 * Derived from MAIN_CONTENT_CATEGORIES for type safety
 */
type StaticAPICategory = (typeof MAIN_CONTENT_CATEGORIES)[number];

/**
 * Static API generation limits
 * Modern constants pattern with const assertion
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
 * Category Metadata Registry
 *
 * Single source of truth for category configuration.
 * Used to auto-generate all category-specific schemas.
 *
 * Type Safety:
 * - satisfies ensures all StaticAPICategory types are present
 * - TypeScript will error if any category is missing
 * - Const assertion provides literal type inference
 *
 * Adding a New Category:
 * 1. Add to MAIN_CONTENT_CATEGORIES in lib/constants.ts
 * 2. Add entry here with singular form and description
 * 3. All schemas auto-update (no manual changes needed)
 * 4. Compile-time validation ensures completeness
 */
const CATEGORY_METADATA = {
  agents: {
    singular: 'agent' as const,
    description: 'Agent configurations',
    pluralDescription: 'All agent configurations',
  },
  mcp: {
    singular: 'mcp' as const,
    description: 'MCP server configurations',
    pluralDescription: 'All MCP server configurations',
  },
  rules: {
    singular: 'rule' as const,
    description: 'Rule configurations',
    pluralDescription: 'All rule configurations',
  },
  commands: {
    singular: 'command' as const,
    description: 'Command configurations',
    pluralDescription: 'All command configurations',
  },
  hooks: {
    singular: 'hook' as const,
    description: 'Hook configurations',
    pluralDescription: 'All hook configurations',
  },
  statuslines: {
    singular: 'statusline' as const,
    description: 'Statusline configurations',
    pluralDescription: 'All statusline configurations',
  },
  collections: {
    singular: 'collection' as const,
    description: 'Collection bundles',
    pluralDescription: 'All collection bundles',
  },
  skills: {
    singular: 'skill' as const,
    description: 'Skill guides',
    pluralDescription: 'All skill guides',
  },
} as const satisfies Record<
  StaticAPICategory,
  {
    readonly singular: AppContentType;
    readonly description: string;
    readonly pluralDescription: string;
  }
>;

/**
 * Category to Content Type Mapping
 *
 * Auto-generated from CATEGORY_METADATA for zero maintenance.
 * Maps plural category names to singular content types.
 *
 * Examples: agents → agent, collections → collection
 *
 * Compile-Time Safety:
 * - Type assertion ensures Record<StaticAPICategory, AppContentType>
 * - TypeScript errors if metadata is incomplete
 */
export const CATEGORY_TYPE_MAP = Object.fromEntries(
  MAIN_CONTENT_CATEGORIES.map((cat) => [cat, CATEGORY_METADATA[cat].singular])
) as Record<StaticAPICategory, AppContentType>;

/**
 * Base metadata item structure
 * Represents minimum fields for all content items
 */
export interface MetadataItem {
  slug: string;
  title?: string;
  name?: string;
  seoTitle?: string;
  description: string;
  author: string;
  tags: string[];
  category: string;
  dateAdded: string;
  [key: string]: unknown;
}

/**
 * Base content item schema for static APIs
 * Security: Strict validation with regex patterns and max lengths
 */
const baseContentItemSchema = z
  .object({
    slug: nonEmptyString
      .max(STATIC_API_LIMITS.MAX_SLUG_LENGTH)
      .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid slug format')
      .describe('URL-safe identifier for the content item'),
    title: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH).optional().describe('Content title'),
    name: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH).optional().describe('Content name'),
    seoTitle: z
      .string()
      .max(60)
      .optional()
      .describe(
        'Short SEO-optimized title for <title> tag (max 60 characters), falls back to title'
      ),
    description: nonEmptyString
      .max(STATIC_API_LIMITS.MAX_DESCRIPTION_LENGTH)
      .describe('Content description'),
    tags: z
      .array(
        nonEmptyString
          .max(STATIC_API_LIMITS.MAX_TAG_LENGTH)
          .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid tag format')
          .describe('Tag identifier')
      )
      .max(STATIC_API_LIMITS.MAX_TAGS)
      .default([])
      .describe('Array of content tags'),
    category: z.string().optional().describe('Content category'),
  })
  .describe('Base content item schema for static APIs');

/**
 * Transformed content item with type and URL
 * Used in API responses after transformation
 */
export const transformedContentItemSchema = baseContentItemSchema
  .extend({
    type: appContentTypeSchema.describe('Content type discriminator'),
    url: urlString
      .max(STATIC_API_LIMITS.MAX_URL_LENGTH)
      .regex(/^https:\/\/claudepro\.directory\//, 'Invalid URL format')
      .describe('Full URL to the content item'),
  })
  .describe('Transformed content item with type and URL');

export type TransformedContentItem = z.infer<typeof transformedContentItemSchema>;

/**
 * Searchable item schema for search indexes
 * Optimized structure for client-side search
 */
export const staticAPISearchableItemSchema = z
  .object({
    title: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH).describe('Searchable title'),
    name: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH).describe('Searchable name'),
    description: mediumString.describe('Searchable description'),
    tags: z
      .array(z.string().max(STATIC_API_LIMITS.MAX_TAG_LENGTH))
      .max(STATIC_API_LIMITS.MAX_TAGS)
      .describe('Searchable tags array'),
    category: z.string().describe('Content category'),
    popularity: nonNegativeInt.default(0).describe('Popularity score (0-100)'),
    slug: z.string().max(STATIC_API_LIMITS.MAX_SLUG_LENGTH).describe('Content slug'),
  })
  .describe('Searchable item schema for search indexes');

export type StaticAPISearchableItem = z.infer<typeof staticAPISearchableItemSchema>;

/**
 * Content Type API Response Schema
 *
 * DYNAMICALLY GENERATED from category metadata.
 * Auto-includes all categories - no manual updates needed.
 *
 * Performance: Generated once at module load time, zero runtime overhead.
 */
const categoryFields = Object.fromEntries(
  MAIN_CONTENT_CATEGORIES.map((cat) => [
    cat,
    z.array(transformedContentItemSchema).optional().describe(CATEGORY_METADATA[cat].description),
  ])
);

export const contentTypeApiResponseSchema = z
  .object({
    ...categoryFields,
    count: nonNegativeInt
      .max(STATIC_API_LIMITS.MAX_ITEMS_PER_CATEGORY)
      .describe('Total item count'),
    lastUpdated: isoDatetimeString.describe('Last update timestamp'),
    generated: z.literal('static').describe('Generation method'),
  })
  .describe('API response for a single content type');

export type ContentTypeApiResponse = z.infer<typeof contentTypeApiResponseSchema>;

/**
 * Statistics Schema
 *
 * DYNAMICALLY GENERATED - includes counts for all categories.
 * Auto-updates when new categories added.
 */
const statisticsFields = Object.fromEntries(
  MAIN_CONTENT_CATEGORIES.map((cat) => [
    cat,
    nonNegativeInt.describe(`${CATEGORY_METADATA[cat].singular} count`),
  ])
);

const statisticsSchema = z
  .object({
    totalConfigurations: nonNegativeInt.describe('Total configuration count'),
    ...statisticsFields,
  })
  .describe('Content statistics across all categories');

type Statistics = z.infer<typeof statisticsSchema>;

/**
 * Endpoints Schema
 *
 * DYNAMICALLY GENERATED - includes API endpoints for all categories.
 * Auto-updates when new categories added.
 */
const endpointFields = Object.fromEntries(
  MAIN_CONTENT_CATEGORIES.map((cat) => [
    cat,
    urlString.describe(`${CATEGORY_METADATA[cat].singular}s API endpoint`),
  ])
);

const endpointsSchema = z.object(endpointFields).describe('API endpoint URLs');

/**
 * All Configurations Response Schema
 *
 * DYNAMICALLY GENERATED data object from category metadata.
 * Includes JSON-LD structured data for SEO.
 */
const allConfigurationsDataFields = Object.fromEntries(
  MAIN_CONTENT_CATEGORIES.map((cat) => [
    cat,
    z.array(transformedContentItemSchema).describe(CATEGORY_METADATA[cat].pluralDescription),
  ])
);

export const allConfigurationsResponseSchema = z
  .object({
    '@context': z.literal('https://schema.org').describe('JSON-LD context'),
    '@type': z.literal('Dataset').describe('JSON-LD type'),
    name: z.string().describe('Dataset name'),
    description: z.string().describe('Dataset description'),
    license: z.string().describe('Dataset license'),
    lastUpdated: isoDatetimeString.describe('Last update timestamp'),
    generated: z.literal('static').describe('Generation method'),
    statistics: statisticsSchema,
    data: z.object(allConfigurationsDataFields).describe('Complete dataset'),
    endpoints: endpointsSchema,
  })
  .describe('All configurations API response');

export type AllConfigurationsResponse = z.infer<typeof allConfigurationsResponseSchema>;

/**
 * Popular tag schema with usage count
 * Used in search indexes for tag clouds
 */
const popularTagSchema = z
  .object({
    tag: z.string().max(STATIC_API_LIMITS.MAX_TAG_LENGTH).describe('Tag name'),
    count: positiveInt.describe('Usage count'),
  })
  .describe('Popular tag with usage count');

/**
 * Category count schema
 * Used in combined search index
 */
const categoryCountSchema = z
  .object({
    category: z.string().describe('Category name'),
    count: nonNegativeInt.describe('Item count'),
  })
  .describe('Category with item count');

/**
 * Category-specific search index schema
 * One index per category for optimized searching
 */
export const categorySearchIndexSchema = z
  .object({
    category: contentCategorySchema.describe('Category identifier'),
    items: z
      .array(staticAPISearchableItemSchema)
      .max(STATIC_API_LIMITS.MAX_ITEMS_PER_CATEGORY)
      .describe('Searchable items'),
    count: nonNegativeInt.describe('Total item count'),
    lastUpdated: isoDatetimeString.describe('Last update timestamp'),
    generated: z.literal('static').describe('Generation method'),
    tags: z
      .array(z.string())
      .max(STATIC_API_LIMITS.MAX_TAGS * 10)
      .describe('All unique tags'),
    popularTags: z
      .array(popularTagSchema)
      .max(STATIC_API_LIMITS.MAX_CATEGORY_TAGS)
      .describe('Most popular tags'),
  })
  .describe('Search index for a single category');

export type CategorySearchIndex = z.infer<typeof categorySearchIndexSchema>;

/**
 * Combined search index schema
 * Aggregates all categories for global search
 */
export const combinedSearchIndexSchema = z
  .object({
    items: z.array(staticAPISearchableItemSchema).describe('All searchable items'),
    count: nonNegativeInt.describe('Total item count'),
    lastUpdated: isoDatetimeString.describe('Last update timestamp'),
    generated: z.literal('static').describe('Generation method'),
    categories: z.array(categoryCountSchema).describe('Category counts'),
    tags: z.array(z.string()).describe('All unique tags'),
    popularTags: z
      .array(popularTagSchema)
      .max(STATIC_API_LIMITS.MAX_POPULAR_TAGS)
      .describe('Most popular tags across all categories'),
  })
  .describe('Combined search index across all categories');

export type CombinedSearchIndex = z.infer<typeof combinedSearchIndexSchema>;

/**
 * Health Check Response Schema
 *
 * DYNAMICALLY GENERATED counts object from category metadata.
 * Used for service health monitoring and debugging.
 */
const healthCheckCountFields = Object.fromEntries(
  MAIN_CONTENT_CATEGORIES.map((cat) => [
    cat,
    nonNegativeInt.describe(`${CATEGORY_METADATA[cat].singular} count`),
  ])
);

export const healthCheckResponseSchema = z
  .object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']).describe('Service health status'),
    timestamp: isoDatetimeString.describe('Health check timestamp'),
    generated: z.literal('static').describe('Generation method'),
    version: z.string().describe('Application version'),
    environment: z.string().describe('Runtime environment'),
    counts: z
      .object({
        ...healthCheckCountFields,
        total: nonNegativeInt.describe('Total count'),
      })
      .describe('Content counts'),
    features: z
      .object({
        staticGeneration: z.boolean().describe('Static generation enabled'),
        searchIndexes: z.boolean().describe('Search indexes enabled'),
        redisCache: z.boolean().describe('Redis caching enabled'),
        rateLimit: z.boolean().describe('Rate limiting enabled'),
      })
      .describe('Feature flags'),
  })
  .describe('Health check API response');

export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;

/**
 * Helper function to generate endpoint URLs
 * Centralized URL generation for consistency
 *
 * Performance: Memoizable if needed
 * Security: Uses APP_CONFIG.url constant (validated elsewhere)
 */
export function generateCategoryEndpoints(): Record<StaticAPICategory, string> {
  return Object.fromEntries(
    MAIN_CONTENT_CATEGORIES.map((cat) => [cat, `${APP_CONFIG.url}/api/${cat}.json`])
  ) as Record<StaticAPICategory, string>;
}

/**
 * Helper function to generate category statistics structure
 * Used in multiple places for consistency
 */
export function createEmptyStatistics(): Statistics {
  const stats: Record<string, number> = { totalConfigurations: 0 };
  for (const cat of MAIN_CONTENT_CATEGORIES) {
    stats[cat] = 0;
  }
  return stats as Statistics;
}

/**
 * Helper function to generate empty counts for health check
 */
export function createEmptyHealthCounts(): HealthCheckResponse['counts'] {
  const counts: Record<string, number> = { total: 0 };
  for (const cat of MAIN_CONTENT_CATEGORIES) {
    counts[cat] = 0;
  }
  return counts as HealthCheckResponse['counts'];
}
