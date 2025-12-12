/**
 * Trending API Route
 * Migrated from public-api edge function
 */

import 'server-only';
import { TrendingService } from '@heyclaude/data-layer';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { createErrorResponse, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  badRequestResponse,
  buildCacheHeaders,
  createSupabaseAnonClient,
  getOnlyCorsHeaders,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

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

const CORS = getOnlyCorsHeaders;
type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];

function isValidContentCategory(value: unknown): value is ContentCategory {
  if (typeof value !== 'string') {
    return false;
  }
  const validValues = Constants.public.Enums.content_category;
  for (const validValue of validValues) {
    if (value === validValue) {
      return true;
    }
  }
  return false;
}

function parseCategory(value: null | string): ContentCategory | null {
  if (!value || value === 'all') {
    return null;
  }
  return isValidContentCategory(value) ? value : null;
}

function clampLimit(rawLimit: number): number {
  if (Number.isNaN(rawLimit)) {
    return 12;
  }
  return Math.min(Math.max(rawLimit, 1), 100);
}

// All client-side mapping functions removed - database RPCs now return formatted data
// This eliminates CPU-intensive client-side transformations (15-25% CPU savings)

async function handlePageTabs(url: URL, reqLogger: ReturnType<typeof logger.child>) {
  const tab = (url.searchParams.get('tab') ?? 'trending').toLowerCase();
  const limit = clampLimit(Number(url.searchParams.get('limit') ?? '12'));
  const category = parseCategory(url.searchParams.get('category'));

  reqLogger.info({ category: category ?? 'all', limit, tab }, 'Processing trending page tabs');

  try {
    if (tab === 'trending') {
      // Database RPC returns frontend-ready data (no client-side mapping needed)
      const trending = await getCachedTrendingMetricsFormatted(category, limit);
      return jsonResponse(
        {
          totalCount: Array.isArray(trending) ? trending.length : 0,
          trending: Array.isArray(trending) ? trending : [],
        },
        200,
        CORS,
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
        CORS,
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
        CORS,
        buildCacheHeaders('trending_page')
      );
    }

    return badRequestResponse('Invalid tab. Valid tabs: trending, popular, recent', CORS);
  } catch (error) {
    const normalized = normalizeError(error, 'Trending page tabs error');
    reqLogger.error({ err: normalized }, 'Trending page tabs error');
    return createErrorResponse(normalized, {
      method: 'GET',
      operation: 'TrendingAPI',
      route: '/api/trending',
    });
  }
}

async function handleSidebar(url: URL, reqLogger: ReturnType<typeof logger.child>) {
  const limit = clampLimit(Number(url.searchParams.get('limit') ?? '8'));
  const category = parseCategory(url.searchParams.get('category')) ?? 'guides';

  reqLogger.info({ category, limit }, 'Processing trending sidebar');

  try {
    // Database RPCs return sidebar-ready data with formatted views and dates (no client-side mapping needed)
    const [trending, recent] = await Promise.all([
      getCachedSidebarTrendingFormatted(category, limit),
      getCachedSidebarRecentFormatted(category, limit, 30),
    ]);

    return jsonResponse(
      {
        recent: Array.isArray(recent) ? recent : [],
        trending: Array.isArray(trending) ? trending : [],
      },
      200,
      CORS,
      buildCacheHeaders('trending_sidebar')
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Trending sidebar error');
    reqLogger.error({ err: normalized }, 'Trending sidebar error');
    return createErrorResponse(normalized, {
      method: 'GET',
      operation: 'TrendingAPI',
      route: '/api/trending',
    });
  }
}

export function GET(request: NextRequest) {
  const reqLogger = logger.child({
    method: 'GET',
    operation: 'TrendingAPI',
    route: '/api/trending',
  });

  try {
    reqLogger.info({}, 'Trending request received');

    const url = new URL(request.url);
    const segments = url.pathname.replace('/api/trending', '').split('/').filter(Boolean);

    if (segments.length > 0) {
      if (segments[0] === 'sidebar') {
        return handleSidebar(url, reqLogger);
      }
      return badRequestResponse('Invalid trending route path', CORS);
    }

    const mode = (url.searchParams.get('mode') ?? 'page').toLowerCase();
    if (mode === 'sidebar') {
      return handleSidebar(url, reqLogger);
    }

    return handlePageTabs(url, reqLogger);
  } catch (error) {
    const normalized = normalizeError(error, 'Trending API error');
    reqLogger.error({ err: normalized }, 'Trending API error');
    return createErrorResponse(normalized, {
      method: 'GET',
      operation: 'TrendingAPI',
      route: '/api/trending',
    });
  }
}

/**
 * Responds to HTTP OPTIONS requests with no content and CORS headers.
 *
 * @returns A NextResponse with status 204 (No Content) and the allowed CORS headers applied.
 * @see getOnlyCorsHeaders - the set of CORS headers included in the response
 * @see NextResponse - Next.js response helper used to build the response
 */
export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      ...getOnlyCorsHeaders,
    },
    status: 204,
  });
}
