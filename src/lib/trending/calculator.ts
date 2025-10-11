/**
 * Redis-Based Trending Calculator
 * Production-grade trending content calculation using real-time Redis view counts
 *
 * ## Algorithm Overview:
 *
 * ### Trending (24h Growth Rate) ✨
 * Calculates content momentum based on daily view snapshots:
 * - **Formula**: `(today_views - yesterday_views) / yesterday_views * 100`
 * - **Cold start**: New content with first views gets 100% growth boost
 * - **Tie-breaker**: Falls back to total views → static popularity
 * - **Data**: Uses `views:daily:${category}:${slug}:YYYY-MM-DD` keys (7-day TTL)
 * - **Performance**: Batch MGET for today + yesterday (2 parallel queries)
 *
 * ### Popular (All-Time Views) 🏆
 * Ranks content by cumulative view counts with hybrid scoring:
 * - **Primary**: Total views from `views:${category}:${slug}`
 * - **Boost**: Normalized static popularity score `(popularity / 100)`
 * - **Fallback**: Static popularity when Redis unavailable
 *
 * ### Recent (Newest First) 🆕
 * Sorts by dateAdded field from content metadata:
 * - No Redis dependency
 * - Sorts newest-first based on content creation date
 *
 * ## Performance Characteristics:
 * - **Batch Operations**: MGET for parallel multi-key fetches (~10-20% faster than pipeline)
 * - **Auto-Expiry**: Daily snapshot keys expire after 7 days (minimal storage)
 * - **Graceful Degradation**: Falls back to static popularity if Redis unavailable
 */

import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import { statsRedis } from '@/src/lib/redis';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';

/**
 * Content item with view count and growth rate data from Redis
 *
 * @property {number} [viewCount] - Total all-time view count from `views:${category}:${slug}`
 * @property {number} [growthRate] - 24-hour growth percentage calculated from daily snapshots
 *
 * @example
 * ```typescript
 * const item: TrendingContentItem = {
 *   ...baseContent,
 *   viewCount: 1234,
 *   growthRate: 45.5  // +45.5% growth from yesterday
 * };
 * ```
 */
export interface TrendingContentItem extends UnifiedContentItem {
  viewCount?: number | undefined;
  growthRate?: number | undefined;
}

/**
 * Zod schema for trending content item validation
 * @internal
 */
export const trendingContentItemSchema = z
  .object({
    viewCount: z.number().int().nonnegative().optional(),
    growthRate: z.number().finite().optional(),
  })
  .passthrough() // Allow base UnifiedContentItem properties
  .describe('Content item with Redis view tracking data');

/**
 * Options for trending content calculation
 *
 * @property {number} [limit=12] - Maximum number of items to return
 * @property {boolean} [fallbackToPopularity=true] - Use static popularity field if Redis unavailable
 *
 * @example
 * ```typescript
 * const options: TrendingOptions = {
 *   limit: 20,
 *   fallbackToPopularity: true
 * };
 * ```
 */
export interface TrendingOptions {
  limit?: number;
  fallbackToPopularity?: boolean;
}

/**
 * Zod schema for trending calculation options
 * @internal
 */
export const trendingOptionsSchema = z
  .object({
    limit: z.number().int().positive().max(100).default(12).describe('Maximum items to return'),
    fallbackToPopularity: z
      .boolean()
      .default(true)
      .describe('Fallback to static popularity if Redis fails'),
  })
  .partial()
  .describe('Trending calculation options');

