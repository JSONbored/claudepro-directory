'use server';

import { ContentService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
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
      // CRITICAL: Use sorted, joined string for cache key to ensure stability
      // The categoryIds array order might vary, so we sort and join to create a stable key
      // This prevents cache misses due to array order differences
      const sortedCategoryIds = [...categoryIds].toSorted().join(',');

      return await fetchCached(
        (client) =>
          new ContentService(client).getHomepageOptimized({
            p_category_ids: [...categoryIds],
            p_limit: 6, // 6 items per category for featured sections (8 categories × 6 = 48 items total)
          }),
        {
          // Use stable string key instead of array to prevent cache key variations
          keyParts: ['homepage', sortedCategoryIds],
          tags: ['homepage', 'content', 'trending'],
          ttlKey: 'cache.homepage.ttl_seconds',
          fallback: null,
          logMeta: { categoryIds: sortedCategoryIds, categoryCount: categoryIds.length, limit: 6 },
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
