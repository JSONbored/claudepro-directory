'use server';

/**
 * User Actions - Database-First Architecture
 * PostgreSQL validates ALL data. TypeScript provides compile-time types only.
 */

import type {
  UpdateUserProfileResultV2,
  RefreshProfileFromOauthReturns,
} from '@heyclaude/database-types/postgres-types';
import type { UpdateUserProfileReturns } from '@heyclaude/database-types/postgres-types';
import { toggleFollowReturnsSchema } from '@heyclaude/database-types/postgres-types/functions/toggle_follow';
import { batchAddBookmarksReturnsSchema } from '@heyclaude/database-types/postgres-types/functions/batch_add_bookmarks';
import type { follow_action, submission_status, content_category } from '@prisma/client';
import { z } from 'zod';
import { content_categorySchema, follow_actionSchema } from '../prisma-zod-schemas.ts';

// Export input types for bookmark actions (can't export from 'use server' files)
export type { AddBookmarkInput, RemoveBookmarkInput } from './bookmarks.ts';

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
  status: submission_status;
  updated_at: string;
};

export type UserActivity = SubmissionActivity;

// Removed executeMutationAction - inlining logic directly
import { authedAction } from './safe-action.ts';

async function invalidateUserCaches({
  tags: extraTags,
  userIds,
}: {
  tags?: string[];
  userIds?: Array<string | null | undefined>;
}): Promise<void> {
  const { revalidateCacheTags } = await import('../cache-tags.ts');
  const { revalidateTag } = await import('next/cache');
  const tags = new Set(extraTags ?? []);

  if (tags.size) {
    revalidateCacheTags([...tags]);
  }

  if (userIds?.length) {
    await Promise.allSettled(
      userIds
        .filter((id): id is string => Boolean(id))
        .map((id) => {
          try {
            return revalidateTag(`user-${id}`, 'default');
          } catch (error) {
            // Handle synchronous errors gracefully
            return Promise.reject(error);
          }
        })
    );
  }
}

const updateProfileSchema = z.object({
  display_name: z.string().optional(),
  // Username validation is handled by database constraint (users_username_format_check)
  // Database enforces: lowercase alphanumeric + hyphens, 3-30 chars, no leading/trailing hyphens
  username: z.string().optional(),
  bio: z.string().optional(),
  work: z.string().optional(),
  website: z.string().optional().or(z.literal('')),
  social_x_link: z.string().optional(),
  interests: z.array(z.string()).optional(),
  profile_public: z.boolean().optional(),
  follow_email: z.boolean().optional(),
});

export const updateProfile = authedAction
  .inputSchema(updateProfileSchema)
  .metadata({ actionName: 'updateProfile', category: 'user' })
  .action(async ({ parsedInput, ctx }): Promise<UpdateUserProfileReturns> => {
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidatePath, revalidateTag } = await import('next/cache');

    const args = {
      p_user_id: ctx.userId,
      ...(parsedInput.display_name && { p_display_name: parsedInput.display_name }),
      ...(parsedInput.username !== undefined && { p_username: parsedInput.username }),
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
    };

    const rawResult = await runRpc<UpdateUserProfileResultV2>('update_user_profile', args, {
      action: 'updateProfile.rpc',
      userId: ctx.userId,
    });

    // Transform result - extract profile with null check
    if (!rawResult || !rawResult.profile) {
      throw new Error('update_user_profile returned null profile');
    }
    const result: UpdateUserProfileReturns = rawResult;

    // Cache invalidation
    revalidatePath('/account');
    revalidatePath('/account/settings');
    if (result.profile?.slug) {
      revalidatePath(`/u/${result.profile.slug}`);
    }
    revalidateTag('users', 'default');
    revalidateTag(`user-${ctx.userId}`, 'default');

    return result;
  });

export const refreshProfileFromOAuth = authedAction
  .inputSchema(z.void())
  .metadata({ actionName: 'refreshProfileFromOAuth', category: 'user' })
  .action(async ({ ctx }): Promise<{ success: boolean; message: string; slug: string | null }> => {
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidatePath, revalidateTag } = await import('next/cache');

    const args = { user_id: ctx.userId };

    const rawResult = await runRpc<RefreshProfileFromOauthReturns>(
      'refresh_profile_from_oauth',
      args,
      {
        action: 'refreshProfileFromOAuth.rpc',
        userId: ctx.userId,
      }
    );

    // Transform result
    const slug = rawResult.user_profile?.slug ?? null;
    const result: { success: boolean; message: string; slug: string | null } = {
      success: true,
      message: 'Profile refreshed from OAuth provider',
      slug,
    };

    // Cache invalidation
    revalidatePath('/account');
    revalidatePath('/account/settings');
    if (slug) {
      revalidatePath(`/u/${slug}`);
    }
    revalidateTag('users', 'default');
    revalidateTag(`user-${ctx.userId}`, 'default');

    return result;
  });

