'use server';

/**
 * User Actions - Database-First Architecture
 * PostgreSQL validates ALL data. TypeScript provides compile-time types only.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import {
  resolveInvalidateTags as resolveCacheInvalidateTags,
  runRpc,
} from '@/src/lib/actions/action-helpers';
import { authedAction } from '@/src/lib/actions/safe-action';
import {
  type CacheConfigPromise,
  type CacheInvalidateKey,
  getCacheConfigSnapshot,
} from '@/src/lib/data/config/cache-config';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { revalidateCacheTags } from '@/src/lib/supabase/cache-helpers';
import type { Database } from '@/src/types/database.types';

const CONTENT_CATEGORY_VALUES = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
  'jobs',
  'changelog',
] as const satisfies readonly Database['public']['Enums']['content_category'][];

// UUID validation regex pattern (RFC 4122 compliant)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Activity filter schema (query parameters - NOT stored data, validation is useful here)
// Note: Only 'submission' type is supported (posts/comments/votes features not implemented)
const activityFilterSchema = z.object({
  type: z.enum(['submission']).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Activity types (database validates structure via RPC function)
// Note: Only submissions exist - posts/comments/votes tables don't exist
type SubmissionActivity = {
  id: string;
  type: 'submission';
  created_at: string;
  user_id: string;
  title: string;
  description: string | null;
  content_type: string;
  submission_url: string | null;
  status: Database['public']['Enums']['submission_status'];
  updated_at: string;
};

export type Activity = SubmissionActivity;

type UserSurface = 'account' | 'library' | 'settings';

const USER_SURFACE_PATHS: Record<UserSurface, string> = {
  account: '/account',
  library: '/account/library',
  settings: '/account/settings',
};

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
    revalidateCacheTags([...tags]);
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

  await Promise.allSettled([...paths].map((path) => Promise.resolve(revalidatePath(path))));
}

async function cachedUserData<
  T extends keyof Database['public']['Functions'],
  ResultType = Database['public']['Functions'][T]['Returns'],
>(
  rpcName: T,
  args: Database['public']['Functions'][T]['Args'],
  options: {
    tags: string[];
    ttlConfigKey: string;
    keySuffix: string;
    useAuthClient?: boolean;
  },
  fallback: ResultType
): Promise<ResultType> {
  return fetchCachedRpc<T, ResultType>(args, {
    rpcName,
    tags: options.tags,
    ttlKey: options.ttlConfigKey as Parameters<typeof fetchCachedRpc>[1]['ttlKey'],
    keySuffix: options.keySuffix,
    useAuthClient: options.useAuthClient ?? true,
    fallback,
    logMeta: { namespace: 'user-actions' },
  });
}

// Manual Zod schemas (database validates, Zod just provides type safety)
const bookmarkSchema = z.object({
  content_type: z.enum([...CONTENT_CATEGORY_VALUES] as [
    Database['public']['Enums']['content_category'],
    ...Database['public']['Enums']['content_category'][],
  ]),
  content_slug: z
    .string()
    .max(200)
    .regex(/^[a-zA-Z0-9\-_/]+$/),
  notes: z.string().max(500).optional().nullable(),
});

export const updateProfile = authedAction
  .metadata({ actionName: 'updateProfile', category: 'user' })
  .inputSchema(
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
    const result = await runRpc<Database['public']['Functions']['update_user_profile']['Returns']>(
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

    // Extract profile with null check
    const profile = result.profile;
    if (profile == null) {
      throw new Error('update_user_profile returned null profile');
    }

    await revalidateUserSurfaces({
      slug: profile.slug ?? null,
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
  const result = await runRpc<
    Database['public']['Functions']['refresh_profile_from_oauth']['Returns']
  >(
    'refresh_profile_from_oauth',
    { user_id: userId },
    { action: 'user.refreshProfileFromOAuth', userId }
  );

  const profile = result.user_profile;
  const slug = profile?.slug ?? null;

  await revalidateUserSurfaces({
    slug,
    accountSections: ['account', 'settings'],
  });

  await invalidateUserCaches({
    cacheConfigPromise,
    invalidateKeys: ['cache.invalidate.user_profile_oauth'],
    userIds: [userId],
  });

  return { success: true, slug };
}

export async function refreshProfileFromOAuthServer(userId: string) {
  return refreshProfileFromOAuthInternal(userId);
}

export const refreshProfileFromOAuth = authedAction
  .metadata({ actionName: 'refreshProfileFromOAuth', category: 'user' })
  .inputSchema(z.void())
  .action(async ({ ctx }) => {
    const result = await refreshProfileFromOAuthInternal(ctx.userId);
    return { success: true, message: 'Profile refreshed from OAuth provider', slug: result.slug };
  });

export const addBookmark = authedAction
  .metadata({
    actionName: 'addBookmark',
    category: 'user',
  })
  .inputSchema(bookmarkSchema)
  .action(async ({ parsedInput, ctx }) => {
    const cacheConfigPromise = getCacheConfigSnapshot();
    const { content_type, content_slug, notes } = parsedInput;

    const data = await runRpc<Database['public']['Functions']['add_bookmark']['Returns']>(
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
  .inputSchema(bookmarkSchema.pick({ content_type: true, content_slug: true }))
  .action(async ({ parsedInput, ctx }) => {
    const cacheConfigPromise = getCacheConfigSnapshot();
    const { content_type, content_slug } = parsedInput;

    const data = await runRpc<Database['public']['Functions']['remove_bookmark']['Returns']>(
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

export const isBookmarkedAction = authedAction
  .metadata({ actionName: 'isBookmarked', category: 'user' })
  .inputSchema(
    z.object({
      content_type: z.enum([...CONTENT_CATEGORY_VALUES] as [
        Database['public']['Enums']['content_category'],
        ...Database['public']['Enums']['content_category'][],
      ]),
      content_slug: z
        .string()
        .max(200)
        .regex(/^[a-zA-Z0-9\-_/]+$/),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const data = await cachedUserData<'is_bookmarked', boolean>(
      'is_bookmarked',
      {
        p_user_id: ctx.userId,
        p_content_type: parsedInput.content_type,
        p_content_slug: parsedInput.content_slug,
      },
      {
        tags: ['user-bookmarks', `user-${ctx.userId}`, `content-${parsedInput.content_slug}`],
        ttlConfigKey: 'cache.user_bookmarks.ttl_seconds',
        keySuffix: `${ctx.userId}-${parsedInput.content_type}-${parsedInput.content_slug}`,
        useAuthClient: true,
      },
      false
    );

    return data;
  });

export const addBookmarkBatch = authedAction
  .metadata({
    actionName: 'addBookmarkBatch',
    category: 'user',
  })
  .inputSchema(
    z.object({
      items: z
        .array(
          z.object({
            content_type: z.enum([...CONTENT_CATEGORY_VALUES] as [
              Database['public']['Enums']['content_category'],
              ...Database['public']['Enums']['content_category'][],
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

    // Construct composite type array from parsed input
    const items: Database['public']['CompositeTypes']['bookmark_item_input'][] =
      parsedInput.items.map((item) => ({
        content_type: item.content_type,
        content_slug: item.content_slug,
      }));

    const result = await runRpc<Database['public']['Functions']['batch_add_bookmarks']['Returns']>(
      'batch_add_bookmarks',
      {
        p_user_id: ctx.userId,
        p_items: items,
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
  action: z.enum(['follow', 'unfollow']) satisfies z.ZodType<
    Database['public']['Enums']['follow_action']
  >,
  user_id: z.string(), // Database validates UUID format
  slug: z.string(),
});

export const toggleFollow = authedAction
  .metadata({
    actionName: 'toggleFollow',
    category: 'user',
  })
  .inputSchema(followSchema)
  .action(async ({ parsedInput: { action, user_id, slug }, ctx }) => {
    const cacheConfigPromise = getCacheConfigSnapshot();
    const result = await runRpc<Database['public']['Functions']['toggle_follow']['Returns']>(
      'toggle_follow',
      {
        p_follower_id: ctx.userId,
        p_following_id: user_id,
        p_action: action satisfies Database['public']['Enums']['follow_action'],
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

export const isFollowingAction = authedAction
  .metadata({ actionName: 'isFollowing', category: 'user' })
  .inputSchema(
    z.object({
      user_id: z.string().regex(UUID_REGEX, { message: 'Invalid UUID format' }),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const data = await cachedUserData<'is_following', boolean>(
      'is_following',
      {
        follower_id: ctx.userId,
        following_id: parsedInput.user_id,
      },
      {
        tags: ['users', `user-${ctx.userId}`, `user-${parsedInput.user_id}`],
        ttlConfigKey: 'cache.user_profile.ttl_seconds',
        keySuffix: `${ctx.userId}-${parsedInput.user_id}`,
        useAuthClient: true,
      },
      false
    );

    return data;
  });

/**
 * Batch check bookmark status for multiple items - Database-First
 * Eliminates N+1 queries (20 queries → 1, 95% reduction)
 */
