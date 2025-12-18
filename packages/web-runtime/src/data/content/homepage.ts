'use server';

import { type GetHomepageOptimizedReturns } from '@heyclaude/database-types/postgres-types';

import { createCachedDataFunction, generateResourceTags } from '../cached-data-factory.ts';

/**
 * Get homepage data
 * Uses 'use cache' to cache homepage data. This data is public and same for all users.
 */
export const getHomepageData = createCachedDataFunction<
  readonly string[],
  GetHomepageOptimizedReturns | null
>({
  serviceKey: 'content',
  methodName: 'getHomepageOptimized',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: () => generateResourceTags('homepage', undefined, ['content', 'trending']),
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
