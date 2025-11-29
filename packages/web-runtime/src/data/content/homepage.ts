'use server';

import { ContentService } from '@heyclaude/data-layer';
import  { type Database } from '@heyclaude/database-types';
import { cache } from 'react';

import { fetchCached } from '../../cache/fetch-cached.ts';
import { normalizeError } from '../../errors.ts';
import { logger } from '../../logger.ts';
import { generateRequestId } from '../../utils/request-id.ts';

// OPTIMIZATION: Wrapped with React.cache() for request-level deduplication
// This prevents duplicate calls within the same request (React Server Component tree)
export const getHomepageData = cache(
  async (
    categoryIds: readonly string[]
  ): Promise<Database['public']['Functions']['get_homepage_optimized']['Returns'] | null> => {
    // Create request-scoped child logger to avoid race conditions
    const requestId = generateRequestId();
    const reqLogger = logger.child({
      requestId,
      operation: 'getHomepageData',
      route: 'utility-function', // Utility function - no specific route
      module: 'packages/web-runtime/src/data/content/homepage',
    });

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
      reqLogger.error('getHomepageData failed', normalized, {
        categoryIds,
        categoryCount: categoryIds.length,
      });
      return null;
    }
  }
);
