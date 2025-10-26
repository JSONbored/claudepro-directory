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
import { userIdSchema } from '@/src/lib/schemas/branded-types.schema';
import { createClient } from '@/src/lib/supabase/server';

// UserBadge with badge details joined
type UserBadgeWithBadge = {
  id: string;
  badge_id: string;
  earned_at: string;
  featured: boolean | null;
  badges: {
    slug: string;
    name: string;
    description: string;
    icon: string | null;
    category: string;
  };
};

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

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_badges')
      .select(
        `
        id,
        badge_id,
        earned_at,
        featured,
        badges!inner (
          slug,
          name,
          description,
          icon,
          category
        )
      `
      )
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .range(offset ?? 0, (offset ?? 0) + (limit ?? 100) - 1);

    if (error) {
      throw new Error(`Failed to fetch user badges: ${error.message}`);
    }

    return {
      badges: (data || []) as UserBadgeWithBadge[],
      total: data?.length || 0,
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

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_badges')
      .select(
        `
        id,
        badge_id,
        earned_at,
        featured,
        badges!inner (
          slug,
          name,
          description,
          icon,
          category
        )
      `
      )
      .eq('user_id', userId)
      .eq('featured', true)
      .order('earned_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch featured badges: ${error.message}`);
    }

    return {
      badges: (data || []) as UserBadgeWithBadge[],
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

    const supabase = await createClient();

    // Verify this badge belongs to the user
    const { data: badge, error: checkError } = await supabase
      .from('user_badges')
      .select('user_id')
      .eq('id', badgeId)
      .single();

    if (checkError || !badge) {
      throw new Error('Badge not found');
    }

    if (badge.user_id !== userId) {
      throw new Error('Unauthorized: This badge does not belong to you');
    }

    // If featuring, check limit (max 5 featured badges)
    if (featured) {
      const { count, error: countError } = await supabase
        .from('user_badges')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('featured', true);

      if (countError) {
        throw new Error(`Failed to check featured badges: ${countError.message}`);
      }

      if ((count || 0) >= 5) {
        throw new Error('You can only feature up to 5 badges');
      }
    }

    // Toggle featured status
    const { error } = await supabase.from('user_badges').update({ featured }).eq('id', badgeId);

    if (error) {
      throw new Error(`Failed to update featured status: ${error.message}`);
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

    const supabase = await createClient();

    // Get user's current badges with badge details
    const { data: userBadges, error } = await supabase
      .from('user_badges')
      .select(
        `
        badges!inner (slug)
      `
      )
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch user badges: ${error.message}`);
    }

    // Create set of earned badge slugs
    type UserBadgeWithSlug = { badges: { slug: string } | null };
    const earnedBadgeSlugs = new Set(
      ((userBadges as UserBadgeWithSlug[]) || [])
        .map((ub) => ub.badges?.slug)
        .filter((slug): slug is string => Boolean(slug))
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

    const supabase = await createClient();
    const sinceTime = since || new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('user_badges')
      .select(
        `
        id,
        earned_at,
        badge:badges (
          slug,
          name,
          description,
          icon
        )
      `
      )
      .eq('user_id', userId)
      .gte('earned_at', sinceTime)
      .order('earned_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch recently earned badges: ${error.message}`);
    }

    return {
      badges: data || [],
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

  const supabase = await createClient();
  let query = supabase
    .from('user_badges')
    .select(
      `
      id,
      badge_id,
      earned_at,
      featured,
      badges!inner (
        slug,
        name,
        description,
        icon,
        category
      )
    `
    )
    .eq('user_id', validatedUserId);

  // Filter by featured if requested
  if (options?.featuredOnly) {
    query = query.eq('featured', true);
  }

  // Apply limit if specified
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  query = query.order('earned_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch user badges: ${error.message}`);
  }

  return (data || []) as UserBadgeWithBadge[];
}

/**
 * Check if user has specific badge (public)
 */
export async function userHasBadge(userId: string, badgeId: string): Promise<boolean> {
  // Validate inputs
  const validatedUserId = userIdSchema.parse(userId);
  const validatedBadgeId = z.string().uuid().parse(badgeId);

  const supabase = await createClient();
  const { count, error } = await supabase
    .from('user_badges')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', validatedUserId)
    .eq('badge_id', validatedBadgeId);

  if (error) {
    return false;
  }

  return (count || 0) > 0;
}

// =============================================================================
// HELPER EXPORTS
// =============================================================================
