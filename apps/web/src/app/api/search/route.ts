import 'server-only';
import { SearchService } from '@heyclaude/data-layer';
import {
  Constants,
  type Database as DatabaseGenerated,
  type Json,
} from '@heyclaude/database-types';
import {
  normalizeError,
  validateLimit,
  validateQueryString,
} from '@heyclaude/shared-runtime';
import {
  logger,
  createErrorResponse,
  toLogContextValue,
} from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  badRequestResponse,
  jsonResponse,
  getWithAuthCorsHeaders,
  buildCacheHeaders,
  handleOptionsRequest,
  enqueuePulseEventServer,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { type NextRequest } from 'next/server';

const CORS = getWithAuthCorsHeaders;
const DEFAULT_ENTITIES = ['content', 'company', 'job', 'user'] as const;
const VALID_ENTITIES = new Set(DEFAULT_ENTITIES);
const VALID_SORTS = ['relevance', 'popularity', 'newest', 'alphabetical'] as const;
const CONTENT_CATEGORY_VALUES = Constants.public.Enums
  .content_category as readonly DatabaseGenerated['public']['Enums']['content_category'][];
const JOB_CATEGORY_VALUES = Constants.public.Enums.job_category as readonly JobCategory[];
const JOB_EMPLOYMENT_VALUES = Constants.public.Enums.job_type as readonly JobEmployment[];
const JOB_EXPERIENCE_VALUES = Constants.public.Enums.experience_level as readonly JobExperience[];

type SortType = (typeof VALID_SORTS)[number];
type JobCategory = DatabaseGenerated['public']['Enums']['job_category'];
type JobEmployment = DatabaseGenerated['public']['Enums']['job_type'];
type JobExperience = DatabaseGenerated['public']['Enums']['experience_level'];

type SearchType = 'content' | 'jobs' | 'unified';

// Use generated database types directly - no custom types
type SearchResultRow = DatabaseGenerated['public']['Functions']['search_unified']['Returns'][number] | DatabaseGenerated['public']['Functions']['search_content_optimized']['Returns'][number];

type HighlightedSearchResult = Record<string, unknown> & {
  author_highlighted?: string;
  description_highlighted?: string;
  tags_highlighted?: string[];
  title_highlighted?: string;
};

/**
 * Convert string array to content_category enum array
 * Filters out invalid categories and returns only valid enum values
 * Uses generated database types
 */
