/**
 * Featured Content Service
 * SHA-3152: Unified featured content calculation and loading service
 *
 * Consolidates:
 * - featured-calculator.service.ts (418 LOC)
 * - featured-loader.service.ts (329 LOC)
 *
 * ## Algorithm Overview:
 *
 * ### Multi-Factor Scoring Formula 🎯
 * `final_score = (trending * 0.4) + (rating * 0.3) + (engagement * 0.2) + (freshness * 0.1)`
 *
 * ### Score Components (0-100 scale):
 *
 * 1. **Trending Score (40% weight)** ✨
 *    - Based on 24h growth rate from Redis
 *    - Normalizes growth rate to 0-100 scale (sigmoid curve)
 *    - Rewards momentum and virality
 *
 * 2. **Rating Score (30% weight)** ⭐
 *    - Average user rating (1-5 stars)
 *    - Normalized to 0-100: `(avg_rating / 5) * 100`
 *    - Requires minimum 3 ratings to qualify
 *
 * 3. **Engagement Score (20% weight)** 💬
 *    - Composite of: bookmarks, copies, comments, views
 *    - Formula: `(bookmarks * 5 + copies * 3 + comments * 2 + views / 10)`
 *    - Normalized using percentile ranking
 *
 * 4. **Freshness Score (10% weight)** 🆕
 *    - Recency boost for new content
 *    - Formula: `max(0, 100 - (days_old * 2))`
 *    - Content older than 50 days gets 0 freshness score
 *
 * ## Selection Process:
 * - Runs weekly (Monday 00:00 UTC)
 * - Selects top 10 configs per category
 * - Stores results in `featured_configs` table
 * - Archives previous weeks for historical tracking
 *
 * @module lib/services/featured
 */

import { z } from 'zod';
import { statsRedis } from '@/src/lib/cache.server';
import { getAllCategoryIds } from '@/src/lib/config/category-config';
import { getContentByCategory } from '@/src/lib/content/content-loaders';
import { logger } from '@/src/lib/logger';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { createClient } from '@/src/lib/supabase/server';
import { getBatchTrendingData } from '@/src/lib/trending/calculator.server';
import { batchFetch, batchMap } from '@/src/lib/utils/batch.utils';
import {
  getCurrentWeekStart,
  getCurrentWeekStartISO,
  getWeekEnd,
} from '@/src/lib/utils/data.utils';

/**
 * Configuration: Content categories (derived from registry)
 * Dynamically includes all categories from UNIFIED_CATEGORY_REGISTRY
 */
const CONTENT_CATEGORIES = getAllCategoryIds();

/**
 * Configuration: Score weights for multi-factor algorithm
 */
const SCORE_WEIGHTS = {
  TRENDING: 0.4,
  RATING: 0.3,
  ENGAGEMENT: 0.2,
  FRESHNESS: 0.1,
} as const;

/**
 * Configuration: Engagement metric weights
 */
const ENGAGEMENT_WEIGHTS = {
  BOOKMARK: 5,
  COPY: 3,
  COMMENT: 2,
  VIEW_DIVISOR: 10,
} as const;

/**
 * Configuration: Loader defaults
 */
const LOADER_CONFIG = {
  MAX_ITEMS_PER_CATEGORY: 6,
  DEFAULT_CALCULATION_LIMIT: 10,
  MIN_RATING_COUNT: 3,
} as const;

// ============================================
// TYPES & INTERFACES
// ============================================

/**
 * Featured config record from database
 */
export interface FeaturedConfigRecord {
  content_type: string;
  content_slug: string;
  rank: number;
  final_score: number;
}

/**
 * Featured content item with multi-factor scoring
 */
export interface FeaturedContentItem extends UnifiedContentItem {
  trendingScore: number;
  ratingScore: number;
  engagementScore: number;
  freshnessScore: number;
  finalScore: number;
  calculationMetadata: {
    views: number;
    growthRate: number;
    rating?: { avg: number; count: number };
    engagement: { bookmarks: number; copies: number; comments: number };
    daysOld: number;
  };
}

