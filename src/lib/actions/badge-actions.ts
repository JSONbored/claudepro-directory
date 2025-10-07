'use server';

/**
 * Badge Actions
 * Server actions for badge management
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { createClient } from '@/src/lib/supabase/server';

// Supabase query result types
type UserBadgeWithBadge = {
  id: string;
  badge_id: string;
  earned_at: string;
  featured: boolean;
  badges: {
    slug: string;
    name: string;
    description: string;
    icon: string | null;
    category: string;
  };
};

type BadgeEarnedItem = {
  earned_at: string;
  badge: {
    name: string;
    description: string;
    icon: string | null;
  };
};

/**
 * Get user's badges with details
 */
export const getUserBadges = rateLimitedAction
  .metadata({
    actionName: 'getUserBadges',
    category: 'user',
  })
  .schema(z.object({ user_id: z.string().uuid().optional() }))
  .outputSchema(
    z.object({
      badges: z.array(
        z.object({
          id: z.string().uuid(),
          badge_id: z.string().uuid(),
          earned_at: z.string(),
          featured: z.boolean(),
          badge: z.object({
            slug: z.string(),
            name: z.string(),
            description: z.string(),
            icon: z.string().nullable(),
            category: z.string(),
          }),
        })
      ),
    })
  )
  .action(async ({ parsedInput: { user_id } }) => {
    const supabase = await createClient();

    // If no user_id provided, use current user
    let targetUserId = user_id;
    if (!targetUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be signed in to view badges');
      }
      targetUserId = user.id;
    }

    // Fetch user's badges with badge details
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
      .eq('user_id', targetUserId)
      .order('earned_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch badges: ${error.message}`);
    }

    // Transform the data to match expected type
    const badges = ((data as unknown as UserBadgeWithBadge[]) || []).map((item) => ({
      id: item.id,
      badge_id: item.badge_id,
      earned_at: item.earned_at,
      featured: item.featured,
      badge: {
        slug: item.badges.slug,
        name: item.badges.name,
        description: item.badges.description,
        icon: item.badges.icon,
        category: item.badges.category,
      },
    }));

    return {
      badges,
    };
  });

/**
 * Check for newly earned badges
 * Used for showing notifications
 */
export const checkNewBadges = rateLimitedAction
  .metadata({
    actionName: 'checkNewBadges',
    category: 'user',
  })
  .schema(z.object({ since: z.string().datetime().optional() }))
  .outputSchema(
    z.object({
      new_badges: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          icon: z.string().nullable(),
          earned_at: z.string(),
        })
      ),
    })
  )
  .action(async ({ parsedInput: { since } }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in');
    }

    // Default to badges earned in last 5 minutes
    const sinceTime = since || new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('user_badges')
      .select(
        `
        earned_at,
        badge:badges (
          name,
          description,
          icon
        )
      `
      )
      .eq('user_id', user.id)
      .gte('earned_at', sinceTime)
      .order('earned_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to check badges: ${error.message}`);
    }

    const newBadges = ((data as unknown as BadgeEarnedItem[]) || []).map((item) => ({
      name: item.badge.name,
      description: item.badge.description,
      icon: item.badge.icon,
      earned_at: item.earned_at,
    }));

    return {
      new_badges: newBadges,
    };
  });

/**
 * Manually trigger badge check for current user
 * Useful for testing or if automatic triggers fail
 */
export const triggerBadgeCheck = rateLimitedAction
  .metadata({
    actionName: 'triggerBadgeCheck',
    category: 'user',
    rateLimit: {
      maxRequests: 10,
      windowSeconds: 60,
    },
  })
  .schema(z.void())
  .outputSchema(z.object({ badges_awarded: z.number().int().nonnegative() }))
  .action(async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in');
    }

    // Call the database function
    const { data, error } = await supabase.rpc('check_all_badges', {
      target_user_id: user.id,
    });

    if (error) {
      throw new Error(`Failed to check badges: ${error.message}`);
    }

    return {
      badges_awarded: (data as number) || 0,
    };
  });
