/**
 * Activity Repository
 *
 * Provides data access layer for user activity aggregation with caching and performance monitoring.
 * Handles activity summary stats and timeline queries across posts, comments, votes, and submissions.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Parallel queries for activity counts
 * - Support for activity filtering and pagination
 *
 * @module repositories/activity
 */

import { CachedRepository, type RepositoryResult } from '@/src/lib/repositories/base.repository';
import { createClient } from '@/src/lib/supabase/server';

// =====================================================
// TYPES & SCHEMAS
// =====================================================

/** Activity summary stats */
export type ActivitySummary = {
  total_posts: number;
  total_comments: number;
  total_votes: number;
  total_submissions: number;
  merged_submissions: number;
  total_activity: number;
};

/** Activity item types */
export type PostActivity = {
  id: string;
  type: 'post';
  title: string;
  url: string | null;
  vote_count: number;
  comment_count: number;
  created_at: string;
};

export type CommentActivity = {
  id: string;
  type: 'comment';
  content: string;
  post_id: string;
  post_title: string;
  created_at: string;
};

export type VoteActivity = {
  id: string;
  type: 'vote';
  post_id: string;
  post_title: string;
  created_at: string;
};

export type SubmissionActivity = {
  id: string;
  type: 'submission';
  content_type: string;
  content_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'merged';
  pr_url: string | null;
  created_at: string;
};

export type Activity = PostActivity | CommentActivity | VoteActivity | SubmissionActivity;

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * ActivityRepository
 * Handles user activity aggregation and timeline queries
 */
export class ActivityRepository extends CachedRepository<ActivitySummary, string> {
  constructor() {
    super('ActivityRepository', 5 * 60 * 1000); // 5-minute cache TTL
  }

  /**
   * Get activity summary for a user
   * Returns total counts across all activity types
   */
  async getSummary(userId: string): Promise<RepositoryResult<ActivitySummary>> {
    return this.executeOperation('getSummary', async () => {
      const cacheKey = this.getCacheKey('summary', userId);
      const cached = this.getFromCache<ActivitySummary>(cacheKey);
      if (cached) return cached;

      const supabase = await createClient();

      // Run all count queries in parallel for performance
      const [postsResult, commentsResult, votesResult, submissionsResult, mergedResult] =
        await Promise.all([
          // Posts count
          supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),

          // Comments count
          supabase
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),

          // Votes count
          supabase
            .from('votes')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),

          // Total submissions
          supabase
            .from('submissions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),

          // Merged submissions
          supabase
            .from('submissions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'merged'),
        ]);

      // Check for errors
      if (postsResult.error) {
        throw new Error(`Failed to count posts: ${postsResult.error.message}`);
      }
      if (commentsResult.error) {
        throw new Error(`Failed to count comments: ${commentsResult.error.message}`);
      }
      if (votesResult.error) {
        throw new Error(`Failed to count votes: ${votesResult.error.message}`);
      }
      if (submissionsResult.error) {
        throw new Error(`Failed to count submissions: ${submissionsResult.error.message}`);
      }
      if (mergedResult.error) {
        throw new Error(`Failed to count merged submissions: ${mergedResult.error.message}`);
      }

      const postsCount = postsResult.count || 0;
      const commentsCount = commentsResult.count || 0;
      const votesCount = votesResult.count || 0;
      const submissionsCount = submissionsResult.count || 0;
      const mergedCount = mergedResult.count || 0;

      const summary: ActivitySummary = {
        total_posts: postsCount,
        total_comments: commentsCount,
        total_votes: votesCount,
        total_submissions: submissionsCount,
        merged_submissions: mergedCount,
        total_activity: postsCount + commentsCount + votesCount + submissionsCount,
      };

      // Cache the result
      this.setCache(cacheKey, summary);

      return summary;
    });
  }

  /**
   * Get activity timeline for a user
   * Returns combined activity stream sorted by date
   */
  async getTimeline(
    userId: string,
    options?: {
      type?: 'post' | 'comment' | 'vote' | 'submission';
      limit?: number;
      offset?: number;
    }
  ): Promise<
    RepositoryResult<{
      activities: Activity[];
      hasMore: boolean;
    }>
  > {
    return this.executeOperation('getTimeline', async () => {
      const { type, limit = 20, offset = 0 } = options || {};
      const supabase = await createClient();
      const activities: Activity[] = [];

      // Fetch posts if no filter or filter is 'post'
      if (!type || type === 'post') {
        const { data: posts, error } = await supabase
          .from('posts')
          .select('id, title, url, vote_count, comment_count, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1);

        if (error) {
          throw new Error(`Failed to fetch posts: ${error.message}`);
        }

        if (posts) {
          activities.push(
            ...posts.map(
              (post): PostActivity => ({
                id: post.id,
                type: 'post',
                title: post.title,
                url: post.url,
                vote_count: post.vote_count ?? 0,
                comment_count: post.comment_count ?? 0,
                created_at: post.created_at,
              })
            )
          );
        }
      }

      // Fetch comments if no filter or filter is 'comment'
      if (!type || type === 'comment') {
        const { data: comments, error } = await supabase
          .from('comments')
          .select('id, content, post_id, created_at, posts(title)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1);

        if (error) {
          throw new Error(`Failed to fetch comments: ${error.message}`);
        }

        if (comments) {
          activities.push(
            ...comments.map(
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
        const { data: votes, error } = await supabase
          .from('votes')
          .select('id, post_id, created_at, posts(title)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1);

        if (error) {
          throw new Error(`Failed to fetch votes: ${error.message}`);
        }

        if (votes) {
          activities.push(
            ...votes.map(
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
        const { data: submissions, error } = await supabase
          .from('submissions')
          .select('id, content_type, content_name, status, pr_url, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1);

        if (error) {
          throw new Error(`Failed to fetch submissions: ${error.message}`);
        }

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
      activities.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Apply limit after sorting
      const limitedActivities = activities.slice(0, limit);

      return {
        activities: limitedActivities,
        hasMore: activities.length > limit,
      };
    });
  }

  // =====================================================
  // REQUIRED ABSTRACT METHOD IMPLEMENTATIONS
  // =====================================================

  async findById(_id: string): Promise<RepositoryResult<ActivitySummary | null>> {
    throw new Error('findById not implemented for ActivityRepository');
  }

  async findAll(): Promise<RepositoryResult<ActivitySummary[]>> {
    throw new Error('findAll not implemented for ActivityRepository');
  }

  async findOne(): Promise<RepositoryResult<ActivitySummary | null>> {
    throw new Error('findOne not implemented for ActivityRepository');
  }

  async create(): Promise<RepositoryResult<ActivitySummary>> {
    throw new Error('create not implemented for ActivityRepository');
  }

  async update(): Promise<RepositoryResult<ActivitySummary>> {
    throw new Error('update not implemented for ActivityRepository');
  }

  async delete(): Promise<RepositoryResult<boolean>> {
    throw new Error('delete not implemented for ActivityRepository');
  }

  async exists(): Promise<RepositoryResult<boolean>> {
    throw new Error('exists not implemented for ActivityRepository');
  }

  async count(): Promise<RepositoryResult<number>> {
    throw new Error('count not implemented for ActivityRepository');
  }
}

/**
 * Singleton instance
 */
export const activityRepository = new ActivityRepository();
