/**
 * Trending API Route
 *
 * Returns trending, popular, or recent content based on tab selection.
 * Supports both page and sidebar modes with category filtering.
 *
 * @example
 * ```ts
 * // Request - Trending tab
 * GET /api/trending?tab=trending&category=skills&limit=12
 *
 * // Response (200)
 * {
 *   "trending": [...],
 *   "totalCount": 50
 * }
 *
 * // Request - Sidebar mode
 * GET /api/trending?mode=sidebar&category=guides&limit=8
 *
 * // Response (200)
 * {
 *   "trending": [...],
 *   "recent": [...]
 * }
 * ```
 */

import 'server-only';

import { TrendingService } from '@heyclaude/data-layer';
import { type content_category } from '@heyclaude/data-layer/prisma';
import {
  buildCacheHeaders,
  createApiOptionsHandler,
  createApiRoute,
  getOnlyCorsHeaders,
  jsonResponse,
  trendingQuerySchema,
} from '@heyclaude/web-runtime/server';
import type { RouteHandlerContext } from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';

type ContentCategory = content_category;

/****
 * Cached helper function to fetch trending metrics
 * Uses Cache Components to reduce function invocations
 * @param {ContentCategory | null} category
 * @param {number} limit
 */
async function getCachedTrendingMetricsFormatted(category: ContentCategory | null, limit: number) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const service = new TrendingService();
  return service.getTrendingMetricsFormatted({
    ...(category ? { p_category: category } : {}),
    p_limit: limit,
  });
}

/****
 * Cached helper function to fetch popular content
 * Uses Cache Components to reduce function invocations
 * @param {ContentCategory | null} category
 * @param {number} limit
 */
async function getCachedPopularContentFormatted(category: ContentCategory | null, limit: number) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const service = new TrendingService();
  return service.getPopularContentFormatted({
    ...(category ? { p_category: category } : {}),
    p_limit: limit,
  });
}

/*****
 * Cached helper function to fetch recent content
 * Uses Cache Components to reduce function invocations
 * @param {ContentCategory | null} category
 * @param {number} limit
 * @param {number} days
 */
async function getCachedRecentContentFormatted(
  category: ContentCategory | null,
  limit: number,
  days: number
) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const service = new TrendingService();
  return service.getRecentContentFormatted({
    ...(category ? { p_category: category } : {}),
    p_days: days,
    p_limit: limit,
  });
}

/****
 * Cached helper function to fetch sidebar trending content
 * @param {ContentCategory | null} category
 * @param {number} limit
 */
async function getCachedSidebarTrendingFormatted(category: ContentCategory | null, limit: number) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const service = new TrendingService();
  return service.getSidebarTrendingFormatted({
    ...(category ? { p_category: category } : {}),
    p_limit: limit,
  });
}

/*****
 * Cached helper function to fetch sidebar recent content
 * @param {ContentCategory | null} category
 * @param {number} limit
 * @param {number} days
 */
async function getCachedSidebarRecentFormatted(
  category: ContentCategory | null,
  limit: number,
  days: number
) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const service = new TrendingService();
  return service.getSidebarRecentFormatted({
    ...(category ? { p_category: category } : {}),
    p_days: days,
    p_limit: limit,
  });
}

/**
 * GET /api/trending - Get trending, popular, or recent content
 *
 * Returns trending, popular, or recent content based on tab selection.
 * Supports both page and sidebar modes with category filtering.
 */
export const GET = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, query, url }) => {
    const { category, limit, mode, tab } = query;

    // Handle path-based sidebar route (/api/trending/sidebar)
    const segments = url.pathname.replace('/api/trending', '').split('/').filter(Boolean);
    if (segments.length > 0 && segments[0] === 'sidebar') {
      return handleSidebar(logger, category, limit);
    }

    // Handle mode-based sidebar
    if (mode === 'sidebar') {
      return handleSidebar(logger, category, limit);
    }

    // Handle page tabs
    return handlePageTabs(logger, tab, category, limit);
  },
  method: 'GET',
  openapi: {
    description:
      'Returns trending, popular, or recent content based on tab selection. Supports both page and sidebar modes with category filtering.',
    operationId: 'getTrending',
    responses: {
      200: {
        description: 'Trending content retrieved successfully',
      },
      400: {
        description: 'Invalid tab or category parameter',
      },
    },
    summary: 'Get trending, popular, or recent content',
    tags: ['content', 'trending'],
  },
  operation: 'TrendingAPI',
  querySchema: trendingQuerySchema,
  route: '/api/trending',
});

/******
 * Handle page tabs (trending, popular, recent)
 * @param {ReturnType<typeof logger.child>} logger
 * @param {'popular' | 'recent' | 'trending'} tab
 * @param {ContentCategory | null} category
 * @param {number} limit
 */
async function handlePageTabs(
  reqLogger: RouteHandlerContext['logger'],
  tab: 'popular' | 'recent' | 'trending',
  category: ContentCategory | null,
  limit: number
) {
  reqLogger.info({ category: category ?? 'all', limit, tab }, 'Processing trending page tabs');

  if (tab === 'trending') {
    const trending = await getCachedTrendingMetricsFormatted(category, limit);
    return jsonResponse(
      {
        totalCount: Array.isArray(trending) ? trending.length : 0,
        trending: Array.isArray(trending) ? trending : [],
      },
      200,
      getOnlyCorsHeaders,
      buildCacheHeaders('trending_page')
    );
  }

  if (tab === 'popular') {
    const popular = await getCachedPopularContentFormatted(category, limit);
    return jsonResponse(
      {
        popular: Array.isArray(popular) ? popular : [],
        totalCount: Array.isArray(popular) ? popular.length : 0,
      },
      200,
      getOnlyCorsHeaders,
      buildCacheHeaders('trending_page')
    );
  }

  if (tab === 'recent') {
    const recent = await getCachedRecentContentFormatted(category, limit, 30);
    return jsonResponse(
      {
        recent: Array.isArray(recent) ? recent : [],
        totalCount: Array.isArray(recent) ? recent.length : 0,
      },
      200,
      getOnlyCorsHeaders,
      buildCacheHeaders('trending_page')
    );
  }

  throw new Error('Invalid tab. Valid tabs: trending, popular, recent');
}

/*****
 * Handle sidebar mode
 * @param {ReturnType<typeof logger.child>} logger
 * @param {ContentCategory | null} category
 * @param {number} limit
 */
async function handleSidebar(
  reqLogger: RouteHandlerContext['logger'],
  category: ContentCategory | null,
  limit: number
) {
  // Default to 'guides' if category is null for sidebar
  const sidebarCategory = category ?? 'guides';

  reqLogger.info({ category: sidebarCategory, limit }, 'Processing trending sidebar');

  // Fetch trending and recent content in parallel
  const [trending, recent] = await Promise.all([
    getCachedSidebarTrendingFormatted(sidebarCategory, limit),
    getCachedSidebarRecentFormatted(sidebarCategory, limit, 30),
  ]);

  return jsonResponse(
    {
      recent: Array.isArray(recent) ? recent : [],
      trending: Array.isArray(trending) ? trending : [],
    },
    200,
    getOnlyCorsHeaders,
    buildCacheHeaders('trending_sidebar')
  );
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
