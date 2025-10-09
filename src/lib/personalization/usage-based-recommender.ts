/**
 * Usage-Based Recommendations
 * Context-aware recommendations triggered by specific user actions
 *
 * Triggers:
 * 1. After Bookmarking - "Users who saved this also saved..."
 * 2. After Copying - "Complete your setup with..."
 * 3. Extended Time on Page - "Related configs you might like..."
 * 4. Category Browse - "Since you're exploring [category]..."
 */

import { logger } from '@/src/lib/logger';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { findSimilarConfigs } from './similar-configs';
import type { PersonalizedContentItem } from './types';

/**
 * Recommendation trigger types
 */
export type RecommendationTrigger =
  | 'after_bookmark'
  | 'after_copy'
  | 'extended_time'
  | 'category_browse';

/**
 * Complementarity rules
 * Defines which content types work well together
 */
export const COMPLEMENTARITY_RULES: Record<
  string,
  Array<{ type: string; reason: string; boost: number }>
> = {
  agents: [
    { type: 'mcp', reason: 'MCP servers that work with this agent', boost: 1.2 },
    { type: 'rules', reason: 'Rules to enhance this agent', boost: 1.1 },
    { type: 'commands', reason: 'Commands for this agent', boost: 1.1 },
  ],
  mcp: [
    { type: 'agents', reason: 'Agents that use this MCP server', boost: 1.2 },
    { type: 'hooks', reason: 'Hooks for this MCP server', boost: 1.1 },
  ],
  rules: [
    { type: 'agents', reason: 'Agents optimized for these rules', boost: 1.1 },
    { type: 'commands', reason: 'Commands that enforce these rules', boost: 1.1 },
  ],
  commands: [
    { type: 'agents', reason: 'Agents that use these commands', boost: 1.1 },
    { type: 'rules', reason: 'Rules related to these commands', boost: 1.1 },
  ],
  hooks: [
    { type: 'mcp', reason: 'MCP servers for these hooks', boost: 1.1 },
    { type: 'agents', reason: 'Agents with these hooks', boost: 1.0 },
  ],
  collections: [
    { type: 'agents', reason: 'Individual items from this collection', boost: 1.0 },
    { type: 'mcp', reason: 'Individual items from this collection', boost: 1.0 },
  ],
};

/**
 * Generate recommendations after bookmark action
 * Uses collaborative filtering signal
 *
 * @param bookmarkedItem - Item that was just bookmarked
 * @param allContent - All available content
 * @param coBookmarkData - Items frequently bookmarked together
 * @param limit - Number of recommendations
 */
export function generateAfterBookmarkRecommendations(
  bookmarkedItem: UnifiedContentItem,
  allContent: UnifiedContentItem[],
  coBookmarkData: Map<string, number>,
  limit = 3
): PersonalizedContentItem[] {
  // Find similar configs with collaborative signal
  const similarItems = findSimilarConfigs(bookmarkedItem, allContent, coBookmarkData, limit * 2);

  // Prioritize items with high co-bookmark frequency
  const ranked = similarItems
    .map((similar) => ({
      ...similar.item,
      recommendation_source: 'similar' as const,
      recommendation_reason: 'Users who saved this also saved...',
      similarity_score: similar.similarity_score,
      // Boost items with high collaborative signal
      final_score: similar.similarity_score * (1 + (similar.factors.co_bookmark || 0) * 0.5),
    }))
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, limit);

  return ranked;
}

/**
 * Generate recommendations after copy action
 * Suggests complementary tools
 *
 * @param copiedItem - Item that was just copied
 * @param allContent - All available content
 * @param userContext - User's preference context
 * @param limit - Number of recommendations
 */
export function generateAfterCopyRecommendations(
  copiedItem: UnifiedContentItem,
  allContent: UnifiedContentItem[],
  _userContext?: { favorite_categories: string[]; interests: string[] },
  limit = 3
): PersonalizedContentItem[] {
  const complementaryTypes = COMPLEMENTARITY_RULES[copiedItem.category] || [];
  const recommendations: Array<PersonalizedContentItem> = [];

  // Find complementary items
  for (const rule of complementaryTypes) {
    const candidates = allContent.filter((item) => {
      if (item.category !== rule.type) return false;

      // Check tag overlap for relevance
      const sourceTags = new Set((copiedItem.tags || []).map((t) => t.toLowerCase()));
      const candidateTags = (item.tags || []).map((t) => t.toLowerCase());
      const hasOverlap = candidateTags.some((tag) => sourceTags.has(tag));

      return hasOverlap;
    });

    // Score and add candidates
    for (const candidate of candidates) {
      const baseScore = 50;
      const popularityBoost = (candidate.popularity || 0) * 0.3;
      const ruleBoost = rule.boost * 20;

      recommendations.push({
        ...candidate,
        recommendation_source: 'usage',
        recommendation_reason: rule.reason,
        affinity_score: baseScore + popularityBoost + ruleBoost,
      });
    }
  }

  // Sort by score and return top N
  return recommendations
    .sort((a, b) => (b.affinity_score || 0) - (a.affinity_score || 0))
    .slice(0, limit);
}

/**
 * Generate recommendations for extended time on page
 * User is deeply engaged - suggest related content
 *
 * @param currentItem - Item user is viewing
 * @param allContent - All available content
 * @param timeSpent - Seconds spent on page
 * @param limit - Number of recommendations
 */
