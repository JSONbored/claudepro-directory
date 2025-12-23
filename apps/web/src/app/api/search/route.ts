/**
 * Unified Search API Route
 *
 * Provides comprehensive search across content, jobs, companies, and users.
 * Supports filtering, sorting, pagination, and job-specific filters.
 *
 * @example
 * ```ts
 * // Request
 * GET /api/search?q=ai%20agents&categories=agents&sort=popularity&limit=20
 *
 * // Response (200)
 * {
 *   "query": "ai agents",
 *   "results": [...],
 *   "filters": { "categories": ["agents"], "sort": "popularity" },
 *   "pagination": { "total": 42, "limit": 20, "offset": 0, "hasMore": true },
 *   "searchType": "content"
 * }
 * ```
 */

import 'server-only';
import { SearchService } from '@heyclaude/data-layer';
import {
  type SearchContentOptimizedArgs,
  type SearchContentOptimizedRow,
  type SearchUnifiedRow,
} from '@heyclaude/database-types/postgres-types';
import { normalizeError } from '@heyclaude/shared-runtime';
import {
  errorResponseSchema,
  searchResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import {
  createOptionsHandler as createApiOptionsHandler, createApiRoute,
} from '@heyclaude/web-runtime/api/route-factory';
import { searchQuerySchema } from '@heyclaude/web-runtime/api/schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { enqueuePulseEventServer } from '@heyclaude/web-runtime/pulse';
import { getOnlyCorsHeaders, jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';
import {
  isValidCategory,
  VALID_CATEGORIES,
} from '@heyclaude/web-runtime/utils/category-validation';
import {
  type content_category,
  type experience_level,
  type job_category,
  type job_type,
  type Prisma,
} from '@prisma/client';
import { cacheLife } from 'next/cache';

type Json = Prisma.JsonValue;

type jobsModel = Prisma.jobsGetPayload<{}>;

// OPTIMIZATION: Use SearchService methods instead of separate helper files

// Use Prisma model type instead of excluded composite type
type Jobs = jobsModel;

type JobCategory = job_category;
type JobEmployment = job_type;
type JobExperience = experience_level;

type SortType = 'alphabetical' | 'newest' | 'popularity' | 'relevance';
type SearchType = 'content' | 'jobs' | 'unified';

// Use Prisma-generated types directly - no custom types
// Functions now return composite types, so we extract the row types from the results array
// Also include jobs composite type for filter_jobs results
type SearchResultRow = Jobs | SearchContentOptimizedRow | SearchUnifiedRow;

/**
 * GET /api/search - Unified search across content, jobs, companies, and users
 *
 * Provides comprehensive search with filtering, sorting, pagination, and job-specific filters.
 * Validates all query parameters using Zod schema and processes search results.
 */
export const GET = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, query }) => {
    // Zod schema ensures proper types
    const {
      authors: authorsArray,
      categories: categoriesArray,
      entities: entitiesArray,
      job_category: jobCategory,
      job_employment: jobEmployment,
      job_experience: jobExperience,
      job_remote: jobRemote,
      limit,
      offset,
      q: queryString,
      sort,
      tags: tagsArray,
    } = query;

    // Trim query string
    const trimmedQuery = queryString.trim();

    // Convert categories array to enum array (using Prisma types)
    const validatedCategories = (() => {
      if (!categoriesArray || categoriesArray.length === 0) return;
      const valid = categoriesArray
        .map((cat) => {
          const normalized = cat.trim().toLowerCase();
          return isValidCategory(normalized) ? normalized : null;
        })
        .filter((cat): cat is content_category => cat !== null);
      return valid.length > 0
        ? (valid as NonNullable<SearchContentOptimizedArgs['p_categories']>)
        : undefined;
    })();

    if (categoriesArray && categoriesArray.length > 0 && !validatedCategories?.length) {
      throw new Error(`Invalid categories. Valid values: ${VALID_CATEGORIES.join(', ')}`);
    }

    const hasJobFilters = Boolean(
      jobCategory !== undefined ||
      jobEmployment !== undefined ||
      jobExperience !== undefined ||
      jobRemote !== undefined
    );

    const searchType: SearchType = hasJobFilters
      ? 'jobs'
      : entitiesArray && entitiesArray.length > 0
        ? 'unified'
        : 'content';

    logger.info(
      {
        hasAuthors: Boolean(authorsArray?.length),
        hasCategories: Boolean(validatedCategories?.length),
        hasJobFilters,
        hasTags: Boolean(tagsArray?.length),
        query: trimmedQuery,
        searchType,
      },
      'Search request received'
    );

    // Use generated types - categories are already converted to enum array
    const { results, totalCount } = await getCachedSearchResults({
      authors: authorsArray,
      categories: validatedCategories, // Already enum array
      entities: entitiesArray,
      jobCategory,
      jobEmployment,
      jobExperience,
      jobRemote,
      limit,
      offset,
      query: trimmedQuery,
      searchType,
      sort,
      tags: tagsArray,
    });

    const highlightedResults = SearchService.highlightResults(results, trimmedQuery);

    // Track analytics non-blocking (fire and forget)
    // Don't await - this prevents blocking the response
    // Build analytics params object, only including properties with values (for exactOptionalPropertyTypes)
    const analyticsParams: {
      authors?: string[];
      categories?: SearchContentOptimizedArgs['p_categories'];
      entities?: string[];
      job_category?: job_category;
      job_employment?: job_type;
      job_experience?: experience_level;
      job_remote?: boolean;
      sort: SortType;
      tags?: string[];
    } = {
      sort,
    };
    if (validatedCategories && validatedCategories.length > 0) {
      analyticsParams.categories = validatedCategories;
    }
    if (tagsArray && tagsArray.length > 0) {
      analyticsParams.tags = tagsArray;
    }
    if (authorsArray && authorsArray.length > 0) {
      analyticsParams.authors = authorsArray;
    }
    if (entitiesArray && entitiesArray.length > 0) {
      analyticsParams.entities = entitiesArray;
    }
    if (jobCategory) {
      analyticsParams.job_category = jobCategory;
    }
    if (jobEmployment) {
      analyticsParams.job_employment = jobEmployment;
    }
    if (jobExperience) {
      analyticsParams.job_experience = jobExperience;
    }
    if (jobRemote !== undefined) {
      analyticsParams.job_remote = jobRemote;
    }
    // Track analytics non-blocking (fire and forget)
    if (trimmedQuery) {
      (async () => {
        try {
          const metadata: Json = {
            filters: analyticsParams,
            query: trimmedQuery,
            result_count: highlightedResults.length,
          };
          await enqueuePulseEventServer({
            content_slug: null,
            content_type: null,
            interaction_type: 'search',
            metadata,
            session_id: null,
            user_id: null,
          });
        } catch (error) {
          const normalized = normalizeError(error, 'Search analytics tracking failed');
          logger.warn({ err: normalized }, 'Search analytics tracking failed (non-blocking)');
        }
      })().catch((error) => {
        const normalized = normalizeError(error, 'Search analytics failed silently');
        logger.warn({ err: normalized }, 'Search analytics failed (non-blocking)');
      });
    }

    // Response uses simple types for JSON serialization (no custom types)
    const responseBody = {
      filters: {
        sort,
        ...(validatedCategories ? { categories: validatedCategories } : {}),
        ...(tagsArray ? { tags: tagsArray } : {}),
        ...(authorsArray ? { authors: authorsArray } : {}),
        ...(entitiesArray ? { entities: entitiesArray } : {}),
        ...(jobCategory ? { job_category: jobCategory } : {}),
        ...(jobEmployment ? { job_employment: jobEmployment } : {}),
        ...(jobExperience ? { job_experience: jobExperience } : {}),
        ...(jobRemote === undefined ? {} : { job_remote: jobRemote }),
      },
      pagination: {
        hasMore: offset + highlightedResults.length < totalCount,
        limit,
        offset,
        total: totalCount,
      },
      query: trimmedQuery,
      results: highlightedResults,
      searchType,
    };

    logger.info(
      {
        resultCount: highlightedResults.length,
        searchType,
        totalCount,
      },
      'Search completed'
    );

    return jsonResponse(responseBody, 200, getOnlyCorsHeaders);
  },
  method: 'GET',
  openapi: {
    description:
      'Provides comprehensive search with filtering, sorting, pagination, and job-specific filters. Supports content, jobs, companies, and users in a single unified search.',
    operationId: 'search',
    responses: {
      200: {
        description: 'Search results retrieved successfully',
        example: {
          filters: {
            categories: ['agents'],
            sort: 'relevance',
            tags: ['ai', 'automation'],
          },
          pagination: {
            hasMore: true,
            limit: 20,
            offset: 0,
            total: 42,
          },
          query: 'ai agents',
          results: [
            {
              category: 'agents',
              description: 'A comprehensive framework for building AI agents',
              id: 'content-1',
              slug: 'ai-agent-framework',
              title: 'AI Agent Framework',
            },
          ],
          searchType: 'content',
        },
        headers: {
          'Cache-Control': {
            description: 'Cache control directive',
            schema: { type: 'string' },
          },
          'X-RateLimit-Remaining': {
            description: 'Remaining rate limit requests',
            schema: { type: 'string' },
          },
          'X-RateLimit-Reset': {
            description: 'Rate limit reset timestamp',
            schema: { type: 'string' },
          },
        },
        schema: searchResponseSchema,
      },
      400: {
        description: 'Invalid query parameters',
        example: {
          error: 'Invalid query parameters',
          message:
            'Invalid categories. Valid values: agents, mcp, rules, commands, hooks, statuslines, skills, collections, guides, jobs, changelog',
        },
        schema: errorResponseSchema,
      },
      500: {
        description: 'Internal server error',
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while processing the search request',
        },
        schema: errorResponseSchema,
      },
    },
    summary: 'Unified search across content, jobs, companies, and users',
    tags: ['search', 'content', 'jobs'],
  },
  operation: 'SearchAPI',
  querySchema: searchQuerySchema,
  route: getVersionedRoute('search'),
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('auth');

