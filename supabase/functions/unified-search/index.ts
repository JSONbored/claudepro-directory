/// <reference path="../_shared/deno-globals.d.ts" />

/**
 * Unified Search Edge Function
 * Consolidates all client-side search functionality with caching and analytics
 *
 * Endpoints:
 * - GET /unified-search - Main search with filters, caching (5min), analytics tracking
 *   Query params:
 *     - q: Search query
 *     - entities: Comma-separated list (content,company,job,user) - triggers federated search
 *     - categories/tags/authors: Content-only filters
 *     - sort: Content-only sorting (relevance, popularity, newest, alphabetical)
 *     - job_category/job_employment/job_experience/job_remote: Job filters (triggers filter_jobs RPC)
 *     - limit/offset: Pagination
 * - GET /unified-search/autocomplete - Smart autocomplete from search history + content titles
 * - GET /unified-search/facets - Available filters (categories, tags, authors)
 *
 * Search Routing:
 * - With job filters (job_category, job_employment, job_experience, job_remote) → filter_jobs() RPC (with highlighting)
 * - With entities param → search_unified() RPC (federated multi-entity search)
 * - Without entities param → search_content_optimized() RPC (content-only with advanced filters)
 */

import { supabaseAnon } from '../_shared/clients/supabase.ts';
import type { Database as DatabaseGenerated, Json } from '../_shared/database.types.ts';
import { enqueueSearchAnalytics } from '../_shared/utils/analytics/pulse.ts';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getWithAuthCorsHeaders,
} from '../_shared/utils/http.ts';
import { validateLimit, validateQueryString } from '../_shared/utils/input-validation.ts';
import { createSearchContext, withDuration } from '../_shared/utils/logging.ts';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '../_shared/utils/rate-limit.ts';
import {
  applyRateLimitHeaders,
  createRateLimitErrorResponse,
} from '../_shared/utils/rate-limit-middleware.ts';
import { createRouter, type HttpMethod, type RouterContext } from '../_shared/utils/router.ts';
import {
  highlightSearchTerms,
  highlightSearchTermsArray,
} from '../_shared/utils/search-highlight.ts';
import { buildSecurityHeaders } from '../_shared/utils/security-headers.ts';

type ContentSearchResult =
  DatabaseGenerated['public']['Functions']['search_content_optimized']['Returns'][number];
type UnifiedSearchResult =
  DatabaseGenerated['public']['Functions']['search_unified']['Returns'][number];
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

interface AutocompleteResponse {
  suggestions: Array<{
    text: string;
    searchCount: number;
    isPopular: boolean;
  }>;
  query: string;
}

interface FacetsResponse {
  facets: Array<{
    category: string;
    contentCount: number;
    tags: string[];
    authors: string[];
  }>;
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
      error: error instanceof Error ? error.message : String(error),
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
  const sort = url.searchParams.get('sort') || 'relevance';

  // Parse job filter parameters
  const jobCategoryParam = url.searchParams.get('job_category') || undefined;
  const jobEmploymentParam = url.searchParams.get('job_employment') || undefined;
  const jobExperienceParam = url.searchParams.get('job_experience') || undefined;
  const jobRemote = url.searchParams.get('job_remote');
  const isJobRemote = jobRemote === 'true' ? true : jobRemote === 'false' ? false : undefined;

  // Validate enum values - only include if they match generated enum types
  // TypeScript will validate at compile time that these values match the enum
  type JobCategory = DatabaseGenerated['public']['Enums']['job_category'];
  type JobType = DatabaseGenerated['public']['Enums']['job_type'];
  type ExperienceLevel = DatabaseGenerated['public']['Enums']['experience_level'];

  // Helper to check if value is valid enum - uses satisfies to ensure type safety
  // No type assertions - uses type narrowing with explicit check
  const isValidEnum = <T extends string>(
    value: string | undefined,
    validValues: readonly T[]
  ): value is T => {
    if (!value) return false;
    // Check each value explicitly to avoid type assertion
    for (const validValue of validValues) {
      if (value === validValue) {
        return true;
      }
    }
    return false;
  };

  // Define valid enum values using satisfies to ensure they match generated types
  const jobCategoryValues = [
    'engineering',
    'design',
    'product',
    'marketing',
    'sales',
    'support',
    'research',
    'data',
    'operations',
    'leadership',
    'consulting',
    'education',
    'other',
  ] as const satisfies readonly JobCategory[];

