/**
 * searchContent Tool Handler
 *
 * Search content with filters and pagination.
 * Uses SearchService for consistent behavior with web app.
 */

import type {
  SearchUnifiedRow,
  SearchContentOptimizedRow,
  SearchContentOptimizedArgs,
  SearchUnifiedArgs,
} from '@heyclaude/database-types/postgres-types';

// Type helper to ensure category matches database enum
type DatabaseCategory = NonNullable<SearchContentOptimizedArgs['p_categories']>[number];
import { SearchService } from '@heyclaude/data-layer';

import type { SearchContentInput } from '../../lib/types';
import { normalizeError } from '@heyclaude/cloudflare-runtime/utils/errors';
import type { ToolContext } from './categories';

type UnifiedSearchResult = SearchUnifiedRow;
type ContentSearchResult = SearchContentOptimizedRow;

/**
 * Search content with filters and pagination.
 *
 * @param input - Search filters and pagination options
 * @param context - Tool handler context
 * @returns Search results with text summary and metadata
 */
export async function handleSearchContent(
  input: SearchContentInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    items: Array<{
      slug: string;
      title: string;
      category: string;
      description: string;
      wasTruncated: boolean;
      tags: string[];
      author: string;
      dateAdded: string;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
      hasMore: boolean;
    };
    usageHints: string[];
    relatedTools: string[];
  };
}> {
  const { prisma, logger } = context;
  const { query, category, tags, page, limit } = input;
  const offset = (page - 1) * limit;
  const startTime = Date.now();

  try {
    const searchService = new SearchService(prisma);

    // Use search_content_optimized when category/tags are provided
    // Use search_unified for simple queries without filters
    const hasFilters = category || (tags && tags.length > 0);

    let results: (UnifiedSearchResult | ContentSearchResult)[] = [];
    let total = 0;

    if (hasFilters) {
      // Build args object conditionally to satisfy exactOptionalPropertyTypes
      const contentArgs: SearchContentOptimizedArgs = {
        p_query: query || '',
        p_limit: limit,
        p_offset: offset,
        p_sort: 'relevance',
      };
      
      if (category) {
        // Type assertion needed because CategorySchema may not include all database categories
        // Database supports: agents, mcp, rules, commands, hooks, statuslines, skills, collections, guides, jobs, changelog
        // Cast to satisfy exactOptionalPropertyTypes - we know category exists
        const categories = [category as DatabaseCategory] as NonNullable<SearchContentOptimizedArgs['p_categories']>;
        contentArgs.p_categories = categories;
      }
      if (tags && tags.length > 0) {
        // p_tags is string[] which matches the type, but exactOptionalPropertyTypes requires explicit assignment
        const tagsArray: string[] = tags;
        contentArgs.p_tags = tagsArray;
      }
      if (query) {
        contentArgs.p_highlight_query = query;
      }

      const contentResponse = await searchService.searchContent(contentArgs);
      results = (contentResponse.data || []) as ContentSearchResult[];
      total =
        typeof contentResponse.total_count === 'number'
          ? contentResponse.total_count
          : results.length;
    } else {
      const unifiedArgs: SearchUnifiedArgs = {
        p_query: query || '',
        p_entities: ['content'],
        p_limit: limit,
        p_offset: offset,
        ...(query ? { p_highlight_query: query } : {}),
      };

      const unifiedResponse = await searchService.searchUnified(unifiedArgs);
      results = (unifiedResponse.data || []) as UnifiedSearchResult[];
      total =
        typeof unifiedResponse.total_count === 'number'
          ? unifiedResponse.total_count
          : results.length;
    }

    if (!results || results.length === 0) {
      const duration = Date.now() - startTime;
      logger.info(
        {
          tool: 'searchContent',
          duration_ms: duration,
          query,
          category,
          resultCount: 0,
        },
        'searchContent completed with no results'
      );

      const structuredOutput = {
        items: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
          hasMore: false,
        },
        usageHints: [
          'Try broadening your search query',
          'Use getSearchSuggestions for autocomplete',
          'Use getSearchFacets to see available filters',
          'Use listCategories to browse by category',
        ],
        relatedTools: ['getSearchSuggestions', 'getSearchFacets', 'listCategories'],
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: 'No results found.',
          },
        ],
        // Structured output matching outputSchema for type-safe access
        structuredContent: structuredOutput,
        // Also include structured data for programmatic access (backward compatibility)
        _meta: structuredOutput,
      } as {
        content: Array<{ type: 'text'; text: string }>;
        structuredContent: typeof structuredOutput;
        _meta: typeof structuredOutput;
      };
    }

    // Format results
    const formattedItems = results.map((item) => {
      const originalDescription = item.description || '';
      const truncatedDescription = originalDescription.substring(0, 200);
      const wasTruncated = originalDescription.length > 200;

      const author = 'author' in item && typeof item.author === 'string' ? item.author : 'Unknown';

      return {
        slug: item.slug || '',
        title: item.title || '',
        category: item.category || '',
        description: truncatedDescription,
        wasTruncated,
        tags: item.tags || [],
        author,
        dateAdded:
          'created_at' in item && typeof item.created_at === 'string'
            ? item.created_at
            : 'updated_at' in item && typeof item.updated_at === 'string'
              ? item.updated_at
              : '',
      };
    });

    // Calculate pagination
    const hasMore = results.length === limit && (total === 0 || page * limit < total);
    const totalPages = total > 0 ? Math.ceil(total / limit) : hasMore ? page + 1 : page;
    const hasNext = hasMore;
    const hasPrev = page > 1;

    // Create text summary
    const searchDesc = query ? `for "${query}"` : 'all content';
    const categoryDesc = category ? ` in ${category}` : '';
    const tagDesc = tags && tags.length > 0 ? ` with tags: ${tags.join(', ')}` : '';

    const textSummary = formattedItems
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.title} (${item.category})\n   ${item.description}${item.wasTruncated ? '...' : ''}${item.tags.length > 0 ? `\n   Tags: ${item.tags.join(', ')}` : ''}`
      )
      .join('\n\n');

    const duration = Date.now() - startTime;
    logger.info(
      {
        tool: 'searchContent',
        duration_ms: duration,
        query,
        category,
        resultCount: formattedItems.length,
        total,
        page,
      },
      'searchContent completed successfully'
    );

    const structuredOutput = {
      items: formattedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
        hasMore,
      },
      usageHints: [
        'Use getContentDetail to see full content for any item',
        'Use downloadContentForPlatform to get formatted configs',
        'Use getRelatedContent to find similar items',
        'Use getContentByTag to filter by specific tags',
      ],
      relatedTools: [
        'getContentDetail',
        'downloadContentForPlatform',
        'getRelatedContent',
        'getContentByTag',
      ],
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: `Search Results ${searchDesc}${categoryDesc}${tagDesc}:\n\nShowing ${formattedItems.length} of ${total} results (page ${page} of ${totalPages}):\n\n${textSummary}${hasMore ? '\n\n(More results available on next page)' : ''}`,
        },
      ],
      // Structured output matching outputSchema for type-safe access
      structuredContent: structuredOutput,
      // Also include structured data for programmatic access (backward compatibility)
      _meta: structuredOutput,
    } as {
      content: Array<{ type: 'text'; text: string }>;
      structuredContent: typeof structuredOutput;
      _meta: typeof structuredOutput;
    };
  } catch (error) {
    const normalized = normalizeError(error, 'searchContent tool failed');
    logger.error({ error: normalized, tool: 'searchContent', query, category }, 'searchContent tool error');
    throw normalized;
  }
}
