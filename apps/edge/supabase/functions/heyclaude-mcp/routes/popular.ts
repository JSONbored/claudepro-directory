/**
 * getPopular Tool Handler
 * Uses TrendingService.getPopularContent for consistent behavior with web app
 */

import { TrendingService } from '@heyclaude/data-layer/services/trending.ts';
import type { GetPopularContentReturns } from '@heyclaude/database-types/postgres-types';
import type { GetPopularInput } from '../lib/types.ts';

type PopularContentItem = GetPopularContentReturns[number];

/**
 * Retrieve and format popular content, optionally filtered by category, into a textual summary and metadata.
 *
 * @param input - Query options: `category` to filter results and `limit` to cap the number of items returned.
 * @returns An object with:
 *   - `content`: a single text item containing a human-readable summary (or a "no popular content found" message when empty).
 *   - `_meta`: metadata including `items` (the formatted list with slug, title, category, truncated description, tags, author, dateAdded, and stats), `category` (the requested category or `'all'`), and `count` (number of items, present when results exist).
 */
export async function handleGetPopular(input: GetPopularInput) {
  const { category, limit } = input;

  // Use TrendingService for consistent behavior with web app (Prisma-based, no Supabase client needed)
  const trendingService = new TrendingService();

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
        count: 0,
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
      dateAdded: item.date_added || '',
      stats: {
        views: item.view_count || 0,
        bookmarks: item.bookmark_count || 0,
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
      limit,
      pagination: {
        total: items.length,
        limit,
        hasMore: false, // Popular doesn't support pagination
      },
    },
  };
}