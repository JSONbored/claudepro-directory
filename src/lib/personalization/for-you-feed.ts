/**
 * For You Feed Algorithm
 * Hybrid personalized recommendation engine combining multiple signals
 *
 * Sources (with weights):
 * 1. User Affinities (40%) - Content similar to high-affinity items
 * 2. Collaborative Filtering (30%) - What similar users liked
 * 3. Trending (15%) - Popular/growing content (avoid filter bubble)
 * 4. Interest-based (10%) - Match profile interests
 * 5. Diversity Boost (5%) - Ensure category variety
 */

import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import type { PersonalizedContentItem } from './types';

/**
 * Recommendation weight configuration
 */
export const FOR_YOU_WEIGHTS = {
  affinity: 0.4,
  collaborative: 0.3,
  trending: 0.15,
  interest: 0.1,
  diversity: 0.05,
} as const;

/**
 * Options for For You feed generation
 */
export interface ForYouOptions {
  limit: number;
  category_filter?: string;
  exclude_bookmarked: boolean;
  min_quality_score: number;
  diversity_weight: number;
}

/**
 * Default options for For You feed
 */
const DEFAULT_OPTIONS: ForYouOptions = {
  limit: 12,
  exclude_bookmarked: true,
  min_quality_score: 20, // Require minimum popularity or views
  diversity_weight: 0.3, // Balance between relevance and diversity
};

/**
 * User context for personalization
 */
export interface UserContext {
  user_id: string;
  affinities: Map<string, number>; // content_key -> score
  bookmarked_items: Set<string>; // content_keys
  interests: string[]; // from profile
  favorite_categories: string[]; // computed from affinities
  viewed_recently: Set<string>; // content_keys viewed in last 7 days
}

/**
 * Generate personalized For You feed
 *
 * @param allContent - All available content items
 * @param userContext - User's personalization context
 * @param collaborativeRecs - Pre-computed collaborative recommendations
 * @param trendingItems - Currently trending content
 * @param options - Feed generation options
 * @returns Personalized recommendations with scores
 */
export function generateForYouFeed(
  allContent: UnifiedContentItem[],
  userContext: UserContext,
  collaborativeRecs: Map<string, number>, // content_key -> score
  trendingItems: Set<string>, // content_keys
  options: Partial<ForYouOptions> = {}
): Array<UnifiedContentItem & {
  recommendation_source: PersonalizedContentItem['recommendation_source'];
  recommendation_reason: string;
  affinity_score: number;
}> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const scoredItems: Array<{
    item: UnifiedContentItem;
    score: number;
    source: PersonalizedContentItem['recommendation_source'];
    reason: string;
  }> = [];

  for (const item of allContent) {
    const itemKey = `${item.category}:${item.slug}`;

    // Apply filters
    if (opts.category_filter && item.category !== opts.category_filter) {
      continue;
    }

    if (opts.exclude_bookmarked && userContext.bookmarked_items.has(itemKey)) {
      continue;
    }

    if (userContext.viewed_recently.has(itemKey)) {
      // Skip if viewed very recently (unless very high affinity)
      const affinity = userContext.affinities.get(itemKey) || 0;
      if (affinity < 70) {
        continue;
      }
    }

    // Check minimum quality threshold
    const quality = item.popularity || item.viewCount || 0;
    if (quality < opts.min_quality_score) {
      continue;
    }

    // Calculate score from different sources
    let totalScore = 0;
    let primarySource: PersonalizedContentItem['recommendation_source'] = 'affinity';
    let reason = '';

    // 1. Affinity-based score (40%)
    let affinityScore = 0;
    if (userContext.affinities.size > 0) {
      // Check direct affinity
      const directAffinity = userContext.affinities.get(itemKey) || 0;

      if (directAffinity > 0) {
        affinityScore = directAffinity;
        reason = 'Based on your past interactions';
      } else {
        // For items without direct affinity, use base score for similar content
        // Note: In production, would calculate similarity to user's high-affinity items
        affinityScore = 30; // Base score for items similar to liked content
        reason = 'Similar to content you like';
      }
    }
    totalScore += (affinityScore / 100) * FOR_YOU_WEIGHTS.affinity;

    // 2. Collaborative filtering score (30%)
    const collaborativeScore = collaborativeRecs.get(itemKey) || 0;
    if (collaborativeScore > 0) {
      totalScore += (collaborativeScore / 100) * FOR_YOU_WEIGHTS.collaborative;
      if (affinityScore === 0) {
        primarySource = 'collaborative';
        reason = 'Users like you also enjoyed this';
      }
    }

    // 3. Trending boost (15%)
    const trendingScore = trendingItems.has(itemKey) ? 80 : 0;
    totalScore += (trendingScore / 100) * FOR_YOU_WEIGHTS.trending;
    if (affinityScore === 0 && collaborativeScore === 0 && trendingScore > 0) {
      primarySource = 'trending';
      reason = 'Trending in the community';
    }

    // 4. Interest-based score (10%)
    let interestScore = 0;
    if (userContext.interests.length > 0) {
      const itemTags = (item.tags || []).map((t) => t.toLowerCase());
      const matchedInterests = userContext.interests.filter((interest) =>
        itemTags.some((tag) => tag.includes(interest.toLowerCase()))
      );
      interestScore = (matchedInterests.length / userContext.interests.length) * 100;
    }
    totalScore += (interestScore / 100) * FOR_YOU_WEIGHTS.interest;
    if (
      affinityScore === 0 &&
      collaborativeScore === 0 &&
      trendingScore === 0 &&
      interestScore > 0
    ) {
      primarySource = 'interest';
      reason = 'Matches your interests';
    }

    // Normalize to 0-100 range
    const normalizedScore = Math.min(100, totalScore * 100);

    // Only include items with meaningful score
    if (normalizedScore >= 10) {
      scoredItems.push({
        item,
        score: normalizedScore,
        source: primarySource,
        reason: reason || 'Recommended for you',
      });
    }
  }

  // Sort by score
  scoredItems.sort((a, b) => b.score - a.score);

  // Apply diversity filter
  const diverseItems = applyDiversityFilter(scoredItems, opts.limit, opts.diversity_weight);

  // Convert to PersonalizedContentItem
  return diverseItems.slice(0, opts.limit).map((scored) => ({
    ...scored.item,
    recommendation_source: scored.source,
    recommendation_reason: scored.reason,
    affinity_score: scored.score,
  }));
}

