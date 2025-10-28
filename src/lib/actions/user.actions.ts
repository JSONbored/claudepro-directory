'use server';

/**
 * User Actions
 * Consolidated server actions for all user-related functionality
 *
 * This file consolidates the following domains into a single, tree-shakeable module:
 * - Profile management (update, refresh from OAuth)
 * - Bookmarks (add, remove, batch operations, check status)
 * - Follow relationships (follow/unfollow, check status)
 * - Activity tracking (summary, timeline)
 *
 * Architecture:
 * - All actions use authedAction or rateLimitedAction middleware
 * - Repository pattern for database operations
 * - Fully tree-shakeable with named exports
 * - Type-safe with Zod schemas
 *
 * Benefits:
 * - Single source of truth for user domain
 * - Reduced import overhead
 * - Consistent error handling and logging
 * - Easier maintenance and testing
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { authedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import { publicUserActivitySummaryRowSchema } from '@/src/lib/schemas/generated/db-schemas';
import type { Database, Tables } from '@/src/types/database.types';

// ActivitySummary from materialized view (internal only - not exported from 'use server' file)
const activitySummarySchema = publicUserActivitySummaryRowSchema.pick({
  total_posts: true,
  total_comments: true,
  total_votes: true,
  total_submissions: true,
  merged_submissions: true,
  total_activity: true,
});

type ActivitySummary = z.infer<typeof activitySummarySchema>;

// Activity types - Database-first (internal to this file only)
// Components using these types should define them inline with Database types
type PostActivity = Database['public']['Tables']['posts']['Row'] & { type: 'post' };
type CommentActivity = Database['public']['Tables']['comments']['Row'] & { type: 'comment' };
type VoteActivity = Database['public']['Tables']['votes']['Row'] & { type: 'vote' };
type SubmissionActivity = Database['public']['Tables']['submissions']['Row'] & {
  type: 'submission';
};
type Activity = PostActivity | CommentActivity | VoteActivity | SubmissionActivity;

// Activity filter schema (for timeline queries)
const activityFilterSchema = z.object({
  type: z.enum(['post', 'comment', 'vote', 'submission']).optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

const activityTimelineResponseSchema = z.object({
  activities: z.array(z.any()), // Union types complex, validated at runtime
  hasMore: z.boolean(),
  total: z.number(),
});

import { publicUsersUpdateSchema } from '@/src/lib/schemas/generated/db-schemas';
import { nonEmptyString } from '@/src/lib/schemas/primitives';
import { categoryIdSchema } from '@/src/lib/schemas/shared.schema';
import {
  bookmarkInsertTransformSchema,
  removeBookmarkSchema,
} from '@/src/lib/schemas/transforms/data-normalization.schema';

// ========================================================================
// INLINE SCHEMAS (database-first approach)
// ========================================================================

/**
 * Profile update schema - Uses generated database schema
 */
const updateProfileSchema = publicUsersUpdateSchema.pick({
  display_name: true,
  bio: true,
  work: true,
  website: true,
  social_x_link: true,
  interests: true,
  profile_public: true,
  follow_email: true,
});

import { createClient } from '@/src/lib/supabase/server';
import { batchAll } from '@/src/lib/utils/batch.utils';

