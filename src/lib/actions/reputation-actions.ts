'use server';

/**
 * Reputation Actions
 * Server actions for reputation management and calculation
 *
 * Refactored to use Repository pattern for cleaner separation of concerns.
 * All database operations delegated to ReputationRepository and UserRepository.
 *
 * Security: Rate limited, auth required, RLS enforced
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { reputationRepository } from '@/src/lib/repositories/reputation.repository';
import { userRepository } from '@/src/lib/repositories/user.repository';
import { reputationBreakdownSchema } from '@/src/lib/schemas/activity.schema';
import { createClient } from '@/src/lib/supabase/server';

/**
 * Manually recalculate user's reputation
 * Useful for debugging or if automatic triggers fail
 */
export const recalculateReputation = rateLimitedAction
  .metadata({
    actionName: 'recalculateReputation',
    category: 'user',
    rateLimit: {
      maxRequests: 5, // Limit recalculations
      windowSeconds: 60,
    },
  })
  .schema(z.void())
  .outputSchema(z.object({ new_score: z.number().int().nonnegative() }))
  .action(async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to recalculate reputation');
    }

    // Recalculate via repository (includes caching and error handling)
    const result = await reputationRepository.recalculate(user.id);

    if (!result.success || result.data === undefined) {
      throw new Error(result.error || 'Failed to recalculate reputation');
    }

    // Get updated profile via repository (includes caching)
    const profileResult = await userRepository.findById(user.id);
    const profile = profileResult.success ? profileResult.data : null;

    // Revalidate paths
    if (profile?.slug) {
      revalidatePath(`/u/${profile.slug}`);
    }
    revalidatePath('/account');
    revalidatePath('/account/activity');

    return {
      new_score: result.data,
    };
  });

/**
 * Get reputation breakdown
 * Shows how reputation was earned
 */
export const getReputationBreakdown = rateLimitedAction
  .metadata({
    actionName: 'getReputationBreakdown',
    category: 'user',
  })
  .schema(z.void())
  .outputSchema(reputationBreakdownSchema)
  .action(async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to view reputation breakdown');
    }

    // Get breakdown via repository (includes caching and parallel queries)
    const result = await reputationRepository.getBreakdown(user.id);

    if (!(result.success && result.data)) {
      throw new Error(result.error || 'Failed to fetch reputation breakdown');
    }

    return result.data;
  });