  const jobTypeValues = [
    'full-time',
    'part-time',
    'contract',
    'freelance',
    'internship',
  ] as const satisfies readonly JobType[];

  const experienceLevelValues = [
    'beginner',
    'intermediate',
    'advanced',
  ] as const satisfies readonly ExperienceLevel[];

  // Validate and narrow types using type guards
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
  // If job filters are present, use filter_jobs RPC (even if entities includes 'job')
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

  // Validate sort parameter (only applies to content search)
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
  let data:
    | ContentSearchResult[]
    | UnifiedSearchResult[]
    | DatabaseGenerated['public']['Tables']['jobs']['Row'][];
  let totalCount: number | undefined;
  let error: unknown;

  // Route to appropriate RPC based on search type
  if (searchType === 'jobs') {
    // Job filters present → use filter_jobs RPC
    // Convert string values to ENUMs (NULL means 'all'/'any')
    const rpcArgs = {
      ...(query ? { p_search_query: query } : {}),
      ...(jobCategory
        ? {
            p_category: jobCategory,
          }
        : {}),
      ...(jobEmployment
        ? {
            p_employment_type: jobEmployment,
          }
        : {}),
      ...(jobExperience
        ? {
            p_experience_level: jobExperience,
          }
        : {}),
      ...(isJobRemote !== undefined ? { p_remote_only: isJobRemote } : {}),
      p_limit: limit,
      p_offset: offset,
    } satisfies DatabaseGenerated['public']['Functions']['filter_jobs']['Args'];
    const { data: filterJobsData, error: filterJobsError } = await supabaseAnon.rpc(
      'filter_jobs',
      rpcArgs
    );

    if (filterJobsError) {
      error = filterJobsError;
      data = [];
    } else if (filterJobsData) {
      // Use generated type from database.types.ts - no manual parsing, use types directly
      const filterJobsResult: DatabaseGenerated['public']['Functions']['filter_jobs']['Returns'] =
        filterJobsData;
      data = filterJobsResult.jobs ?? [];
      totalCount = filterJobsResult.total_count ?? 0;
    } else {
      data = [];
      totalCount = 0;
    }
  } else if (searchType === 'unified') {
    const rpcArgs = {
      p_query: query,
      p_entities: entities || ['content', 'company', 'job', 'user'],
      p_limit: limit,
      p_offset: offset,
    } satisfies DatabaseGenerated['public']['Functions']['search_unified']['Args'];
    const { data: unifiedData, error: unifiedError } = await supabaseAnon.rpc(
      'search_unified',
      rpcArgs
    );
    data = unifiedData ?? [];
    error = unifiedError;
  } else {
    // Content search - use semantic search (full rollout) with keyword fallback

    // Generate embedding for user query (if query provided)
    let queryEmbedding: number[] | null = null;
    if (query.trim()) {
      try {
        const model = new Supabase.ai.Session('gte-small');
        const embeddingResult = await model.run(query, {
          mean_pool: true,
          normalize: true,
        });
        queryEmbedding = Array.isArray(embeddingResult) ? embeddingResult : null;
      } catch (embeddingError) {
        // Log but continue with keyword search fallback
        console.warn('[unified-search] Embedding generation failed, using keyword search', {
          ...logContext,
          error: embeddingError instanceof Error ? embeddingError.message : String(embeddingError),
        });
      }
    }

    if (queryEmbedding && query.trim()) {
      // SEMANTIC SEARCH (Primary Method - Full Rollout)
      try {
        const semanticArgs = {
          query_embedding: JSON.stringify(queryEmbedding),
          match_threshold: 0.7, // Configurable threshold
          match_limit: limit,
          ...(categories !== undefined ? { p_categories: categories } : {}),
          ...(tags !== undefined ? { p_tags: tags } : {}),
          ...(authors !== undefined ? { p_authors: authors } : {}),
          p_offset: offset,
        } satisfies DatabaseGenerated['public']['Functions']['query_content_embeddings']['Args'];

        const { data: semanticData, error: semanticError } = await supabaseAnon.rpc(
          'query_content_embeddings',
          semanticArgs
        );

        if (!semanticError && semanticData && semanticData.length > 0) {
          // query_content_embeddings returns different structure than ContentSearchResult
          // Transform to match ContentSearchResult format for consistency
          type QueryEmbeddingsResult =
            DatabaseGenerated['public']['Functions']['query_content_embeddings']['Returns'][number];
          const transformedData: ContentSearchResult[] = semanticData.map(
            (item: QueryEmbeddingsResult): ContentSearchResult => ({
              id: item.content_id,
              title: item.title,
              description: item.description,
              category: item.category,
              slug: item.slug,
              author: item.author,
              author_profile_url: item.author_profile_url,
              tags: item.tags,
              bookmark_count: item.bookmark_count,
              created_at: item.created_at,
              updated_at: item.updated_at,
              relevance_score: item.similarity,
              // Required fields for ContentSearchResult (provide defaults for missing fields)
              _featured: null satisfies Json,
              combined_score: item.similarity,
              copyCount: item.copy_count,
              date_added: item.created_at,
              examples: null satisfies Json,
              features: null satisfies Json,
              source: 'semantic_search',
              use_cases: null satisfies Json,
              viewCount: item.view_count,
            })
          );
          data = transformedData;
          error = null;
        } else {
          // Fallback to keyword search if semantic search fails or returns no results
          throw new Error('Semantic search returned no results');
        }
      } catch (semanticError) {
        // FALLBACK: Keyword search (backward compatibility)
        console.warn('[unified-search] Semantic search failed, falling back to keyword search', {
          ...logContext,
          error: semanticError instanceof Error ? semanticError.message : String(semanticError),
        });

        const rpcArgs = {
          ...(query !== undefined ? { p_query: query } : {}),
          ...(categories !== undefined ? { p_categories: categories } : {}),
          ...(tags !== undefined ? { p_tags: tags } : {}),
          ...(authors !== undefined ? { p_authors: authors } : {}),
          p_sort: sort,
          p_limit: limit,
          p_offset: offset,
        } satisfies DatabaseGenerated['public']['Functions']['search_content_optimized']['Args'];

        const { data: keywordData, error: keywordError } = await supabaseAnon.rpc(
          'search_content_optimized',
          rpcArgs
        );
        data = keywordData ?? [];
        error = keywordError;
      }
    } else {
      // NO QUERY: Use keyword search for filtering only (no semantic search without query)
      const rpcArgs = {
        ...(categories !== undefined ? { p_categories: categories } : {}),
        ...(tags !== undefined ? { p_tags: tags } : {}),
        ...(authors !== undefined ? { p_authors: authors } : {}),
        p_sort: sort,
        p_limit: limit,
        p_offset: offset,
      } satisfies DatabaseGenerated['public']['Functions']['search_content_optimized']['Args'];

      const { data: keywordData, error: keywordError } = await supabaseAnon.rpc(
        'search_content_optimized',
        rpcArgs
      );
      data = keywordData ?? [];
      error = keywordError;
    }
  }