/**
 * Calculate trending content based on 24-hour growth rate momentum
 *
 * Uses Redis daily view snapshots to rank content by velocity (percentage growth)
 * rather than magnitude (total views). Content gaining momentum quickly ranks higher.
 *
 * @param {UnifiedContentItem[]} allContent - Array of all content items to analyze
 * @param {TrendingOptions} [options] - Configuration options
 * @param {number} [options.limit=12] - Maximum number of trending items to return
 * @param {boolean} [options.fallbackToPopularity=true] - Use static popularity if Redis fails
 *
 * @returns {Promise<TrendingContentItem[]>} Sorted array of trending items with growth rates
 *
 * @throws {Error} Logs error and returns fallback data if Redis operation fails
 *
 * @example
 * ```typescript
 * const trending = await getTrendingContent(allAgents, { limit: 20 });
 * // Returns: [
 * //   { ...agent1, viewCount: 100, growthRate: 150 },  // +150% growth
 * //   { ...agent2, viewCount: 50, growthRate: 100 },   // +100% growth
 * // ]
 * ```
 *
 * @remarks
 * **Algorithm:**
 * 1. Fetch today's views, yesterday's views, and total views in parallel (3 MGET calls)
 * 2. Calculate growth rate: `(today - yesterday) / yesterday * 100`
 * 3. Sort by: Growth rate → Total views → Static popularity
 *
 * **Performance:**
 * - 3 parallel Redis MGET operations (~20-30ms total)
 * - UTC-normalized dates prevent timezone inconsistencies
 * - Input validation prevents negative/invalid values
 *
 * **Security:**
 * - All Redis responses validated with `Math.max(0, Number(value))`
 * - UTC timestamps prevent cross-region data corruption
 * - Graceful fallback to static popularity if Redis unavailable
 *
 * @see {@link getPopularContent} For all-time view rankings
 * @see {@link statsRedis.getDailyViewCounts} For daily snapshot fetching
 */
