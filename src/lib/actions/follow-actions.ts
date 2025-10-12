'use server';

/**
 * Follow Actions
 * Server actions for following/unfollowing users
 *
 * Refactored to use Repository pattern for cleaner separation of concerns.
 * All database operations delegated to FollowerRepository.
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { followerRepository } from '@/src/lib/repositories/follower.repository';
import { userIdSchema } from '@/src/lib/schemas/branded-types.schema';
import { createClient } from '@/src/lib/supabase/server';

const followSchema = z.object({
  action: z.enum(['follow', 'unfollow']),
  user_id: userIdSchema,
  slug: z.string(), // User slug for revalidation
});

/**
 * Follow/unfollow a user
 */
export const toggleFollow = rateLimitedAction
  .metadata({
    actionName: 'toggleFollow',
    category: 'user',
  })
  .schema(followSchema)
  .action(async ({ parsedInput: { action, user_id, slug } }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to follow users');
    }

    // Can't follow yourself
    if (user.id === user_id) {
      throw new Error('You cannot follow yourself');
    }

    if (action === 'follow') {
      // Create follow relationship via repository (includes caching)
      const result = await followerRepository.create({
        follower_id: user.id,
        following_id: user_id,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to follow user');
      }

      // TODO: Send email notification (if user has follow_email enabled)
      // This would use resendService similar to existing email flows
    } else {
      // Delete follow relationship via repository (includes cache invalidation)
      const result = await followerRepository.deleteByUserIds(user.id, user_id);

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
