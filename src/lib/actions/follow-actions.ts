'use server';

/**
 * Follow Actions
 * Server actions for following/unfollowing users
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { createClient } from '@/src/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const followSchema = z.object({
  action: z.enum(['follow', 'unfollow']),
  user_id: z.string().uuid(),
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
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be signed in to follow users');
    }

    // Can't follow yourself
    if (user.id === user_id) {
      throw new Error('You cannot follow yourself');
    }

    if (action === 'follow') {
      const { error } = await supabase
        .from('followers')
        .insert({
          follower_id: user.id,
          following_id: user_id,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('You are already following this user');
        }
        throw new Error(error.message);
      }

      // TODO: Send email notification (if user has follow_email enabled)
      // This would use resendService similar to existing email flows
    } else {
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', user_id);

      if (error) {
        throw new Error(error.message);
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
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  const { data } = await supabase
    .from('followers')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', user_id)
    .single();

  return !!data;
}
