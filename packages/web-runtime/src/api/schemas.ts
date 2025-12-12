/**
 * Shared Zod Schemas for API Routes
 * 
 * These schemas are used across all API routes for consistent validation.
 * They enable automatic OpenAPI generation and reduce duplication.
 * 
 * **OpenAPI Support:**
 * - Uses `.meta()` for OpenAPI metadata (description, example, format)
 * - Compatible with `zod-openapi` v5
 * - All schemas include descriptions for OpenAPI docs
 * 
 * @module web-runtime/api/schemas
 */

// Import zod-openapi for TypeScript type augmentation (enables .meta() OpenAPI support)
import 'zod-openapi';

import { Constants } from '@heyclaude/database-types';
import { type Database } from '@heyclaude/database-types';
import { z } from 'zod';

// =============================================================================
// Common Patterns
// =============================================================================

/**
 * Pagination schema for limit/offset queries
 * 
 * @example
 * ```ts
 * const schema = paginationSchema.extend({ category: categorySchema.optional() });
 * ```
 */
export const paginationSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Maximum number of results to return (1-100)')
    .meta({
      description: 'Maximum number of results to return (1-100)',
      example: 20,
      minimum: 1,
      maximum: 100,
    }),
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .default(0)
    .describe('Number of results to skip (pagination offset)')
    .meta({
      description: 'Number of results to skip (pagination offset)',
      example: 0,
      minimum: 0,
    }),
});

/**
 * Content category enum schema
 * 
 * @example
 * ```ts
 * const schema = z.object({ category: categorySchema.optional() });
 * ```
 */
export const categorySchema = z
  .string()
  .optional()
  .transform((val) => {
    // Transform 'all' or empty to null
    if (!val || val === 'all') return null;
    return val;
  })
  .pipe(
    z
      .enum(
        [...Constants.public.Enums.content_category] as [
          Database['public']['Enums']['content_category'],
          ...Database['public']['Enums']['content_category'][],
        ]
      )
      .nullable()
  )
  .describe('Content category filter (use "all" or omit for all categories)')
  .meta({
    description: 'Content category filter (use "all" or omit for all categories)',
    example: 'skills',
  });

/**
 * Job category enum schema
 */
export const jobCategorySchema = z
  .enum(
    [...Constants.public.Enums.job_category] as [
      Database['public']['Enums']['job_category'],
      ...Database['public']['Enums']['job_category'][],
    ]
  )
  .optional()
  .describe('Job category filter');

/**
 * Job employment type enum schema
 */
export const jobEmploymentSchema = z
  .enum(
    [...Constants.public.Enums.job_type] as [
      Database['public']['Enums']['job_type'],
      ...Database['public']['Enums']['job_type'][],
    ]
  )
  .optional()
  .describe('Job employment type filter');

/**
 * Job experience level enum schema
 */
export const jobExperienceSchema = z
  .enum(
    [...Constants.public.Enums.experience_level] as [
      Database['public']['Enums']['experience_level'],
      ...Database['public']['Enums']['experience_level'][],
    ]
  )
  .optional()
  .describe('Job experience level filter');

/**
 * Slug validation schema
 * 
 * @example
 * ```ts
 * const schema = z.object({ slug: slugSchema });
 * ```
 */
export const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .describe('URL-friendly identifier (lowercase, alphanumeric, hyphens only)');

/**
 * Search autocomplete query schema
 * 
 * @example
 * ```ts
 * const schema = z.object({ q: z.string().min(2), limit: z.coerce.number().int().min(1).max(20).default(10) });
 * ```
 */
export const searchAutocompleteQuerySchema = z.object({
  q: z
    .string()
    .min(2, 'Query must be at least 2 characters')
    .describe('Search query string (minimum 2 characters)')
    .meta({
      description: 'Search query string (minimum 2 characters)',
      example: 'react',
      minLength: 2,
    }),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(20)
    .default(10)
    .describe('Maximum number of suggestions to return (1-20)')
    .meta({
      description: 'Maximum number of suggestions to return (1-20)',
      example: 10,
      minimum: 1,
      maximum: 20,
    }),
});

/**
 * Query string validation schema
 * 
 * @example
 * ```ts
 * const schema = z.object({ q: queryStringSchema.optional() });
 * ```
 */
export const queryStringSchema = z
  .string()
  .min(0)
  .max(2048)
  .optional()
  .describe('Search query string');

/**
 * Comma-separated list schema (for tags, authors, entities, etc.)
 * 
 * @example
 * ```ts
 * const schema = z.object({ tags: csvListSchema.optional() });
 * ```
 */
export const csvListSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return undefined;
    return val
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  })
  .pipe(z.array(z.string()).optional())
  .describe('Comma-separated list of values');

/**
 * Boolean query parameter schema (handles "true"/"false" strings)
 * 
 * @example
 * ```ts
 * const schema = z.object({ remote: booleanQuerySchema.optional() });
 * ```
 */
export const booleanQuerySchema = z
  .enum(['true', 'false'])
  .optional()
  .transform((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  })
  .pipe(z.boolean().optional())
  .describe('Boolean query parameter (true/false)');

