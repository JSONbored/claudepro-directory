/**
 * Reputation Repository
 *
 * Provides data access layer for reputation calculations with caching and performance monitoring.
 * Handles reputation breakdown queries and score tracking.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Aggregated reputation breakdown calculations
 *
 * @module repositories/reputation
 */

import { CachedRepository, type RepositoryResult } from '@/src/lib/repositories/base.repository';
import { createClient } from '@/src/lib/supabase/server';

// =====================================================
// TYPES & SCHEMAS
// =====================================================

/** Reputation breakdown showing how points were earned */
export type ReputationBreakdown = {
  from_posts: number;
  from_votes_received: number;
  from_comments: number;
  from_submissions: number;
  total: number;
};

// Point values for each activity type (matching database function logic)
const REPUTATION_POINTS = {
  POST: 10,
  VOTE: 5,
  COMMENT: 2,
  SUBMISSION: 20,
} as const;

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * ReputationRepository
 * Handles reputation calculation and breakdown queries
 */
export class ReputationRepository extends CachedRepository<ReputationBreakdown, string> {
  constructor() {
    super('ReputationRepository', 5 * 60 * 1000); // 5-minute cache TTL
  }

  /**
   * Get reputation breakdown for a user
   * Shows detailed breakdown of how reputation was earned
   */
  async getBreakdown(userId: string): Promise<RepositoryResult<ReputationBreakdown>> {
    return this.executeOperation('getBreakdown', async () => {
      const cacheKey = this.getCacheKey('breakdown', userId);
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

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

      // Cache the result
      this.setCache(cacheKey, breakdown);

      return breakdown;
    });
  }

  /**
   * Recalculate reputation for a user
   * Calls the database function to recalculate and update reputation score
   */
  async recalculate(userId: string): Promise<RepositoryResult<number>> {
    return this.executeOperation('recalculate', async () => {
      const supabase = await createClient();

      // Call the database function
      const { data, error } = await supabase.rpc('calculate_user_reputation', {
        target_user_id: userId,
      });

      if (error) {
        throw new Error(`Failed to recalculate reputation: ${error.message}`);
      }

      // Clear cache for this user's breakdown
      this.clearCache(this.getCacheKey('breakdown', userId));

      return (data as number) || 0;
    });
  }

  /**
   * Get activity counts for a user
   * Returns raw counts without point calculations
   */
  async getActivityCounts(userId: string): Promise<
    RepositoryResult<{
      posts: number;
      votes: number;
      comments: number;
      submissions: number;
    }>
  > {
    return this.executeOperation('getActivityCounts', async () => {
      const supabase = await createClient();

      // Run all queries in parallel
      const [postsResult, votesResult, commentsResult, submissionsResult] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),

        supabase.from('posts').select('vote_count').eq('user_id', userId),

        supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),

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
  }

  // =====================================================
  // REQUIRED ABSTRACT METHOD IMPLEMENTATIONS
  // =====================================================

  async findById(_id: string): Promise<RepositoryResult<ReputationBreakdown | null>> {
    throw new Error('findById not implemented for ReputationRepository');
  }

  async findAll(): Promise<RepositoryResult<ReputationBreakdown[]>> {
    throw new Error('findAll not implemented for ReputationRepository');
  }

  async findOne(): Promise<RepositoryResult<ReputationBreakdown | null>> {
    throw new Error('findOne not implemented for ReputationRepository');
  }

  async create(): Promise<RepositoryResult<ReputationBreakdown>> {
    throw new Error('create not implemented for ReputationRepository');
  }

  async update(): Promise<RepositoryResult<ReputationBreakdown>> {
    throw new Error('update not implemented for ReputationRepository');
  }

  async delete(): Promise<RepositoryResult<boolean>> {
    throw new Error('delete not implemented for ReputationRepository');
  }

  async exists(): Promise<RepositoryResult<boolean>> {
    throw new Error('exists not implemented for ReputationRepository');
  }

  async count(): Promise<RepositoryResult<number>> {
    throw new Error('count not implemented for ReputationRepository');
  }
}

/**
 * Singleton instance
 */
export const reputationRepository = new ReputationRepository();
