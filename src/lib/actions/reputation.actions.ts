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
import { logger } from '@/src/lib/logger';
import { publicPostsRowSchema } from '@/src/lib/schemas/generated/db-schemas';
import { nonEmptyString } from '@/src/lib/schemas/primitives';
import { createClient } from '@/src/lib/supabase/server';
import { validateRows } from '@/src/lib/supabase/validators';
import type { Tables } from '@/src/types/database.types';

// Database-driven types
type ReputationAction = Tables<'reputation_actions'>;
type ReputationTier = Tables<'reputation_tiers'>;

// Schemas for validation
const reputationBreakdownSchema = z.object({
  from_posts: z.number().int().nonnegative(),
  from_votes_received: z.number().int().nonnegative(),
  from_comments: z.number().int().nonnegative(),
  from_submissions: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

type ReputationBreakdown = z.infer<typeof reputationBreakdownSchema>;

const activityCountsSchema = z.object({
  posts: z.number().int().nonnegative(),
  votes: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
  submissions: z.number().int().nonnegative(),
});

type ActivityCounts = z.infer<typeof activityCountsSchema>;

// Inline DB queries (NO helper files)
async function getReputationPoints(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('reputation_actions')
    .select('action_type, points')
    .eq('active', true);

  const points: Record<string, number> = {};
  for (const action of data || []) {
    points[action.action_type] = action.points;
  }
  return points;
}

async function getReputationTiers(): Promise<ReputationTier[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('reputation_tiers')
    .select('*')
    .eq('active', true)
    .order('order', { ascending: true });

  return data || [];
}

function getReputationTier(score: number, tiers: ReputationTier[]): ReputationTier {
  return (
    tiers.find(
      (tier) => score >= tier.min_score && (tier.max_score === null || score <= tier.max_score)
    ) || tiers[0]!
  );
}

function getNextTier(currentScore: number, tiers: ReputationTier[]) {
  const currentTier = getReputationTier(currentScore, tiers);
  const currentIndex = tiers.findIndex((t) => t.name === currentTier.name);

  if (currentIndex === tiers.length - 1) {
    return null;
  }

  const nextTier = tiers[currentIndex + 1]!;
  const pointsNeeded = nextTier.min_score - currentScore;

  return {
    tier: nextTier,
    pointsNeeded,
  };
}

function getTierProgress(currentScore: number, tiers: ReputationTier[]): number {
  const currentTier = getReputationTier(currentScore, tiers);
  if (currentTier.max_score === null) {
    return 100;
  }

  const tierRange = currentTier.max_score - currentTier.min_score;
  const scoreInTier = currentScore - currentTier.min_score;
  return Math.min(100, Math.round((scoreInTier / tierRange) * 100));
}

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

    const supabase = await createClient();

    // Fetch reputation points from database
    const points = await getReputationPoints();
    const tiers = await getReputationTiers();

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

    // Calculate points using database values
    const postCount = postsResult.count || 0;

    // Validate votes data
    const validated_votes = validateRows(
      publicPostsRowSchema.pick({ vote_count: true }),
      votesResult.data || [],
      { schemaName: 'PostVoteCount' }
    );
    const totalVotes = validated_votes.reduce((sum, post) => sum + (post.vote_count || 0), 0);

    const commentCount = commentsResult.count || 0;
    const mergedCount = submissionsResult.count || 0;

    const breakdown: ReputationBreakdown = {
      from_posts: postCount * (points.post || 0),
      from_votes_received: totalVotes * (points.vote_received || 0),
      from_comments: commentCount * (points.comment || 0),
      from_submissions: mergedCount * (points.submission_merged || 0),
      total:
        postCount * (points.post || 0) +
        totalVotes * (points.vote_received || 0) +
        commentCount * (points.comment || 0) +
        mergedCount * (points.submission_merged || 0),
    };

    // Calculate tier information
    const currentTier = getReputationTier(breakdown.total, tiers);
    const nextTier = getNextTier(breakdown.total, tiers);
    const progress = getTierProgress(breakdown.total, tiers);

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
  tier: ReputationTier;
  progress: number;
  activityCounts: ActivityCounts;
}> {
  // Validate input
  const validatedUserId = nonEmptyString.uuid().parse(targetUserId);

  const supabase = await createClient();

  // Fetch reputation points from database
  const points = await getReputationPoints();
  const tiers = await getReputationTiers();

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

  // Calculate counts and points using database values
  const postCount = postsResult.count || 0;
  const totalVotes = votesResult.data?.reduce((sum, post) => sum + (post.vote_count || 0), 0) || 0;
  const commentCount = commentsResult.count || 0;
  const mergedCount = submissionsResult.count || 0;

  const breakdown: ReputationBreakdown = {
    from_posts: postCount * (points.post || 0),
    from_votes_received: totalVotes * (points.vote_received || 0),
    from_comments: commentCount * (points.comment || 0),
    from_submissions: mergedCount * (points.submission_merged || 0),
    total:
      postCount * (points.post || 0) +
      totalVotes * (points.vote_received || 0) +
      commentCount * (points.comment || 0) +
      mergedCount * (points.submission_merged || 0),
  };

  const activityCounts: ActivityCounts = {
    posts: postCount,
    votes: totalVotes,
    comments: commentCount,
    submissions: mergedCount,
  };

  // Calculate tier info
  const tier = getReputationTier(breakdown.total, tiers);
  const progress = getTierProgress(breakdown.total, tiers);

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