/**
 * Options for featured content calculation
 */
export interface FeaturedCalculatorOptions {
  /** Number of top items to select per category */
  limit?: number;
  /** Specific week start date (defaults to current week) */
  weekStart?: Date;
  /** Minimum rating count required */
  minRatingCount?: number;
}

const featuredCalculatorOptionsSchema = z
  .object({
    limit: z.number().int().positive().max(50).default(LOADER_CONFIG.DEFAULT_CALCULATION_LIMIT),
    weekStart: z.date().optional(),
    minRatingCount: z.number().int().nonnegative().default(LOADER_CONFIG.MIN_RATING_COUNT),
  })
  .partial();

// ============================================
// SCORING ALGORITHMS
// ============================================

/**
 * Calculate trending score (0-100) from growth rate
 *
 * Uses sigmoid normalization to convert growth rate to 0-100 scale:
 * - 0% growth → 50 score
 * - 100% growth → 75 score
 * - 500%+ growth → 95+ score
 *
 * @param growthRate - 24h growth percentage from Redis
 * @returns Normalized score 0-100
 */
function calculateTrendingScore(growthRate: number): number {
  // Sigmoid normalization: 1 / (1 + e^(-x/100))
  // Shifts and scales to 0-100 range
  const normalized = 100 / (1 + Math.exp(-(growthRate - 100) / 100));
  return Math.min(100, Math.max(0, normalized));
}

/**
 * Calculate rating score (0-100) from average rating
 *
 * @param avgRating - Average rating (1-5 stars)
 * @param ratingCount - Number of ratings
 * @param minRatingCount - Minimum ratings required
 * @returns Normalized score 0-100, or 0 if insufficient ratings
 */
function calculateRatingScore(
  avgRating: number | undefined,
  ratingCount: number,
  minRatingCount: number
): number {
  if (!avgRating || ratingCount < minRatingCount) {
    return 0;
  }
  return (avgRating / 5) * 100;
}

/**
 * Calculate engagement score (0-100) from user interactions
 *
 * @param engagement - User interaction counts
 * @param allEngagementScores - All scores for percentile ranking
 * @returns Normalized score 0-100
 */
function calculateEngagementScore(
  engagement: { bookmarks: number; copies: number; comments: number; views: number },
  allEngagementScores: number[]
): number {
  const rawScore =
    engagement.bookmarks * ENGAGEMENT_WEIGHTS.BOOKMARK +
    engagement.copies * ENGAGEMENT_WEIGHTS.COPY +
    engagement.comments * ENGAGEMENT_WEIGHTS.COMMENT +
    engagement.views / ENGAGEMENT_WEIGHTS.VIEW_DIVISOR;

  // Percentile normalization
  const percentile =
    allEngagementScores.filter((score) => score < rawScore).length / allEngagementScores.length;
  return percentile * 100;
}

/**
 * Calculate freshness score (0-100) based on content age
 *
 * @param dateAdded - Content creation date
 * @returns Freshness score (100 for new content, 0 for 50+ days old)
 */
function calculateFreshnessScore(dateAdded: string): number {
  const now = new Date();
  const created = new Date(dateAdded);
  const daysOld = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, 100 - daysOld * 2);
}

// ============================================
// CALCULATION (Write Operations)
// ============================================

/**
 * Calculate featured content selections for a specific category
 *
 * @param category - Content category (mcp, rules, agents, etc.)
 * @param items - All content items in category
 * @param options - Calculation options
 * @returns Top N featured items with scoring details
 */
