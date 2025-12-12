/**
 * Search Facets API Route
 * 
 * Returns available search facets (categories, tags, authors) for filtering search results.
 * Used by the search interface to populate filter dropdowns and facet counts.
 * 
 * @example
 * ```ts
 * // Request
 * GET /api/search/facets
 * 
 * // Response (200)
 * {
 *   "facets": [
 *     {
 *       "category": "skills",
 *       "content_count": 150,
 *       "tags": ["javascript", "typescript", "react"],
 *       "authors": ["user1", "user2"]
 *     }
 *   ]
 * }
 * ```
 */

import 'server-only';
import { SearchService } from '@heyclaude/data-layer';
import { createApiRoute, createApiOptionsHandler } from '@heyclaude/web-runtime/server';
import { createErrorResponse, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  buildCacheHeaders,
  createSupabaseAnonClient,
  getWithAuthCorsHeaders,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';

/**
 * Cached helper function to fetch search facets.
 * Uses Cache Components to reduce function invocations.
 * Database RPC returns frontend-ready data (no client-side mapping needed).
 *
 * Cache configuration: Uses 'static' profile (1 day stale, 6hr revalidate, 30 days expire)
 * defined in next.config.mjs. Search facets are public data that changes infrequently.
 *
 * @returns {Promise<unknown[]>} Array of formatted search facet objects from the database RPC
 */
async function getCachedSearchFacetsFormatted() {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire (defined in next.config.mjs)

  const supabase = createSupabaseAnonClient();
  const service = new SearchService(supabase);
  return await service.getSearchFacetsFormatted();
}

/**
 * GET /api/search/facets - Get search facets
 * 
 * Returns available search facets (categories, tags, authors) for filtering.
 * Database RPC returns frontend-ready data (no client-side mapping needed).
 */
export const GET = createApiRoute({
  route: '/api/search/facets',
  operation: 'SearchFacetsAPI',
  method: 'GET',
  cors: 'auth',
  openapi: {
    summary: 'Get search facets',
    description: 'Returns available search facets (categories, tags, authors) for filtering search results. Used by the search interface to populate filter dropdowns and facet counts.',
    tags: ['search', 'facets'],
    operationId: 'getSearchFacets',
    responses: {
      200: {
        description: 'Search facets retrieved successfully',
      },
    },
  },
  handler: async ({ logger }) => {
    logger.info({}, 'Facets request received');

    // Database RPC returns frontend-ready data (no client-side mapping needed)
    // This eliminates CPU-intensive array mapping and filtering (5-10% CPU savings)
    let data: Awaited<ReturnType<typeof getCachedSearchFacetsFormatted>> | null = null;
    try {
      data = await getCachedSearchFacetsFormatted();
    } catch (error) {
      const normalized = normalizeError(error, 'Facets RPC failed');
      logger.error({ err: normalized }, 'Facets RPC failed');
      return createErrorResponse(normalized, {
        route: '/api/search/facets',
        operation: 'SearchFacetsAPI',
        method: 'GET',
        logContext: { facetType: 'all' },
      });
    }

    // RPC returns array of { category, content_count, tags, authors } - use directly
    const facets = Array.isArray(data) ? data : [];

    return jsonResponse(
      {
        facets,
      },
      200,
      {
        ...getWithAuthCorsHeaders,
        ...buildCacheHeaders('search_facets'),
      }
    );
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('auth');
