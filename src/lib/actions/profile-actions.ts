'use server';

/**
 * Profile Actions
 * Server actions for user profile management
 *
 * Refactored to use Repository pattern for cleaner separation of concerns.
 * All database operations delegated to UserRepository.
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { type User, userRepository } from '@/src/lib/repositories/user.repository';
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

    // Filter out undefined values to avoid exactOptionalPropertyTypes issues
    const updateData = Object.fromEntries(
      Object.entries(parsedInput).filter(([_, value]) => value !== undefined)
    ) as Partial<User>;

    // Update via repository (includes caching and automatic error handling)
    const result = await userRepository.update(user.id, updateData);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update profile');
    }

    if (!result.data) {
      throw new Error('Profile data not returned');
    }

    const data = result.data;

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

    // Refresh via repository (includes cache invalidation and syncing)
    const result = await userRepository.refreshFromOAuth(user.id);

    if (!result.success) {
      throw new Error(result.error || 'Failed to refresh profile');
    }

    const profile = result.data;

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
