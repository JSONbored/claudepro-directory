/**
 * Production-grade search and pagination parameter validation
 * Security-first approach to prevent injection and ensure data integrity
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { nonNegativeInt, percentage, positiveInt } from './primitives/base-numbers';
import { mediumString, nonEmptyString, shortString, slugString } from './primitives/base-strings';

/**
 * Searchable item schema for search cache
 * Used with Fuzzysort adapter for high-performance fuzzy search
 */
export const searchableItemSchema = z
  .object({
    title: nonEmptyString
      .max(200)
      .describe('Display title of the searchable item, max 200 characters'),
    name: z.string().optional().describe('Optional alternative name for the item'),
    description: mediumString.describe('Detailed description of the item for search indexing'),
    tags: z
      .array(z.string().max(50).describe('Individual tag, max 50 characters'))
      .describe('Array of tags associated with the item'),
    category: z.string().max(50).describe('Primary category classification, max 50 characters'),
    popularity: percentage.optional().describe('Optional popularity score as percentage (0-100)'),
    slug: nonEmptyString.max(200).describe('URL-safe slug identifier, max 200 characters'),
    id: nonEmptyString.max(200).describe('Unique identifier for the item, max 200 characters'),
  })
  .describe('Schema for searchable items in the search cache used with Fuzzysort adapter');

export type SearchableItem = z.infer<typeof searchableItemSchema>;

/**
 * Search filters schema for search cache
 */
export const searchFiltersSchema = z
  .object({
    categories: z
      .array(z.string().max(50).describe('Category name, max 50 characters'))
      .describe('Array of category filters to apply'),
    tags: z
      .array(z.string().max(50).describe('Tag name, max 50 characters'))
      .describe('Array of tag filters to apply'),
    authors: z.array(shortString).describe('Array of author names to filter by'),
    sort: z
      .enum(['trending', 'newest', 'alphabetical', 'popularity'])
      .describe('Sort order for search results'),
    popularity: z
      .tuple([nonNegativeInt, percentage])
      .describe('Popularity range filter as tuple of min and max percentage'),
  })
  .describe('Schema for search filters applied to cached search results');

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

/**
 * Search cache key schema
 */
export const searchCacheKeySchema = z
  .object({
    query: mediumString.describe('Search query string for cache key generation'),
    filters: searchFiltersSchema.describe('Active search filters for cache key generation'),
  })
  .describe('Schema for generating unique cache keys based on query and filters');

export type SearchCacheKey = z.infer<typeof searchCacheKeySchema>;

/**
 * Search pagination schema
 */
export const searchPaginationSchema = z
  .object({
    page: z
      .union([
        z.string().describe('Page number as string'),
        z.number().describe('Page number as integer'),
      ])
      .transform((val) => Number(val))
      .pipe(positiveInt.max(1000))
      .optional()
      .default(1)
      .describe('Current page number for pagination, max 1000, defaults to 1'),

    limit: z
      .union([
        z.string().describe('Results per page as string'),
        z.number().describe('Results per page as integer'),
      ])
      .transform((val) => Number(val))
      .pipe(positiveInt.max(100))
      .optional()
      .default(20)
      .describe('Number of results per page, max 100, defaults to 20'),

    offset: z
      .union([
        z.string().describe('Result offset as string'),
        z.number().describe('Result offset as integer'),
      ])
      .transform((val) => Number(val))
      .pipe(nonNegativeInt.max(10000))
      .optional()
      .describe('Optional offset for result skipping, max 10000'),
  })
  .describe('Schema for pagination parameters with string or number input support');

export type SearchPaginationParams = z.infer<typeof searchPaginationSchema>;

/**
 * Search query schema with sanitization
 */
