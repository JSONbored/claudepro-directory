import * as dataLayer from '@heyclaude/data-layer';
import { Constants, type Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  badRequestResponse,
  buildCacheHeaders,
  enqueueSearchAnalytics,
  errorResponse,
  getWithAuthCorsHeaders,
  initRequestLogging,
  supabaseAnon,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import {
  buildSecurityHeaders,
  createSearchContext,
  highlightSearchTerms,
  highlightSearchTermsArray,
  logError,
  logInfo,
  logWarn,
  logger,
  validateLimit,
  validateQueryString,
} from '@heyclaude/shared-runtime';

// Types for autocomplete/facets (still local for now)
type AutocompleteResult =
  DatabaseGenerated['public']['Functions']['get_search_suggestions_from_history']['Returns'][number];
type FacetResult = DatabaseGenerated['public']['Functions']['get_search_facets']['Returns'][number];

// Re-defined types from RPC returns
type ContentSearchResult =
  DatabaseGenerated['public']['Functions']['search_content_optimized']['Returns'][number];
type UnifiedSearchResult =
  DatabaseGenerated['public']['Functions']['search_unified']['Returns'][number];
type JobSearchResult = NonNullable<
  DatabaseGenerated['public']['Functions']['filter_jobs']['Returns']['jobs']
>[number];

interface HighlightedSearchResult {
  // Original fields
  [key: string]: unknown;
  // Highlighted fields (HTML strings)
  title_highlighted?: string;
  description_highlighted?: string;
  author_highlighted?: string;
  tags_highlighted?: string[];
}

type SortType = 'relevance' | 'popularity' | 'newest' | 'alphabetical';

interface SearchResponse {
  results: HighlightedSearchResult[];
  query: string;
  filters: {
    categories?: string[];
    tags?: string[];
    authors?: string[];
    sort: SortType;
    entities?: string[];
    // Job filters
    job_category?: string;
    job_employment?: string;
    job_experience?: string;
    job_remote?: boolean;
  };
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  searchType: 'content' | 'unified' | 'jobs';
}

/**
 * Handle incoming search requests and return a structured search response.
 *
 * Validates and normalizes query parameters, selects the appropriate search type
 * (content, unified, or jobs), executes the corresponding data-layer RPCs,
 * applies optional HTML highlighting when a query is present, enqueues search
 * analytics (fire-and-forget), and returns a JSON payload with results,
 * filters, pagination metadata, and the resolved search type. Returns HTTP 400
 * for client-side validation errors and an error response for server-side failures.
 *
 * @param req - Incoming HTTP request containing query parameters and an optional Authorization header
 * @returns A Response whose JSON body contains `results`, `query`, `filters`, `pagination`, and `searchType`
 */
export async function handleSearch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  // Validate query string
  const queryStringValidation = validateQueryString(url);
  if (!queryStringValidation.valid) {
    return badRequestResponse(
      queryStringValidation.error ?? 'Invalid query string',
      getWithAuthCorsHeaders
    );
  }

  // Parse and validate query parameters
  const query = url.searchParams.get('q')?.trim() || '';
  const categoriesParam = url.searchParams.get('categories');
  const categories = categoriesParam?.split(',').filter(Boolean);
  const tags = url.searchParams.get('tags')?.split(',').filter(Boolean);
  const authors = url.searchParams.get('authors')?.split(',').filter(Boolean);
  const entities = url.searchParams.get('entities')?.split(',').filter(Boolean);
  // Validate sort parameter (applies to all search types)
  const sortParam = url.searchParams.get('sort') || 'relevance';
  const validSorts = ['relevance', 'popularity', 'newest', 'alphabetical'] as const;
  type SortType = typeof validSorts[number];
  if (!validSorts.includes(sortParam as SortType)) {
    return badRequestResponse(
      `Invalid sort parameter. Must be one of: ${validSorts.join(', ')}`,
      getWithAuthCorsHeaders
    );
  }
  const sort = sortParam as SortType;

  // Parse job filter parameters
  const jobCategoryParam = url.searchParams.get('job_category') || undefined;
  const jobEmploymentParam = url.searchParams.get('job_employment') || undefined;
  const jobExperienceParam = url.searchParams.get('job_experience') || undefined;
  const jobRemote = url.searchParams.get('job_remote');
  const isJobRemote = jobRemote === 'true' ? true : jobRemote === 'false' ? false : undefined;

  // Validate enum values
  const isValidEnum = <T extends string>(
    value: string | undefined,
    validValues: readonly T[]
  ): value is T => {
    if (!value) return false;
    for (const validValue of validValues) {
      if (value === validValue) {
        return true;
      }
    }
    return false;
  };

  const jobCategoryValues = Constants.public.Enums.job_category;
  const jobTypeValues = Constants.public.Enums.job_type;
  const experienceLevelValues = Constants.public.Enums.experience_level;

  // Validate job enum parameters - return 400 if invalid values are provided
  const hasJobCategoryParam = jobCategoryParam !== undefined;
  const hasJobEmploymentParam = jobEmploymentParam !== undefined;
  const hasJobExperienceParam = jobExperienceParam !== undefined;

  if (hasJobCategoryParam && !isValidEnum(jobCategoryParam, jobCategoryValues)) {
    return badRequestResponse(
      `Invalid job_category. Valid values: ${jobCategoryValues.join(', ')}`,
      getWithAuthCorsHeaders
    );
  }
  if (hasJobEmploymentParam && !isValidEnum(jobEmploymentParam, jobTypeValues)) {
    return badRequestResponse(
      `Invalid job_employment. Valid values: ${jobTypeValues.join(', ')}`,
      getWithAuthCorsHeaders
    );
  }
  if (hasJobExperienceParam && !isValidEnum(jobExperienceParam, experienceLevelValues)) {
    return badRequestResponse(
      `Invalid job_experience. Valid values: ${experienceLevelValues.join(', ')}`,
      getWithAuthCorsHeaders
    );
  }

  const jobCategory = isValidEnum(jobCategoryParam, jobCategoryValues)
    ? jobCategoryParam
    : undefined;
  const jobEmployment = isValidEnum(jobEmploymentParam, jobTypeValues)
    ? jobEmploymentParam
    : undefined;
  const jobExperience = isValidEnum(jobExperienceParam, experienceLevelValues)
    ? jobExperienceParam
    : undefined;

  // Validate limit parameter
  const limitValidation = validateLimit(url.searchParams.get('limit'), 1, 100, 20);
  if (!limitValidation.valid || limitValidation.limit === undefined) {
    return badRequestResponse(
      limitValidation.error ?? 'Invalid limit parameter',
      getWithAuthCorsHeaders
    );
  }
  const limit = limitValidation.limit;

  // Validate offset parameter
  const offsetParam = url.searchParams.get('offset');
  const offset = offsetParam ? Math.max(Number.parseInt(offsetParam, 10), 0) : 0;
  if (Number.isNaN(offset)) {
    return badRequestResponse('Invalid offset parameter', getWithAuthCorsHeaders);
  }

  // Detect if job filters are present (triggers filter_jobs RPC)
  const hasJobFilters =
    jobCategory !== undefined ||
    jobEmployment !== undefined ||
    jobExperience !== undefined ||
    isJobRemote !== undefined;

  // Determine search type based on entities parameter and job filters
  // If entities is strictly ['job'], use 'jobs' search type
  // Otherwise, use job filters presence or fall back to unified/content
  const searchType: 'content' | 'unified' | 'jobs' =
    entities?.length === 1 && entities[0] === 'job'
      ? 'jobs'
      : hasJobFilters
        ? 'jobs'
        : entities
          ? 'unified'
          : 'content';

  // Create logContext with public-api app label (renamed to avoid conflict with outer scope)
  const searchLogContext = createSearchContext({
    query,
    searchType,
    app: 'public-api',
    filters: {
      categories,
      tags,
      authors,
      entities,
      sort,
      ...(hasJobFilters && {
        job_category: jobCategory,
        job_employment: jobEmployment,
        job_experience: jobExperience,
        job_remote: isJobRemote,
      }),
    },
  });
  
  // Initialize request logging with trace and bindings (Phase 1 & 2)
  initRequestLogging(searchLogContext);
  traceStep('Processing search request', searchLogContext);
  
  // Set bindings for this request - mixin will automatically inject these into all subsequent logs
  logger.setBindings({
    requestId: searchLogContext.request_id,
    operation: searchLogContext.action || 'search',
    function: searchLogContext.function,
    query: query || undefined,
  });

  // Validate entities if provided
  const validEntities = ['content', 'company', 'job', 'user'];
  if (entities?.some((e) => !validEntities.includes(e))) {
    return badRequestResponse(
      `Invalid entities parameter. Must be one of: ${validEntities.join(', ')}`,
      getWithAuthCorsHeaders
    );
  }

  const searchService = new dataLayer.SearchService(supabaseAnon);

  let data: ContentSearchResult[] | UnifiedSearchResult[] | JobSearchResult[];
  let totalCount: number | undefined;
  let error: unknown;

  try {
    if (searchType === 'jobs') {
      const result = await searchService.filterJobs({
        ...(query ? { p_search_query: query } : {}),
        ...(jobCategory ? { p_category: jobCategory } : {}),
        ...(jobEmployment ? { p_employment_type: jobEmployment } : {}),
        ...(jobExperience ? { p_experience_level: jobExperience } : {}),
        ...(isJobRemote !== undefined ? { p_remote_only: isJobRemote } : {}),
        p_limit: limit,
        p_offset: offset,
      });
      data = result.jobs ?? [];
      totalCount = result.total_count ?? 0;
    } else if (searchType === 'unified') {
      const result = await searchService.searchUnified({
        p_query: query,
        p_entities: entities || ['content', 'company', 'job', 'user'],
        ...(categories ? { p_categories: categories } : {}),
        ...(tags ? { p_tags: tags } : {}),
        ...(authors ? { p_authors: authors } : {}),
        p_limit: limit,
        p_offset: offset,
      });
      data = result.data ?? [];
      totalCount = result.total_count ?? result.data?.length ?? 0;
    } else {
      // Content search
      // NOTE: SearchService.searchContent uses the optimized RPC which handles keywords.
      // Semantic search logic is handled within the RPC if implemented, or we rely on keywords.
      const contentCategoryValues = Constants.public.Enums.content_category;
      const validatedCategories = categories
        ? categories.filter((cat) => contentCategoryValues.includes(cat as typeof contentCategoryValues[number]))
        : undefined;

      // If categories were provided but none were valid, return 400
      if (categories && categories.length > 0 && (!validatedCategories || validatedCategories.length === 0)) {
        return badRequestResponse(
          `Invalid categories. Valid values: ${contentCategoryValues.join(', ')}`,
          getWithAuthCorsHeaders
        );
      }

      const searchArgs: Parameters<typeof searchService.searchContent>[0] = {
        p_query: query,
        p_limit: limit,
        p_offset: offset,
      };
      if (validatedCategories && validatedCategories.length > 0) {
        searchArgs.p_categories =
          validatedCategories as DatabaseGenerated['public']['Enums']['content_category'][];
      }
      if (tags) searchArgs.p_tags = tags;
      if (authors) searchArgs.p_authors = authors;
      if (sort) searchArgs.p_sort = sort;
      const result = await searchService.searchContent(searchArgs);
      data = result.data ?? [];
      totalCount = result.total_count ?? result.data?.length ?? 0;
    }
  } catch (err) {
    error = err;
    data = [];
  }


  if (error) {
    await logError('Search RPC error', { ...searchLogContext, searchType }, error);
    return await errorResponse(error, 'search-service', getWithAuthCorsHeaders);
  }

  const results = data;

  // Apply search term highlighting if query provided
  // NOTE: highlightSearchTerms and highlightSearchTermsArray use escapeHtml internally
  // to prevent XSS. All user-controlled input and DB content is properly escaped before
  // being wrapped in <mark> tags, making the returned HTML safe for direct DOM injection.
  const highlightedResults: HighlightedSearchResult[] = query.trim()
    ? results.map((result) => {
        const highlighted: HighlightedSearchResult = { ...result };

        let title: string | null = null;
        if ('title' in result) {
          const t = (result as { title: unknown }).title;
          if (typeof t === 'string') title = t;
        }

        let description: string | null = null;
        if ('description' in result) {
          const d = (result as { description: unknown }).description;
          if (typeof d === 'string') description = d;
        }

        if (title && typeof title === 'string') {
          highlighted.title_highlighted = highlightSearchTerms(title, query, {
            wholeWordsOnly: true,
          });
        }

        if (description && typeof description === 'string') {
          highlighted.description_highlighted = highlightSearchTerms(description, query, {
            wholeWordsOnly: true,
          });
        }

        if ('author' in result && result.author && typeof result.author === 'string') {
          highlighted.author_highlighted = highlightSearchTerms(result.author, query, {
            wholeWordsOnly: false,
          });
        }

        if ('tags' in result && result.tags) {
          const tags = result.tags;
          if (Array.isArray(tags) && tags.length > 0) {
            const stringTags: string[] = tags.filter(
              (tag): tag is string => typeof tag === 'string'
            );
            if (stringTags.length > 0) {
              highlighted.tags_highlighted = highlightSearchTermsArray(stringTags, query, {
                wholeWordsOnly: false,
              });
            }
          }
        }

        return highlighted;
      })
    : results.map((result) => ({ ...result }));

  // Track analytics (fire and forget)
  // trackSearchAnalytics already handles errors internally
  trackSearchAnalytics(
    query,
    {
      sort,
      ...(categories !== undefined ? { categories } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(authors !== undefined ? { authors } : {}),
      ...(entities !== undefined ? { entities } : {}),
      ...(jobCategory !== undefined ? { job_category: jobCategory } : {}),
      ...(jobEmployment !== undefined ? { job_employment: jobEmployment } : {}),
      ...(jobExperience !== undefined ? { job_experience: jobExperience } : {}),
      ...(isJobRemote !== undefined ? { job_remote: isJobRemote } : {}),
      ...(hasJobFilters ? { entity: 'job' } : {}),
    },
    results.length,
    req.headers.get('Authorization')
  ).catch(() => {
    // Fire-and-forget: errors are handled internally by trackSearchAnalytics
  });

  logInfo('Search completed', {
    ...searchLogContext,
    resultCount: results.length,
    searchType,
    highlighted: query.trim().length > 0,
  });

  const response: SearchResponse = {
    results: highlightedResults,
    query,
    filters: {
      sort,
      ...(categories !== undefined ? { categories } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(authors !== undefined ? { authors } : {}),
      ...(entities !== undefined ? { entities } : {}),
      ...(jobCategory !== undefined ? { job_category: jobCategory } : {}),
      ...(jobEmployment !== undefined ? { job_employment: jobEmployment } : {}),
      ...(jobExperience !== undefined ? { job_experience: jobExperience } : {}),
      ...(isJobRemote !== undefined ? { job_remote: isJobRemote } : {}),
    },
    pagination: {
      total: totalCount !== undefined ? totalCount : results.length,
      limit,
      offset,
      hasMore:
        totalCount !== undefined ? offset + results.length < totalCount : results.length === limit,
    },
    searchType,
  };

  traceRequestComplete(searchLogContext);
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...buildSecurityHeaders(),
      ...buildCacheHeaders('search'),
      ...getWithAuthCorsHeaders,
    },
  });
}