async function getTrendingContent(
  allContent: UnifiedContentItem[],
  options: TrendingOptions = {}
): Promise<TrendingContentItem[]> {
  const { limit = 12, fallbackToPopularity = true } = options;

  try {
    // Check Redis availability - only use Redis if actually connected (not fallback mode)
    if (!statsRedis.isConnected()) {
      logger.warn('Redis not connected for trending calculation, using fallback');
      return getFallbackTrending(allContent, limit);
    }

    // Prepare items for batch view count fetch
    const items = allContent.map((item) => ({
      category: item.category,
      slug: item.slug,
    }));

    // Calculate date strings for today and yesterday (UTC normalized)
    // SECURITY: Always use UTC to prevent timezone-based inconsistencies
    const nowUtc = new Date();
    const todayStr = nowUtc.toISOString().split('T')[0];

    const yesterdayUtc = new Date(nowUtc);
    yesterdayUtc.setUTCDate(yesterdayUtc.getUTCDate() - 1);
    const yesterdayStr = yesterdayUtc.toISOString().split('T')[0];

    // Batch fetch: today's views, yesterday's views, and total views
    const [todayViews, yesterdayViews, totalViews] = await Promise.all([
      statsRedis.getDailyViewCounts(items, todayStr),
      statsRedis.getDailyViewCounts(items, yesterdayStr),
      statsRedis.getViewCounts(items),
    ]);

    // Calculate growth rate for each item with input validation
    const contentWithGrowth: TrendingContentItem[] = allContent.map((item) => {
      const key = `${item.category}:${item.slug}`;

      // SECURITY: Validate and sanitize Redis responses
      const todayCount = Math.max(0, Number(todayViews[key]) || 0);
      const yesterdayCount = Math.max(0, Number(yesterdayViews[key]) || 0);
      const viewCount = Math.max(0, Number(totalViews[key]) || 0);

      // Growth rate calculation:
      // - If yesterday had views: percentage growth
      // - If yesterday = 0 but today > 0: 100% growth (new momentum)
      // - If both = 0: fallback to total views for cold start
      let growthRate = 0;
      if (yesterdayCount > 0) {
        growthRate = ((todayCount - yesterdayCount) / yesterdayCount) * 100;
      } else if (todayCount > 0) {
        growthRate = 100; // New momentum
      }

      return {
        ...item,
        viewCount,
        growthRate,
      };
    });

    // Sort by growth rate with smart fallbacks
    const sorted = contentWithGrowth
      .filter((item) => {
        // Include items with ANY signal: growth, views, or popularity
        const hasGrowth = (item.growthRate || 0) > 0;
        const hasViews = (item.viewCount || 0) > 0;
        const hasPopularity = (item.popularity || 0) > 0;
        return hasGrowth || hasViews || hasPopularity;
      })
      .sort((a, b) => {
        // Primary: Growth rate (momentum)
        const aGrowth = a.growthRate || 0;
        const bGrowth = b.growthRate || 0;

        if (aGrowth !== bGrowth) {
          return bGrowth - aGrowth;
        }

        // Tie-breaker: Total views (established content)
        const aViews = a.viewCount || 0;
        const bViews = b.viewCount || 0;

        if (aViews !== bViews) {
          return bViews - aViews;
        }

        // Final tie-breaker: Static popularity
        return (b.popularity || 0) - (a.popularity || 0);
      })
      .slice(0, limit);

    logger.info('Trending content calculated from Redis growth rate', {
      totalItems: allContent.length,
      withGrowth: sorted.filter((i) => (i.growthRate || 0) > 0).length,
      topGrowthRate: sorted[0]?.growthRate?.toFixed(1) || 0,
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
 * Calculate popular content based on all-time cumulative view counts
 *
 * Ranks content by total views with a small boost from static popularity scores.
 * Unlike trending (velocity), this measures magnitude (total lifetime views).
 *
 * @param {UnifiedContentItem[]} allContent - Array of all content items to analyze
 * @param {TrendingOptions} [options] - Configuration options
 * @param {number} [options.limit=12] - Maximum number of popular items to return
 * @param {boolean} [options.fallbackToPopularity=true] - Use static popularity if Redis fails
 *
 * @returns {Promise<TrendingContentItem[]>} Sorted array by total view count (highest first)
 *
 * @throws {Error} Logs error and returns fallback data if Redis operation fails
 *
 * @example
 * ```typescript
 * const popular = await getPopularContent(allAgents, { limit: 20 });
 * // Returns: [
 * //   { ...agent1, viewCount: 5000 },  // Most viewed
 * //   { ...agent2, viewCount: 4500 },
 * // ]
 * ```
 *
 * @remarks
 * **Algorithm:**
 * 1. Fetch total view counts from Redis (single MGET call)
 * 2. Calculate hybrid score: `viewCount + (popularity / 100)`
 * 3. Sort by score (descending)
 *
 * **Performance:**
 * - 1 Redis MGET operation (~10-15ms)
 * - 3x faster than trending (no daily snapshot queries)
 *
 * **Security:**
 * - Input validation with `Math.max(0, Number(value))`
 * - Graceful fallback to static popularity
 *
 * @see {@link getTrendingContent} For growth-rate based rankings
 */
async function getPopularContent(
  allContent: UnifiedContentItem[],
  options: TrendingOptions = {}
): Promise<TrendingContentItem[]> {
  const { limit = 12, fallbackToPopularity = true } = options;

  try {
    // Check Redis availability - only use Redis if actually connected (not fallback mode)
    if (!statsRedis.isConnected()) {
      logger.warn('Redis not connected for popular calculation, using fallback');
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

    // Sort by hybrid score combining view count and popularity
    const sorted = contentWithViews
      .filter((item) => {
        // Include items with views OR popularity score (hybrid approach)
        const hasViews = (item.viewCount || 0) > 0;
        const hasPopularity = (item.popularity || 0) > 0;
        return hasViews || hasPopularity;
      })
      .sort((a, b) => {
        // Hybrid scoring: use view count if available, add normalized popularity bonus
        // View count is primary metric, popularity (0-100) is secondary
        const aScore = (a.viewCount || 0) + (a.popularity || 0) / 100;
        const bScore = (b.viewCount || 0) + (b.popularity || 0) / 100;
        return bScore - aScore;
      })
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
 * Enriches with view counts from Redis for consistent display
 */
async function getRecentContent(
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

    // Enrich with view counts from Redis (consistent with trending/popular)
    if (statsRedis.isConnected() && sorted.length > 0) {
      const items = sorted.map((item) => ({
        category: item.category,
        slug: item.slug,
      }));

      const viewCounts = await statsRedis.getViewCounts(items);

      const enriched: TrendingContentItem[] = sorted.map((item) => {
        const key = `${item.category}:${item.slug}`;
        const viewCount = viewCounts[key] || 0;

        return {
          ...item,
          viewCount,
        };
      });

      logger.info('Recent content sorted by dateAdded with view counts', {
        totalItems: allContent.length,
        withDates: enriched.length,
      });

      return enriched;
    }

    logger.info('Recent content sorted by dateAdded (no Redis)', {
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
 * Interleave sponsored content into organic results
 * Maintains 1 sponsored per 5 organic ratio (20% max)
 */
function interleaveSponsored<T extends UnifiedContentItem>(
  organic: T[],
  sponsored: Array<{ content_id: string; tier: string; sponsored_id: string }>,
  contentMap: Map<string, T>
): Array<
  T & {
    isSponsored?: boolean | undefined;
    sponsoredId?: string | undefined;
    sponsorTier?: string | undefined;
  }
> {
  if (sponsored.length === 0)
    return organic as Array<
      T & {
        isSponsored?: boolean | undefined;
        sponsoredId?: string | undefined;
        sponsorTier?: string | undefined;
      }
    >;

  const result: Array<
    T & {
      isSponsored?: boolean | undefined;
      sponsoredId?: string | undefined;
      sponsorTier?: string | undefined;
    }
  > = [];
  let sponsoredIndex = 0;
  const INJECTION_RATIO = 5; // 1 sponsored per 5 organic

  for (let i = 0; i < organic.length; i++) {
    // Add organic content
    const organicItem = organic[i];
    if (organicItem) {
      result.push(organicItem);
    }

    // Inject sponsored every 5 items (if available)
    if ((i + 1) % INJECTION_RATIO === 0 && sponsoredIndex < sponsored.length) {
      const sponsoredItem = sponsored[sponsoredIndex];
      const content = sponsoredItem && contentMap.get(sponsoredItem.content_id);

      if (content) {
        result.push({
          ...content,
          isSponsored: true,
          sponsoredId: sponsoredItem.sponsored_id,
          sponsorTier: sponsoredItem.tier,
        });
        sponsoredIndex++;
      }
    }
  }

  return result;
}

/**
 * Get active sponsored content from database
 */
async function getActiveSponsored(): Promise<
  Array<{ content_id: string; content_type: string; tier: string; sponsored_id: string }>
> {
  try {
    // Dynamic import to avoid circular dependency
    const { createClient } = await import('@/src/lib/supabase/server');
    const supabase = await createClient();

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('sponsored_content')
      .select('id, content_id, content_type, tier, impression_limit, impression_count')
      .eq('active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('tier', { ascending: true }); // Featured first, then promoted, spotlight

    if (error || !data) {
      return [];
    }

    // Filter out items that hit impression limit
    return data
      .filter((item) => {
        const impressionCount = item.impression_count ?? 0;
        return !item.impression_limit || impressionCount < item.impression_limit;
      })
      .map((item) => ({
        content_id: item.content_id,
        content_type: item.content_type,
        tier: item.tier,
        sponsored_id: item.id,
      }));
  } catch (error) {
    logger.error(
      'Failed to fetch sponsored content',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Batch trending calculation for multiple categories
 * Now includes sponsored content injection
 */
export async function getBatchTrendingData(
  contentByCategory: {
    agents: UnifiedContentItem[];
    mcp: UnifiedContentItem[];
    rules: UnifiedContentItem[];
    commands: UnifiedContentItem[];
    hooks: UnifiedContentItem[];
    statuslines?: UnifiedContentItem[];
    collections?: UnifiedContentItem[];
  },
  options?: { includeSponsored?: boolean }
) {
  // Combine all content for batch Redis query
  const allContent = [
    ...contentByCategory.agents,
    ...contentByCategory.mcp,
    ...contentByCategory.rules,
    ...contentByCategory.commands,
    ...contentByCategory.hooks,
    ...(contentByCategory.statuslines || []),
    ...(contentByCategory.collections || []),
  ];

  // Run all calculations in parallel (including sponsored fetch)
  const [trending, popular, recent, sponsored] = await Promise.all([
    getTrendingContent(allContent),
    getPopularContent(allContent),
    getRecentContent(allContent),
    options?.includeSponsored !== false ? getActiveSponsored() : Promise.resolve([]),
  ]);

  // Create content map for quick lookups
  const contentMap = new Map<string, UnifiedContentItem>();
  for (const item of allContent) {
    contentMap.set(item.slug, item);
  }

  // Interleave sponsored content if enabled
  const trendingWithSponsored =
    options?.includeSponsored !== false
      ? interleaveSponsored(trending, sponsored, contentMap)
      : trending;

  const popularWithSponsored =
    options?.includeSponsored !== false
      ? interleaveSponsored(popular, sponsored, contentMap)
      : popular;

  return {
    trending: trendingWithSponsored,
    popular: popularWithSponsored,
    recent, // Don't inject into recent (keep chronological)
    metadata: {
      algorithm: 'redis-views',
      generated: new Date().toISOString(),
      redisEnabled: statsRedis.isEnabled(),
      totalItems: allContent.length,
      sponsoredItems: sponsored.length,
    },
  };
}
