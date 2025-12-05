import 'server-only';

import { SearchService } from '@heyclaude/data-layer';
import {
  Constants,
  type Database as DatabaseGenerated,
  type Json,
} from '@heyclaude/database-types';
import {
  highlightSearchTerms,
  highlightSearchTermsArray,
  normalizeError,
  validateLimit,
  validateQueryString,
} from '@heyclaude/shared-runtime';
import {
  generateRequestId,
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
type HighlightedSearchResult = Record<string, unknown> & {
  author_highlighted?: string;
  description_highlighted?: string;
  tags_highlighted?: string[];
  title_highlighted?: string;
};

type SearchType = 'content' | 'jobs' | 'unified';

interface FiltersPayload {
  authors?: string[];
  categories?: string[];
  entities?: string[];
  entity?: string;
  job_category?: DatabaseGenerated['public']['Enums']['job_category'];
  job_employment?: DatabaseGenerated['public']['Enums']['job_type'];
  job_experience?: DatabaseGenerated['public']['Enums']['experience_level'];
  job_remote?: boolean;
  sort: SortType;
  tags?: string[];
}

type SearchResultRow = Record<string, unknown>;

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
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
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
  const jobRemote =
    jobRemoteParam === 'true' ? true : jobRemoteParam === 'false' ? false : undefined;

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

  const validatedCategories = categories?.filter((category) =>
    CONTENT_CATEGORY_VALUES.includes(category as (typeof CONTENT_CATEGORY_VALUES)[number])
  );

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

  const filtersPayload: FiltersPayload = {
    sort,
    ...(validatedCategories ? { categories: validatedCategories } : {}),
    ...(tags ? { tags } : {}),
    ...(authors ? { authors } : {}),
    ...(entities ? { entities } : {}),
    ...(jobCategory ? { job_category: jobCategory } : {}),
    ...(jobEmployment ? { job_employment: jobEmployment } : {}),
    ...(jobExperience ? { job_experience: jobExperience } : {}),
    ...(jobRemote === undefined ? {} : { job_remote: jobRemote }),
  };

  if (searchType === 'jobs') {
    filtersPayload.entity = 'job';
  }

  reqLogger.info('Search request received', {
    query,
    searchType,
    filters: toLogContextValue(filtersPayload),
  });

  const supabase = createSupabaseAnonClient();
  const searchService = new SearchService(supabase);

  try {
    const { results, totalCount } = await executeSearch({
      searchService,
      searchType,
      query,
      categories: validatedCategories,
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

    await trackSearchAnalytics(
      query,
      {
        ...filtersPayload,
        ...(searchType === 'jobs' ? { entity: 'job' } : {}),
      },
      highlightedResults.length,
      reqLogger
    );

    const responseBody = {
      results: highlightedResults,
      query,
      filters: filtersPayload,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + highlightedResults.length < totalCount,
      },
      searchType,
    } satisfies {
      filters: FiltersPayload;
      pagination: {
        hasMore: boolean;
        limit: number;
        offset: number;
        total: number;
      };
      query: string;
      results: HighlightedSearchResult[];
      searchType: SearchType;
    };

    reqLogger.info('Search completed', {
      searchType,
      resultCount: highlightedResults.length,
      totalCount,
    });

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
    const normalized = normalizeError(error, 'Search request failed');
    reqLogger.error('Search request failed', normalized);
    return createErrorResponse(error, {
      route: '/api/search',
      operation: 'SearchAPI',
      method: 'GET',
      logContext: {
        requestId,
        searchType,
      },
    });
  }
}

/**
 * Handle CORS preflight (OPTIONS) requests for the search API route.
 *
 * @returns A Response configured for an HTTP OPTIONS preflight, including appropriate CORS headers.
 * @see handleOptionsRequest
 * @see CORS
 */
export function OPTIONS() {
  return handleOptionsRequest(CORS);
}

/**
 * Convert a comma-separated string into an array of trimmed, non-empty values.
 *
 * @param {null | string} value - The comma-separated input string, or `null` to indicate absence.
 * @returns {string[] | undefined} An array of trimmed, non-empty strings parsed from `value`, or `undefined` if `value` is `null`, empty, or contains no valid parts.
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
 * Dispatches the search to the appropriate backend ('jobs', 'unified', or 'content') and returns matching rows with a total count.
 *
 * @param params.authors - Optional list of author slugs to filter content results.
 * @param params.categories - Optional list of content categories to filter content results.
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
  categories?: string[] | undefined;
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
    const unifiedResult = await searchService.searchUnified({
      p_query: query,
      p_entities: entities && entities.length > 0 ? entities : [...DEFAULT_ENTITIES],
      p_limit: limit,
      p_offset: offset,
    });

    const rows = Array.isArray(unifiedResult.data) ? unifiedResult.data : [];
    const totalCount =
      typeof unifiedResult.total_count === 'number' ? unifiedResult.total_count : rows.length;
    return {
      results: rows as SearchResultRow[],
      totalCount,
    };
  }

  const args: DatabaseGenerated['public']['Functions']['search_content_optimized']['Args'] = {
    p_query: query,
    p_limit: limit,
    p_offset: offset,
    p_sort: sort,
  };

  if (categories?.length) {
    args.p_categories = categories as DatabaseGenerated['public']['Enums']['content_category'][];
  }
  if (tags?.length) {
    args.p_tags = tags;
  }
  if (authors?.length) {
    args.p_authors = authors;
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
 * Produces search-term-highlighted copies of result rows when a query is provided.
 *
 * @param results - Array of search result rows to process; each row may include `title`, `description`, `author`, and `tags`.
 * @param query - The search query used to generate highlights; ignored when empty or whitespace-only.
 * @returns An array of results where each item is a shallow copy of the input row and, when applicable, contains highlighted fields: `title_highlighted`, `description_highlighted`, `author_highlighted`, and `tags_highlighted`.
 * @see highlightSearchTerms
 * @see highlightSearchTermsArray
 */
function highlightResults(results: SearchResultRow[], query: string): HighlightedSearchResult[] {
  if (!query.trim()) {
    return results.map((result) => ({ ...result }));
  }

  return results.map((result) => {
    const highlighted: HighlightedSearchResult = { ...result };

    const titleValue = result['title'];
    const descriptionValue = result['description'];
    const authorValue = result['author'];
    const tagsValue = result['tags'];

    const title = typeof titleValue === 'string' ? titleValue : undefined;
    const description = typeof descriptionValue === 'string' ? descriptionValue : undefined;
    const author = typeof authorValue === 'string' ? authorValue : undefined;
    const tags = Array.isArray(tagsValue)
      ? tagsValue.filter((tag: unknown): tag is string => typeof tag === 'string')
      : undefined;

    if (title) {
      highlighted.title_highlighted = highlightSearchTerms(title, query, { wholeWordsOnly: true });
    }

    if (description) {
      highlighted.description_highlighted = highlightSearchTerms(description, query, {
        wholeWordsOnly: true,
      });
    }

    if (author) {
      highlighted.author_highlighted = highlightSearchTerms(author, query, {
        wholeWordsOnly: false,
      });
    }

    if (tags && tags.length > 0) {
      highlighted.tags_highlighted = highlightSearchTermsArray(tags, query, {
        wholeWordsOnly: false,
      });
    }

    return highlighted;
  });
}

async function trackSearchAnalytics(
  query: string,
  filters: FiltersPayload,
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
    const normalized = normalizeError(error, 'Failed to enqueue search analytics');
    reqLogger.warn('Failed to enqueue search analytics', { err: normalized });
  }
}

/**
 * Choose the effective search type based on requested entities and whether job-specific filters are present.
 *
 * @param entities - An optional array of entity names to restrict the search (e.g., `['job']`). `undefined` or an empty array means no entity restriction.
 * @param hasJobFilters - `true` when job-specific filters (category, employment, experience, remote) are present.
 * @returns The selected SearchType: `'jobs'` when the search targets job results, `'unified'` when one or more non-job entities are specified, or `'content'` when there is no entity restriction.
 * @see executeSearch
 */
function determineSearchType(entities: string[] | undefined, hasJobFilters: boolean): SearchType {
  if (entities?.length === 1 && entities[0] === 'job') {
    return 'jobs';
  }
  if (hasJobFilters) {
    return 'jobs';
  }
  if (entities && entities.length > 0) {
    return 'unified';
  }
  return 'content';
}