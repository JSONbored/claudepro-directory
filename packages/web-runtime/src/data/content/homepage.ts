import 'server-only';

import { type GetHomepageOptimizedReturns } from '@heyclaude/database-types/postgres-types';

import { createDataFunction } from '../cached-data-factory.ts';

/**
 * Get homepage data
 * Simple data fetching function - pages control caching with 'use cache' directive
 */
export const getHomepageData = createDataFunction<
  readonly string[],
  GetHomepageOptimizedReturns | null
>({
  serviceKey: 'content',
  methodName: 'getHomepageOptimized',
  module: 'data/content/homepage',
  operation: 'getHomepageData',
  transformArgs: (categoryIds) => ({
    p_category_ids: [...categoryIds],
    p_limit: 6, // 6 items per category for featured sections (8 categories × 6 = 48 items total)
  }),
  logContext: (categoryIds) => {
    // CRITICAL: Use sorted, joined string for cache key to ensure stability
    // The categoryIds array order might vary, so we sort and join to create a stable key
    const sortedCategoryIds = [...categoryIds].toSorted().join(',');
    return {
      categoryCount: categoryIds.length,
      categoryIds: sortedCategoryIds,
      limit: 6,
    };
  },
});
