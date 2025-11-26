/**
 * getPopular Tool Handler
 * Uses TrendingService.getPopularContent for consistent behavior with web app
 */

import { TrendingService } from '@heyclaude/data-layer';
import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GetPopularInput } from '../lib/types.ts';

type PopularContentItem = Database['public']['Functions']['get_popular_content']['Returns'][number];

export async function handleGetPopular(supabase: SupabaseClient<Database>, input: GetPopularInput) {
  const { category, limit } = input;

  // Use TrendingService for consistent behavior with web app
  const trendingService = new TrendingService(supabase);

  const data = await trendingService.getPopularContent({
    ...(category ? { p_category: category } : {}),
    p_limit: limit,
  });

  if (!data || data.length === 0) {
    const categoryDesc = category ? ` in ${category}` : '';
    return {
      content: [
        {
          type: 'text' as const,
          text: `No popular content found${categoryDesc}.`,
        },
      ],
      _meta: {
        items: [],
        category: category || 'all',
      },
    };
  }

  // Format results
  const items = data.map((item: PopularContentItem) => {
    const originalDescription = item.description || '';
    const truncatedDescription = originalDescription.substring(0, 150);
    const wasTruncated = originalDescription.length > 150;
    return {
      slug: item.slug,
      title: item.title,
      category: item.category,
      description: truncatedDescription,
      wasTruncated,
      tags: item.tags || [],
      author: item.author || 'Unknown',
      dateAdded: (item as unknown as { date_added?: string }).date_added || '',
      stats: {
        views: item.view_count || 0,
        bookmarks: (item as unknown as { bookmark_count?: number }).bookmark_count || 0,
        upvotes: 0,
      },
    };
  });

  // Create text summary
  const categoryDesc = category ? ` in ${category}` : ' across all categories';
  const textSummary = items
    .map(
      (
        item: {
          title: string;
          category: string;
          description: string;
          wasTruncated: boolean;
          stats: { views: number; bookmarks: number };
        },
        idx: number
      ) =>
        `${idx + 1}. ${item.title} (${item.category}) 👀 ${item.stats.views} views\n   ${item.description}${item.wasTruncated ? '...' : ''}\n   ${item.stats.bookmarks} bookmarks`
    )
    .join('\n\n');

  return {
    content: [
      {
        type: 'text' as const,
        text: `Popular Content${categoryDesc}:\n\n${textSummary}`,
      },
    ],
    _meta: {
      items,
      category: category || 'all',
      count: items.length,
    },
  };
}
