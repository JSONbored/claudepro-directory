'use server';

/**
 * Content Actions
 * Consolidated server actions for all content-related functionality
 *
 * This file consolidates the following domains into a single, tree-shakeable module:
 * - Collections (create, update, delete, add/remove items, reorder)
 * - Reviews (create, update, delete, mark helpful, get aggregate ratings)
 * - Posts (create, update, delete, vote, comments)
 *
 * Architecture:
 * - All authenticated actions use authedAction middleware
 * - Repository pattern for database operations
 * - Fully tree-shakeable with named exports
 * - Type-safe with Zod schemas
 *
 * Benefits:
 * - Single source of truth for content domain
 * - Reduced import overhead
 * - Consistent error handling and logging
 * - Easier maintenance and testing
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { authedAction, rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import { collectionRepository } from '@/src/lib/repositories/collection.repository';
import { commentRepository } from '@/src/lib/repositories/comment.repository';
import { postRepository } from '@/src/lib/repositories/post.repository';
import { reviewRepository } from '@/src/lib/repositories/review.repository';
import { userInteractionRepository } from '@/src/lib/repositories/user-interaction.repository';
import { voteRepository } from '@/src/lib/repositories/vote.repository';
import { nonEmptyString, urlString } from '@/src/lib/schemas/primitives/base-strings';
import { categoryIdSchema } from '@/src/lib/schemas/shared.schema';

// =====================================================
// COLLECTION SCHEMAS
// =====================================================

const collectionSchema = z.object({
  name: nonEmptyString
    .min(2, 'Collection name must be at least 2 characters')
    .max(100, 'Collection name must be less than 100 characters')
    .transform((val: string) => val.trim()),
  slug: nonEmptyString
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .transform((val: string | undefined) => val?.trim()),
  is_public: z.boolean().default(false),
});

const collectionItemSchema = z.object({
  collection_id: z.string().uuid('Invalid collection ID'),
  content_type: categoryIdSchema,
  content_slug: nonEmptyString
    .max(200, 'Content slug is too long')
    .regex(
      /^[a-zA-Z0-9-_/]+$/,
      'Slug can only contain letters, numbers, hyphens, underscores, and forward slashes'
    )
    .transform((val: string) => val.toLowerCase().trim()),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  order: z.number().int().min(0).default(0),
});

const reorderItemsSchema = z.object({
  collection_id: z.string().uuid('Invalid collection ID'),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ),
});

// =====================================================
// REVIEW SCHEMAS
// =====================================================

const reviewInputSchema = z.object({
  content_type: categoryIdSchema,
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

const reviewDeleteSchema = z.object({
  review_id: z.string().uuid('Invalid review ID'),
});

const helpfulVoteSchema = z.object({
  review_id: z.string().uuid('Invalid review ID'),
  helpful: z.boolean().describe('true to mark helpful, false to remove vote'),
});

const getReviewsSchema = z.object({
  content_type: categoryIdSchema,
  content_slug: nonEmptyString.max(200),
  sort_by: z.enum(['recent', 'helpful', 'rating_high', 'rating_low']).default('recent'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// =====================================================
// POST SCHEMAS
// =====================================================

const createPostSchema = z
  .object({
    title: nonEmptyString.min(3).max(300, 'Title must be less than 300 characters'),
    content: z
      .string()
      .max(5000, 'Content must be less than 5000 characters')
      .nullable()
      .optional(),
    url: urlString.nullable().optional(),
  })
  .refine((data) => data.content || data.url, {
    message: 'Post must have either content or a URL',
  });

const updatePostSchema = z.object({
  id: z.string().uuid(),
  title: nonEmptyString.min(3).max(300).optional(),
  content: z.string().max(5000).nullable().optional(),
});

// ============================================
// COLLECTION ACTIONS
// ============================================

/**
 * Create a new collection
 */
