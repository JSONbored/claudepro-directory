/**
 * Affinity Scoring Algorithm
 * Calculates user affinity scores for content based on interaction history
 *
 * Algorithm Overview:
 * - Weighted scoring based on multiple engagement signals
 * - Recency decay (recent interactions weighted higher)
 * - Normalized to 0-100 range
 *
 * Scoring Factors:
 * - Views (20%): Baseline interest signal
 * - Time Spent (25%): Deep engagement indicator
 * - Bookmarks (30%): Explicit positive signal (highest weight)
 * - Copies (15%): Usage/implementation intent
 * - Recency (10%): Recent interactions boost score
 */

import { logger } from '@/src/lib/logger';
import type { AffinityCalculation, InteractionSummary } from './types';

/**
 * Weight configuration for affinity scoring
 */
export const AFFINITY_WEIGHTS = {
  views: 0.2,
  time_spent: 0.25,
  bookmarks: 0.3,
  copies: 0.15,
  recency: 0.1,
} as const;

/**
 * Scoring thresholds for normalization
 */
const THRESHOLDS = {
  max_views: 10, // 10+ views = max score for view component
  max_time_spent: 300, // 5 minutes = max score for time component
  max_bookmarks: 1, // 1 bookmark = max score (binary signal)
  max_copies: 3, // 3+ copies = max score
  recency_half_life_days: 30, // 30 days = 50% decay
} as const;

/**
 * Calculate affinity score for a user-content pair
 *
 * @param interactions - Summary of user interactions with content
 * @returns Affinity calculation with score and breakdown
 */
export function calculateAffinityScore(interactions: InteractionSummary): AffinityCalculation {
  const now = new Date();

  // Calculate individual component scores (0-1 range)
  const viewScore = Math.min(interactions.views / THRESHOLDS.max_views, 1);
  const timeScore = Math.min(interactions.time_spent_seconds / THRESHOLDS.max_time_spent, 1);
  const bookmarkScore = Math.min(interactions.bookmarks / THRESHOLDS.max_bookmarks, 1);
  const copyScore = Math.min(interactions.copies / THRESHOLDS.max_copies, 1);

  // Calculate recency boost using exponential decay
  const daysSinceLastInteraction =
    (now.getTime() - interactions.last_interaction.getTime()) / (1000 * 60 * 60 * 24);
  const recencyMultiplier = Math.exp(
    -Math.log(2) * (daysSinceLastInteraction / THRESHOLDS.recency_half_life_days)
  );
  const recencyScore = recencyMultiplier;

  // Calculate weighted total (0-1 range)
  const weightedScore =
    viewScore * AFFINITY_WEIGHTS.views +
    timeScore * AFFINITY_WEIGHTS.time_spent +
    bookmarkScore * AFFINITY_WEIGHTS.bookmarks +
    copyScore * AFFINITY_WEIGHTS.copies +
    recencyScore * AFFINITY_WEIGHTS.recency;

  // Convert to 0-100 range
  const finalScore = Math.round(weightedScore * 100);

  // Create breakdown for transparency
  const breakdown = {
    views: Math.round(viewScore * AFFINITY_WEIGHTS.views * 100),
    bookmarks: Math.round(bookmarkScore * AFFINITY_WEIGHTS.bookmarks * 100),
    copies: Math.round(copyScore * AFFINITY_WEIGHTS.copies * 100),
    time_spent: Math.round(timeScore * AFFINITY_WEIGHTS.time_spent * 100),
    recency_boost: Math.round(recencyScore * AFFINITY_WEIGHTS.recency * 100),
  };

  return {
    content_type: '', // Will be filled by caller
    content_slug: '', // Will be filled by caller
    affinity_score: finalScore,
    breakdown,
  };
}

/**
 * Aggregate interactions into summary format
 *
 * @param interactions - Raw interaction records from database
 * @returns Interaction summary with aggregated metrics
 */
export function aggregateInteractions(
  interactions: Array<{
    interaction_type: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }>
): InteractionSummary {
  const views = interactions.filter((i) => i.interaction_type === 'view').length;
  const bookmarks = interactions.filter((i) => i.interaction_type === 'bookmark').length;
  const copies = interactions.filter((i) => i.interaction_type === 'copy').length;

  // Sum time spent from metadata
  const timeSpentSeconds = interactions
    .filter((i) => i.interaction_type === 'time_spent')
    .reduce((sum, i) => {
      const seconds = (i.metadata?.time_spent_seconds as number) || 0;
      return sum + seconds;
    }, 0);

  // Find first and last interaction dates
  const dates = interactions.map((i) => new Date(i.created_at));
  const firstInteraction = new Date(Math.min(...dates.map((d) => d.getTime())));
  const lastInteraction = new Date(Math.max(...dates.map((d) => d.getTime())));

  return {
    views,
    bookmarks,
    copies,
    time_spent_seconds: timeSpentSeconds,
    first_interaction: firstInteraction,
    last_interaction: lastInteraction,
  };
}

/**
 * Calculate affinities for all content items a user has interacted with
 *
 * @param userInteractions - Map of content items to their interaction records
 * @returns Array of affinity calculations
 */
export function calculateUserAffinities(
  userInteractions: Map<
    string,
    {
      content_type: string;
      content_slug: string;
      interactions: Array<{
        interaction_type: string;
        metadata: Record<string, unknown>;
        created_at: string;
      }>;
    }
  >
): AffinityCalculation[] {
  const affinities: AffinityCalculation[] = [];

  for (const [_key, data] of userInteractions.entries()) {
    try {
      // Aggregate interactions
      const summary = aggregateInteractions(data.interactions);

      // Calculate affinity score
      const affinity = calculateAffinityScore(summary);
      affinity.content_type = data.content_type;
      affinity.content_slug = data.content_slug;

      // Only include if score is above threshold (meaningful affinity)
      if (affinity.affinity_score >= 10) {
        affinities.push(affinity);
      }
    } catch (error) {
      logger.error(
        'Error calculating affinity for content',
        error instanceof Error ? error : new Error(String(error)),
        {
          content_type: data.content_type,
          content_slug: data.content_slug,
        }
      );
    }
  }

  // Sort by score descending
  return affinities.sort((a, b) => b.affinity_score - a.affinity_score);
}

/**
 * Validate affinity score is within expected range
 */
export function validateAffinityScore(score: number): boolean {
  return score >= 0 && score <= 100 && !Number.isNaN(score) && Number.isFinite(score);
}

/**
 * Get affinity tier label for display
 */
export function getAffinityTier(score: number): string {
  if (score >= 80) return 'Very High';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Very Low';
}
