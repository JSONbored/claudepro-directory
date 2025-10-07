'use server';

/**
 * Reputation Actions
 * Server actions for reputation management and calculation
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { reputationBreakdownSchema } from '@/src/lib/schemas/activity.schema';
import { createClient } from '@/src/lib/supabase/server';

/**
 * Manually recalculate user's reputation
 * Useful for debugging or if automatic triggers fail
 */
export const recalculateReputation = rateLimitedAction
  .metadata({
    actionName: 'recalculateReputation',
    category: 'user',
    rateLimit: {
      maxRequests: 5, // Limit recalculations
      windowSeconds: 60,
    },
  })
  .schema(z.void())
  .outputSchema(z.object({ new_score: z.number().int().nonnegative() }))
  .action(async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to recalculate reputation');
    }

    // Call the database function
    const { data, error } = await supabase.rpc('calculate_user_reputation', {
      target_user_id: user.id,
    });

    if (error) {
      throw new Error(`Failed to recalculate reputation: ${error.message}`);
    }

    // Get updated profile
    const { data: profile } = await supabase
      .from('users')
      .select('slug')
      .eq('id', user.id)
      .single();

    // Revalidate paths
    if (profile?.slug) {
      revalidatePath(`/u/${profile.slug}`);
    }
    revalidatePath('/account');
    revalidatePath('/account/activity');

    return {
      new_score: data as number,
    };
  });

/**
 * Get reputation breakdown
 * Shows how reputation was earned
 */
export const getReputationBreakdown = rateLimitedAction
  .metadata({
    actionName: 'getReputationBreakdown',
    category: 'user',
  })
  .schema(z.void())
  .outputSchema(reputationBreakdownSchema)
  .action(async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to view reputation breakdown');
    }

    // Get counts for each activity type
    const [postsResult, votesResult, commentsResult, submissionsResult] = await Promise.all([
      // Posts count
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),

      // Total votes received on user's posts
      supabase
        .from('posts')
        .select('vote_count')
        .eq('user_id', user.id),

      // Comments count
      supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),

      // Merged submissions count
      supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'merged'),
    ]);

    // Calculate points
    const postCount = postsResult.count || 0;
    const totalVotes =
      votesResult.data?.reduce((sum, post) => sum + (post.vote_count || 0), 0) || 0;
    const commentCount = commentsResult.count || 0;
    const mergedCount = submissionsResult.count || 0;

    const breakdown = {
      from_posts: postCount * 10,
      from_votes_received: totalVotes * 5,
      from_comments: commentCount * 2,
      from_submissions: mergedCount * 20,
      total: postCount * 10 + totalVotes * 5 + commentCount * 2 + mergedCount * 20,
    };

    return breakdown;
  });
