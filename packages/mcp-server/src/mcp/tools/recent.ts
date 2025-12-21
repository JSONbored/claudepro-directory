/**
 * getRecent Tool Handler
 *
 * Get recent content (optionally filtered by category).
 * Uses TrendingService for consistent behavior with web app.
 */

import { TrendingService } from '@heyclaude/data-layer';

import type { GetRecentInput } from '../../lib/types.js';
import { normalizeError } from '@heyclaude/shared-runtime';
import type { ToolContext } from '../../types/runtime.js';

/**
 * Get recent content (optionally filtered by category).
 *
 * @param input - Query options with optional category and limit
 * @param context - Tool handler context
 * @returns Recent content with text summary and metadata
 */
export async function handleGetRecent(
  input: GetRecentInput,
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
      dateAdded: Date | null;
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
    const data = await trendingService.getRecentContent({
      ...(category ? { p_category: category } : {}),
      p_limit: limit,
      p_days: 30,
    });

    if (!data || data.length === 0) {
      const categoryDesc = category ? ` in ${category}` : '';
      const duration = Date.now() - startTime;
      logger.info('getRecent completed with no results', {
        tool: 'getRecent',
        duration_ms: duration,
        category,
        resultCount: 0,
      });

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
    const items = data.map((item) => ({
      slug: item.slug,
      title: item.title || item.display_title || '',
      category: item.category,
      description: (item.description || '').substring(0, 150),
      tags: item.tags || [],
      author: item.author || 'Unknown',
      dateAdded: item.date_added,
    }));

    // Create text summary with relative dates
    const categoryDesc = category ? ` in ${category}` : ' across all categories';
    const now = new Date();
    const textSummary = items
      .map((item, idx) => {
        const date = item.dateAdded ? new Date(item.dateAdded) : null;
        let timeDesc: string;

        if (!date) {
          timeDesc = 'Unknown date';
        } else {
          const diffMs = now.getTime() - date.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

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
        }

        return `${idx + 1}. ${item.title} (${item.category}) - ${timeDesc}\n   ${item.description}${item.description.length >= 150 ? '...' : ''}\n   Tags: ${item.tags.slice(0, 5).join(', ')}`;
      })
      .join('\n\n');

    const duration = Date.now() - startTime;
    logger.info('getRecent completed successfully', {
      tool: 'getRecent',
      duration_ms: duration,
      category,
      resultCount: items.length,
    });

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
        limit,
        pagination: {
          total: items.length,
          limit,
          hasMore: false,
        },
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getRecent tool failed');
    logger.error('getRecent tool error', normalized, { tool: 'getRecent', category });
    throw normalized;
  }
}
