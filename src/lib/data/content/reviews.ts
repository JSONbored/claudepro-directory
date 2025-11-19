'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { generateContentCacheKey } from '@/src/lib/data/helpers-utils';
import type { Database } from '@/src/types/database.types';
import type { GetGetReviewsWithStatsReturn } from '@/src/types/database-overrides';

interface ReviewsWithStatsParams {
  contentType: Database['public']['Enums']['content_category'];
  contentSlug: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
  userId?: string;
}

export async function getReviewsWithStatsData(
  params: ReviewsWithStatsParams
): Promise<GetGetReviewsWithStatsReturn | null> {
  const { contentType, contentSlug, sortBy, limit, offset, userId } = params;

  return fetchCachedRpc<'get_reviews_with_stats', GetGetReviewsWithStatsReturn | null>(
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
      keySuffix: `${generateContentCacheKey(contentType, contentSlug, limit, offset)}-${sortBy ?? 'default'}-${userId ?? 'anon'}`,
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
