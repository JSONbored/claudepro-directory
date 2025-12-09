import 'server-only';
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
 * @param query
 * @param limit
 
 * @returns {Promise<unknown>} Description of return value*/
async function getCachedSearchSuggestions(query: string, limit: number) {
  'use cache';
  cacheLife('quarter'); // 15min stale, 5min revalidate, 2hr expire - More dynamic than static content

  const supabase = createSupabaseAnonClient();
  const rpcArgs: DatabaseGenerated['public']['Functions']['get_search_suggestions_from_history']['Args'] =
    {
      p_query: query,
      p_limit: limit,
    };

  const { data, error } = await supabase.rpc('get_search_suggestions_from_history', rpcArgs);
  if (error) throw error;
  return data;
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
    let data: Awaited<ReturnType<typeof getCachedSearchSuggestions>> | null = null;
    try {
      data = await getCachedSearchSuggestions(query, limit);
    } catch (error) {
      const normalized = normalizeError(error, 'Autocomplete RPC failed');
      reqLogger.error({ err: normalized }, 'Autocomplete RPC failed');
      return createErrorResponse(normalized, {
        route: '/api/search/autocomplete',
        operation: 'get_search_suggestions_from_history',
        method: 'GET',
        logContext: {
          query,
        },
      });
    }

    interface SuggestionRow {
      search_count: null | number;
      suggestion: null | string;
    }
    const rows: SuggestionRow[] = Array.isArray(data) ? (data as SuggestionRow[]) : [];
    const suggestions = rows
      .map((item) => ({
        text: item.suggestion?.trim() ?? '',
        searchCount: Number(item.search_count ?? 0),
        isPopular: Number(item.search_count ?? 0) >= 2,
      }))
      .filter((item) => item.text.length > 0);

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
