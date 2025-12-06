'use server';

/**
 * User Actions - Database-First Architecture
 * PostgreSQL validates ALL data. TypeScript provides compile-time types only.
 */

import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { runRpc } from './run-rpc-instance.ts';
import { authedAction } from './safe-action.ts';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { logger } from '../logger.ts';

// Export input types for generated bookmark actions (can't export from 'use server' files)
const addBookmarkSchema = z.object({
  content_type: z.enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'skills', 'collections', 'guides', 'jobs', 'changelog']),
  content_slug: z.string(),
  notes: z.string().optional()
});

const removeBookmarkSchema = z.object({
  content_type: z.enum(['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'skills', 'collections', 'guides', 'jobs', 'changelog']),
  content_slug: z.string()
});

export type AddBookmarkInput = z.infer<typeof addBookmarkSchema>;
export type RemoveBookmarkInput = z.infer<typeof removeBookmarkSchema>;

// Use enum values directly from @heyclaude/database-types Constants
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

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

export type UserActivity = SubmissionActivity;

type UserSurface = 'account' | 'library' | 'settings';

const USER_SURFACE_PATHS: Record<UserSurface, string> = {
  account: '/account',
  library: '/account/library',
  settings: '/account/settings',
};

async function invalidateUserCaches({
  tags: extraTags,
  userIds,
}: {
  tags?: string[];
  userIds?: Array<string | null | undefined>;
}): Promise<void> {
  const { revalidateCacheTags } = await import('../cache-tags.ts');
  const tags = new Set(extraTags ?? []);

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
        ...(parsedInput.interests && { p_interests: parsedInput.interests as string[] }),
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

    // Log profile update for audit trail (user data modification)
    logger.info('User profile updated', {
      audit: true, // Structured tag for audit trail filtering
      userId: ctx.userId,
      operation: 'profile_update',
      fieldsUpdated: Object.keys(parsedInput).filter(k => parsedInput[k as keyof typeof parsedInput] !== undefined),
    });

    await revalidateUserSurfaces({
      slug: profile.slug ?? null,
      accountSections: ['account', 'settings'],
    });

    await invalidateUserCaches({
      tags: ['users', `user-${ctx.userId}`],
      userIds: [ctx.userId],
    });

    return result;
  });

async function refreshProfileFromOAuthInternal(userId: string) {
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
    tags: ['users', `user-${userId}`],
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

// Removed addBookmark, removeBookmark - migrated

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
    const { isBookmarked } = await import('../data/account.ts');
    return isBookmarked({
      userId: ctx.userId,
      content_type: parsedInput.content_type,
      content_slug: parsedInput.content_slug,
    });
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
      tags: ['user-bookmarks', 'users', `user-${ctx.userId}`],
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
      tags: ['users', `user-${ctx.userId}`, `user-${user_id}`],
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
    const { isFollowing } = await import('../data/account.ts');
    return isFollowing({
      followerId: ctx.userId,
      followingId: parsedInput.user_id,
    });
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
    const { isBookmarkedBatch } = await import('../data/account.ts');
    const data = await isBookmarkedBatch({
      userId: ctx.userId,
      items: parsedInput.items,
    });

    // Ensure data is an array before mapping
    const results = Array.isArray(data) ? data : [];
    return new Map(
      results.map((row) => [`${row.content_type}:${row.content_slug}`, row.is_bookmarked])
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
    const { isFollowingBatch } = await import('../data/account.ts');
    const data = await isFollowingBatch({
      followerId: ctx.userId,
      followedUserIds: parsedInput.user_ids,
    });

    // Ensure data is an array
    const results = Array.isArray(data) ? data : [];
    return new Map(results.map((row) => [row.followed_user_id, row.is_following]));
  });

export const getActivitySummary = authedAction
  .metadata({ actionName: 'getActivitySummary', category: 'user' })
  .inputSchema(z.void())
  .action(async ({ ctx }) => {
    // Use data function with 'use cache: private' for Cache Components support
    const { getUserActivitySummary } = await import('../data/account.ts');
    const data = await getUserActivitySummary(ctx.userId);
    return data;
  });

export const getActivityTimeline = authedAction
  .metadata({ actionName: 'getActivityTimeline', category: 'user' })
  .inputSchema(activityFilterSchema)
  .action(async ({ parsedInput: { type, limit = 20, offset = 0 }, ctx }) => {
    // Use data function with 'use cache: private' for Cache Components support
    const { getUserActivityTimeline } = await import('../data/account.ts');
    const data = await getUserActivityTimeline({
      userId: ctx.userId,
      type: type ?? undefined,
      limit,
      offset,
    });
    return data;
  });

export const getUserIdentities = authedAction
  .metadata({ actionName: 'getUserIdentities', category: 'user' })
  .inputSchema(z.void())
  .action(async ({ ctx }) => {
    // Use data function with 'use cache: private' for Cache Components support
    const { getUserIdentitiesData } = await import('../data/account.ts');
    const data = await getUserIdentitiesData(ctx.userId);
    return data;
  });

// Removed unlinkOAuthProvider - migrated

export async function ensureUserRecord(params: {
  id: string;
  email: string | null;
  name?: string | null;
  image?: string | null;
}) {
  'use server';

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
    tags: ['users', `user-${params.id}`],
    userIds: [params.id],
  });
}