export function generateExtendedTimeRecommendations(
  currentItem: UnifiedContentItem,
  allContent: UnifiedContentItem[],
  timeSpent: number,
  limit = 4
): PersonalizedContentItem[] {
  // Deep engagement threshold: 2+ minutes
  const isDeepEngagement = timeSpent >= 120;

  // Find similar items
  const similarItems = findSimilarConfigs(currentItem, allContent, undefined, limit * 2);

  // Adjust scoring based on engagement level
  const recommendations = similarItems.map((similar) => {
    const baseScore = similar.similarity_score * 100;
    const engagementBoost = isDeepEngagement ? 20 : 0;

    return {
      ...similar.item,
      recommendation_source: 'similar' as const,
      recommendation_reason: isDeepEngagement
        ? 'Since you found this interesting...'
        : 'You might also like...',
      affinity_score: baseScore + engagementBoost,
      similarity_score: similar.similarity_score,
    };
  });

  return recommendations
    .sort((a, b) => (b.affinity_score || 0) - (a.affinity_score || 0))
    .slice(0, limit);
}

/**
 * Generate recommendations for category browsing
 * User is exploring a category - suggest top picks
 *
 * @param category - Category being browsed
 * @param allContent - All available content
 * @param userAffinities - User's affinity scores
 * @param limit - Number of recommendations
 */
export function generateCategoryBrowseRecommendations(
  category: string,
  allContent: UnifiedContentItem[],
  userAffinities: Map<string, number>,
  limit = 6
): PersonalizedContentItem[] {
  const categoryItems = allContent.filter((item) => item.category === category);

  const recommendations = categoryItems.map((item) => {
    const itemKey = `${item.category}:${item.slug}`;
    const userAffinity = userAffinities.get(itemKey) || 0;
    const popularity = item.popularity || 0;

    // Combine user preference with popularity
    const score = userAffinity * 0.6 + popularity * 0.4;

    return {
      ...item,
      recommendation_source: 'interest' as const,
      recommendation_reason: `Top ${category} for you`,
      affinity_score: score,
    };
  });

  return recommendations
    .sort((a, b) => (b.affinity_score || 0) - (a.affinity_score || 0))
    .slice(0, limit);
}

/**
 * Detect complementary items in user's bookmark collection
 * Suggests missing pieces to complete their setup
 *
 * @param bookmarkedItems - User's bookmarked content
 * @param allContent - All available content
 * @param limit - Number of recommendations
 */
export function detectMissingComplementaryItems(
  bookmarkedItems: UnifiedContentItem[],
  allContent: UnifiedContentItem[],
  limit = 5
): PersonalizedContentItem[] {
  // Analyze user's bookmarked categories
  const categoryCounts = new Map<string, number>();
  for (const item of bookmarkedItems) {
    categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
  }

  // Find gaps - categories they should have but don't
  const recommendations: PersonalizedContentItem[] = [];

  for (const [category, _count] of categoryCounts.entries()) {
    const rules = COMPLEMENTARITY_RULES[category] || [];

    for (const rule of rules) {
      const hasComplementary = bookmarkedItems.some((item) => item.category === rule.type);

      if (!hasComplementary) {
        // They have items of this category but no complementary items
        const candidates = allContent
          .filter((item) => item.category === rule.type)
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 2); // Top 2 per gap

        for (const candidate of candidates) {
          recommendations.push({
            ...candidate,
            recommendation_source: 'usage',
            recommendation_reason: `Complete your ${category} setup`,
            affinity_score: 70 + (candidate.popularity || 0) * 0.3,
          });
        }
      }
    }
  }

  return recommendations
    .sort((a, b) => (b.affinity_score || 0) - (a.affinity_score || 0))
    .slice(0, limit);
}

/**
 * Get recommendation based on trigger type
 * Main entry point for usage-based recommendations
 */
export function getUsageBasedRecommendations(
  trigger: RecommendationTrigger,
  context: {
    current_item?: UnifiedContentItem;
    category?: string;
    time_spent?: number;
    all_content: UnifiedContentItem[];
    user_affinities?: Map<string, number>;
    co_bookmark_data?: Map<string, number>;
    bookmarked_items?: UnifiedContentItem[];
  }
): PersonalizedContentItem[] {
  const { current_item, category, time_spent, all_content, user_affinities, co_bookmark_data } =
    context;

  try {
    switch (trigger) {
      case 'after_bookmark':
        if (!(current_item && co_bookmark_data)) return [];
        return generateAfterBookmarkRecommendations(current_item, all_content, co_bookmark_data);

      case 'after_copy':
        if (!current_item) return [];
        return generateAfterCopyRecommendations(current_item, all_content);

      case 'extended_time':
        if (!(current_item && time_spent)) return [];
        return generateExtendedTimeRecommendations(current_item, all_content, time_spent);

      case 'category_browse':
        if (!category) return [];
        return generateCategoryBrowseRecommendations(
          category,
          all_content,
          user_affinities || new Map()
        );

      default:
        return [];
    }
  } catch (error) {
    logger.error(
      'Error generating usage-based recommendations',
      error instanceof Error ? error : new Error(String(error)),
      { trigger }
    );
    return [];
  }
}
