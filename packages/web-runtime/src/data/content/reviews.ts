'use server';

import { ContentService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cache } from 'react';

import { logger, normalizeError } from '../../index.ts';
import { createSupabaseServerClient } from '../../supabase/server.ts';
import { generateRequestId } from '../../utils/request-id.ts';

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
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because:
 * 1. Reviews are user-specific and require cookies() for auth when userId is provided
 * 2. cookies() cannot be called inside unstable_cache() (Next.js restriction)
 *
 * React.cache() provides request-level deduplication within the same React Server Component tree,
 * which is safe and appropriate for user-specific data.
 */
export const getReviewsWithStatsData = cache(
  async (
    parameters: ReviewsWithStatsParameters
  ): Promise<Database['public']['Functions']['get_reviews_with_stats']['Returns'] | null> => {
    const { contentType, contentSlug, sortBy, limit, offset, userId } = parameters;
    const requestId = generateRequestId();
    const reqLogger = logger.child({
      requestId,
      operation: 'getReviewsWithStatsData',
      module: 'data/content/reviews',
    });

    try {
      // Create authenticated client OUTSIDE of any cache scope
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

      reqLogger.info('getReviewsWithStatsData: fetched successfully', {
        contentType,
        contentSlug,
        hasUser: Boolean(userId),
        hasResult: Boolean(result),
      });

      return result;
    } catch (error) {
      const normalized = normalizeError(error, 'getReviewsWithStatsData failed');
      reqLogger.error('getReviewsWithStatsData: unexpected error', normalized, {
        contentType,
        contentSlug,
        hasUser: Boolean(userId),
      });
      return null;
    }
  }
);
