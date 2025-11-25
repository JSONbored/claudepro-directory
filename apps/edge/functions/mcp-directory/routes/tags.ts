/**
 * getContentByTag Tool Handler
 *
 * Get content filtered by specific tags with AND/OR logic support.
 */

import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GetContentByTagInput } from '../lib/types.ts';

type ContentPaginatedItem = Database['public']['CompositeTypes']['content_paginated_item'];

export async function handleGetContentByTag(
  supabase: SupabaseClient<Database>,
  input: GetContentByTagInput
) {
  const { tags, logic, category, limit } = input;

  // Use get_content_paginated with proper parameters
  const { data, error } = await supabase.rpc('get_content_paginated', {
    ...(category ? { p_category: category } : {}),
    p_tags: tags, // Pass tags array
    p_order_by: 'created_at',
    p_order_direction: 'desc',
    p_limit: limit,
    p_offset: 0,
  });

  if (error) {
    throw new Error(`Failed to fetch content by tags: ${error.message}`);
  }

  // Extract items from paginated result
  const items = data?.items || [];

  if (items.length === 0) {
    const categoryDesc = category ? ` in ${category}` : '';
    return {
      content: [
        {
          type: 'text' as const,
          text: `No content found with tags: ${tags.join(', ')}${categoryDesc}`,
        },
      ],
      _meta: {
        items: [],
        tags,
        logic,
        category: category || 'all',
      },
    };
  }

  // Filter by logic (AND vs OR)
  let filteredItems = items;

  if (logic === 'AND') {
    // For AND logic, only include items that have ALL tags
    filteredItems = items.filter((item: ContentPaginatedItem) => {
      const itemTags = item.tags || [];
      return tags.every((tag) => itemTags.includes(tag));
    });

    if (filteredItems.length === 0) {
      const categoryDesc = category ? ` in ${category}` : '';
      return {
        content: [
          {
            type: 'text' as const,
            text: `No content found with ALL tags: ${tags.join(', ')}${categoryDesc}`,
          },
        ],
        _meta: {
          items: [],
          tags,
          logic,
          category: category || 'all',
        },
      };
    }
  }

  // Format results
  const formattedItems = filteredItems.map((item: ContentPaginatedItem) => {
    const itemTags = item.tags || [];
    const matchingTags = itemTags.filter((tag: string) => tags.includes(tag));

    return {
      slug: item.slug || '',
      title: item.title || item.display_title || '',
      category: item.category || '',
      description: item.description?.substring(0, 150) || '',
      tags: itemTags,
      matchingTags,
      author: item.author || 'Unknown',
      dateAdded: item.date_added || '',
    };
  });

  // Create text summary
  const logicDesc = logic === 'AND' ? 'ALL' : 'ANY';
  const categoryDesc = category ? ` in ${category}` : '';
  const textSummary = formattedItems
    .map(
      (
        item: { title: string; category: string; description: string; matchingTags: string[] },
        idx: number
      ) =>
        `${idx + 1}. ${item.title} (${item.category})\n   ${item.description}${item.description.length >= 150 ? '...' : ''}\n   Matching tags: ${item.matchingTags.join(', ')}`
    )
    .join('\n\n');

  return {
    content: [
      {
        type: 'text' as const,
        text: `Content with ${logicDesc} of tags: ${tags.join(', ')}${categoryDesc}\n\nFound ${formattedItems.length} items:\n\n${textSummary}`,
      },
    ],
    _meta: {
      items: formattedItems,
      tags,
      logic,
      category: category || 'all',
      count: formattedItems.length,
    },
  };
}
