'use server';

/**
 * Content Actions - Database-First Architecture
 * Collections, reviews, posts with PostgreSQL RPC functions for business logic.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { authedAction, rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import { nonEmptyString } from '@/src/lib/schemas/primitives';
import { categoryIdSchema } from '@/src/lib/schemas/shared.schema';
import {
  collectionInsertTransformSchema,
  collectionItemInsertTransformSchema,
  createPostSchema,
  getReviewsSchema,
  helpfulVoteSchema,
  reorderItemsSchema,
  reviewDeleteSchema,
  reviewInsertTransformSchema,
  reviewUpdateInputSchema,
  updatePostSchema,
} from '@/src/lib/schemas/transforms/data-normalization.schema';
import { createClient } from '@/src/lib/supabase/server';

// =====================================================
// COLLECTION ACTIONS
// =====================================================

/**
 * Create a new collection
 */
export const createCollection = authedAction
  .metadata({
    actionName: 'createCollection',
    category: 'user',
  })
  .schema(collectionInsertTransformSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, slug, description, is_public } = parsedInput;
    const { userId } = ctx;

    const supabase = await createClient();

    // Create collection - database handles timestamps and default counts
    const { data: collection, error } = await supabase
      .from('user_collections')
      .insert({
        user_id: userId,
        name,
        slug: slug ?? name.toLowerCase().replace(/\s+/g, '-'),
        description: description ?? null,
        is_public,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('A collection with this slug already exists');
      }
      throw new Error(`Failed to create collection: ${error.message}`);
    }

    // Revalidate account pages
    revalidatePath('/account');
    revalidatePath('/account/library');
    if (collection?.is_public) {
      revalidatePath('/u/[slug]', 'page');
    }

    return {
      success: true,
      collection,
    };
  });

/**
 * Update an existing collection
 */
export const updateCollection = authedAction
  .metadata({
    actionName: 'updateCollection',
    category: 'user',
  })
  .schema(
    collectionInsertTransformSchema.extend({
      id: z.string().uuid('Invalid collection ID'),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { id, name, slug, description, is_public } = parsedInput;
    const { userId } = ctx;

    const supabase = await createClient();

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

    // Update collection with ownership verification (atomic)
    const { data: collection, error } = await supabase
      .from('user_collections')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Collection not found or you do not have permission to update it');
      }
      if (error.code === '23505') {
        throw new Error('A collection with this slug already exists');
      }
      throw new Error(`Failed to update collection: ${error.message}`);
    }

    // Revalidate relevant pages
    revalidatePath('/account');
    revalidatePath('/account/library');
    revalidatePath(`/account/library/${collection.slug}`);
    if (collection.is_public) {
      revalidatePath('/u/[slug]', 'page');
    }

    return {
      success: true,
      collection,
    };
  });

/**
 * Delete a collection
 */
export const deleteCollection = authedAction
  .metadata({
    actionName: 'deleteCollection',
    category: 'user',
  })
  .schema(
    z.object({
      id: z.string().uuid('Invalid collection ID'),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;
    const { userId } = ctx;

    const supabase = await createClient();

    // Delete collection with ownership verification (CASCADE will delete items)
    const { error } = await supabase
      .from('user_collections')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete collection: ${error.message}`);
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
  })
  .schema(collectionItemInsertTransformSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { collection_id, content_type, content_slug, notes, order } = parsedInput;
    const { userId } = ctx;

    const supabase = await createClient();

    // Verify collection belongs to user
    const { data: collection, error: checkError } = await supabase
      .from('user_collections')
      .select('user_id')
      .eq('id', collection_id)
      .single();

    if (checkError || !collection) {
      throw new Error('Collection not found or you do not have permission');
    }

    if (collection.user_id !== userId) {
      throw new Error('You do not have permission to add items to this collection');
    }

    // Add item (unique constraint prevents duplicates)
    const { data: item, error } = await supabase
      .from('collection_items')
      .insert({
        collection_id,
        user_id: userId,
        content_type,
        content_slug,
        notes: notes || null,
        order,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Item already exists in collection');
      }
      throw new Error(`Failed to add item to collection: ${error.message}`);
    }

    // Revalidate collection pages
    revalidatePath('/account/library');
    revalidatePath('/account/library/[slug]', 'page');
    revalidatePath('/u/[slug]', 'page');

    return {
      success: true,
      item,
    };
  });

/**
 * Remove an item from a collection
 */
export const removeItemFromCollection = authedAction
  .metadata({
    actionName: 'removeItemFromCollection',
    category: 'user',
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

    const supabase = await createClient();

    // Verify collection ownership
    const { data: collection, error: checkError } = await supabase
      .from('user_collections')
      .select('user_id')
      .eq('id', collection_id)
      .single();

    if (checkError || !collection) {
      throw new Error('Collection not found or you do not have permission');
    }

    if (collection.user_id !== userId) {
      throw new Error('You do not have permission to remove items from this collection');
    }

    // Remove item
    const { error } = await supabase.from('collection_items').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to remove item from collection: ${error.message}`);
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
  })
  .schema(reorderItemsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { collection_id, items } = parsedInput;
    const { userId } = ctx;

    const supabase = await createClient();

    // Verify collection belongs to user
    const { data: collection, error: checkError } = await supabase
      .from('user_collections')
      .select('user_id')
      .eq('id', collection_id)
      .single();

    if (checkError || !collection) {
      throw new Error('Collection not found or you do not have permission');
    }

    if (collection.user_id !== userId) {
      throw new Error('You do not have permission to reorder items in this collection');
    }

    // OPTIMIZATION: Batch operation (N queries → parallel batch)
    // Performance gain: Significant for collections with 10-50 items
    const updates = items.map((item) =>
      supabase
        .from('collection_items')
        .update({ order: item.order })
        .eq('id', item.id)
        .eq('collection_id', collection_id)
    );

    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      throw new Error(`Failed to reorder items: ${errors[0]?.error?.message}`);
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

  const { data, error } = await supabase
    .from('user_collections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user collections: ${error.message}`);
  }

  return data || [];
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

  // Get collection with items (optimized JOIN query)
  const { data, error } = await supabase
    .from('user_collections')
    .select(
      `
      *,
      items:collection_items(*)
    `
    )
    .eq('id', collectionId)
    .order('order', { referencedTable: 'collection_items', ascending: true })
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Collection not found');
    }
    throw new Error(`Failed to fetch collection: ${error.message}`);
  }

  return {
    ...data,
    isOwner: user?.id === data.user_id,
  };
}

