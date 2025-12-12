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
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { createApiRoute, createApiOptionsHandler, trendingQuerySchema } from '@heyclaude/web-runtime/server';
import {
  buildCacheHeaders,
  createSupabaseAnonClient,
  getOnlyCorsHeaders,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';

type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];

/****
 * Cached helper function to fetch trending metrics
 * Uses Cache Components to reduce function invocations
 * @param {ContentCategory | null} category
 * @param {number} limit
 
 * @returns {unknown} Description of return value*/
async function getCachedTrendingMetricsFormatted(category: ContentCategory | null, limit: number) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  const service = new TrendingService(supabase);
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
 
 * @returns {unknown} Description of return value*/
async function getCachedPopularContentFormatted(category: ContentCategory | null, limit: number) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  const service = new TrendingService(supabase);
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
 
 * @returns {unknown} Description of return value*/
async function getCachedRecentContentFormatted(
  category: ContentCategory | null,
  limit: number,
  days: number
) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  const service = new TrendingService(supabase);
  return service.getRecentContentFormatted({
    ...(category ? { p_category: category } : {}),
    p_days: days,
    p_limit: limit,
  });
}

async function getCachedSidebarTrendingFormatted(category: ContentCategory | null, limit: number) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  const service = new TrendingService(supabase);
  return service.getSidebarTrendingFormatted({
    ...(category ? { p_category: category } : {}),
    p_limit: limit,
  });
}

async function getCachedSidebarRecentFormatted(
  category: ContentCategory | null,
  limit: number,
  days: number
) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  const service = new TrendingService(supabase);
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
  route: '/api/trending',
  operation: 'TrendingAPI',
  method: 'GET',
  cors: 'anon',
  querySchema: trendingQuerySchema,
  openapi: {
    summary: 'Get trending, popular, or recent content',
    description: 'Returns trending, popular, or recent content based on tab selection. Supports both page and sidebar modes with category filtering.',
    tags: ['content', 'trending'],
    operationId: 'getTrending',
    responses: {
      200: {
        description: 'Trending content retrieved successfully',
      },
      400: {
        description: 'Invalid tab or category parameter',
      },
    },
  },
  handler: async ({ logger, query, url }) => {
    // Zod schema ensures proper types
    const { tab, category, limit, mode } = query;

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
});

/**
 * Handle page tabs (trending, popular, recent)
 */
async function handlePageTabs(
  logger: ReturnType<typeof import('@heyclaude/web-runtime/logging/server').logger.child>,
  tab: 'trending' | 'popular' | 'recent',
  category: ContentCategory | null,
  limit: number
) {
  logger.info({ category: category ?? 'all', limit, tab }, 'Processing trending page tabs');

  if (tab === 'trending') {
    // Database RPC returns frontend-ready data (no client-side mapping needed)
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
    // Database RPC returns frontend-ready data (no client-side mapping needed)
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
    // Database RPC returns frontend-ready data (no client-side mapping needed)
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

/**
 * Handle sidebar mode
 */
async function handleSidebar(
  logger: ReturnType<typeof import('@heyclaude/web-runtime/logging/server').logger.child>,
  category: ContentCategory | null,
  limit: number
) {
  // Default to 'guides' if category is null for sidebar
  const sidebarCategory = category ?? 'guides';

  logger.info({ category: sidebarCategory, limit }, 'Processing trending sidebar');

  // Database RPCs return sidebar-ready data with formatted views and dates (no client-side mapping needed)
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
