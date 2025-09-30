/**
 * Production-grade search and pagination parameter validation
 * Security-first approach to prevent injection and ensure data integrity
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { nonNegativeInt, percentage, positiveInt } from './primitives/base-numbers';
import { mediumString, nonEmptyString, shortString } from './primitives/base-strings';

/**
 * Searchable item schema for search cache
 * Used with Fuzzysort adapter for high-performance fuzzy search
 */
export const searchableItemSchema = z.object({
  title: nonEmptyString.max(200),
  name: z.string().optional(),
  description: mediumString,
  tags: z.array(z.string().max(50)),
  category: z.string().max(50),
  popularity: percentage.optional(),
  slug: nonEmptyString.max(200),
  id: nonEmptyString.max(200),
});

export type SearchableItem = z.infer<typeof searchableItemSchema>;

/**
 * Search filters schema for search cache
 */
export const searchFiltersSchema = z.object({
  categories: z.array(z.string().max(50)),
  tags: z.array(z.string().max(50)),
  authors: z.array(shortString),
  sort: z.enum(['trending', 'newest', 'alphabetical', 'popularity']),
  popularity: z.tuple([nonNegativeInt, percentage]),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

/**
 * Search cache key schema
 */
export const searchCacheKeySchema = z.object({
  query: mediumString,
  filters: searchFiltersSchema,
});

export type SearchCacheKey = z.infer<typeof searchCacheKeySchema>;

/**
 * Search pagination schema
 */
export const searchPaginationSchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .pipe(positiveInt.max(1000))
    .optional()
    .default(1),

  limit: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .pipe(positiveInt.max(100))
    .optional()
    .default(20),

  offset: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .pipe(nonNegativeInt.max(10000))
    .optional(),
});

export type SearchPaginationParams = z.infer<typeof searchPaginationSchema>;

/**
 * Search query schema with sanitization
 */
export const searchQuerySchema = z.object({
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
    }),

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
    }),

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
    }),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

/**
 * Sort parameters schema
 */
export const sortSchema = z.object({
  sort: z
    .enum(['relevance', 'date', 'popularity', 'name', 'updated', 'created', 'views', 'trending'])
    .optional()
    .default('relevance'),

  order: z.enum(['asc', 'desc']).optional().default('desc'),

  sortBy: z
    .enum(['relevance', 'date', 'popularity', 'name', 'updated', 'created', 'views', 'trending'])
    .optional(),

  orderBy: z.enum(['asc', 'desc']).optional(),
});

export type SortParams = z.infer<typeof sortSchema>;

/**
 * Filter parameters schema
 */
export const filterSchema = z.object({
  category: z
    .union([
      z.enum(['all', 'agents', 'mcp', 'rules', 'commands', 'hooks', 'guides']),
      z.string().transform((val) => {
        const normalized = val.toLowerCase().trim();
        if (['all', 'agents', 'mcp', 'rules', 'commands', 'hooks', 'guides'].includes(normalized)) {
          return normalized as 'all' | 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'guides';
        }
        return 'all';
      }),
    ])
    .optional()
    .default('all'),

  type: z
    .union([
      z.enum(['all', 'agent', 'mcp', 'rule', 'command', 'hook']),
      z.string().transform((val) => {
        const normalized = val.toLowerCase().trim();
        if (['all', 'agent', 'mcp', 'rule', 'command', 'hook'].includes(normalized)) {
          return normalized as 'all' | 'agent' | 'mcp' | 'rule' | 'command' | 'hook';
        }
        return 'all';
      }),
    ])
    .optional(),

  tags: z
    .union([
      z.string().transform(
        (val) =>
          val
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
            .slice(0, 10) // Maximum 10 tags
      ),
      z.array(z.string()).transform((tags) =>
        tags
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
          .slice(0, 10)
      ),
    ])
    .optional(),

  featured: z
    .union([
      z.boolean(),
      z.string().transform((val) => val.toLowerCase() === 'true'),
      z.literal('true').transform(() => true),
      z.literal('false').transform(() => false),
    ])
    .optional(),

  trending: z
    .union([
      z.boolean(),
      z.string().transform((val) => val.toLowerCase() === 'true'),
      z.literal('true').transform(() => true),
      z.literal('false').transform(() => false),
    ])
    .optional(),
});

export type FilterParams = z.infer<typeof filterSchema>;

/**
 * Combined search parameters schema
 */
export const searchAPIParamsSchema = searchPaginationSchema
  .merge(searchQuerySchema)
  .merge(sortSchema)
  .merge(filterSchema);

export type SearchAPIParams = z.infer<typeof searchAPIParamsSchema>;

/**
 * Jobs page specific schema
 */
export const jobsSearchSchema = searchAPIParamsSchema.extend({
  location: z
    .string()
    .optional()
    .transform((val) => val?.trim())
    .refine((val) => !val || val.length <= 100, 'Location is too long'),

  remote: z
    .union([z.boolean(), z.string().transform((val) => val.toLowerCase() === 'true')])
    .optional(),

  experience: z.enum(['entry', 'mid', 'senior', 'lead', 'any']).optional().default('any'),

  employment: z
    .enum(['fulltime', 'parttime', 'contract', 'freelance', 'any'])
    .optional()
    .default('any'),
});

export type JobsSearchParams = z.infer<typeof jobsSearchSchema>;

/**
 * Trending page specific schema
 */
export const trendingParamsSchema = searchPaginationSchema.merge(filterSchema).extend({
  period: z.enum(['today', 'week', 'month', 'year', 'all']).optional().default('week'),

  metric: z.enum(['views', 'likes', 'shares', 'downloads', 'all']).optional().default('views'),
});

export type TrendingParams = z.infer<typeof trendingParamsSchema>;

/**
 * Slug parameter schema for dynamic routes
 */
export const slugParamSchema = z.object({
  slug: nonEmptyString
    .max(200, 'Slug is too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Slug can only contain letters, numbers, hyphens, and underscores')
    .transform((val) => val.toLowerCase()),
});

// Auto-generated type exports
export type SearchPagination = z.infer<typeof searchPaginationSchema>;

export type SlugParam = z.infer<typeof slugParamSchema>;
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
  slug: slugParamSchema,
} as const;