/**
 * Cached helper function to execute search queries.
 * All parameters become part of the cache key, so different searches have different cache entries.
 *
 * Uses Prisma-generated enum types - categories must be enum array, not string array
 *
 * @param params - Search parameters
 * @param params.authors
 * @param params.categories
 * @param params.entities
 * @param params.jobCategory
 * @param params.jobEmployment
 * @param params.jobExperience
 * @param params.jobRemote
 * @param params.limit
 * @param params.offset
 * @param params.query
 * @param params.searchType
 * @param params.sort
 * @param params.tags
 * @returns A promise resolving to an object with `results` (array of search result rows) and `totalCount` (total matching items).
 */
export async function getCachedSearchResults(params: {
  authors?: string[] | undefined;
  categories?: SearchContentOptimizedArgs['p_categories']; // Use generated function arg type
  entities?: string[] | undefined;
  jobCategory?: JobCategory | undefined;
  jobEmployment?: JobEmployment | undefined;
  jobExperience?: JobExperience | undefined;
  jobRemote?: boolean | undefined;
  limit: number;
  offset: number;
  query: string;
  searchType: SearchType;
  sort: SortType;
  tags?: string[] | undefined;
}): Promise<{ results: SearchResultRow[]; totalCount: number }> {
  'use cache';
  cacheLife('short'); // 15min stale, 5min revalidate, 2hr expire - Search results change frequently

  // OPTIMIZATION: Instantiate service directly to avoid barrel export issues
  // (client/server boundary, performance, and module resolution problems)
  const { SearchService } = await import('@heyclaude/data-layer');
  const searchService = new SearchService();

  return searchService.executeSearch(params as Parameters<SearchService['executeSearch']>[0]);
}
