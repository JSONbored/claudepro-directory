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
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { createApiRoute, createApiOptionsHandler, searchAutocompleteQuerySchema } from '@heyclaude/web-runtime/server';
import { createErrorResponse, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  buildCacheHeaders,
  createSupabaseAnonClient,
  getWithAuthCorsHeaders,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';

/**
 * Cached helper function to fetch search autocomplete suggestions.
 * Uses Cache Components to reduce function invocations.
 * Cache key includes query and limit for per-query caching.
 * Database RPC returns frontend-ready data (no client-side mapping needed).
 *
 * Cache configuration: Uses 'quarter' profile (15min stale, 5min revalidate, 2hr expire)
 * defined in next.config.mjs. Autocomplete suggestions are more dynamic than static content.
 *
 * @param {string} query - Search query string to get autocomplete suggestions for
 * @param {number} limit - Maximum number of suggestions to return
 * @returns {Promise<unknown[]>} Array of formatted autocomplete suggestion objects from the database RPC
 */
async function getCachedSearchSuggestionsFormatted(query: string, limit: number) {
  'use cache';
  cacheLife('quarter'); // 15min stale, 5min revalidate, 2hr expire (defined in next.config.mjs)

  const supabase = createSupabaseAnonClient();
  const service = new SearchService(supabase);
  const rpcArgs: DatabaseGenerated['public']['Functions']['get_search_suggestions_formatted']['Args'] =
    {
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
  route: '/api/search/autocomplete',
  operation: 'SearchAutocompleteAPI',
  method: 'GET',
  cors: 'auth',
  querySchema: searchAutocompleteQuerySchema,
  openapi: {
    summary: 'Get search autocomplete suggestions',
    description: 'Returns search autocomplete suggestions based on a query string. Used by the search interface to provide real-time search suggestions as users type.',
    tags: ['search', 'autocomplete'],
    operationId: 'getSearchAutocomplete',
    responses: {
      200: {
        description: 'Autocomplete suggestions retrieved successfully',
      },
      400: {
        description: 'Invalid query parameters (query must be at least 2 characters)',
      },
    },
  },
  handler: async ({ logger, query }) => {
    // TypeScript knows query is searchAutocompleteQuerySchema type
    const { q, limit } = query as { q: string; limit: number };

    // Additional validation: query must be at least 2 characters after trimming
    const trimmedQuery = q.trim();
    if (trimmedQuery.length < 2) {
      // This should be caught by schema validation, but adding as safety check
      throw new Error('Query must be at least 2 characters');
    }

    logger.info({ query: trimmedQuery, limit }, 'Autocomplete request received');

    // Database RPC returns frontend-ready data (no client-side mapping needed)
    // This eliminates CPU-intensive array mapping and filtering (5-10% CPU savings)
    let data: Awaited<ReturnType<typeof getCachedSearchSuggestionsFormatted>> | null = null;
    try {
      data = await getCachedSearchSuggestionsFormatted(trimmedQuery, limit);
    } catch (error) {
      const normalized = normalizeError(error, 'Autocomplete RPC failed');
      logger.error({ err: normalized }, 'Autocomplete RPC failed');
      return createErrorResponse(normalized, {
        route: '/api/search/autocomplete',
        operation: 'SearchAutocompleteAPI',
        method: 'GET',
        logContext: {
          query: trimmedQuery,
        },
      });
    }

    // RPC returns array of { text, search_count, is_popular } - use directly
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
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('auth');
