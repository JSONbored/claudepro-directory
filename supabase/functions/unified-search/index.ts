/**
 * Unified Search Edge Function
 * Consolidates all client-side search functionality with caching and analytics
 *
 * Endpoints:
 * - GET /unified-search - Main search with filters, caching (5min), analytics tracking
 * - GET /unified-search/autocomplete - Smart autocomplete from search history + content titles
 * - GET /unified-search/facets - Available filters (categories, tags, authors)
 */

import type { Database } from '../_shared/database.types.ts';
import { getWithAuthCorsHeaders } from '../_shared/utils/cors.ts';
import {
  badRequestResponse,
  errorResponse,
  methodNotAllowedResponse,
} from '../_shared/utils/response.ts';
import { supabaseAnon } from '../_shared/utils/supabase.ts';

type SearchResult = Database['public']['Functions']['search_content_optimized']['Returns'][number];
type AutocompleteResult =
  Database['public']['Functions']['get_search_suggestions_from_history']['Returns'][number];
type FacetResult = Database['public']['Functions']['get_search_facets']['Returns'][number];

interface SearchResponse {
  results: SearchResult[];
  query: string;
  filters: {
    categories?: string[];
    tags?: string[];
    authors?: string[];
    sort?: string;
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

Deno.serve(async (req: Request) => {
  const startTime = performance.now();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getWithAuthCorsHeaders,
    });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET', getWithAuthCorsHeaders);
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Route to appropriate handler
    if (pathname.endsWith('/autocomplete')) {
      return await handleAutocomplete(url, startTime);
    }

    if (pathname.endsWith('/facets')) {
      return await handleFacets(startTime);
    }

    // Default: main search endpoint
    return await handleSearch(url, startTime, req);
  } catch (error) {
    console.error('Unified search error:', error);
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
  const sort = url.searchParams.get('sort') || 'relevance';
  const limit = Math.min(
    Math.max(Number.parseInt(url.searchParams.get('limit') || '20', 10), 1),
    100
  );
  const offset = Math.max(Number.parseInt(url.searchParams.get('offset') || '0', 10), 0);

  // Validate sort parameter
  const validSorts = ['relevance', 'popularity', 'newest', 'alphabetical'];
  if (!validSorts.includes(sort)) {
    return badRequestResponse(
      `Invalid sort parameter. Must be one of: ${validSorts.join(', ')}`,
      getWithAuthCorsHeaders
    );
  }

  const dbStartTime = performance.now();

  // Call search RPC
  const { data, error } = await supabaseAnon.rpc('search_content_optimized', {
    p_query: query || undefined,
    p_categories: categories,
    p_tags: tags,
    p_authors: authors,
    p_sort: sort,
    p_limit: limit,
    p_offset: offset,
  });

  const dbEndTime = performance.now();

  if (error) {
    console.error('Search RPC error:', error);
    return errorResponse(error, 'search_content_optimized', getWithAuthCorsHeaders);
  }

  const results = (data || []) as SearchResult[];

  // Track search analytics (fire and forget)
  trackSearchAnalytics(
    query,
    {
      categories,
      tags,
      authors,
      sort,
    },
    results.length,
    req
  ).catch((err) => {
    // Silent fail - don't block response
    console.error('Analytics tracking failed:', err);
  });

  const totalTime = performance.now() - startTime;

  const response: SearchResponse = {
    results,
    query,
    filters: {
      ...(categories && { categories }),
      ...(tags && { tags }),
      ...(authors && { authors }),
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
    console.error('Autocomplete RPC error:', error);
    return errorResponse(error, 'get_search_suggestions_from_history', getWithAuthCorsHeaders);
  }

  const suggestions = ((data || []) as AutocompleteResult[]).map((item) => ({
    text: item.suggestion,
    searchCount: Number(item.search_count),
    isPopular: Number(item.search_count) >= 2, // 2+ searches = popular
  }));

  const totalTime = performance.now() - startTime;

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
  // Call facets RPC
  const { data, error } = await supabaseAnon.rpc('get_search_facets');

  if (error) {
    console.error('Facets RPC error:', error);
    return errorResponse(error, 'get_search_facets', getWithAuthCorsHeaders);
  }

  const facets = ((data || []) as FacetResult[]).map((item) => ({
    category: item.category,
    contentCount: item.content_count,
    tags: item.all_tags || [],
    authors: item.authors || [],
  }));

  const totalTime = performance.now() - startTime;

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
  filters: { categories?: string[]; tags?: string[]; authors?: string[]; sort?: string },
  resultCount: number,
  req: Request
): Promise<void> {
  // Only track if there's a query
  if (!query) return;

  // Get user ID from auth header if present
  const authHeader = req.headers.get('Authorization');
  let userId: string | null = null;

  if (authHeader) {
    try {
      const { data } = await supabaseAnon.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = data.user?.id || null;
    } catch {
      // Ignore auth errors - track as anonymous
    }
  }

  // Insert to search_queries table
  await supabaseAnon.from('search_queries').insert({
    query,
    filters:
      filters as unknown as Database['public']['Tables']['search_queries']['Insert']['filters'],
    result_count: resultCount,
    user_id: userId,
    session_id: null, // Could add session tracking later
  });
}
