'use server';

/**
 * Content Actions - Database-First Architecture
 * Collections, reviews, posts with PostgreSQL RPC functions for business logic.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { invalidateByKeys, runRpc } from '@/src/lib/actions/action-helpers';
import { authedAction, rateLimitedAction } from '@/src/lib/actions/safe-action';
import { getAuthenticatedUserFromClient } from '@/src/lib/auth/get-authenticated-user';
import type { CacheInvalidateKey } from '@/src/lib/data/config/cache-config';
import { getPaginatedContent as getPaginatedContentData } from '@/src/lib/data/content/paginated';
import { getReviewsWithStatsData } from '@/src/lib/data/content/reviews';
import { logger } from '@/src/lib/logger';
import type { DisplayableContent } from '@/src/lib/types/component.types';
import { logActionFailure } from '@/src/lib/utils/error.utils';
import type { Database, Tables } from '@/src/types/database.types';
import {
  CONTENT_CATEGORY_VALUES,
  type ContentCategory,
  type ReorderCollectionItemsReturn,
  SUBMISSION_TYPE_VALUES,
  type SubmissionType,
} from '@/src/types/database-overrides';

// Manual Zod schemas (database validates, Zod just provides type safety)
const collectionSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional().nullable(),
  is_public: z.boolean().default(false),
});

const collectionItemSchema = z.object({
  collection_id: z.string(),
  content_type: z.enum([...CONTENT_CATEGORY_VALUES] as [ContentCategory, ...ContentCategory[]]),
  content_slug: z
    .string()
    .max(200)
    .regex(/^[a-zA-Z0-9\-_/]+$/),
  notes: z.string().max(500).optional().nullable(),
  order: z.number().int().min(0).optional(),
});

const reviewSchema = z.object({
  content_type: z.enum([...CONTENT_CATEGORY_VALUES] as [ContentCategory, ...ContentCategory[]]),
  content_slug: z
    .string()
    .max(200)
    .regex(/^[a-zA-Z0-9\-_/]+$/),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().max(2000).optional().nullable(),
});

const getReviewsSchema = z.object({
  content_type: z.enum([...CONTENT_CATEGORY_VALUES] as [ContentCategory, ...ContentCategory[]]),
  content_slug: z
    .string()
    .max(200)
    .regex(/^[a-zA-Z0-9\-_/]+$/),
  sort_by: z.enum(['recent', 'helpful', 'rating_high', 'rating_low']).default('recent'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const reorderItemsSchema = z.object({
  collection_id: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(0),
    })
  ),
});

const reviewUpdateSchema = z.object({
  review_id: z.string(),
  rating: z.number().int().min(1).max(5).optional(),
  review_text: z.string().max(2000).optional().nullable(),
});

const helpfulVoteSchema = z.object({
  review_id: z.string(),
  helpful: z.boolean(),
});

const reviewDeleteSchema = z.object({
  review_id: z.string(),
});

async function invalidateContentCaches(options: {
  keys?: CacheInvalidateKey[];
  extraTags?: string[];
}) {
  await invalidateByKeys({
    ...(options.keys ? { invalidateKeys: options.keys } : {}),
    ...(options.extraTags ? { extraTags: options.extraTags } : {}),
  });
}

// =====================================================
// COLLECTION ACTIONS
// =====================================================

/**
 * Create a new collection
 */
export const createCollection = authedAction
  .metadata({ actionName: 'createCollection', category: 'user' })
  .schema(collectionSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      type ManageCollectionResult = {
        success: boolean;
        collection: Tables<'user_collections'>;
      };

      const result = await runRpc<ManageCollectionResult>(
        'manage_collection',
        {
          p_action: 'create',
          p_user_id: ctx.userId,
          p_data: parsedInput,
        },
        {
          action: 'content.createCollection.rpc',
          userId: ctx.userId,
          meta: { collectionName: parsedInput.name },
        }
      );

      revalidatePath('/account');
      revalidatePath('/account/library');
      if (result.collection?.is_public) revalidatePath('/u/[slug]', 'page');

      await invalidateContentCaches({
        keys: ['cache.invalidate.collection_create'],
      });

      return result;
    } catch (error) {
      throw logActionFailure('content.createCollection', error, {
        userId: ctx.userId,
        collectionName: parsedInput.name,
      });
    }
  });

/**
 * Update an existing collection
 */
