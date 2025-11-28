/**
 * getTrending Tool Handler
 *
 * Get trending content across categories or within a specific category.
 * Uses TrendingService.getTrendingContent for consistent behavior with web app.
 */

import { TrendingService } from '@heyclaude/data-layer';
import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GetTrendingInput } from '../lib/types.ts';

/**
 * Fetches trending content (optionally filtered by category) and returns a formatted text summary plus metadata.
 *
 * @param input - Query options; may include `category` to filter results and `limit` to bound the number of items returned
 * @returns An object with:
 *   - `content`: an array with a single text item summarizing the trending results or a no-content message,
 *   - `_meta.items`: an array of formatted items (`slug`, `title`, `category`, `description` trimmed to 150 characters, `tags`, `author`, `views`, `dateAdded`),
 *   - `_meta.category`: the requested category or `'all'`,
 *   - `_meta.count` (when items exist): the number of returned items
 */
export async function handleGetTrending(
  supabase: SupabaseClient<Database>,
  input: GetTrendingInput
) {
  const { category, limit } = input;

  // Use TrendingService for consistent behavior with web app
  const trendingService = new TrendingService(supabase);
  const data = await trendingService.getTrendingContent({
    ...(category ? { p_category: category } : {}),
    p_limit: limit,
  });

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
        count: 0,
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