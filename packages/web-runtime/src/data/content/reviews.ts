'use server';

import { ContentService } from '@heyclaude/data-layer';
import { type content_category } from '@heyclaude/data-layer/prisma';
import type { GetReviewsWithStatsReturns } from '@heyclaude/database-types/postgres-types/functions';
import { cacheLife, cacheTag } from 'next/cache';

import { normalizeError } from '../../errors.ts';
import { logger } from '../../index.ts';

interface ReviewsWithStatsParameters {
  contentSlug: string;
  contentType: content_category;
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
): Promise<GetReviewsWithStatsReturns | null> {
  'use cache: private';

  const { contentSlug, contentType, limit, offset, sortBy, userId } = parameters;

  // Configure cache
  cacheLife({ expire: 1800, revalidate: 300, stale: 60 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`reviews-${contentType}-${contentSlug}`);
  if (userId) {
    cacheTag(`reviews-user-${userId}`);
  }

  const reqLogger = logger.child({
    module: 'data/content/reviews',
    operation: 'getReviewsWithStatsData',
  });

  try {
    const service = new ContentService();

    const result = await service.getReviewsWithStats({
      p_content_slug: contentSlug,
      p_content_type: contentType,
      ...(sortBy ? { p_sort_by: sortBy } : {}),
      ...(limit ? { p_limit: limit } : {}),
      ...(offset ? { p_offset: offset } : {}),
      ...(userId ? { p_user_id: userId } : {}),
    });

    reqLogger.info(
      { contentSlug, contentType, hasResult: Boolean(result), hasUser: Boolean(userId) },
      'getReviewsWithStatsData: fetched successfully'
    );

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'getReviewsWithStatsData failed');
    reqLogger.error(
      { contentSlug, contentType, err: normalized, hasUser: Boolean(userId) },
      'getReviewsWithStatsData: unexpected error'
    );
    return null;
  }
}
