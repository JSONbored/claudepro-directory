'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { GetReviewsWithStatsReturn } from '@/src/types/database-overrides';

interface ReviewsWithStatsParams {
  contentType: string;
  contentSlug: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
  userId?: string;
}

export async function getReviewsWithStatsData(
  params: ReviewsWithStatsParams
): Promise<GetReviewsWithStatsReturn | null> {
  const { contentType, contentSlug, sortBy, limit, offset, userId } = params;

  return fetchCachedRpc<GetReviewsWithStatsReturn | null>(
    {
      p_content_type: contentType,
      p_content_slug: contentSlug,
      ...(sortBy ? { p_sort_by: sortBy } : {}),
      ...(typeof offset === 'number' ? { p_offset: offset } : {}),
      ...(typeof limit === 'number' ? { p_limit: limit } : {}),
      ...(userId ? { p_user_id: userId } : {}),
    },
    {
      rpcName: 'get_reviews_with_stats',
      tags: ['content', `content-${contentSlug}`, 'reviews'],
      ttlKey: 'cache.user_reviews.ttl_seconds',
      keySuffix: `${contentType}-${contentSlug}-${sortBy ?? 'default'}-${limit ?? 'all'}-${
        offset ?? 0
      }-${userId ?? 'anon'}`,
      useAuthClient: true,
      fallback: null,
      logMeta: {
        contentType,
        contentSlug,
        hasSort: Boolean(sortBy),
        ...(typeof limit === 'number' ? { limit } : {}),
        ...(typeof offset === 'number' ? { offset } : {}),
        hasUser: Boolean(userId),
      },
    }
  );
}
