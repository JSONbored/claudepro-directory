/**
 * Badge System - Database-First Architecture
 * All badge evaluation logic in PostgreSQL via triggers and RPC functions.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { authedAction } from '@/src/lib/actions/safe-action';
import { nonEmptyString } from '@/src/lib/schemas/primitives';
import { createClient } from '@/src/lib/supabase/server';

const BADGE_SELECT = `
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
`;

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
    let query = supabase
      .from('user_badges')
      .select(BADGE_SELECT)
      .eq('user_id', ctx.userId)
      .order('earned_at', { ascending: false });

    if (featuredOnly) query = query.eq('featured', true);
    if (limit) query = query.range(offset ?? 0, (offset ?? 0) + limit - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch badges: ${error.message}`);

    return { badges: data || [], total: data?.length || 0 };
  });

export const toggleBadgeFeatured = authedAction
  .metadata({ actionName: 'toggleBadgeFeatured', category: 'user' })
  .schema(
    z.object({
      badgeId: z.string().uuid(),
      featured: z.boolean(),
    })
  )
  .action(async ({ parsedInput: { badgeId, featured }, ctx }) => {
    const supabase = await createClient();

    const { data: badge } = await supabase
      .from('user_badges')
      .select('user_id')
      .eq('id', badgeId)
      .single();

    if (!badge || badge.user_id !== ctx.userId) {
      throw new Error('Badge not found or unauthorized');
    }

    if (featured) {
      const { count } = await supabase
        .from('user_badges')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', ctx.userId)
        .eq('featured', true);

      if ((count || 0) >= 5) throw new Error('Maximum 5 featured badges');
    }

    const { error } = await supabase.from('user_badges').update({ featured }).eq('id', badgeId);
    if (error) throw new Error(`Failed to update: ${error.message}`);

    revalidatePath('/account');
    revalidatePath('/u/*');

    return { success: true, featured };
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
      .select('id, earned_at, badge:badges (slug, name, description, icon)')
      .eq('user_id', ctx.userId)
      .gte('earned_at', sinceTime)
      .order('earned_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch badges: ${error.message}`);
    return { badges: data || [] };
  });

export async function getPublicUserBadges(
  targetUserId: string,
  options?: { limit?: number; featuredOnly?: boolean }
) {
  const validatedUserId = nonEmptyString.uuid().parse(targetUserId);
  const supabase = await createClient();

  let query = supabase
    .from('user_badges')
    .select(BADGE_SELECT)
    .eq('user_id', validatedUserId)
    .order('earned_at', { ascending: false });

  if (options?.featuredOnly) query = query.eq('featured', true);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch badges: ${error.message}`);

  return data || [];
}

export async function userHasBadge(userId: string, badgeId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('user_badges')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', nonEmptyString.uuid().parse(userId))
    .eq('badge_id', z.string().uuid().parse(badgeId));

  return (count || 0) > 0;
}
