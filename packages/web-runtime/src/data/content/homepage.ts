'use server';

import type { Database } from '@heyclaude/database-types';
import { cache } from 'react';
import { fetchCached } from '../../cache/fetch-cached.ts';
import { ContentService } from '@heyclaude/data-layer';
import { logger } from '../../logger.ts';
import { normalizeError } from '../../errors.ts';
import { generateRequestId } from '../../utils/request-context.ts';

// OPTIMIZATION: Wrapped with React.cache() for request-level deduplication
// This prevents duplicate calls within the same request (React Server Component tree)
export const getHomepageData = cache(
  async (
    categoryIds: readonly string[]
  ): Promise<Database['public']['Functions']['get_homepage_optimized']['Returns'] | null> => {
    try {
      return await fetchCached(
        (client) => new ContentService(client).getHomepageOptimized({ p_category_ids: [...categoryIds] }),
        {
          // Next.js automatically handles serialization of keyParts array
          keyParts: ['homepage', ...categoryIds],
          tags: ['homepage', 'content', 'trending'],
          ttlKey: 'cache.homepage.ttl_seconds',
          fallback: null,
          logMeta: { categoryIds, categoryCount: categoryIds.length },
        }
      );
    } catch (error) {
      const normalized = normalizeError(error, 'getHomepageData failed');
      logger.error('getHomepageData failed', normalized, {
        requestId: generateRequestId(),
        operation: 'getHomepageData',
        categoryIds,
        categoryCount: categoryIds.length,
      });
      return null;
    }
  }
);
