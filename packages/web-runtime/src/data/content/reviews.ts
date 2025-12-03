'use server';

import { ContentService } from '@heyclaude/data-layer';
import  { type Database } from '@heyclaude/database-types';

import { fetchCached } from '../../cache/fetch-cached.ts';

interface ReviewsWithStatsParameters {
  contentSlug: string;
  contentType: Database['public']['Enums']['content_category'];
  limit?: number;
  offset?: number;
  sortBy?: string;
  userId?: string;
}

export async function getReviewsWithStatsData(
  parameters: ReviewsWithStatsParameters
): Promise<Database['public']['Functions']['get_reviews_with_stats']['Returns'] | null> {
  const { contentType, contentSlug, sortBy, limit, offset, userId } = parameters;

  const result = await fetchCached<
    Database['public']['Functions']['get_reviews_with_stats']['Returns']
  >(
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
      ttlKey: 'user_reviews',
      useAuth: true,
      fallback: {
        reviews: null,
        has_more: null,
        total_count: null,
        aggregate_rating: null,
      },
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

  // Return null if no reviews (not found or empty)
  if (!result.reviews || result.reviews.length === 0) return null;
  return result;
}
