/**
 * getTrending Tool Handler
 *
 * Get trending content across categories or within a specific category.
 * Uses TrendingService for consistent behavior with web app.
 */

import { TrendingService } from '@heyclaude/data-layer';

import type { GetTrendingInput } from '../../lib/types.js';
import { normalizeError } from '@heyclaude/shared-runtime';
import type { ToolContext } from '../../types/runtime.js';

/**
 * Get trending content (optionally filtered by category).
 *
 * @param input - Query options with optional category and limit
 * @param context - Tool handler context
 * @returns Trending content with text summary and metadata
 */
export async function handleGetTrending(
  input: GetTrendingInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    items: Array<{
      slug: string;
      title: string;
      category: string;
      description: string;
      tags: string[];
      author: string;
      views: number;
      dateAdded: Date | null;
    }>;
    category: string;
    count: number;
    limit: number;
  };
}> {
  const { prisma, logger } = context;
  const { category, limit } = input;
  const startTime = Date.now();

  try {
    const trendingService = new TrendingService(prisma);
    const data = await trendingService.getTrendingContent({
      ...(category ? { p_category: category } : {}),
      p_limit: limit,
    });

    if (!data || data.length === 0) {
      const categoryMsg = category ? ` in ${category}` : '';
      const duration = Date.now() - startTime;
      logger.info('getTrending completed with no results', {
        tool: 'getTrending',
        duration_ms: duration,
        category,
        resultCount: 0,
      });

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
          limit,
        },
      };
    }

    // Format the results
    const items = data.map((item) => ({
      slug: item.slug,
      title: (item.title || item.display_title || 'Untitled') as string,
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

    const duration = Date.now() - startTime;
    logger.info('getTrending completed successfully', {
      tool: 'getTrending',
      duration_ms: duration,
      category,
      resultCount: items.length,
    });

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
        limit,
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getTrending tool failed');
    logger.error('getTrending tool error', normalized, { tool: 'getTrending', category });
    throw normalized;
  }
}