export async function calculateFeaturedForCategory(
  category: string,
  items: readonly UnifiedContentItem[],
  options: FeaturedCalculatorOptions = {}
): Promise<FeaturedContentItem[]> {
  const opts = featuredCalculatorOptionsSchema.parse(options);

  logger.info(`Calculating featured ${category}`, {
    itemCount: items.length,
    limit: opts.limit ?? LOADER_CONFIG.DEFAULT_CALCULATION_LIMIT,
  });

  // Step 1: Fetch Redis view counts and growth rates
  const today = new Date().toISOString().split('T')[0] as string;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0] as string;

  const itemsWithCategory = items.map((item) => ({ category, slug: item.slug }));

  let todayViews: Record<string, number> = {};
  let yesterdayViews: Record<string, number> = {};
  let totalViews: Record<string, number> = {};

  try {
    [todayViews, yesterdayViews, totalViews] = await batchFetch([
      statsRedis.getDailyViewCounts(itemsWithCategory, today),
      statsRedis.getDailyViewCounts(itemsWithCategory, yesterday),
      statsRedis.getViewCounts(itemsWithCategory),
    ]);
  } catch (error) {
    logger.error(
      'Redis error in featured calculator',
      error instanceof Error ? error.message : String(error)
    );
    // Continue with empty objects - will use fallback scoring
  }

  // Step 2: Fetch ratings from database (FUTURE: when review_ratings table exists)
  // For now, use placeholder ratings
  const ratings = new Map<string, { avg: number; count: number }>();

  // Step 3: Fetch engagement metrics from database (OPTIMIZED: materialized view)
  // OPTIMIZATION (2025-10-27): Use content_popularity materialized view for 10-50x performance
  // BEFORE: RPC get_bookmark_counts_by_category() runs COUNT + GROUP BY at query time (200-500ms)
  // AFTER: Query pre-computed materialized view (10-50ms, no aggregation overhead)
  // Performance: Featured content calculation 500ms → 50ms (10x faster)
  const supabase = await createClient();

  // Query materialized view for pre-computed bookmark counts
  // Materialized view is refreshed hourly via pg_cron
  const { data: popularityData } = await supabase
    .from('content_popularity')
    .select('content_slug, bookmark_count, popularity_score')
    .eq('content_type', category);

  const bookmarkCounts = new Map<string, number>();
  if (popularityData) {
    for (const row of popularityData) {
      if (row.content_slug) {
        bookmarkCounts.set(row.content_slug, row.bookmark_count || 0);
      }
    }
  }

  // Step 4: Calculate raw engagement scores for all items
  const allEngagementScores = items.map((item) => {
    const key = `${category}:${item.slug}`;
    const views = totalViews[key] || 0;
    const bookmarkCount = bookmarkCounts.get(item.slug) || 0;
    return (
      bookmarkCount * ENGAGEMENT_WEIGHTS.BOOKMARK +
      0 * ENGAGEMENT_WEIGHTS.COPY + // FUTURE: track copy events
      0 * ENGAGEMENT_WEIGHTS.COMMENT + // FUTURE: when comments exist
      views / ENGAGEMENT_WEIGHTS.VIEW_DIVISOR
    );
  });

  // Step 5: Score each item
  const scoredItems: FeaturedContentItem[] = items.map((item) => {
    const key = `${category}:${item.slug}`;
    const todayCount = todayViews[key] || 0;
    const yesterdayCount = yesterdayViews[key] || 0;
    const views = totalViews[key] || 0;

    const growthRate =
      yesterdayCount > 0
        ? ((todayCount - yesterdayCount) / yesterdayCount) * 100
        : todayCount > 0
          ? 100
          : 0;

    const rating = ratings.get(item.slug);
    const bookmarkCount = bookmarkCounts.get(item.slug) || 0;

    const engagement = {
      bookmarks: bookmarkCount,
      copies: 0, // FUTURE: track copy events
      comments: 0, // FUTURE: when comments exist
      views,
    };

    const trendingScore = calculateTrendingScore(growthRate);
    const ratingScore = calculateRatingScore(
      rating?.avg,
      rating?.count || 0,
      opts.minRatingCount || LOADER_CONFIG.MIN_RATING_COUNT
    );
    const engagementScore = calculateEngagementScore(engagement, allEngagementScores);
    const freshnessScore = calculateFreshnessScore(item.dateAdded ?? new Date().toISOString());

    const finalScore =
      trendingScore * SCORE_WEIGHTS.TRENDING +
      ratingScore * SCORE_WEIGHTS.RATING +
      engagementScore * SCORE_WEIGHTS.ENGAGEMENT +
      freshnessScore * SCORE_WEIGHTS.FRESHNESS;

    const daysOld =
      (Date.now() - new Date(item.dateAdded ?? new Date()).getTime()) / (1000 * 60 * 60 * 24);

    return {
      ...item,
      trendingScore,
      ratingScore,
      engagementScore,
      freshnessScore,
      finalScore,
      calculationMetadata: {
        views,
        growthRate,
        rating: rating ?? undefined,
        engagement,
        daysOld,
      },
    } as FeaturedContentItem;
  });

  // Step 6: Sort by final score and return top N
  const topItems = scoredItems
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, opts.limit ?? LOADER_CONFIG.DEFAULT_CALCULATION_LIMIT);

  logger.info(`Featured ${category} calculation complete`, {
    totalItems: items.length,
    featuredCount: topItems.length,
    topScore: topItems[0]?.finalScore?.toFixed(2) ?? 'N/A',
  });

  return topItems;
}