/**
 * Return search suggestions for a short query string.
 *
 * @returns A Response whose JSON body contains `suggestions` — an array of suggestion objects `{ text, searchCount, isPopular }` — and the original `query`.
 */
export async function handleAutocomplete(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  // Create log context for this autocomplete request
  const query = url.searchParams.get('q')?.trim() || '';
  const logContext = createSearchContext({ query, searchType: 'autocomplete', app: 'public-api' });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Autocomplete request received', logContext);
  
  // Set bindings for this request - mixin will automatically inject these into all subsequent logs
  logger.setBindings({
    requestId: logContext.request_id,
    operation: logContext.action || 'autocomplete',
    function: logContext.function,
    query,
  });
  
  const queryStringValidation = validateQueryString(url);
  if (!queryStringValidation.valid) {
    return badRequestResponse(
      queryStringValidation.error ?? 'Invalid query string',
      getWithAuthCorsHeaders
    );
  }

  const limitValidation = validateLimit(url.searchParams.get('limit'), 1, 20, 10);
  if (!limitValidation.valid || limitValidation.limit === undefined) {
    return badRequestResponse(
      limitValidation.error ?? 'Invalid limit parameter',
      getWithAuthCorsHeaders
    );
  }
  const limit = limitValidation.limit;

  if (query.length < 2) {
    return badRequestResponse('Query must be at least 2 characters', getWithAuthCorsHeaders);
  }

  const rpcArgs = {
    p_query: query,
    p_limit: limit,
  } satisfies DatabaseGenerated['public']['Functions']['get_search_suggestions_from_history']['Args'];
  const { data, error } = await supabaseAnon.rpc('get_search_suggestions_from_history', rpcArgs);

  if (error) {
    // Use dbQuery serializer for consistent database query formatting
    await logError('Autocomplete RPC error', {
      ...logContext,
      dbQuery: {
        rpcName: 'get_search_suggestions_from_history',
        args: rpcArgs, // Will be redacted by Pino's redact config
      },
    }, error);
    return await errorResponse(error, 'get_search_suggestions_from_history', getWithAuthCorsHeaders);
  }

  const suggestions = (data ?? []).map((item: AutocompleteResult) => ({
    text: item.suggestion,
    searchCount: Number(item.search_count),
    isPopular: Number(item.search_count) >= 2,
  }));

  const response = {
    suggestions,
    query,
  };

  traceRequestComplete(logContext);
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...buildSecurityHeaders(),
      ...buildCacheHeaders('search_autocomplete'),
      ...getWithAuthCorsHeaders,
    },
  });
}