export const searchQuerySchema = z
  .object({
    q: z
      .string()
      .optional()
      .transform((val) => val?.trim())
      .refine((val) => !val || val.length >= 2, 'Search query must be at least 2 characters')
      .refine((val) => !val || val.length <= 200, 'Search query is too long')
      .transform((val) => {
        if (!val) return undefined;
        // Sanitize search query to prevent injection
        return val
          .replace(/[<>'"&]/g, '') // Remove potential XSS characters
          .replace(/\s+/g, ' ') // Normalize whitespace
          .slice(0, 200); // Enforce max length
      })
      .describe('Search query parameter (q), sanitized and validated 2-200 characters'),

    query: z
      .string()
      .optional()
      .transform((val) => val?.trim())
      .refine((val) => !val || val.length >= 2, 'Search query must be at least 2 characters')
      .refine((val) => !val || val.length <= 200, 'Search query is too long')
      .transform((val) => {
        if (!val) return undefined;
        // Sanitize search query to prevent injection
        return val
          .replace(/[<>'"&]/g, '') // Remove potential XSS characters
          .replace(/\s+/g, ' ') // Normalize whitespace
          .slice(0, 200); // Enforce max length
      })
      .describe('Search query parameter (query), sanitized and validated 2-200 characters'),

    search: z
      .string()
      .optional()
      .transform((val) => val?.trim())
      .refine((val) => !val || val.length >= 2, 'Search term must be at least 2 characters')
      .refine((val) => !val || val.length <= 200, 'Search term is too long')
      .transform((val) => {
        if (!val) return undefined;
        return val
          .replace(/[<>'"&]/g, '')
          .replace(/\s+/g, ' ')
          .slice(0, 200);
      })
      .describe('Search query parameter (search), sanitized and validated 2-200 characters'),
  })
  .describe('Schema for search query parameters with XSS protection and normalization');

export type SearchQuery = z.infer<typeof searchQuerySchema>;

/**
 * Sort parameters schema
 */
export const sortSchema = z
  .object({
    sort: z
      .enum(['relevance', 'date', 'popularity', 'name', 'updated', 'created', 'views', 'trending'])
      .optional()
      .default('relevance')
      .describe('Primary sort field, defaults to relevance'),

    order: z
      .enum(['asc', 'desc'])
      .optional()
      .default('desc')
      .describe('Sort order direction, defaults to descending'),

    sortBy: z
      .enum(['relevance', 'date', 'popularity', 'name', 'updated', 'created', 'views', 'trending'])
      .optional()
      .describe('Alternative sort field parameter'),

    orderBy: z.enum(['asc', 'desc']).optional().describe('Alternative sort order parameter'),
  })
  .describe('Schema for sorting parameters with flexible field naming');

export type SortParams = z.infer<typeof sortSchema>;

/**
 * Filter parameters schema
 */
export const filterSchema = z
  .object({
    category: z
      .union([
        z
          .enum(['all', 'agents', 'mcp', 'rules', 'commands', 'hooks', 'guides'])
          .describe('Predefined category value'),
        z
          .string()
          .transform((val) => {
            const normalized = val.toLowerCase().trim();
            if (
              ['all', 'agents', 'mcp', 'rules', 'commands', 'hooks', 'guides'].includes(normalized)
            ) {
              return normalized as
                | 'all'
                | 'agents'
                | 'mcp'
                | 'rules'
                | 'commands'
                | 'hooks'
                | 'guides';
            }
            return 'all';
          })
          .describe('Category string normalized to valid value or all'),
      ])
      .optional()
      .default('all')
      .describe('Content category filter, defaults to all'),

    type: z
      .union([
        z
          .enum(['all', 'agent', 'mcp', 'rule', 'command', 'hook'])
          .describe('Predefined content type'),
        z
          .string()
          .transform((val) => {
            const normalized = val.toLowerCase().trim();
            if (['all', 'agent', 'mcp', 'rule', 'command', 'hook'].includes(normalized)) {
              return normalized as 'all' | 'agent' | 'mcp' | 'rule' | 'command' | 'hook';
            }
            return 'all';
          })
          .describe('Content type string normalized to valid value or all'),
      ])
      .optional()
      .describe('Content type filter'),

    tags: z
      .union([
        z
          .string()
          .transform(
            (val) =>
              val
                .split(',')
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0)
                .slice(0, 10) // Maximum 10 tags
          )
          .describe('Comma-separated tag string parsed to array, max 10 tags'),
        z
          .array(z.string().describe('Individual tag string'))
          .transform((tags) =>
            tags
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0)
              .slice(0, 10)
          )
          .describe('Tag array normalized and limited to 10 tags'),
      ])
      .optional()
      .describe('Tag filter as comma-separated string or array'),

    featured: z
      .union([
        z.boolean().describe('Featured flag as boolean'),
        z
          .string()
          .transform((val) => val.toLowerCase() === 'true')
          .describe('Featured flag as string converted to boolean'),
        z
          .literal('true')
          .transform(() => true)
          .describe('Literal true string'),
        z
          .literal('false')
          .transform(() => false)
          .describe('Literal false string'),
      ])
      .optional()
      .describe('Filter for featured content only'),

    trending: z
      .union([
        z.boolean().describe('Trending flag as boolean'),
        z
          .string()
          .transform((val) => val.toLowerCase() === 'true')
          .describe('Trending flag as string converted to boolean'),
        z
          .literal('true')
          .transform(() => true)
          .describe('Literal true string'),
        z
          .literal('false')
          .transform(() => false)
          .describe('Literal false string'),
      ])
      .optional()
      .describe('Filter for trending content only'),
  })
  .describe(
    'Schema for content filtering with category, type, tags, featured, and trending options'
  );

export type FilterParams = z.infer<typeof filterSchema>;

/**
 * Combined search parameters schema
 */
export const searchAPIParamsSchema = searchPaginationSchema
  .merge(searchQuerySchema)
  .merge(sortSchema)
  .merge(filterSchema)
  .describe(
    'Combined schema for all search API parameters including pagination, query, sort, and filters'
  );

export type SearchAPIParams = z.infer<typeof searchAPIParamsSchema>;

/**
 * Jobs page specific schema
 */
export const jobsSearchSchema = searchAPIParamsSchema
  .extend({
    location: z
      .string()
      .optional()
      .transform((val) => val?.trim())
      .refine((val) => !val || val.length <= 100, 'Location is too long')
      .describe('Job location filter, max 100 characters'),

    remote: z
      .union([
        z.boolean().describe('Remote flag as boolean'),
        z
          .string()
          .transform((val) => val.toLowerCase() === 'true')
          .describe('Remote flag as string'),
      ])
      .optional()
      .describe('Filter for remote jobs only'),

    experience: z
      .enum(['entry', 'mid', 'senior', 'lead', 'any'])
      .optional()
      .default('any')
      .describe('Required experience level filter, defaults to any'),

    employment: z
      .enum(['fulltime', 'parttime', 'contract', 'freelance', 'any'])
      .optional()
      .default('any')
      .describe('Employment type filter, defaults to any'),
  })
  .describe(
    'Extended search schema for job listings with location, remote, experience, and employment filters'
  );

export type JobsSearchParams = z.infer<typeof jobsSearchSchema>;

/**
 * Trending page specific schema
 */
export const trendingParamsSchema = searchPaginationSchema
  .merge(filterSchema)
  .extend({
    period: z
      .enum(['today', 'week', 'month', 'year', 'all'])
      .optional()
      .default('week')
      .describe('Time period for trending calculation, defaults to week'),

    metric: z
      .enum(['views', 'likes', 'shares', 'downloads', 'all'])
      .optional()
      .default('views')
      .describe('Metric to use for trending calculation, defaults to views'),
  })
  .describe('Schema for trending content parameters with time period and metric filters');

export type TrendingParams = z.infer<typeof trendingParamsSchema>;

// Auto-generated type exports
export type SearchPagination = z.infer<typeof searchPaginationSchema>;
export type Sort = z.infer<typeof sortSchema>;
export type Filter = z.infer<typeof filterSchema>;

/**
 * Helper function to safely parse search parameters
 */
export function parseSearchParams<T extends z.ZodType>(
  schema: T,
  params: unknown,
  context?: string
): z.infer<T> {
  try {
    // Convert URLSearchParams to plain object if needed
    if (params instanceof URLSearchParams) {
      const obj: Record<string, string | string[]> = {};
      params.forEach((value, key) => {
        if (key in obj) {
          const existing = obj[key];
          obj[key] = Array.isArray(existing) ? [...existing, value] : [existing as string, value];
        } else {
          obj[key] = value;
        }
      });
      return schema.parse(obj);
    }

    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Invalid search parameters', error, {
        context: String(context || 'default'),
        errors: String(error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')),
      });
      // Return default values on validation failure
      return schema.parse({});
    }
    throw error;
  }
}

/**
 * Helper function to convert validated params back to URLSearchParams
 */
export function toURLSearchParams(
  params: Record<string, string | number | boolean | string[]>
): URLSearchParams {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === false) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((v) => {
        searchParams.append(key, String(v));
      });
    } else {
      searchParams.set(key, String(value));
    }
  });

  return searchParams;
}

/**
 * Export all schemas for centralized access
 */
export const searchSchemas = {
  pagination: searchPaginationSchema,
  searchQuery: searchQuerySchema,
  sort: sortSchema,
  filter: filterSchema,
  searchParams: searchAPIParamsSchema,
  jobsSearch: jobsSearchSchema,
  trending: trendingParamsSchema,
  slug: z
    .object({ slug: slugString.describe('URL-safe slug identifier') })
    .describe('Schema for slug-based routing parameters'),
} as const;