/**
 * Apply diversity filter to ensure category mix
 * Prevents all recommendations being from same category
 */
function applyDiversityFilter(
  items: Array<{
    item: UnifiedContentItem;
    score: number;
    source: PersonalizedContentItem['recommendation_source'];
    reason: string;
  }>,
  limit: number,
  diversityWeight: number
): Array<{
  item: UnifiedContentItem;
  score: number;
  source: PersonalizedContentItem['recommendation_source'];
  reason: string;
}> {
  if (diversityWeight === 0 || items.length <= limit) {
    return items;
  }

  const selected: typeof items = [];
  const categoryCount = new Map<string, number>();

  // First pass: select top items ensuring category diversity
  for (const item of items) {
    if (selected.length >= limit) break;

    const category = item.item.category;
    const currentCount = categoryCount.get(category) || 0;

    // Apply diversity penalty based on category saturation
    const diversityPenalty = currentCount * diversityWeight * 15;
    const adjustedScore = item.score - diversityPenalty;

    // Always include if still high score after penalty
    if (adjustedScore >= 30 || selected.length < Math.ceil(limit / 2)) {
      selected.push(item);
      categoryCount.set(category, currentCount + 1);
    }
  }

  // Second pass: fill remaining slots with highest scoring items
  if (selected.length < limit) {
    for (const item of items) {
      if (selected.length >= limit) break;
      if (!selected.includes(item)) {
        selected.push(item);
      }
    }
  }

  return selected;
}

/**
 * Build user context from database data
 * Helper to prepare context for feed generation
 */
export function buildUserContext(
  userId: string,
  affinities: Array<{ content_type: string; content_slug: string; affinity_score: number }>,
  bookmarks: Array<{ content_type: string; content_slug: string }>,
  recentViews: Array<{ content_type: string; content_slug: string }>,
  profileInterests: string[],
  favoriteCategories: string[]
): UserContext {
  const affinitiesMap = new Map<string, number>();
  for (const affinity of affinities) {
    const key = `${affinity.content_type}:${affinity.content_slug}`;
    affinitiesMap.set(key, affinity.affinity_score);
  }

  const bookmarkedSet = new Set<string>();
  for (const bookmark of bookmarks) {
    bookmarkedSet.add(`${bookmark.content_type}:${bookmark.content_slug}`);
  }

  const viewedRecentlySet = new Set<string>();
  for (const view of recentViews) {
    viewedRecentlySet.add(`${view.content_type}:${view.content_slug}`);
  }

  return {
    user_id: userId,
    affinities: affinitiesMap,
    bookmarked_items: bookmarkedSet,
    interests: profileInterests,
    favorite_categories: favoriteCategories,
    viewed_recently: viewedRecentlySet,
  };
}

/**
 * Check if user has sufficient history for personalization
 * Returns true if user has meaningful interaction data
 */
export function hasPersonalizationData(context: UserContext): boolean {
  return (
    context.affinities.size >= 3 ||
    context.bookmarked_items.size >= 2 ||
    context.interests.length >= 1
  );
}

/**
 * Generate fallback recommendations for cold start users
 * Uses trending + interest-based filtering
 */
export function generateColdStartRecommendations(
  allContent: UnifiedContentItem[],
  profileInterests: string[],
  trendingItems: Set<string>,
  limit: number
): Array<UnifiedContentItem & {
  recommendation_source: 'trending';
  recommendation_reason: string;
}> {
  const scoredItems: Array<{
    item: UnifiedContentItem;
    score: number;
  }> = [];

  for (const item of allContent) {
    const itemKey = `${item.category}:${item.slug}`;
    let score = 0;

    // Trending boost
    if (trendingItems.has(itemKey)) {
      score += 60;
    }

    // Popularity boost
    score += (item.popularity || 0) * 0.3;

    // Interest match
    if (profileInterests.length > 0) {
      const itemTags = (item.tags || []).map((t) => t.toLowerCase());
      const matchedInterests = profileInterests.filter((interest) =>
        itemTags.some((tag) => tag.includes(interest.toLowerCase()))
      );
      score += (matchedInterests.length / profileInterests.length) * 40;
    }

    if (score > 20) {
      scoredItems.push({ item, score });
    }
  }

  return scoredItems
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((scored) => ({
      ...scored.item,
      recommendation_source: 'trending' as const,
      recommendation_reason: 'Popular in the community',
    }));
}
