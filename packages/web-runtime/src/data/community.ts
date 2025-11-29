'use server';

import { CommunityService } from '@heyclaude/data-layer';
import { Constants, type Database } from '@heyclaude/database-types';

import { fetchCached } from '../cache/fetch-cached.ts';
import {
  logger,
  normalizeError,
  pulseUserSearch,
  searchUsersUnified,
} from '../index.ts';
import { generateRequestId } from '../utils/request-id.ts';

const DEFAULT_DIRECTORY_LIMIT = 100;

export type CollectionDetailData =
  Database['public']['Functions']['get_user_collection_detail']['Returns'];

export async function getCommunityDirectory(options: {
  limit?: number;
  searchQuery?: string;
}): Promise<Database['public']['Functions']['get_community_directory']['Returns'] | null> {
  const { searchQuery, limit = DEFAULT_DIRECTORY_LIMIT } = options;
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getCommunityDirectory',
    module: 'data/community',
  });

  if (searchQuery?.trim()) {
    const { trackPerformance } = await import('../utils/performance-metrics');
    
    try {
      const { result: unifiedResults } = await trackPerformance(
        async () => {
          return await searchUsersUnified(searchQuery.trim(), limit);
        },
        {
          operation: 'getCommunityDirectory-search',
          logger: reqLogger, // Use child logger to avoid passing requestId/operation repeatedly
          requestId, // Pass requestId for return value
          logMeta: { query: searchQuery.trim(), limit },
          logLevel: 'info',
        }
      );

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

      // Fire-and-forget: Generate explicit requestId for traceability in async callback
      const callbackRequestId = generateRequestId();
      pulseUserSearch(searchQuery.trim(), allUsers.length).catch((error) => {
        const normalized = normalizeError(error, 'Failed to pulse user search');
        // Use child logger for callback to maintain isolation
        const callbackLogger = logger.child({
          requestId: callbackRequestId,
          operation: 'pulseUserSearch',
          module: 'data/community',
        });
        callbackLogger.warn('Failed to pulse user search', {
          err: normalized,
          searchQuery: searchQuery.trim(),
          resultCount: allUsers.length,
        });
      });

      return {
        all_users: allUsers,
        top_contributors: [],
        new_members: [],
      };
    } catch (error) {
      // trackPerformance already logs the error, but we log again with context about fallback behavior
      const normalized = normalizeError(error, 'Community directory search failed, falling back to RPC');
      reqLogger.warn('Community directory search failed, using RPC fallback', {
        err: normalized,
        searchQuery: searchQuery.trim(),
        limit,
        fallbackStrategy: 'rpc',
      });
      // Fall through to RPC fallback
    }
  }

  try {
    return await fetchCached(
      (client) => new CommunityService(client).getCommunityDirectory({ p_limit: limit }),
      {
        keyParts: ['community-directory', 'all', limit],
        tags: ['community', 'users'],
        ttlKey: 'cache.community.ttl_seconds',
        useAuth: false,
        fallback: null,
        logMeta: {
          hasQuery: Boolean(searchQuery?.trim()),
          limit,
        },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to get community directory');
    reqLogger.error('getCommunityDirectory failed', normalized, {
      hasQuery: Boolean(searchQuery?.trim()),
      limit,
    });
    throw normalized;
  }
}

export async function getPublicUserProfile(input: {
  slug: string;
  viewerId?: string;
}): Promise<Database['public']['Functions']['get_user_profile']['Returns'] | null> {
  const { slug, viewerId } = input;
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getPublicUserProfile',
    module: 'data/community',
  });

  try {
    return await fetchCached(
      (client) => new CommunityService(client).getUserProfile({
        p_user_slug: slug,
        ...(viewerId ? { p_viewer_id: viewerId } : {})
      }),
      {
        keyParts: viewerId ? ['user-profile', slug, 'viewer', viewerId] : ['user-profile', slug],
        tags: ['users', `user-${slug}`],
        ttlKey: 'cache.user_profile.ttl_seconds',
        useAuth: true,
        fallback: null,
        logMeta: { slug, hasViewer: Boolean(viewerId) },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user profile detail');
    reqLogger.error('getPublicUserProfile failed', normalized, {
      slug,
      ...(viewerId ? { viewerId } : {}),
    });
    throw normalized;
  }
}

export async function getPublicCollectionDetail(input: {
  collectionSlug: string;
  userSlug: string;
  viewerId?: string;
}): Promise<CollectionDetailData | null> {
  const { userSlug, collectionSlug, viewerId } = input;
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getPublicCollectionDetail',
    module: 'data/community',
  });

  try {
    const data = await fetchCached(
      (client) => new CommunityService(client).getUserCollectionDetail({
        p_user_slug: userSlug,
        p_collection_slug: collectionSlug,
        ...(viewerId ? { p_viewer_id: viewerId } : {})
      }),
      {
        keyParts: viewerId
          ? ['collection-detail', userSlug, collectionSlug, 'viewer', viewerId]
          : ['collection-detail', userSlug, collectionSlug],
        tags: [Constants.public.Enums.content_category[7] as string, `collection-${collectionSlug}`, `user-${userSlug}`], // 'collections'
        ttlKey: 'cache.content_list.ttl_seconds',
        useAuth: true,
        fallback: null,
        logMeta: {
          slug: userSlug,
          collectionSlug,
          hasViewer: Boolean(viewerId),
        },
      }
    );

    if (!data) {
      reqLogger.warn('getPublicCollectionDetail: RPC returned null', {
        slug: userSlug,
        collectionSlug,
        ...(viewerId ? { viewerId } : {}),
      });
      return null;
    }

    return data;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user collection detail');
    reqLogger.error('getPublicCollectionDetail failed', normalized, {
      slug: userSlug,
      collectionSlug,
      ...(viewerId ? { viewerId } : {}),
    });
    throw normalized;
  }
}
