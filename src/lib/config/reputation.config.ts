/**
 * Reputation System Configuration
 *
 * Centralized configuration for reputation calculation, point values, and tier thresholds.
 * Configuration-driven system following core codebase principles for maintainability.
 *
 * Production Standards:
 * - Type-safe configuration with Zod validation
 * - Single source of truth for all reputation logic
 * - Easy to modify point values without code changes
 * - Tier system scales gracefully
 *
 * @module config/reputation
 */

import { z } from 'zod';

// =============================================================================
// REPUTATION POINT VALUES
// =============================================================================

/**
 * Point values for each activity type
 * These determine how much reputation users earn for actions
 */
export const REPUTATION_POINTS = {
  /** Creating a new post in the community */
  POST: 10,

  /** Receiving an upvote on a post */
  VOTE_RECEIVED: 5,

  /** Writing a comment */
  COMMENT: 2,

  /** Having a submission merged into the directory */
  SUBMISSION_MERGED: 20,

  /** Creating a helpful review */
  REVIEW: 5,

  /** Having content bookmarked by others */
  BOOKMARK_RECEIVED: 3,

  /** Receiving a follow */
  FOLLOWER: 1,
} as const;

// =============================================================================
// REPUTATION TIERS
// =============================================================================

/**
 * Reputation tier thresholds
 * Users progress through tiers as they gain reputation
 */
export const REPUTATION_TIERS = [
  {
    name: 'Newcomer',
    minScore: 0,
    maxScore: 49,
    color: 'gray',
    icon: '🌱',
    description: 'Just getting started',
  },
  {
    name: 'Contributor',
    minScore: 50,
    maxScore: 199,
    color: 'blue',
    icon: '⭐',
    description: 'Active community member',
  },
  {
    name: 'Regular',
    minScore: 200,
    maxScore: 499,
    color: 'purple',
    icon: '💎',
    description: 'Trusted contributor',
  },
  {
    name: 'Expert',
    minScore: 500,
    maxScore: 999,
    color: 'orange',
    icon: '🔥',
    description: 'Community expert',
  },
  {
    name: 'Master',
    minScore: 1000,
    maxScore: 2499,
    color: 'red',
    icon: '🏆',
    description: 'Master contributor',
  },
  {
    name: 'Legend',
    minScore: 2500,
    maxScore: Number.POSITIVE_INFINITY,
    color: 'gold',
    icon: '👑',
    description: 'Legendary status',
  },
] as const;

// =============================================================================
// REPUTATION BREAKDOWN TYPES
// =============================================================================

/** Reputation breakdown showing sources of reputation */
export const reputationBreakdownSchema = z.object({
  from_posts: z.number().int().nonnegative(),
  from_votes_received: z.number().int().nonnegative(),
  from_comments: z.number().int().nonnegative(),
  from_submissions: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export type ReputationBreakdown = z.infer<typeof reputationBreakdownSchema>;

/** Activity counts (raw numbers, not points) */
export const activityCountsSchema = z.object({
  posts: z.number().int().nonnegative(),
  votes: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
  submissions: z.number().int().nonnegative(),
});

export type ActivityCounts = z.infer<typeof activityCountsSchema>;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get reputation tier for a given score
 */
export function getReputationTier(score: number) {
  return (
    REPUTATION_TIERS.find((tier) => score >= tier.minScore && score <= tier.maxScore) ||
    REPUTATION_TIERS[0]
  );
}

/**
 * Get next tier and points needed
 */
export function getNextTier(currentScore: number) {
  const currentTier = getReputationTier(currentScore);
  const currentIndex = REPUTATION_TIERS.findIndex((t) => t.name === currentTier.name);

  if (currentIndex === REPUTATION_TIERS.length - 1) {
    // Already at max tier
    return null;
  }

  const nextTier = REPUTATION_TIERS[currentIndex + 1];

  // TypeScript guard: Should never happen due to check above, but satisfy compiler
  if (!nextTier) {
    return null;
  }

  const pointsNeeded = nextTier.minScore - currentScore;

  return {
    tier: nextTier,
    pointsNeeded,
  };
}

/**
 * Calculate progress to next tier (0-100)
 */
export function getTierProgress(currentScore: number): number {
  const currentTier = getReputationTier(currentScore);
  const tierRange = currentTier.maxScore - currentTier.minScore;

  if (tierRange === Number.POSITIVE_INFINITY) {
    return 100; // At max tier
  }

  const scoreInTier = currentScore - currentTier.minScore;
  return Math.min(100, Math.round((scoreInTier / tierRange) * 100));
}

/**
 * Validate reputation breakdown matches total
 */
export function validateReputationBreakdown(breakdown: ReputationBreakdown): boolean {
  const calculatedTotal =
    breakdown.from_posts +
    breakdown.from_votes_received +
    breakdown.from_comments +
    breakdown.from_submissions;

  return calculatedTotal === breakdown.total;
}

// =============================================================================
// CONFIGURATION VALIDATION
// =============================================================================

/**
 * Validate reputation configuration on startup
 * Ensures tiers are properly ordered and don't overlap
 */
export function validateReputationConfig(): void {
  // Check tier ordering
  for (let i = 0; i < REPUTATION_TIERS.length - 1; i++) {
    const current = REPUTATION_TIERS[i];
    const next = REPUTATION_TIERS[i + 1];

    // TypeScript guards: Array access could be undefined
    if (!(current && next)) {
      throw new Error(`Invalid reputation tier configuration at index ${i}`);
    }

    if (current.maxScore >= next.minScore) {
      throw new Error(
        `Reputation tier overlap: ${current.name} (max: ${current.maxScore}) overlaps with ${next.name} (min: ${next.minScore})`
      );
    }

    if (current.maxScore + 1 !== next.minScore) {
      throw new Error(
        `Reputation tier gap: ${current.name} (max: ${current.maxScore}) has gap before ${next.name} (min: ${next.minScore})`
      );
    }
  }
}

// Run validation on import (fails fast if misconfigured)
validateReputationConfig();
