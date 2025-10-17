/**
 * User Activity Triggers Service
 *
 * Centralized service for triggering badge awards and reputation recalculation
 * after user actions. Ensures consistency and prevents code duplication.
 *
 * Core Principles:
 * - Single responsibility: One place for all activity triggers
 * - Fire-and-forget: Non-blocking, won't slow down user actions
 * - Error-resilient: Failures logged but don't break user flow
 * - Observable: Comprehensive logging for debugging
 * - Performance-optimized: Async, batched where possible
 *
 * Architecture:
 * 1. User performs action (create post, vote, etc.)
 * 2. Action calls appropriate trigger function
 * 3. Trigger runs in background (non-blocking)
 * 4. Badge service checks eligibility
 * 5. Reputation recalculated if needed
 * 6. Cache invalidation handled automatically
 *
 * @module services/user-activity-triggers
 */

import { revalidatePath } from 'next/cache';
import { logger } from '@/src/lib/logger';
import { reputationRepository } from '@/src/lib/repositories/reputation.repository';
import {
  type BadgeCheckTrigger,
  checkAndAwardBadges,
} from '@/src/lib/services/badge-award.service';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Configuration for trigger behavior
 */
const TRIGGER_CONFIG = {
  /**
   * Whether to run badge checks asynchronously
   * Set to false during development/testing for easier debugging
   */
  ASYNC_BADGE_CHECKS: true,

  /**
   * Whether to recalculate reputation after every action
   * Can be disabled to rely on database triggers instead
   */
  AUTO_REPUTATION_RECALC: true,

  /**
   * Paths to revalidate after badge/reputation changes
   */
  REVALIDATE_PATHS: ['/account', '/u/*'],
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Revalidate Next.js cache for user profile pages
 */
function revalidateUserPages(): void {
  try {
    for (const path of TRIGGER_CONFIG.REVALIDATE_PATHS) {
      revalidatePath(path);
    }
  } catch (error) {
    // Non-critical error, just log
    logger.error(
      'Failed to revalidate paths',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Run badge check with error handling
 * Non-blocking - errors are logged but don't propagate
 */
async function runBadgeCheck(userId: string, trigger: BadgeCheckTrigger): Promise<void> {
  try {
    const results = await checkAndAwardBadges(userId, trigger);
    const awardedBadges = results.filter((r) => r.awarded);

    if (awardedBadges.length > 0) {
      logger.info('Badges awarded via trigger', {
        userId,
        trigger,
        badgeCount: awardedBadges.length,
      });

      // Revalidate cache after awarding badges
      revalidateUserPages();
    }
  } catch (error) {
    logger.error(
      'Badge check failed in trigger',
      error instanceof Error ? error : new Error(String(error)),
      { userId, trigger }
    );
  }
}

/**
 * Recalculate user reputation with error handling
 * Non-blocking - errors are logged but don't propagate
 */
async function recalculateUserReputation(userId: string, reason: string): Promise<void> {
  if (!TRIGGER_CONFIG.AUTO_REPUTATION_RECALC) {
    return;
  }

  try {
    const result = await reputationRepository.recalculate(userId);

    if (result.success) {
      logger.info('Reputation recalculated via trigger', {
        userId,
        reason,
        newScore: result.data || 0,
      });

      // Revalidate cache after reputation change
      revalidateUserPages();

      // Check reputation-based badges
      await runBadgeCheck(userId, 'reputation_changed');
    } else {
      logger.error('Reputation recalculation failed', new Error(result.error || 'Unknown error'), {
        userId,
        reason,
      });
    }
  } catch (error) {
    logger.error(
      'Reputation recalculation failed in trigger',
      error instanceof Error ? error : new Error(String(error)),
      { userId, reason }
    );
  }
}

// =============================================================================
// TRIGGER FUNCTIONS
// =============================================================================

/**
 * Trigger after user creates a post
 *
 * Actions:
 * - Check post-count badges
 * - Recalculate reputation (if post receives engagement)
 *
 * @example
 * ```ts
 * // In post creation action
 * await createPost(data);
 * triggerPostCreated(userId); // Fire and forget
 * ```
 */
export function triggerPostCreated(userId: string): void {
  if (TRIGGER_CONFIG.ASYNC_BADGE_CHECKS) {
    // Run asynchronously (non-blocking)
    runBadgeCheck(userId, 'post_created').catch(() => {
      // Error already logged in runBadgeCheck
    });
  } else {
    // Run synchronously (for testing)
    runBadgeCheck(userId, 'post_created').catch((error) => {
      logger.error(
        'Badge check failed',
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
    });
  }
}

/**
 * Trigger after user creates a comment
 *
 * Actions:
 * - Check comment-count badges
 * - Potentially recalculate reputation
 */
export function triggerCommentCreated(userId: string): void {
  if (TRIGGER_CONFIG.ASYNC_BADGE_CHECKS) {
    runBadgeCheck(userId, 'comment_created').catch(() => {
      // Error already logged in runBadgeCheck
    });
  } else {
    runBadgeCheck(userId, 'comment_created').catch((error) => {
      logger.error(
        'Badge check failed',
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
    });
  }
}

/**
 * Trigger after user receives a vote on their content
 *
 * Actions:
 * - Check vote-count badges
 * - Recalculate reputation (votes contribute to reputation)
 * - Check reputation-based badges
 */
export function triggerVoteReceived(userId: string): void {
  if (TRIGGER_CONFIG.ASYNC_BADGE_CHECKS) {
    runBadgeCheck(userId, 'vote_received').catch(() => {
      // Error already logged in runBadgeCheck
    });
    recalculateUserReputation(userId, 'vote_received').catch(() => {
      // Error already logged in recalculateUserReputation
    });
  } else {
    Promise.all([
      runBadgeCheck(userId, 'vote_received'),
      recalculateUserReputation(userId, 'vote_received'),
    ]).catch((error) => {
      logger.error('Trigger failed', error instanceof Error ? error : new Error(String(error)), {
        userId,
      });
    });
  }
}

/**
 * Trigger after user gains a follower
 *
 * Actions:
 * - Check follower-count badges
 */
export function triggerFollowerGained(userId: string): void {
  if (TRIGGER_CONFIG.ASYNC_BADGE_CHECKS) {
    runBadgeCheck(userId, 'follower_gained').catch(() => {
      // Error already logged in runBadgeCheck
    });
  } else {
    runBadgeCheck(userId, 'follower_gained').catch((error) => {
      logger.error(
        'Badge check failed',
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
    });
  }
}

/**
 * Trigger after submission is merged
 *
 * Actions:
 * - Check submission-count badges
 * - Recalculate reputation (submissions award reputation)
 */
export function triggerSubmissionMerged(userId: string): void {
  if (TRIGGER_CONFIG.ASYNC_BADGE_CHECKS) {
    runBadgeCheck(userId, 'submission_merged').catch(() => {
      // Error already logged in runBadgeCheck
    });
    recalculateUserReputation(userId, 'submission_merged').catch(() => {
      // Error already logged in recalculateUserReputation
    });
  } else {
    Promise.all([
      runBadgeCheck(userId, 'submission_merged'),
      recalculateUserReputation(userId, 'submission_merged'),
    ]).catch((error) => {
      logger.error('Trigger failed', error instanceof Error ? error : new Error(String(error)), {
        userId,
      });
    });
  }
}

/**
 * Trigger after user writes a review
 *
 * Actions:
 * - Check review-count badges
 */
export function triggerReviewCreated(userId: string): void {
  if (TRIGGER_CONFIG.ASYNC_BADGE_CHECKS) {
    runBadgeCheck(userId, 'review_created').catch(() => {
      // Error already logged in runBadgeCheck
    });
  } else {
    runBadgeCheck(userId, 'review_created').catch((error) => {
      logger.error(
        'Badge check failed',
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
    });
  }
}

/**
 * Trigger after user's content receives a bookmark
 *
 * Actions:
 * - Check bookmark-count badges
 * - Recalculate reputation (bookmarks may contribute to reputation)
 */
export function triggerBookmarkReceived(userId: string): void {
  if (TRIGGER_CONFIG.ASYNC_BADGE_CHECKS) {
    runBadgeCheck(userId, 'bookmark_received').catch(() => {
      // Error already logged in runBadgeCheck
    });
    recalculateUserReputation(userId, 'bookmark_received').catch(() => {
      // Error already logged in recalculateUserReputation
    });
  } else {
    Promise.all([
      runBadgeCheck(userId, 'bookmark_received'),
      recalculateUserReputation(userId, 'bookmark_received'),
    ]).catch((error) => {
      logger.error('Trigger failed', error instanceof Error ? error : new Error(String(error)), {
        userId,
      });
    });
  }
}

/**
 * Manual trigger for full badge check
 *
 * Useful for:
 * - User clicking "Check for badges" button
 * - Admin re-checking user badges
 * - Background jobs
 *
 * @returns Promise with badge award results
 */
export async function triggerManualBadgeCheck(userId: string): Promise<{
  success: boolean;
  badgesAwarded: number;
  badges: string[];
}> {
  try {
    const results = await checkAndAwardBadges(userId, 'manual');
    const awardedBadges = results.filter((r) => r.awarded);

    if (awardedBadges.length > 0) {
      revalidateUserPages();
    }

    return {
      success: true,
      badgesAwarded: awardedBadges.length,
      badges: awardedBadges.map((b) => b.badgeSlug),
    };
  } catch (error) {
    logger.error(
      'Manual badge check failed',
      error instanceof Error ? error : new Error(String(error)),
      { userId }
    );
    return {
      success: false,
      badgesAwarded: 0,
      badges: [],
    };
  }
}

/**
 * Manual trigger for reputation recalculation
 *
 * Useful for:
 * - User clicking "Recalculate reputation" button
 * - Admin fixing reputation scores
 * - Background jobs
 *
 * @returns Promise with new reputation score
 */
export async function triggerManualReputationRecalc(userId: string): Promise<{
  success: boolean;
  newScore?: number;
}> {
  try {
    const result = await reputationRepository.recalculate(userId);

    if (result.success && result.data !== undefined) {
      revalidateUserPages();

      // Check if new reputation unlocks badges
      await runBadgeCheck(userId, 'reputation_changed');

      return {
        success: true,
        newScore: result.data,
      };
    }
    return {
      success: false,
    };
  } catch (error) {
    logger.error(
      'Manual reputation recalculation failed',
      error instanceof Error ? error : new Error(String(error)),
      { userId }
    );
    return {
      success: false,
    };
  }
}

// =============================================================================
// BATCH TRIGGERS (For background jobs)
// =============================================================================

/**
 * Batch recalculate reputation for multiple users
 * Useful for nightly jobs or after system changes
 *
 * @param userIds - Array of user IDs
 * @returns Map of userId -> new score
 */
export async function batchRecalculateReputation(userIds: string[]): Promise<Map<string, number>> {
  const results = new Map<string, number>();

  logger.info('Starting batch reputation recalculation', {
    userCount: userIds.length,
  });

  for (const userId of userIds) {
    try {
      const result = await reputationRepository.recalculate(userId);
      if (result.success && result.data !== undefined) {
        results.set(userId, result.data);
      }
    } catch (error) {
      logger.error(
        'Failed to recalculate reputation in batch',
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
    }
  }

  logger.info('Batch reputation recalculation completed', {
    userCount: userIds.length,
    successCount: results.size,
  });

  return results;
}
