'use server';

/**
 * User Actions - Database-First Architecture
 * PostgreSQL validates ALL data. TypeScript provides compile-time types only.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { resolveInvalidateTags as resolveCacheInvalidateTags } from '@/src/lib/actions/action-helpers';
import { authedAction } from '@/src/lib/actions/safe-action';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import {
  type CacheConfigPromise,
  type CacheInvalidateKey,
  getCacheConfigSnapshot,
} from '@/src/lib/data/config/cache-config';
import { revalidateCacheTags } from '@/src/lib/supabase/cache-helpers';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import { createClient } from '@/src/lib/supabase/server';
import { logActionFailure } from '@/src/lib/utils/error.utils';
import { Constants, type Database, type Enums, type Tables } from '@/src/types/database.types';

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

type UserSurface = 'account' | 'library' | 'settings';
type PublicRpc = keyof Database['public']['Functions'] | 'ensure_user_record';

const USER_SURFACE_PATHS: Record<UserSurface, string> = {
  account: '/account',
  library: '/account/library',
  settings: '/account/settings',
};

interface RunUserRpcContext {
  action: string;
  userId?: string;
  meta?: Record<string, unknown>;
}

async function invalidateUserCaches({
  cacheConfigPromise,
  invalidateKeys,
  extraTags,
  userIds,
}: {
  cacheConfigPromise?: CacheConfigPromise;
  invalidateKeys?: CacheInvalidateKey[];
  extraTags?: string[];
  userIds?: Array<string | null | undefined>;
}): Promise<void> {
  const tags = new Set(extraTags ?? []);
  if (invalidateKeys?.length) {
    const resolved = await resolveCacheInvalidateTags(invalidateKeys, cacheConfigPromise);
    for (const tag of resolved) {
      tags.add(tag);
    }
  }

  if (tags.size) {
    await revalidateCacheTags([...tags]);
  }

  if (userIds?.length) {
    await Promise.allSettled(
      userIds
        .filter((id): id is string => Boolean(id))
        .map((id) => revalidateTag(`user-${id}`, 'default'))
    );
  }
}

async function revalidateUserSurfaces({
  slug,
  accountSections,
}: {
  slug?: string | null;
  accountSections?: UserSurface[];
}): Promise<void> {
  const paths = new Set<string>();
  if (slug) {
    paths.add(`/u/${slug}`);
  }
  if (accountSections) {
    for (const section of accountSections) {
      const path = USER_SURFACE_PATHS[section];
      if (path) {
        paths.add(path);
      }
    }
  }

  if (!paths.size) {
    return;
  }

  await Promise.allSettled([...paths].map((path) => revalidatePath(path)));
}

async function runUserRpc<ResultType>(
  rpcName: PublicRpc,
  args: Record<string, unknown>,
  context: RunUserRpcContext
): Promise<ResultType> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc(rpcName, args);
    if (error) {
      throw new Error(error.message);
    }
    return data as ResultType;
  } catch (error) {
    throw logActionFailure(context.action, error, {
      rpc: rpcName,
      userId: context.userId,
      ...(context.meta ?? {}),
    });
  }
}

async function cachedUserData<ResultType>(
  rpcName: PublicRpc,
  args: Record<string, unknown>,
  cacheOptions: Parameters<typeof cachedRPCWithDedupe>[2],
  context: RunUserRpcContext
): Promise<ResultType | null | undefined> {
  try {
    return await cachedRPCWithDedupe<ResultType>(rpcName, args, cacheOptions);
  } catch (error) {
    throw logActionFailure(context.action, error, {
      rpc: rpcName,
      userId: context.userId,
      ...(context.meta ?? {}),
    });
  }
}

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
    const cacheConfigPromise = getCacheConfigSnapshot();
    const result = await runUserRpc<{ success: boolean; profile: { slug: string } }>(
      'update_user_profile',
      {
        p_user_id: ctx.userId,
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
      },
      {
        action: 'user.updateProfile',
        userId: ctx.userId,
        meta: { hasDisplayName: Boolean(parsedInput.display_name) },
      }
    );

    await revalidateUserSurfaces({
      slug: result.profile.slug ?? null,
      accountSections: ['account', 'settings'],
    });

    await invalidateUserCaches({
      cacheConfigPromise,
      invalidateKeys: ['cache.invalidate.user_update'],
      userIds: [ctx.userId],
    });

    return result;
  });

async function refreshProfileFromOAuthInternal(userId: string) {
  const cacheConfigPromise = getCacheConfigSnapshot();
  const profile = await runUserRpc<{ slug: string } | null>(
    'refresh_profile_from_oauth',
    { user_id: userId },
    { action: 'user.refreshProfileFromOAuth', userId }
  );

  await revalidateUserSurfaces({
    slug: profile?.slug ?? null,
    accountSections: ['account', 'settings'],
  });

  await invalidateUserCaches({
    cacheConfigPromise,
    invalidateKeys: ['cache.invalidate.user_profile_oauth'],
    userIds: [userId],
  });

  return { success: true, slug: profile?.slug ?? null };
}

export async function refreshProfileFromOAuthServer(userId: string) {
  return refreshProfileFromOAuthInternal(userId);
}

export const refreshProfileFromOAuth = authedAction
  .metadata({ actionName: 'refreshProfileFromOAuth', category: 'user' })
  .schema(z.void())
  .action(async ({ ctx }) => {
    const result = await refreshProfileFromOAuthInternal(ctx.userId);
    return { success: true, message: 'Profile refreshed from OAuth provider', slug: result.slug };
  });

export const addBookmark = authedAction
  .metadata({
    actionName: 'addBookmark',
    category: 'user',
  })
  .schema(bookmarkSchema)
  .action(async ({ parsedInput, ctx }) => {
    const cacheConfigPromise = getCacheConfigSnapshot();
    const { content_type, content_slug, notes } = parsedInput;

    const data = await runUserRpc<{ success: boolean; bookmark: unknown }>(
      'add_bookmark',
      {
        p_user_id: ctx.userId,
        p_content_type: content_type,
        p_content_slug: content_slug,
        ...(notes && { p_notes: notes }),
      },
      {
        action: 'user.addBookmark',
        userId: ctx.userId,
        meta: { contentType: content_type, contentSlug: content_slug },
      }
    );

    await revalidateUserSurfaces({ accountSections: ['account', 'library'] });
    await invalidateUserCaches({
      cacheConfigPromise,
      invalidateKeys: ['cache.invalidate.bookmark_create'],
      extraTags: ['user-bookmarks', `content-${content_slug}`],
      userIds: [ctx.userId],
    });

    return data;
  });

export const removeBookmark = authedAction
  .metadata({
    actionName: 'removeBookmark',
    category: 'user',
  })
  .schema(bookmarkSchema.pick({ content_type: true, content_slug: true }))
  .action(async ({ parsedInput, ctx }) => {
    const cacheConfigPromise = getCacheConfigSnapshot();
    const { content_type, content_slug } = parsedInput;

    const data = await runUserRpc<{ success: boolean }>(
      'remove_bookmark',
      {
        p_user_id: ctx.userId,
        p_content_type: content_type,
        p_content_slug: content_slug,
      },
      {
        action: 'user.removeBookmark',
        userId: ctx.userId,
        meta: { contentType: content_type, contentSlug: content_slug },
      }
    );

    await revalidateUserSurfaces({ accountSections: ['account', 'library'] });
    await invalidateUserCaches({
      cacheConfigPromise,
      invalidateKeys: ['cache.invalidate.bookmark_delete'],
      extraTags: ['user-bookmarks', `content-${content_slug}`],
      userIds: [ctx.userId],
    });

    return data;
  });

export async function isBookmarked(content_type: string, content_slug: string): Promise<boolean> {
  const { user } = await getAuthenticatedUser({ context: 'isBookmarked' });
  if (!user) return false;

  const data = await cachedUserData<boolean>(
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
    },
    {
      action: 'user.isBookmarked',
      userId: user.id,
      meta: { contentType: content_type, contentSlug: content_slug },
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
    const cacheConfigPromise = getCacheConfigSnapshot();
    const result = await runUserRpc<{
      success: boolean;
      saved_count: number;
      total_requested: number;
    }>(
      'batch_add_bookmarks',
      {
        p_user_id: ctx.userId,
        p_items: JSON.stringify(parsedInput.items),
      },
      {
        action: 'user.addBookmarkBatch',
        userId: ctx.userId,
        meta: { itemCount: parsedInput.items.length },
      }
    );

    await revalidateUserSurfaces({ accountSections: ['account', 'library'] });
    await invalidateUserCaches({
      cacheConfigPromise,
      invalidateKeys: ['cache.invalidate.bookmark_create'],
      extraTags: ['user-bookmarks'],
      userIds: [ctx.userId],
    });

    return result;
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
    const cacheConfigPromise = getCacheConfigSnapshot();
    const result = await runUserRpc<{ success: boolean; action: string }>(
      'toggle_follow',
      {
        p_follower_id: ctx.userId,
        p_following_id: user_id,
        p_action: action,
      },
      {
        action: 'user.toggleFollow',
        userId: ctx.userId,
        meta: { targetUserId: user_id, followAction: action },
      }
    );

    await revalidateUserSurfaces({
      slug,
      accountSections: ['account'],
    });
    await invalidateUserCaches({
      cacheConfigPromise,
      invalidateKeys: ['cache.invalidate.follow'],
      extraTags: ['users'],
      userIds: [ctx.userId, user_id],
    });

    return result;
  });

export async function isFollowing(user_id: string): Promise<boolean> {
  const { user } = await getAuthenticatedUser({ context: 'isFollowing' });
  if (!user) return false;

  const data = await cachedUserData<boolean>(
    'is_following',
    {
      follower_id: user.id,
      following_id: user_id,
    },
    {
      tags: ['users', `user-${user.id}`, `user-${user_id}`],
      ttlConfigKey: 'cache.user_profile.ttl_seconds',
      keySuffix: `${user.id}-${user_id}`,
    },
    {
      action: 'user.isFollowing',
      userId: user.id,
      meta: { targetUserId: user_id },
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
    const data = await cachedUserData<
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
      },
      {
        action: 'user.getBookmarkStatusBatch',
        userId: ctx.userId,
        meta: { itemCount: parsedInput.items.length },
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
    const data = await cachedUserData<{ followed_user_id: string; is_following: boolean }[]>(
      'is_following_batch',
      {
        p_follower_id: ctx.userId,
        p_followed_user_ids: parsedInput.user_ids,
      },
      {
        tags: ['users', `user-${ctx.userId}`],
        ttlConfigKey: 'cache.user_profile.ttl_seconds',
        keySuffix: `${ctx.userId}-${parsedInput.user_ids.sort().join('-')}`,
      },
      {
        action: 'user.getFollowStatusBatch',
        userId: ctx.userId,
        meta: { itemCount: parsedInput.user_ids.length },
      }
    );

    return new Map((data || []).map((row) => [row.followed_user_id, row.is_following]));
  });

export const getActivitySummary = authedAction
  .metadata({ actionName: 'getActivitySummary', category: 'user' })
  .schema(z.void())
  .action(async ({ ctx }) => {
    const data = await cachedUserData<ActivitySummary>(
      'get_user_activity_summary',
      {
        p_user_id: ctx.userId,
      },
      {
        tags: ['user-activity', `user-${ctx.userId}`],
        ttlConfigKey: 'cache.user_activity.ttl_seconds',
        keySuffix: `${ctx.userId}-summary`,
      },
      {
        action: 'user.getActivitySummary',
        userId: ctx.userId,
      }
    );

    if (!data) {
      throw logActionFailure(
        'user.getActivitySummary',
        new Error('Failed to fetch user activity summary'),
        { userId: ctx.userId }
      );
    }

    return data;
  });

export const getActivityTimeline = authedAction
  .metadata({ actionName: 'getActivityTimeline', category: 'user' })
  .schema(activityFilterSchema)
  .action(async ({ parsedInput: { type, limit = 20, offset = 0 }, ctx }) => {
    const data = await cachedUserData<ActivityTimelineResponse>(
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
      },
      {
        action: 'user.getActivityTimeline',
        userId: ctx.userId,
        meta: { type: type ?? 'all', limit, offset },
      }
    );

    if (!data) {
      throw logActionFailure(
        'user.getActivityTimeline',
        new Error('Failed to fetch activity timeline'),
        { userId: ctx.userId, type: type ?? 'all', limit, offset }
      );
    }

    return data;
  });

export const getUserIdentities = authedAction
  .metadata({ actionName: 'getUserIdentities', category: 'user' })
  .schema(z.void())
  .action(async ({ ctx }) => {
    const data = await cachedUserData<{
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
      },
      {
        action: 'user.getUserIdentities',
        userId: ctx.userId,
      }
    );

    if (!data) {
      throw logActionFailure(
        'user.getUserIdentities',
        new Error('Failed to fetch user identities'),
        { userId: ctx.userId }
      );
    }

    return data;
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
    const cacheConfigPromise = getCacheConfigSnapshot();
    const result = await runUserRpc<{
      success: boolean;
      error?: string;
      message?: string;
      provider?: string;
      remaining_providers?: number;
    }>(
      'unlink_oauth_provider',
      { p_provider: provider },
      {
        action: 'user.unlinkOAuthProvider',
        userId: ctx.userId,
        meta: { provider },
      }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to unlink provider',
      };
    }

    await revalidateUserSurfaces({ accountSections: ['settings'] });
    await invalidateUserCaches({
      cacheConfigPromise,
      invalidateKeys: ['cache.invalidate.oauth_unlink'],
      userIds: [ctx.userId],
    });

    return {
      success: true,
      message: result.message || `Successfully unlinked ${provider}`,
      remainingProviders: result.remaining_providers,
    };
  });

export async function ensureUserRecord(params: {
  id: string;
  email: string | null;
  name?: string | null;
  image?: string | null;
}) {
  'use server';

  const cacheConfigPromise = getCacheConfigSnapshot();
  await runUserRpc<Tables<'users'>>(
    'ensure_user_record',
    {
      p_id: params.id,
      p_email: params.email,
      p_name: params.name ?? null,
      p_image: params.image ?? null,
      p_profile_public: true,
      p_follow_email: true,
    },
    {
      action: 'user.ensureUserRecord',
      userId: params.id,
    }
  );

  await invalidateUserCaches({
    cacheConfigPromise,
    invalidateKeys: ['cache.invalidate.user_update'],
    userIds: [params.id],
  });
}
