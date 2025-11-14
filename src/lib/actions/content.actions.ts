'use server';

/**
 * Content Actions - Database-First Architecture
 * Collections, reviews, posts with PostgreSQL RPC functions for business logic.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { authedAction, rateLimitedAction } from '@/src/lib/actions/safe-action';
import { cacheConfigs } from '@/src/lib/flags';
import { logger } from '@/src/lib/logger';
import { revalidateCacheTags } from '@/src/lib/supabase/cache-helpers';
import { createClient } from '@/src/lib/supabase/server';
import type { Database, Tables } from '@/src/types/database.types';

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
  content_type: z.string(),
  content_slug: z
    .string()
    .max(200)
    .regex(/^[a-zA-Z0-9\-_/]+$/),
  notes: z.string().max(500).optional().nullable(),
  order: z.number().int().min(0).optional(),
});

const reviewSchema = z.object({
  content_type: z.enum([
    'agents',
    'mcp',
    'rules',
    'commands',
    'hooks',
    'statuslines',
    'collections',
    'guides',
    'skills',
    'jobs',
    'changelog',
  ]),
  content_slug: z
    .string()
    .max(200)
    .regex(/^[a-zA-Z0-9\-_/]+$/),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().max(2000).optional().nullable(),
});

const getReviewsSchema = z.object({
  content_type: z.enum([
    'agents',
    'mcp',
    'rules',
    'commands',
    'hooks',
    'statuslines',
    'collections',
    'guides',
    'skills',
    'jobs',
    'changelog',
  ]),
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
      const supabase = await createClient();
      const { data, error } = await supabase.rpc('manage_collection', {
        p_action: 'create',
        p_user_id: ctx.userId,
        p_data: parsedInput,
      });

      if (error) throw new Error(error.message);
      const result = data as unknown as {
        success: boolean;
        collection: Tables<'user_collections'>;
      };

      revalidatePath('/account');
      revalidatePath('/account/library');
      if (result.collection?.is_public) revalidatePath('/u/[slug]', 'page');

      // Statsig-powered cache invalidation
      const config = await cacheConfigs();
      const invalidateTags = config['cache.invalidate.collection_create'] as string[];
      revalidateCacheTags(invalidateTags);

      return result;
    } catch (error) {
      logger.error(
        'Failed to create collection',
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: ctx.userId,
          collectionName: parsedInput.name,
        }
      );
      throw error;
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
      const supabase = await createClient();
      const { data, error } = await supabase.rpc('manage_collection', {
        p_action: 'update',
        p_user_id: ctx.userId,
        p_data: parsedInput,
      });

      if (error) throw new Error(error.message);
      const result = data as unknown as {
        success: boolean;
        collection: Tables<'user_collections'>;
      };

      revalidatePath('/account');
      revalidatePath('/account/library');
      revalidatePath(`/account/library/${result.collection.slug}`);
      if (result.collection.is_public) revalidatePath('/u/[slug]', 'page');

      // Statsig-powered cache invalidation
      const config = await cacheConfigs();
      const invalidateTags = config['cache.invalidate.collection_update'] as string[];
      revalidateCacheTags(invalidateTags);

      return result;
    } catch (error) {
      logger.error(
        'Failed to update collection',
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: ctx.userId,
          collectionId: parsedInput.id,
        }
      );
      throw error;
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

      // Statsig-powered cache invalidation
      const config = await cacheConfigs();
      const invalidateTags = config['cache.invalidate.collection_delete'] as string[];
      revalidateCacheTags(invalidateTags);

      return data as { success: boolean };
    } catch (error) {
      logger.error(
        'Failed to delete collection',
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: ctx.userId,
          collectionId: parsedInput.id,
        }
      );
      throw error;
    }
  });

/**
 * Add an item to a collection
 */
export const addItemToCollection = authedAction
  .metadata({ actionName: 'addItemToCollection', category: 'user' })
  .schema(collectionItemSchema)
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

    // Statsig-powered cache invalidation
    const config = await cacheConfigs();
    const invalidateTags = config['cache.invalidate.collection_items'] as string[];
    revalidateCacheTags(invalidateTags);

    return data as unknown as { success: boolean; item: Tables<'collection_items'> };
  });

/**
 * Remove an item from a collection
 */
