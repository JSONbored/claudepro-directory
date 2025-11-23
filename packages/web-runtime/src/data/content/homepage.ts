'use server';

import type { Database } from '@heyclaude/database-types';
import { logger } from '../../logger.ts';
import { normalizeError } from '../../errors.ts';
import { fetchCached } from '../../cache/fetch-cached.ts';
import { ContentService } from '@heyclaude/data-layer';

export async function getHomepageData(
  categoryIds: readonly string[]
): Promise<Database['public']['Functions']['get_homepage_complete']['Returns'] | null> {
  try {
    return await fetchCached(
      (client) => new ContentService(client).getHomepageComplete([...categoryIds]),
      {
        key: categoryIds.join('-') || 'all',
        tags: ['homepage', 'content', 'trending'],
        ttlKey: 'cache.homepage.ttl_seconds',
        fallback: null,
        logMeta: { categoryIds, categoryCount: categoryIds.length },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load homepage data');
    logger.error('getHomepageData failed', normalized, {
      categoryIds,
      categoryCount: categoryIds.length,
    });
    throw normalized;
  }
}
