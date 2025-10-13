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
 * - Reputation management (recalculate, breakdown)
 * - Badge management (get badges, check new, trigger checks)
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
import { activityRepository } from '@/src/lib/repositories/activity.repository';
import { bookmarkRepository } from '@/src/lib/repositories/bookmark.repository';
import { followerRepository } from '@/src/lib/repositories/follower.repository';
import { reputationRepository } from '@/src/lib/repositories/reputation.repository';
import { type User, userRepository } from '@/src/lib/repositories/user.repository';
import { userBadgeRepository } from '@/src/lib/repositories/user-badge.repository';
import { userInteractionRepository } from '@/src/lib/repositories/user-interaction.repository';
import {
  activityFilterSchema,
  activitySummarySchema,
  activityTimelineResponseSchema,
  reputationBreakdownSchema,
} from '@/src/lib/schemas/activity.schema';
import { userIdSchema } from '@/src/lib/schemas/branded-types.schema';
import { nonEmptyString } from '@/src/lib/schemas/primitives/base-strings';
import { updateProfileSchema } from '@/src/lib/schemas/profile.schema';
import { contentCategorySchema } from '@/src/lib/schemas/shared.schema';
import { batchAll } from '@/src/lib/utils/batch.utils';

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

    // Filter out undefined values to avoid exactOptionalPropertyTypes issues
    const updateData = Object.fromEntries(
      Object.entries(parsedInput).filter(([_, value]) => value !== undefined)
    ) as Partial<User>;

    // Update via repository (includes caching and automatic error handling)
    const result = await userRepository.update(userId, updateData);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update profile');
    }

    if (!result.data) {
      throw new Error('Profile data not returned');
    }

    const data = result.data;

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
    rateLimit: {
      maxRequests: 5, // Limit to 5 refreshes per minute
      windowSeconds: 60,
    },
  })
  .schema(z.void())
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    // Refresh via repository (includes cache invalidation and syncing)
    const result = await userRepository.refreshFromOAuth(userId);

    if (!result.success) {
      throw new Error(result.error || 'Failed to refresh profile');
    }

    const profile = result.data;

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

// Bookmark schema
const bookmarkSchema = z.object({
  content_type: contentCategorySchema,
  content_slug: nonEmptyString
    .max(200, 'Content slug is too long')
    .regex(
      /^[a-zA-Z0-9-_/]+$/,
      'Slug can only contain letters, numbers, hyphens, underscores, and forward slashes'
    )
    .transform((val: string) => val.toLowerCase().trim()),
  notes: z.string().max(500).optional(),
});

/**
 * Add a bookmark
 */
export const addBookmark = authedAction
  .metadata({
    actionName: 'addBookmark',
    category: 'user',
  })
  .schema(bookmarkSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { content_type, content_slug, notes } = parsedInput;
    const { userId } = ctx;

    // Create bookmark via repository
    const result = await bookmarkRepository.create({
      user_id: userId,
      content_type,
      content_slug,
      notes: notes || null,
      created_at: new Date().toISOString(),
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create bookmark');
    }

    // Track interaction for personalization (fire-and-forget)
    userInteractionRepository
      .track(content_type, content_slug, 'bookmark', userId, undefined, {})
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
      bookmark: result.data,
    };
  });

/**
 * Remove a bookmark
 */
const removeBookmarkSchema = z.object({
  content_type: contentCategorySchema,
  content_slug: nonEmptyString,
});

export const removeBookmark = authedAction
  .metadata({
    actionName: 'removeBookmark',
    category: 'user',
  })
  .schema(removeBookmarkSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { content_type, content_slug } = parsedInput;
    const { userId } = ctx;

    // Delete bookmark via repository
    const result = await bookmarkRepository.deleteByUserAndContent(
      userId,
      content_type,
      content_slug
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to remove bookmark');
    }

    // Revalidate account pages
    revalidatePath('/account');
    revalidatePath('/account/library');

    // OPTIMIZATION: Invalidate personalization caches
    // User removed bookmark → For You feed should update recommendations
    revalidateTag(`user-${userId}`);
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

  // Check via repository
  const result = await bookmarkRepository.findByUserAndContent(user.id, content_type, content_slug);

  return result.success && result.data !== null;
}

/**
 * Add multiple bookmarks at once (bulk operation)
 * Useful for "save all recommendations" feature
 */
