'use server';

import { ContentService } from '@heyclaude/data-layer';
import type { Database } from '@heyclaude/database-types';

import { fetchCached } from '../../cache/fetch-cached.ts';

interface ReviewsWithStatsParameters {
  contentType: Database['public']['Enums']['content_category'];
  contentSlug: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
  userId?: string;
}

export async function getReviewsWithStatsData(
  parameters: ReviewsWithStatsParameters
): Promise<Database['public']['Functions']['get_reviews_with_stats']['Returns'] | null> {
  const { contentType, contentSlug, sortBy, limit, offset, userId } = parameters;

  return fetchCached(
    (client) => new ContentService(client).getReviewsWithStats({
        p_content_type: contentType,
        p_content_slug: contentSlug,
        ...(sortBy ? { p_sort_by: sortBy } : {}),
        ...(limit ? { p_limit: limit } : {}),
        ...(offset ? { p_offset: offset } : {}),
        ...(userId ? { p_user_id: userId } : {})
    }),
    {
      // Next.js automatically handles serialization of keyParts array
      keyParts: [
        'reviews',
        contentType,
        contentSlug,
        sortBy ?? 'default',
        limit ?? 0,
        offset ?? 0,
        userId ?? 'anon',
      ],
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
