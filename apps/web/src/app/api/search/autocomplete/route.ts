/**
 * Search Autocomplete API Route
 *
 * Returns search autocomplete suggestions based on a query string.
 * Used by the search interface to provide real-time search suggestions as users type.
 *
 * @example
 * ```ts
 * // Request
 * GET /api/search/autocomplete?q=react&limit=10
 *
 * // Response (200)
 * {
 *   "query": "react",
 *   "suggestions": [
 *     { "text": "react hooks", "search_count": 150, "is_popular": true },
 *     { "text": "react native", "search_count": 120, "is_popular": false }
 *   ]
 * }
 * ```
 */

import 'server-only';

import { type GetSearchSuggestionsFormattedArgs } from '@heyclaude/database-types/postgres-types';
// OPTIMIZATION: Removed unused imports - factory handles errors automatically
import {
  createCachedApiRoute, createOptionsHandler as createApiOptionsHandler, type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { searchAutocompleteQuerySchema } from '@heyclaude/web-runtime/api/schemas';
import {
  errorResponseSchema,
  searchAutocompleteResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';

/**
 * GET /api/search/autocomplete - Get search autocomplete suggestions
 *
 * Returns search autocomplete suggestions based on a query string.
 * Validates query (minimum 2 characters) and limit (1-20, default 10) parameters.
 *
 * OPTIMIZATION: Uses createCachedApiRoute to eliminate cached helper function boilerplate.
 */
export const GET = createCachedApiRoute({
  cacheLife: 'short', // 15min stale, 5min revalidate, 2hr expire
  cacheTags: (query) => ['search-autocomplete', `search-autocomplete-${query.q}`],
  cors: 'anon',
  method: 'GET',
  openapi: {
    description:
      'Returns search autocomplete suggestions based on a query string. Used by the search interface to provide real-time search suggestions as users type.',
    operationId: 'getSearchAutocomplete',
    responses: {
      200: {
        description: 'Autocomplete suggestions retrieved successfully',
        schema: searchAutocompleteResponseSchema,
        headers: {
          'X-RateLimit-Remaining': {
            schema: { type: 'string' },
            description: 'Remaining rate limit requests',
          },
          'Cache-Control': {
            schema: { type: 'string' },
            description: 'Cache control directive',
          },
        },
        example: {
          query: 'react',
          suggestions: [
            {
              text: 'react hooks',
              search_count: 150,
              is_popular: true,
            },
            {
              text: 'react native',
              search_count: 120,
              is_popular: false,
            },
          ],
        },
      },
      400: {
        description: 'Invalid query parameters (query must be at least 2 characters)',
        schema: errorResponseSchema,
        example: {
          error: 'Invalid query parameters',
          message: 'Query must be at least 2 characters',
        },
      },
      500: {
        description: 'Internal server error',
        schema: errorResponseSchema,
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while fetching autocomplete suggestions',
        },
      },
    },
    summary: 'Get search autocomplete suggestions',
    tags: ['search', 'autocomplete'],
  },
  operation: 'SearchAutocompleteAPI',
  querySchema: searchAutocompleteQuerySchema,
  responseHandler: (
    result: unknown,
    query: { limit: number; q: string },
    _body: unknown,
    ctx: RouteHandlerContext<{ limit: number; q: string }>
  ) => {
    const { logger } = ctx;
    const { limit, q } = query;

    // Additional validation: query must be at least 2 characters after trimming
    const trimmedQuery = q.trim();
    if (trimmedQuery.length < 2) {
      throw new Error('Query must be at least 2 characters');
    }

    logger.info({ limit, query: trimmedQuery }, 'Autocomplete request received');

    const suggestions = Array.isArray(result) ? result : [];

    return jsonResponse(
      {
        query: trimmedQuery,
        suggestions,
      },
      200,
      getOnlyCorsHeaders
    );
  },
  route: getVersionedRoute('search/autocomplete'),
  service: {
    methodArgs: (query) => {
      const trimmedQuery = query.q.trim();
      const rpcArgs: GetSearchSuggestionsFormattedArgs = {
        p_limit: query.limit,
        p_query: trimmedQuery,
      };
      return [rpcArgs];
    },
    methodName: 'getSearchSuggestionsFormatted',
    serviceKey: 'search',
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('auth');
