/**
 * getSearchSuggestions Tool Handler
 *
 * Get search suggestions based on query history. Helps discover popular searches
 * and provides autocomplete functionality for AI agents.
 */

import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@heyclaude/shared-runtime/logging.ts';
import { McpErrorCode, createErrorResponse } from '../lib/errors.ts';
import { sanitizeString } from '../lib/utils.ts';
import type { GetSearchSuggestionsInput } from '../lib/types.ts';

/**
 * Fetches search suggestions based on query history.
 *
 * @param supabase - Authenticated Supabase client
 * @param input - Tool input with query (min 2 chars) and optional limit (1-20, default 10)
 * @returns Search suggestions with text, search count, and popularity indicator
 * @throws If query is too short or RPC fails
 */
export async function handleGetSearchSuggestions(
  supabase: SupabaseClient<Database>,
  input: GetSearchSuggestionsInput
) {
  // Sanitize and validate inputs
  const query = sanitizeString(input.query);
  const limit = input.limit ?? 10;

  // Validate query length (min 2 characters)
  if (query.length < 2) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_INPUT,
      'Query must be at least 2 characters long'
    );
    throw new Error(error.message);
  }

  // Validate limit (1-20)
  if (limit < 1 || limit > 20) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_INPUT,
      'Limit must be between 1 and 20'
    );
    throw new Error(error.message);
  }

  // Call RPC for search suggestions
  const rpcArgs: Database['public']['Functions']['get_search_suggestions_from_history']['Args'] =
    {
      p_query: query,
      p_limit: limit,
    };

  const { data, error } = await supabase.rpc('get_search_suggestions_from_history', rpcArgs);

  if (error) {
    await logError('Search suggestions RPC failed', {
      rpcName: 'get_search_suggestions_from_history',
      query,
      limit,
    }, error);
    throw new Error(`Failed to fetch search suggestions: ${error.message}`);
  }

  // Format response
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

  // Create text summary
  const textSummary = suggestions.length > 0
    ? `Found ${suggestions.length} search suggestion${suggestions.length === 1 ? '' : 's'} for "${query}":\n\n${suggestions.map((s, i) => `${i + 1}. ${s.text}${s.isPopular ? ' (popular)' : ''} - searched ${s.searchCount} time${s.searchCount === 1 ? '' : 's'}`).join('\n')}`
    : `No search suggestions found for "${query}". Try a different query or check available content with listCategories.`;

  return {
    content: [
      {
        type: 'text' as const,
        text: textSummary,
      },
    ],
    _meta: {
      suggestions,
      query,
      count: suggestions.length,
    },
  };
}
