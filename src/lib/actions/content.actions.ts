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
// categoryIdSchema removed - using generated types only
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
import type { Tables } from '@/src/types/database.types';

// =====================================================
// COLLECTION ACTIONS
// =====================================================

/**
 * Create a new collection
 */
export const createCollection = authedAction
  .metadata({ actionName: 'createCollection', category: 'user' })
  .schema(collectionInsertTransformSchema)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('manage_collection', {
      p_action: 'create',
      p_user_id: ctx.userId,
      p_data: parsedInput,
    });

    if (error) throw new Error(error.message);
    const result = data as unknown as { success: boolean; collection: Tables<'user_collections'> };

    revalidatePath('/account');
    revalidatePath('/account/library');
    if (result.collection?.is_public) revalidatePath('/u/[slug]', 'page');

    return result;
  });

/**
 * Update an existing collection
 */
export const updateCollection = authedAction
  .metadata({ actionName: 'updateCollection', category: 'user' })
  .schema(collectionInsertTransformSchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('manage_collection', {
      p_action: 'update',
      p_user_id: ctx.userId,
      p_data: parsedInput,
    });

    if (error) throw new Error(error.message);
    const result = data as unknown as { success: boolean; collection: Tables<'user_collections'> };

    revalidatePath('/account');
    revalidatePath('/account/library');
    revalidatePath(`/account/library/${result.collection.slug}`);
    if (result.collection.is_public) revalidatePath('/u/[slug]', 'page');

    return result;
  });

/**
 * Delete a collection
 */
export const deleteCollection = authedAction
  .metadata({ actionName: 'deleteCollection', category: 'user' })
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('manage_collection', {
      p_action: 'delete',
      p_user_id: ctx.userId,
      p_data: parsedInput,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/account');
    revalidatePath('/account/library');
    revalidatePath('/u/[slug]', 'page');

    return data as { success: boolean };
  });

/**
 * Add an item to a collection
 */
export const addItemToCollection = authedAction
  .metadata({ actionName: 'addItemToCollection', category: 'user' })
  .schema(collectionItemInsertTransformSchema)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('manage_collection', {
      p_action: 'add_item',
      p_user_id: ctx.userId,
      p_data: parsedInput,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/account/library');
    revalidatePath('/account/library/[slug]', 'page');
    revalidatePath('/u/[slug]', 'page');

    return data as unknown as { success: boolean; item: Tables<'collection_items'> };
  });

/**
 * Remove an item from a collection
 */
