/**
 * Submissions Data Layer - Dashboard stats and community activity
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { GetGetSubmissionDashboardReturn } from '@/src/types/database-overrides';

export async function getSubmissionDashboard(
  recentLimit = 5,
  contributorsLimit = 5
): Promise<GetGetSubmissionDashboardReturn | null> {
  return fetchCachedRpc<'get_submission_dashboard', GetGetSubmissionDashboardReturn | null>(
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
