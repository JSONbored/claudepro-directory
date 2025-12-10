import 'server-only';
import { SearchService } from '@heyclaude/data-layer';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { validateLimit, validateQueryString } from '@heyclaude/shared-runtime';
import { logger, createErrorResponse, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  badRequestResponse,
  jsonResponse,
  getWithAuthCorsHeaders,
  buildCacheHeaders,
  handleOptionsRequest,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { type NextRequest } from 'next/server';

const CORS = getWithAuthCorsHeaders;

/**
 * Cached helper function to fetch search autocomplete suggestions
 * Uses Cache Components to reduce function invocations
 * Cache key includes query and limit for per-query caching
 * Database RPC returns frontend-ready data (no client-side mapping needed)
 * @param query
 * @param limit
 
 * @returns {Promise<unknown>} Description of return value*/
async function getCachedSearchSuggestionsFormatted(query: string, limit: number) {
  'use cache';
  cacheLife('quarter'); // 15min stale, 5min revalidate, 2hr expire - More dynamic than static content

  const supabase = createSupabaseAnonClient();
  const service = new SearchService(supabase);
  const rpcArgs: DatabaseGenerated['public']['Functions']['get_search_suggestions_formatted']['Args'] =
    {
      p_query: query,
      p_limit: limit,
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
    operation: 'SearchAutocompleteAPI',
    route: '/api/search/autocomplete',
    method: 'GET',
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
        route: '/api/search/autocomplete',
        operation: 'get_search_suggestions_formatted',
        method: 'GET',
        logContext: {
          query,
        },
      });
    }

    // RPC returns array of { text, search_count, is_popular } - use directly
    const suggestions = Array.isArray(data) ? data : [];

    return jsonResponse(
      {
        suggestions,
        query,
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
      route: '/api/search/autocomplete',
      operation: 'GET',
      method: 'GET',
      logContext: {
        query,
      },
    });
  }
}

export function OPTIONS() {
  return handleOptionsRequest(CORS);
}