/**
 * Sort order schema for content searches
 */
export const sortSchema = z
  .enum(['relevance', 'popularity', 'newest', 'alphabetical'])
  .default('relevance')
  .describe('Sort order for results');

/**
 * Entity types schema for unified search
 */
export const entitiesSchema = z
  .array(z.enum(['content', 'company', 'job', 'user']))
  .optional()
  .describe('Entity types to include in search');

/**
 * Changelog format schema
 * 
 * @example
 * ```ts
 * const schema = z.object({ format: changelogFormatSchema });
 * ```
 */
export const changelogFormatSchema = z
  .enum(['llms-changelog'])
  .optional()
  .default('llms-changelog')
  .describe('Changelog export format')
  .meta({
    description: 'Changelog export format',
    example: 'llms-changelog',
    enum: ['llms-changelog'],
  });

/**
 * Changelog entry format schema
 * 
 * @example
 * ```ts
 * const schema = z.object({ format: changelogEntryFormatSchema });
 * ```
 */
export const changelogEntryFormatSchema = z
  .enum(['llms-entry'])
  .optional()
  .default('llms-entry')
  .describe('Changelog entry export format')
  .meta({
    description: 'Changelog entry export format',
    example: 'llms-entry',
    enum: ['llms-entry'],
  });

/**
 * OG image query schema
 * 
 * @example
 * ```ts
 * const schema = z.object({ ...ogImageQuerySchema.shape });
 * ```
 */
export const ogImageQuerySchema = z.object({
  title: z.string().optional().describe('Title text to render on OG image'),
  description: z.string().optional().describe('Descriptive subtitle for OG image'),
  type: z.string().optional().describe('Badge text rendered at the top of OG image'),
  tags: z
    .string()
    .optional()
    .describe('Comma-separated list of tags (up to 5 rendered)')
    .meta({
      description: 'Comma-separated list of tags (up to 5 rendered)',
      example: 'ai,agents,automation',
    }),
});

/**
 * Sitemap format schema
 * 
 * @example
 * ```ts
 * const schema = z.object({ format: sitemapFormatSchema });
 * ```
 */
export const sitemapFormatSchema = z
  .enum(['xml', 'json'])
  .optional()
  .default('xml')
  .describe('Sitemap export format')
  .meta({
    description: 'Sitemap export format',
    example: 'xml',
    enum: ['xml', 'json'],
  });


/**
 * Sitewide content format schema
 * 
 * @example
 * ```ts
 * const schema = z.object({ format: sitewideFormatSchema });
 * ```
 */
export const sitewideFormatSchema = z
  .enum(['llms', 'llms-txt', 'readme', 'json'])
  .optional()
  .default('llms')
  .describe('Sitewide content export format')
  .meta({
    description: 'Sitewide content export format',
    example: 'llms',
    enum: ['llms', 'llms-txt', 'readme', 'json'],
  });


// =============================================================================
// Composite Schemas
// =============================================================================

/**
 * Search query schema
 * 
 * Comprehensive schema for the unified search API with support for content, jobs, companies, and users.
 * Combines query, filters, pagination, and sorting.
 * 
 * @example
 * ```ts
 * const schema = searchQuerySchema;
 * ```
 */
export const searchQuerySchema = paginationSchema.extend({
  q: queryStringSchema
    .default('')
    .describe('Search query string')
    .meta({
      description: 'Search query string',
      example: 'ai agents',
    }),
  categories: csvListSchema
    .optional()
    .describe('Comma-separated list of content categories to filter by')
    .meta({
      description: 'Comma-separated list of content categories to filter by',
      example: 'agents,mcp',
    }),
  tags: csvListSchema
    .optional()
    .describe('Comma-separated list of tags to filter by')
    .meta({
      description: 'Comma-separated list of tags to filter by',
      example: 'ai,automation',
    }),
  authors: csvListSchema
    .optional()
    .describe('Comma-separated list of author slugs to filter by')
    .meta({
      description: 'Comma-separated list of author slugs to filter by',
      example: 'user1,user2',
    }),
  entities: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val
        .split(',')
        .map((item) => item.trim())
        .filter((item): item is 'content' | 'company' | 'job' | 'user' =>
          ['content', 'company', 'job', 'user'].includes(item)
        );
    })
    .pipe(entitiesSchema)
    .describe('Entity types to include in search (content, company, job, user)')
    .meta({
      description: 'Entity types to include in search',
      example: ['content', 'job'],
    }),
  sort: sortSchema
    .default('relevance')
    .describe('Sort order for results')
    .meta({
      description: 'Sort order for results',
      example: 'relevance',
    }),
  // Job filters
  job_category: jobCategorySchema
    .optional()
    .describe('Job category filter')
    .meta({
      description: 'Job category filter',
      example: 'engineering',
    }),
  job_employment: jobEmploymentSchema
    .optional()
    .describe('Job employment type filter')
    .meta({
      description: 'Job employment type filter',
      example: 'full-time',
    }),
  job_experience: jobExperienceSchema
    .optional()
    .describe('Job experience level filter')
    .meta({
      description: 'Job experience level filter',
      example: 'mid-level',
    }),
  job_remote: booleanQuerySchema
    .optional()
    .describe('Filter for remote jobs (true/false)')
    .meta({
      description: 'Filter for remote jobs (true/false)',
      example: true,
    }),
});

