'use server';

/**
 * User Actions - Database-First Architecture
 * All business logic in PostgreSQL via RPC functions. TypeScript handles auth + validation only.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { authedAction } from '@/src/lib/actions/safe-action';
import { publicUserActivitySummaryRowSchema } from '@/src/lib/schemas/generated/db-schemas';

const activitySummarySchema = publicUserActivitySummaryRowSchema.pick({
  total_posts: true,
  total_comments: true,
  total_votes: true,
  total_submissions: true,
  merged_submissions: true,
  total_activity: true,
});

const activityFilterSchema = z.object({
  type: z.enum(['post', 'comment', 'vote', 'submission']).optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

const activityTimelineResponseSchema = z.object({
  activities: z.array(z.any()),
  hasMore: z.boolean(),
  total: z.number(),
});

import { nonEmptyString } from '@/src/lib/schemas/primitives';
import { categoryIdSchema } from '@/src/lib/schemas/shared.schema';
import {
  bookmarkInsertTransformSchema,
  removeBookmarkSchema,
} from '@/src/lib/schemas/transforms/data-normalization.schema';

import { createClient } from '@/src/lib/supabase/server';

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
      website: z.string().url().optional().or(z.literal('')),
      social_x_link: z.string().optional(),
      interests: z.array(z.string()).optional(),
      profile_public: z.boolean().optional(),
      follow_email: z.boolean().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
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

    return result;
  });

export const refreshProfileFromOAuth = authedAction
  .metadata({ actionName: 'refreshProfileFromOAuth', category: 'user' })
  .schema(z.void())
  .action(async ({ ctx }) => {
    const supabase = await createClient();
    const { error: rpcError } = await supabase.rpc('refresh_profile_from_oauth', {
      user_id: ctx.userId,
    });
    if (rpcError) throw new Error(`Failed to refresh profile from OAuth: ${rpcError.message}`);

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', ctx.userId)
      .single();
    if (error) throw new Error(`Failed to fetch refreshed user: ${error.message}`);

    if (profile?.slug) revalidatePath(`/u/${profile.slug}`);
    revalidatePath('/account');
    revalidatePath('/account/settings');

    return { success: true, message: 'Profile refreshed from OAuth provider' };
  });

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
    revalidatePath('/for-you');

    return data as { success: boolean; bookmark: unknown };
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
    revalidateTag(`user-${userId}`, 'max');
    revalidatePath('/for-you');

    return data as { success: boolean };
  });

export async function isBookmarked(content_type: string, content_slug: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase.rpc('is_bookmarked', {
    p_user_id: user.id,
    p_content_type: content_type,
    p_content_slug: content_slug,
  });

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
            content_type: categoryIdSchema,
            content_slug: nonEmptyString,
          })
        )
        .min(1)
        .max(20),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
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
    revalidateTag(`user-${userId}`, 'max');
    revalidatePath('/for-you');

    return result;
  });

const followSchema = z.object({
  action: z.enum(['follow', 'unfollow']),
  user_id: nonEmptyString.uuid(),
  slug: z.string(),
});

export const toggleFollow = authedAction
  .metadata({
    actionName: 'toggleFollow',
    category: 'user',
  })
  .schema(followSchema)
  .action(async ({ parsedInput: { action, user_id, slug }, ctx }) => {
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

    return data as { success: boolean; action: string };
  });

export async function isFollowing(user_id: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const validatedUserId = nonEmptyString.uuid().parse(user_id);
  const { data } = await supabase.rpc('is_following', {
    follower_id: user.id,
    following_id: validatedUserId,
  });

  return data ?? false;
}

export const getActivitySummary = authedAction
  .metadata({ actionName: 'getActivitySummary', category: 'user' })
  .schema(z.void())
  .outputSchema(activitySummarySchema)
  .action(async ({ ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_activity_summary')
      .select(
        'total_posts, total_comments, total_votes, total_submissions, merged_submissions, total_activity'
      )
      .eq('user_id', ctx.userId)
      .single();

    if (error) throw new Error(`Failed to fetch user activity summary: ${error.message}`);

    return {
      total_posts: data?.total_posts ?? 0,
      total_comments: data?.total_comments ?? 0,
      total_votes: data?.total_votes ?? 0,
      total_submissions: data?.total_submissions ?? 0,
      merged_submissions: data?.merged_submissions ?? 0,
      total_activity: data?.total_activity ?? 0,
    };
  });

export const getActivityTimeline = authedAction
  .metadata({ actionName: 'getActivityTimeline', category: 'user' })
  .schema(activityFilterSchema)
  .outputSchema(activityTimelineResponseSchema)
  .action(async ({ parsedInput: { type, limit = 20, offset = 0 }, ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_user_activity_timeline', {
      p_user_id: ctx.userId,
      ...(type && { p_type: type }),
      p_limit: limit,
      p_offset: offset,
    });
    if (error) throw new Error(`Failed to fetch activity timeline: ${error.message}`);
    return data as { activities: unknown[]; hasMore: boolean; total: number };
  });
