/**
 * Reputation System - Database-First Architecture
 * All logic in PostgreSQL. Single RPC call per action.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { authedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';

export const getReputationBreakdown = authedAction
  .metadata({ actionName: 'getReputationBreakdown', category: 'reputation' })
  .schema(z.void())
  .action(async ({ ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_user_reputation_breakdown', {
      p_user_id: ctx.userId,
    });

    if (error) throw new Error(`Failed to fetch reputation: ${error.message}`);
    return data;
  });

export const getActivityCounts = authedAction
  .metadata({ actionName: 'getActivityCounts', category: 'reputation' })
  .schema(z.void())
  .action(async ({ ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_user_reputation_breakdown', {
      p_user_id: ctx.userId,
    });

    if (error) throw new Error(`Failed to fetch activity counts: ${error.message}`);
    return (data as { activityCounts: unknown }).activityCounts;
  });

export const recalculateReputation = authedAction
  .metadata({ actionName: 'recalculateReputation', category: 'reputation' })
  .schema(z.void())
  .action(async ({ ctx }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('calculate_user_reputation', {
      target_user_id: ctx.userId,
    });

    if (error) {
      logger.error('Failed to recalculate reputation', new Error(error.message), {
        userId: ctx.userId,
        rpcFunction: 'calculate_user_reputation',
      });
      throw new Error(`Failed to recalculate reputation: ${error.message}`);
    }

    revalidatePath('/account');
    revalidatePath('/u/*');

    return { success: true, newScore: data as number };
  });

export async function getUserReputation(targetUserId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_user_reputation_breakdown', {
    p_user_id: targetUserId,
  });

  if (error) throw new Error(`Failed to fetch user reputation: ${error.message}`);
  return data;
}