/**
 * Content export format schema
 * 
 * @example
 * ```ts
 * const schema = z.object({ format: contentFormatSchema });
 * ```
 */
export const contentFormatSchema = z
  .enum(['json', 'markdown', 'md', 'llms', 'llms-txt', 'storage'])
  .default('json')
  .describe('Export format for content')
  .meta({
    description: 'Export format for content',
    example: 'json',
    enum: ['json', 'markdown', 'md', 'llms', 'llms-txt', 'storage'],
  });

/**
 * Content detail query schema (for /api/content/[category]/[slug])
 * 
 * @example
 * ```ts
 * const schema = contentDetailQuerySchema;
 * ```
 */
export const contentDetailQuerySchema = z.object({
  format: contentFormatSchema,
  includeMetadata: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val !== 'false'))
    .pipe(z.boolean().optional())
    .describe('Include metadata in markdown export (default: true)')
    .meta({
      description: 'Include metadata in markdown export (default: true)',
      example: true,
    }),
  includeFooter: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true'))
    .pipe(z.boolean().optional())
    .describe('Include footer in markdown export (default: false)')
    .meta({
      description: 'Include footer in markdown export (default: false)',
      example: false,
    }),
  metadata: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true'))
    .pipe(z.boolean().optional())
    .describe('Return metadata only for storage format (default: false)')
    .meta({
      description: 'Return metadata only for storage format (default: false)',
      example: false,
    }),
});

/**
 * Category content format schema
 * 
 * @example
 * ```ts
 * const schema = z.object({ format: categoryContentFormatSchema });
 * ```
 */
export const categoryContentFormatSchema = z
  .enum(['llms-category', 'json'])
  .optional()
  .default('llms-category')
  .describe('Category content export format')
  .meta({
    description: 'Category content export format',
    example: 'llms-category',
    enum: ['llms-category', 'json'],
  });

/**
 * Feed type schema
 */
export const feedTypeSchema = z
  .enum(['rss', 'atom'])
  .default('rss')
  .describe('Feed format (RSS or Atom)')
  .meta({
    description: 'Feed format (RSS or Atom)',
    example: 'rss',
    enum: ['rss', 'atom'],
  });

/**
 * Feed query parameters schema
 * 
 * @example
 * ```ts
 * const schema = feedQuerySchema;
 * ```
 */
export const feedQuerySchema = z.object({
  type: feedTypeSchema,
  category: z
    .string()
    .optional()
    .transform((val) => {
      // Transform 'all' to null, trim and lowercase
      if (!val || val === 'all') return null;
      return val.trim().toLowerCase();
    })
    .nullable()
    .describe('Content category filter (use "changelog" for changelog feeds, omit or "all" for all content)')
    .meta({
      description: 'Content category filter (use "changelog" for changelog feeds, omit or "all" for all content)',
      example: 'skills',
    }),
});

/**
 * Trending tab schema
 */
export const trendingTabSchema = z
  .enum(['trending', 'popular', 'recent'])
  .default('trending')
  .describe('Trending page tab selection')
  .meta({
    description: 'Trending page tab selection',
    example: 'trending',
    enum: ['trending', 'popular', 'recent'],
  });

/**
 * Trending query parameters schema
 * 
 * @example
 * ```ts
 * const schema = trendingQuerySchema;
 * ```
 */
export const trendingQuerySchema = z.object({
  tab: trendingTabSchema,
  category: categorySchema,
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(12)
    .describe('Maximum number of results to return (1-100)')
    .meta({
      description: 'Maximum number of results to return (1-100)',
      example: 12,
      minimum: 1,
      maximum: 100,
    }),
  mode: z
    .enum(['page', 'sidebar'])
    .optional()
    .default('page')
    .describe('Response mode (page or sidebar)')
    .meta({
      description: 'Response mode (page or sidebar)',
      example: 'page',
      enum: ['page', 'sidebar'],
    }),
});

// =============================================================================
// Type Exports
// =============================================================================

export type PaginationInput = z.infer<typeof paginationSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type SlugInput = z.infer<typeof slugSchema>;
export type QueryStringInput = z.infer<typeof queryStringSchema>;
export type CsvListInput = z.infer<typeof csvListSchema>;
export type BooleanQueryInput = z.infer<typeof booleanQuerySchema>;
export type SortInput = z.infer<typeof sortSchema>;
export type EntitiesInput = z.infer<typeof entitiesSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type ContentFormatInput = z.infer<typeof contentFormatSchema>;
export type FeedTypeInput = z.infer<typeof feedTypeSchema>;
export type TrendingTabInput = z.infer<typeof trendingTabSchema>;