/**
 * Get a public collection by user slug and collection slug
 * Optimized: Single JOIN query batches user lookup, collection lookup, and items fetch
 */
export async function getPublicCollectionBySlug(userSlug: string, collectionSlug: string) {
  const { createClient } = await import('@/src/lib/supabase/server');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_collections')
    .select(
      `
      *,
      items:collection_items(*),
      user:users!user_collections_user_id_fkey(slug)
    `
    )
    .eq('slug', collectionSlug)
    .eq('is_public', true)
    .eq('users.slug', userSlug)
    .order('order', { referencedTable: 'collection_items', ascending: true })
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Collection not found');
    }
    throw new Error(`Failed to fetch public collection: ${error.message}`);
  }

  return data;
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
  })
  .schema(reviewInsertTransformSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { content_type, content_slug, rating, review_text } = parsedInput;
    const { userId } = ctx;

    const supabase = await createClient();

    // Check if user has already reviewed this content
    const { data: existingReview, error: checkError } = await supabase
      .from('review_ratings')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', content_type)
      .eq('content_slug', content_slug)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Failed to check for existing review: ${checkError.message}`);
    }

    if (existingReview) {
      throw new Error(
        'You have already reviewed this content. Use the update action to modify your review.'
      );
    }

    // Create review
    const { data: review, error } = await supabase
      .from('review_ratings')
      .insert({
        user_id: userId,
        content_type,
        content_slug,
        rating,
        review_text: review_text || null,
        helpful_count: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create review', new Error(error.message), {
        userId,
        content_type,
        content_slug,
        error: error.message,
      });
      throw new Error(`Failed to create review: ${error.message}`);
    }

    // Track interaction for personalization (fire-and-forget)
    createClient()
      .then((supabaseForTracking) =>
        supabaseForTracking.from('user_interactions').insert({
          content_type,
          content_slug,
          interaction_type: 'view',
          user_id: userId,
          session_id: null,
          metadata: { source: 'review_creation' },
        })
      )
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
    revalidateTag(`reviews:${content_type}:${content_slug}`, 'max');

    // Ensure data exists before accessing properties
    if (!review) {
      throw new Error('Review created but no data returned');
    }

    logger.info('Review created', {
      userId,
      reviewId: review.id,
      content_type,
      content_slug,
      rating,
      hasText: !!review_text,
    });

    return {
      success: true,
      review,
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
  })
  .schema(reviewUpdateInputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { review_id, rating, review_text } = parsedInput;
    const { userId } = ctx;

    const supabase = await createClient();

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

    // Update review with ownership verification
    const { data: review, error } = await supabase
      .from('review_ratings')
      .update(updateData)
      .eq('id', review_id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Review not found or you do not have permission to update it');
      }
      logger.error('Failed to update review', new Error(error.message), {
        userId,
        reviewId: review_id,
        error: error.message,
      });
      throw new Error(`Failed to update review: ${error.message}`);
    }

    // Revalidate detail page and list pages
    revalidatePath(`/${review.content_type}/${review.content_slug}`);
    revalidatePath(`/${review.content_type}`);
    revalidateTag(`reviews:${review.content_type}:${review.content_slug}`, 'max');

    logger.info('Review updated', {
      userId,
      reviewId: review_id,
      content_type: review.content_type,
      content_slug: review.content_slug,
      updatedFields: Object.keys(updateData).join(', '),
    });

    return {
      success: true,
      review,
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
  })
  .schema(reviewDeleteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { review_id } = parsedInput;
    const { userId } = ctx;

    const supabase = await createClient();

    // First fetch review to get content info for revalidation
    const { data: reviewToDelete, error: fetchError } = await supabase
      .from('review_ratings')
      .select('content_type, content_slug, user_id')
      .eq('id', review_id)
      .single();

    if (fetchError || !reviewToDelete) {
      throw new Error('Review not found');
    }

    if (reviewToDelete.user_id !== userId) {
      throw new Error('You can only delete your own reviews');
    }

    // Delete review (cascades to helpful votes via foreign key)
    const { error } = await supabase.from('review_ratings').delete().eq('id', review_id);

    if (error) {
      logger.error('Failed to delete review', new Error(error.message), {
        userId,
        reviewId: review_id,
        error: error.message,
      });
      throw new Error(`Failed to delete review: ${error.message}`);
    }

    // Revalidate detail page and list pages
    revalidatePath(`/${reviewToDelete.content_type}/${reviewToDelete.content_slug}`);
    revalidatePath(`/${reviewToDelete.content_type}`);
    revalidateTag(`reviews:${reviewToDelete.content_type}:${reviewToDelete.content_slug}`, 'max');

    logger.info('Review deleted', {
      userId,
      reviewId: review_id,
      content_type: reviewToDelete.content_type,
      content_slug: reviewToDelete.content_slug,
    });

    return {
      success: true,
    };
  });

export const markReviewHelpful = authedAction
  .metadata({ actionName: 'markReviewHelpful', category: 'user' })
  .schema(helpfulVoteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('toggle_review_helpful', {
      p_review_id: parsedInput.review_id,
      p_user_id: ctx.userId,
      p_helpful: parsedInput.helpful,
    });
    if (error) throw new Error(error.message);

    const result = data as {
      success: boolean;
      helpful: boolean;
      content_type: string;
      content_slug: string;
    };
    revalidatePath(`/${result.content_type}/${result.content_slug}`);
    revalidateTag(`reviews:${result.content_type}:${result.content_slug}`, 'max');

    return { success: result.success, helpful: result.helpful };
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

export const getAggregateRating = rateLimitedAction
  .metadata({ actionName: 'getAggregateRating', category: 'content' })
  .schema(z.object({ content_type: categoryIdSchema, content_slug: nonEmptyString.max(200) }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_aggregate_rating', {
      p_content_type: parsedInput.content_type,
      p_content_slug: parsedInput.content_slug,
    });
    if (error) throw new Error('Failed to fetch rating statistics. Please try again.');
    return data as {
      success: boolean;
      average: number;
      count: number;
      distribution: Record<string, number>;
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

    const supabase = await createClient();

    // Check for duplicate URL submissions
    if (url) {
      const { data: existing, error: checkError } = await supabase
        .from('posts')
        .select('id')
        .eq('url', url)
        .limit(1)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(`Failed to check for duplicate URL: ${checkError.message}`);
      }

      if (existing) {
        throw new Error('This URL has already been submitted');
      }
    }

    // Create post
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        title,
        content: content || null,
        url: url || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create post: ${error.message}`);
    }

    revalidatePath('/board');

    return {
      success: true,
      post,
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

    const supabase = await createClient();

    // Update with ownership verification
    const { data: post, error } = await supabase
      .from('posts')
      .update({
        ...(title && { title }),
        ...(content !== undefined && { content }),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update post: ${error.message}`);
    }

    revalidatePath('/board');

    return {
      success: true,
      post,
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

    const supabase = await createClient();

    // Delete with ownership verification
    const { error } = await supabase.from('posts').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }

    revalidatePath('/board');

    return {
      success: true,
    };
  });

export const votePost = authedAction
  .metadata({ actionName: 'votePost', category: 'user' })
  .schema(z.object({ post_id: z.string().uuid(), action: z.enum(['vote', 'unvote']) }))
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('toggle_post_vote', {
      p_post_id: parsedInput.post_id,
      p_user_id: ctx.userId,
      p_action: parsedInput.action,
    });
    if (error) throw new Error(error.message);
    revalidatePath('/board');
    return data as { success: boolean; action: string };
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

    const supabase = await createClient();

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        post_id,
        content,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create comment: ${error.message}`);
    }

    revalidatePath('/board');

    return {
      success: true,
      comment,
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

    const supabase = await createClient();

    // Delete with ownership verification - PostgREST enforces both conditions atomically
    const { error } = await supabase.from('comments').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete comment: ${error.message}`);
    }

    revalidatePath('/board');

    return {
      success: true,
    };
  });
