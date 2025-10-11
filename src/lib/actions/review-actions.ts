'use server';

/**
 * Review Actions
 * Server actions for managing user reviews and ratings
 *
 * Features:
 * - Create/update/delete reviews with star ratings (1-5)
 * - Mark reviews as helpful (collaborative filtering)
 * - Rate limiting to prevent spam and abuse
 * - Automatic reputation points for helpful reviews
 * - Full type safety with Zod validation
 *
 * Rate Limits:
 * - Create/Update review: 10 per hour (prevents spam)
 * - Mark helpful: 50 per hour (allows engagement)
 * - Delete review: 5 per hour (rarely needed)
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import { nonEmptyString } from '@/src/lib/schemas/primitives/base-strings';
import { contentCategorySchema } from '@/src/lib/schemas/shared.schema';
import { createClient } from '@/src/lib/supabase/server';

// =====================================================
// SCHEMAS
// =====================================================

/**
 * Review input schema
 * Validates review creation/update data
 */
const reviewInputSchema = z.object({
  content_type: contentCategorySchema,
  content_slug: nonEmptyString
    .max(200, 'Content slug is too long')
    .regex(
      /^[a-zA-Z0-9-_/]+$/,
      'Slug can only contain letters, numbers, hyphens, underscores, and forward slashes'
    )
    .transform((val: string) => val.toLowerCase().trim()),
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating must be at most 5 stars'),
  review_text: z
    .string()
    .max(2000, 'Review text must be 2000 characters or less')
    .optional()
    .transform((val) => (val ? val.trim() : undefined)),
});

/**
 * Review update schema
 * Allows updating only rating and review text
 */
const reviewUpdateSchema = z.object({
  review_id: z.string().uuid('Invalid review ID'),
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating must be at most 5 stars')
    .optional(),
  review_text: z
    .string()
    .max(2000, 'Review text must be 2000 characters or less')
    .optional()
    .transform((val) => (val ? val.trim() : undefined)),
});

/**
 * Review delete schema
 */
const reviewDeleteSchema = z.object({
  review_id: z.string().uuid('Invalid review ID'),
});

/**
 * Helpful vote schema
 */
const helpfulVoteSchema = z.object({
  review_id: z.string().uuid('Invalid review ID'),
  helpful: z.boolean().describe('true to mark helpful, false to remove vote'),
});

/**
 * Get reviews query schema
 */
