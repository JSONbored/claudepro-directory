'use server';

import { CommunityService, SearchService } from '@heyclaude/data-layer';
import type { CommunityDirectoryUser } from '@heyclaude/data-layer/types/composite-types';
import type {
  SearchUnifiedArgs,
  GetCommunityDirectoryReturns,
  GetUserProfileReturns,
  GetUserCollectionDetailReturns,
} from '@heyclaude/database-types/postgres-types/functions';
import { cacheLife, cacheTag } from 'next/cache';

import { normalizeError } from '../errors.ts';
import { logger, pulseUserSearch } from '../index.ts';

const DEFAULT_DIRECTORY_LIMIT = 100;

/****
 *
 * Search users using unified search (cached)
 * Uses 'use cache' to cache search results. Query and limit become part of the cache key.
 * Follows architectural strategy: data layer -> database RPC -> DB
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<unknown>} Return value description
 */
async function searchUsersUnified(
  query: string,
  limit: number
): Promise<Array<CommunityDirectoryUser>> {
  'use cache';

  // Configure cache - use 'quarter' profile for user search (same as API route)
  cacheLife('quarter'); // 15min stale, 5min revalidate, 2hr expire
  cacheTag('user-search');
  cacheTag('community');

  const searchService = new SearchService();

  const unifiedArgs: SearchUnifiedArgs = {
    p_entities: ['user'],
    p_highlight_query: query,
    p_limit: limit,
    p_offset: 0,
    p_query: query,
  };

  const searchResponse = await searchService.searchUnified(unifiedArgs);
  const results = searchResponse.data || [];

  return results.map((result) => ({
    bio: result.description || null,
    created_at: result.created_at as string,
    id: result.id as string,
    image: null,
    name: result.title || result.slug || '',
    slug: result.slug as string,
    tier: 'free',
    work: null,
  }));
}

export type CollectionDetailData = GetUserCollectionDetailReturns;

/***
 *
 * Get community directory via RPC (cached)
 * Uses 'use cache' to cache directory listings. This data is public and same for all users.
 * Community directory changes periodically, so we use the 'half' cacheLife profile.
 * @param {number} limit
 * @returns {Promise<unknown>} Return value description
 */
async function getCommunityDirectoryRpc(
  limit: number
): Promise<GetCommunityDirectoryReturns | null> {
  'use cache';

  // Configure cache - use 'half' profile for community directory (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('community');
  cacheTag('users');

  const reqLogger = logger.child({
    module: 'data/community',
    operation: 'getCommunityDirectoryRpc',
  });

  try {
    const service = new CommunityService();
    const result = await service.getCommunityDirectory({ p_limit: limit });

    reqLogger.info(
      { hasResult: Boolean(result), limit },
      'getCommunityDirectoryRpc: fetched successfully'
    );

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'getCommunityDirectoryRpc failed');
    reqLogger.error({ err: normalized, limit }, 'getCommunityDirectoryRpc failed');
    throw error;
  }
}

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
      const allUsers = await searchUsersUnified(searchQuery.trim(), limit);

      // Fire-and-forget: Pulse user search
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

      return {
        all_users: allUsers,
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
 * @param input
 * @param input.slug
 * @param input.viewerId
 */
export async function getPublicUserProfile(input: {
  slug: string;
  viewerId?: string;
}): Promise<GetUserProfileReturns | null> {
  'use cache: private';

  const { slug, viewerId } = input;

  // Configure cache
  cacheLife({ expire: 1800, revalidate: 300, stale: 60 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-profile-${slug}`);
  if (viewerId) {
    cacheTag(`user-profile-viewer-${viewerId}`);
  }

  const reqLogger = logger.child({
    module: 'data/community',
    operation: 'getPublicUserProfile',
  });

  try {
    const service = new CommunityService();

    const result = await service.getUserProfile({
      p_user_slug: slug,
      ...(viewerId ? { p_viewer_id: viewerId } : {}),
    });

    reqLogger.info(
      { hasProfile: Boolean(result), hasViewer: Boolean(viewerId), slug },
      'getPublicUserProfile: fetched successfully'
    );

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'getPublicUserProfile failed');
    reqLogger.error(
      {
        err: normalized,
        slug,
        ...(viewerId ? { viewerId } : {}),
      },
      'getPublicUserProfile failed'
    );
    throw error;
  }
}

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
 * @param input
 * @param input.collectionSlug
 * @param input.userSlug
 * @param input.viewerId
 */
export async function getPublicCollectionDetail(input: {
  collectionSlug: string;
  userSlug: string;
  viewerId?: string;
}): Promise<CollectionDetailData | null> {
  'use cache: private';

  const { collectionSlug, userSlug, viewerId } = input;

  // Configure cache
  cacheLife({ expire: 1800, revalidate: 300, stale: 60 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-collection-${userSlug}-${collectionSlug}`);
  if (viewerId) {
    cacheTag(`user-collection-viewer-${viewerId}`);
  }

  const reqLogger = logger.child({
    module: 'data/community',
    operation: 'getPublicCollectionDetail',
  });

  try {
    const service = new CommunityService();

    const data = await service.getUserCollectionDetail({
      p_collection_slug: collectionSlug,
      p_user_slug: userSlug,
      ...(viewerId ? { p_viewer_id: viewerId } : {}),
    });

    reqLogger.info(
      { collectionSlug, hasData: Boolean(data), hasViewer: Boolean(viewerId), slug: userSlug },
      'getPublicCollectionDetail: fetched successfully'
    );

    return data;
  } catch (error) {
    const normalized = normalizeError(error, 'getPublicCollectionDetail failed');
    reqLogger.error(
      {
        collectionSlug,
        err: normalized,
        slug: userSlug,
        ...(viewerId ? { viewerId } : {}),
      },
      'getPublicCollectionDetail failed'
    );
    throw error;
  }
}
