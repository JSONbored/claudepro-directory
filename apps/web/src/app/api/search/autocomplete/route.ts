import 'server-only';

import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { normalizeError, validateLimit, validateQueryString } from '@heyclaude/shared-runtime';
import {
  generateRequestId,
  logger,
  createErrorResponse,
} from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  badRequestResponse,
  jsonResponse,
  getWithAuthCorsHeaders,
  buildCacheHeaders,
  handleOptionsRequest,
} from '@heyclaude/web-runtime/server';
import { type NextRequest } from 'next/server';

const CORS = getWithAuthCorsHeaders;

/**
 * Handle GET /api/search/autocomplete requests and return search suggestions for the provided query.
 *
 * Validates query string and limit parameters, queries the database via a Supabase RPC for suggestions,
 * normalizes and filters results, and responds with JSON and appropriate CORS and cache headers.
 *
 * @param request - The incoming NextRequest containing query parameters:
 *   - `q`: required search text (minimum 2 characters)
 *   - `limit`: optional maximum number of suggestions (1–20, default 10)
 * @returns A Response containing JSON on success: `{ suggestions: Array<{ text: string; searchCount: number; isPopular: boolean }>, query: string }`.
 *          On validation or RPC errors, returns a structured error Response describing the failure.
 * @see validateQueryString
 * @see validateLimit
 * @see createSupabaseAnonClient
 * @see buildCacheHeaders
 * @see createErrorResponse
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
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

  reqLogger.info('Autocomplete request received', { query });

  const supabase = createSupabaseAnonClient();
  const rpcArgs: DatabaseGenerated['public']['Functions']['get_search_suggestions_from_history']['Args'] =
    {
      p_query: query,
      p_limit: limit,
    };

  try {
    const { data, error } = await supabase.rpc('get_search_suggestions_from_history', rpcArgs);

    if (error) {
      const normalized = normalizeError(error, 'Autocomplete RPC failed');
      reqLogger.error('Autocomplete RPC failed', normalized);
      return createErrorResponse(error, {
        route: '/api/search/autocomplete',
        operation: 'get_search_suggestions_from_history',
        method: 'GET',
        logContext: {
          requestId,
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
    reqLogger.error('Autocomplete handler failed', normalized);
    return createErrorResponse(error, {
      route: '/api/search/autocomplete',
      operation: 'GET',
      method: 'GET',
      logContext: {
        requestId,
        query,
      },
    });
  }
}

export function OPTIONS() {
  return handleOptionsRequest(CORS);
}