const getReviewsSchema = z.object({
  content_type: contentCategorySchema,
  content_slug: nonEmptyString.max(200),
  sort_by: z.enum(['recent', 'helpful', 'rating_high', 'rating_low']).default('recent'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// =====================================================
// ACTIONS
// =====================================================

/**
 * Create a new review
 *
 * Rate limit: 10 requests per hour per IP
 * Prevents spam while allowing legitimate reviews
 *
 * @param parsedInput - Review data (content_type, content_slug, rating, review_text)
 * @returns Review data or error
 */
export const createReview = rateLimitedAction
  .metadata({
    actionName: 'createReview',
    category: 'user',
    rateLimit: {
      maxRequests: 10, // 10 reviews per hour
      windowSeconds: 3600, // 1 hour
    },
  })
  .schema(reviewInputSchema)
  .action(async ({ parsedInput }: { parsedInput: z.infer<typeof reviewInputSchema> }) => {
    const { content_type, content_slug, rating, review_text } = parsedInput;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to write a review');
    }

    // Check if user has already reviewed this content
    const { data: existingReview } = await supabase
      .from('review_ratings')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', content_type)
      .eq('content_slug', content_slug)
      .single();

    if (existingReview) {
      throw new Error(
        'You have already reviewed this content. Use the update action to modify your review.'
      );
    }

    // Insert review
    const { data, error } = await supabase
      .from('review_ratings')
      .insert({
        user_id: user.id,
        content_type,
        content_slug,
        rating,
        review_text: review_text || null,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create review', new Error(error.message), {
        userId: user.id,
        content_type,
        content_slug,
        error: error.message,
      });
      throw new Error('Failed to create review. Please try again.');
    }

    // Track interaction for personalization
    try {
      await supabase.from('user_interactions').insert({
        user_id: user.id,
        content_type,
        content_slug,
        interaction_type: 'view', // Review implies viewing
        metadata: { source: 'review_creation' },
      });
    } catch (error) {
      // Non-critical, don't fail the review creation
      logger.warn('Failed to track interaction for review', {
        userId: user.id,
        content_type,
        content_slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Revalidate detail page and list pages
    revalidatePath(`/${content_type}/${content_slug}`);
    revalidatePath(`/${content_type}`);
    revalidateTag(`reviews:${content_type}:${content_slug}`);

    logger.info('Review created', {
      userId: user.id,
      reviewId: data.id,
      content_type,
      content_slug,
      rating,
      hasText: !!review_text,
    });

    return {
      success: true,
      review: data,
    };
  });

/**
 * Update an existing review
 *
 * Rate limit: 10 requests per hour per IP
 * Users can only update their own reviews
 *
 * @param parsedInput - Update data (review_id, rating?, review_text?)
 * @returns Updated review data or error
 */
export const updateReview = rateLimitedAction
  .metadata({
    actionName: 'updateReview',
    category: 'user',
    rateLimit: {
      maxRequests: 10, // 10 updates per hour
      windowSeconds: 3600, // 1 hour
    },
  })
  .schema(reviewUpdateSchema)
  .action(async ({ parsedInput }: { parsedInput: z.infer<typeof reviewUpdateSchema> }) => {
    const { review_id, rating, review_text } = parsedInput;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to update a review');
    }

    // Fetch existing review to verify ownership and get content info
    const { data: existingReview, error: fetchError } = await supabase
      .from('review_ratings')
      .select('user_id, content_type, content_slug')
      .eq('id', review_id)
      .single();

    if (fetchError || !existingReview) {
      throw new Error('Review not found');
    }

    if (existingReview.user_id !== user.id) {
      throw new Error('You can only update your own reviews');
    }

    // Build update object
    const updateData: { rating?: number; review_text?: string | null } = {};
    if (rating !== undefined) {
      updateData.rating = rating;
    }
    if (review_text !== undefined) {
      updateData.review_text = review_text || null;
    }

    // If no updates provided, return error
    if (Object.keys(updateData).length === 0) {
      throw new Error('No updates provided');
    }

    // Update review (triggers updated_at trigger)
    const { data, error } = await supabase
      .from('review_ratings')
      .update(updateData)
      .eq('id', review_id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update review', new Error(error.message), {
        userId: user.id,
        reviewId: review_id,
        error: error.message,
      });
      throw new Error('Failed to update review. Please try again.');
    }

    // Revalidate detail page and list pages
    revalidatePath(`/${existingReview.content_type}/${existingReview.content_slug}`);
    revalidatePath(`/${existingReview.content_type}`);
    revalidateTag(`reviews:${existingReview.content_type}:${existingReview.content_slug}`);

    logger.info('Review updated', {
      userId: user.id,
      reviewId: review_id,
      content_type: existingReview.content_type,
      content_slug: existingReview.content_slug,
      updatedFields: Object.keys(updateData).join(', '),
    });

    return {
      success: true,
      review: data,
    };
  });

/**
 * Delete a review
 *
 * Rate limit: 5 requests per hour per IP
 * Users can only delete their own reviews
 *
 * @param parsedInput - Delete data (review_id)
 * @returns Success or error
 */
export const deleteReview = rateLimitedAction
  .metadata({
    actionName: 'deleteReview',
    category: 'user',
    rateLimit: {
      maxRequests: 5, // 5 deletes per hour
      windowSeconds: 3600, // 1 hour
    },
  })
  .schema(reviewDeleteSchema)
  .action(async ({ parsedInput }: { parsedInput: z.infer<typeof reviewDeleteSchema> }) => {
    const { review_id } = parsedInput;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to delete a review');
    }

    // Fetch existing review to verify ownership and get content info
    const { data: existingReview, error: fetchError } = await supabase
      .from('review_ratings')
      .select('user_id, content_type, content_slug')
      .eq('id', review_id)
      .single();

    if (fetchError || !existingReview) {
      throw new Error('Review not found');
    }

    if (existingReview.user_id !== user.id) {
      throw new Error('You can only delete your own reviews');
    }

    // Delete review (cascades to helpful votes)
    const { error } = await supabase.from('review_ratings').delete().eq('id', review_id);

    if (error) {
      logger.error('Failed to delete review', new Error(error.message), {
        userId: user.id,
        reviewId: review_id,
        error: error.message,
      });
      throw new Error('Failed to delete review. Please try again.');
    }

    // Revalidate detail page and list pages
    revalidatePath(`/${existingReview.content_type}/${existingReview.content_slug}`);
    revalidatePath(`/${existingReview.content_type}`);
    revalidateTag(`reviews:${existingReview.content_type}:${existingReview.content_slug}`);

    logger.info('Review deleted', {
      userId: user.id,
      reviewId: review_id,
      content_type: existingReview.content_type,
      content_slug: existingReview.content_slug,
    });

    return {
      success: true,
    };
  });