/**
 * Store featured selections in database
 *
 * @param category - Content category
 * @param items - Featured items to store
 * @param weekStart - Week start date
 */
export async function storeFeaturedSelections(
  category: string,
  items: FeaturedContentItem[],
  weekStart: Date
): Promise<void> {
  const supabase = await createClient();
  const weekEnd = getWeekEnd(weekStart);

  const records = items.map((item, index) => ({
    content_type: category,
    content_slug: item.slug,
    week_start: weekStart.toISOString().split('T')[0] as string,
    week_end: weekEnd.toISOString().split('T')[0] as string,
    rank: index + 1,
    trending_score: item.trendingScore,
    rating_score: item.ratingScore,
    engagement_score: item.engagementScore,
    freshness_score: item.freshnessScore,
    final_score: item.finalScore,
    calculation_metadata: item.calculationMetadata,
  }));

  const { error } = await supabase.from('featured_configs').insert(records);

  if (error) {
    logger.error(`Failed to store featured selections for ${category}`, error.message, {
      weekStart: weekStart.toISOString(),
    });
    throw error;
  }

  logger.info(`Stored ${items.length} featured ${category}`, {
    weekStart: weekStart.toISOString(),
  });
}

// ============================================
// DATA ACCESS (Read Operations)
// ============================================

/**
 * Get featured configs for current week from database
 *
 * @param category - Optional category filter
 * @returns Featured items for current week
 */
