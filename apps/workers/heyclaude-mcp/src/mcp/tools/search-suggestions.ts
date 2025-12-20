/**
 * getSearchSuggestions Tool Handler
 *
 * Get search suggestions based on query history. Helps discover popular searches
 * and provides autocomplete functionality for AI agents.
 */

import { SearchService } from '@heyclaude/data-layer';
import { McpErrorCode, createErrorResponse } from '../../lib/errors';
import { sanitizeString } from '../../lib/utils';
import type { GetSearchSuggestionsInput } from '../../lib/types';
import { normalizeError } from '@heyclaude/cloudflare-runtime/utils/errors';
import type { ToolContext } from './categories';

/**
 * Fetches search suggestions based on query history.
 *
 * @param input - Tool input with query (min 2 chars) and optional limit (1-20, default 10)
 * @param context - Tool handler context
 * @returns Search suggestions with text, search count, and popularity indicator
 */
export async function handleGetSearchSuggestions(
  input: GetSearchSuggestionsInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    suggestions: Array<{
      text: string;
      searchCount: number;
      isPopular: boolean;
    }>;
    query: string;
    count: number;
  };
}> {
  const { prisma, logger } = context;
  // Sanitize and validate inputs
  const query = sanitizeString(input.query);
  const limit = input.limit ?? 10;
  const startTime = Date.now();

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
    const error = createErrorResponse(McpErrorCode.INVALID_INPUT, 'Limit must be between 1 and 20');
    throw new Error(error.message);
  }

  try {
    const searchService = new SearchService(prisma);

    // Get search suggestions using SearchService
    const rpcArgs = {
      p_query: query,
      p_limit: limit,
    };

    const data = await searchService.getSearchSuggestions(rpcArgs);

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
    const textSummary =
      suggestions.length > 0
        ? `Found ${suggestions.length} search suggestion${suggestions.length === 1 ? '' : 's'} for "${query}":\n\n${suggestions.map((s, i) => `${i + 1}. ${s.text}${s.isPopular ? ' (popular)' : ''} - searched ${s.searchCount} time${s.searchCount === 1 ? '' : 's'}`).join('\n')}`
        : `No search suggestions found for "${query}". Try a different query or check available content with listCategories.`;

    const duration = Date.now() - startTime;
    logger.info(
      {
        tool: 'getSearchSuggestions',
        duration_ms: duration,
        query,
        limit,
        resultCount: suggestions.length,
      },
      'getSearchSuggestions completed successfully'
    );

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
  } catch (error) {
    const normalized = normalizeError(error, 'getSearchSuggestions tool failed');
    logger.error(
      { error: normalized, tool: 'getSearchSuggestions', query, limit },
      'getSearchSuggestions tool error'
    );
    throw normalized;
  }
}
