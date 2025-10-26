/**
 * Review Repository
 *
 * Provides data access layer for review ratings and helpful votes.
 * Handles both reviews and helpful vote tracking with performance monitoring.
 *
 * Production Standards:
 * - Type-safe Supabase integration
 * - Built-in caching (5-minute TTL)
 * - Automatic error handling and logging
 * - Performance monitoring for every query
 * - Aggregation support for ratings and stats
 *
 * @module repositories/review
 */

import { UI_CONFIG } from '@/src/lib/constants';
import {
  BaseRepository,
  type QueryOptions,
  type RepositoryResult,
} from '@/src/lib/repositories/base.repository';
import { createClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/database.types';

// =====================================================
// TYPES & SCHEMAS
// =====================================================

/** Review entity type from database */
export type Review = Database['public']['Tables']['review_ratings']['Row'];
export type ReviewInsert = Database['public']['Tables']['review_ratings']['Insert'];
export type ReviewUpdate = Database['public']['Tables']['review_ratings']['Update'];

/** Review helpful vote entity */
export type ReviewHelpfulVote = Database['public']['Tables']['review_helpful_votes']['Row'];
export type ReviewHelpfulVoteInsert =
  Database['public']['Tables']['review_helpful_votes']['Insert'];

/** Review with user info (for display) */
export interface ReviewWithUser extends Review {
  user?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
}

/** Review statistics */
export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// =====================================================
// REPOSITORY IMPLEMENTATION
// =====================================================

/**
 * ReviewRepository
 * Handles all review data access with caching and aggregations
 */
export class ReviewRepository extends BaseRepository<Review, string> {
  constructor() {
    super('ReviewRepository');
  }

  /**
   * Find review by ID
   */
  async findById(id: string): Promise<RepositoryResult<Review | null>> {
    return this.executeOperation('findById', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('review_ratings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find review: ${error.message}`);
      }

      if (data) {
      }

      return data;
    });
  }

  /**
   * Find all reviews with optional filtering and pagination
   */
  async findAll(options?: QueryOptions): Promise<RepositoryResult<Review[]>> {
    return this.executeOperation('findAll', async () => {
      const supabase = await createClient();
      let query = supabase.from('review_ratings').select('*');

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        const limit = Math.min(
          options.limit ?? UI_CONFIG.pagination.defaultLimit,
          UI_CONFIG.pagination.maxLimit
        );
        query = query.range(options.offset, options.offset + limit - 1);
      }

      if (options?.sortBy) {
        query = query.order(options.sortBy, {
          ascending: options.sortOrder === 'asc',
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find reviews: ${error.message}`);
      }

      return data || [];
    });
  }

  /**
   * Find one review matching criteria
   */
  async findOne(criteria: Partial<Review>): Promise<RepositoryResult<Review | null>> {
    return this.executeOperation('findOne', async () => {
      const supabase = await createClient();
      let query = supabase.from('review_ratings').select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key as keyof Review, value as never);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find review: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Create new review
   */
  async create(data: Omit<Review, 'id'>): Promise<RepositoryResult<Review>> {
    return this.executeOperation('create', async () => {
      const supabase = await createClient();
      const { data: review, error } = await supabase
        .from('review_ratings')
        .insert(data as ReviewInsert)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already reviewed this content');
        }
        throw new Error(`Failed to create review: ${error.message}`);
      }

      return review;
    });
  }

  /**
   * Update existing review
   */
  async update(id: string, data: Partial<Review>): Promise<RepositoryResult<Review>> {
    return this.executeOperation('update', async () => {
      const supabase = await createClient();
      const { data: review, error } = await supabase
        .from('review_ratings')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        } as ReviewUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update review: ${error.message}`);
      }

      if (review) {
      }

      return review;
    });
  }

  /**
   * Delete review
   */
  async delete(id: string, _soft?: boolean): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('delete', async () => {
      const reviewResult = await this.findById(id);
      const review = reviewResult.success ? reviewResult.data : null;

      const supabase = await createClient();
      const { error } = await supabase.from('review_ratings').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete review: ${error.message}`);
      }

      if (review) {
      }

      return true;
    });
  }

  /**
   * Check if review exists
   */
  async exists(id: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('exists', async () => {
      const result = await this.findById(id);
      return result.success && result.data !== null;
    });
  }

  /**
   * Count reviews matching criteria
   */
  async count(criteria?: Partial<Review>): Promise<RepositoryResult<number>> {
    return this.executeOperation('count', async () => {
      const supabase = await createClient();
      let query = supabase.from('review_ratings').select('*', { count: 'exact', head: true });

      if (criteria) {
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key as keyof Review, value as never);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count reviews: ${error.message}`);
      }

      return count || 0;
    });
  }

  // =====================================================
  // CUSTOM REVIEW METHODS
  // =====================================================

  /**
   * Find reviews by content
   */
  async findByContent(
    contentType: string,
    contentSlug: string,
    options?: QueryOptions
  ): Promise<RepositoryResult<Review[]>> {
    return this.executeOperation('findByContent', async () => {
      if (!(options?.offset || options?.limit)) {
      }

      const supabase = await createClient();
      let query = supabase
        .from('review_ratings')
        .select('*')
        .eq('content_type', contentType)
        .eq('content_slug', contentSlug);

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        const limit = Math.min(
          options.limit ?? UI_CONFIG.pagination.defaultLimit,
          UI_CONFIG.pagination.maxLimit
        );
        query = query.range(options.offset, options.offset + limit - 1);
      }

      query = query.order(options?.sortBy || 'created_at', {
        ascending: options?.sortOrder === 'asc',
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find content reviews: ${error.message}`);
      }

      if (!(options?.offset || options?.limit) && data) {
      }

      return data || [];
    });
  }

  /**
   * Find review by user and content
   */
  async findByUserAndContent(
    userId: string,
    contentType: string,
    contentSlug: string
  ): Promise<RepositoryResult<Review | null>> {
    return this.executeOperation('findByUserAndContent', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('review_ratings')
        .select('*')
        .eq('user_id', userId)
        .eq('content_type', contentType)
        .eq('content_slug', contentSlug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find review: ${error.message}`);
      }

      if (data) {
      }

      return data;
    });
  }

  /**
   * Find reviews by user
   */
  async findByUser(userId: string, options?: QueryOptions): Promise<RepositoryResult<Review[]>> {
    return this.executeOperation('findByUser', async () => {
      if (!(options?.offset || options?.limit)) {
      }

      const supabase = await createClient();
      let query = supabase.from('review_ratings').select('*').eq('user_id', userId);

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        const limit = Math.min(
          options.limit ?? UI_CONFIG.pagination.defaultLimit,
          UI_CONFIG.pagination.maxLimit
        );
        query = query.range(options.offset, options.offset + limit - 1);
      }

      query = query.order(options?.sortBy || 'created_at', {
        ascending: options?.sortOrder === 'asc',
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find user reviews: ${error.message}`);
      }

      if (!(options?.offset || options?.limit) && data) {
      }

      return data || [];
    });
  }

  /**
   * Get review statistics for content
   */
  async getStats(contentType: string, contentSlug: string): Promise<RepositoryResult<ReviewStats>> {
    return this.executeOperation('getStats', async () => {
      const supabase = await createClient();
      const { data: reviews, error } = await supabase
        .from('review_ratings')
        .select('rating')
        .eq('content_type', contentType)
        .eq('content_slug', contentSlug);

      if (error) {
        throw new Error(`Failed to get review stats: ${error.message}`);
      }

      const totalReviews = reviews?.length || 0;

      if (totalReviews === 0) {
        const stats: ReviewStats = {
          total_reviews: 0,
          average_rating: 0,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
        return stats;
      }

      // Calculate average and distribution
      const ratingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = ratingSum / totalReviews;

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach((r) => {
        distribution[r.rating as 1 | 2 | 3 | 4 | 5] =
          (distribution[r.rating as 1 | 2 | 3 | 4 | 5] || 0) + 1;
      });

      const stats: ReviewStats = {
        total_reviews: totalReviews,
        average_rating: Math.round(averageRating * 10) / 10,
        rating_distribution: distribution,
      };

      return stats;
    });
  }

  /**
   * Increment helpful count
   */
  async incrementHelpfulCount(reviewId: string): Promise<RepositoryResult<Review>> {
    return this.executeOperation('incrementHelpfulCount', async () => {
      const supabase = await createClient();

      // Get current review
      const reviewResult = await this.findById(reviewId);
      if (!(reviewResult.success && reviewResult.data)) {
        throw new Error('Review not found');
      }

      const review = reviewResult.data;
      const newCount = review.helpful_count + 1;

      const { data, error } = await supabase
        .from('review_ratings')
        .update({ helpful_count: newCount } as ReviewUpdate)
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to increment helpful count: ${error.message}`);
      }

      return data;
    });
  }

  /**
   * Decrement helpful count
   */
  async decrementHelpfulCount(reviewId: string): Promise<RepositoryResult<Review>> {
    return this.executeOperation('decrementHelpfulCount', async () => {
      const supabase = await createClient();

      // Get current review
      const reviewResult = await this.findById(reviewId);
      if (!(reviewResult.success && reviewResult.data)) {
        throw new Error('Review not found');
      }

      const review = reviewResult.data;
      const newCount = Math.max(0, review.helpful_count - 1);

      const { data, error } = await supabase
        .from('review_ratings')
        .update({ helpful_count: newCount } as ReviewUpdate)
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to decrement helpful count: ${error.message}`);
      }

      return data;
    });
  }

  // =====================================================
  // HELPFUL VOTE METHODS
  // =====================================================

  /**
   * Add helpful vote
   */
  async addHelpfulVote(
    reviewId: string,
    userId: string
  ): Promise<RepositoryResult<ReviewHelpfulVote>> {
    return this.executeOperation('addHelpfulVote', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('review_helpful_votes')
        .insert({
          review_id: reviewId,
          user_id: userId,
        } as ReviewHelpfulVoteInsert)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already voted this review as helpful');
        }
        throw new Error(`Failed to add helpful vote: ${error.message}`);
      }

      // Increment helpful count
      await this.incrementHelpfulCount(reviewId);

      return data;
    });
  }

  /**
   * Remove helpful vote
   */
  async removeHelpfulVote(reviewId: string, userId: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('removeHelpfulVote', async () => {
      const supabase = await createClient();
      const { error } = await supabase
        .from('review_helpful_votes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to remove helpful vote: ${error.message}`);
      }

      // Decrement helpful count
      await this.decrementHelpfulCount(reviewId);

      return true;
    });
  }

  /**
   * Check if user has voted review as helpful
   */
  async hasUserVotedHelpful(reviewId: string, userId: string): Promise<RepositoryResult<boolean>> {
    return this.executeOperation('hasUserVotedHelpful', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('review_helpful_votes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to check helpful vote: ${error.message}`);
      }

      return !!data;
    });
  }
}

/**
 * Singleton instance
 */
export const reviewRepository = new ReviewRepository();
