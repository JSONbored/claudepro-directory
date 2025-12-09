'use server';

import { CommunityService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';

import { logger, pulseUserSearch, searchUsersUnified } from '../index.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';

const DEFAULT_DIRECTORY_LIMIT = 100;

export type CollectionDetailData =
  Database['public']['Functions']['get_user_collection_detail']['Returns'];

/**
 * Get community directory via RPC (cached)
 * Uses 'use cache' to cache directory listings. This data is public and same for all users.
 * Community directory changes periodically, so we use the 'half' cacheLife profile.
 * @param limit
 
 * @returns {unknown} Description of return value*/
async function getCommunityDirectoryRpc(
  limit: number
): Promise<Database['public']['Functions']['get_community_directory']['Returns'] | null> {
  'use cache';

  const { cacheLife, cacheTag } = await import('next/cache');
  const { isBuildTime } = await import('../build-time.ts');
  const { createSupabaseAnonClient } = await import('../supabase/server-anon.ts');

  // Configure cache - use 'half' profile for community directory (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('community');
  cacheTag('users');

  const reqLogger = logger.child({
    operation: 'getCommunityDirectoryRpc',
    module: 'data/community',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new CommunityService(client).getCommunityDirectory({ p_limit: limit });

    reqLogger.info(
      { limit, hasResult: Boolean(result) },
      'getCommunityDirectoryRpc: fetched successfully'
    );

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error({ err: errorForLogging, limit }, 'getCommunityDirectoryRpc failed');
    throw error;
  }
}

export async function getCommunityDirectory(options: {
  limit?: number;
  searchQuery?: string;
}): Promise<Database['public']['Functions']['get_community_directory']['Returns'] | null> {
  const { searchQuery, limit = DEFAULT_DIRECTORY_LIMIT } = options;
  const reqLogger = logger.child({
    operation: 'getCommunityDirectory',
    module: 'data/community',
  });

  if (searchQuery?.trim()) {
    try {
      const unifiedResults = await searchUsersUnified(searchQuery.trim(), limit);

      const allUsers: Database['public']['CompositeTypes']['community_directory_user'][] =
        unifiedResults.map((result) => ({
          id: result.id,
          slug: result.slug,
          name: result.title || result.slug || '',
          image: null,
          bio: result.description || null,
          work: null,
          tier: 'free',
          created_at: result.created_at,
        }));

      // Fire-and-forget: Pulse user search
      pulseUserSearch(searchQuery.trim(), allUsers.length).catch((error) => {
        // logger.error() normalizes errors internally, so pass raw error
        const errorForLogging: Error | string =
          error instanceof Error
            ? error
            : (error instanceof String
              ? error.toString()
              : String(error));
        // Use child logger for callback to maintain isolation
        const callbackLogger = logger.child({
          operation: 'pulseUserSearch',
          module: 'data/community',
        });
        callbackLogger.warn(
          {
            err: errorForLogging,
            searchQuery: searchQuery.trim(),
            resultCount: allUsers.length,
          },
          'Failed to pulse user search'
        );
      });

      return {
        all_users: allUsers,
        top_contributors: [],
        new_members: [],
      };
    } catch (error) {
      // logger.error() normalizes errors internally, so pass raw error
      const errorForLogging: Error | string = error instanceof Error ? error : String(error);
      reqLogger.warn(
        { err: errorForLogging, searchQuery: searchQuery.trim(), limit, fallbackStrategy: 'rpc' },
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
}): Promise<Database['public']['Functions']['get_user_profile']['Returns'] | null> {
  'use cache: private';

  const { slug, viewerId } = input;
  const { cacheLife, cacheTag } = await import('next/cache');

  // Configure cache
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-profile-${slug}`);
  if (viewerId) {
    cacheTag(`user-profile-viewer-${viewerId}`);
  }

  const reqLogger = logger.child({
    operation: 'getPublicUserProfile',
    module: 'data/community',
  });

  try {
    // Can use cookies() inside 'use cache: private'
    const client = await createSupabaseServerClient();
    const service = new CommunityService(client);

    const result = await service.getUserProfile({
      p_user_slug: slug,
      ...(viewerId ? { p_viewer_id: viewerId } : {}),
    });

    reqLogger.info(
      { slug, hasViewer: Boolean(viewerId), hasProfile: Boolean(result) },
      'getPublicUserProfile: fetched successfully'
    );

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error(
      {
        err: errorForLogging,
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

  const { userSlug, collectionSlug, viewerId } = input;
  const { cacheLife, cacheTag } = await import('next/cache');

  // Configure cache
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-collection-${userSlug}-${collectionSlug}`);
  if (viewerId) {
    cacheTag(`user-collection-viewer-${viewerId}`);
  }

  const reqLogger = logger.child({
    operation: 'getPublicCollectionDetail',
    module: 'data/community',
  });

  try {
    // Can use cookies() inside 'use cache: private'
    const client = await createSupabaseServerClient();
    const service = new CommunityService(client);

    const data = await service.getUserCollectionDetail({
      p_user_slug: userSlug,
      p_collection_slug: collectionSlug,
      ...(viewerId ? { p_viewer_id: viewerId } : {}),
    });

    reqLogger.info(
      { slug: userSlug, collectionSlug, hasViewer: Boolean(viewerId), hasData: Boolean(data) },
      'getPublicCollectionDetail: fetched successfully'
    );

    return data;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error(
      {
        err: errorForLogging,
        slug: userSlug,
        collectionSlug,
        ...(viewerId ? { viewerId } : {}),
      },
      'getPublicCollectionDetail failed'
    );
    throw error;
  }
}