/**
 * Retrieve search facets (categories, tag lists, and author lists) for the public API.
 *
 * Calls the backend RPC to fetch facet data and returns a JSON response containing normalized facets.
 *
 * @returns A Response whose JSON body has the shape `{ facets: Array<{ category: string; contentCount: number; tags: string[]; authors: string[] }> }`.
 */
export async function handleFacets(): Promise<Response> {
  const logContext = createSearchContext({ searchType: 'facets', app: 'public-api' });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Facets request received', logContext);
  
  // Set bindings for this request - mixin will automatically inject these into all subsequent logs
  logger.setBindings({
    requestId: logContext.request_id,
    operation: logContext.action || 'facets',
    function: logContext.function,
  });
  
  const { data, error } = await supabaseAnon.rpc('get_search_facets', undefined);

  if (error) {
    // Use dbQuery serializer for consistent database query formatting
    await logError('Facets RPC error', {
      ...logContext,
      dbQuery: {
        rpcName: 'get_search_facets',
      },
    }, error);
    return await errorResponse(error, 'get_search_facets', getWithAuthCorsHeaders);
  }

  const facets = (data ?? []).map((item: FacetResult) => ({
    category: item.category,
    contentCount: item.content_count,
    tags: item.all_tags || [],
    authors: item.authors || [],
  }));

  const response = {
    facets,
  };

  traceRequestComplete(logContext);
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...buildSecurityHeaders(),
      ...buildCacheHeaders('search_facets'),
      ...getWithAuthCorsHeaders,
    },
  });
}