export const removeItemFromCollection = authedAction
  .metadata({ actionName: 'removeItemFromCollection', category: 'user' })
  .schema(z.object({ id: z.string(), collection_id: z.string() }))
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

    // Statsig-powered cache invalidation
    const config = await cacheConfigs();
    const invalidateTags = config['cache.invalidate.collection_items'] as string[];
    revalidateCacheTags(invalidateTags);

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

    // Statsig-powered cache invalidation
    const config = await cacheConfigs();
    const invalidateTags = config['cache.invalidate.collection_items'] as string[];
    revalidateCacheTags(invalidateTags);

    return {
      success: true,
      updated: result.updated,
    };
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

    // Statsig-powered cache invalidation + content-specific tags
    const config = await cacheConfigs();
    const invalidateTags = config['cache.invalidate.review_create'] as string[];
    revalidateCacheTags(invalidateTags);
    revalidateTag(`reviews:${content_type}:${content_slug}`, 'default');

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
  .schema(reviewUpdateSchema)
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

    // Statsig-powered cache invalidation + content-specific tags
    const config = await cacheConfigs();
    const invalidateTags = config['cache.invalidate.review_update'] as string[];
    revalidateCacheTags(invalidateTags);
    revalidateTag(`reviews:${content_type}:${content_slug}`, 'default');

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

    // Statsig-powered cache invalidation + content-specific tags
    const config = await cacheConfigs();
    const invalidateTags = config['cache.invalidate.review_delete'] as string[];
    revalidateCacheTags(invalidateTags);
    revalidateTag(`reviews:${result.content_type}:${result.content_slug}`, 'default');

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

    // Statsig-powered cache invalidation + content-specific tags
    const config = await cacheConfigs();
    const invalidateTags = config['cache.invalidate.review_helpful'] as string[];
    revalidateCacheTags(invalidateTags);
    revalidateTag(`reviews:${result.content_type}:${result.content_slug}`, 'default');

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
// USAGE TRACKING ACTIONS
// ============================================

/**
 * Track content usage (copy, download) - Database-First
 * Uses atomic track_content_usage() RPC (2 queries → 1, 50-100ms faster)
 */
export const trackUsage = rateLimitedAction
  .metadata({ actionName: 'trackUsage', category: 'content' })
  .schema(
    z.object({
      content_type: z.string(),
      content_slug: z.string(),
      action_type: z.enum(['copy', 'download_zip', 'download_markdown', 'llmstxt']),
    })
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const interactionType = parsedInput.action_type === 'copy' ? 'copy' : 'download';

    const { error } = await supabase.rpc('track_content_usage', {
      p_content_type: parsedInput.content_type,
      p_content_slug: parsedInput.content_slug,
      p_action_type: interactionType,
      ...(user?.id && { p_user_id: user.id }),
    });

    if (error) {
      logger.error('Failed to track usage', new Error(error.message), {
        content_type: parsedInput.content_type,
        content_slug: parsedInput.content_slug,
        action_type: parsedInput.action_type,
      });
      throw new Error(error.message);
    }

    revalidatePath(`/${parsedInput.content_type}/${parsedInput.content_slug}`);

    // Statsig-powered cache invalidation (usage counters need cache refresh)
    const config = await cacheConfigs();
    const invalidateTags = config['cache.invalidate.usage_tracking'] as string[];
    revalidateCacheTags(invalidateTags);

    return { success: true };
  });

// ============================================
// CONTENT FETCHING ACTIONS
// ============================================

/**
 * Fetch paginated content from edge function
 * Secure server-side wrapper for content-paginated edge function
 */
export async function fetchPaginatedContent(params: {
  offset: number;
  limit: number;
  category: string;
}): Promise<unknown[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!(supabaseUrl && supabaseKey)) {
      throw new Error('Missing Supabase environment variables');
    }

    const url = `${supabaseUrl}/functions/v1/content-paginated?offset=${params.offset}&limit=${params.limit}&category=${params.category}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 300 }, // 5 minute cache
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data as unknown[];
  } catch (error) {
    logger.error(
      'Failed to fetch paginated content',
      error instanceof Error ? error : new Error(String(error)),
      params
    );
    return [];
  }
}

// =====================================================
// CONTENT SUBMISSION ACTION
// =====================================================

/**
 * Submit content for review
 * Calls submit_content_for_review RPC with validation
 */
const submitContentSchema = z.object({
  submission_type: z.string(),
  name: z.string().min(2),
  description: z.string().min(10),
  category: z.string(),
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
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('submit_content_for_review', {
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
      });

      if (error) {
        logger.error('Failed to submit content via RPC', new Error(error.message), {
          submission_type: parsedInput.submission_type,
          name: parsedInput.name,
        });
        throw new Error(error.message);
      }

      const result = data as unknown as { success: boolean; submission_id: string };

      if (!result.success) {
        throw new Error('Content submission failed');
      }

      logger.info('Content submitted successfully', {
        submission_id: result.submission_id,
        submission_type: parsedInput.submission_type,
      });

      // Invalidate submissions cache
      const config = await cacheConfigs();
      const invalidateTags = config['cache.invalidate.submission_create'] as string[];
      revalidateCacheTags(invalidateTags);

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
