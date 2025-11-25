import * as dataLayer from '@heyclaude/data-layer';
import { Constants, type Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  badRequestResponse,
  buildCacheHeaders,
  enqueueSearchAnalytics,
  errorResponse,
  getWithAuthCorsHeaders,
  supabaseAnon,
} from '@heyclaude/edge-runtime';
import {
  buildSecurityHeaders,
  createSearchContext,
  highlightSearchTerms,
  highlightSearchTermsArray,
  logError,
  logInfo,
  logWarn,
  validateLimit,
  validateQueryString,
  withDuration,
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

interface SearchResponse {
  results: HighlightedSearchResult[];
  query: string;
  filters: {
    categories?: string[];
    tags?: string[];
    authors?: string[];
    sort: string;
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
  performance: {
    dbTime: number;
    totalTime: number;
  };
  searchType: 'content' | 'unified' | 'jobs';
}

/**
 * Main search endpoint with analytics tracking and caching
 */
export async function handleSearch(req: Request, startTime: number): Promise<Response> {
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
  const categories = url.searchParams.get('categories')?.split(',').filter(Boolean);
  const tags = url.searchParams.get('tags')?.split(',').filter(Boolean);
  const authors = url.searchParams.get('authors')?.split(',').filter(Boolean);
  const entities = url.searchParams.get('entities')?.split(',').filter(Boolean);
  const sort = (url.searchParams.get('sort') || 'relevance') as
    | 'relevance'
    | 'popularity'
    | 'newest'
    | 'alphabetical';

  // Validate sort parameter (applies to all search types)
  const validSorts = ['relevance', 'popularity', 'newest', 'alphabetical'];
  if (!validSorts.includes(sort)) {
    return badRequestResponse(
      `Invalid sort parameter. Must be one of: ${validSorts.join(', ')}`,
      getWithAuthCorsHeaders
    );
  }

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
  const searchType: 'content' | 'unified' | 'jobs' = hasJobFilters
    ? 'jobs'
    : entities
      ? 'unified'
      : 'content';

  // Create logContext with public-api app label
  const logContext = createSearchContext({
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

  // Validate entities if provided
  const validEntities = ['content', 'company', 'job', 'user'];
  if (entities?.some((e) => !validEntities.includes(e))) {
    return badRequestResponse(
      `Invalid entities parameter. Must be one of: ${validEntities.join(', ')}`,
      getWithAuthCorsHeaders
    );
  }

  const dbStartTime = performance.now();
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
      const searchArgs: Parameters<typeof searchService.searchContent>[0] = {
        p_query: query,
        p_limit: limit,
        p_offset: offset,
      };
      if (categories) {
        searchArgs.p_categories =
          categories as DatabaseGenerated['public']['Enums']['content_category'][];
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

  const dbEndTime = performance.now();

  if (error) {
    logError('Search RPC error', { ...logContext, searchType }, error);
    return errorResponse(error, 'search-service', getWithAuthCorsHeaders);
  }

  const results = data;

  // Apply search term highlighting if query provided
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
  ).catch((error) => {
    // Analytics failures shouldn't break search - log but don't throw
    const logContext = createSearchContext({
      query: query.substring(0, 50),
      app: 'public-api',
    });
    // Add error type to context for debugging (BaseLogContext allows additional fields)
    const enhancedContext = {
      ...logContext,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    };
    logWarn('Failed to track search analytics', enhancedContext);
  });

  const totalTime = performance.now() - startTime;

  logInfo('Search completed', {
    ...withDuration(logContext, startTime),
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
    performance: {
      dbTime: Math.round(dbEndTime - dbStartTime),
      totalTime: Math.round(totalTime),
    },
    searchType,
  };

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
 * Autocomplete endpoint
 */
export async function handleAutocomplete(req: Request, startTime: number): Promise<Response> {
  const url = new URL(req.url);
  const queryStringValidation = validateQueryString(url);
  if (!queryStringValidation.valid) {
    return badRequestResponse(
      queryStringValidation.error ?? 'Invalid query string',
      getWithAuthCorsHeaders
    );
  }

  const query = url.searchParams.get('q')?.trim() || '';
  const limitValidation = validateLimit(url.searchParams.get('limit'), 1, 20, 10);
  if (!limitValidation.valid || limitValidation.limit === undefined) {
    return badRequestResponse(
      limitValidation.error ?? 'Invalid limit parameter',
      getWithAuthCorsHeaders
    );
  }
  const limit = limitValidation.limit;

  const logContext = createSearchContext({ query, searchType: 'autocomplete', app: 'public-api' });

  if (query.length < 2) {
    return badRequestResponse('Query must be at least 2 characters', getWithAuthCorsHeaders);
  }

  const rpcArgs = {
    p_query: query,
    p_limit: limit,
  } satisfies DatabaseGenerated['public']['Functions']['get_search_suggestions_from_history']['Args'];
  const { data, error } = await supabaseAnon.rpc('get_search_suggestions_from_history', rpcArgs);

  if (error) {
    logError('Autocomplete RPC error', logContext, error);
    return errorResponse(error, 'get_search_suggestions_from_history', getWithAuthCorsHeaders);
  }

  const suggestions = (data ?? []).map((item: AutocompleteResult) => ({
    text: item.suggestion,
    searchCount: Number(item.search_count),
    isPopular: Number(item.search_count) >= 2,
  }));

  const totalTime = performance.now() - startTime;

  const response = {
    suggestions,
    query,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...buildSecurityHeaders(),
      ...buildCacheHeaders('search_autocomplete'),
      'X-Response-Time': `${Math.round(totalTime)}ms`,
      ...getWithAuthCorsHeaders,
    },
  });
}

/**
 * Facets endpoint
 */
export async function handleFacets(startTime: number): Promise<Response> {
  const logContext = createSearchContext({ searchType: 'facets', app: 'public-api' });
  const { data, error } = await supabaseAnon.rpc('get_search_facets', undefined);

  if (error) {
    logError('Facets RPC error', logContext, error);
    return errorResponse(error, 'get_search_facets', getWithAuthCorsHeaders);
  }

  const facets = (data ?? []).map((item: FacetResult) => ({
    category: item.category,
    contentCount: item.content_count,
    tags: item.all_tags || [],
    authors: item.authors || [],
  }));

  const totalTime = performance.now() - startTime;

  const response = {
    facets,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...buildSecurityHeaders(),
      ...buildCacheHeaders('search_facets'),
      'X-Response-Time': `${Math.round(totalTime)}ms`,
      ...getWithAuthCorsHeaders,
    },
  });
}

/**
 * Track search analytics - Queue-Based
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
    const logContext = createSearchContext({
      query: query.substring(0, 50),
      app: 'public-api',
    });
    // Add error type to context for debugging (BaseLogContext allows additional fields)
    const enhancedContext = {
      ...logContext,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    };
    logWarn('Failed to enqueue search analytics', enhancedContext);
  });
}