export const updateCollection = authedAction
  .metadata({ actionName: 'updateCollection', category: 'user' })
  .schema(collectionSchema.extend({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      type ManageCollectionResult = {
        success: boolean;
        collection: Tables<'user_collections'>;
      };

      const result = await runRpc<ManageCollectionResult>(
        'manage_collection',
        {
          p_action: 'update',
          p_user_id: ctx.userId,
          p_data: parsedInput,
        },
        {
          action: 'content.updateCollection.rpc',
          userId: ctx.userId,
          meta: { collectionId: parsedInput.id },
        }
      );

      revalidatePath('/account');
      revalidatePath('/account/library');
      revalidatePath(`/account/library/${result.collection.slug}`);
      if (result.collection.is_public) revalidatePath('/u/[slug]', 'page');

      await invalidateContentCaches({
        keys: ['cache.invalidate.collection_update'],
      });

      return result;
    } catch (error) {
      throw logActionFailure('content.updateCollection', error, {
        userId: ctx.userId,
        collectionId: parsedInput.id,
      });
    }
  });

/**
 * Delete a collection
 */
export const deleteCollection = authedAction
  .metadata({ actionName: 'deleteCollection', category: 'user' })
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await runRpc(
        'manage_collection',
        {
          p_action: 'delete',
          p_user_id: ctx.userId,
          p_data: parsedInput,
        },
        {
          action: 'content.deleteCollection.rpc',
          userId: ctx.userId,
          meta: { collectionId: parsedInput.id },
        }
      );

      revalidatePath('/account');
      revalidatePath('/account/library');
      revalidatePath('/u/[slug]', 'page');

      await invalidateContentCaches({
        keys: ['cache.invalidate.collection_delete'],
      });

      return { success: true };
    } catch (error) {
      throw logActionFailure('content.deleteCollection', error, {
        userId: ctx.userId,
        collectionId: parsedInput.id,
      });
    }
  });

/**
 * Add an item to a collection
 */
export const addItemToCollection = authedAction
  .metadata({ actionName: 'addItemToCollection', category: 'user' })
  .schema(collectionItemSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      type ManageCollectionItemResult = {
        success: boolean;
        item: Tables<'collection_items'>;
      };

      const result = await runRpc<ManageCollectionItemResult>(
        'manage_collection',
        {
          p_action: 'add_item',
          p_user_id: ctx.userId,
          p_data: parsedInput,
        },
        {
          action: 'content.addItemToCollection.rpc',
          userId: ctx.userId,
          meta: {
            collectionId: parsedInput.collection_id,
            contentSlug: parsedInput.content_slug,
          },
        }
      );

      revalidatePath('/account/library');
      revalidatePath('/account/library/[slug]', 'page');
      revalidatePath('/u/[slug]', 'page');

      await invalidateContentCaches({
        keys: ['cache.invalidate.collection_items'],
      });

      return result;
    } catch (error) {
      throw logActionFailure('content.addItemToCollection', error, {
        userId: ctx.userId,
        collectionId: parsedInput.collection_id,
        contentSlug: parsedInput.content_slug,
      });
    }
  });

/**
 * Remove an item from a collection
 */
export const removeItemFromCollection = authedAction
  .metadata({ actionName: 'removeItemFromCollection', category: 'user' })
  .schema(z.object({ id: z.string(), collection_id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await runRpc(
        'manage_collection',
        {
          p_action: 'remove_item',
          p_user_id: ctx.userId,
          p_data: parsedInput,
        },
        {
          action: 'content.removeItemFromCollection.rpc',
          userId: ctx.userId,
          meta: {
            collectionId: parsedInput.collection_id,
            itemId: parsedInput.id,
          },
        }
      );

      revalidatePath('/account/library');
      revalidatePath('/account/library/[slug]', 'page');
      revalidatePath('/u/[slug]', 'page');

      await invalidateContentCaches({
        keys: ['cache.invalidate.collection_items'],
      });

      return { success: true };
    } catch (error) {
      throw logActionFailure('content.removeItemFromCollection', error, {
        userId: ctx.userId,
        collectionId: parsedInput.collection_id,
        itemId: parsedInput.id,
      });
    }
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

    try {
      const result = await runRpc<ReorderCollectionItemsReturn>(
        'reorder_collection_items',
        {
          p_collection_id: collection_id,
          p_user_id: userId,
          p_items: items,
        },
        {
          action: 'content.reorderCollectionItems.rpc',
          userId,
          meta: { collectionId: collection_id },
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to reorder collection items');
      }

      if (result.errors.length > 0) {
        logger.warn('Some items failed to reorder', undefined, {
          errorCount: result.errors.length,
        });
      }

      // Revalidate collection pages
      revalidatePath('/account/library');
      revalidatePath('/account/library/[slug]', 'page');
      revalidatePath('/u/[slug]', 'page');

      await invalidateContentCaches({
        keys: ['cache.invalidate.collection_items'],
      });

      return {
        success: true,
        updated: result.updated,
      };
    } catch (error) {
      throw logActionFailure('content.reorderCollectionItems', error, {
        userId,
        collectionId: collection_id,
      });
    }
  });
// ============================================
// REVIEW ACTIONS
// ============================================

/**
 * Create a new review
 */
export const createReview = authedAction
  .metadata({ actionName: 'createReview', category: 'user' })
  .schema(reviewSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const result = await runRpc<{ success: boolean; review: Tables<'review_ratings'> }>(
        'manage_review',
        {
          p_action: 'create',
          p_user_id: ctx.userId,
          p_data: parsedInput,
        },
        {
          action: 'content.createReview.rpc',
          userId: ctx.userId,
          meta: {
            content_type: parsedInput.content_type,
            content_slug: parsedInput.content_slug,
          },
        }
      );
      const { content_type, content_slug } = result.review;

      revalidatePath(`/${content_type}/${content_slug}`);
      revalidatePath(`/${content_type}`);

      await invalidateContentCaches({
        keys: ['cache.invalidate.review_create'],
        extraTags: [`reviews:${content_type}:${content_slug}`],
      });
      revalidateTag(`reviews:${content_type}:${content_slug}`, 'default');

      logger.info('Review created', {
        userId: ctx.userId,
        reviewId: result.review.id,
        content_type,
        content_slug,
        rating: result.review.rating,
      });

      return result;
    } catch (error) {
      throw logActionFailure('content.createReview', error, {
        userId: ctx.userId,
        content_type: parsedInput.content_type,
        content_slug: parsedInput.content_slug,
      });
    }
  });

