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
 *     - limit/offset: Pagination
 * - GET /unified-search/autocomplete - Smart autocomplete from search history + content titles
 * - GET /unified-search/facets - Available filters (categories, tags, authors)
 *
 * Search Routing:
 * - With entities param → search_unified() RPC (federated multi-entity search)
 * - Without entities param → search_content_optimized() RPC (content-only with advanced filters)
 */

import { supabaseAnon } from '../_shared/clients/supabase.ts';
import type { Database } from '../_shared/database.types.ts';
import { trackSearchQueryEdge } from '../_shared/utils/analytics/tracker.ts';
import {
  badRequestResponse,
  errorResponse,
  getWithAuthCorsHeaders,
} from '../_shared/utils/http.ts';
import { createSearchContext, withDuration } from '../_shared/utils/logging.ts';
import { createRouter, type HttpMethod, type RouterContext } from '../_shared/utils/router.ts';

type ContentSearchResult =
  Database['public']['Functions']['search_content_optimized']['Returns'][number];
type UnifiedSearchResult = Database['public']['Functions']['search_unified']['Returns'][number];
type AutocompleteResult =
  Database['public']['Functions']['get_search_suggestions_from_history']['Returns'][number];
type FacetResult = Database['public']['Functions']['get_search_facets']['Returns'][number];

interface SearchResponse {
  results: ContentSearchResult[] | UnifiedSearchResult[];
  query: string;
  filters: {
    categories?: string[];
    tags?: string[];
    authors?: string[];
    sort?: string;
    entities?: string[];
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
    // Default: main search endpoint
    return handleSearch(ctx.url, ctx.startTime, ctx.request);
  },
  routes: [
    {
      name: 'autocomplete',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      match: (ctx) => ctx.pathname.endsWith('/autocomplete'),
      handler: (ctx) => handleAutocomplete(ctx.url, ctx.startTime),
    },
    {
      name: 'facets',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      match: (ctx) => ctx.pathname.endsWith('/facets'),
      handler: (ctx) => handleFacets(ctx.startTime),
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
  // Parse and validate query parameters
  const query = url.searchParams.get('q')?.trim() || '';
  const categories = url.searchParams.get('categories')?.split(',').filter(Boolean);
  const tags = url.searchParams.get('tags')?.split(',').filter(Boolean);
  const authors = url.searchParams.get('authors')?.split(',').filter(Boolean);
  const entities = url.searchParams.get('entities')?.split(',').filter(Boolean);
  const sort = url.searchParams.get('sort') || 'relevance';
  const limit = Math.min(
    Math.max(Number.parseInt(url.searchParams.get('limit') || '20', 10), 1),
    100
  );
  const offset = Math.max(Number.parseInt(url.searchParams.get('offset') || '0', 10), 0);

  // Determine search type based on entities parameter
  const searchType: 'content' | 'unified' = entities ? 'unified' : 'content';

  // Create logContext
  const logContext = createSearchContext({
    query,
    searchType,
    filters: { categories, tags, authors, entities, sort },
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
  let data: ContentSearchResult[] | UnifiedSearchResult[];
  let error: unknown;

  // Route to appropriate RPC based on search type
  if (searchType === 'unified') {
    const { data: unifiedData, error: unifiedError } = await supabaseAnon.rpc('search_unified', {
      p_query: query,
      p_entities: entities || ['content', 'company', 'job', 'user'],
      p_limit: limit,
      p_offset: offset,
    });
    data = (unifiedData || []) as UnifiedSearchResult[];
    error = unifiedError;
  } else {
    const { data: contentData, error: contentError } = await supabaseAnon.rpc(
      'search_content_optimized',
      {
        p_query: query || undefined,
        p_categories: categories,
        p_tags: tags,
        p_authors: authors,
        p_sort: sort,
        p_limit: limit,
        p_offset: offset,
      }
    );
    data = (contentData || []) as ContentSearchResult[];
    error = contentError;
  }

  const dbEndTime = performance.now();

  if (error) {
    console.error('[unified-search] Search RPC error', {
      ...logContext,
      searchType,
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(
      error,
      searchType === 'unified' ? 'search_unified' : 'search_content_optimized',
      getWithAuthCorsHeaders
    );
  }

  const results = data;

  // Track search analytics (fire and forget)
  trackSearchAnalytics(
    query,
    {
      categories,
      tags,
      authors,
      sort,
      entities,
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
  });

  const response: SearchResponse = {
    results,
    query,
    filters: {
      ...(categories && { categories }),
      ...(tags && { tags }),
      ...(authors && { authors }),
      ...(entities && { entities }),
      sort,
    },
    pagination: {
      total: results.length,
      limit,
      offset,
      hasMore: results.length === limit,
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
      // Edge caching: 5 minutes + stale-while-revalidate
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
      'CDN-Cache-Control': 'max-age=300',
      ...getWithAuthCorsHeaders,
    },
  });
}

/**
 * Autocomplete endpoint - smart suggestions from search history + content titles
 */
async function handleAutocomplete(url: URL, startTime: number): Promise<Response> {
  const query = url.searchParams.get('q')?.trim() || '';
  const limit = Math.min(
    Math.max(Number.parseInt(url.searchParams.get('limit') || '10', 10), 1),
    20
  );

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
  const { data, error } = await supabaseAnon.rpc('get_search_suggestions_from_history', {
    p_query: query,
    p_limit: limit,
  });

  if (error) {
    console.error('[unified-search] Autocomplete RPC error', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error, 'get_search_suggestions_from_history', getWithAuthCorsHeaders);
  }

  const suggestions = ((data || []) as AutocompleteResult[]).map((item) => ({
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
      // Longer cache for autocomplete (1 hour)
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'CDN-Cache-Control': 'max-age=3600',
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

  // Call facets RPC
  const { data, error } = await supabaseAnon.rpc('get_search_facets');

  if (error) {
    console.error('[unified-search] Facets RPC error', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error, 'get_search_facets', getWithAuthCorsHeaders);
  }

  const facets = ((data || []) as FacetResult[]).map((item) => ({
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
      // Long cache for facets (1 hour)
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'CDN-Cache-Control': 'max-age=3600',
      'X-Response-Time': `${Math.round(totalTime)}ms`,
      ...getWithAuthCorsHeaders,
    },
  });
}

/**
 * Track search analytics to search_queries table
 * Fire and forget - don't block response
 */
async function trackSearchAnalytics(
  query: string,
  filters: {
    categories?: string[];
    tags?: string[];
    authors?: string[];
    sort?: string;
    entities?: string[];
  },
  resultCount: number,
  authorizationHeader: string | null
): Promise<void> {
  if (!query) return;

  await trackSearchQueryEdge({
    query,
    filters: filters as Database['public']['Tables']['search_queries']['Insert']['filters'],
    resultCount,
    authorizationHeader,
  });
}