/**
 * Mark a review as helpful (or remove helpful vote)
 *
 * Rate limit: 50 requests per hour per IP
 * Higher limit to allow engagement
 *
 * @param parsedInput - Vote data (review_id, helpful)
 * @returns Success or error
 */
export const markReviewHelpful = rateLimitedAction
  .metadata({
    actionName: 'markReviewHelpful',
    category: 'user',
    rateLimit: {
      maxRequests: 50, // 50 helpful votes per hour
      windowSeconds: 3600, // 1 hour
    },
  })
  .schema(helpfulVoteSchema)
  .action(async ({ parsedInput }: { parsedInput: z.infer<typeof helpfulVoteSchema> }) => {
    const { review_id, helpful } = parsedInput;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to vote on reviews');
    }

    // Get review to verify it exists and get content info for revalidation
    const { data: review, error: reviewError } = await supabase
      .from('review_ratings')
      .select('id, user_id, content_type, content_slug')
      .eq('id', review_id)
      .single();

    if (reviewError || !review) {
      throw new Error('Review not found');
    }

    // Prevent users from voting on their own reviews
    if (review.user_id === user.id) {
      throw new Error('You cannot vote on your own review');
    }

    if (helpful) {
      // Add helpful vote
      const { error } = await supabase.from('review_helpful_votes').insert({
        review_id,
        user_id: user.id,
      });

      if (error) {
        // Check if it's a duplicate (unique constraint violation)
        if (error.code === '23505') {
          throw new Error('You have already marked this review as helpful');
        }
        logger.error('Failed to add helpful vote', new Error(error.message), {
          userId: user.id,
          reviewId: review_id,
          error: error.message,
        });
        throw new Error('Failed to mark review as helpful. Please try again.');
      }

      logger.info('Review marked helpful', {
        userId: user.id,
        reviewId: review_id,
        reviewAuthor: review.user_id,
      });
    } else {
      // Remove helpful vote
      const { error } = await supabase
        .from('review_helpful_votes')
        .delete()
        .eq('review_id', review_id)
        .eq('user_id', user.id);

      if (error) {
        logger.error('Failed to remove helpful vote', new Error(error.message), {
          userId: user.id,
          reviewId: review_id,
          error: error.message,
        });
        throw new Error('Failed to remove helpful vote. Please try again.');
      }

      logger.info('Helpful vote removed', {
        userId: user.id,
        reviewId: review_id,
      });
    }

    // Revalidate detail page (helpful count changed)
    revalidatePath(`/${review.content_type}/${review.content_slug}`);
    revalidateTag(`reviews:${review.content_type}:${review.content_slug}`);

    return {
      success: true,
      helpful,
    };
  });

/**
 * Get reviews for a content item
 *
 * This is a server action (not rate limited) for fetching reviews
 * Used by ReviewSection component for initial load and pagination
 *
 * @param parsedInput - Query parameters (content_type, content_slug, sort_by, limit, offset)
 * @returns Reviews with user data and helpful vote status
 */
