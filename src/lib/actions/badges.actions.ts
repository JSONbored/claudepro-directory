/**
 * Badge System Server Actions
 *
 * Production-grade server actions for badge management, awarding, and querying.
 * Implements authentication, validation, caching, and analytics tracking.
 *
 * Core Principles:
 * - Type-safe with Zod validation
 * - Secure with authedAction middleware
 * - Performance-optimized with caching
 * - Analytics-tracked for insights
 * - Error-handled comprehensively
 *
 * @module actions/badges
 */

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { authedAction } from '@/src/lib/actions/safe-action';
import { getAutoAwardBadges } from '@/src/lib/config/badges.config';
import {
  type UserBadgeWithBadge,
  userBadgeRepository,
} from '@/src/lib/repositories/user-badge.repository';
import { userIdSchema } from '@/src/lib/schemas/branded-types.schema';

// =============================================================================
// GET USER BADGES
// =============================================================================

/**
 * Get all badges for current user with badge details
 */
export const getUserBadges = authedAction
  .metadata({
    actionName: 'getUserBadges',
    category: 'user',
  })
  .schema(
    z.object({
      limit: z.number().int().positive().max(100).optional(),
      offset: z.number().int().nonnegative().optional(),
    })
  )
  .action(async ({ parsedInput: { limit, offset }, ctx }) => {
    const { userId } = ctx;

    const result = await userBadgeRepository.findByUserWithBadgeDetails(userId, {
      limit: limit ?? 100,
      offset: offset ?? 0,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch user badges');
    }

    return {
      badges: result.data || [],
      total: result.data?.length || 0,
    };
  });

// =============================================================================
// GET FEATURED BADGES
// =============================================================================

/**
 * Get featured badges for current user
 */
export const getFeaturedBadges = authedAction
  .metadata({
    actionName: 'getFeaturedBadges',
    category: 'user',
  })
  .schema(
    z.object({
      limit: z.number().int().positive().max(10).optional().default(5),
    })
  )
  .action(async ({ parsedInput: { limit }, ctx }) => {
    const { userId } = ctx;

    const result = await userBadgeRepository.findFeaturedByUser(userId, { limit });

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch featured badges');
    }

    return {
      badges: result.data || [],
    };
  });

// =============================================================================
// TOGGLE FEATURED BADGE
// =============================================================================

/**
 * Toggle featured status for a user badge
 * Users can feature up to 5 badges on their profile
 */
export const toggleBadgeFeatured = authedAction
  .metadata({
    actionName: 'toggleBadgeFeatured',
    category: 'user',
  })
  .schema(
    z.object({
      badgeId: z.string().uuid(),
      featured: z.boolean(),
    })
  )
  .action(async ({ parsedInput: { badgeId, featured }, ctx }) => {
    const { userId } = ctx;

    // Verify this badge belongs to the user
    const badgeResult = await userBadgeRepository.findById(badgeId);

    if (!(badgeResult.success && badgeResult.data)) {
      throw new Error('Badge not found');
    }

    if (badgeResult.data.user_id !== userId) {
      throw new Error('Unauthorized: This badge does not belong to you');
    }

    // If featuring, check limit (max 5 featured badges)
    if (featured) {
      const featuredResult = await userBadgeRepository.findFeaturedByUser(userId);
      if (featuredResult.success && (featuredResult.data?.length || 0) >= 5) {
        throw new Error('You can only feature up to 5 badges');
      }
    }

    // Toggle featured status
    const result = await userBadgeRepository.toggleFeatured(badgeId, featured);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update featured status');
    }

    // Revalidate profile pages
    revalidatePath('/account');
    revalidatePath('/u/*');

    return {
      success: true,
      featured,
    };
  });

// =============================================================================
// CHECK BADGE ELIGIBILITY
// =============================================================================

/**
 * Check which badges the current user is eligible for but hasn't earned yet
 */
export const checkBadgeEligibility = authedAction
  .metadata({
    actionName: 'checkBadgeEligibility',
    category: 'user',
  })
  .schema(z.void())
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    // Get user's current badges
    const userBadgesResult = await userBadgeRepository.findByUserWithBadgeDetails(userId);

    if (!userBadgesResult.success) {
      throw new Error('Failed to fetch user badges');
    }

    // Create set of earned badge slugs
    const earnedBadgeSlugs = new Set(
      (userBadgesResult.data || []).map((userBadge) => userBadge.badges?.slug).filter(Boolean)
    );

    // Get all auto-award badges and filter out already earned ones
    const autoAwardBadges = getAutoAwardBadges();
    const eligibleBadges = autoAwardBadges.filter((badge) => !earnedBadgeSlugs.has(badge.slug));

    return {
      eligibleBadges: eligibleBadges.map((badge) => ({
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        criteria: badge.criteria,
      })),
    };
  });

// =============================================================================
// GET RECENTLY EARNED BADGES
// =============================================================================

/**
 * Get badges earned by user in the last N minutes
 * Used for showing badge award notifications
 */
export const getRecentlyEarnedBadges = authedAction
  .metadata({
    actionName: 'getRecentlyEarnedBadges',
    category: 'user',
  })
  .schema(
    z.object({
      since: z.string().datetime().optional(),
    })
  )
  .action(async ({ parsedInput: { since }, ctx }) => {
    const { userId } = ctx;

    const result = await userBadgeRepository.findRecentlyEarned(userId, since);

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch recently earned badges');
    }

    return {
      badges: result.data || [],
    };
  });

// =============================================================================
// PUBLIC BADGE QUERIES
// =============================================================================

/**
 * Get badges for any user (public)
 * No authentication required - for public profile viewing
 */
export async function getPublicUserBadges(
  targetUserId: string,
  options?: { limit?: number; featuredOnly?: boolean }
): Promise<UserBadgeWithBadge[]> {
  // Validate input
  const validatedUserId = userIdSchema.parse(targetUserId);

  // Fetch appropriate badges
  const result = options?.featuredOnly
    ? await userBadgeRepository.findFeaturedByUser(
        validatedUserId,
        options.limit !== undefined ? { limit: options.limit } : undefined
      )
    : await userBadgeRepository.findByUserWithBadgeDetails(
        validatedUserId,
        options?.limit !== undefined ? { limit: options.limit } : undefined
      );

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch user badges');
  }

  return result.data || [];
}

/**
 * Check if user has specific badge (public)
 */
export async function userHasBadge(userId: string, badgeId: string): Promise<boolean> {
  // Validate inputs
  const validatedUserId = userIdSchema.parse(userId);
  const validatedBadgeId = z.string().uuid().parse(badgeId);

  const result = await userBadgeRepository.hasUserBadge(validatedUserId, validatedBadgeId);

  if (!result.success) {
    return false;
  }

  return result.data ?? false;
}

// =============================================================================
// HELPER EXPORTS
// =============================================================================
