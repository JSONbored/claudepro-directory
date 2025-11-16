'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { GetCommunityDirectoryReturn } from '@/src/types/database-overrides';

export async function getCommunityDirectory(options: {
  searchQuery?: string;
  limit?: number;
}): Promise<GetCommunityDirectoryReturn | null> {
  const { searchQuery, limit = 100 } = options;

  return fetchCachedRpc<GetCommunityDirectoryReturn | null>(
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
