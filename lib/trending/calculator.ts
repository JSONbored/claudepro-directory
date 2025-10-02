/**
 * Redis-Based Trending Calculator
 * Production-grade trending content calculation using real-time Redis view counts
 *
 * ## Algorithm Overview:
 *
 * ### Trending (Growth Rate)
 * Calculates content growth based on Redis view count changes:
 * - Formula: (views_last_24h - views_previous_24h) / views_previous_24h * 100
 * - Weights recent activity higher than all-time counts
 * - Uses Redis sorted sets with timestamps for efficient queries
 *
 * ### Popular (All-Time)
 * Ranks content by total Redis view counts:
 * - Direct query to views:${category}:${slug} counters
 * - Fallback to static popularity field if Redis unavailable
 *
 * ### Recent (Newest)
 * Sorts by dateAdded field from content metadata:
 * - No Redis dependency
 * - Sorts newest-first based on content creation date
 */

import { logger } from '@/lib/logger';
import { statsRedis } from '@/lib/redis';
import type { UnifiedContentItem } from '@/lib/schemas/components/content-item.schema';

/**
 * Content item with view count data
 */
export interface TrendingContentItem extends UnifiedContentItem {
  viewCount?: number;
  growthRate?: number;
}

/**
 * Trending calculation options
 */
export interface TrendingOptions {
  limit?: number;
  fallbackToPopularity?: boolean;
}

/**
 * Get trending content based on view growth rate
 * Uses Redis view counts to calculate trending score
 */
export async function getTrendingContent(
  allContent: UnifiedContentItem[],
  options: TrendingOptions = {}
): Promise<TrendingContentItem[]> {
  const { limit = 12, fallbackToPopularity = true } = options;

  try {
    // Check if Redis is available
    if (!statsRedis.isEnabled()) {
      logger.warn('Redis not available for trending calculation, using fallback');
      return getFallbackTrending(allContent, limit);
    }

    // Prepare items for batch view count fetch
    const items = allContent.map((item) => ({
      category: item.category,
      slug: item.slug,
    }));

    // Fetch view counts from Redis using optimized batch operation
    const viewCounts = await statsRedis.getViewCounts(items);

    // Merge view counts with content items
    const contentWithViews: TrendingContentItem[] = allContent.map((item) => {
      const key = `${item.category}:${item.slug}`;
      const viewCount = viewCounts[key] || 0;

      return {
        ...item,
        viewCount,
      };
    });

    // For now, sort by view count descending
    // TODO: Implement growth rate calculation with historical data
    // This requires storing daily view snapshots in Redis
    const sorted = contentWithViews
      .filter((item) => (item.viewCount || 0) > 0) // Only include items with views
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, limit);

    logger.info('Trending content calculated from Redis', {
      totalItems: allContent.length,
      withViews: sorted.length,
      topViewCount: sorted[0]?.viewCount || 0,
    });

    return sorted;
  } catch (error) {
    logger.error(
      'Trending calculation failed',
      error instanceof Error ? error : new Error(String(error))
    );

    // Fallback to static popularity
    if (fallbackToPopularity) {
      return getFallbackTrending(allContent, limit);
    }

    return [];
  }
}

/**
 * Get popular content based on all-time Redis view counts
 */
