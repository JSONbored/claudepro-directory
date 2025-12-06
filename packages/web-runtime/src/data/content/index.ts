import 'server-only';

import { ContentService, TrendingService, type ContentFilterOptions } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { QUERY_LIMITS } from '../config/constants.ts';
import { generateContentTags } from '../content-helpers.ts';

/**
 * Get content by category
 * Uses 'use cache' to cache content lists. This data is public and same for all users.
 * Content lists change periodically, so we use the 'hours' cacheLife profile.
 */
export async function getContentByCategory(
  category: Database['public']['Enums']['content_category']
): Promise<Database['public']['Functions']['get_enriched_content_list']['Returns']> {
  'use cache';

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger } = await import('../../logger.ts');
  const { generateRequestId } = await import('../../utils/request-id.ts');

  // Configure cache - use 'hours' profile for content lists
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  const tags = generateContentTags(category);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getContentByCategory',
    module: 'data/content/index',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new ContentService(client).getEnrichedContentList({
      p_category: category,
      p_limit: QUERY_LIMITS.content.default,
      p_offset: 0,
    });

    reqLogger.info('getContentByCategory: fetched successfully', {
      category,
      count: result.length,
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getContentByCategory: failed', errorForLogging, {
      category,
    });
    return [];
  }
}

/**
 * Get content by slug
 * Uses 'use cache' to cache content details. This data is public and same for all users.
 * Content details change periodically, so we use the 'hours' cacheLife profile.
 */
export async function getContentBySlug(
  category: Database['public']['Enums']['content_category'],
  slug: string
): Promise<Database['public']['CompositeTypes']['enriched_content_item'] | null> {
  'use cache';

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger } = await import('../../logger.ts');
  const { generateRequestId } = await import('../../utils/request-id.ts');

  // Configure cache - use 'hours' profile for content details
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  const tags = generateContentTags(category, slug);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getContentBySlug',
    module: 'data/content/index',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    // Manual service had getEnrichedContentBySlug which called get_enriched_content_list with p_slugs
    const data = await new ContentService(client).getEnrichedContentList({
      p_category: category,
      p_slugs: [slug],
      p_limit: 1,
      p_offset: 0,
    });

    const result = data[0] ?? null;
    reqLogger.info('getContentBySlug: fetched successfully', {
      category,
      slug,
      found: Boolean(result),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getContentBySlug: failed', errorForLogging, {
      category,
      slug,
    });
    return null;
  }
}

// REMOVED: getFullContentBySlug - redundant wrapper, use getContentBySlug directly

/**
 * Get all content with optional filters
 * Uses 'use cache' to cache filtered content lists. This data is public and same for all users.
 * Content lists change periodically, so we use the 'half' cacheLife profile.
 */
export async function getAllContent(
  filters?: ContentFilterOptions
): Promise<Database['public']['CompositeTypes']['enriched_content_item'][]> {
  'use cache';

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger } = await import('../../logger.ts');
  const { generateRequestId } = await import('../../utils/request-id.ts');
  const { toLogContextValue } = await import('../../logger.ts');

  const category = filters?.categories?.[0];

  // Configure cache - use 'half' profile for content lists (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('content-all');
  if (category) {
    const tags = generateContentTags(category);
    for (const tag of tags) {
      cacheTag(tag);
    }
  }

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getAllContent',
    module: 'data/content/index',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new ContentService(client).getContentPaginated({
      ...(category ? { p_category: category } : {}),
      ...(filters?.tags ? { p_tags: filters.tags } : {}),
      ...(filters?.search ? { p_search: filters.search } : {}),
      ...(filters?.author ? { p_author: filters.author } : {}),
      p_order_by: filters?.orderBy ?? 'created_at',
      p_order_direction: filters?.orderDirection ?? 'desc',
      p_limit: filters?.limit ?? QUERY_LIMITS.content.default,
      p_offset: 0,
    });

    const items = (result.items ??
      []) as Database['public']['CompositeTypes']['enriched_content_item'][];

    reqLogger.info('getAllContent: fetched successfully', {
      category: category ?? 'all',
      count: items.length,
      ...(filters ? { filters: toLogContextValue(filters as Record<string, unknown>) } : {}),
    });

    return items;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getAllContent: failed', errorForLogging, {
      category: category ?? 'all',
      ...(filters ? { filters: toLogContextValue(filters as Record<string, unknown>) } : {}),
    });
    return [];
  }
}

