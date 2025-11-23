/// <reference path="@heyclaude/edge-runtime/deno-globals.d.ts" />

import type {
  ContentSearchResult,
  JobSearchResult,
  UnifiedSearchResult,
} from '@heyclaude/data-layer';
import { SearchService } from '@heyclaude/data-layer';
import { Constants, type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { supabaseAnon } from '@heyclaude/edge-runtime/clients/supabase.ts';
import { enqueueSearchAnalytics } from '@heyclaude/edge-runtime/utils/analytics/pulse.ts';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getWithAuthCorsHeaders,
} from '@heyclaude/edge-runtime/utils/http.ts';
import {
  applyRateLimitHeaders,
  createRateLimitErrorResponse,
} from '@heyclaude/edge-runtime/utils/rate-limit-middleware.ts';
import {
  createRouter,
  type HttpMethod,
  type RouterContext,
} from '@heyclaude/edge-runtime/utils/router.ts';
import {
  buildSecurityHeaders,
  checkRateLimit,
  createSearchContext,
  errorToString,
  highlightSearchTerms,
  highlightSearchTermsArray,
  RATE_LIMIT_PRESETS,
  validateLimit,
  validateQueryString,
  withDuration,
} from '@heyclaude/shared-runtime';

// Types for autocomplete/facets (still local for now)
type AutocompleteResult =
  DatabaseGenerated['public']['Functions']['get_search_suggestions_from_history']['Returns'][number];
type FacetResult = DatabaseGenerated['public']['Functions']['get_search_facets']['Returns'][number];

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
  searchType: 'content' | 'unified';
}

interface UnifiedSearchContext extends RouterContext {
  pathname: string;
  startTime: number;
}

const router = createRouter<UnifiedSearchContext>({
  buildContext: (request) => {
    const url = new URL(request.url);
    const originalMethod = request.method.toUpperCase() as HttpMethod;
    const normalizedMethod = (originalMethod === 'HEAD' ? 'GET' : originalMethod) as HttpMethod;

    return {
      request,
      url,
      method: normalizedMethod,
      originalMethod,
      pathname: url.pathname,
      startTime: performance.now(),
    };
  },
  defaultCors: getWithAuthCorsHeaders,
  onNoMatch: (ctx) => {
    const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.search);
    if (!rateLimit.allowed) {
      return createRateLimitErrorResponse(rateLimit, {
        preset: 'search',
        cors: getWithAuthCorsHeaders,
        errorResponseType: 'badRequest',
      });
    }
    return handleSearch(ctx.url, ctx.startTime, ctx.request).then((response) => {
      applyRateLimitHeaders(response, rateLimit, 'search');
      return response;
    });
  },
  routes: [
    {
      name: 'autocomplete',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      match: (ctx) => ctx.pathname.endsWith('/autocomplete'),
      handler: async (ctx) => {
        const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.search);
        if (!rateLimit.allowed) {
          return createRateLimitErrorResponse(rateLimit, {
            preset: 'search',
            cors: getWithAuthCorsHeaders,
            errorResponseType: 'badRequest',
          });
        }
        const response = await handleAutocomplete(ctx.url, ctx.startTime);
        applyRateLimitHeaders(response, rateLimit, 'search');
        return response;
      },
    },
    {
      name: 'facets',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      match: (ctx) => ctx.pathname.endsWith('/facets'),
      handler: async (ctx) => {
        const rateLimit = checkRateLimit(ctx.request, RATE_LIMIT_PRESETS.search);
        if (!rateLimit.allowed) {
          return createRateLimitErrorResponse(rateLimit, {
            preset: 'search',
            cors: getWithAuthCorsHeaders,
            errorResponseType: 'badRequest',
          });
        }
        const response = await handleFacets(ctx.startTime);
        applyRateLimitHeaders(response, rateLimit, 'search');
        return response;
      },
    },
  ],
});

Deno.serve(async (request) => {
  try {
    return await router(request);
  } catch (error) {
    const logContext = createSearchContext();
    console.error('[unified-search] Unified search error', {
      ...logContext,
      error: errorToString(error),
    });
    return errorResponse(error, 'unified-search', getWithAuthCorsHeaders);
  }
});

