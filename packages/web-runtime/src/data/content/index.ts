import 'server-only';

import { Prisma } from '@prisma/client';
import type { content_category } from '@prisma/client';
type contentModel = Prisma.contentGetPayload<{}>;
import {
  type GetPopularContentReturns,
  type GetTrendingContentReturns,
  type GetTrendingMetricsWithContentReturns,
} from '@heyclaude/database-types/postgres-types';

// EnrichedContentItem was removed - use contentModel instead
type EnrichedContentItem = contentModel;
import { normalizeError } from '@heyclaude/shared-runtime';

import { logger } from '../../logger.ts';
import { createDataFunction } from '../cached-data-factory.ts';
import { QUERY_LIMITS } from '../config/constants.ts';
import { getService } from '../service-factory.ts';

/**
 * Get content by category
 * Simple data fetching function - pages control caching with 'use cache' directive
 */
export const getContentByCategory = createDataFunction<content_category, EnrichedContentItem[]>({
  logContext: (category, result) => ({
    category,
    count: Array.isArray(result) ? result.length : 0,
    dbCall: true,
  }),
  methodName: 'getEnrichedContentList',
  module: 'data/content/index',
  onError: () => [], // Return empty array on error
  operation: 'getContentByCategory',
  serviceKey: 'content',
  transformArgs: (category) => ({
    p_category: category,
    p_limit: QUERY_LIMITS.content.default,
    p_offset: 0,
  }),
});

/**
 * Get content by slug
 * Simple data fetching function - pages control caching with 'use cache' directive
 */
export const getContentBySlug = createDataFunction<
  { category: content_category; slug: string },
  EnrichedContentItem | null
>({
  logContext: (args) => ({
    category: args.category,
    slug: args.slug,
  }),
  methodName: 'getEnrichedContentList',
  module: 'data/content/index',
  operation: 'getContentBySlug',
  serviceKey: 'content',
  transformArgs: (args) => ({
    p_category: args.category,
    p_limit: 1,
    p_offset: 0,
    p_slugs: [args.slug],
  }),
  transformResult: (result) => {
    const data = result as EnrichedContentItem[];
    return data[0] ?? null;
  },
});

/***
 *
 * Group items by category for efficient batch fetching
 * @param {Array<{ category: content_category; slug: string }>} items
 * @returns {Map<content_category, string[]>} Return value description
 * @param {Array<{ category: content_category; slug: string }>} items Parameter description
 * @param {Array<{ category: content_category; slug: string }>} items Parameter description
 * @param {Array<{ category: content_category; slug: string }>} items Parameter description
 * @param {Array<{ category: content_category; slug: string }>} items Parameter description
 */
function groupItemsByCategory(
  items: Array<{ category: content_category; slug: string }>
): Map<content_category, string[]> {
  const itemsByCategory = new Map<content_category, string[]>();
  for (const item of items) {
    const slugs = itemsByCategory.get(item.category) ?? [];
    slugs.push(item.slug);
    itemsByCategory.set(item.category, slugs);
  }
  return itemsByCategory;
}

/**
 * Batch fetch content items by slugs (optimized for collections)
 * Simple data fetching function - pages control caching with 'use cache' directive
 * OPTIMIZATION: Fetches multiple items in a single RPC call instead of N+1 queries.
 * @param items
 */
export async function getContentBatchBySlugs(
  items: Array<{ category: content_category; slug: string }>
): Promise<Map<string, EnrichedContentItem>> {
  if (items.length === 0) {
    return new Map();
  }

  const itemsByCategory = groupItemsByCategory(items);

  try {
    const service = await getService('content');

    // Fetch all categories in parallel
    // Use Promise.allSettled to preserve successful results even if some categories fail
    const categoryResults = await Promise.allSettled(
      [...itemsByCategory.entries()].map(
        async ([category, slugs]) =>
          await service.getEnrichedContentList({
            p_category: category,
            p_limit: slugs.length,
            p_offset: 0,
            p_slugs: slugs,
          })
      )
    );

    // Build result map from successful results
    const resultMap = new Map<string, EnrichedContentItem>();
    let hasErrors = false;

    for (const result of categoryResults) {
      if (result.status === 'fulfilled') {
        for (const item of result.value) {
          if (item.slug) {
            resultMap.set(item.slug, item);
          }
        }
      } else {
        // Log individual category failures but continue processing other categories
        hasErrors = true;
        const normalized = normalizeError(
          result.reason,
          `getContentBatchBySlugs: failed to fetch category`
        );
        // Use logger directly for category-level warnings (not request-scoped)
        logger.warn({ err: normalized }, 'getContentBatchBySlugs: category fetch failed');
      }
    }

    // Only log error if all categories failed
    if (hasErrors && resultMap.size === 0) {
      const normalized = normalizeError(
        new Error('All category fetches failed'),
        'getContentBatchBySlugs failed'
      );
      logger.error({ err: normalized, itemCount: items.length }, 'getContentBatchBySlugs: all fetches failed');
    }

    return resultMap;
  } catch (error) {
    // Catch any unexpected errors (e.g., getService failure)
    const normalized = normalizeError(error, 'getContentBatchBySlugs failed');
    logger.error({ err: normalized, itemCount: items.length }, 'getContentBatchBySlugs: failed');
    return new Map(); // Return empty map on error
  }
}