// Database-first types (from generated database schema)
type User = Database['public']['Tables']['users']['Row'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

// ============================================
// PROFILE ACTIONS
// ============================================

/**
 * Update user profile
 */
export const updateProfile = authedAction
  .metadata({
    actionName: 'updateProfile',
    category: 'user',
  })
  .schema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    // Transform data for database storage
    // Empty strings → null for nullable text fields (bio, work, website, social_x_link)
    // This handles the impedance mismatch between form inputs (empty string for clearing)
    // and database representation (null for absent values)
    const updateData: Partial<User> = {};

    for (const [key, value] of Object.entries(parsedInput)) {
      if (value !== undefined) {
        // Convert empty strings to null for nullable text fields
        if (['bio', 'work', 'website', 'social_x_link'].includes(key) && value === '') {
          updateData[key as keyof User] = null as never;
        } else {
          updateData[key as keyof User] = value as never;
        }
      }
    }

    const supabase = await createClient();

    // Filter out undefined values to avoid exactOptionalPropertyTypes issues
    const filteredUpdateData = Object.fromEntries(
      Object.entries({
        ...updateData,
        updated_at: new Date().toISOString(),
      }).filter(([_, value]) => value !== undefined)
    ) as UserUpdate;

    // Update user profile directly
    const { data, error } = await supabase
      .from('users')
      .update(filteredUpdateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    if (!data) {
      throw new Error('Profile data not returned');
    }

    // Revalidate relevant paths
    revalidatePath(`/u/${data.slug}`);
    revalidatePath('/account');
    revalidatePath('/account/settings');

    return {
      success: true,
      profile: data,
    };
  });

/**
 * Refresh profile from OAuth provider
 * Syncs latest avatar and name from GitHub/Google
 */
