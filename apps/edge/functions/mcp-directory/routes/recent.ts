/**
 * getRecent Tool Handler
 * Uses TrendingService.getRecentContent for consistent behavior with web app
 */

import { TrendingService } from '@heyclaude/data-layer';
import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GetRecentInput } from '../lib/types.ts';

type RecentContentItem = Database['public']['Functions']['get_recent_content']['Returns'][number];

export async function handleGetRecent(supabase: SupabaseClient<Database>, input: GetRecentInput) {
  const { category, limit } = input;

  // Use TrendingService for consistent behavior with web app
  const trendingService = new TrendingService(supabase);

  const data = await trendingService.getRecentContent({
    ...(category ? { p_category: category } : {}),
    p_limit: limit,
    p_days: 30,
  });

  if (!data || data.length === 0) {
    const categoryDesc = category ? ` in ${category}` : '';
    return {
      content: [
        {
          type: 'text' as const,
          text: `No recent content found${categoryDesc}.`,
        },
      ],
      _meta: {
        items: [],
        category: category || 'all',
      },
    };
  }

  // Format results
  const items = data.map((item: RecentContentItem) => ({
    slug: item.slug,
    title: item.title || item.display_title || '',
    category: item.category,
    description: item.description?.substring(0, 150) || '',
    tags: item.tags || [],
    author: item.author || 'Unknown',
    dateAdded: item.date_added,
  }));

  // Create text summary with relative dates
  const categoryDesc = category ? ` in ${category}` : ' across all categories';
  const now = new Date();
  const textSummary = items
    .map(
      (
        item: {
          title: string;
          category: string;
          description: string;
          tags: string[];
          dateAdded: string;
        },
        idx: number
      ) => {
        const date = new Date(item.dateAdded);
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let timeDesc: string;
        if (diffDays === 0) {
          timeDesc = 'Today';
        } else if (diffDays === 1) {
          timeDesc = 'Yesterday';
        } else if (diffDays < 7) {
          timeDesc = `${diffDays} days ago`;
        } else if (diffDays < 30) {
          const weeks = Math.floor(diffDays / 7);
          timeDesc = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
        } else {
          const months = Math.floor(diffDays / 30);
          timeDesc = `${months} ${months === 1 ? 'month' : 'months'} ago`;
        }

        return `${idx + 1}. ${item.title} (${item.category}) - ${timeDesc}\n   ${item.description}${item.description.length >= 150 ? '...' : ''}\n   Tags: ${item.tags.slice(0, 5).join(', ')}`;
      }
    )
    .join('\n\n');

  return {
    content: [
      {
        type: 'text' as const,
        text: `Recently Added Content${categoryDesc}:\n\n${textSummary}`,
      },
    ],
    _meta: {
      items,
      category: category || 'all',
      count: items.length,
    },
  };
}
