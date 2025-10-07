'use server';

/**
 * Profile Actions
 * Server actions for user profile management
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { updateProfileSchema } from '@/src/lib/schemas/profile.schema';
import { createClient } from '@/src/lib/supabase/server';

/**
 * Update user profile
 */
export const updateProfile = rateLimitedAction
  .metadata({
    actionName: 'updateProfile',
    category: 'user',
  })
  .schema(updateProfileSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to update your profile');
    }

    // Update profile in database
    const { data, error } = await supabase
      .from('users')
      .update({
        ...parsedInput,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

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
export const refreshProfileFromOAuth = rateLimitedAction
  .metadata({
    actionName: 'refreshProfileFromOAuth',
    category: 'user',
    rateLimit: {
      maxRequests: 5, // Limit to 5 refreshes per minute
      windowSeconds: 60,
    },
  })
  .schema(z.void())
  .action(async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to refresh your profile');
    }

    // Call the database function that syncs from auth.users
    const { error } = await supabase.rpc('refresh_profile_from_oauth', {
      user_id: user.id,
    });

    if (error) {
      throw new Error(`Failed to refresh profile: ${error.message}`);
    }

    // Get updated profile data
    const { data: profile } = await supabase
      .from('users')
      .select('slug')
      .eq('id', user.id)
      .single();

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