/**
 * Update an existing review
 */
export const updateReview = authedAction
  .metadata({ actionName: 'updateReview', category: 'user' })
  .schema(reviewUpdateSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const result = await runRpc<{ success: boolean; review: Tables<'review_ratings'> }>(
        'manage_review',
        {
          p_action: 'update',
          p_user_id: ctx.userId,
          p_data: parsedInput,
        },
        {
          action: 'content.updateReview.rpc',
          userId: ctx.userId,
          meta: { reviewId: parsedInput.review_id },
        }
      );

      const { content_type, content_slug } = result.review;

      revalidatePath(`/${content_type}/${content_slug}`);
      revalidatePath(`/${content_type}`);

      await invalidateContentCaches({
        keys: ['cache.invalidate.review_update'],
        extraTags: [`reviews:${content_type}:${content_slug}`],
      });
      revalidateTag(`reviews:${content_type}:${content_slug}`, 'default');

      logger.info('Review updated', {
        userId: ctx.userId,
        reviewId: parsedInput.review_id,
        content_type,
        content_slug,
      });

      return result;
    } catch (error) {
      throw logActionFailure('content.updateReview', error, {
        userId: ctx.userId,
        reviewId: parsedInput.review_id,
      });
    }
  });

/**
 * Delete a review
 */
export const deleteReview = authedAction
  .metadata({ actionName: 'deleteReview', category: 'user' })
  .schema(reviewDeleteSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const result = await runRpc<{
        success: boolean;
        content_type: string;
        content_slug: string;
      }>(
        'manage_review',
        {
          p_action: 'delete',
          p_user_id: ctx.userId,
          p_data: parsedInput,
        },
        {
          action: 'content.deleteReview.rpc',
          userId: ctx.userId,
          meta: { reviewId: parsedInput.review_id },
        }
      );

      revalidatePath(`/${result.content_type}/${result.content_slug}`);
      revalidatePath(`/${result.content_type}`);

      await invalidateContentCaches({
        keys: ['cache.invalidate.review_delete'],
        extraTags: [`reviews:${result.content_type}:${result.content_slug}`],
      });
      revalidateTag(`reviews:${result.content_type}:${result.content_slug}`, 'default');

      logger.info('Review deleted', {
        userId: ctx.userId,
        reviewId: parsedInput.review_id,
        content_type: result.content_type,
        content_slug: result.content_slug,
      });

      return { success: true };
    } catch (error) {
      throw logActionFailure('content.deleteReview', error, {
        userId: ctx.userId,
        reviewId: parsedInput.review_id,
      });
    }
  });

