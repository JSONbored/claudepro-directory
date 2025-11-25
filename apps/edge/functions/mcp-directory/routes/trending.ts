/**
 * getTrending Tool Handler
 *
 * Get trending content across categories or within a specific category.
 * Uses the get_trending_content RPC.
 */

import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GetTrendingInput } from '../lib/types.ts';

export async function handleGetTrending(
  supabase: SupabaseClient<Database>,
  input: GetTrendingInput
) {
  const { category, limit } = input;

  // Call the RPC to get trending content
  const { data, error } = await supabase.rpc('get_trending_content', {
    ...(category ? { p_category: category } : {}),
    p_limit: limit,
  });

  if (error) {
    throw new Error(`Failed to fetch trending content: ${error.message}`);
  }

  if (!data || data.length === 0) {
    const categoryMsg = category ? ` in ${category}` : '';
    return {
      content: [
        {
          type: 'text' as const,
          text: `No trending content found${categoryMsg}.`,
        },
      ],
      _meta: {
        items: [],
        category: category || 'all',
      },
    };
  }

  // Format the results
  const items = data.map((item) => ({
    slug: item.slug,
    title: item.title || item.display_title,
    category: item.category,
    description: item.description?.substring(0, 150) || '',
    tags: item.tags || [],
    author: item.author || 'Unknown',
    views: item.view_count || 0,
    dateAdded: item.date_added,
  }));

  // Create text summary
  const categoryDesc = category ? ` in ${category}` : ' across all categories';
  const textSummary = items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.title} (${item.category})\n   ${item.description}${item.description.length >= 150 ? '...' : ''}\n   Views: ${item.views} | Tags: ${item.tags.slice(0, 3).join(', ')}`
    )
    .join('\n\n');

  return {
    content: [
      {
        type: 'text' as const,
        text: `Trending Content${categoryDesc}:\n\n${textSummary}`,
      },
    ],
    _meta: {
      items,
      category: category || 'all',
      count: items.length,
    },
  };
}
