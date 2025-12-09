'use server';

import { ContentService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../../index.ts';
import { createSupabaseServerClient } from '../../supabase/server.ts';

interface ReviewsWithStatsParameters {
  contentSlug: string;
  contentType: Database['public']['Enums']['content_category'];
  limit?: number;
  offset?: number;
  sortBy?: string;
  userId?: string;
}

/**
 * Get reviews with stats
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope when userId is provided,
 * while still providing per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Cache keys include all input parameters
 * - Not prerendered (runs at request time)
 * @param parameters
 */
export async function getReviewsWithStatsData(
  parameters: ReviewsWithStatsParameters
): Promise<Database['public']['Functions']['get_reviews_with_stats']['Returns'] | null> {
  'use cache: private';

  const { contentType, contentSlug, sortBy, limit, offset, userId } = parameters;

  // Configure cache
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`reviews-${contentType}-${contentSlug}`);
  if (userId) {
    cacheTag(`reviews-user-${userId}`);
  }

  const reqLogger = logger.child({
    operation: 'getReviewsWithStatsData',
    module: 'data/content/reviews',
  });

  try {
    // Can use cookies() inside 'use cache: private'
    const client = await createSupabaseServerClient();
    const service = new ContentService(client);

    const result = await service.getReviewsWithStats({
      p_content_type: contentType,
      p_content_slug: contentSlug,
      ...(sortBy ? { p_sort_by: sortBy } : {}),
      ...(limit ? { p_limit: limit } : {}),
      ...(offset ? { p_offset: offset } : {}),
      ...(userId ? { p_user_id: userId } : {}),
    });

    reqLogger.info(
      { contentType, contentSlug, hasUser: Boolean(userId), hasResult: Boolean(result) },
      'getReviewsWithStatsData: fetched successfully'
    );

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error(
      { err: errorForLogging, contentType, contentSlug, hasUser: Boolean(userId) },
      'getReviewsWithStatsData: unexpected error'
    );
    return null;
  }
}