export const refreshProfileFromOAuth = authedAction
  .metadata({
    actionName: 'refreshProfileFromOAuth',
    category: 'user',
  })
  .schema(z.void())
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    const supabase = await createClient();

    // Call the database function that syncs from auth.users
    const { error: rpcError } = await supabase.rpc('refresh_profile_from_oauth', {
      user_id: userId,
    });

    if (rpcError) {
      throw new Error(`Failed to refresh profile from OAuth: ${rpcError.message}`);
    }

    // Fetch the updated user
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch refreshed user: ${error.message}`);
    }

    // Revalidate paths
    if (profile?.slug) {
      revalidatePath(`/u/${profile.slug}`);
    }
    revalidatePath('/account');
    revalidatePath('/account/settings');

    return {
      success: true,
      message: 'Profile refreshed from OAuth provider',
    };
  });

// ============================================
// BOOKMARK ACTIONS
// ============================================

/**
 * Add a bookmark
 */
export const addBookmark = authedAction
  .metadata({
    actionName: 'addBookmark',
    category: 'user',
  })
  .schema(bookmarkInsertTransformSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { content_type, content_slug, notes } = parsedInput;
    const { userId } = ctx;

    const supabase = await createClient();

    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        content_type,
        content_slug,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate constraint
      if (error.code === '23505') {
        throw new Error('Bookmark already exists');
      }
      throw new Error(`Failed to create bookmark: ${error.message}`);
    }

    // Track interaction for personalization (fire-and-forget)
    createClient()
      .then((supabaseForTracking) =>
        supabaseForTracking.from('user_interactions').insert({
          content_type,
          content_slug,
          interaction_type: 'bookmark',
          user_id: userId,
          session_id: null,
          metadata: null,
        })
      )
      .catch((err) => {
        logger.warn('Failed to track bookmark interaction', undefined, {
          content_type,
          content_slug,
          error: err instanceof Error ? err.message : String(err),
        });
      });

    // Revalidate account pages
    revalidatePath('/account');
    revalidatePath('/account/library');

    // OPTIMIZATION: Invalidate personalization caches
    // User bookmarked content → For You feed should update recommendations
    revalidatePath('/for-you');

    return {
      success: true,
      bookmark,
    };
  });

/**
 * Remove a bookmark
 */
export const removeBookmark = authedAction
  .metadata({
    actionName: 'removeBookmark',
    category: 'user',
  })
  .schema(removeBookmarkSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { content_type, content_slug } = parsedInput;
    const { userId } = ctx;

    const supabase = await createClient();

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('content_type', content_type)
      .eq('content_slug', content_slug);

    if (error) {
      throw new Error(`Failed to delete bookmark: ${error.message}`);
    }

    // Revalidate account pages
    revalidatePath('/account');
    revalidatePath('/account/library');

    // OPTIMIZATION: Invalidate personalization caches
    // User removed bookmark → For You feed should update recommendations
    revalidateTag(`user-${userId}`, 'max');
    revalidatePath('/for-you');

    return {
      success: true,
    };
  });

/**
 * Check if content is bookmarked
 * Note: This is a server action for client components
 */
export async function isBookmarked(content_type: string, content_slug: string): Promise<boolean> {
  const { createClient } = await import('@/src/lib/supabase/server');
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  // Check bookmark existence
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('content_type', content_type)
    .eq('content_slug', content_slug)
    .single();

  if (error && error.code !== 'PGRST116') {
    // Log error but don't throw - return false for robustness
    logger.warn('Failed to check bookmark', undefined, { error: error.message });
  }

  return data !== null;
}

/**
 * Add multiple bookmarks at once (bulk operation)
 * Useful for "save all recommendations" feature
 */
export const addBookmarkBatch = authedAction
  .metadata({
    actionName: 'addBookmarkBatch',
    category: 'user',
  })
  .schema(
    z.object({
      items: z
        .array(
          z.object({
            content_type: categoryIdSchema,
            content_slug: nonEmptyString,
          })
        )
        .min(1)
        .max(20), // Max 20 bookmarks at once
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    // Get Supabase client for direct database operations
    const { createClient } = await import('@/src/lib/supabase/server');
    const supabase = await createClient();

    try {
      // Prepare batch insert
      const bookmarksToInsert = parsedInput.items.map((item) => ({
        user_id: userId,
        content_type: item.content_type,
        content_slug: item.content_slug,
        notes: null,
      }));

      // Batch insert (will skip duplicates due to unique constraint)
      const { data, error } = await supabase
        .from('bookmarks')
        .upsert(bookmarksToInsert, {
          onConflict: 'user_id,content_type,content_slug',
          ignoreDuplicates: true,
        })
        .select();

      if (error) {
        logger.error('Failed to batch bookmark', error);
        throw new Error('Failed to save bookmarks');
      }

      // Track interactions for each bookmark (non-blocking)
      const interactionPromises = parsedInput.items.map((item) =>
        Promise.resolve(
          supabase
            .from('user_interactions')
            .insert({
              user_id: userId,
              content_type: item.content_type,
              content_slug: item.content_slug,
              interaction_type: 'bookmark',
              metadata: { source: 'bulk_save' },
            })
            .then(({ error: intError }) => {
              if (intError) {
                logger.warn('Failed to track batch bookmark interaction', undefined, {
                  content_type: item.content_type,
                  content_slug: item.content_slug,
                });
              }
            })
        )
      );

      // Fire and forget interaction tracking
      batchAll(interactionPromises, 'bookmark-interactions').catch(() => {
        // Non-critical - don't block on tracking failures
      });

      // Revalidate pages
      revalidatePath('/account');
      revalidatePath('/account/library');

      // OPTIMIZATION: Invalidate personalization caches
      // Bulk bookmark operation → For You feed should update recommendations
      revalidateTag(`user-${userId}`, 'max');
      revalidatePath('/for-you');

      return {
        success: true,
        saved_count: data?.length || 0,
        total_requested: parsedInput.items.length,
      };
    } catch (error) {
      logger.error(
        'Batch bookmark failed',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error('Failed to save bookmarks');
    }
  });

// ============================================
// FOLLOW ACTIONS
// ============================================

const followSchema = z.object({
  action: z.enum(['follow', 'unfollow']),
  user_id: nonEmptyString.uuid(),
  slug: z.string(),
});

/**
 * Follow/unfollow a user
 */
export const toggleFollow = authedAction
  .metadata({
    actionName: 'toggleFollow',
    category: 'user',
  })
  .schema(followSchema)
  .action(async ({ parsedInput: { action, user_id, slug }, ctx }) => {
    const { userId } = ctx;

    // Can't follow yourself
    if (userId === user_id) {
      throw new Error('You cannot follow yourself');
    }

    const supabase = await createClient();

    if (action === 'follow') {
      // Create follow relationship
      const { error } = await supabase.from('followers').insert({
        follower_id: userId,
        following_id: user_id,
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error('You are already following this user');
        }
        throw new Error(`Failed to follow user: ${error.message}`);
      }

      // TODO: Send email notification (if user has follow_email enabled)
      // This would use resendService similar to existing email flows
    } else {
      // Delete follow relationship
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', user_id);

      if (error) {
        throw new Error(`Failed to unfollow user: ${error.message}`);
      }
    }

    revalidatePath(`/u/${slug}`);
    revalidatePath('/account');

    return {
      success: true,
      action,
    };
  });

/**
 * Check if current user follows another user
 */
export async function isFollowing(user_id: string): Promise<boolean> {
  const { createClient } = await import('@/src/lib/supabase/server');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const validatedUserId = nonEmptyString.uuid().parse(user_id);

  // Check if follow relationship exists
  const { data, error } = await supabase
    .from('followers')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', validatedUserId)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.warn('Failed to check follow status', undefined, { error: error.message });
  }

  return data !== null;
}

// ============================================
// ACTIVITY ACTIONS
// ============================================

/**
 * Get user's activity summary statistics
 */
export const getActivitySummary = authedAction
  .metadata({
    actionName: 'getActivitySummary',
    category: 'user',
  })
  .schema(z.void())
  .outputSchema(activitySummarySchema)
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    const supabase = await createClient();

    // Query materialized view (replaces 5 parallel queries with 1 indexed query)
    // View is refreshed daily at 2 AM UTC via pg_cron
    const { data, error } = await supabase
      .from('user_activity_summary')
      .select(
        'total_posts, total_comments, total_votes, total_submissions, merged_submissions, total_activity'
      )
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user activity summary: ${error.message}`);
    }

    const summary: ActivitySummary = {
      total_posts: data?.total_posts ?? 0,
      total_comments: data?.total_comments ?? 0,
      total_votes: data?.total_votes ?? 0,
      total_submissions: data?.total_submissions ?? 0,
      merged_submissions: data?.merged_submissions ?? 0,
      total_activity: data?.total_activity ?? 0,
    };

    return summary;
  });

