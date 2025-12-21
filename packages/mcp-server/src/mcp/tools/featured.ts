/**
 * getFeatured Tool Handler
 *
 * Get featured and highlighted content from the homepage.
 * Includes hero items, latest additions, and popular content.
 */

import { ContentService, TrendingService } from '@heyclaude/data-layer';
import type { content_category } from '@prisma/client';

import type { GetFeaturedInput } from '../../lib/types.js';
import { normalizeError } from '@heyclaude/shared-runtime';
import type { ToolContext } from '../../types/runtime.js';

/**
 * Get featured and highlighted content from the homepage.
 *
 * @param input - Optional limit parameter
 * @param context - Tool handler context
 * @returns Featured content with text summary and metadata
 */
export async function handleGetFeatured(
  input: GetFeaturedInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    hero: Array<{
      slug: string;
      title: string;
      category: string;
      description: string;
      tags: string[];
      author: string;
      views: number;
      dateAdded: Date | null;
    }>;
    latest: Array<{
      slug: string;
      title: string;
      category: string;
      description: string;
      tags: string[];
      author: string;
      views: number;
      dateAdded: Date | null;
    }>;
    popular: Array<{
      slug: string;
      title: string;
      category: string;
      description: string;
      tags: string[];
      author: string;
      views: number;
      dateAdded: Date | null;
    }>;
    total: number;
  };
}> {
  const { prisma, logger } = context;
  const { limit = 6 } = input;
  const startTime = Date.now();

  try {
    const contentService = new ContentService(prisma);
    const trendingService = new TrendingService(prisma);

    // Define categories to fetch featured content from
    const allowedCategories: content_category[] = [
      'agents',
      'rules',
      'commands',
      'skills',
      'collections',
      'mcp',
    ];

    // Fetch featured content in parallel using getContentPaginatedSlim
    // This matches the original implementation's approach
    const categoryQueries = allowedCategories.map((category) =>
      contentService.getContentPaginatedSlim({
        p_category: category,
        p_limit: limit,
        p_offset: 0,
        p_order_by: 'popularity_score',
        p_order_direction: 'desc',
      })
    );

    const [categoryResults, latestData, popularData] = await Promise.allSettled([
      // Featured content by category (parallel queries)
      Promise.allSettled(categoryQueries),
      // Latest additions
      trendingService.getRecentContent({ p_limit: limit, p_days: 30 }),
      // Popular content
      trendingService.getTrendingContent({ p_limit: limit }),
    ]);

    // Extract category results (handle failures gracefully)
    const featuredByCategory: Record<string, unknown[]> = {};
    if (categoryResults.status === 'fulfilled') {
      const results = categoryResults.value;
      for (const [index, result] of results.entries()) {
        const category = allowedCategories[index];
        if (result.status === 'fulfilled' && result.value?.items && category) {
          featuredByCategory[category] = result.value.items;
        }
      }
    }

    // Extract latest and popular results
    const latest =
      latestData.status === 'fulfilled' && latestData.value ? latestData.value : [];
    const popular =
      popularData.status === 'fulfilled' && popularData.value ? popularData.value : [];

    // Format results
    const formatItem = (item: any) => ({
      slug: item.slug,
      title: item.title || item.display_title,
      category: item.category,
      description: (item.description || '').substring(0, 150),
      tags: item.tags || [],
      author: item.author || 'Unknown',
      views: item.view_count || 0,
      dateAdded: item.date_added,
    });

    // Flatten featured by category into a single array (take top 3 per category)
    const formattedHero = Object.values(featuredByCategory)
      .flat()
      .slice(0, limit)
      .map(formatItem);
    const formattedLatest = latest.map(formatItem);
    const formattedPopular = popular.map(formatItem);

    // Create text summary
    const sections: string[] = [];

    if (formattedHero.length > 0) {
      sections.push(
        `## Featured Content\n\n${formattedHero
          .map(
            (item, idx) =>
              `${idx + 1}. ${item.title} (${item.category})\n   ${item.description}${item.description.length >= 150 ? '...' : ''}\n   Views: ${item.views}`
          )
          .join('\n\n')}`
      );
    }

    if (formattedLatest.length > 0) {
      sections.push(
        `## Latest Additions\n\n${formattedLatest
          .map(
            (item, idx) =>
              `${idx + 1}. ${item.title} (${item.category})\n   ${item.description}${item.description.length >= 150 ? '...' : ''}\n   Added: ${item.dateAdded ? new Date(item.dateAdded).toLocaleDateString() : 'Unknown'}`
          )
          .join('\n\n')}`
      );
    }

    if (formattedPopular.length > 0) {
      sections.push(
        `## Popular Content\n\n${formattedPopular
          .map(
            (item, idx) =>
              `${idx + 1}. ${item.title} (${item.category})\n   ${item.description}${item.description.length >= 150 ? '...' : ''}\n   Views: ${item.views}`
          )
          .join('\n\n')}`
      );
    }

    const textSummary =
      sections.length > 0
        ? `Featured Content from HeyClaude Directory:\n\n${sections.join('\n\n')}`
        : 'No featured content available at this time.';

    const total = formattedHero.length + formattedLatest.length + formattedPopular.length;

    const duration = Date.now() - startTime;
    logger.info('getFeatured completed successfully', {tool: 'getFeatured', duration_ms: duration, heroCount: formattedHero.length, latestCount: formattedLatest.length, popularCount: formattedPopular.length, total,});

    return {
      content: [
        {
          type: 'text' as const,
          text: textSummary,
        },
      ],
      _meta: {
        hero: formattedHero,
        latest: formattedLatest,
        popular: formattedPopular,
        total,
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getFeatured tool failed');
    logger.error('getFeatured tool error', normalized, { tool: 'getFeatured' });
    throw normalized;
  }
}
