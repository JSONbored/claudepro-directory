'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { searchUsersUnified } from '@/src/lib/edge/search-client';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { GetGetCommunityDirectoryReturn } from '@/src/types/database-overrides';

export async function getCommunityDirectory(options: {
  searchQuery?: string;
  limit?: number;
}): Promise<GetGetCommunityDirectoryReturn | null> {
  const { searchQuery, limit = 100 } = options;

  // Hybrid approach:
  // - If search query provided → use unified-search (events + edge cache)
  // - If no query → use optimized RPC (structured directory data)
  if (searchQuery?.trim()) {
    try {
      // Use unified-search for search queries
      const unifiedResults = await searchUsersUnified(searchQuery.trim(), limit);

      // Transform unified-search results to directory format
      // Note: unified-search returns basic fields, we need to fetch full user data
      // For now, we'll use the basic fields and let the UI handle it
      const allUsers: GetGetCommunityDirectoryReturn['all_users'] = unifiedResults
        .filter((result): result is typeof result & { slug: string } => result.slug != null) // Filter out null slugs
        .map((result) => ({
          id: result.id,
          slug: result.slug,
          name: result.title || result.slug || '',
          image: null, // unified-search doesn't return image
          bio: result.description || null,
          work: null, // unified-search doesn't return work
          tier: 'free' as const, // unified-search doesn't return tier, default to free
          created_at: result.created_at,
        }));

      // Pulse search events (fire and forget)
      const { pulseUserSearch } = await import('@/src/lib/utils/pulse');
      pulseUserSearch(searchQuery.trim(), allUsers.length).catch((error) => {
        logger.warn('Failed to pulse user search', {
          error: error instanceof Error ? error.message : String(error),
        });
      });

      // For search results, return only all_users (top_contributors/new_members not relevant)
      return {
        all_users: allUsers,
        top_contributors: [],
        new_members: [],
      };
    } catch (error) {
      const normalized = normalizeError(error, 'User search via unified-search failed');
      logger.error('User search via unified-search failed, falling back to RPC', normalized, {
        query: searchQuery,
      });
      // Fall back to RPC if unified-search fails
    }
  }

  // No search query or unified-search failed → use optimized RPC for directory listing
  return fetchCachedRpc<'get_community_directory', GetGetCommunityDirectoryReturn | null>(
    {
      p_limit: limit,
    },
    {
      rpcName: 'get_community_directory',
      tags: ['community', 'users'],
      ttlKey: 'cache.community.ttl_seconds',
      keySuffix: `all-${limit}`,
      useAuthClient: true,
      fallback: null,
      logMeta: {
        hasQuery: false,
        limit,
      },
    }
  );
}
