import 'server-only';

import { type content_category, type contentModel } from '@heyclaude/data-layer/prisma';
import {
  type EnrichedContentItem,
  type GetPopularContentReturns,
  type GetTrendingContentReturns,
  type GetTrendingMetricsWithContentReturns,
} from '@heyclaude/database-types/postgres-types';
import { cacheLife, cacheTag } from 'next/cache';

import { normalizeError } from '@heyclaude/shared-runtime';
import { logger } from '../../logger.ts';
import { QUERY_LIMITS } from '../config/constants.ts';
import { createCachedDataFunction, generateContentTags, generateResourceTags } from '../cached-data-factory.ts';
import { getService } from '../service-factory.ts';

/**
 * Get content by category
 * Uses 'use cache' to cache content lists. This data is public and same for all users.
 * Content lists change periodically, so we use the 'long' cacheLife profile.
 */
export const getContentByCategory = createCachedDataFunction<content_category, EnrichedContentItem[]>({
  serviceKey: 'content',
  methodName: 'getEnrichedContentList',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  cacheTags: (category) => generateContentTags(category),
  module: 'data/content/index',
  operation: 'getContentByCategory',
  transformArgs: (category) => ({
    p_category: category,
    p_limit: QUERY_LIMITS.content.default,
    p_offset: 0,
  }),
  onError: () => [], // Return empty array on error
  logContext: (category, result) => ({
    cacheStatus: 'miss',
    cacheType: 'nextjs-cache-components',
    category,
    count: Array.isArray(result) ? result.length : 0,
    dbCall: true,
    note: 'Function execution = cache miss. No logs = cache hit (function skipped by Next.js)',
  }),
});

/**
 * Get content by slug
 * Uses 'use cache' to cache content details. This data is public and same for all users.
 * Content details change periodically, so we use the 'medium' cacheLife profile.
 */
export const getContentBySlug = createCachedDataFunction<
  { category: content_category; slug: string },
  EnrichedContentItem | null
>({
  serviceKey: 'content',
  methodName: 'getEnrichedContentList',
  cacheMode: 'public',
  cacheLife: 'medium', // 1hr stale, 15min revalidate, 1 day expire - optimized for SEO
  cacheTags: (args) => generateContentTags(args.category, args.slug),
  module: 'data/content/index',
  operation: 'getContentBySlug',
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
  logContext: (args) => ({
    category: args.category,
    slug: args.slug,
  }),
});

/**
 * Group items by category for efficient batch fetching
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
 * Uses 'use cache' to cache content details. This data is public and same for all users.
 * OPTIMIZATION: Fetches multiple items in a single RPC call instead of N+1 queries.
 */
export async function getContentBatchBySlugs(
  items: Array<{ category: content_category; slug: string }>
): Promise<Map<string, EnrichedContentItem>> {
  'use cache';

  if (items.length === 0) {
    return new Map();
  }

  const itemsByCategory = groupItemsByCategory(items);

  // Configure cache
  cacheLife('medium'); // 1hr stale, 15min revalidate, 1 day expire - optimized for SEO

  // Apply cache tags for all categories and slugs
  for (const [category, slugs] of itemsByCategory.entries()) {
    for (const tag of generateContentTags(category)) {
      cacheTag(tag);
    }
    for (const slug of slugs) {
      for (const tag of generateContentTags(category, slug)) {
        cacheTag(tag);
      }
    }
  }

  try {
    const service = await getService('content');

    // Fetch all categories in parallel
    const categoryResults = await Promise.all(
      [...itemsByCategory.entries()].map(async ([category, slugs]) => {
        const data = await service.getEnrichedContentList({
          p_category: category,
          p_limit: slugs.length,
          p_offset: 0,
          p_slugs: slugs,
        });
        return data;
      })
    );

    // Build result map
    const resultMap = new Map<string, EnrichedContentItem>();
    for (const data of categoryResults) {
      for (const item of data) {
        if (item.slug) {
          resultMap.set(item.slug, item);
        }
      }
    }

    return resultMap;
  } catch (error) {
    const normalized = normalizeError(error, 'getContentBatchBySlugs failed');
    logger.error({ err: normalized, itemCount: items.length }, 'getContentBatchBySlugs: failed');
    return new Map(); // Return empty map on error
  }
}

// If needed, use getPaginatedContent() or getContentByCategory() instead

/**
 * Get content count for a category
 * Uses 'use cache' to cache content counts. This data is public and same for all users.
 * Uses optimized getContentPaginatedSlim with window function for better performance.
 */
export const getContentCount = createCachedDataFunction<content_category | undefined, number>({
  serviceKey: 'content',
  methodName: 'getContentPaginatedSlim',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  cacheTags: (category) => generateContentTags(category),
  module: 'data/content/index',
  operation: 'getContentCount',
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
  onError: () => 0, // Return 0 on error
  logContext: (category) => ({ category: category ?? 'all' }),
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
 * Uses 'use cache' to cache trending content. This data is public and same for all users.
 * Trending content changes periodically, so we use the 'long' cacheLife profile.
 */
export const getTrendingContent = createCachedDataFunction<
  { category?: content_category; limit?: number },
  GetTrendingContentReturns
>({
  serviceKey: 'trending',
  methodName: 'getTrendingContent',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  cacheTags: (args) => generateContentTags(args.category, undefined, ['trending']),
  module: 'data/content/index',
  operation: 'getTrendingContent',
  transformArgs: (args) => ({
    ...(args.category ? { p_category: args.category } : {}),
    p_limit: args.limit ?? 20,
  }),
  onError: () => [], // Return empty array on error
  logContext: (args) => ({
    category: args.category ?? 'all',
    limit: args.limit ?? 20,
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
 * Uses 'use cache' to cache trending page data. This data is public and same for all users.
 * @param parameters
 */
export async function getTrendingPageData(
  parameters: TrendingPageParameters = {}
): Promise<TrendingPageDataResult> {
  'use cache';

  const { category = null, limit = 12 } = parameters;
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  // Configure cache - use 'stable' profile for optimal SEO (6hr stale, 1hr revalidate, 7 days expire)
  cacheLife('long'); // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  const tags = generateResourceTags('trending', undefined, ['trending-page']);
  for (const tag of tags) {
    cacheTag(tag);
  }

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
      { err: normalized, category: category ?? 'all', limit: safeLimit },
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