export const createCollection = authedAction
  .metadata({
    actionName: 'createCollection',
    category: 'user',
    rateLimit: {
      maxRequests: 20,
      windowSeconds: 60,
    },
  })
  .schema(collectionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, slug, description, is_public } = parsedInput;
    const { userId } = ctx;

    // Create collection via repository
    const result = await collectionRepository.create({
      user_id: userId,
      name,
      slug: slug ?? name.toLowerCase().replace(/\s+/g, '-'),
      description: description ?? null,
      is_public,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      item_count: 0,
      bookmark_count: 0,
      view_count: 0,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create collection');
    }

    // Revalidate account pages
    revalidatePath('/account');
    revalidatePath('/account/library');
    if (result.data?.is_public) {
      revalidatePath('/u/[slug]', 'page');
    }

    return {
      success: true,
      collection: result.data,
    };
  });

/**
 * Update an existing collection
 */
export const updateCollection = authedAction
  .metadata({
    actionName: 'updateCollection',
    category: 'user',
    rateLimit: {
      maxRequests: 30,
      windowSeconds: 60,
    },
  })
  .schema(
    collectionSchema.extend({
      id: z.string().uuid('Invalid collection ID'),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { id, name, slug, description, is_public } = parsedInput;
    const { userId } = ctx;

    // Verify ownership (RLS will enforce, but check early for better UX)
    const existingResult = await collectionRepository.findById(id);
    if (!(existingResult.success && existingResult.data)) {
      throw new Error('Collection not found or you do not have permission to update it');
    }

    if (existingResult.data.user_id !== userId) {
      throw new Error('You do not have permission to update this collection');
    }

    // Build update object conditionally to avoid exactOptionalPropertyTypes issues
    const updateData: {
      name: string;
      slug?: string;
      description: string | null;
      is_public: boolean;
    } = {
      name,
      description: description ?? null,
      is_public,
    };

    if (slug !== undefined) {
      updateData.slug = slug;
    }

    // Update collection via repository
    const result = await collectionRepository.update(id, updateData);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update collection');
    }

    // Ensure data exists before accessing properties
    if (!result.data) {
      throw new Error('Update succeeded but no data returned');
    }

    // Revalidate relevant pages
    revalidatePath('/account');
    revalidatePath('/account/library');
    revalidatePath(`/account/library/${result.data.slug}`);
    if (result.data.is_public) {
      revalidatePath('/u/[slug]', 'page');
    }

    return {
      success: true,
      collection: result.data,
    };
  });

/**
 * Delete a collection
 */
export const deleteCollection = authedAction
  .metadata({
    actionName: 'deleteCollection',
    category: 'user',
    rateLimit: {
      maxRequests: 20,
      windowSeconds: 60,
    },
  })
  .schema(
    z.object({
      id: z.string().uuid('Invalid collection ID'),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;
    const { userId } = ctx;

    // Verify ownership before deletion
    const existingResult = await collectionRepository.findById(id);
    if (!(existingResult.success && existingResult.data)) {
      throw new Error('Collection not found or you do not have permission to delete it');
    }

    if (existingResult.data.user_id !== userId) {
      throw new Error('You do not have permission to delete this collection');
    }

    // Delete collection via repository (CASCADE will delete items)
    const result = await collectionRepository.delete(id);

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete collection');
    }

    // Revalidate account pages
    revalidatePath('/account');
    revalidatePath('/account/library');
    revalidatePath('/u/[slug]', 'page');

    return {
      success: true,
    };
  });

/**
 * Add an item to a collection
 */
export const addItemToCollection = authedAction
  .metadata({
    actionName: 'addItemToCollection',
    category: 'user',
    rateLimit: {
      maxRequests: 50,
      windowSeconds: 60,
    },
  })
  .schema(collectionItemSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { collection_id, content_type, content_slug, notes, order } = parsedInput;
    const { userId } = ctx;

    // Verify collection belongs to user
    const collectionResult = await collectionRepository.findById(collection_id);
    if (!(collectionResult.success && collectionResult.data)) {
      throw new Error('Collection not found or you do not have permission');
    }

    if (collectionResult.data.user_id !== userId) {
      throw new Error('You do not have permission to add items to this collection');
    }

    // Add item via repository (unique constraint prevents duplicates)
    const result = await collectionRepository.addItem({
      collection_id,
      user_id: userId,
      content_type,
      content_slug,
      notes: notes || null,
      order,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to add item to collection');
    }

    // Revalidate collection pages
    revalidatePath('/account/library');
    revalidatePath('/account/library/[slug]', 'page');
    revalidatePath('/u/[slug]', 'page');

    return {
      success: true,
      item: result.data,
    };
  });