// If needed, use getPaginatedContent() or getContentByCategory() instead

/**
 * Get content count for a category
 * Simple data fetching function - pages control caching with 'use cache' directive
 * Uses optimized getContentPaginatedSlim with window function for better performance.
 */
export const getContentCount = createDataFunction<content_category | undefined, number>({
  logContext: (category) => ({ category: category ?? 'all' }),
  methodName: 'getContentPaginatedSlim',
  module: 'data/content/index',
  onError: () => 0, // Return 0 on error
  operation: 'getContentCount',
  serviceKey: 'content',
  transformArgs: (category) => ({
    ...(category ? { p_category: category } : {}),
    p_limit: 1,
    p_offset: 0,
    p_order_by: 'created_at',
    p_order_direction: 'desc',
  }),
  transformResult: (result) => {
    const paginatedResult = result as { pagination?: { total_count?: number } };
    return paginatedResult.pagination?.total_count ?? 0;
  },
});

/**
 * Get configuration count (alias for getContentCount with 'configurations' category)
 * Uses 'use cache' to cache configuration counts. This data is public and same for all users.
 */
export async function getConfigurationCount(): Promise<number> {
  return (await getContentCount('configurations' as content_category)) ?? 0;
}

/**
 * Get trending content
 * Simple data fetching function - pages control caching with 'use cache' directive
 */
export const getTrendingContent = createDataFunction<
  { category?: content_category; limit?: number },
  GetTrendingContentReturns
>({
  logContext: (args) => ({
    category: args.category ?? 'all',
    limit: args.limit ?? 20,
  }),
  methodName: 'getTrendingContent',
  module: 'data/content/index',
  onError: () => [], // Return empty array on error
  operation: 'getTrendingContent',
  serviceKey: 'trending',
  transformArgs: (args) => ({
    ...(args.category ? { p_category: args.category } : {}),
    p_limit: args.limit ?? 20,
  }),
});

interface TrendingPageParameters {
  category?: content_category | null;
  limit?: number;
}

type TrendingMetricsRows = GetTrendingMetricsWithContentReturns;
type PopularContentRows = GetPopularContentReturns;
// Use Prisma model type instead of postgres-types composite type
type RecentContentRows = contentModel[];

interface TrendingPageDataResult {
  popular: PopularContentRows;
  recent: RecentContentRows;
  totalCount: number;
  trending: TrendingMetricsRows;
}

/**
 * Get trending page data (trending metrics, popular, and recent content)
 * Simple data fetching function - pages control caching with 'use cache' directive
 * @param parameters
 */
export async function getTrendingPageData(
  parameters: TrendingPageParameters = {}
): Promise<TrendingPageDataResult> {
  const { category = null, limit = 12 } = parameters;
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  try {
    const trendingService = await getService('trending');

    const [trending, popular, recent] = await Promise.all([
      trendingService.getTrendingMetrics({
        ...(category ? { p_category: category } : {}),
        p_limit: safeLimit,
      }),
      trendingService.getPopularContent({
        ...(category ? { p_category: category } : {}),
        p_limit: safeLimit,
      }),
      trendingService.getRecentContent({
        ...(category ? { p_category: category } : {}),
        p_days: 30,
        p_limit: safeLimit,
      }),
    ]);

    return {
      popular,
      recent,
      totalCount: trending.length,
      trending,
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getTrendingPageData failed');
    logger.error(
      { category: category ?? 'all', err: normalized, limit: safeLimit },
      'getTrendingPageData: failed'
    );
    return {
      popular: [],
      recent: [],
      totalCount: 0,
      trending: [],
    };
  }
}
