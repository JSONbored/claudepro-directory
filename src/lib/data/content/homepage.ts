'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

export async function getHomepageData(
  categoryIds: readonly string[]
): Promise<Database['public']['Functions']['get_homepage_complete']['Returns'] | null> {
  try {
    return fetchCachedRpc<
      'get_homepage_complete',
      Database['public']['Functions']['get_homepage_complete']['Returns'] | null
    >(
      {
        p_category_ids: [...categoryIds],
      },
      {
        rpcName: 'get_homepage_complete',
        tags: ['homepage', 'content', 'trending'],
        ttlKey: 'cache.homepage.ttl_seconds',
        keySuffix: categoryIds.join('-') || 'all',
        fallback: null,
        logMeta: { categoryCount: categoryIds.length },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load homepage data');
    logger.error('getHomepageData failed', normalized, {
      categoryCount: categoryIds.length,
    });
    throw normalized;
  }
}
