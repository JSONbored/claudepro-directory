/**
 * Submissions Data Layer - Dashboard stats and community activity
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
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
  return fetchCachedRpc<SubmissionDashboardData | null>(
    {
      p_recent_limit: recentLimit,
      p_contributors_limit: contributorsLimit,
    },
    {
      rpcName: 'get_submission_dashboard',
      tags: ['submissions', 'dashboard', 'content'],
      ttlKey: 'cache.submission_dashboard.ttl_seconds',
      keySuffix: `${recentLimit}-${contributorsLimit}`,
      useAuthClient: true,
      fallback: null,
      logMeta: { recentLimit, contributorsLimit },
    }
  );
}
