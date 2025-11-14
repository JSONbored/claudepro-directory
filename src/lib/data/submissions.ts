/**
 * Submissions Data Layer - Dashboard stats and community activity
 */

import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import type { Database } from '@/src/types/database.types';

export type SubmissionDashboardData = {
  stats: { total: number; pending: number; merged_this_week: number };
  recent: Array<{
    id: string | number;
    content_name: string;
    content_type: Database['public']['Enums']['submission_type'];
    merged_at: string;
    user?: { name: string; slug: string } | null;
  }>;
  contributors: Array<{
    name: string;
    slug: string;
    rank: number;
    mergedCount: number;
  }>;
};

export async function getSubmissionDashboard(
  recentLimit = 5,
  contributorsLimit = 5
): Promise<SubmissionDashboardData | null> {
  try {
    const data = await cachedRPCWithDedupe<SubmissionDashboardData>(
      'get_submission_dashboard',
      {
        p_recent_limit: recentLimit,
        p_contributors_limit: contributorsLimit,
      },
      {
        tags: ['submissions', 'dashboard', 'content'],
        ttlConfigKey: 'cache.submission_dashboard.ttl_seconds',
        keySuffix: `${recentLimit}-${contributorsLimit}`,
        useAuthClient: true,
      }
    );

    return data;
  } catch (error) {
    logger.error(
      'Error in getSubmissionDashboard',
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  }
}
