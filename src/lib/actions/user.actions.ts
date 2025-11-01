'use server';

/**
 * User Actions - Database-First Architecture
 * All business logic in PostgreSQL via RPC functions. TypeScript handles auth + validation only.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { authedAction } from '@/src/lib/actions/safe-action';
import { publicUserActivitySummaryResultSchema } from '@/src/lib/schemas/generated/db-schemas';

// Use generated schema from database composite type
const activitySummarySchema = publicUserActivitySummaryResultSchema;

const activityFilterSchema = z.object({
  type: z.enum(['post', 'comment', 'vote', 'submission']).optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

// Activity item schema - discriminated union based on type field
const baseActivitySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['post', 'comment', 'vote', 'submission']),
  created_at: z.string(),
  user_id: z.string().uuid(),
});

const postActivitySchema = baseActivitySchema.extend({
  type: z.literal('post'),
  title: z.string(),
  body: z.string(),
  content_type: z.string(),
  content_slug: z.string(),
  updated_at: z.string(),
});

const commentActivitySchema = baseActivitySchema.extend({
  type: z.literal('comment'),
  body: z.string(),
  post_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable(),
  updated_at: z.string(),
});

const voteActivitySchema = baseActivitySchema.extend({
  type: z.literal('vote'),
  vote_type: z.enum(['upvote', 'downvote']),
  post_id: z.string().uuid(),
});

const submissionActivitySchema = baseActivitySchema.extend({
  type: z.literal('submission'),
  title: z.string(),
  description: z.string().nullable(),
  content_type: z.string(),
  submission_url: z.string().nullable(),
  status: z.enum(['pending', 'approved', 'rejected']),
  updated_at: z.string(),
});

const activitySchema = z.discriminatedUnion('type', [
  postActivitySchema,
  commentActivitySchema,
  voteActivitySchema,
  submissionActivitySchema,
]);

// Export Activity type for use in components
export type Activity = z.infer<typeof activitySchema>;

const activityTimelineResponseSchema = z.object({
  activities: z.array(activitySchema),
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
      website: z.string().optional().or(z.literal('')),
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
    const { data, error } = await supabase.rpc('refresh_profile_from_oauth', {
      user_id: ctx.userId,
    });
    if (error) throw new Error(`Failed to refresh profile from OAuth: ${error.message}`);

    const profile = data as { slug: string } | null;
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
    const { data, error } = await supabase.rpc('get_user_activity_summary', {
      p_user_id: ctx.userId,
    });

    if (error) throw new Error(`Failed to fetch user activity summary: ${error.message}`);

    // RPC returns Json - validate with output schema
    return activitySummarySchema.parse(data);
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

    // Validate RPC response with Zod schema (runtime type safety)
    return activityTimelineResponseSchema.parse(data);
  });
