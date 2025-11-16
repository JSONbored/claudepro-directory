'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { searchUsersUnified } from '@/src/lib/edge/search-client';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { GetCommunityDirectoryReturn, Tables } from '@/src/types/database-overrides';

export async function getCommunityDirectory(options: {
  searchQuery?: string;
  limit?: number;
}): Promise<GetCommunityDirectoryReturn | null> {
  const { searchQuery, limit = 100 } = options;

  // Hybrid approach:
  // - If search query provided → use unified-search (analytics + edge cache)
  // - If no query → use optimized RPC (structured directory data)
  if (searchQuery?.trim()) {
    try {
      // Use unified-search for search queries
      const unifiedResults = await searchUsersUnified(searchQuery.trim(), limit);

      // Transform unified-search results to directory format
      // Note: unified-search returns basic fields, we need to fetch full user data
      // For now, we'll use the basic fields and let the UI handle it
      const allUsers = unifiedResults.map((result) => ({
        id: result.id,
        slug: result.slug,
        name: result.title || result.slug || '',
        image: null, // unified-search doesn't return image
        bio: result.description || null,
        work: null, // unified-search doesn't return work
        tier: null, // unified-search doesn't return tier
        created_at: result.created_at,
      })) as Array<Tables<'users'>>;

      // Track search analytics (fire and forget)
      trackUserSearchAnalytics(searchQuery.trim(), allUsers.length).catch((error) => {
        logger.warn('Failed to track user search analytics', {
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
  return fetchCachedRpc<'get_community_directory', GetCommunityDirectoryReturn | null>(
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

/**
 * Track user search analytics - Queue-Based
 * Enqueues to pulse queue for batched processing (98% egress reduction)
 * Fire and forget - non-blocking
 */
async function trackUserSearchAnalytics(query: string, resultCount: number): Promise<void> {
  if (!query.trim()) return;

  try {
    const supabase = await createClient();

    // Get current user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Enqueue to queue instead of direct insert
    const { enqueuePulseEvent } = await import('@/src/lib/utils/pulse');
    await enqueuePulseEvent({
      user_id: user?.id ?? null,
      content_type: null,
      content_slug: null,
      interaction_type: 'search',
      session_id: null,
      metadata: {
        query: query.trim(),
        filters: { entity: 'user' }, // Mark as user search
        result_count: resultCount,
      },
    });
  } catch (error) {
    // Silently fail - analytics should never block search
    logger.warn('User search analytics tracking error', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