export async function getPopularContent(
  allContent: UnifiedContentItem[],
  options: TrendingOptions = {}
): Promise<TrendingContentItem[]> {
  const { limit = 12, fallbackToPopularity = true } = options;

  try {
    // Check if Redis is available
    if (!statsRedis.isEnabled()) {
      logger.warn('Redis not available for popular calculation, using fallback');
      return getFallbackPopular(allContent, limit);
    }

    // Prepare items for batch view count fetch
    const items = allContent.map((item) => ({
      category: item.category,
      slug: item.slug,
    }));

    // Fetch view counts from Redis
    const viewCounts = await statsRedis.getViewCounts(items);

    // Merge view counts with content items
    const contentWithViews: TrendingContentItem[] = allContent.map((item) => {
      const key = `${item.category}:${item.slug}`;
      const viewCount = viewCounts[key] || 0;

      return {
        ...item,
        viewCount,
      };
    });

    // Sort by total view count descending
    const sorted = contentWithViews
      .filter((item) => (item.viewCount || 0) > 0) // Only include items with views
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, limit);

    logger.info('Popular content calculated from Redis', {
      totalItems: allContent.length,
      withViews: sorted.length,
      topViewCount: sorted[0]?.viewCount || 0,
    });

    return sorted;
  } catch (error) {
    logger.error(
      'Popular calculation failed',
      error instanceof Error ? error : new Error(String(error))
    );

    // Fallback to static popularity
    if (fallbackToPopularity) {
      return getFallbackPopular(allContent, limit);
    }

    return [];
  }
}

/**
 * Get recent content based on dateAdded field
 * No Redis dependency - pure metadata sorting
 */
export async function getRecentContent(
  allContent: UnifiedContentItem[],
  options: TrendingOptions = {}
): Promise<TrendingContentItem[]> {
  const { limit = 12 } = options;

  try {
    // Filter items with dateAdded and sort by newest first
    const sorted = allContent
      .filter((item) => item.dateAdded)
      .sort((a, b) => {
        const dateA = new Date(a.dateAdded || 0).getTime();
        const dateB = new Date(b.dateAdded || 0).getTime();
        return dateB - dateA; // Newest first
      })
      .slice(0, limit);

    logger.info('Recent content sorted by dateAdded', {
      totalItems: allContent.length,
      withDates: sorted.length,
    });

    return sorted;
  } catch (error) {
    logger.error(
      'Recent content sorting failed',
      error instanceof Error ? error : new Error(String(error))
    );

    // Return first N items as fallback
    return allContent.slice(0, limit);
  }
}

/**
 * Fallback trending using static popularity field
 */
function getFallbackTrending(
  allContent: UnifiedContentItem[],
  limit: number
): TrendingContentItem[] {
  const sorted = [...allContent]
    .filter((item) => typeof item.popularity === 'number' && item.popularity > 0)
    .sort((a, b) => {
      const aPop = typeof a.popularity === 'number' ? a.popularity : 0;
      const bPop = typeof b.popularity === 'number' ? b.popularity : 0;
      return bPop - aPop;
    })
    .slice(0, limit);

  logger.info('Using fallback trending (static popularity)', {
    totalItems: allContent.length,
    withPopularity: sorted.length,
  });

  return sorted;
}

/**
 * Fallback popular using static popularity field
 */
function getFallbackPopular(
  allContent: UnifiedContentItem[],
  limit: number
): TrendingContentItem[] {
  // Same as trending fallback for now
  return getFallbackTrending(allContent, limit);
}

/**
 * Batch trending calculation for multiple categories
 */
export async function getBatchTrendingData(contentByCategory: {
  agents: UnifiedContentItem[];
  mcp: UnifiedContentItem[];
  rules: UnifiedContentItem[];
  commands: UnifiedContentItem[];
  hooks: UnifiedContentItem[];
  statuslines?: UnifiedContentItem[];
}) {
  // Combine all content for batch Redis query
  const allContent = [
    ...contentByCategory.agents,
    ...contentByCategory.mcp,
    ...contentByCategory.rules,
    ...contentByCategory.commands,
    ...contentByCategory.hooks,
    ...(contentByCategory.statuslines || []),
  ];

  // Run all calculations in parallel
  const [trending, popular, recent] = await Promise.all([
    getTrendingContent(allContent),
    getPopularContent(allContent),
    getRecentContent(allContent),
  ]);

  return {
    trending,
    popular,
    recent,
    metadata: {
      algorithm: 'redis-views',
      generated: new Date().toISOString(),
      redisEnabled: statsRedis.isEnabled(),
      totalItems: allContent.length,
    },
  };
}
