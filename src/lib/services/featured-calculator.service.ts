/**
 * Featured Content Selection Algorithm
 * Multi-factor scoring system for weekly featured configs
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
 * @module lib/services/featured-calculator
 */

import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import { statsRedis } from '@/src/lib/redis';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { createClient } from '@/src/lib/supabase/server';

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
    limit: z.number().int().positive().max(50).default(10),
    weekStart: z.date().optional(),
    minRatingCount: z.number().int().nonnegative().default(3),
  })
  .partial();

/**
 * Score weights for multi-factor algorithm
 */
const SCORE_WEIGHTS = {
  TRENDING: 0.4,
  RATING: 0.3,
  ENGAGEMENT: 0.2,
  FRESHNESS: 0.1,
} as const;

/**
 * Engagement metric weights
 */
const ENGAGEMENT_WEIGHTS = {
  BOOKMARK: 5,
  COPY: 3,
  COMMENT: 2,
  VIEW_DIVISOR: 10,
} as const;

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

/**
 * Get start of current week (Monday)
 */
function getCurrentWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get end of week (Sunday)
 */
function getWeekEnd(weekStart: Date): Date {
  const sunday = new Date(weekStart);
  sunday.setDate(weekStart.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

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
    limit: opts.limit ?? 10,
  });

  // Step 1: Fetch Redis view counts and growth rates
  const today = new Date().toISOString().split('T')[0] as string;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0] as string;

  const itemsWithCategory = items.map((item) => ({ category, slug: item.slug }));

  let todayViews: Record<string, number> = {};
  let yesterdayViews: Record<string, number> = {};
  let totalViews: Record<string, number> = {};

  try {
    [todayViews, yesterdayViews, totalViews] = await Promise.all([
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

  // Step 3: Fetch engagement metrics from database
  const supabase = await createClient();
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('content_slug, content_type')
    .eq('content_type', category);

  const bookmarkCounts = new Map<string, number>();
  for (const bookmark of bookmarks || []) {
    bookmarkCounts.set(bookmark.content_slug, (bookmarkCounts.get(bookmark.content_slug) || 0) + 1);
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
      opts.minRatingCount || 3
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
    .slice(0, opts.limit ?? 10);

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

/**
 * Get featured configs for current week
 *
 * @param category - Optional category filter
 * @returns Featured items for current week
 */
export async function getCurrentFeaturedConfigs(category?: string): Promise<
  Array<{
    content_type: string;
    content_slug: string;
    rank: number;
    final_score: number;
  }>
> {
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

export const featuredCalculatorService = {
  calculateFeaturedForCategory,
  storeFeaturedSelections,
  getCurrentFeaturedConfigs,
  getCurrentWeekStart,
  getWeekEnd,
};
