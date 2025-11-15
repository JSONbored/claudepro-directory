'use server';

/**
 * User Actions - Database-First Architecture
 * PostgreSQL validates ALL data. TypeScript provides compile-time types only.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { authedAction } from '@/src/lib/actions/safe-action';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { cacheConfigs } from '@/src/lib/flags';
import { logger } from '@/src/lib/logger';
import { revalidateCacheTags } from '@/src/lib/supabase/cache-helpers';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import { logActionFailure } from '@/src/lib/utils/error.utils';
import { Constants, type Enums } from '@/src/types/database.types';

// TypeScript types for RPC function returns (database validates, TypeScript trusts)
type ActivitySummary = {
  total_posts: number;
  total_comments: number;
  total_votes: number;
  total_submissions: number;
  merged_submissions: number;
  total_activity: number;
};

// Activity filter schema (query parameters - NOT stored data, validation is useful here)
const activityFilterSchema = z.object({
  type: z.enum(['post', 'comment', 'vote', 'submission']).optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

// Activity types (database validates structure via RPC function)
type BaseActivity = {
  id: string;
  type: 'post' | 'comment' | 'vote' | 'submission';
  created_at: string;
  user_id: string;
};

type PostActivity = BaseActivity & {
  type: 'post';
  title: string;
  body: string;
  content_type: string;
  content_slug: string;
  updated_at: string;
};

type CommentActivity = BaseActivity & {
  type: 'comment';
  body: string;
  post_id: string;
  parent_id: string | null;
  updated_at: string;
};

type VoteActivity = BaseActivity & {
  type: 'vote';
  vote_type: 'upvote' | 'downvote';
  post_id: string;
};

type SubmissionActivity = BaseActivity & {
  type: 'submission';
  title: string;
  description: string | null;
  content_type: string;
  submission_url: string | null;
  status: Enums<'submission_status'>;
  updated_at: string;
};

export type Activity = PostActivity | CommentActivity | VoteActivity | SubmissionActivity;

type ActivityTimelineResponse = {
  activities: Activity[];
  hasMore: boolean;
  total: number;
};

import { createClient } from '@/src/lib/supabase/server';

// Manual Zod schemas (database validates, Zod just provides type safety)
const bookmarkSchema = z.object({
  content_type: z.string(),
  content_slug: z
    .string()
    .max(200)
    .regex(/^[a-zA-Z0-9\-_/]+$/),
  notes: z.string().max(500).optional().nullable(),
});

export const updateProfile = authedAction
  .metadata({
    actionName: 'updateProfile' as const,
    category: 'user' as const,
  })
  .schema(
    z.object({
      display_name: z.string().optional(),
      bio: z.string().optional(),
      work: z.string().optional(),
      website: z.string().optional().or(z.literal('')),
      social_x_link: z.string().optional(),
      interests: z.array(z.string()).optional(),
      profile_public: z.boolean().optional(),
      follow_email: z.boolean().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { userId } = ctx;
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('update_user_profile', {
        p_user_id: userId,
        ...(parsedInput.display_name && { p_display_name: parsedInput.display_name }),
        ...(parsedInput.bio !== undefined && { p_bio: parsedInput.bio }),
        ...(parsedInput.work !== undefined && { p_work: parsedInput.work }),
        ...(parsedInput.website !== undefined && { p_website: parsedInput.website }),
        ...(parsedInput.social_x_link !== undefined && {
          p_social_x_link: parsedInput.social_x_link,
        }),
        ...(parsedInput.interests && { p_interests: parsedInput.interests }),
        ...(parsedInput.profile_public !== undefined && {
          p_profile_public: parsedInput.profile_public,
        }),
        ...(parsedInput.follow_email !== undefined && { p_follow_email: parsedInput.follow_email }),
      });

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      const result = data as { success: boolean; profile: { slug: string } };

      revalidatePath(`/u/${result.profile.slug}`);
      revalidatePath('/account');
      revalidatePath('/account/settings');

      // Statsig-powered cache invalidation
      const config = await cacheConfigs();
      const invalidateTags = config['cache.invalidate.user_update'] as string[];
      revalidateCacheTags(invalidateTags);
      revalidateTag(`user-${userId}`, 'default');

      return result;
    } catch (error) {
      throw logActionFailure('user.updateProfile', error, {
        userId: ctx.userId,
        hasDisplayName: Boolean(parsedInput.display_name),
      });
    }
  });

export const refreshProfileFromOAuth = authedAction
  .metadata({ actionName: 'refreshProfileFromOAuth', category: 'user' })
  .schema(z.void())
  .action(async ({ ctx }) => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc('refresh_profile_from_oauth', {
        user_id: ctx.userId,
      });
      if (error) throw new Error(`Failed to refresh profile from OAuth: ${error.message}`);

      const profile = data as { slug: string } | null;
      if (profile?.slug) revalidatePath(`/u/${profile.slug}`);
      revalidatePath('/account');
      revalidatePath('/account/settings');

      // Statsig-powered cache invalidation
      const config = await cacheConfigs();
      const invalidateTags = config['cache.invalidate.user_profile_oauth'] as string[];
      revalidateCacheTags(invalidateTags);
      revalidateTag(`user-${ctx.userId}`, 'default');

      return { success: true, message: 'Profile refreshed from OAuth provider' };
    } catch (error) {
      throw logActionFailure('user.refreshProfileFromOAuth', error, { userId: ctx.userId });
    }
  });

export const addBookmark = authedAction
  .metadata({
    actionName: 'addBookmark',
    category: 'user',
  })
  .schema(bookmarkSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { content_type, content_slug, notes } = parsedInput;
      const { userId } = ctx;
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('add_bookmark', {
        p_user_id: userId,
        p_content_type: content_type,
        p_content_slug: content_slug,
        ...(notes && { p_notes: notes }),
      });

      if (error) {
        throw new Error(`Failed to create bookmark: ${error.message}`);
      }

      revalidatePath('/account');
      revalidatePath('/account/library');

      // Statsig-powered cache invalidation
      const config = await cacheConfigs();
      const invalidateTags = config['cache.invalidate.bookmark_create'] as string[];
      revalidateCacheTags(invalidateTags);
      revalidateTag(`user-${userId}`, 'default');

      return data as { success: boolean; bookmark: unknown };
    } catch (error) {
      throw logActionFailure('user.addBookmark', error, {
        userId: ctx.userId,
        contentType: parsedInput.content_type,
        contentSlug: parsedInput.content_slug,
      });
    }
  });

export const removeBookmark = authedAction
  .metadata({
    actionName: 'removeBookmark',
    category: 'user',
  })
  .schema(bookmarkSchema.pick({ content_type: true, content_slug: true }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { content_type, content_slug } = parsedInput;
      const { userId } = ctx;
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('remove_bookmark', {
        p_user_id: userId,
        p_content_type: content_type,
        p_content_slug: content_slug,
      });

      if (error) {
        throw new Error(`Failed to delete bookmark: ${error.message}`);
      }

      revalidatePath('/account');
      revalidatePath('/account/library');

      // Statsig-powered cache invalidation + user-specific tag
      const config = await cacheConfigs();
      const invalidateTags = config['cache.invalidate.bookmark_delete'] as string[];
      revalidateCacheTags(invalidateTags);
      revalidateTag(`user-${userId}`, 'default');

      return data as { success: boolean };
    } catch (error) {
      throw logActionFailure('user.removeBookmark', error, {
        userId: ctx.userId,
        contentType: parsedInput.content_type,
        contentSlug: parsedInput.content_slug,
      });
    }
  });

export async function isBookmarked(content_type: string, content_slug: string): Promise<boolean> {
  const { user } = await getAuthenticatedUser({ context: 'isBookmarked' });
  if (!user) return false;

  const data = await cachedRPCWithDedupe<boolean>(
    'is_bookmarked',
    {
      p_user_id: user.id,
      p_content_type: content_type,
      p_content_slug: content_slug,
    },
    {
      tags: ['user-bookmarks', `user-${user.id}`, `content-${content_slug}`],
      ttlConfigKey: 'cache.user_bookmarks.ttl_seconds',
      keySuffix: `${user.id}-${content_type}-${content_slug}`,
    }
  );

  return data ?? false;
}

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
            content_type: z.enum([...Constants.public.Enums.content_category] as [
              Enums<'content_category'>,
              ...Enums<'content_category'>[],
            ]),
            content_slug: z.string().min(1),
          })
        )
        .min(1)
        .max(20),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { userId } = ctx;
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('batch_add_bookmarks', {
        p_user_id: userId,
        p_items: JSON.stringify(parsedInput.items),
      });

      if (error) {
        throw new Error(`Failed to save bookmarks: ${error.message}`);
      }

      const result = data as { success: boolean; saved_count: number; total_requested: number };

      revalidatePath('/account');
      revalidatePath('/account/library');

      // Statsig-powered cache invalidation + user-specific tag
      const config = await cacheConfigs();
      const invalidateTags = config['cache.invalidate.bookmark_create'] as string[];
      revalidateCacheTags(invalidateTags);
      revalidateTag(`user-${userId}`, 'default');

      return result;
    } catch (error) {
      throw logActionFailure('user.addBookmarkBatch', error, {
        userId: ctx.userId,
        itemCount: parsedInput.items.length,
      });
    }
  });

const followSchema = z.object({
  action: z.enum(['follow', 'unfollow']),
  user_id: z.string(), // Database validates UUID format
  slug: z.string(),
});

export const toggleFollow = authedAction
  .metadata({
    actionName: 'toggleFollow',
    category: 'user',
  })
  .schema(followSchema)
  .action(async ({ parsedInput: { action, user_id, slug }, ctx }) => {
    try {
      const { userId } = ctx;
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('toggle_follow', {
        p_follower_id: userId,
        p_following_id: user_id,
        p_action: action,
      });

      if (error) {
        throw new Error(`Failed to ${action} user: ${error.message}`);
      }

      revalidatePath(`/u/${slug}`);
      revalidatePath('/account');

      // Statsig-powered cache invalidation
      const config = await cacheConfigs();
      const invalidateTags = config['cache.invalidate.follow'] as string[];
      revalidateCacheTags(invalidateTags);
      revalidateTag(`user-${userId}`, 'default');
      revalidateTag(`user-${user_id}`, 'default');

      return data as { success: boolean; action: string };
    } catch (error) {
      logger.error(
        `Failed to ${action} user`,
        error instanceof Error ? error : new Error(String(error)),
        { userId: ctx.userId, targetUserId: user_id, action }
      );
      throw error;
    }
  });

export async function isFollowing(user_id: string): Promise<boolean> {
  const { user } = await getAuthenticatedUser({ context: 'isFollowing' });
  if (!user) return false;

  const data = await cachedRPCWithDedupe<boolean>(
    'is_following',
    {
      follower_id: user.id,
      following_id: user_id,
    },
    {
      tags: ['users', `user-${user.id}`, `user-${user_id}`],
      ttlConfigKey: 'cache.user_profile.ttl_seconds',
      keySuffix: `${user.id}-${user_id}`,
    }
  );

  return data ?? false;
}

/**
 * Batch check bookmark status for multiple items - Database-First
 * Eliminates N+1 queries (20 queries → 1, 95% reduction)
 */
