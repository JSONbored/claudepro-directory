'use server';

import type { Database } from '@heyclaude/database-types';
import { generateContentCacheKey } from '../content-helpers.ts';
import { fetchCached } from '../../cache/fetch-cached.ts';
import { ContentService } from '@heyclaude/data-layer';

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
): Promise<Database['public']['Functions']['get_reviews_with_stats']['Returns'] | null> {
  const { contentType, contentSlug, sortBy, limit, offset, userId } = params;

  return fetchCached(
    (client) => new ContentService(client).getReviewsWithStats({
        contentType,
        contentSlug,
        ...(sortBy ? { sortBy } : {}),
        ...(limit ? { limit } : {}),
        ...(offset ? { offset } : {}),
        ...(userId ? { userId } : {})
    }),
    {
      key: `${generateContentCacheKey(contentType, contentSlug, limit, offset)}-${sortBy ?? 'default'}-${userId ?? 'anon'}`,
      tags: ['content', `content-${contentSlug}`, 'reviews'],
      ttlKey: 'cache.user_reviews.ttl_seconds',
      useAuth: true,
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
