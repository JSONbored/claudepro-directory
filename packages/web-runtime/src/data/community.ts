'use server';

import type { Database } from '@heyclaude/database-types';
import {
  logger,
  normalizeError,
  pulseUserSearch,
  searchUsersUnified,
} from '../index.ts';
import { fetchCached } from '../cache/fetch-cached.ts';
import { CommunityService } from '@heyclaude/data-layer';
import { generateRequestId } from '../utils/request-context.ts';

const DEFAULT_DIRECTORY_LIMIT = 100;

export type CollectionDetailData =
  Database['public']['Functions']['get_user_collection_detail']['Returns'];

export async function getCommunityDirectory(options: {
  searchQuery?: string;
  limit?: number;
}): Promise<Database['public']['Functions']['get_community_directory']['Returns'] | null> {
  const { searchQuery, limit = DEFAULT_DIRECTORY_LIMIT } = options;

  if (searchQuery?.trim()) {
    const { trackPerformance } = await import('../utils/performance-metrics');
    
    try {
      const { result: unifiedResults } = await trackPerformance(
        async () => {
          return await searchUsersUnified(searchQuery.trim(), limit);
        },
        {
          operation: 'getCommunityDirectory-search',
          logMeta: { query: searchQuery.trim(), limit },
          logLevel: 'info',
        }
      );

      const allUsers: Database['public']['CompositeTypes']['community_directory_user'][] =
        unifiedResults
          .filter(
            (
              result
            ): result is typeof result & {
              slug: string;
              created_at: string;
            } => result.slug != null && result.created_at != null
          )
          .map((result) => ({
            id: result.id,
            slug: result.slug,
            name: result.title || result.slug || '',
            image: null,
            bio: result.description || null,
            work: null,
            tier: 'free',
            created_at: result.created_at,
          }));

      pulseUserSearch(searchQuery.trim(), allUsers.length).catch((error) => {
        const normalized = normalizeError(error, 'Failed to pulse user search');
        logger.warn('Failed to pulse user search', undefined, {
          requestId: generateRequestId(),
          operation: 'pulseUserSearch',
          error: normalized.message,
        });
      });

      return {
        all_users: allUsers,
        top_contributors: [],
        new_members: [],
      };
    } catch (error) {
      // trackPerformance already logs the error with performance metrics
      // Fall through to RPC fallback
    }
  }

  return fetchCached(
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
}

export async function getPublicUserProfile(input: {
  slug: string;
  viewerId?: string;
}): Promise<Database['public']['Functions']['get_user_profile']['Returns'] | null> {
  const { slug, viewerId } = input;

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
    logger.error('getPublicUserProfile failed', normalized, {
      requestId: generateRequestId(),
      operation: 'getPublicUserProfile',
      slug,
      ...(viewerId ? { viewerId } : {}),
    });
    throw normalized;
  }
}

export async function getPublicCollectionDetail(input: {
  userSlug: string;
  collectionSlug: string;
  viewerId?: string;
}): Promise<CollectionDetailData | null> {
  const { userSlug, collectionSlug, viewerId } = input;

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
        tags: ['collections', `collection-${collectionSlug}`, `user-${userSlug}`],
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
      logger.warn('getPublicCollectionDetail: RPC returned null', undefined, {
        requestId: generateRequestId(),
        operation: 'getPublicCollectionDetail',
        slug: userSlug,
        collectionSlug,
        ...(viewerId ? { viewerId } : {}),
      });
      return null;
    }

    return data;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user collection detail');
    logger.error('getPublicCollectionDetail failed', normalized, {
      requestId: generateRequestId(),
      operation: 'getPublicCollectionDetail',
      slug: userSlug,
      collectionSlug,
      ...(viewerId ? { viewerId } : {}),
    });
    throw normalized;
  }
}