export async function refreshProfileFromOAuthServer(userId: string) {
  const { runRpc } = await import('./run-rpc-instance.ts');
  const result = await runRpc<RefreshProfileFromOauthReturns>(
    'refresh_profile_from_oauth',
    { user_id: userId },
    { action: 'user.refreshProfileFromOAuth', userId }
  );
  const slug = result.user_profile?.slug ?? null;
  return { success: true, slug };
}

// Removed addBookmark, removeBookmark - migrated

export const isBookmarkedAction = authedAction
  .inputSchema(
    z.object({
      content_type: content_categorySchema,
      content_slug: z
        .string()
        .max(200)
        .regex(/^[a-zA-Z0-9\-_/]+$/),
    })
  )
  .metadata({ actionName: 'isBookmarked', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    const { isBookmarked } = await import('../data/account.ts');
    const result = await isBookmarked({
      userId: ctx.userId,
      content_type: parsedInput.content_type,
      content_slug: parsedInput.content_slug,
    });
    return result;
  });

const addBookmarkBatchSchema = z.object({
  items: z
    .array(
      z.object({
        content_type: content_categorySchema,
        content_slug: z.string().min(1),
      })
    )
    .min(1)
    .max(20),
});

export const addBookmarkBatch = authedAction
  .inputSchema(addBookmarkBatchSchema)
  .outputSchema(batchAddBookmarksReturnsSchema)
  .metadata({ actionName: 'addBookmarkBatch', category: 'user' })
  .action(async ({ parsedInput, ctx }): Promise<z.infer<typeof batchAddBookmarksReturnsSchema>> => {
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidatePath, revalidateTag } = await import('next/cache');

    const args = {
      p_user_id: ctx.userId,
      p_items: parsedInput.items.map((item) => ({
        content_type: item.content_type,
        content_slug: item.content_slug,
      })),
    };

    const result = await runRpc<z.infer<typeof batchAddBookmarksReturnsSchema>>(
      'batch_add_bookmarks',
      args,
      {
        action: 'addBookmarkBatch.rpc',
        userId: ctx.userId,
      }
    );

    // Cache invalidation
    revalidatePath('/account');
    revalidatePath('/account/library');
    revalidateTag('user-bookmarks', 'default');
    revalidateTag('users', 'default');
    revalidateTag(`user-${ctx.userId}`, 'default');

    return result;
  });

const followSchema = z.object({
  action: follow_actionSchema,
  user_id: z.string(), // Database validates UUID format
  slug: z.string(),
});

export const toggleFollow = authedAction
  .inputSchema(followSchema)
  .outputSchema(toggleFollowReturnsSchema)
  .metadata({ actionName: 'toggleFollow', category: 'user' })
  .action(async ({ parsedInput, ctx }): Promise<z.infer<typeof toggleFollowReturnsSchema>> => {
    const { runRpc } = await import('./run-rpc-instance.ts');
    const { revalidatePath, revalidateTag } = await import('next/cache');

    const args = {
      p_follower_id: ctx.userId,
      p_following_id: parsedInput.user_id,
      p_action: parsedInput.action satisfies follow_action,
    };

    const result = await runRpc<z.infer<typeof toggleFollowReturnsSchema>>('toggle_follow', args, {
      action: 'toggleFollow.rpc',
      userId: ctx.userId,
    });

    // Cache invalidation
    revalidatePath('/account');
    if (parsedInput.slug) {
      revalidatePath(`/u/${parsedInput.slug}`);
    }
    revalidateTag('users', 'default');
    revalidateTag(`user-${ctx.userId}`, 'default');
    revalidateTag(`user-${parsedInput.user_id}`, 'default');

    return result;
  });