export const removeItemFromCollection = authedAction
  .metadata({ actionName: 'removeItemFromCollection', category: 'user' })
  .schema(z.object({ id: z.string().uuid(), collection_id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('manage_collection', {
      p_action: 'remove_item',
      p_user_id: ctx.userId,
      p_data: parsedInput,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/account/library');
    revalidatePath('/account/library/[slug]', 'page');
    revalidatePath('/u/[slug]', 'page');

    return data as { success: boolean };
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

    // RPC handles ownership verification and atomic batch update
    const { data, error } = await supabase.rpc('reorder_collection_items', {
      p_collection_id: collection_id,
      p_user_id: userId,
      p_items: items,
    });

    if (error) {
      throw new Error(`Failed to reorder items: ${error.message}`);
    }

    const result = data as { success: boolean; updated: number; errors: unknown[] };

    if (!result.success) {
      throw new Error('Failed to reorder collection items');
    }

    if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
      logger.warn('Some items failed to reorder', undefined, {
        errorCount: result.errors.length,
      });
    }

    // Revalidate collection pages
    revalidatePath('/account/library');
    revalidatePath('/account/library/[slug]', 'page');
    revalidatePath('/u/[slug]', 'page');

    return {
      success: true,
      updated: result.updated,
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

  // Get collection with items (optimized JOIN query with LIMIT for scalability)
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
    .limit(100)
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
    .limit(100)
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
 */
export const createReview = authedAction
  .metadata({ actionName: 'createReview', category: 'user' })
  .schema(reviewInsertTransformSchema)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('manage_review', {
      p_action: 'create',
      p_user_id: ctx.userId,
      p_data: parsedInput,
    });

    if (error) {
      logger.error('Failed to create review', new Error(error.message), {
        userId: ctx.userId,
        content_type: parsedInput.content_type,
        content_slug: parsedInput.content_slug,
      });
      throw new Error(error.message);
    }

    const result = data as unknown as { success: boolean; review: Tables<'review_ratings'> };
    const { content_type, content_slug } = result.review;

    revalidatePath(`/${content_type}/${content_slug}`);
    revalidatePath(`/${content_type}`);
    revalidateTag(`reviews:${content_type}:${content_slug}`, 'max');

    logger.info('Review created', {
      userId: ctx.userId,
      reviewId: result.review.id,
      content_type,
      content_slug,
      rating: result.review.rating,
    });

    return result;
  });

/**
 * Update an existing review
 */
export const updateReview = authedAction
  .metadata({ actionName: 'updateReview', category: 'user' })
  .schema(reviewUpdateInputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('manage_review', {
      p_action: 'update',
      p_user_id: ctx.userId,
      p_data: parsedInput,
    });

    if (error) {
      logger.error('Failed to update review', new Error(error.message), {
        userId: ctx.userId,
        reviewId: parsedInput.review_id,
      });
      throw new Error(error.message);
    }

    const result = data as unknown as { success: boolean; review: Tables<'review_ratings'> };
    const { content_type, content_slug } = result.review;

    revalidatePath(`/${content_type}/${content_slug}`);
    revalidatePath(`/${content_type}`);
    revalidateTag(`reviews:${content_type}:${content_slug}`, 'max');

    logger.info('Review updated', {
      userId: ctx.userId,
      reviewId: parsedInput.review_id,
      content_type,
      content_slug,
    });

    return result;
  });

/**
 * Delete a review
 */
export const deleteReview = authedAction
  .metadata({ actionName: 'deleteReview', category: 'user' })
  .schema(reviewDeleteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('manage_review', {
      p_action: 'delete',
      p_user_id: ctx.userId,
      p_data: parsedInput,
    });

    if (error) {
      logger.error('Failed to delete review', new Error(error.message), {
        userId: ctx.userId,
        reviewId: parsedInput.review_id,
      });
      throw new Error(error.message);
    }

    const result = data as { success: boolean; content_type: string; content_slug: string };

    revalidatePath(`/${result.content_type}/${result.content_slug}`);
    revalidatePath(`/${result.content_type}`);
    revalidateTag(`reviews:${result.content_type}:${result.content_slug}`, 'max');

    logger.info('Review deleted', {
      userId: ctx.userId,
      reviewId: parsedInput.review_id,
      content_type: result.content_type,
      content_slug: result.content_slug,
    });

    return { success: true };
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
 * Get reviews with aggregate stats - OPTIMIZED
 * Uses single RPC call instead of separate getReviews + getAggregateRating
 * Replaces 2 queries with 1
 */
export const getReviewsWithStats = rateLimitedAction
  .metadata({
    actionName: 'getReviewsWithStats',
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

    // Use optimized RPC - single query for reviews + aggregate stats
    const { data, error } = await supabase.rpc('get_reviews_with_stats', {
      p_content_type: content_type,
      p_content_slug: content_slug,
      ...(sort_by && { p_sort_by: sort_by }),
      ...(offset !== undefined && { p_offset: offset }),
      ...(limit !== undefined && { p_limit: limit }),
      ...(user?.id && { p_user_id: user.id }),
    });

    if (error) {
      logger.error('Failed to fetch reviews with stats', new Error(error.message), {
        content_type,
        content_slug,
        sort_by,
        error: error.message,
      });
      throw new Error('Failed to fetch reviews. Please try again.');
    }

    return data;
  });

// DELETED: getReviews() - Use getReviewsWithStats() instead (optimized single RPC)
// DELETED: getAggregateRating() - Use getReviewsWithStats() instead (optimized single RPC)

// ============================================
// POST ACTIONS
// ============================================

/**
 * Create a new post
 */
export const createPost = authedAction
  .metadata({ actionName: 'createPost', category: 'form' })
  .schema(createPostSchema)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('manage_post', {
      p_action: 'create',
      p_user_id: ctx.userId,
      p_data: parsedInput,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/board');
    return data as unknown as { success: boolean; post: Tables<'posts'> };
  });

/**
 * Update a post (own posts only)
 */
export const updatePost = authedAction
  .metadata({ actionName: 'updatePost', category: 'form' })
  .schema(updatePostSchema)
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('manage_post', {
      p_action: 'update',
      p_user_id: ctx.userId,
      p_data: parsedInput,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/board');
    return data as unknown as { success: boolean; post: Tables<'posts'> };
  });

/**
 * Delete a post (own posts only)
 */
export const deletePost = authedAction
  .metadata({ actionName: 'deletePost', category: 'form' })
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('manage_post', {
      p_action: 'delete',
      p_user_id: ctx.userId,
      p_data: parsedInput,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/board');
    return data as { success: boolean };
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
  .metadata({ actionName: 'createComment', category: 'form' })
  .schema(
    z.object({
      post_id: z.string().uuid(),
      content: nonEmptyString.min(1).max(2000),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('manage_comment', {
      p_action: 'create',
      p_user_id: ctx.userId,
      p_data: parsedInput,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/board');
    return data as unknown as { success: boolean; comment: Tables<'comments'> };
  });

/**
 * Delete a comment (own comments only)
 */
export const deleteComment = authedAction
  .metadata({ actionName: 'deleteComment', category: 'form' })
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('manage_comment', {
      p_action: 'delete',
      p_user_id: ctx.userId,
      p_data: parsedInput,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/board');
    return data as { success: boolean };
  });

// ============================================
// USAGE TRACKING ACTIONS
// ============================================

/**
 * Track content usage (copy, download, etc.)
 * Increments both copy_count (unified frontend metric) and specific action counters
 */
export const trackUsage = rateLimitedAction
  .metadata({ actionName: 'trackUsage', category: 'content' })
  .schema(
    z.object({
      content_id: z.string().uuid(),
      action_type: z.enum(['copy', 'download_zip', 'download_markdown', 'llmstxt']),
    })
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { error } = await supabase.rpc('increment_usage', {
      p_content_id: parsedInput.content_id,
      p_action_type: parsedInput.action_type,
    });

    if (error) {
      logger.error('Failed to track usage', new Error(error.message), {
        content_id: parsedInput.content_id,
        action_type: parsedInput.action_type,
      });
      throw new Error(error.message);
    }

    return { success: true };
  });
