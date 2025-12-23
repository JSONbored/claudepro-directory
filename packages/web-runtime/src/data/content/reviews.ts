import 'server-only';
import { type GetReviewsWithStatsReturns } from '@heyclaude/database-types/postgres-types';
import { type content_category } from '@prisma/client';

import { createDataFunction } from '../cached-data-factory.ts';

export interface ReviewsWithStatsParameters {
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
 */
export const getReviewsWithStatsData = createDataFunction<
  ReviewsWithStatsParameters,
  GetReviewsWithStatsReturns | null
>({
  logContext: (params) => ({
    contentSlug: params.contentSlug,
    contentType: params.contentType,
    hasUser: Boolean(params.userId),
  }),
  methodName: 'getReviewsWithStats',
  module: 'data/content/reviews',
  operation: 'getReviewsWithStatsData',
  serviceKey: 'content',
  transformArgs: (params) => ({
    p_content_slug: params.contentSlug,
    p_content_type: params.contentType,
    ...(params.sortBy ? { p_sort_by: params.sortBy } : {}),
    ...(params.limit ? { p_limit: params.limit } : {}),
    ...(params.offset ? { p_offset: params.offset } : {}),
    ...(params.userId ? { p_user_id: params.userId } : {}),
  }),
});
