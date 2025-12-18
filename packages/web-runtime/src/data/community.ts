'use server';
import {
  type CommunityDirectoryUser,
  type GetCommunityDirectoryReturns,
  type GetUserCollectionDetailReturns,
  type GetUserProfileReturns,
  type SearchUnifiedArgs,
} from '@heyclaude/database-types/postgres-types';

import { normalizeError } from '../errors.ts';
import { logger, pulseUserSearch } from '../index.ts';

import { createCachedDataFunction, generateResourceTags } from './cached-data-factory.ts';

const DEFAULT_DIRECTORY_LIMIT = 100;

/**
 * Search users using unified search (cached)
 * Uses 'use cache' to cache search results. Query and limit become part of the cache key.
 * Follows architectural strategy: data layer -> database RPC -> DB
 */
const searchUsersUnified = createCachedDataFunction<
  { query: string; limit: number },
  CommunityDirectoryUser[]
>({
  serviceKey: 'search',
  methodName: 'searchUnified',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  cacheTags: () => generateResourceTags('community', undefined, ['user-search']),
  module: 'data/community',
  operation: 'searchUsersUnified',
  transformArgs: (args) =>
    ({
      p_entities: ['user'],
      p_highlight_query: args.query,
      p_limit: args.limit,
      p_offset: 0,
      p_query: args.query,
    }) as SearchUnifiedArgs,
  transformResult: (result) => {
    const searchResponse = result as { data?: Array<{ description?: string; created_at?: string; id?: string; title?: string; slug?: string }> };
    const results = searchResponse.data || [];
    return results.map((result) => ({
      bio: result.description || null,
      created_at: result.created_at || '',
      id: result.id || '',
      image: null,
      name: result.title || result.slug || '',
      slug: result.slug || '',
      tier: 'free',
      work: null,
    }));
  },
  onError: () => [], // Return empty array on error
});

export type CollectionDetailData = GetUserCollectionDetailReturns;

/**
 * Get community directory via RPC (cached)
 * Uses 'use cache' to cache directory listings. This data is public and same for all users.
 * Community directory changes periodically, so we use the 'long' cacheLife profile.
 */
const getCommunityDirectoryRpc = createCachedDataFunction<
  number,
  GetCommunityDirectoryReturns | null
>({
  serviceKey: 'misc', // Consolidated: CommunityService methods moved to MiscService
  methodName: 'getCommunityDirectory',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  cacheTags: () => generateResourceTags('community', undefined, ['users']),
  module: 'data/community',
  operation: 'getCommunityDirectoryRpc',
  transformArgs: (limit) => ({ p_limit: limit }),
  throwOnError: true,
  logContext: (limit) => ({ limit }),
});

export async function getCommunityDirectory(options: {
  limit?: number;
  searchQuery?: string;
}): Promise<GetCommunityDirectoryReturns | null> {
  const { limit = DEFAULT_DIRECTORY_LIMIT, searchQuery } = options;
  const reqLogger = logger.child({
    module: 'data/community',
    operation: 'getCommunityDirectory',
  });

  if (searchQuery?.trim()) {
    try {
      // Use SearchService directly (same as API route)
      // Follows architectural strategy: data layer -> database RPC -> DB
      const allUsers = await searchUsersUnified({ query: searchQuery.trim(), limit });

      // Fire-and-forget: Pulse user search
      if (allUsers) {
        pulseUserSearch(searchQuery.trim(), allUsers.length).catch((error) => {
          const normalized = normalizeError(error, 'Failed to pulse user search');
          // Use child logger for callback to maintain isolation
          const callbackLogger = logger.child({
            module: 'data/community',
            operation: 'pulseUserSearch',
          });
          callbackLogger.warn(
            {
              err: normalized,
              resultCount: allUsers.length,
              searchQuery: searchQuery.trim(),
            },
            'Failed to pulse user search'
          );
        });
      }

      return {
        all_users: allUsers ?? [],
        new_members: [],
        top_contributors: [],
      };
    } catch (error) {
      const normalized = normalizeError(error, 'Community directory search failed');
      reqLogger.warn(
        { err: normalized, fallbackStrategy: 'rpc', limit, searchQuery: searchQuery.trim() },
        'Community directory search failed, using RPC fallback'
      );
      // Fall through to RPC fallback
    }
  }

  // If we have a search query, we already returned above, so this is the fallback RPC path
  // Use cached RPC function
  return await getCommunityDirectoryRpc(limit);
}

/**
 * Get public user profile
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope when viewerId is provided,
 * while still providing per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (slug and viewerId in cache tag)
 * - Not prerendered (runs at request time)
 */
export const getPublicUserProfile = createCachedDataFunction<
  { slug: string; viewerId?: string },
  GetUserProfileReturns | null
>({
  serviceKey: 'misc', // Consolidated: CommunityService methods moved to MiscService
  methodName: 'getUserProfile',
  cacheMode: 'private',
  cacheLife: 'userProfile', // 1min stale, 5min revalidate, 30min expire - User-specific data
  cacheTags: (input) => {
    const tags = [`user-profile-${input.slug}`];
    if (input.viewerId) {
      tags.push(`user-profile-viewer-${input.viewerId}`);
    }
    return tags;
  },
  module: 'data/community',
  operation: 'getPublicUserProfile',
  transformArgs: (input) => ({
    p_user_slug: input.slug,
    ...(input.viewerId ? { p_viewer_id: input.viewerId } : {}),
  }),
  throwOnError: true,
  logContext: (input) => ({
    hasViewer: Boolean(input.viewerId),
    slug: input.slug,
  }),
});

/**
 * Get public collection detail
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope when viewerId is provided,
 * while still providing per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userSlug, collectionSlug, and viewerId in cache tag)
 * - Not prerendered (runs at request time)
 */
export const getPublicCollectionDetail = createCachedDataFunction<
  { collectionSlug: string; userSlug: string; viewerId?: string },
  CollectionDetailData | null
>({
  serviceKey: 'misc', // Consolidated: CommunityService methods moved to MiscService
  methodName: 'getUserCollectionDetail',
  cacheMode: 'private',
  cacheLife: 'userProfile', // 1min stale, 5min revalidate, 30min expire - User-specific data
  cacheTags: (input) => {
    const tags = [`user-collection-${input.userSlug}-${input.collectionSlug}`];
    if (input.viewerId) {
      tags.push(`user-collection-viewer-${input.viewerId}`);
    }
    return tags;
  },
  module: 'data/community',
  operation: 'getPublicCollectionDetail',
  transformArgs: (input) => ({
    p_collection_slug: input.collectionSlug,
    p_user_slug: input.userSlug,
    ...(input.viewerId ? { p_viewer_id: input.viewerId } : {}),
  }),
  throwOnError: true,
  logContext: (input) => ({
    collectionSlug: input.collectionSlug,
    hasViewer: Boolean(input.viewerId),
    slug: input.userSlug,
  }),
});