export const addBookmarkBatch = authedAction
  .metadata({
    actionName: 'addBookmarkBatch',
    category: 'user',
    rateLimit: {
      maxRequests: 10, // Limited to prevent abuse
      windowSeconds: 60,
    },
  })
  .schema(
    z.object({
      items: z
        .array(
          z.object({
            content_type: contentCategorySchema,
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
      revalidateTag(`user-${userId}`);
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
  user_id: userIdSchema,
  slug: z.string(), // User slug for revalidation
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

    if (action === 'follow') {
      // Create follow relationship via repository (includes caching)
      const result = await followerRepository.create({
        follower_id: userId,
        following_id: user_id,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to follow user');
      }

      // TODO: Send email notification (if user has follow_email enabled)
      // This would use resendService similar to existing email flows
    } else {
      // Delete follow relationship via repository (includes cache invalidation)
      const result = await followerRepository.deleteByUserIds(userId, user_id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to unfollow user');
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
 * Check if current user follows another user via repository (includes caching)
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

  // Validate user_id at boundary
  const validatedUserId = userIdSchema.parse(user_id);

  // Check via repository (includes caching)
  const result = await followerRepository.isFollowing(user.id, validatedUserId);

  return result.success ? (result.data ?? false) : false;
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

    // Fetch via repository (includes caching and parallel queries)
    const result = await activityRepository.getSummary(userId);

    if (!(result.success && result.data)) {
      throw new Error(result.error || 'Failed to fetch activity summary');
    }

    return result.data;
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
  .action(async ({ parsedInput: { type, limit, offset }, ctx }) => {
    const { userId } = ctx;

    // Fetch via repository (includes type filtering, sorting, and pagination)
    const result = await activityRepository.getTimeline(userId, {
      ...(type ? { type } : {}),
      limit,
      offset,
    });

    if (!(result.success && result.data)) {
      throw new Error(result.error || 'Failed to fetch activity timeline');
    }

    return result.data;
  });

// ============================================
// REPUTATION ACTIONS
// ============================================

/**
 * Manually recalculate user's reputation
 * Useful for debugging or if automatic triggers fail
 */
export const recalculateReputation = authedAction
  .metadata({
    actionName: 'recalculateReputation',
    category: 'user',
    rateLimit: {
      maxRequests: 5, // Limit recalculations
      windowSeconds: 60,
    },
  })
  .schema(z.void())
  .outputSchema(z.object({ new_score: z.number().int().nonnegative() }))
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    // Recalculate via repository (includes caching and error handling)
    const result = await reputationRepository.recalculate(userId);

    if (!result.success || result.data === undefined) {
      throw new Error(result.error || 'Failed to recalculate reputation');
    }

    // Get updated profile via repository (includes caching)
    const profileResult = await userRepository.findById(userId);
    const profile = profileResult.success ? profileResult.data : null;

    // Revalidate paths
    if (profile?.slug) {
      revalidatePath(`/u/${profile.slug}`);
    }
    revalidatePath('/account');
    revalidatePath('/account/activity');

    return {
      new_score: result.data,
    };
  });

/**
 * Get reputation breakdown
 * Shows how reputation was earned
 */
export const getReputationBreakdown = authedAction
  .metadata({
    actionName: 'getReputationBreakdown',
    category: 'user',
  })
  .schema(z.void())
  .outputSchema(reputationBreakdownSchema)
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    // Get breakdown via repository (includes caching and parallel queries)
    const result = await reputationRepository.getBreakdown(userId);

    if (!(result.success && result.data)) {
      throw new Error(result.error || 'Failed to fetch reputation breakdown');
    }

    return result.data;
  });

// ============================================
// BADGE ACTIONS
// ============================================

/**
 * Get user's badges with details
 */
export const getUserBadges = authedAction
  .metadata({
    actionName: 'getUserBadges',
    category: 'user',
  })
  .schema(z.object({ user_id: z.string().uuid().optional() }))
  .outputSchema(
    z.object({
      badges: z.array(
        z.object({
          id: z.string().uuid(),
          badge_id: z.string().uuid(),
          earned_at: z.string(),
          featured: z.boolean(),
          badge: z.object({
            slug: z.string(),
            name: z.string(),
            description: z.string(),
            icon: z.string().nullable(),
            category: z.string(),
          }),
        })
      ),
    })
  )
  .action(async ({ parsedInput: { user_id }, ctx }) => {
    // If no user_id provided, use current user
    const targetUserId = user_id || ctx.userId;

    // Fetch via repository (includes caching and badge details join)
    const result = await userBadgeRepository.findByUserWithBadgeDetails(targetUserId);

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch badges');
    }

    // Transform the data to match expected output format
    const badges = (result.data || []).map((item) => ({
      id: item.id,
      badge_id: item.badge_id,
      earned_at: item.earned_at,
      featured: item.featured,
      badge: {
        slug: item.badges.slug,
        name: item.badges.name,
        description: item.badges.description,
        icon: item.badges.icon,
        category: item.badges.category,
      },
    }));

    return {
      badges,
    };
  });

/**
 * Check for newly earned badges
 * Used for showing notifications
 */
export const checkNewBadges = authedAction
  .metadata({
    actionName: 'checkNewBadges',
    category: 'user',
  })
  .schema(z.object({ since: z.string().datetime().optional() }))
  .outputSchema(
    z.object({
      new_badges: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          icon: z.string().nullable(),
          earned_at: z.string(),
        })
      ),
    })
  )
  .action(async ({ parsedInput: { since }, ctx }) => {
    const { userId } = ctx;

    // Fetch via repository (includes caching and badge details join)
    const result = await userBadgeRepository.findRecentlyEarned(userId, since);

    if (!result.success) {
      throw new Error(result.error || 'Failed to check badges');
    }

    const newBadges = (result.data || []).map((item) => ({
      name: item.badge.name,
      description: item.badge.description,
      icon: item.badge.icon,
      earned_at: item.earned_at,
    }));

    return {
      new_badges: newBadges,
    };
  });

/**
 * Manually trigger badge check for current user
 * Useful for testing or if automatic triggers fail
 */
export const triggerBadgeCheck = authedAction
  .metadata({
    actionName: 'triggerBadgeCheck',
    category: 'user',
    rateLimit: {
      maxRequests: 10,
      windowSeconds: 60,
    },
  })
  .schema(z.void())
  .outputSchema(z.object({ badges_awarded: z.number().int().nonnegative() }))
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    // Get Supabase client for RPC call
    const { createClient } = await import('@/src/lib/supabase/server');
    const supabase = await createClient();

    // Call the database function
    const { data, error } = await supabase.rpc('check_all_badges', {
      target_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to check badges: ${error.message}`);
    }

    return {
      badges_awarded: (data as number) || 0,
    };
  });