/**
 * Get user's activity timeline
 */
export const getActivityTimeline = authedAction
  .metadata({
    actionName: 'getActivityTimeline',
    category: 'user',
  })
  .schema(activityFilterSchema)
  .outputSchema(activityTimelineResponseSchema)
  .action(async ({ parsedInput: { type, limit = 20, offset = 0 }, ctx }) => {
    const { userId } = ctx;

    const supabase = await createClient();
    const activities: Activity[] = [];

    // Fetch posts if no filter or filter is 'post'
    if (!type || type === 'post') {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch posts: ${error.message}`);
      }

      if (posts) {
        activities.push(...posts.map((post): PostActivity => ({ ...post, type: 'post' })));
      }
    }

    // Fetch comments if no filter or filter is 'comment'
    if (!type || type === 'comment') {
      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch comments: ${error.message}`);
      }

      if (comments) {
        activities.push(
          ...comments.map((comment): CommentActivity => ({ ...comment, type: 'comment' }))
        );
      }
    }

    // Fetch votes if no filter or filter is 'vote'
    if (!type || type === 'vote') {
      const { data: votes, error } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch votes: ${error.message}`);
      }

      if (votes) {
        activities.push(...votes.map((vote): VoteActivity => ({ ...vote, type: 'vote' })));
      }
    }

    // Fetch submissions if no filter or filter is 'submission'
    if (!type || type === 'submission') {
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*')
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
            (submission): SubmissionActivity => ({ ...submission, type: 'submission' })
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
      total: activities.length,
    };
  });
