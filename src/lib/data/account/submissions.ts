/**
 * Submissions Data Layer - Dashboard stats and community activity
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Database } from '@/src/types/database.types';

export async function getSubmissionDashboard(
  recentLimit = 5,
  contributorsLimit = 5
): Promise<Database['public']['Functions']['get_submission_dashboard']['Returns'] | null> {
  return fetchCachedRpc<
    'get_submission_dashboard',
    Database['public']['Functions']['get_submission_dashboard']['Returns'] | null
  >(
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
