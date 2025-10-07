'use server';

/**
 * Activity Actions
 * Server actions for fetching and aggregating user activity
 */

import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import {
  type Activity,
  type ActivitySummary,
  activityFilterSchema,
  activitySummarySchema,
  activityTimelineResponseSchema,
  type CommentActivity,
  type PostActivity,
  type SubmissionActivity,
  type VoteActivity,
} from '@/src/lib/schemas/activity.schema';
import { createClient } from '@/src/lib/supabase/server';

// Supabase query result types
type CommentWithPost = {
  id: string;
  content: string;
  post_id: string;
  created_at: string;
  posts: { title: string } | null;
};

type VoteWithPost = {
  id: string;
  post_id: string;
  created_at: string;
  posts: { title: string } | null;
};

/**
 * Get user's activity summary statistics
 */
export const getActivitySummary = rateLimitedAction
  .metadata({
    actionName: 'getActivitySummary',
    category: 'user',
  })
  .schema(z.void())
  .outputSchema(activitySummarySchema)
  .action(async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to view activity');
    }

    // Use cached function with 5 minute revalidation
    const getCachedSummary = unstable_cache(
      async (userId: string) => {
        // Get posts count
        const { count: postsCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        // Get comments count
        const { count: commentsCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        // Get votes count
        const { count: votesCount } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        // Get submissions stats
        const { count: totalSubmissions } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        const { count: mergedSubmissions } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'merged');

        const summary: ActivitySummary = {
          total_posts: postsCount || 0,
          total_comments: commentsCount || 0,
          total_votes: votesCount || 0,
          total_submissions: totalSubmissions || 0,
          merged_submissions: mergedSubmissions || 0,
          total_activity:
            (postsCount || 0) + (commentsCount || 0) + (votesCount || 0) + (totalSubmissions || 0),
        };

        return summary;
      },
      [`activity-summary-${user.id}`],
      {
        revalidate: 300, // 5 minutes
        tags: ['activity', `user-${user.id}`],
      }
    );

    const summary = await getCachedSummary(user.id);

    return summary;
  });

/**
 * Get user's activity timeline
 */
export const getActivityTimeline = rateLimitedAction
  .metadata({
    actionName: 'getActivityTimeline',
    category: 'user',
  })
  .schema(activityFilterSchema)
  .outputSchema(activityTimelineResponseSchema)
  .action(async ({ parsedInput: { type, limit, offset } }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to view activity');
    }

    const activities: Activity[] = [];

    // Fetch posts if no filter or filter is 'post'
    if (!type || type === 'post') {
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, url, vote_count, comment_count, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (posts) {
        activities.push(
          ...posts.map(
            (post): PostActivity => ({
              id: post.id,
              type: 'post',
              title: post.title,
              url: post.url,
              vote_count: post.vote_count,
              comment_count: post.comment_count,
              created_at: post.created_at,
            })
          )
        );
      }
    }

    // Fetch comments if no filter or filter is 'comment'
    if (!type || type === 'comment') {
      const { data: comments } = await supabase
        .from('comments')
        .select('id, content, post_id, created_at, posts(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (comments) {
        activities.push(
          ...(comments as unknown as CommentWithPost[]).map(
            (comment): CommentActivity => ({
              id: comment.id,
              type: 'comment',
              content: comment.content,
              post_id: comment.post_id,
              post_title: comment.posts?.title || 'Unknown Post',
              created_at: comment.created_at,
            })
          )
        );
      }
    }

    // Fetch votes if no filter or filter is 'vote'
    if (!type || type === 'vote') {
      const { data: votes } = await supabase
        .from('votes')
        .select('id, post_id, created_at, posts(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (votes) {
        activities.push(
          ...(votes as unknown as VoteWithPost[]).map(
            (vote): VoteActivity => ({
              id: vote.id,
              type: 'vote',
              post_id: vote.post_id,
              post_title: vote.posts?.title || 'Unknown Post',
              created_at: vote.created_at,
            })
          )
        );
      }
    }

    // Fetch submissions if no filter or filter is 'submission'
    if (!type || type === 'submission') {
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id, content_type, content_name, status, pr_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (submissions) {
        activities.push(
          ...submissions.map(
            (submission): SubmissionActivity => ({
              id: submission.id,
              type: 'submission',
              content_type: submission.content_type,
              content_name: submission.content_name,
              status: submission.status as 'pending' | 'approved' | 'rejected' | 'merged',
              pr_url: submission.pr_url,
              created_at: submission.created_at,
            })
          )
        );
      }
    }

    // Sort all activities by date
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply limit after sorting
    const limitedActivities = activities.slice(0, limit);

    return {
      activities: limitedActivities,
      hasMore: activities.length > limit,
    };
  });