/**
 * Main search endpoint with analytics tracking and caching
 */
async function handleSearch(url: URL, startTime: number, req: Request): Promise<Response> {
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

  // Create logContext
  const logContext = createSearchContext({
    query,
    searchType,
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

  // Validate sort parameter
  if (searchType === 'content') {
    const validSorts = ['relevance', 'popularity', 'newest', 'alphabetical'];
    if (!validSorts.includes(sort)) {
      return badRequestResponse(
        `Invalid sort parameter. Must be one of: ${validSorts.join(', ')}`,
        getWithAuthCorsHeaders
      );
    }
  }

  const dbStartTime = performance.now();
  const searchService = new SearchService(supabaseAnon);

  let data: ContentSearchResult[] | UnifiedSearchResult[] | JobSearchResult[];
  let totalCount: number | undefined;
  let error: unknown;

  try {
    if (searchType === 'jobs') {
      const jobFilters = {
        query,
        ...(jobCategory ? { categories: [jobCategory] } : {}),
        ...(jobEmployment ? { employmentTypes: [jobEmployment] } : {}),
        ...(jobExperience ? { experienceLevels: [jobExperience] } : {}),
        ...(isJobRemote !== undefined ? { remoteOnly: isJobRemote } : {}),
        limit,
        offset,
      };
      const result = await searchService.filterJobs(jobFilters);
      data = result.jobs ?? [];
      totalCount = result.total_count ?? 0;
    } else if (searchType === 'unified') {
      data = await searchService.searchUnified(
        query,
        entities || ['content', 'company', 'job', 'user'],
        {
          categories,
          tags,
          authors,
          limit,
          offset,
        }
      );
    } else {
      // Content search
      // NOTE: Embedding generation logic is currently local to edge function or needs to be passed in.
      // For now, assuming SearchService.searchContent uses the optimized RPC which handles keywords.
      // If semantic search logic was strictly client-side before RPC, it needs to be in SearchService or passed.
      // The previous code had semantic search logic *before* the RPC.
      // Ideally, `searchContent` in data-layer should handle embeddings if possible, OR accept an embedding.
      // Given Supabase AI Session is Deno-specific, we stick to `search_content_optimized` (keyword) via Service for now
      // to maintain isomorphism, or we'd need to inject the embedding generator.
      // For this refactor, we'll use the service which wraps `search_content_optimized`.

      data = await searchService.searchContent(query, {
        categories,
        tags,
        authors,
        sort,
        limit,
        offset,
      });
    }
  } catch (err) {
    error = err;
    data = [];
  }

  const dbEndTime = performance.now();

  if (error) {
    console.error('[unified-search] Search RPC error', {
      ...logContext,
      searchType,
      error: errorToString(error),
    });
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
    console.warn('[unified-search] Analytics tracking failed', {
      ...logContext,
      error: errorToString(error),
    });
  });

  const totalTime = performance.now() - startTime;

  console.log('[unified-search] Search completed', {
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
    searchType: searchType === 'jobs' ? 'unified' : searchType,
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
async function handleAutocomplete(url: URL, startTime: number): Promise<Response> {
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

  const logContext = createSearchContext({ query, searchType: 'autocomplete' });

  if (query.length < 2) {
    return badRequestResponse('Query must be at least 2 characters', getWithAuthCorsHeaders);
  }

  const rpcArgs = {
    p_query: query,
    p_limit: limit,
  } satisfies DatabaseGenerated['public']['Functions']['get_search_suggestions_from_history']['Args'];
  const { data, error } = await supabaseAnon.rpc('get_search_suggestions_from_history', rpcArgs);

  if (error) {
    console.error('[unified-search] Autocomplete RPC error', {
      ...logContext,
      error: errorToString(error),
    });
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
async function handleFacets(startTime: number): Promise<Response> {
  const logContext = createSearchContext({ searchType: 'facets' });
  const { data, error } = await supabaseAnon.rpc('get_search_facets', undefined);

  if (error) {
    console.error('[unified-search] Facets RPC error', {
      ...logContext,
      error: errorToString(error),
    });
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
    console.warn('[unified-search] Failed to enqueue search analytics', {
      error: errorToString(error),
      query: query.substring(0, 50),
    });
  });
}
