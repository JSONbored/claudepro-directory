import 'server-only';
import { SearchService } from '@heyclaude/data-layer';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { validateLimit, validateQueryString } from '@heyclaude/shared-runtime';
import { createErrorResponse, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  badRequestResponse,
  buildCacheHeaders,
  createSupabaseAnonClient,
  getWithAuthCorsHeaders,
  handleOptionsRequest,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { type NextRequest } from 'next/server';

const CORS = getWithAuthCorsHeaders;

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
 * Handle GET requests for search autocomplete and return matching suggestions based on the user's query.
 *
 * Validates query string and `limit` parameters, queries the database via a Supabase RPC for historical
 * search suggestions, and responds with a JSON payload containing `suggestions` and the original `query`.
 * Validation failures produce a 400 response; RPC or unexpected failures produce a structured error response.
 *
 * @param request - The incoming NextRequest for the autocomplete endpoint
 * @returns A Response containing JSON `{ suggestions, query }` with HTTP 200 on success, or an error response on failure
 *
 * @see validateQueryString
 * @see validateLimit
 * @see createSupabaseAnonClient
 * @see createErrorResponse
 */
export async function GET(request: NextRequest) {
  const reqLogger = logger.child({
    method: 'GET',
    operation: 'SearchAutocompleteAPI',
    route: '/api/search/autocomplete',
  });
  const url = request.nextUrl;

  const queryStringValidation = validateQueryString(url);
  if (!queryStringValidation.valid) {
    return badRequestResponse(queryStringValidation.error ?? 'Invalid query string', CORS);
  }

  const query = url.searchParams.get('q')?.trim() ?? '';
  if (query.length < 2) {
    return badRequestResponse('Query must be at least 2 characters', CORS);
  }

  const limitValidation = validateLimit(url.searchParams.get('limit'), 1, 20, 10);
  if (!limitValidation.valid || limitValidation.limit === undefined) {
    return badRequestResponse(limitValidation.error ?? 'Invalid limit parameter', CORS);
  }
  const limit = limitValidation.limit;

  reqLogger.info({ query }, 'Autocomplete request received');

  try {
    // Database RPC returns frontend-ready data (no client-side mapping needed)
    // This eliminates CPU-intensive array mapping and filtering (5-10% CPU savings)
    let data: Awaited<ReturnType<typeof getCachedSearchSuggestionsFormatted>> | null = null;
    try {
      data = await getCachedSearchSuggestionsFormatted(query, limit);
    } catch (error) {
      const normalized = normalizeError(error, 'Autocomplete RPC failed');
      reqLogger.error({ err: normalized }, 'Autocomplete RPC failed');
      return createErrorResponse(normalized, {
        logContext: {
          query,
        },
        method: 'GET',
        operation: 'get_search_suggestions_formatted',
        route: '/api/search/autocomplete',
      });
    }

    // RPC returns array of { text, search_count, is_popular } - use directly
    const suggestions = Array.isArray(data) ? data : [];

    return jsonResponse(
      {
        query,
        suggestions,
      },
      200,
      {
        ...CORS,
        ...buildCacheHeaders('search_autocomplete'),
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Autocomplete handler failed');
    reqLogger.error({ err: normalized }, 'Autocomplete handler failed');
    return createErrorResponse(normalized, {
      logContext: {
        query,
      },
      method: 'GET',
      operation: 'GET',
      route: '/api/search/autocomplete',
    });
  }
}

export function OPTIONS() {
  return handleOptionsRequest(CORS);
}