/**
 * Enqueues search analytics data for later processing.
 *
 * If `query` is empty, this function exits without enqueuing anything.
 *
 * @param query - The search query text to record
 * @param filters - Optional contextual filters applied to the search; may include:
 *   - `categories`, `tags`, `authors`: arrays of selected values
 *   - `sort`: requested sort option
 *   - `entities`: requested entity types (e.g., `content`, `job`)
 *   - `job_category`, `job_employment`, `job_experience`, `job_remote`: job-specific filters
 *   - `entity`: single entity override
 * @param resultCount - Number of results returned to the caller for this query
 * @param authorizationHeader - Optional `Authorization` header value to attribute the request
 */
async function trackSearchAnalytics(
  query: string,
  filters: {
    categories?: string[];
    tags?: string[];
    authors?: string[];
    sort: string;
    entities?: string[];
    job_category?: string;
    job_employment?: string;
    job_experience?: string;
    job_remote?: boolean;
    entity?: string;
  },
  resultCount: number,
  authorizationHeader: string | null
): Promise<void> {
  if (!query) return;

  const analyticsFilters =
    filters satisfies DatabaseGenerated['public']['Tables']['search_queries']['Insert']['filters'];
  enqueueSearchAnalytics({
    query,
    filters: analyticsFilters,
    resultCount,
    authorizationHeader,
  }).catch((error) => {
    const analyticsErrorContext = createSearchContext({
      query: query.substring(0, 50),
      app: 'public-api',
    });
    // Add error type to context for debugging (BaseLogContext allows additional fields)
    const enhancedContext = {
      ...analyticsErrorContext,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    };
    logWarn('Failed to enqueue search analytics', enhancedContext);
  });
}