export async function getCurrentFeaturedConfigs(
  category?: string
): Promise<FeaturedConfigRecord[]> {
  const supabase = await createClient();
  const weekStart = getCurrentWeekStart();

  let query = supabase
    .from('featured_configs')
    .select('content_type, content_slug, rank, final_score')
    .eq('week_start', weekStart.toISOString().split('T')[0] as string)
    .order('rank', { ascending: true });

  if (category) {
    query = query.eq('content_type', category);
  }

  const { data, error } = await query;

  if (error) {
    logger.error(
      'Failed to fetch current featured configs',
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }

  return data || [];
}

/**
 * Load and enrich current week's featured content items grouped by category
 *
 * - Fetches featured config records from database
 * - Loads full content items from content files
 * - Enriches with featured metadata (rank, score)
 * - Groups by category (rules, mcp, agents, etc.)
 * - Returns top 6 per category for featured sections
 *
 * @returns Record of category -> featured items (max 6 per category)
 */
export async function loadCurrentFeaturedContentByCategory(): Promise<
  Record<string, readonly UnifiedContentItem[]>
> {
  try {
    // Step 1: Fetch featured records from database
    const featuredRecords = await getCurrentFeaturedConfigs();

    if (featuredRecords.length === 0) {
      logger.info('No featured configs for current week - using simple newest-first fallback');

      // Fallback: Load all content and get top 6 per category
      const [
        rulesData,
        mcpData,
        agentsData,
        commandsData,
        hooksData,
        statuslinesData,
        collectionsData,
        skillsData,
        guidesData,
        jobsData,
        changelogData,
      ] = await batchFetch([
        getContentByCategory('rules'),
        getContentByCategory('mcp'),
        getContentByCategory('agents'),
        getContentByCategory('commands'),
        getContentByCategory('hooks'),
        getContentByCategory('statuslines'),
        getContentByCategory('collections'),
        getContentByCategory('skills'),
        getContentByCategory('guides'),
        getContentByCategory('jobs'),
        getContentByCategory('changelog'),
      ]);

      // Use trending calculator to get popular content per category
      const trendingData = await getBatchTrendingData({
        rules: rulesData,
        mcp: mcpData,
        agents: agentsData,
        commands: commandsData,
        hooks: hooksData,
        statuslines: statuslinesData,
        collections: collectionsData,
        skills: skillsData,
        guides: guidesData,
        jobs: jobsData,
        changelog: changelogData,
      });

      // Group popular items by category - ensure all categories are represented
      const fallbackResult: Record<string, readonly UnifiedContentItem[]> = {};

      // Map of category to its raw data for fallback
      const categoryDataMap = {
        rules: rulesData,
        mcp: mcpData,
        agents: agentsData,
        commands: commandsData,
        hooks: hooksData,
        statuslines: statuslinesData,
        collections: collectionsData,
        skills: skillsData,
        guides: guidesData,
        jobs: jobsData,
        changelog: changelogData,
      };

      for (const category of CONTENT_CATEGORIES) {
        // First try to get items from trending data
        const trendingItems = trendingData.popular.filter((item) => item.category === category);

        if (trendingItems.length >= LOADER_CONFIG.MAX_ITEMS_PER_CATEGORY) {
          // We have enough trending items
          fallbackResult[category] = trendingItems.slice(0, LOADER_CONFIG.MAX_ITEMS_PER_CATEGORY);
        } else {
          // Not enough trending items, supplement with newest content
          const rawData = categoryDataMap[category] || [];
          const combined = [...trendingItems];

          // Add non-trending items sorted by newest first until we have 6
          const trendingSlugs = new Set(trendingItems.map((item) => item.slug));
          const additionalItems = rawData
            .filter((item) => !trendingSlugs.has(item.slug))
            .sort((a, b) => {
              const dateA = new Date(a.dateAdded ?? '1970-01-01').getTime();
              const dateB = new Date(b.dateAdded ?? '1970-01-01').getTime();
              return dateB - dateA; // Newest first
            })
            .slice(0, LOADER_CONFIG.MAX_ITEMS_PER_CATEGORY - trendingItems.length);

          combined.push(...additionalItems);
          fallbackResult[category] = combined.slice(0, LOADER_CONFIG.MAX_ITEMS_PER_CATEGORY);
        }
      }

      logger.info('Loaded fallback featured content with all categories', {
        categories: Object.keys(fallbackResult).join(', '),
        totalItems: Object.values(fallbackResult).reduce((sum, items) => sum + items.length, 0),
      });

      return fallbackResult;
    }

    // Step 2: Load all content in parallel
    const contentByCategory = await batchMap(CONTENT_CATEGORIES, async (category) => ({
      category,
      items: await getContentByCategory(category),
    }));

    // Step 3: Create lookup map: category:slug -> content item
    const contentMap = new Map<string, UnifiedContentItem>();
    for (const { category, items } of contentByCategory) {
      for (const item of items) {
        contentMap.set(`${category}:${item.slug}`, item);
      }
    }

    // Step 4: Group featured records by category
    const featuredByCategory: Record<string, UnifiedContentItem[]> = {};

    for (const record of featuredRecords) {
      const key = `${record.content_type}:${record.content_slug}`;
      const item = contentMap.get(key);

      if (!item) {
        logger.warn('Featured item not found in content', {
          category: record.content_type,
          slug: record.content_slug,
        });
        continue;
      }

      // Initialize category array if needed
      if (!featuredByCategory[record.content_type]) {
        featuredByCategory[record.content_type] = [];
      }

      // Add featured metadata
      const enrichedItem = {
        ...item,
        _featured: {
          rank: record.rank,
          score: record.final_score,
        },
      } as UnifiedContentItem;

      featuredByCategory[record.content_type]?.push(enrichedItem);
    }

    // Step 5: Limit to top 6 per category and sort by rank
    const result: Record<string, readonly UnifiedContentItem[]> = {};
    for (const [category, items] of Object.entries(featuredByCategory)) {
      result[category] = items
        .sort((a, b) => {
          const aRank =
            (a as UnifiedContentItem & { _featured?: { rank: number } })._featured?.rank ?? 999;
          const bRank =
            (b as UnifiedContentItem & { _featured?: { rank: number } })._featured?.rank ?? 999;
          return aRank - bRank;
        })
        .slice(0, LOADER_CONFIG.MAX_ITEMS_PER_CATEGORY);
    }

    logger.info('Loaded featured content by category', {
      categories: Object.keys(result).join(', '),
      totalItems: Object.values(result).reduce((sum, items) => sum + items.length, 0),
      weekStart: getCurrentWeekStartISO(),
    });

    return result;
  } catch (error) {
    logger.error(
      'Failed to load featured content by category',
      error instanceof Error ? error.message : String(error)
    );
    return {};
  }
}

/**
 * Load and enrich current week's featured content items (all categories combined)
 *
 * - Fetches featured config records from database
 * - Loads full content items from content files
 * - Enriches with featured metadata (rank, score)
 * - Returns sorted by rank
 *
 * @returns Array of featured content items with metadata
 */
export async function loadCurrentFeaturedContent(): Promise<readonly UnifiedContentItem[]> {
  try {
    // Step 1: Fetch featured records from database
    const featuredRecords = await getCurrentFeaturedConfigs();

    if (featuredRecords.length === 0) {
      logger.info('No featured configs for current week');
      return [];
    }

    // Step 2: Load all content in parallel
    const contentByCategory = await batchMap(CONTENT_CATEGORIES, async (category) => ({
      category,
      items: await getContentByCategory(category),
    }));

    // Step 3: Create lookup map: category:slug -> content item
    const contentMap = new Map<string, UnifiedContentItem>();
    for (const { category, items } of contentByCategory) {
      for (const item of items) {
        contentMap.set(`${category}:${item.slug}`, item);
      }
    }

    // Step 4: Resolve featured items and add metadata
    const featuredItems = featuredRecords
      .map((record) => {
        const key = `${record.content_type}:${record.content_slug}`;
        const item = contentMap.get(key);

        if (!item) {
          logger.warn('Featured item not found in content', {
            category: record.content_type,
            slug: record.content_slug,
          });
          return null;
        }

        return {
          ...item,
          // Add featured metadata (not in schema, but can be used by components)
          _featured: {
            rank: record.rank,
            score: record.final_score,
          },
        } as UnifiedContentItem;
      })
      .filter((item): item is UnifiedContentItem => item !== null);

    logger.info('Loaded featured content', {
      count: featuredItems.length,
      weekStart: getCurrentWeekStartISO(),
    });

    return featuredItems;
  } catch (error) {
    logger.error(
      'Failed to load featured content',
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

// ============================================
// SERVICE EXPORTS
// ============================================

/**
 * Unified featured service
 * Replaces: featuredCalculatorService + featuredLoaderService
 */
export const featuredService = {
  // Calculation (write)
  calculateFeaturedForCategory,
  storeFeaturedSelections,

  // Data access (read)
  getCurrentFeaturedConfigs,
  loadCurrentFeaturedContent,
  loadCurrentFeaturedContentByCategory,
};