/**
 * Get content count for a category
 * Uses 'use cache' to cache content counts. This data is public and same for all users.
 * Content counts change periodically, so we use the 'half' cacheLife profile.
 */
export async function getContentCount(
  category?: Database['public']['Enums']['content_category']
): Promise<number> {
  'use cache';

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger } = await import('../../logger.ts');
  const { generateRequestId } = await import('../../utils/request-id.ts');

  // Configure cache - use 'half' profile for content counts (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  const tags = generateContentTags(category);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getContentCount',
    module: 'data/content/index',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new ContentService(client).getContentPaginated({
      ...(category ? { p_category: category } : {}),
      p_limit: 1,
      p_offset: 0,
      p_order_by: 'created_at',
      p_order_direction: 'desc',
    });

    const count = result.pagination?.total_count ?? 0;
    reqLogger.info('getContentCount: fetched successfully', {
      category: category ?? 'all',
      count,
    });

    return count;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getContentCount: failed', errorForLogging, {
      category: category ?? 'all',
    });
    return 0;
  }
}

/**
 * Get trending content
 * Uses 'use cache' to cache trending content. This data is public and same for all users.
 * Trending content changes periodically, so we use the 'half' cacheLife profile.
 */
export async function getTrendingContent(
  category?: Database['public']['Enums']['content_category'],
  limit = 20
): Promise<Database['public']['Functions']['get_trending_content']['Returns']> {
  'use cache';

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger } = await import('../../logger.ts');
  const { generateRequestId } = await import('../../utils/request-id.ts');

  // Configure cache - use 'half' profile for trending content (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('trending');
  if (category) {
    cacheTag(`trending-${category}`);
  } else {
    cacheTag('trending-all');
  }

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getTrendingContent',
    module: 'data/content/index',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new TrendingService(client).getTrendingContent({
      ...(category ? { p_category: category } : {}),
      p_limit: limit,
    });

    reqLogger.info('getTrendingContent: fetched successfully', {
      category: category ?? 'all',
      limit,
      count: result.length,
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getTrendingContent: failed', errorForLogging, {
      category: category ?? 'all',
      limit,
    });
    return [];
  }
}

// REMOVED: getFilteredContent - redundant wrapper, use getAllContent directly

/**
 * Get configuration count (alias for getContentCount with no category)
 * Uses 'use cache' to cache configuration counts. This data is public and same for all users.
 */
export async function getConfigurationCount(): Promise<number> {
  'use cache';
  return getContentCount();
}

interface TrendingPageParameters {
  category?: Database['public']['Enums']['content_category'] | null;
  limit?: number;
}

type TrendingMetricsRows =
  Database['public']['Functions']['get_trending_metrics_with_content']['Returns'];
type PopularContentRows = Database['public']['Functions']['get_popular_content']['Returns'];
type RecentContentRows = Database['public']['Functions']['get_recent_content']['Returns'];

interface TrendingPageDataResult {
  popular: PopularContentRows;
  recent: RecentContentRows;
  totalCount: number;
  trending: TrendingMetricsRows;
}

/**
 * Get trending page data (trending metrics, popular, and recent content)
 * Uses 'use cache' to cache trending page data. This data is public and same for all users.
 */
export async function getTrendingPageData(
  parameters: TrendingPageParameters = {}
): Promise<TrendingPageDataResult> {
  'use cache';

  const { category = null, limit = 12 } = parameters;
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger } = await import('../../logger.ts');
  const { generateRequestId } = await import('../../utils/request-id.ts');

  // Configure cache - use 'half' profile for trending page data (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('trending');
  cacheTag('trending-page');

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getTrendingPageData',
    module: 'data/content/index',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const trendingService = new TrendingService(client);

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
        p_limit: safeLimit,
        p_days: 30,
      }),
    ]);

    reqLogger.info('getTrendingPageData: fetched successfully', {
      category: category ?? 'all',
      limit: safeLimit,
      trendingCount: trending.length,
      popularCount: popular.length,
      recentCount: recent.length,
    });

    return {
      trending,
      popular,
      recent,
      totalCount: trending.length,
    };
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getTrendingPageData: failed', errorForLogging, {
      category: category ?? 'all',
      limit: safeLimit,
    });
    return {
      trending: [],
      popular: [],
      recent: [],
      totalCount: 0,
    };
  }
}