export const getBookmarkStatusBatch = authedAction
  .metadata({ actionName: 'getBookmarkStatusBatch', category: 'user' })
  .inputSchema(
    z.object({
      items: z.array(
        z.object({
          content_type: z.enum([...CONTENT_CATEGORY_VALUES] as [
            Database['public']['Enums']['content_category'],
            ...Database['public']['Enums']['content_category'][],
          ]),
          content_slug: z.string(),
        })
      ),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const data = await cachedUserData<
      'is_bookmarked_batch',
      Database['public']['Functions']['is_bookmarked_batch']['Returns']
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
        useAuthClient: true,
      },
      []
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
  .inputSchema(
    z.object({
      user_ids: z.array(z.string().regex(UUID_REGEX, { message: 'Invalid UUID format' })),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const data = await cachedUserData<
      'is_following_batch',
      { followed_user_id: string; is_following: boolean }[]
    >(
      'is_following_batch',
      {
        p_follower_id: ctx.userId,
        p_followed_user_ids: parsedInput.user_ids,
      },
      {
        tags: ['users', `user-${ctx.userId}`],
        ttlConfigKey: 'cache.user_profile.ttl_seconds',
        keySuffix: `${ctx.userId}-${parsedInput.user_ids.sort().join('-')}`,
        useAuthClient: true,
      },
      []
    );

    return new Map((data || []).map((row) => [row.followed_user_id, row.is_following]));
  });

export const getActivitySummary = authedAction
  .metadata({ actionName: 'getActivitySummary', category: 'user' })
  .inputSchema(z.void())
  .action(async ({ ctx }) => {
    const data = await cachedUserData<
      'get_user_activity_summary',
      Database['public']['Functions']['get_user_activity_summary']['Returns']
    >(
      'get_user_activity_summary',
      {
        p_user_id: ctx.userId,
      },
      {
        tags: ['user-activity', `user-${ctx.userId}`],
        ttlConfigKey: 'cache.user_activity.ttl_seconds',
        keySuffix: `${ctx.userId}-summary`,
        useAuthClient: true,
      },
      {
        total_posts: 0,
        total_comments: 0,
        total_votes: 0,
        total_submissions: 0,
        merged_submissions: 0,
        total_activity: 0,
      }
    );

    return data;
  });

export const getActivityTimeline = authedAction
  .metadata({ actionName: 'getActivityTimeline', category: 'user' })
  .inputSchema(activityFilterSchema)
  .action(async ({ parsedInput: { type, limit = 20, offset = 0 }, ctx }) => {
    const data = await cachedUserData<
      'get_user_activity_timeline',
      Database['public']['Functions']['get_user_activity_timeline']['Returns']
    >(
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
        useAuthClient: true,
      },
      {
        activities: [],
        has_more: false,
        total: 0,
      }
    );

    return data;
  });

export const getUserIdentities = authedAction
  .metadata({ actionName: 'getUserIdentities', category: 'user' })
  .inputSchema(z.void())
  .action(async ({ ctx }) => {
    const data = await cachedUserData<
      'get_user_identities',
      Database['public']['Functions']['get_user_identities']['Returns']
    >(
      'get_user_identities',
      {
        p_user_id: ctx.userId,
      },
      {
        tags: ['users', `user-${ctx.userId}`],
        ttlConfigKey: 'cache.user_stats.ttl_seconds',
        keySuffix: `${ctx.userId}-identities`,
        useAuthClient: true,
      },
      { identities: [] }
    );

    return data;
  });

/**
 * Unlink OAuth Provider Action
 * Removes an OAuth identity from the user's account
 * Database RPC validates that at least 1 provider remains (prevents lockout)
 */
export const unlinkOAuthProvider = authedAction
  .metadata({ actionName: 'unlinkOAuthProvider', category: 'user' })
  .inputSchema(
    z.object({
      provider: z.enum(['discord', 'github', 'google']) satisfies z.ZodType<
        Database['public']['Enums']['oauth_provider']
      >,
    })
  )
  .action(async ({ parsedInput: { provider }, ctx }) => {
    const cacheConfigPromise = getCacheConfigSnapshot();
    const result = await runRpc<
      Database['public']['Functions']['unlink_oauth_provider']['Returns']
    >(
      'unlink_oauth_provider',
      { p_provider: provider satisfies Database['public']['Enums']['oauth_provider'] },
      {
        action: 'user.unlinkOAuthProvider',
        userId: ctx.userId,
        meta: { provider },
      }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? 'Failed to unlink provider',
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
      message: result.message ?? `Successfully unlinked ${provider}`,
      remainingProviders: result.remaining_providers ?? undefined,
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
  await runRpc<Database['public']['Tables']['users']['Row']>(
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
