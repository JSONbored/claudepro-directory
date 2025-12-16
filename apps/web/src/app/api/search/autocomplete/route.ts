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

import { SearchService } from '@heyclaude/data-layer';
import type { GetSearchSuggestionsFormattedArgs } from '@heyclaude/database-types/postgres-types';
import { createErrorResponse, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  buildCacheHeaders,
  createApiOptionsHandler,
  createApiRoute,
  getWithAuthCorsHeaders,
  jsonResponse,
  searchAutocompleteQuerySchema,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';

/****
 * Cached helper function to fetch search autocomplete suggestions.
 * Uses Cache Components to reduce function invocations.
 * Cache key includes query and limit for per-query caching.
 * @param {string} query
 * @param {number} limit
 */
async function getCachedSearchSuggestionsFormatted(query: string, limit: number) {
  'use cache';
  cacheLife('quarter'); // 15min stale, 5min revalidate, 2hr expire

  const service = new SearchService();
  const rpcArgs: GetSearchSuggestionsFormattedArgs = {
    p_limit: limit,
    p_query: query,
  };

  return await service.getSearchSuggestionsFormatted(rpcArgs);
}

/**
 * GET /api/search/autocomplete - Get search autocomplete suggestions
 *
 * Returns search autocomplete suggestions based on a query string.
 * Validates query (minimum 2 characters) and limit (1-20, default 10) parameters.
 */
export const GET = createApiRoute({
  cors: 'auth',
  handler: async ({ logger, query }) => {
    const { limit, q } = query as { limit: number; q: string };

    // Additional validation: query must be at least 2 characters after trimming
    const trimmedQuery = q.trim();
    if (trimmedQuery.length < 2) {
      throw new Error('Query must be at least 2 characters');
    }

    logger.info({ limit, query: trimmedQuery }, 'Autocomplete request received');

    let data: Awaited<ReturnType<typeof getCachedSearchSuggestionsFormatted>> | null = null;
    try {
      data = await getCachedSearchSuggestionsFormatted(trimmedQuery, limit);
    } catch (error) {
      const normalized = normalizeError(error, 'Autocomplete RPC failed');
      logger.error({ err: normalized }, 'Autocomplete RPC failed');
      return createErrorResponse(normalized, {
        logContext: {
          query: trimmedQuery,
        },
        method: 'GET',
        operation: 'SearchAutocompleteAPI',
        route: '/api/search/autocomplete',
      });
    }

    const suggestions = Array.isArray(data) ? data : [];

    return jsonResponse(
      {
        query: trimmedQuery,
        suggestions,
      },
      200,
      {
        ...getWithAuthCorsHeaders,
        ...buildCacheHeaders('search_autocomplete'),
      }
    );
  },
  method: 'GET',
  openapi: {
    description:
      'Returns search autocomplete suggestions based on a query string. Used by the search interface to provide real-time search suggestions as users type.',
    operationId: 'getSearchAutocomplete',
    responses: {
      200: {
        description: 'Autocomplete suggestions retrieved successfully',
      },
      400: {
        description: 'Invalid query parameters (query must be at least 2 characters)',
      },
    },
    summary: 'Get search autocomplete suggestions',
    tags: ['search', 'autocomplete'],
  },
  operation: 'SearchAutocompleteAPI',
  querySchema: searchAutocompleteQuerySchema,
  route: '/api/search/autocomplete',
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('auth');
