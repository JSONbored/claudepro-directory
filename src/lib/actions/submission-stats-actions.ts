'use server';

/**
 * Submission Stats Actions
 * Server actions for submit page sidebar using next-safe-action
 * 
 * PERFORMANCE:
 * - Next.js caching (5-10 min TTL)
 * - Parallel queries
 * - Minimal data transfer
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { createClient } from '@/src/lib/supabase/server';
import { logger } from '@/src/lib/logger';
import { unstable_cache } from 'next/cache';
import {
  submissionStatsSchema,
  recentMergedSchema,
  topContributorSchema,
  type RecentMerged,
  type TopContributor,
} from '@/src/lib/schemas/submission-stats.schema';
import { nonNegativeInt } from '@/src/lib/schemas/primitives/base-numbers';

/**
 * Get submission statistics
 * Cached for 5 minutes
 */
export const getSubmissionStats = rateLimitedAction
  .metadata({
    actionName: 'getSubmissionStats',
    category: 'analytics',
  })
  .schema(z.object({})) // No input needed
  .outputSchema(submissionStatsSchema)
  .action(async () => {
    const cachedStats = await unstable_cache(
      async () => {
        try {
          const supabase = await createClient();

          // Parallel queries for speed
          const [totalResult, pendingResult, mergedWeekResult] = await Promise.all([
            // Total submissions (all time)
            supabase
              .from('submissions')
              .select('id', { count: 'exact', head: true }),

            // Pending review
            supabase
              .from('submissions')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'pending'),

            // Merged this week
            supabase
              .from('submissions')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'merged')
              .gte('merged_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
          ]);

          return {
            total: totalResult.count || 0,
            pending: pendingResult.count || 0,
            mergedThisWeek: mergedWeekResult.count || 0,
          };
        } catch (error) {
          logger.error('Failed to fetch submission stats', error instanceof Error ? error : new Error(String(error)));
          return { total: 0, pending: 0, mergedThisWeek: 0 };
        }
      },
      ['submission-stats'],
      {
        revalidate: 300, // 5 minutes
        tags: ['submissions', 'stats'],
      }
    )();

    return cachedStats;
  });

/**
 * Get recently merged submissions
 * Shows social proof
 */
export const getRecentMerged = rateLimitedAction
  .metadata({
    actionName: 'getRecentMerged',
    category: 'analytics',
  })
  .schema(z.object({
    limit: nonNegativeInt.min(1).max(10).default(5),
  }))
  .outputSchema(z.array(recentMergedSchema))
  .action(async ({ parsedInput }: { parsedInput: { limit: number } }) => {
    const cachedMerged = await unstable_cache(
      async () => {
        try {
          const supabase = await createClient();

          const { data, error } = await supabase
            .from('submissions')
            .select(`
              id,
              content_name,
              content_type,
              merged_at,
              user_id,
              users!inner (
                name,
                slug
              )
            `)
            .eq('status', 'merged')
            .not('merged_at', 'is', null)
            .order('merged_at', { ascending: false })
            .limit(parsedInput.limit);

          if (error) throw error;

          // Transform to match schema
          const transformed: RecentMerged[] = (data || []).map((item: any) => ({
            id: item.id,
            content_name: item.content_name,
            content_type: item.content_type,
            merged_at: item.merged_at,
            user: item.users ? {
              name: item.users.name,
              slug: item.users.slug,
            } : null,
          }));

          return transformed;
        } catch (error) {
          logger.error('Failed to fetch recent merged', error instanceof Error ? error : new Error(String(error)));
          return [];
        }
      },
      [`recent-merged-${parsedInput.limit}`],
      {
        revalidate: 600, // 10 minutes
        tags: ['submissions', 'merged'],
      }
    )();

    return cachedMerged;
  });

/**
 * Get top contributors
 * Gamification element
 */
export const getTopContributors = rateLimitedAction
  .metadata({
    actionName: 'getTopContributors',
    category: 'analytics',
  })
  .schema(z.object({
    limit: nonNegativeInt.min(1).max(10).default(5),
  }))
  .outputSchema(z.array(topContributorSchema))
  .action(async ({ parsedInput }: { parsedInput: { limit: number } }) => {
    const cachedContributors = await unstable_cache(
      async () => {
        try {
          const supabase = await createClient();

          // Count merged submissions per user
          const { data, error } = await supabase
            .from('submissions')
            .select('user_id, users!inner(name, slug)')
            .eq('status', 'merged');

          if (error) throw error;

          // Group by user and count
          const userCounts = new Map<string, { name: string; slug: string; count: number }>();
          
          for (const submission of data || []) {
            const user = (submission as any).users;
            if (!user) continue;
            
            const existing = userCounts.get(user.slug) || { name: user.name, slug: user.slug, count: 0 };
            existing.count++;
            userCounts.set(user.slug, existing);
          }

          // Sort by count and get top N
          const sorted = Array.from(userCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, parsedInput.limit);

          // Transform to schema format
          const contributors: TopContributor[] = sorted.map((user, index) => ({
            rank: index + 1,
            name: user.name,
            slug: user.slug,
            mergedCount: user.count,
          }));

          return contributors;
        } catch (error) {
          logger.error('Failed to fetch top contributors', error instanceof Error ? error : new Error(String(error)));
          return [];
        }
      },
      [`top-contributors-${parsedInput.limit}`],
      {
        revalidate: 3600, // 1 hour
        tags: ['submissions', 'leaderboard'],
      }
    )();

    return cachedContributors;
  });
