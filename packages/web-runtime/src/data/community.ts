'use server';

import { CommunityService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cache } from 'react';

import { fetchCached } from '../cache/fetch-cached.ts';
import { logger, normalizeError, pulseUserSearch, searchUsersUnified } from '../index.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';
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
      const normalized = normalizeError(
        error,
        'Community directory search failed, falling back to RPC'
      );
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

/**
 * Get public user profile
 *
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because:
 * 1. User profiles require cookies() for auth when viewerId is provided
 * 2. cookies() cannot be called inside unstable_cache() (Next.js restriction)
 * 3. User-specific data should not be cached across requests anyway
 *
 * React.cache() provides request-level deduplication within the same React Server Component tree,
 * which is safe and appropriate for user-specific data.
 */
export const getPublicUserProfile = cache(
  async (input: {
    slug: string;
    viewerId?: string;
  }): Promise<Database['public']['Functions']['get_user_profile']['Returns'] | null> => {
    const { slug, viewerId } = input;
    const requestId = generateRequestId();
    const reqLogger = logger.child({
      requestId,
      operation: 'getPublicUserProfile',
      module: 'data/community',
    });

    try {
      // Create authenticated client OUTSIDE of any cache scope
      // This is safe because React.cache() only deduplicates within the same request
      const client = await createSupabaseServerClient();
      const service = new CommunityService(client);

      const result = await service.getUserProfile({
        p_user_slug: slug,
        ...(viewerId ? { p_viewer_id: viewerId } : {}),
      });

      reqLogger.info('getPublicUserProfile: fetched successfully', {
        slug,
        hasViewer: Boolean(viewerId),
        hasProfile: Boolean(result),
      });

      return result;
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to load user profile detail');
      reqLogger.error('getPublicUserProfile failed', normalized, {
        slug,
        ...(viewerId ? { viewerId } : {}),
      });
      throw normalized;
    }
  }
);

/**
 * Get public collection detail
 *
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because:
 * 1. Collection details require cookies() for auth when viewerId is provided
 * 2. cookies() cannot be called inside unstable_cache() (Next.js restriction)
 * 3. User-specific data should not be cached across requests anyway
 *
 * React.cache() provides request-level deduplication within the same React Server Component tree,
 * which is safe and appropriate for user-specific data.
 */
export const getPublicCollectionDetail = cache(
  async (input: {
    collectionSlug: string;
    userSlug: string;
    viewerId?: string;
  }): Promise<CollectionDetailData | null> => {
    const { userSlug, collectionSlug, viewerId } = input;
    const requestId = generateRequestId();
    const reqLogger = logger.child({
      requestId,
      operation: 'getPublicCollectionDetail',
      module: 'data/community',
    });

    try {
      // Create authenticated client OUTSIDE of any cache scope
      // This is safe because React.cache() only deduplicates within the same request
      const client = await createSupabaseServerClient();
      const service = new CommunityService(client);

      const data = await service.getUserCollectionDetail({
        p_user_slug: userSlug,
        p_collection_slug: collectionSlug,
        ...(viewerId ? { p_viewer_id: viewerId } : {}),
      });

      reqLogger.info('getPublicCollectionDetail: fetched successfully', {
        slug: userSlug,
        collectionSlug,
        hasViewer: Boolean(viewerId),
        hasData: Boolean(data),
      });

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
);