export const isFollowingAction = authedAction
  .inputSchema(
    z.object({
      user_id: z.string().regex(UUID_REGEX, { message: 'Invalid UUID format' }),
    })
  )
  .metadata({ actionName: 'isFollowing', category: 'user' })
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
  .inputSchema(
    z.object({
      items: z.array(
        z.object({
          content_type: content_categorySchema,
          content_slug: z.string(),
        })
      ),
    })
  )
  .metadata({ actionName: 'getBookmarkStatusBatch', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    const { isBookmarkedBatch } = await import('../data/account.ts');
    const data = await isBookmarkedBatch({
      userId: ctx.userId,
      items: parsedInput.items,
    });

    // Ensure data is an array before mapping
    // IsBookmarkedBatchReturns is Array<{ content_type: content_category | null; content_slug: string; is_bookmarked: boolean }>
    const results = Array.isArray(data) ? data : [];
    const resultMap = new Map<string, boolean>(
      results.map((row: { content_type: content_category | null; content_slug: string; is_bookmarked: boolean }) => [
        `${row.content_type ?? 'unknown'}:${row.content_slug}`,
        row.is_bookmarked,
      ])
    );
    return resultMap;
  });

/**
 * Batch check follow status for multiple users - Database-First
 * Eliminates N+1 queries (20 queries → 1, 95% reduction)
 */
export const getFollowStatusBatch = authedAction
  .inputSchema(
    z.object({
      user_ids: z.array(z.string().regex(UUID_REGEX, { message: 'Invalid UUID format' })),
    })
  )
  .metadata({ actionName: 'getFollowStatusBatch', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    const { isFollowingBatch } = await import('../data/account.ts');
    const data = await isFollowingBatch({
      followerId: ctx.userId,
      followedUserIds: parsedInput.user_ids,
    });

    // Ensure data is an array
    // IsFollowingBatchReturns is Record<string, unknown>[], so use bracket notation
    const results = Array.isArray(data) ? data : [];
    const resultMap = new Map(
      results.map((row) => [row['followed_user_id'] as string, row['is_following'] as boolean])
    );
    return resultMap;
  });

export const getActivitySummary = authedAction
  .inputSchema(z.void())
  .metadata({ actionName: 'getActivitySummary', category: 'user' })
  .action(async ({ ctx }) => {
    // OPTIMIZATION: Use getUserCompleteData directly - single database call
    const { getUserCompleteData } = await import('../data/account.ts');
    const completeData = await getUserCompleteData(ctx.userId);
    return completeData?.activity_summary ?? null;
  });

export const getActivityTimeline = authedAction
  .inputSchema(activityFilterSchema)
  .metadata({ actionName: 'getActivityTimeline', category: 'user' })
  .action(async ({ parsedInput: { type, limit = 20, offset = 0 }, ctx }) => {
    // OPTIMIZATION: Use getUserCompleteData directly - single database call
    const { getUserCompleteData } = await import('../data/account.ts');
    const completeData = await getUserCompleteData(ctx.userId, {
      activityLimit: limit,
      activityOffset: offset,
      activityType: type ?? null, // Convert undefined to null for exactOptionalPropertyTypes
    });
    return completeData?.activity_timeline ?? null;
  });

export const getUserIdentities = authedAction
  .inputSchema(z.void())
  .metadata({ actionName: 'getUserIdentities', category: 'user' })
  .action(async ({ ctx }) => {
    // Use data function with 'use cache: private' for Cache Components support
    const { getUserIdentitiesData } = await import('../data/account.ts');
    const data = await getUserIdentitiesData(ctx.userId);
    return data;
  });

/**
 * Get user profile image URL
 * Returns the authenticated user's profile image URL from the database.
 */
export const getUserProfileImage = authedAction
  .inputSchema(z.void())
  .metadata({ actionName: 'getUserProfileImage', category: 'user' })
  .action(async ({ ctx }) => {
    const { prisma } = await import('@heyclaude/data-layer/prisma/client');
    
    // Fetch only the image field from database
    const userProfile = await prisma.users.findUnique({
      select: { image: true },
      where: { id: ctx.userId },
    });

    return {
      imageUrl: userProfile?.image ?? null,
    };
  });

// Removed unlinkOAuthProvider - migrated

export async function ensureUserRecord(params: {
  id: string;
  email: string | null;
  name?: string | null;
  image?: string | null;
}) {
  'use server';

  const { runRpc } = await import('./run-rpc-instance.ts');
  await runRpc<{
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    slug: string | null;
    display_name: string | null;
    bio: string | null;
    work: string | null;
    website: string | null;
    social_x_link: string | null;
    interests: string[] | null;
    profile_public: boolean;
    follow_email: boolean;
    created_at: Date;
    updated_at: Date;
  }>(
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
