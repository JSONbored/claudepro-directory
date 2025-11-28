/**
 * searchContent Tool Handler
 * Uses ContentService.getContentPaginated for consistent search behavior with web app
 */

import { ContentService } from '@heyclaude/data-layer';
import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SearchContentInput } from '../lib/types.ts';

type ContentPaginatedItem = Database['public']['CompositeTypes']['content_paginated_item'];

/**
 * Generate a text summary of content matching the provided search filters and pagination.
 *
 * @param input - Search filters and pagination options: `query`, `category`, `tags`, `page`, and `limit`.
 * @returns An object with `content` (a single text block summarizing matched items) and `_meta` containing `items` (formatted items with `slug`, `title`, `category`, truncated `description`, `wasTruncated`, `tags`, `author`, and `dateAdded`), `total`, `page`, `limit`, and `hasMore`.
 */
export async function handleSearchContent(
  supabase: SupabaseClient<Database>,
  input: SearchContentInput
) {
  const { query, category, tags, page, limit } = input;
  const offset = (page - 1) * limit;

  // Use ContentService for consistent behavior with web app
  const contentService = new ContentService(supabase);

  const result = await contentService.getContentPaginated({
    ...(category ? { p_category: category } : {}),
    ...(tags ? { p_tags: tags } : {}),
    ...(query ? { p_search: query } : {}),
    p_order_by: 'created_at',
    p_order_direction: 'desc',
    p_limit: limit,
    p_offset: offset,
  });

  if (!result) {
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

  const items = result.items || [];
  const total = result.pagination?.total_count || 0;
  const hasMore = page * limit < total;

  // Handle empty results explicitly
  if (items.length === 0) {
    return {
      content: [{ type: 'text' as const, text: 'No results found.' }],
      _meta: { items: [], total: 0, page, limit, hasMore: false },
    };
  }

  // Format results
  const formattedItems = items.map((item: ContentPaginatedItem) => {
    const originalDescription = item.description || '';
    const truncatedDescription = originalDescription.substring(0, 200);
    const wasTruncated = originalDescription.length > 200;
    return {
      slug: item.slug || '',
      title: item.title || item.display_title || '',
      category: item.category || '',
      description: truncatedDescription,
      wasTruncated,
      tags: item.tags || [],
      author: item.author || 'Unknown',
      dateAdded: item.date_added || '',
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

  return {
    content: [
      {
        type: 'text' as const,
        text: `Search Results ${searchDesc}${categoryDesc}${tagDesc}:\n\nShowing ${formattedItems.length} of ${total} results (page ${page}):\n\n${textSummary}${hasMore ? '\n\n(More results available on next page)' : ''}`,
      },
    ],
    _meta: {
      items: formattedItems,
      total,
      page,
      limit,
      hasMore,
    },
  };
}