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

// OPTIMIZATION: Removed unused imports - factory handles errors automatically
import {
  createOptionsHandler as createApiOptionsHandler,
  createCachedApiRoute,
  type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import {
  errorResponseSchema,
  searchFacetsResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';

/**
 * GET /api/search/facets - Get search facets
 *
 * Returns available search facets (categories, tags, authors) for filtering.
 *
 * OPTIMIZATION: Uses createCachedApiRoute to eliminate cached helper function boilerplate.
 */
export const GET = createCachedApiRoute({
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: ['search-facets'],
  cors: 'anon',
  method: 'GET',
  openapi: {
    description:
      'Returns available search facets (categories, tags, authors) for filtering search results. Used by the search interface to populate filter dropdowns and facet counts.',
    operationId: 'getSearchFacets',
    responses: {
      200: {
        description: 'Search facets retrieved successfully',
        schema: searchFacetsResponseSchema,
        headers: {
          'Cache-Control': {
            schema: { type: 'string' },
            description: 'Cache control directive',
          },
          'X-Generated-By': {
            schema: { type: 'string' },
            description: 'Source of the response data',
          },
        },
        example: {
          facets: [
            {
              category: 'skills',
              content_count: 150,
              tags: ['javascript', 'typescript', 'react'],
              authors: ['user1', 'user2'],
            },
            {
              category: 'agents',
              content_count: 75,
              tags: ['ai', 'automation', 'llm'],
              authors: ['user3'],
            },
          ],
        },
      },
      500: {
        description: 'Internal server error',
        schema: errorResponseSchema,
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while fetching search facets',
        },
      },
    },
    summary: 'Get search facets',
    tags: ['search', 'facets'],
  },
  operation: 'SearchFacetsAPI',
  responseHandler: (
    result: unknown,
    _query: unknown,
    _body: unknown,
    _ctx: RouteHandlerContext
  ) => {
    const facets = Array.isArray(result) ? result : [];
    return jsonResponse({ facets }, 200, getOnlyCorsHeaders);
  },
  route: getVersionedRoute('search/facets'),
  service: {
    methodArgs: () => [],
    methodName: 'getSearchFacetsFormatted',
    serviceKey: 'search',
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('auth');