export const markReviewHelpful = authedAction
  .metadata({ actionName: 'markReviewHelpful', category: 'user' })
  .schema(helpfulVoteSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const result = await runRpc<{
        success: boolean;
        helpful: boolean;
        content_type: string;
        content_slug: string;
      }>(
        'toggle_review_helpful',
        {
          p_review_id: parsedInput.review_id,
          p_user_id: ctx.userId,
          p_helpful: parsedInput.helpful,
        },
        {
          action: 'content.markReviewHelpful.rpc',
          userId: ctx.userId,
          meta: { reviewId: parsedInput.review_id },
        }
      );

      revalidatePath(`/${result.content_type}/${result.content_slug}`);

      await invalidateContentCaches({
        keys: ['cache.invalidate.review_helpful'],
        extraTags: [`reviews:${result.content_type}:${result.content_slug}`],
      });
      revalidateTag(`reviews:${result.content_type}:${result.content_slug}`, 'default');

      return { success: result.success, helpful: result.helpful };
    } catch (error) {
      throw logActionFailure('content.markReviewHelpful', error, {
        userId: ctx.userId,
        reviewId: parsedInput.review_id,
      });
    }
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
    const { user } = await getAuthenticatedUserFromClient(supabase, {
      context: 'getReviewsWithStats',
    });

    const data = await getReviewsWithStatsData({
      contentType: content_type,
      contentSlug: content_slug,
      sortBy: sort_by,
      limit,
      offset,
      ...(user?.id ? { userId: user.id } : {}),
    });

    if (!data) {
      throw new Error('Failed to fetch reviews. Please try again.');
    }

    return data;
  });

// DELETED: getReviews() - Use getReviewsWithStats() instead (optimized single RPC)
// DELETED: getAggregateRating() - Use getReviewsWithStats() instead (optimized single RPC)

// ============================================
// CONTENT FETCHING ACTIONS
// ============================================

const fetchPaginatedContentSchema = z.object({
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(30),
  category: z
    .enum([...CONTENT_CATEGORY_VALUES] as [ContentCategory, ...ContentCategory[]])
    .nullable()
    .default(null),
});

/**
 * Fetch paginated content via cached RPC (get_content_paginated_slim)
 * Public action - no authentication required
 */
export const fetchPaginatedContent = rateLimitedAction
  .schema(fetchPaginatedContentSchema)
  .metadata({ actionName: 'content.fetchPaginatedContent', category: 'content' })
  .action(async ({ parsedInput }) => {
    try {
      const data = await getPaginatedContentData({
        category: parsedInput.category,
        limit: parsedInput.limit,
        offset: parsedInput.offset,
      });

      return (data?.items ?? []) as DisplayableContent[];
    } catch {
      // Fallback to empty array on error (safe-action middleware handles logging)
      return [];
    }
  });

// =====================================================
// CONTENT SUBMISSION ACTION
// =====================================================

/**
 * Submit content for review
 * Calls submit_content_for_review RPC with validation
 */
const submitContentSchema = z.object({
  submission_type: z.enum([...SUBMISSION_TYPE_VALUES] as [SubmissionType, ...SubmissionType[]]),
  name: z.string().min(2),
  description: z.string().min(10),
  category: z.enum([...CONTENT_CATEGORY_VALUES] as [ContentCategory, ...ContentCategory[]]),
  author: z.string().min(2),
  author_profile_url: z.string().url().optional(),
  github_url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  content_data: z.record(z.string(), z.unknown()), // Additional fields as JSONB
});

export const submitContentForReview = rateLimitedAction
  .metadata({ actionName: 'submitContentForReview', category: 'content' })
  .schema(submitContentSchema)
  .action(async ({ parsedInput }) => {
    try {
      type SubmitContentResult = {
        success: boolean;
        submission_id: string;
      };

      const result = await runRpc<SubmitContentResult>(
        'submit_content_for_review',
        {
          p_submission_type: parsedInput.submission_type,
          p_name: parsedInput.name,
          p_description: parsedInput.description,
          p_category: parsedInput.category,
          p_author: parsedInput.author,
          ...(parsedInput.author_profile_url && {
            p_author_profile_url: parsedInput.author_profile_url,
          }),
          ...(parsedInput.github_url && { p_github_url: parsedInput.github_url }),
          ...(parsedInput.tags && { p_tags: parsedInput.tags }),
          p_content_data:
            parsedInput.content_data as Database['public']['Functions']['submit_content_for_review']['Args']['p_content_data'],
        },
        {
          action: 'content.submitContentForReview.rpc',
          meta: {
            submission_type: parsedInput.submission_type,
            name: parsedInput.name,
          },
        }
      );

      if (!result.success) {
        throw new Error('Content submission failed');
      }

      logger.info('Content submitted successfully', {
        submission_id: result.submission_id,
        submission_type: parsedInput.submission_type,
      });

      await invalidateContentCaches({
        keys: ['cache.invalidate.submission_create'],
      });

      revalidatePath('/account/submissions');

      return {
        success: true,
        submissionId: result.submission_id,
      };
    } catch (error) {
      logger.error(
        'Failed to submit content',
        error instanceof Error ? error : new Error(String(error)),
        {
          submission_type: parsedInput.submission_type,
          name: parsedInput.name,
        }
      );
      throw error;
    }
  });
