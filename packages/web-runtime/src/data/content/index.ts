import 'server-only';
import { type ContentFilterOptions, ContentService, TrendingService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { QUERY_LIMITS } from '../config/constants.ts';
import { generateContentTags } from '../content-helpers.ts';

/**
 * Get content by category
 * Uses 'use cache' to cache content lists. This data is public and same for all users.
 * Content lists change periodically, so we use the 'hours' cacheLife profile.
 * @param category
 */
export async function getContentByCategory(
  category: Database['public']['Enums']['content_category']
): Promise<Database['public']['Functions']['get_enriched_content_list']['Returns']> {
  'use cache';

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger } = await import('../../logger.ts');

  // Configure cache - use 'hours' profile for content lists
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  const tags = generateContentTags(category);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const reqLogger = logger.child({
    module: 'data/content/index',
    operation: 'getContentByCategory',
  });

  // Log cache miss - function execution means cache miss (Next.js Cache Components skip execution on cache hit)
  // If you don't see this log, it means cache hit (function didn't execute)
  reqLogger.info(
    {
      cacheStatus: 'miss',
      cacheType: 'nextjs-cache-components',
      category,
      note: 'Function execution = cache miss. No logs = cache hit (function skipped by Next.js)',
    },
    'getContentByCategory: cache miss - executing database call'
  );

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

    reqLogger.info(
      {
        cacheStatus: 'miss',
        cacheType: 'nextjs-cache-components',
        category,
        count: result.length,
        dbCall: true,
      },
      'getContentByCategory: fetched successfully (cache miss - database call made)'
    );

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error({ category, err: errorForLogging }, 'getContentByCategory: failed');
    return [];
  }
}

/**
 * Get content by slug
 * Uses 'use cache' to cache content details. This data is public and same for all users.
 * Content details change periodically, so we use the 'hours' cacheLife profile.
 * @param category
 * @param slug
 */
export async function getContentBySlug(
  category: Database['public']['Enums']['content_category'],
  slug: string
): Promise<Database['public']['CompositeTypes']['enriched_content_item'] | null> {
  'use cache';

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger } = await import('../../logger.ts');

  // Configure cache - use 'hours' profile for content details
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  const tags = generateContentTags(category, slug);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const reqLogger = logger.child({
    module: 'data/content/index',
    operation: 'getContentBySlug',
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
      p_limit: 1,
      p_offset: 0,
      p_slugs: [slug],
    });

    const result = data[0] ?? null;
    reqLogger.info(
      { category, found: Boolean(result), slug },
      'getContentBySlug: fetched successfully'
    );

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error({ category, err: errorForLogging, slug }, 'getContentBySlug: failed');
    return null;
  }
}

// REMOVED: getFullContentBySlug - redundant wrapper, use getContentBySlug directly

/**
 * Get all content with optional filters
 * Uses 'use cache' to cache filtered content lists. This data is public and same for all users.
 * Content lists change periodically, so we use the 'half' cacheLife profile.
 * @param filters
 */
export async function getAllContent(
  filters?: ContentFilterOptions
): Promise<Array<Database['public']['CompositeTypes']['enriched_content_item']>> {
  'use cache';

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger, toLogContextValue } = await import('../../logger.ts');

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

  const reqLogger = logger.child({
    module: 'data/content/index',
    operation: 'getAllContent',
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
      p_limit: filters?.limit ?? QUERY_LIMITS.content.default,
      p_offset: 0,
      p_order_by: filters?.orderBy ?? 'created_at',
      p_order_direction: filters?.orderDirection ?? 'desc',
    });

    const items = (result.items ?? []) as Array<
      Database['public']['CompositeTypes']['enriched_content_item']
    >;

    reqLogger.info(
      {
        category: category ?? 'all',
        count: items.length,
        ...(filters ? { filters: toLogContextValue(filters as Record<string, unknown>) } : {}),
      },
      'getAllContent: fetched successfully'
    );

    return items;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error(
      {
        category: category ?? 'all',
        err: errorForLogging,
        ...(filters ? { filters: toLogContextValue(filters as Record<string, unknown>) } : {}),
      },
      'getAllContent: failed'
    );
    return [];
  }
}

/**
 * Get content count for a category
 * Uses 'use cache' to cache content counts. This data is public and same for all users.
 * Content counts change periodically, so we use the 'half' cacheLife profile.
 * @param category
 */
export async function getContentCount(
  category?: Database['public']['Enums']['content_category']
): Promise<number> {
  'use cache';

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger } = await import('../../logger.ts');
  // Configure cache - use 'half' profile for content counts (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  const tags = generateContentTags(category);
  for (const tag of tags) {
    cacheTag(tag);
  }

  const reqLogger = logger.child({
    module: 'data/content/index',
    operation: 'getContentCount',
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
    reqLogger.info({ category: category ?? 'all', count }, 'getContentCount: fetched successfully');

    return count;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error(
      { category: category ?? 'all', err: errorForLogging },
      'getContentCount: failed'
    );
    return 0;
  }
}

/**
 * Get trending content
 * Uses 'use cache' to cache trending content. This data is public and same for all users.
 * Trending content changes periodically, so we use the 'half' cacheLife profile.
 * @param category
 * @param limit
 */
export async function getTrendingContent(
  category?: Database['public']['Enums']['content_category'],
  limit = 20
): Promise<Database['public']['Functions']['get_trending_content']['Returns']> {
  'use cache';

  const { isBuildTime } = await import('../../build-time.ts');
  const { createSupabaseAnonClient } = await import('../../supabase/server-anon.ts');
  const { logger } = await import('../../logger.ts');
  // Configure cache - use 'half' profile for trending content (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('trending');
  if (category) {
    cacheTag(`trending-${category}`);
  } else {
    cacheTag('trending-all');
  }

  const reqLogger = logger.child({
    module: 'data/content/index',
    operation: 'getTrendingContent',
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

    reqLogger.info(
      { category: category ?? 'all', count: result.length, limit },
      'getTrendingContent: fetched successfully'
    );

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error(
      { category: category ?? 'all', err: errorForLogging, limit },
      'getTrendingContent: failed'
    );
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
 * @param parameters
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
  // Configure cache - use 'half' profile for trending page data (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('trending');
  cacheTag('trending-page');

  const reqLogger = logger.child({
    module: 'data/content/index',
    operation: 'getTrendingPageData',
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
        p_days: 30,
        p_limit: safeLimit,
      }),
    ]);

    reqLogger.info(
      {
        category: category ?? 'all',
        limit: safeLimit,
        popularCount: popular.length,
        recentCount: recent.length,
        trendingCount: trending.length,
      },
      'getTrendingPageData: fetched successfully'
    );

    return {
      popular,
      recent,
      totalCount: trending.length,
      trending,
    };
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error(
      { category: category ?? 'all', err: errorForLogging, limit: safeLimit },
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
