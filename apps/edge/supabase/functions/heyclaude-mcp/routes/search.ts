/**
 * searchContent Tool Handler
 * Uses SearchService for consistent search behavior with web app
 * Follows architectural strategy: data layer -> database RPC -> DB
 * 
 * Uses search_content_optimized when category/tags are provided (matches API route behavior)
 * Uses search_unified for simple queries without filters
 */

import { SearchService } from '@heyclaude/data-layer/services/search.ts';
import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSearchUsageHints } from '../lib/usage-hints.ts';
import type { SearchContentInput } from '../lib/types.ts';

// Use generated types from database
type UnifiedSearchResult = Database['public']['Functions']['search_unified']['Returns'][number];
type ContentSearchResult = Database['public']['Functions']['search_content_optimized']['Returns'][number];

/**
 * Fetches unified search results matching the given search filters and returns a text summary plus metadata.
 *
 * @param input - Search filters and pagination options: `query` (search text), `category`, `tags`, `page`, and `limit`.
 * @returns An object with `content` (a single text block summarizing matched items) and `_meta` containing `items` (formatted items with slug, title, category, truncated description, tags, author, and dateAdded), `total`, `page`, `limit`, and `hasMore`.
 */
export async function handleSearchContent(
  supabase: SupabaseClient<Database>,
  input: SearchContentInput
) {
  const { query, category, tags, page, limit } = input;
  const offset = (page - 1) * limit;

  // Use SearchService for consistent behavior with web app
  // Follows architectural strategy: data layer -> database RPC -> DB
  const searchService = new SearchService(supabase);

  // Use search_content_optimized when category/tags are provided (matches API route behavior)
  // Use search_unified for simple queries without filters
  const hasFilters = category || (tags && tags.length > 0);

  let results: (UnifiedSearchResult | ContentSearchResult)[] = [];
  let total = 0;

  if (hasFilters) {
    // Use search_content_optimized for filtered searches (matches API route 'content' search type)
    const contentArgs: Database['public']['Functions']['search_content_optimized']['Args'] = {
      p_query: query || '',
      p_limit: limit,
      p_offset: offset,
      p_sort: 'relevance',
      ...(category ? { p_categories: [category] } : {}),
      ...(tags && tags.length > 0 ? { p_tags: tags } : {}),
      ...(query ? { p_highlight_query: query } : {}),
    };

    const contentResponse = await searchService.searchContent(contentArgs);
    results = (contentResponse.data || []) as ContentSearchResult[];
    total = typeof contentResponse.total_count === 'number' ? contentResponse.total_count : results.length;
  } else {
    // Use search_unified for simple queries (matches API route 'unified' search type)
    const unifiedArgs: Database['public']['Functions']['search_unified']['Args'] = {
      p_query: query || '',
      p_entities: ['content'],
      p_limit: limit,
      p_offset: offset,
      ...(query ? { p_highlight_query: query } : {}),
    };

    const unifiedResponse = await searchService.searchUnified(unifiedArgs);
    results = (unifiedResponse.data || []) as UnifiedSearchResult[];
    total = typeof unifiedResponse.total_count === 'number' ? unifiedResponse.total_count : results.length;
  }

  if (!results || results.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No results found.',
        },
      ],
      _meta: {
        items: [],
        total: 0,
        page,
        limit,
        hasMore: false,
      },
    };
  }

  // Calculate pagination
  const hasMore = results.length === limit && (total === 0 || (page * limit) < total);

  // Handle empty results explicitly
  if (items.length === 0) {
    const usageHints = getSearchUsageHints(false, category);
    return {
      content: [{ type: 'text' as const, text: 'No results found.' }],
      _meta: { 
        items: [], 
        total: 0, 
        page, 
        limit, 
        hasMore: false,
        usageHints,
        relatedTools: ['getSearchSuggestions', 'getSearchFacets', 'listCategories'],
      },
    };
  }

  // Format results - both search types have similar structure
  const formattedItems = results.map((item) => {
    const originalDescription = item.description || '';
    const truncatedDescription = originalDescription.substring(0, 200);
    const wasTruncated = originalDescription.length > 200;
    
    // search_content_optimized includes author, search_unified doesn't
    const author = 'author' in item && typeof item.author === 'string' 
      ? item.author 
      : 'Unknown';
    
    return {
      slug: item.slug || '',
      title: item.title || '',
      category: item.category || '',
      description: truncatedDescription,
      wasTruncated,
      tags: item.tags || [],
      author,
      dateAdded: 'created_at' in item && typeof item.created_at === 'string'
        ? item.created_at
        : 'updated_at' in item && typeof item.updated_at === 'string'
        ? item.updated_at
        : '',
    };
  });

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

  // Calculate pagination metadata
  const totalPages = total > 0 ? Math.ceil(total / limit) : (hasMore ? page + 1 : page);
  const hasNext = hasMore;
  const hasPrev = page > 1;

  // Get usage hints for search results
  const usageHints = getSearchUsageHints(true, category);

  return {
    content: [
      {
        type: 'text' as const,
        text: `Search Results ${searchDesc}${categoryDesc}${tagDesc}:\n\nShowing ${formattedItems.length} of ${total} results (page ${page} of ${totalPages}):\n\n${textSummary}${hasMore ? '\n\n(More results available on next page)' : ''}`,
      },
    ],
    _meta: {
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
      usageHints,
      relatedTools: ['getContentDetail', 'downloadContentForPlatform', 'getRelatedContent', 'getContentByTag'],
    },
  };
}