export const getReviews = rateLimitedAction
  .metadata({
    actionName: 'getReviews',
    category: 'content',
    rateLimit: {
      maxRequests: 100, // 100 fetches per minute
      windowSeconds: 60, // 1 minute
    },
  })
  .schema(getReviewsSchema)
  .action(async ({ parsedInput }: { parsedInput: z.infer<typeof getReviewsSchema> }) => {
    const { content_type, content_slug, sort_by, limit, offset } = parsedInput;
    const supabase = await createClient();

    // Get current user (optional - for helpful vote status)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Build query
    let query = supabase
      .from('review_ratings')
      .select(
        `
        *,
        users:user_id (
          slug,
          name,
          image,
          reputation_score,
          tier
        )
      `,
        { count: 'exact' }
      )
      .eq('content_type', content_type)
      .eq('content_slug', content_slug);

    // Apply sorting
    switch (sort_by) {
      case 'helpful':
        query = query
          .order('helpful_count', { ascending: false })
          .order('created_at', { ascending: false });
        break;
      case 'rating_high':
        query = query
          .order('rating', { ascending: false })
          .order('created_at', { ascending: false });
        break;
      case 'rating_low':
        query = query
          .order('rating', { ascending: true })
          .order('created_at', { ascending: false });
        break;
      default:
        // 'recent' and any other value: sort by most recent first
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: reviews, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch reviews', new Error(error.message), {
        content_type,
        content_slug,
        sort_by,
        error: error.message,
      });
      throw new Error('Failed to fetch reviews. Please try again.');
    }

    // If user is authenticated, fetch their helpful votes for these reviews
    let userHelpfulVotes: Set<string> = new Set();
    if (user && reviews && reviews.length > 0) {
      const reviewIds = reviews.map((r) => r.id);
      const { data: votes } = await supabase
        .from('review_helpful_votes')
        .select('review_id')
        .eq('user_id', user.id)
        .in('review_id', reviewIds);

      if (votes) {
        userHelpfulVotes = new Set(votes.map((v) => v.review_id));
      }
    }

    // Attach user helpful vote status to each review
    const reviewsWithVoteStatus = (reviews || []).map((review) => ({
      ...review,
      user_has_voted_helpful: userHelpfulVotes.has(review.id),
    }));

    return {
      success: true,
      reviews: reviewsWithVoteStatus,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  });

/**
 * Get aggregate rating stats for a content item
 *
 * Returns average rating, total count, and rating distribution
 * Used for displaying star ratings on ConfigCard and detail pages
 *
 * @param content_type - Content category
 * @param content_slug - Content identifier
 * @returns Rating statistics
 */
export const getAggregateRating = rateLimitedAction
  .metadata({
    actionName: 'getAggregateRating',
    category: 'content',
    rateLimit: {
      maxRequests: 200, // 200 fetches per minute
      windowSeconds: 60, // 1 minute
    },
  })
  .schema(
    z.object({
      content_type: contentCategorySchema,
      content_slug: nonEmptyString.max(200),
    })
  )
  .action(
    async ({ parsedInput }: { parsedInput: { content_type: string; content_slug: string } }) => {
      const { content_type, content_slug } = parsedInput;
      const supabase = await createClient();

      // Fetch all ratings for this content
      const { data: ratings, error } = await supabase
        .from('review_ratings')
        .select('rating')
        .eq('content_type', content_type)
        .eq('content_slug', content_slug);

      if (error) {
        logger.error('Failed to fetch aggregate rating', new Error(error.message), {
          content_type,
          content_slug,
          error: error.message,
        });
        throw new Error('Failed to fetch rating statistics. Please try again.');
      }

      if (!ratings || ratings.length === 0) {
        return {
          success: true,
          average: 0,
          count: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      // Calculate average
      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      const average = sum / ratings.length;

      // Calculate distribution
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const r of ratings) {
        distribution[r.rating as keyof typeof distribution] += 1;
      }

      return {
        success: true,
        average: Number(average.toFixed(1)), // Round to 1 decimal
        count: ratings.length,
        distribution,
      };
    }
  );
