'use server';

import { ContentService } from '@heyclaude/data-layer';
import { type content_category } from '@heyclaude/data-layer/prisma';
import type { GetSimilarContentReturns } from '@heyclaude/database-types/postgres-types/functions';
import { cacheLife, cacheTag } from 'next/cache';

import { normalizeError } from '../../errors.ts';
import { logger } from '../../logger.ts';

/**
 * Get similar content
 * Uses 'use cache' to cache similar content. This data is public and same for all users.
 * Similar content changes periodically, so we use the 'hours' cacheLife profile.
 * @param input
 * @param input.contentSlug
 * @param input.contentType
 * @param input.limit
 */
export async function getSimilarContent(input: {
  contentSlug: string;
  contentType: content_category;
  limit?: number;
}): Promise<GetSimilarContentReturns | null> {
  'use cache';

  const { contentSlug, contentType, limit = 6 } = input;

  // Configure cache - use 'hours' profile for similar content
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  cacheTag('content');
  cacheTag('similar');
  cacheTag(`content-${contentSlug}`);

  const reqLogger = logger.child({
    module: 'data/content/similar',
    operation: 'getSimilarContent',
  });

  try {
    const service = new ContentService();
    const result = await service.getSimilarContent({
      p_content_slug: contentSlug,
      p_content_type: contentType,
      p_limit: limit,
    });

    reqLogger.info(
      { contentSlug, contentType, hasResult: Boolean(result), limit },
      'getSimilarContent: fetched successfully'
    );

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'getSimilarContent failed');
    reqLogger.error(
      { contentSlug, contentType, err: normalized, limit },
      'getSimilarContent: failed'
    );
    return null;
  }
}