export const getBookmarkStatusBatch = authedAction
  .metadata({ actionName: 'getBookmarkStatusBatch', category: 'user' })
  .schema(
    z.object({
      items: z.array(
        z.object({
          content_type: z.string(),
          content_slug: z.string(),
        })
      ),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const data = await cachedRPCWithDedupe<
      { content_type: string; content_slug: string; is_bookmarked: boolean }[]
    >(
      'is_bookmarked_batch',
      {
        p_user_id: ctx.userId,
        p_items: parsedInput.items,
      },
      {
        tags: ['user-bookmarks', `user-${ctx.userId}`],
        ttlConfigKey: 'cache.user_bookmarks.ttl_seconds',
        keySuffix: `${ctx.userId}-${JSON.stringify(parsedInput.items)}`,
      }
    );

    return new Map(
      (data || []).map((row) => [`${row.content_type}:${row.content_slug}`, row.is_bookmarked])
    );
  });

/**
 * Batch check follow status for multiple users - Database-First
 * Eliminates N+1 queries (20 queries → 1, 95% reduction)
 */
export const getFollowStatusBatch = authedAction
  .metadata({ actionName: 'getFollowStatusBatch', category: 'user' })
  .schema(
    z.object({
      user_ids: z.array(z.string().uuid()),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const data = await cachedRPCWithDedupe<{ followed_user_id: string; is_following: boolean }[]>(
      'is_following_batch',
      {
        p_follower_id: ctx.userId,
        p_followed_user_ids: parsedInput.user_ids,
      },
      {
        tags: ['users', `user-${ctx.userId}`],
        ttlConfigKey: 'cache.user_profile.ttl_seconds',
        keySuffix: `${ctx.userId}-${parsedInput.user_ids.sort().join('-')}`,
      }
    );

    return new Map((data || []).map((row) => [row.followed_user_id, row.is_following]));
  });

export const getActivitySummary = authedAction
  .metadata({ actionName: 'getActivitySummary', category: 'user' })
  .schema(z.void())
  .action(async ({ ctx }) => {
    try {
      const data = await cachedRPCWithDedupe<ActivitySummary>(
        'get_user_activity_summary',
        {
          p_user_id: ctx.userId,
        },
        {
          tags: ['user-activity', `user-${ctx.userId}`],
          ttlConfigKey: 'cache.user_activity.ttl_seconds',
          keySuffix: `${ctx.userId}-summary`,
        }
      );

      if (!data) throw new Error('Failed to fetch user activity summary');

      return data;
    } catch (error) {
      logger.error(
        'Failed to get activity summary',
        error instanceof Error ? error : new Error(String(error)),
        { userId: ctx.userId }
      );
      throw error;
    }
  });

export const getActivityTimeline = authedAction
  .metadata({ actionName: 'getActivityTimeline', category: 'user' })
  .schema(activityFilterSchema)
  .action(async ({ parsedInput: { type, limit = 20, offset = 0 }, ctx }) => {
    try {
      const data = await cachedRPCWithDedupe<ActivityTimelineResponse>(
        'get_user_activity_timeline',
        {
          p_user_id: ctx.userId,
          ...(type && { p_type: type }),
          p_limit: limit,
          p_offset: offset,
        },
        {
          tags: ['user-activity', `user-${ctx.userId}`],
          ttlConfigKey: 'cache.user_activity.ttl_seconds',
          keySuffix: `${ctx.userId}-${type ?? 'all'}-${limit}-${offset}`,
        }
      );

      if (!data) throw new Error('Failed to fetch activity timeline');

      return data;
    } catch (error) {
      logger.error(
        'Failed to get activity timeline',
        error instanceof Error ? error : new Error(String(error)),
        { userId: ctx.userId, type: type || 'all', limit, offset }
      );
      throw error;
    }
  });

export const getUserIdentities = authedAction
  .metadata({ actionName: 'getUserIdentities', category: 'user' })
  .schema(z.void())
  .action(async ({ ctx }) => {
    try {
      const data = await cachedRPCWithDedupe<{
        identities: Array<{
          provider: string;
          email: string;
          created_at: string;
          last_sign_in_at: string;
        }>;
      }>(
        'get_user_identities',
        {
          p_user_id: ctx.userId,
        },
        {
          tags: ['users', `user-${ctx.userId}`],
          ttlConfigKey: 'cache.user_stats.ttl_seconds',
          keySuffix: `${ctx.userId}-identities`,
        }
      );

      if (!data) throw new Error('Failed to fetch user identities');

      return data;
    } catch (error) {
      logger.error(
        'Failed to get user identities',
        error instanceof Error ? error : new Error(String(error)),
        { userId: ctx.userId }
      );
      throw error;
    }
  });

/**
 * Unlink OAuth Provider Action
 * Removes an OAuth identity from the user's account
 * Database RPC validates that at least 1 provider remains (prevents lockout)
 */
export const unlinkOAuthProvider = authedAction
  .metadata({ actionName: 'unlinkOAuthProvider', category: 'user' })
  .schema(
    z.object({
      provider: z.string().min(1, 'Provider name is required'),
    })
  )
  .action(async ({ parsedInput: { provider }, ctx }) => {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase.rpc('unlink_oauth_provider', {
        p_provider: provider,
      });

      if (error) {
        logger.error('Failed to unlink OAuth provider', error, {
          userId: ctx.userId,
          provider,
        });
        return {
          success: false,
          error: error.message || 'Failed to unlink provider',
        };
      }

      // Database RPC returns JSONB with success/error
      const result = data as {
        success: boolean;
        error?: string;
        message?: string;
        provider?: string;
        remaining_providers?: number;
      };

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to unlink provider',
        };
      }

      // Revalidate account settings page
      revalidatePath('/account/settings');

      // Statsig-powered cache invalidation
      const config = await cacheConfigs();
      const invalidateTags = config['cache.invalidate.oauth_unlink'] as string[];
      revalidateCacheTags(invalidateTags);
      revalidateTag(`user-${ctx.userId}`, 'default');

      return {
        success: true,
        message: result.message || `Successfully unlinked ${provider}`,
        remainingProviders: result.remaining_providers,
      };
    } catch (error) {
      logger.error(
        'Failed to unlink OAuth provider',
        error instanceof Error ? error : new Error(String(error)),
        { userId: ctx.userId, provider }
      );
      throw error;
    }
  });

export async function ensureUserRecord(params: {
  id: string;
  email: string | null;
  name?: string | null;
  image?: string | null;
}) {
  'use server';

  const supabase = await createClient();
  const payload = {
    id: params.id,
    email: params.email,
    name: params.name ?? null,
    image: params.image ?? null,
    profile_public: true,
    follow_email: true,
  };

  const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
  if (error) {
    throw new Error(`Failed to ensure user record: ${error.message}`);
  }

  const config = await cacheConfigs();
  const invalidateTags = config['cache.invalidate.user_update'] as string[] | undefined;
  if (invalidateTags?.length) {
    revalidateCacheTags(invalidateTags);
  }
  revalidateTag(`user-${params.id}`, 'default');
}
