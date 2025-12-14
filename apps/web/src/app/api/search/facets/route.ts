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
import { createErrorResponse, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  buildCacheHeaders,
  createApiOptionsHandler,
  createApiRoute,
  getWithAuthCorsHeaders,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';

/**
 * Cached helper function to fetch search facets.
 * Uses Cache Components to reduce function invocations.
 */
async function getCachedSearchFacetsFormatted() {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const service = new SearchService();
  return await service.getSearchFacetsFormatted();
}

/**
 * GET /api/search/facets - Get search facets
 *
 * Returns available search facets (categories, tags, authors) for filtering.
 */
export const GET = createApiRoute({
  cors: 'auth',
  handler: async ({ logger }) => {
    logger.info({}, 'Facets request received');

    let data: Awaited<ReturnType<typeof getCachedSearchFacetsFormatted>> | null = null;
    try {
      data = await getCachedSearchFacetsFormatted();
    } catch (error) {
      const normalized = normalizeError(error, 'Facets RPC failed');
      logger.error({ err: normalized }, 'Facets RPC failed');
      return createErrorResponse(normalized, {
        logContext: { facetType: 'all' },
        method: 'GET',
        operation: 'SearchFacetsAPI',
        route: '/api/search/facets',
      });
    }

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
  method: 'GET',
  openapi: {
    description:
      'Returns available search facets (categories, tags, authors) for filtering search results. Used by the search interface to populate filter dropdowns and facet counts.',
    operationId: 'getSearchFacets',
    responses: {
      200: {
        description: 'Search facets retrieved successfully',
      },
    },
    summary: 'Get search facets',
    tags: ['search', 'facets'],
  },
  operation: 'SearchFacetsAPI',
  route: '/api/search/facets',
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('auth');
