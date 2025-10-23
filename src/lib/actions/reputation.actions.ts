/**
 * Reputation System Server Actions
 *
 * Production-grade server actions for reputation calculation, breakdown, and recalculation.
 * Implements authentication, validation, caching, and analytics tracking.
 *
 * Core Principles:
 * - Type-safe with Zod validation
 * - Secure with authedAction middleware
 * - Performance-optimized with caching
 * - Analytics-tracked for insights
 * - Error-handled comprehensively
 *
 * @module actions/reputation
 */

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { authedAction } from '@/src/lib/actions/safe-action';
import {
  type ActivityCounts,
  activityCountsSchema,
  getNextTier,
  getReputationTier,
  getTierProgress,
  type ReputationBreakdown,
  reputationBreakdownSchema,
} from '@/src/lib/config/reputation.config';
import { logger } from '@/src/lib/logger';
import { reputationRepository } from '@/src/lib/repositories/reputation.repository';
import { userIdSchema } from '@/src/lib/schemas/branded-types.schema';

// =============================================================================
// GET REPUTATION BREAKDOWN
// =============================================================================

/**
 * Get detailed reputation breakdown for current user
 * Shows how reputation was earned across different activities
 */
export const getReputationBreakdown = authedAction
  .metadata({
    actionName: 'getReputationBreakdown',
    category: 'reputation',
  })
  .schema(z.void())
  .outputSchema(
    reputationBreakdownSchema.extend({
      tier: z.object({
        name: z.string(),
        icon: z.string(),
        color: z.string(),
        progress: z.number(),
      }),
      nextTier: z
        .object({
          name: z.string(),
          pointsNeeded: z.number(),
        })
        .nullable(),
    })
  )
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    // Fetch breakdown from repository
    const result = await reputationRepository.getBreakdown(userId);

    if (!(result.success && result.data)) {
      throw new Error(result.error || 'Failed to fetch reputation breakdown');
    }

    const breakdown = result.data;

    // Calculate tier information
    const currentTier = getReputationTier(breakdown.total);
    const nextTier = getNextTier(breakdown.total);
    const progress = getTierProgress(breakdown.total);

    return {
      ...breakdown,
      tier: {
        name: currentTier.name,
        icon: currentTier.icon,
        color: currentTier.color,
        progress,
      },
      nextTier: nextTier
        ? {
            name: nextTier.tier.name,
            pointsNeeded: nextTier.pointsNeeded,
          }
        : null,
    };
  });

// =============================================================================
// GET ACTIVITY COUNTS
// =============================================================================

/**
 * Get raw activity counts for user
 * Returns counts without reputation point calculations
 */
export const getActivityCounts = authedAction
  .metadata({
    actionName: 'getActivityCounts',
    category: 'reputation',
  })
  .schema(z.void())
  .outputSchema(activityCountsSchema)
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    const result = await reputationRepository.getActivityCounts(userId);

    if (!(result.success && result.data)) {
      throw new Error(result.error || 'Failed to fetch activity counts');
    }

    return result.data;
  });

// =============================================================================
// RECALCULATE REPUTATION
// =============================================================================

/**
 * Recalculate reputation for current user
 * Triggers database function to recalculate from all activities
 *
 * Rate limited to prevent abuse
 */
export const recalculateReputation = authedAction
  .metadata({
    actionName: 'recalculateReputation',
    category: 'reputation',
  })
  .schema(z.void())
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    logger.info('Recalculating reputation', { userId });

    const result = await reputationRepository.recalculate(userId);

    if (!result.success || result.data === undefined) {
      logger.error('Failed to recalculate reputation', new Error(result.error || 'Unknown error'), {
        userId,
      });
      throw new Error(result.error || 'Failed to recalculate reputation');
    }

    const newScore = result.data;

    logger.info(`Reputation recalculated for user ${userId}: ${newScore}`);

    // Revalidate user profile
    revalidatePath('/account');
    revalidatePath('/u/*'); // Wildcard to catch all user profile pages

    return {
      success: true,
      newScore,
    };
  });

// =============================================================================
// GET USER REPUTATION (PUBLIC)
// =============================================================================

/**
 * Get reputation breakdown for any user (public)
 * No authentication required - for public profile viewing
 */
export async function getUserReputation(targetUserId: string): Promise<{
  breakdown: ReputationBreakdown;
  tier: ReturnType<typeof getReputationTier>;
  progress: number;
  activityCounts: ActivityCounts;
}> {
  // Validate input
  const validatedUserId = userIdSchema.parse(targetUserId);

  // Fetch breakdown and counts in parallel
  const [breakdownResult, countsResult] = await Promise.all([
    reputationRepository.getBreakdown(validatedUserId),
    reputationRepository.getActivityCounts(validatedUserId),
  ]);

  if (!(breakdownResult.success && breakdownResult.data)) {
    throw new Error(breakdownResult.error || 'Failed to fetch reputation breakdown');
  }

  if (!(countsResult.success && countsResult.data)) {
    throw new Error(countsResult.error || 'Failed to fetch activity counts');
  }

  const breakdown = breakdownResult.data;
  const activityCounts = countsResult.data;

  // Calculate tier info
  const tier = getReputationTier(breakdown.total);
  const progress = getTierProgress(breakdown.total);

  return {
    breakdown,
    tier,
    progress,
    activityCounts,
  };
}

// =============================================================================
// HELPER EXPORTS
// =============================================================================