  const dbEndTime = performance.now();

  if (error) {
    console.error('[unified-search] Search RPC error', {
      ...logContext,
      searchType,
      error: error instanceof Error ? error.message : String(error),
    });
    const rpcName =
      searchType === 'jobs'
        ? 'filter_jobs'
        : searchType === 'unified'
          ? 'search_unified'
          : 'search_content_optimized';
    return errorResponse(error, rpcName, getWithAuthCorsHeaders);
  }

  const results = data;

  // Apply search term highlighting if query provided
  const highlightedResults: HighlightedSearchResult[] = query.trim()
    ? results.map((result) => {
        const highlighted: HighlightedSearchResult = { ...result };

        // For jobs, result is a DatabaseGenerated['public']['Tables']['jobs']['Row'] with title/description fields
        // For content/unified, result has title/description fields
        const title = 'title' in result ? result.title : null;
        const description = 'description' in result ? result.description : null;

        // Highlight title
        if (title && typeof title === 'string') {
          highlighted.title_highlighted = highlightSearchTerms(title, query, {
            wholeWordsOnly: true,
          });
        }

        // Highlight description
        if (description && typeof description === 'string') {
          highlighted.description_highlighted = highlightSearchTerms(description, query, {
            wholeWordsOnly: true,
          });
        }

        // Highlight author (content search only)
        if ('author' in result && result.author && typeof result.author === 'string') {
          highlighted.author_highlighted = highlightSearchTerms(result.author, query, {
            wholeWordsOnly: false, // Allow partial matches in author names
          });
        }

        // Highlight tags (content search only - jobs have tags but they're not highlighted in search results)
        if ('tags' in result && result.tags) {
          const tags = result.tags;
          if (Array.isArray(tags) && tags.length > 0) {
            // Type guard: ensure all tags are strings
            const stringTags: string[] = tags.filter(
              (tag): tag is string => typeof tag === 'string'
            );
            if (stringTags.length > 0) {
              highlighted.tags_highlighted = highlightSearchTermsArray(stringTags, query, {
                wholeWordsOnly: false, // Allow partial matches in tags
              });
            }
          }
        }

        return highlighted;
      })
    : results.map((result) => ({ ...result }));

