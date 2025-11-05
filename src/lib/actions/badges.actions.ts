/**
 * Badge System - Database-First Architecture
 * All badge evaluation logic in PostgreSQL via triggers and RPC functions.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { authedAction } from '@/src/lib/actions/safe-action';
import { createClient } from '@/src/lib/supabase/server';
import type { Tables } from '@/src/types/database.types';

type UserBadgeWithDetails = Pick<
  Tables<'user_badges'>,
  'id' | 'badge_id' | 'earned_at' | 'featured' | 'metadata'
> & {
  badge: Tables<'badges'>;
};

/**
 * Get user badges with full badge details
 * Uses optimized RPC that returns badges + details in single query
 */
export const getUserBadges = authedAction
  .metadata({ actionName: 'getUserBadges', category: 'user' })
  .schema(
    z.object({
      limit: z.number().int().positive().max(100).optional(),
      offset: z.number().int().nonnegative().optional(),
      featuredOnly: z.boolean().optional(),
    })
  )
  .action(async ({ parsedInput: { limit, offset, featuredOnly }, ctx }) => {
    const supabase = await createClient();

    // Use optimized RPC - single query with JOIN
    const { data, error } = await supabase.rpc('get_user_badges_with_details', {
      p_user_id: ctx.userId,
      p_featured_only: featuredOnly ?? false,
      ...(limit !== undefined && { p_limit: limit }),
      ...(offset !== undefined && { p_offset: offset }),
    });

    if (error) throw new Error(`Failed to fetch badges: ${error.message}`);

    const badges = (data || []) as unknown as UserBadgeWithDetails[];
    return { badges, total: Array.isArray(badges) ? badges.length : 0 };
  });

export const toggleBadgeFeatured = authedAction
  .metadata({ actionName: 'toggleBadgeFeatured', category: 'user' })
  .schema(
    z.object({
      badgeId: z.string(),
      featured: z.boolean(),
    })
  )
  .action(async ({ parsedInput: { badgeId, featured }, ctx }) => {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('toggle_badge_featured', {
      p_badge_id: badgeId,
      p_user_id: ctx.userId,
      p_featured: featured,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/account');
    revalidatePath('/u/*');

    return data;
  });

export const checkAndAwardBadges = authedAction
  .metadata({ actionName: 'checkAndAwardBadges', category: 'user' })
  .schema(z.void())
  .action(async ({ ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('check_and_award_badges_manual', {
      p_user_id: ctx.userId,
    });

    if (error) throw new Error(`Failed to check badges: ${error.message}`);
    if (!data || data.length === 0) return { success: false, badgesAwarded: 0, badgeSlugs: [] };

    const result = data[0];
    if (!result) return { success: false, badgesAwarded: 0, badgeSlugs: [] };

    if (result.badges_awarded > 0) {
      revalidatePath('/account');
      revalidatePath('/u/*');
    }

    return {
      success: result.success,
      badgesAwarded: result.badges_awarded,
      badgeSlugs: result.badge_slugs,
    };
  });

export const getRecentlyEarnedBadges = authedAction
  .metadata({ actionName: 'getRecentlyEarnedBadges', category: 'user' })
  .schema(z.object({ since: z.string().datetime().optional() }))
  .action(async ({ parsedInput: { since }, ctx }) => {
    const supabase = await createClient();
    const sinceTime = since || new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('user_badges')
      .select('id, earned_at, badge:badges (slug, name, description, icon, rarity)')
      .eq('user_id', ctx.userId)
      .gte('earned_at', sinceTime)
      .order('earned_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch badges: ${error.message}`);
    return { badges: data || [] };
  });

/**
 * Public function to fetch user badges (used in public profile pages)
 * Now uses the optimized RPC
 */
export async function getPublicUserBadges(
  targetUserId: string,
  options?: { limit?: number; featuredOnly?: boolean }
) {
  const supabase = await createClient();

  // Use optimized RPC
  const { data, error } = await supabase.rpc('get_user_badges_with_details', {
    p_user_id: targetUserId,
    p_featured_only: options?.featuredOnly ?? false,
    ...(options?.limit !== undefined && { p_limit: options.limit }),
  });

  if (error) throw new Error(`Failed to fetch badges: ${error.message}`);

  return (data || []) as unknown as UserBadgeWithDetails[];
}

export async function userHasBadge(userId: string, badgeId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('user_badges')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('badge_id', badgeId);

  return (count || 0) > 0;
}