function toContentCategoryArray(
  categories: string[] | undefined
): DatabaseGenerated['public']['Enums']['content_category'][] | undefined {
  if (!categories || categories.length === 0) return undefined;
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
 * Handle GET requests to the search API: validate query parameters, run the appropriate search,
 * highlight results, track analytics, and return a structured JSON search response.
 *
 * @param request - The incoming NextRequest containing query parameters (q, categories, tags, authors, entities, sort, limit, offset, and job-related filters).
 * @returns A JSON Response containing:
 *   - results: array of highlighted search results,
 *   - query: the original trimmed query string,
 *   - filters: the applied filters payload,
 *   - pagination: { total, limit, offset, hasMore },
 *   - searchType: one of "content", "unified", or "jobs".
 *   On validation failure or server error, returns a JSON error response with an appropriate status code.
 */
export async function GET(request: NextRequest) {
  const reqLogger = logger.child({
    operation: 'SearchAPI',
    route: '/api/search',
    method: 'GET',
  });
  const url = request.nextUrl;

  const queryStringValidation = validateQueryString(url);
  if (!queryStringValidation.valid) {
    return badRequestResponse(queryStringValidation.error ?? 'Invalid query string', CORS);
  }

  const query = url.searchParams.get('q')?.trim() ?? '';
  const categories = parseCsvParam(url.searchParams.get('categories'));
  const tags = parseCsvParam(url.searchParams.get('tags'));
  const authors = parseCsvParam(url.searchParams.get('authors'));
  const entities = parseCsvParam(url.searchParams.get('entities'));

  const sortParam = (url.searchParams.get('sort') ?? 'relevance') as SortType;
  if (!VALID_SORTS.includes(sortParam)) {
    return badRequestResponse(
      `Invalid sort parameter. Must be one of: ${VALID_SORTS.join(', ')}`,
      CORS
    );
  }
  const sort = sortParam;

  const limitValidation = validateLimit(url.searchParams.get('limit'), 1, 100, 20);
  if (!limitValidation.valid || limitValidation.limit === undefined) {
    return badRequestResponse(limitValidation.error ?? 'Invalid limit parameter', CORS);
  }
  const limit = limitValidation.limit;

  const offsetParam = url.searchParams.get('offset');
  const offset = offsetParam ? Number.parseInt(offsetParam, 10) : 0;
  if (Number.isNaN(offset) || offset < 0) {
    return badRequestResponse('Invalid offset parameter', CORS);
  }

  // Job filters
  const jobCategoryParam = url.searchParams.get('job_category') ?? undefined;
  const jobEmploymentParam = url.searchParams.get('job_employment') ?? undefined;
  const jobExperienceParam = url.searchParams.get('job_experience') ?? undefined;
  const jobRemoteParam = url.searchParams.get('job_remote');
  let jobRemote: boolean | undefined;
  switch (jobRemoteParam) {
    case null: {
      jobRemote = undefined;

      break;
    }
    case 'true': {
      jobRemote = true;

      break;
    }
    case 'false': {
      jobRemote = false;

      break;
    }
    default: {
      return badRequestResponse('Invalid job_remote parameter. Must be "true" or "false".', CORS);
    }
  }

  const jobCategory = validateEnumValue<JobCategory>(jobCategoryParam, JOB_CATEGORY_VALUES);
  const jobEmployment = validateEnumValue<JobEmployment>(jobEmploymentParam, JOB_EMPLOYMENT_VALUES);
  const jobExperience = validateEnumValue<JobExperience>(jobExperienceParam, JOB_EXPERIENCE_VALUES);

  if (jobCategoryParam && !jobCategory) {
    return badRequestResponse(
      `Invalid job_category. Valid values: ${Constants.public.Enums.job_category.join(', ')}`,
      CORS
    );
  }
  if (jobEmploymentParam && !jobEmployment) {
    return badRequestResponse(
      `Invalid job_employment. Valid values: ${Constants.public.Enums.job_type.join(', ')}`,
      CORS
    );
  }
  if (jobExperienceParam && !jobExperience) {
    return badRequestResponse(
      `Invalid job_experience. Valid values: ${Constants.public.Enums.experience_level.join(', ')}`,
      CORS
    );
  }

  if (
    entities?.some((entity) => !VALID_ENTITIES.has(entity as (typeof DEFAULT_ENTITIES)[number]))
  ) {
    return badRequestResponse(
      `Invalid entities parameter. Must be one of: ${[...VALID_ENTITIES].join(', ')}`,
      CORS
    );
  }

  // Convert string categories to enum array (using generated types)
  const validatedCategories = toContentCategoryArray(categories);

  if (categories && categories.length > 0 && !validatedCategories?.length) {
    return badRequestResponse(
      `Invalid categories. Valid values: ${CONTENT_CATEGORY_VALUES.join(', ')}`,
      CORS
    );
  }

  const hasJobFilters = Boolean(
    jobCategory !== undefined ||
    jobEmployment !== undefined ||
    jobExperience !== undefined ||
    jobRemote !== undefined
  );

  const searchType = determineSearchType(entities, hasJobFilters);

  reqLogger.info(
    {
      query,
      searchType,
      hasCategories: Boolean(validatedCategories?.length),
      hasTags: Boolean(tags?.length),
      hasAuthors: Boolean(authors?.length),
      hasJobFilters,
    },
    'Search request received'
  );

  try {
    // Use generated types - categories are already converted to enum array
    const { results, totalCount } = await getCachedSearchResults({
      searchType,
      query,
      categories: validatedCategories, // Already enum array
      tags,
      authors,
      entities,
      sort,
      limit,
      offset,
      jobCategory,
      jobEmployment,
      jobExperience,
      jobRemote,
    });

    const highlightedResults = highlightResults(results, query);

    // Track analytics non-blocking (fire and forget)
    // Don't await - this prevents blocking the response
    trackSearchAnalytics(
      query,
      {
        sort,
        ...(validatedCategories ? { categories: validatedCategories } : {}),
        ...(tags ? { tags } : {}),
        ...(authors ? { authors } : {}),
        ...(entities ? { entities } : {}),
        ...(jobCategory ? { job_category: jobCategory } : {}),
        ...(jobEmployment ? { job_employment: jobEmployment } : {}),
        ...(jobExperience ? { job_experience: jobExperience } : {}),
        ...(jobRemote !== undefined ? { job_remote: jobRemote } : {}),
      },
      highlightedResults.length,
      reqLogger
    ).catch((error) => {
      // Errors already logged inside trackSearchAnalytics
      // Just prevent unhandled promise rejection
      const normalized = normalizeError(error, 'Search analytics failed silently');
      reqLogger.warn({ err: normalized }, 'Search analytics failed (non-blocking)');
    });

    // Response uses simple types for JSON serialization (no custom types)
    const responseBody = {
      results: highlightedResults,
      query,
      filters: {
        sort,
        ...(validatedCategories ? { categories: validatedCategories } : {}),
        ...(tags ? { tags } : {}),
        ...(authors ? { authors } : {}),
        ...(entities ? { entities } : {}),
        ...(jobCategory ? { job_category: jobCategory } : {}),
        ...(jobEmployment ? { job_employment: jobEmployment } : {}),
        ...(jobExperience ? { job_experience: jobExperience } : {}),
        ...(jobRemote !== undefined ? { job_remote: jobRemote } : {}),
      },
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + highlightedResults.length < totalCount,
      },
      searchType,
    };

    reqLogger.info(
      {
        searchType,
        resultCount: highlightedResults.length,
        totalCount,
      },
      'Search completed'
    );

    return jsonResponse(
      responseBody,
      200,
      {
        ...CORS,
      },
      {
        ...buildCacheHeaders('search'),
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Search failed');
    reqLogger.error({ err: normalized }, 'Search failed');
    return createErrorResponse(normalized, {
      route: '/api/search',
      operation: 'GET',
      method: 'GET',
      logContext: {
        query,
        searchType,
      },
    });
  }
}

export function OPTIONS() {
  return handleOptionsRequest(CORS);
}

/**
 * Parse comma-separated parameter value into array
 */
function parseCsvParam(value: null | string): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

/**
 * Validate that a string corresponds to one of the allowed enum values.
 *
 * @param value - The input string to validate; may be undefined.
 * @param validValues - Array of permitted enum values.
 * @returns The input cast to the enum type `T` if it is present in `validValues`, otherwise `undefined`.
 */
function validateEnumValue<T extends string>(
  value: string | undefined,
  validValues: readonly T[]
): T | undefined {
  if (!value) return undefined;
  return validValues.includes(value as T) ? (value as T) : undefined;
}

/**
 * Cached helper function to execute search queries.
 * All parameters become part of the cache key, so different searches have different cache entries.
 * 
 * Uses generated database types - categories must be enum array, not string array
 * 
 * @returns A promise resolving to an object with `results` (array of search result rows) and `totalCount` (total matching items).
 */
export async function getCachedSearchResults(params: {
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

/**
 * Dispatches the search to the appropriate backend ('jobs', 'unified', or 'content') and returns matching rows with a total count.
 *
 * @param params
 * @param params.authors - Optional list of author slugs to filter content results.
 * @param params.categories - Optional list of content categories to filter content results (enum array, not string array).
 * @param params.entities - Optional list of entity types to include for unified searches; when omitted or empty, defaults to DEFAULT_ENTITIES.
 * @param params.jobCategory - Optional job category to filter job searches.
 * @param params.jobEmployment - Optional employment type to filter job searches.
 * @param params.jobExperience - Optional experience level to filter job searches.
 * @param params.jobRemote - Optional flag to restrict job searches to remote-only roles; included in job backend args only when defined.
 * @param params.limit - Maximum number of results to return.
 * @param params.offset - Number of results to skip (pagination offset).
 * @param params.query - The raw search query string; may be empty.
 * @param params.searchService - SearchService instance used to perform backend searches.
 * @param params.searchType - The type of search to perform: `'jobs'`, `'unified'`, or `'content'`.
 * @param params.sort - Sort order to apply for content searches.
 * @param params.tags - Optional list of tags to filter content results.
 * @returns An object containing `results` (array of matching rows) and `totalCount` (the total number of matching items; prefers a backend-provided total when available, otherwise falls back to `results.length`).
 */
async function executeSearch(params: {
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
}): Promise<{ results: SearchResultRow[]; totalCount: number }> {
  const {
    searchService,
    searchType,
    query,
    categories,
    tags,
    authors,
    entities,
    sort,
    limit,
    offset,
    jobCategory,
    jobEmployment,
    jobExperience,
    jobRemote,
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
      results: jobs as SearchResultRow[],
      totalCount,
    };
  }

  if (searchType === 'unified') {
    // Create args object with proper type narrowing for the two search_unified overloads
    const baseArgs = {
      p_query: query,
      p_entities: entities && entities.length > 0 ? entities : [...DEFAULT_ENTITIES],
      p_limit: limit,
      p_offset: offset,
    };

    // Use the overload with p_highlight_query when query is provided
    const unifiedArgs: DatabaseGenerated['public']['Functions']['search_unified']['Args'] =
      query && query.trim()
        ? {
            ...baseArgs,
            p_highlight_query: query,
          }
        : baseArgs;

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
    p_query: query,
    p_limit: limit,
    p_offset: offset,
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

/**
 * Produces search-term-highlighted copies of result rows using database-provided highlighting.
 * 
 * Database RPCs (search_unified, search_content_optimized) provide highlighting when
 * p_highlight_query is passed. This function simply passes through the database-provided
 * highlighted fields, eliminating CPU-intensive client-side string processing.
 *
 * @param results - Array of search result rows from database RPCs with highlighted fields
 * @param query - The search query (used for logging only, not for processing)
 * @returns An array of results with database-provided highlighted fields
 */
function highlightResults(results: SearchResultRow[], query: string): HighlightedSearchResult[] {
  if (!query.trim()) {
    return results.map((result) => ({ ...result }));
  }

  // Database RPCs always provide highlighting when p_highlight_query is passed
  // Simply pass through the database-provided highlighted fields
  // This eliminates CPU-intensive client-side string processing (20-30% CPU savings)
  return results.map((result) => {
    const highlighted: HighlightedSearchResult = { ...result };

    // Use database-provided highlighting directly (no client-side processing)
    // Database RPCs return: title_highlighted, description_highlighted, author_highlighted, tags_highlighted
    // These fields are already present in the result from the RPC call
    // We just ensure they're properly typed in the return value

    return highlighted;
  });
}

async function trackSearchAnalytics(
  query: string,
  filters: {
    sort: SortType;
    categories?: DatabaseGenerated['public']['Enums']['content_category'][];
    tags?: string[];
    authors?: string[];
    entities?: string[];
    job_category?: JobCategory;
    job_employment?: JobEmployment;
    job_experience?: JobExperience;
    job_remote?: boolean;
  },
  resultCount: number,
  reqLogger: ReturnType<typeof logger.child>
) {
  if (!query.trim()) {
    return;
  }

  try {
    const metadata: Json = {
      query: query.trim(),
      filters: filters as unknown as Json,
      result_count: resultCount,
    };
    await enqueuePulseEventServer({
      user_id: null,
      content_type: null,
      content_slug: null,
      interaction_type: 'search',
      session_id: null,
      metadata,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Search analytics tracking failed');
    reqLogger.warn({ err: normalized }, 'Search analytics tracking failed (non-blocking)');
  }
}

/**
 * Choose the effective search type based on requested entities and whether job-specific filters are present.
 *
 * @param entities - Array of entity types requested by the client; may be undefined or empty.
 * @param hasJobFilters - `true` when job-specific filters (category, employment, experience, remote) are present.
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