/**
 * Remove an item from a collection
 */
export const removeItemFromCollection = authedAction
  .metadata({
    actionName: 'removeItemFromCollection',
    category: 'user',
    rateLimit: {
      maxRequests: 50,
      windowSeconds: 60,
    },
  })
  .schema(
    z.object({
      id: z.string().uuid('Invalid item ID'),
      collection_id: z.string().uuid('Invalid collection ID'),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { id, collection_id } = parsedInput;
    const { userId } = ctx;

    // Verify collection ownership
    const collectionResult = await collectionRepository.findById(collection_id);
    if (!(collectionResult.success && collectionResult.data)) {
      throw new Error('Collection not found or you do not have permission');
    }

    if (collectionResult.data.user_id !== userId) {
      throw new Error('You do not have permission to remove items from this collection');
    }

    // Remove item via repository
    const result = await collectionRepository.removeItem(id);

    if (!result.success) {
      throw new Error(result.error || 'Failed to remove item from collection');
    }

    // Revalidate collection pages
    revalidatePath('/account/library');
    revalidatePath('/account/library/[slug]', 'page');
    revalidatePath('/u/[slug]', 'page');

    return {
      success: true,
    };
  });

/**
 * Reorder items in a collection
 */
export const reorderCollectionItems = authedAction
  .metadata({
    actionName: 'reorderCollectionItems',
    category: 'user',
    rateLimit: {
      maxRequests: 30,
      windowSeconds: 60,
    },
  })
  .schema(reorderItemsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { collection_id, items } = parsedInput;
    const { userId } = ctx;

    // Verify collection belongs to user
    const collectionResult = await collectionRepository.findById(collection_id);
    if (!(collectionResult.success && collectionResult.data)) {
      throw new Error('Collection not found or you do not have permission');
    }

    if (collectionResult.data.user_id !== userId) {
      throw new Error('You do not have permission to reorder items in this collection');
    }

    // OPTIMIZATION: Batch operation (N queries → batch operation)
    // Repository handles batch updates efficiently using Promise.all
    // Performance gain: Significant for collections with 10-50 items
    const result = await collectionRepository.reorderItems(collection_id, items);

    if (!result.success) {
      throw new Error(result.error || 'Failed to reorder collection items');
    }

    // Revalidate collection pages
    revalidatePath('/account/library');
    revalidatePath('/account/library/[slug]', 'page');
    revalidatePath('/u/[slug]', 'page');

    return {
      success: true,
    };
  });

/**
 * Get user's collections
 */
