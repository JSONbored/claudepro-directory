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
import { userIdSchema } from '@/src/lib/schemas/branded-types.schema';
import { createClient } from '@/src/lib/supabase/server';

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

    // Fetch breakdown using direct PostgREST queries
    const supabase = await createClient();

    // Run all queries in parallel for performance
    const [postsResult, votesResult, commentsResult, submissionsResult] = await Promise.all([
      // Posts count
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Total votes received on user's posts
      supabase
        .from('posts')
        .select('vote_count')
        .eq('user_id', userId),

      // Comments count
      supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Merged submissions count
      supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'merged'),
    ]);

    // Check for errors
    if (postsResult.error) {
      throw new Error(`Failed to fetch posts: ${postsResult.error.message}`);
    }
    if (votesResult.error) {
      throw new Error(`Failed to fetch votes: ${votesResult.error.message}`);
    }
    if (commentsResult.error) {
      throw new Error(`Failed to fetch comments: ${commentsResult.error.message}`);
    }
    if (submissionsResult.error) {
      throw new Error(`Failed to fetch submissions: ${submissionsResult.error.message}`);
    }

    // Calculate points
    const REPUTATION_POINTS = {
      POST: 10,
      VOTE: 5,
      COMMENT: 2,
      SUBMISSION: 20,
    } as const;

    const postCount = postsResult.count || 0;
    const totalVotes =
      votesResult.data?.reduce((sum, post) => sum + (post.vote_count || 0), 0) || 0;
    const commentCount = commentsResult.count || 0;
    const mergedCount = submissionsResult.count || 0;

    const breakdown: ReputationBreakdown = {
      from_posts: postCount * REPUTATION_POINTS.POST,
      from_votes_received: totalVotes * REPUTATION_POINTS.VOTE,
      from_comments: commentCount * REPUTATION_POINTS.COMMENT,
      from_submissions: mergedCount * REPUTATION_POINTS.SUBMISSION,
      total:
        postCount * REPUTATION_POINTS.POST +
        totalVotes * REPUTATION_POINTS.VOTE +
        commentCount * REPUTATION_POINTS.COMMENT +
        mergedCount * REPUTATION_POINTS.SUBMISSION,
    };

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

    const supabase = await createClient();

    // Run all queries in parallel
    const [postsResult, votesResult, commentsResult, submissionsResult] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('posts').select('vote_count').eq('user_id', userId),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'merged'),
    ]);

    // Check for errors
    if (postsResult.error) {
      throw new Error(`Failed to fetch posts: ${postsResult.error.message}`);
    }
    if (votesResult.error) {
      throw new Error(`Failed to fetch votes: ${votesResult.error.message}`);
    }
    if (commentsResult.error) {
      throw new Error(`Failed to fetch comments: ${commentsResult.error.message}`);
    }
    if (submissionsResult.error) {
      throw new Error(`Failed to fetch submissions: ${submissionsResult.error.message}`);
    }

    return {
      posts: postsResult.count || 0,
      votes: votesResult.data?.reduce((sum, post) => sum + (post.vote_count || 0), 0) || 0,
      comments: commentsResult.count || 0,
      submissions: submissionsResult.count || 0,
    };
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

    const supabase = await createClient();

    // Call the database RPC function
    const { data, error } = await supabase.rpc('calculate_user_reputation', {
      target_user_id: userId,
    });

    if (error) {
      logger.error('Failed to recalculate reputation', new Error(error.message), {
        userId,
      });
      throw new Error(`Failed to recalculate reputation: ${error.message}`);
    }

    const newScore = (data as number) || 0;

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

  const supabase = await createClient();

  // Fetch all data in parallel (single round trip)
  const [postsResult, votesResult, commentsResult, submissionsResult] = await Promise.all([
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', validatedUserId),
    supabase.from('posts').select('vote_count').eq('user_id', validatedUserId),
    supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', validatedUserId),
    supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', validatedUserId)
      .eq('status', 'merged'),
  ]);

  // Check for errors
  if (postsResult.error) {
    throw new Error(`Failed to fetch posts: ${postsResult.error.message}`);
  }
  if (votesResult.error) {
    throw new Error(`Failed to fetch votes: ${votesResult.error.message}`);
  }
  if (commentsResult.error) {
    throw new Error(`Failed to fetch comments: ${commentsResult.error.message}`);
  }
  if (submissionsResult.error) {
    throw new Error(`Failed to fetch submissions: ${submissionsResult.error.message}`);
  }

  // Calculate counts and points
  const REPUTATION_POINTS = {
    POST: 10,
    VOTE: 5,
    COMMENT: 2,
    SUBMISSION: 20,
  } as const;

  const postCount = postsResult.count || 0;
  const totalVotes = votesResult.data?.reduce((sum, post) => sum + (post.vote_count || 0), 0) || 0;
  const commentCount = commentsResult.count || 0;
  const mergedCount = submissionsResult.count || 0;

  const breakdown: ReputationBreakdown = {
    from_posts: postCount * REPUTATION_POINTS.POST,
    from_votes_received: totalVotes * REPUTATION_POINTS.VOTE,
    from_comments: commentCount * REPUTATION_POINTS.COMMENT,
    from_submissions: mergedCount * REPUTATION_POINTS.SUBMISSION,
    total:
      postCount * REPUTATION_POINTS.POST +
      totalVotes * REPUTATION_POINTS.VOTE +
      commentCount * REPUTATION_POINTS.COMMENT +
      mergedCount * REPUTATION_POINTS.SUBMISSION,
  };

  const activityCounts: ActivityCounts = {
    posts: postCount,
    votes: totalVotes,
    comments: commentCount,
    submissions: mergedCount,
  };

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
