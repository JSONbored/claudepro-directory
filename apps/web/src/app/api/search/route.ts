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
  Constants,
  type Database as DatabaseGenerated,
  type Json,
} from '@heyclaude/database-types';
import { normalizeError } from '@heyclaude/shared-runtime';
import { createApiRoute, createApiOptionsHandler, searchQuerySchema } from '@heyclaude/web-runtime/server';
import {
  buildCacheHeaders,
  createSupabaseAnonClient,
  enqueuePulseEventServer,
  getWithAuthCorsHeaders,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';

type JobCategory = DatabaseGenerated['public']['Enums']['job_category'];
type JobEmployment = DatabaseGenerated['public']['Enums']['job_type'];
type JobExperience = DatabaseGenerated['public']['Enums']['experience_level'];

type SortType = 'relevance' | 'popularity' | 'newest' | 'alphabetical';
type SearchType = 'content' | 'jobs' | 'unified';

const DEFAULT_ENTITIES = ['content', 'company', 'job', 'user'] as const;

// Use generated database types directly - no custom types
// Functions now return composite types, so we extract the row types from the results array
// Also include jobs table row type for filter_jobs results
type SearchResultRow =
  | DatabaseGenerated['public']['CompositeTypes']['search_content_optimized_row']
  | DatabaseGenerated['public']['CompositeTypes']['search_unified_row']
  | DatabaseGenerated['public']['Tables']['jobs']['Row'];

// HighlightedSearchResult is now just SearchResultRow since database provides highlighted fields
type HighlightedSearchResult = SearchResultRow;

/***
 *
 * Convert string array to content_category enum array
 * Filters out invalid categories and returns only valid enum values
 * Uses generated database types
 * @param {string[] | undefined} categories
 * @returns {Array<DatabaseGenerated['public']['Enums']['content_category']> | undefined} Return value description
 */
function toContentCategoryArray(
  categories: string[] | undefined
): Array<DatabaseGenerated['public']['Enums']['content_category']> | undefined {
  if (!categories || categories.length === 0) return undefined;
  const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category as ReadonlyArray<
    DatabaseGenerated['public']['Enums']['content_category']
  >;
  const valid = categories
    .map((cat) => {
      const lowered = cat.trim().toLowerCase();
      return CONTENT_CATEGORY_VALUES.includes(
        lowered as DatabaseGenerated['public']['Enums']['content_category']
      )
        ? (lowered as DatabaseGenerated['public']['Enums']['content_category'])
        : null;
    })
    .filter((cat): cat is DatabaseGenerated['public']['Enums']['content_category'] => cat !== null);
  return valid.length > 0 ? valid : undefined;
}

/**
 * GET /api/search - Unified search across content, jobs, companies, and users
 * 
 * Provides comprehensive search with filtering, sorting, pagination, and job-specific filters.
 * Validates all query parameters using Zod schema and processes search results.
 */
export const GET = createApiRoute({
  route: '/api/search',
  operation: 'SearchAPI',
  method: 'GET',
  cors: 'auth',
  querySchema: searchQuerySchema,
  openapi: {
    summary: 'Unified search across content, jobs, companies, and users',
    description: 'Provides comprehensive search with filtering, sorting, pagination, and job-specific filters. Supports content, jobs, companies, and users in a single unified search.',
    tags: ['search', 'content', 'jobs'],
    operationId: 'search',
    responses: {
      200: {
        description: 'Search results retrieved successfully',
      },
      400: {
        description: 'Invalid query parameters',
      },
    },
  },
  handler: async ({ logger, query }) => {
    // Zod schema ensures proper types
    const {
      q: queryString,
      categories: categoriesArray,
      tags: tagsArray,
      authors: authorsArray,
      entities: entitiesArray,
      sort,
      limit,
      offset,
      job_category: jobCategory,
      job_employment: jobEmployment,
      job_experience: jobExperience,
      job_remote: jobRemote,
    } = query;

    // Trim query string
    const trimmedQuery = queryString.trim();

    // Convert categories array to enum array (using generated types)
    const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category as ReadonlyArray<
      DatabaseGenerated['public']['Enums']['content_category']
    >;
    const validatedCategories = toContentCategoryArray(categoriesArray);

    if (categoriesArray && categoriesArray.length > 0 && !validatedCategories?.length) {
      throw new Error(
        `Invalid categories. Valid values: ${CONTENT_CATEGORY_VALUES.join(', ')}`
      );
    }

    const hasJobFilters = Boolean(
      jobCategory !== undefined ||
      jobEmployment !== undefined ||
      jobExperience !== undefined ||
      jobRemote !== undefined
    );

    const searchType = determineSearchType(entitiesArray, hasJobFilters);

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

    const highlightedResults = highlightResults(results, trimmedQuery);

    // Track analytics non-blocking (fire and forget)
    // Don't await - this prevents blocking the response
    trackSearchAnalytics(
      trimmedQuery,
      {
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
      highlightedResults.length,
      {
        error: (context: Record<string, unknown>, message: string) => logger.error(context as Parameters<typeof logger.error>[0], message),
        warn: (context: Record<string, unknown>, message: string) => logger.warn(context as Parameters<typeof logger.warn>[0], message),
      }
    ).catch((error) => {
      // Errors already logged inside trackSearchAnalytics
      // Just prevent unhandled promise rejection
      const normalized = normalizeError(error, 'Search analytics failed silently');
      logger.warn({ err: normalized }, 'Search analytics failed (non-blocking)');
    });

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

    return jsonResponse(
      responseBody,
      200,
      getWithAuthCorsHeaders,
      {
        ...buildCacheHeaders('search'),
      }
    );
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('auth');


/**
 * Cached helper function to execute search queries.
 * All parameters become part of the cache key, so different searches have different cache entries.
 *
 * Uses generated database types - categories must be enum array, not string array
 *
 * @param params
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
  categories?: Array<DatabaseGenerated['public']['Enums']['content_category']> | undefined; // Use generated enum type
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
  cacheLife('quarter'); // 15min stale, 5min revalidate, 2hr expire - Search results change frequently (defined in next.config.mjs)

  const supabase = createSupabaseAnonClient();
  const searchService = new SearchService(supabase);

  return executeSearch({
    searchService,
    ...params,
  });
}

/************
 * Dispatches the search to the appropriate backend ('jobs', 'unified', or 'content') and returns matching rows with a total count.
 *
 * @param {{
  authors?: string[] | undefined;
  categories?: DatabaseGenerated['public']['Enums']['content_category'][] | undefined; // Use generated enum type
  entities?: string[] | undefined;
  jobCategory?: JobCategory | undefined;
  jobEmployment?: JobEmployment | undefined;
  jobExperience?: JobExperience | undefined;
  jobRemote?: boolean | undefined;
  limit: number;
  offset: number;
  query: string;
  searchService: SearchService;
  searchType: SearchType;
  sort: SortType;
  tags?: string[] | undefined;
}} params
 * @param {{
  authors?: string[] | undefined;
  categories?: Array<DatabaseGenerated['public']['Enums']['content_category']> | undefined; // Use generated enum type
  entities?: string[] | undefined;
  jobCategory?: JobCategory | undefined;
  jobEmployment?: JobEmployment | undefined;
  jobExperience?: JobExperience | undefined;
  jobRemote?: boolean | undefined;
  limit: number;
  offset: number;
  query: string;
  searchService: SearchService;
  searchType: SearchType;
  sort: SortType;
  tags?: string[] | undefined;
}} params.authors - Optional list of author slugs to filter content results.
 * @param {{
  authors?: string[] | undefined;
  categories?: Array<DatabaseGenerated['public']['Enums']['content_category']> | undefined; // Use generated enum type
  entities?: string[] | undefined;
  jobCategory?: JobCategory | undefined;
  jobEmployment?: JobEmployment | undefined;
  jobExperience?: JobExperience | undefined;
  jobRemote?: boolean | undefined;
  limit: number;
  offset: number;
  query: string;
  searchService: SearchService;
  searchType: SearchType;
  sort: SortType;
  tags?: string[] | undefined;
}} params.categories - Optional list of content categories to filter content results (enum array, not string array).
 * @param {{
  authors?: string[] | undefined;
  categories?: Array<DatabaseGenerated['public']['Enums']['content_category']> | undefined; // Use generated enum type
  entities?: string[] | undefined;
  jobCategory?: JobCategory | undefined;
  jobEmployment?: JobEmployment | undefined;
  jobExperience?: JobExperience | undefined;
  jobRemote?: boolean | undefined;
  limit: number;
  offset: number;
  query: string;
  searchService: SearchService;
  searchType: SearchType;
  sort: SortType;
  tags?: string[] | undefined;
}} params.entities - Optional list of entity types to include for unified searches; when omitted or empty, defaults to DEFAULT_ENTITIES.
 * @param {{
  authors?: string[] | undefined;
  categories?: Array<DatabaseGenerated['public']['Enums']['content_category']> | undefined; // Use generated enum type
  entities?: string[] | undefined;
  jobCategory?: JobCategory | undefined;
  jobEmployment?: JobEmployment | undefined;
  jobExperience?: JobExperience | undefined;
  jobRemote?: boolean | undefined;
  limit: number;
  offset: number;
  query: string;
  searchService: SearchService;
  searchType: SearchType;
  sort: SortType;
  tags?: string[] | undefined;
}} params.jobCategory - Optional job category to filter job searches.
 * @param {{
  authors?: string[] | undefined;
  categories?: Array<DatabaseGenerated['public']['Enums']['content_category']> | undefined; // Use generated enum type
  entities?: string[] | undefined;
  jobCategory?: JobCategory | undefined;
  jobEmployment?: JobEmployment | undefined;
  jobExperience?: JobExperience | undefined;
  jobRemote?: boolean | undefined;
  limit: number;
  offset: number;
  query: string;
  searchService: SearchService;
  searchType: SearchType;
  sort: SortType;
  tags?: string[] | undefined;
}} params.jobEmployment - Optional employment type to filter job searches.
 * @param {{
  authors?: string[] | undefined;
  categories?: Array<DatabaseGenerated['public']['Enums']['content_category']> | undefined; // Use generated enum type
  entities?: string[] | undefined;
  jobCategory?: JobCategory | undefined;
  jobEmployment?: JobEmployment | undefined;
  jobExperience?: JobExperience | undefined;
  jobRemote?: boolean | undefined;
  limit: number;
  offset: number;
  query: string;
  searchService: SearchService;
  searchType: SearchType;
  sort: SortType;
  tags?: string[] | undefined;
}} params.jobExperience - Optional experience level to filter job searches.
 * @param {{
  authors?: string[] | undefined;
  categories?: Array<DatabaseGenerated['public']['Enums']['content_category']> | undefined; // Use generated enum type
  entities?: string[] | undefined;
  jobCategory?: JobCategory | undefined;
  jobEmployment?: JobEmployment | undefined;
  jobExperience?: JobExperience | undefined;
  jobRemote?: boolean | undefined;
  limit: number;
  offset: number;
  query: string;
  searchService: SearchService;
  searchType: SearchType;
  sort: SortType;
  tags?: string[] | undefined;
}} params.jobRemote - Optional flag to restrict job searches to remote-only roles; included in job backend args only when defined.
 * @param {{
  authors?: string[] | undefined;
  categories?: Array<DatabaseGenerated['public']['Enums']['content_category']> | undefined; // Use generated enum type
  entities?: string[] | undefined;
  jobCategory?: JobCategory | undefined;
  jobEmployment?: JobEmployment | undefined;
  jobExperience?: JobExperience | undefined;
  jobRemote?: boolean | undefined;
  limit: number;
  offset: number;
  query: string;
  searchService: SearchService;
  searchType: SearchType;
  sort: SortType;
  tags?: string[] | undefined;
}} params.limit - Maximum number of results to return.
 * @param {{
  authors?: string[] | undefined;
  categories?: Array<DatabaseGenerated['public']['Enums']['content_category']> | undefined; // Use generated enum type
  entities?: string[] | undefined;
  jobCategory?: JobCategory | undefined;
  jobEmployment?: JobEmployment | undefined;
  jobExperience?: JobExperience | undefined;
  jobRemote?: boolean | undefined;
  limit: number;
  offset: number;
  query: string;
  searchService: SearchService;
  searchType: SearchType;
  sort: SortType;
  tags?: string[] | undefined;
}} params.offset - Number of results to skip (pagination offset).
 * @param params.query - The raw search query string; may be empty.
 * @param params.searchService - SearchService instance used to perform backend searches.
 * @param params.searchType - The type of search to perform: `'jobs'`, `'unified'`, or `'content'`.
 * @param params.sort - Sort order to apply for content searches.
 * @param params.tags - Optional list of tags to filter content results.
 * @returns An object containing `results` (array of matching rows) and `totalCount` (the total number of matching items; prefers a backend-provided total when available, otherwise falls back to `results.length`).
 */
async function executeSearch(params: {
  authors?: string[] | undefined;
  categories?: Array<DatabaseGenerated['public']['Enums']['content_category']> | undefined; // Use generated enum type
  entities?: string[] | undefined;
  jobCategory?: JobCategory | undefined;
  jobEmployment?: JobEmployment | undefined;
  jobExperience?: JobExperience | undefined;
  jobRemote?: boolean | undefined;
  limit: number;
  offset: number;
  query: string;
  searchService: SearchService;
  searchType: SearchType;
  sort: SortType;
  tags?: string[] | undefined;
}): Promise<{ results: SearchResultRow[]; totalCount: number }> {
  const {
    authors,
    categories,
    entities,
    jobCategory,
    jobEmployment,
    jobExperience,
    jobRemote,
    limit,
    offset,
    query,
    searchService,
    searchType,
    sort,
    tags,
  } = params;

  if (searchType === 'jobs') {
    const jobArgs: DatabaseGenerated['public']['Functions']['filter_jobs']['Args'] = {
      p_limit: limit,
      p_offset: offset,
    };

    if (query) {
      jobArgs.p_search_query = query;
    }
    if (jobCategory) {
      jobArgs.p_category = jobCategory;
    }
    if (jobEmployment) {
      jobArgs.p_employment_type = jobEmployment;
    }
    if (jobExperience) {
      jobArgs.p_experience_level = jobExperience;
    }
    if (jobRemote !== undefined) {
      jobArgs.p_remote_only = jobRemote;
    }

    const result = await searchService.filterJobs(jobArgs);

    const jobs = result.jobs ?? [];
    const totalCount = typeof result.total_count === 'number' ? result.total_count : jobs.length;
    return {
      results: jobs as SearchResultRow[], // Jobs table row is part of SearchResultRow union type
      totalCount,
    };
  }

  if (searchType === 'unified') {
    // Create args object - search_unified now has single function with optional p_highlight_query
    const unifiedArgs: DatabaseGenerated['public']['Functions']['search_unified']['Args'] = {
      p_entities: entities && entities.length > 0 ? entities : [...DEFAULT_ENTITIES],
      p_limit: limit,
      p_offset: offset,
      p_query: query,
      ...(query && query.trim() ? { p_highlight_query: query } : {}),
    };

    const unifiedResult = await searchService.searchUnified(unifiedArgs);

    const rows = Array.isArray(unifiedResult.data) ? unifiedResult.data : [];
    const totalCount =
      typeof unifiedResult.total_count === 'number' ? unifiedResult.total_count : rows.length;
    return {
      results: rows as SearchResultRow[],
      totalCount,
    };
  }

  // searchType === 'content'
  const args: DatabaseGenerated['public']['Functions']['search_content_optimized']['Args'] = {
    p_limit: limit,
    p_offset: offset,
    p_query: query,
    p_sort: sort,
  };

  if (categories?.length) {
    // categories is already enum array from getCachedSearchResults params
    args.p_categories = categories;
  }
  if (tags?.length) {
    args.p_tags = tags;
  }
  if (authors?.length) {
    args.p_authors = authors;
  }

  // Add highlighting parameter when query is provided
  if (query && query.trim()) {
    args.p_highlight_query = query;
  }

  const result = await searchService.searchContent(args);
  const rows = Array.isArray(result.data) ? result.data : [];
  const totalCount = typeof result.total_count === 'number' ? result.total_count : rows.length;
  return {
    results: rows as SearchResultRow[],
    totalCount,
  };
}

/****
 * Produces search-term-highlighted copies of result rows using database-provided highlighting.
 *
 * Database RPCs (search_unified, search_content_optimized) provide highlighting when
 * p_highlight_query is passed. This function simply passes through the database-provided
 * highlighted fields, eliminating CPU-intensive client-side string processing.
 *
 * @param {SearchResultRow[]} results - Array of search result rows from database RPCs with highlighted fields
 * @param {string} query - The search query (used for logging only, not for processing)
 * @returns An array of results with database-provided highlighted fields
 */
function highlightResults(results: SearchResultRow[], query: string): HighlightedSearchResult[] {
  if (!query.trim()) {
    return results.map((result) => ({ ...result }));
  }

  // Database RPCs always provide highlighting when p_highlight_query is passed
  // Simply pass through the database-provided highlighted fields
  // This eliminates CPU-intensive client-side string processing (20-30% CPU savings)
  // SearchResultRow already includes highlighted fields, so we can return it directly
  return results;
}

async function trackSearchAnalytics(
  query: string,
  filters: {
    authors?: string[];
    categories?: Array<DatabaseGenerated['public']['Enums']['content_category']>;
    entities?: string[];
    job_category?: JobCategory;
    job_employment?: JobEmployment;
    job_experience?: JobExperience;
    job_remote?: boolean;
    sort: SortType;
    tags?: string[];
  },
  resultCount: number,
  reqLogger: { error: (context: Record<string, unknown>, message: string) => void; warn: (context: Record<string, unknown>, message: string) => void }
) {
  if (!query.trim()) {
    return;
  }

  try {
    const metadata: Json = {
      filters: filters as Json,
      query: query.trim(),
      result_count: resultCount,
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
    reqLogger.warn({ err: normalized }, 'Search analytics tracking failed (non-blocking)');
  }
}

/****
 * Choose the effective search type based on requested entities and whether job-specific filters are present.
 *
 * @param {string[] | undefined} entities - Array of entity types requested by the client; may be undefined or empty.
 * @param {boolean} hasJobFilters - `true` when job-specific filters (category, employment, experience, remote) are present.
 * @returns The search type to use: `'jobs'` when job filters are present, `'unified'` when entities are specified, otherwise `'content'`.
 */
function determineSearchType(entities: string[] | undefined, hasJobFilters: boolean): SearchType {
  if (hasJobFilters) {
    return 'jobs';
  }
  if (entities && entities.length > 0) {
    return 'unified';
  }
  return 'content';
}