export async function getUserCollections() {
  const { createClient } = await import('@/src/lib/supabase/server');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const result = await collectionRepository.findByUser(user.id, {
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch user collections');
  }

  return result.data || [];
}

/**
 * Get a specific collection with its items
 */
export async function getCollectionWithItems(collectionId: string) {
  const { createClient } = await import('@/src/lib/supabase/server');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get collection with items via repository (includes caching)
  const result = await collectionRepository.findByIdWithItems(collectionId);

  if (!(result.success && result.data)) {
    throw new Error(result.error || 'Collection not found');
  }

  return {
    ...result.data,
    isOwner: user?.id === result.data.user_id,
  };
}

/**
 * Get a public collection by user slug and collection slug
 */
export async function getPublicCollectionBySlug(userSlug: string, collectionSlug: string) {
  const { createClient } = await import('@/src/lib/supabase/server');
  const supabase = await createClient();

  // First get the user (still needs direct query as users table has no repository yet)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('slug', userSlug)
    .single();

  if (userError || !userData) {
    throw new Error('User not found');
  }

  // Get collection by user and slug
  const collectionResult = await collectionRepository.findByUserAndSlug(
    userData.id,
    collectionSlug
  );

  if (!(collectionResult.success && collectionResult.data)) {
    throw new Error(collectionResult.error || 'Collection not found');
  }

  // Verify collection is public
  if (!collectionResult.data.is_public) {
    throw new Error('Collection not found');
  }

  // Get items
  const itemsResult = await collectionRepository.getItems(collectionResult.data.id, {
    sortBy: 'order',
    sortOrder: 'asc',
  });

  return {
    ...collectionResult.data,
    items: itemsResult.success ? itemsResult.data || [] : [],
  };
}

// ============================================
// REVIEW ACTIONS
// ============================================

/**
 * Create a new review
 *
 * Rate limit: 10 requests per hour per IP
 * Prevents spam while allowing legitimate reviews
 */
export const createReview = authedAction
  .metadata({
    actionName: 'createReview',
    category: 'user',
    rateLimit: {
      maxRequests: 10, // 10 reviews per hour
      windowSeconds: 3600, // 1 hour
    },
  })
  .schema(reviewInputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { content_type, content_slug, rating, review_text } = parsedInput;
    const { userId } = ctx;

    // Check if user has already reviewed this content
    const existingResult = await reviewRepository.findByUserAndContent(
      userId,
      content_type,
      content_slug
    );

    if (existingResult.success && existingResult.data) {
      throw new Error(
        'You have already reviewed this content. Use the update action to modify your review.'
      );
    }

    // Create review via repository
    const result = await reviewRepository.create({
      user_id: userId,
      content_type,
      content_slug,
      rating,
      review_text: review_text || null,
      helpful_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (!result.success) {
      logger.error('Failed to create review', new Error(result.error || 'Unknown error'), {
        userId,
        content_type,
        content_slug,
        error: result.error ?? '',
      });
      throw new Error(result.error || 'Failed to create review. Please try again.');
    }

    // Track interaction for personalization (fire-and-forget)
    userInteractionRepository
      .track(content_type, content_slug, 'view', userId, undefined, { source: 'review_creation' })
      .catch((err) => {
        logger.warn('Failed to track interaction for review', undefined, {
          userId,
          content_type,
          content_slug,
          error: err instanceof Error ? err.message : String(err),
        });
      });

    // Revalidate detail page and list pages
    revalidatePath(`/${content_type}/${content_slug}`);
    revalidatePath(`/${content_type}`);
    revalidateTag(`reviews:${content_type}:${content_slug}`);

    // Ensure data exists before accessing properties
    if (!result.data) {
      throw new Error('Review created but no data returned');
    }

    logger.info('Review created', {
      userId,
      reviewId: result.data.id,
      content_type,
      content_slug,
      rating,
      hasText: !!review_text,
    });

    return {
      success: true,
      review: result.data,
    };
  });

/**
 * Update an existing review
 *
 * Rate limit: 10 requests per hour per IP
 * Users can only update their own reviews
 */
export const updateReview = authedAction
  .metadata({
    actionName: 'updateReview',
    category: 'user',
    rateLimit: {
      maxRequests: 10, // 10 updates per hour
      windowSeconds: 3600, // 1 hour
    },
  })
  .schema(reviewUpdateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { review_id, rating, review_text } = parsedInput;
    const { userId } = ctx;

    // Fetch existing review to verify ownership
    const existingResult = await reviewRepository.findById(review_id);

    if (!(existingResult.success && existingResult.data)) {
      throw new Error('Review not found');
    }

    if (existingResult.data.user_id !== userId) {
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

    // Update review via repository
    const result = await reviewRepository.update(review_id, updateData);

    if (!result.success) {
      logger.error('Failed to update review', new Error(result.error || 'Unknown error'), {
        userId,
        reviewId: review_id,
        error: result.error ?? '',
      });
      throw new Error(result.error || 'Failed to update review. Please try again.');
    }

    // Revalidate detail page and list pages
    revalidatePath(`/${existingResult.data.content_type}/${existingResult.data.content_slug}`);
    revalidatePath(`/${existingResult.data.content_type}`);
    revalidateTag(
      `reviews:${existingResult.data.content_type}:${existingResult.data.content_slug}`
    );

    logger.info('Review updated', {
      userId,
      reviewId: review_id,
      content_type: existingResult.data.content_type,
      content_slug: existingResult.data.content_slug,
      updatedFields: Object.keys(updateData).join(', '),
    });

    return {
      success: true,
      review: result.data,
    };
  });

/**
 * Delete a review
 *
 * Rate limit: 5 requests per hour per IP
 * Users can only delete their own reviews
 */
export const deleteReview = authedAction
  .metadata({
    actionName: 'deleteReview',
    category: 'user',
    rateLimit: {
      maxRequests: 5, // 5 deletes per hour
      windowSeconds: 3600, // 1 hour
    },
  })
  .schema(reviewDeleteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { review_id } = parsedInput;
    const { userId } = ctx;

    // Fetch existing review to verify ownership
    const existingResult = await reviewRepository.findById(review_id);

    if (!(existingResult.success && existingResult.data)) {
      throw new Error('Review not found');
    }

    if (existingResult.data.user_id !== userId) {
      throw new Error('You can only delete your own reviews');
    }

    // Delete review via repository (cascades to helpful votes)
    const result = await reviewRepository.delete(review_id);

    if (!result.success) {
      logger.error('Failed to delete review', new Error(result.error || 'Unknown error'), {
        userId,
        reviewId: review_id,
        error: result.error ?? '',
      });
      throw new Error(result.error || 'Failed to delete review. Please try again.');
    }

    // Revalidate detail page and list pages
    revalidatePath(`/${existingResult.data.content_type}/${existingResult.data.content_slug}`);
    revalidatePath(`/${existingResult.data.content_type}`);
    revalidateTag(
      `reviews:${existingResult.data.content_type}:${existingResult.data.content_slug}`
    );

    logger.info('Review deleted', {
      userId,
      reviewId: review_id,
      content_type: existingResult.data.content_type,
      content_slug: existingResult.data.content_slug,
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
 */
export const markReviewHelpful = authedAction
  .metadata({
    actionName: 'markReviewHelpful',
    category: 'user',
    rateLimit: {
      maxRequests: 50, // 50 helpful votes per hour
      windowSeconds: 3600, // 1 hour
    },
  })
  .schema(helpfulVoteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { review_id, helpful } = parsedInput;
    const { userId } = ctx;

    // Get review to verify it exists
    const reviewResult = await reviewRepository.findById(review_id);

    if (!(reviewResult.success && reviewResult.data)) {
      throw new Error('Review not found');
    }

    // Prevent users from voting on their own reviews
    if (reviewResult.data.user_id === userId) {
      throw new Error('You cannot vote on your own review');
    }

    if (helpful) {
      // Add helpful vote via repository
      const result = await reviewRepository.addHelpfulVote(review_id, userId);

      if (!result.success) {
        logger.error('Failed to add helpful vote', new Error(result.error || 'Unknown error'), {
          userId,
          reviewId: review_id,
          error: result.error ?? '',
        });
        throw new Error(result.error || 'Failed to mark review as helpful. Please try again.');
      }

      logger.info('Review marked helpful', {
        userId,
        reviewId: review_id,
        reviewAuthor: reviewResult.data.user_id,
      });
    } else {
      // Remove helpful vote via repository
      const result = await reviewRepository.removeHelpfulVote(review_id, userId);

      if (!result.success) {
        logger.error('Failed to remove helpful vote', new Error(result.error || 'Unknown error'), {
          userId,
          reviewId: review_id,
          error: result.error ?? '',
        });
        throw new Error(result.error || 'Failed to remove helpful vote. Please try again.');
      }

      logger.info('Helpful vote removed', {
        userId,
        reviewId: review_id,
      });
    }

    // Revalidate detail page (helpful count changed)
    revalidatePath(`/${reviewResult.data.content_type}/${reviewResult.data.content_slug}`);
    revalidateTag(`reviews:${reviewResult.data.content_type}:${reviewResult.data.content_slug}`);

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
  .action(async ({ parsedInput }) => {
    const { content_type, content_slug, sort_by, limit, offset } = parsedInput;
    const { createClient } = await import('@/src/lib/supabase/server');
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
      content_type: categoryIdSchema,
      content_slug: nonEmptyString.max(200),
    })
  )
  .action(async ({ parsedInput }) => {
    const { content_type, content_slug } = parsedInput;
    const { createClient } = await import('@/src/lib/supabase/server');
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
  });

// ============================================
// POST ACTIONS
// ============================================

/**
 * Create a new post
 */
export const createPost = authedAction
  .metadata({
    actionName: 'createPost',
    category: 'form',
  })
  .schema(createPostSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { title, content, url } = parsedInput;
    const { userId } = ctx;

    // Check for duplicate URL submissions via repository (includes caching)
    if (url) {
      const existingResult = await postRepository.findByUrl(url);
      if (existingResult.success && existingResult.data) {
        throw new Error('This URL has already been submitted');
      }
    }

    // Create via repository (includes caching and automatic error handling)
    const result = await postRepository.create({
      user_id: userId,
      title,
      content: content || null,
      url: url || null,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create post');
    }

    revalidatePath('/board');

    return {
      success: true,
      post: result.data,
    };
  });

/**
 * Update a post (own posts only)
 */
export const updatePost = authedAction
  .metadata({
    actionName: 'updatePost',
    category: 'form',
  })
  .schema(updatePostSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, title, content } = parsedInput;
    const { userId } = ctx;

    // Update via repository with ownership verification (includes caching)
    const result = await postRepository.updateByOwner(id, userId, {
      ...(title && { title }),
      ...(content !== undefined && { content }),
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to update post');
    }

    revalidatePath('/board');

    return {
      success: true,
      post: result.data,
    };
  });

/**
 * Delete a post (own posts only)
 */
export const deletePost = authedAction
  .metadata({
    actionName: 'deletePost',
    category: 'form',
  })
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;
    const { userId } = ctx;

    // Delete via repository with ownership verification (includes cache invalidation)
    const result = await postRepository.deleteByOwner(id, userId);

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete post');
    }

    revalidatePath('/board');

    return {
      success: true,
    };
  });

/**
 * Vote on a post (upvote/unvote toggle)
 */
export const votePost = authedAction
  .metadata({
    actionName: 'votePost',
    category: 'user',
  })
  .schema(
    z.object({
      post_id: z.string().uuid(),
      action: z.enum(['vote', 'unvote']),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { post_id, action } = parsedInput;
    const { userId } = ctx;

    if (action === 'vote') {
      // Add vote via repository (includes duplicate detection)
      const result = await voteRepository.create({
        user_id: userId,
        post_id,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to vote');
      }
    } else {
      // Remove vote via repository (includes cache invalidation)
      const result = await voteRepository.deleteByUserAndPost(userId, post_id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove vote');
      }
    }

    revalidatePath('/board');

    return {
      success: true,
      action,
    };
  });

/**
 * Create a comment on a post
 */
export const createComment = authedAction
  .metadata({
    actionName: 'createComment',
    category: 'form',
  })
  .schema(
    z.object({
      post_id: z.string().uuid(),
      content: nonEmptyString.min(1).max(2000, 'Comment must be less than 2000 characters'),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { post_id, content } = parsedInput;
    const { userId } = ctx;

    // Create via repository (includes caching and automatic error handling)
    const result = await commentRepository.create({
      user_id: userId,
      post_id,
      content,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create comment');
    }

    revalidatePath('/board');

    return {
      success: true,
      comment: result.data,
    };
  });

/**
 * Delete a comment (own comments only)
 */
export const deleteComment = authedAction
  .metadata({
    actionName: 'deleteComment',
    category: 'form',
  })
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;
    const { userId } = ctx;

    // Delete via repository with ownership verification (includes cache invalidation)
    const result = await commentRepository.deleteByOwner(id, userId);

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete comment');
    }

    revalidatePath('/board');

    return {
      success: true,
    };
  });
