/**
 * getPopular Tool Handler
 *
 * Get popular content (optionally filtered by category).
 * Uses TrendingService for consistent behavior with web app.
 */

import { TrendingService } from '@heyclaude/data-layer';

import type { GetPopularInput } from '../../lib/types';
import { normalizeError } from '@heyclaude/cloudflare-runtime/utils/errors';
import type { ToolContext } from './categories';

/**
 * Get popular content (optionally filtered by category).
 *
 * @param input - Query options with optional category and limit
 * @param context - Tool handler context
 * @returns Popular content with text summary and metadata
 */
export async function handleGetPopular(
  input: GetPopularInput,
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
      dateAdded: string | null;
      stats: {
        views: number;
        bookmarks: number;
        upvotes: number;
      };
    }>;
    category: string;
    count: number;
    limit: number;
    pagination: {
      total: number;
      limit: number;
      hasMore: boolean;
    };
  };
}> {
  const { prisma, logger } = context;
  const { category, limit } = input;
  const startTime = Date.now();

  try {
    const trendingService = new TrendingService(prisma);
    const data = await trendingService.getPopularContent({
      ...(category ? { p_category: category } : {}),
      p_limit: limit,
    });

    if (!data || data.length === 0) {
      const categoryDesc = category ? ` in ${category}` : '';
      const duration = Date.now() - startTime;
      logger.info(
        {
          tool: 'getPopular',
          duration_ms: duration,
          category,
          resultCount: 0,
        },
        'getPopular completed with no results'
      );

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
          limit,
          pagination: {
            total: 0,
            limit,
            hasMore: false,
          },
        },
      };
    }

    // Format results
    const items = data.map((item) => {
      const originalDescription = item.description || '';
      const truncatedDescription = originalDescription.substring(0, 150);
      const wasTruncated = originalDescription.length > 150;

      return {
        slug: item.slug || '',
        title: item.title || 'Untitled',
        category: item.category || 'all',
        description: truncatedDescription,
        wasTruncated,
        tags: item.tags || [],
        author: item.author || 'Unknown',
        dateAdded: item.date_added || null,
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
        (item, idx) =>
          `${idx + 1}. ${item.title} (${item.category}) 👀 ${item.stats.views} views\n   ${item.description}${item.wasTruncated ? '...' : ''}\n   ${item.stats.bookmarks} bookmarks`
      )
      .join('\n\n');

    const duration = Date.now() - startTime;
    logger.info(
      {
        tool: 'getPopular',
        duration_ms: duration,
        category,
        resultCount: items.length,
      },
      'getPopular completed successfully'
    );

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
          hasMore: false,
        },
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getPopular tool failed');
    logger.error({ error: normalized, tool: 'getPopular', category }, 'getPopular tool error');
    throw normalized;
  }
}