  // Track search analytics (fire and forget)
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
      error: error instanceof Error ? error.message : String(error),
    });
  });

  const totalTime = performance.now() - startTime;

  // Log successful search completion
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
    searchType: searchType === 'jobs' ? 'unified' : searchType, // Keep response type compatible
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
 * Autocomplete endpoint - smart suggestions from search history + content titles
 */
async function handleAutocomplete(url: URL, startTime: number): Promise<Response> {
  // Validate query string
  const queryStringValidation = validateQueryString(url);
  if (!queryStringValidation.valid) {
    return badRequestResponse(
      queryStringValidation.error ?? 'Invalid query string',
      getWithAuthCorsHeaders
    );
  }

  const query = url.searchParams.get('q')?.trim() || '';

  // Validate limit parameter
  const limitValidation = validateLimit(url.searchParams.get('limit'), 1, 20, 10);
  if (!limitValidation.valid || limitValidation.limit === undefined) {
    return badRequestResponse(
      limitValidation.error ?? 'Invalid limit parameter',
      getWithAuthCorsHeaders
    );
  }
  const limit = limitValidation.limit;

  // Create logContext
  const logContext = createSearchContext({
    query,
    searchType: 'autocomplete',
  });

  // Require at least 2 characters
  if (query.length < 2) {
    return badRequestResponse('Query must be at least 2 characters', getWithAuthCorsHeaders);
  }

  // Call autocomplete RPC (uses search history + content titles)
  const rpcArgs = {
    p_query: query,
    p_limit: limit,
  } satisfies DatabaseGenerated['public']['Functions']['get_search_suggestions_from_history']['Args'];
  const { data, error } = await supabaseAnon.rpc('get_search_suggestions_from_history', rpcArgs);

  if (error) {
    console.error('[unified-search] Autocomplete RPC error', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error, 'get_search_suggestions_from_history', getWithAuthCorsHeaders);
  }

  const suggestions = (data ?? []).map((item: AutocompleteResult) => ({
    text: item.suggestion,
    searchCount: Number(item.search_count),
    isPopular: Number(item.search_count) >= 2, // 2+ searches = popular
  }));

  const totalTime = performance.now() - startTime;

  // Log successful autocomplete
  console.log('[unified-search] Autocomplete completed', {
    ...withDuration(logContext, startTime),
    suggestionCount: suggestions.length,
  });

  const response: AutocompleteResponse = {
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
 * Facets endpoint - available filters for search UI
 */
async function handleFacets(startTime: number): Promise<Response> {
  // Create logContext
  const logContext = createSearchContext({
    searchType: 'facets',
  });

  // Call facets RPC (no args required - Args is 'never')
  const { data, error } = await supabaseAnon.rpc('get_search_facets', undefined);

  if (error) {
    console.error('[unified-search] Facets RPC error', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
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

  // Log successful facets retrieval
  console.log('[unified-search] Facets completed', {
    ...withDuration(logContext, startTime),
    facetCount: facets.length,
  });

  const response: FacetsResponse = {
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
 * Enqueues to pulse queue for batched processing (98% egress reduction)
 * Fire and forget - don't block response
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

  // Enqueue to queue instead of direct insert
  const analyticsFilters =
    filters satisfies DatabaseGenerated['public']['Tables']['search_queries']['Insert']['filters'];
  enqueueSearchAnalytics({
    query,
    filters: analyticsFilters,
    resultCount,
    authorizationHeader,
  }).catch((error) => {
    console.warn('[unified-search] Failed to enqueue search analytics', {
      error: error instanceof Error ? error.message : String(error),
      query: query.substring(0, 50),
    });
  });
}
