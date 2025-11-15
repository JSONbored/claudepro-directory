'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Tables } from '@/src/types/database.types';

export interface CommunityDirectoryResult {
  all_users: Array<Tables<'users'>>;
  top_contributors: Array<Tables<'users'>>;
  new_members: Array<Tables<'users'>>;
}

export async function getCommunityDirectory(options: {
  searchQuery?: string;
  limit?: number;
}): Promise<CommunityDirectoryResult | null> {
  const { searchQuery, limit = 100 } = options;

  return fetchCachedRpc<CommunityDirectoryResult | null>(
    {
      ...(searchQuery ? { p_search_query: searchQuery } : {}),
      p_limit: limit,
    },
    {
      rpcName: 'get_community_directory',
      tags: ['community', 'users'],
      ttlKey: 'cache.community.ttl_seconds',
      keySuffix: `${searchQuery ?? 'all'}-${limit}`,
      useAuthClient: true,
      fallback: null,
      logMeta: {
        hasQuery: Boolean(searchQuery),
        limit,
      },
    }
  );
}
