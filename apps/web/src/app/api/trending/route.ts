/**
 * Trending API Route
 * Migrated from public-api edge function
 */

import 'server-only';
import { TrendingService } from '@heyclaude/data-layer';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { logger, normalizeError, createErrorResponse } from '@heyclaude/web-runtime/logging/server';
import {
  badRequestResponse,
  buildCacheHeaders,
  createSupabaseAnonClient,
  getOnlyCorsHeaders,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Cached helper function to fetch trending metrics
 * Uses Cache Components to reduce function invocations
 * @param category
 * @param limit
 
 * @returns {unknown} Description of return value*/
async function getCachedTrendingMetrics(
  category: ContentCategory | null,
  limit: number
): Promise<TrendingMetricsRow[]> {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  const service = new TrendingService(supabase);
  return service.getTrendingMetrics({
    ...(category ? { p_category: category } : {}),
    p_limit: limit,
  });
}

/**
 * Cached helper function to fetch popular content
 * Uses Cache Components to reduce function invocations
 * @param category
 * @param limit
 
 * @returns {unknown} Description of return value*/
async function getCachedPopularContent(
  category: ContentCategory | null,
  limit: number
): Promise<PopularContentRow[]> {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  const service = new TrendingService(supabase);
  return service.getPopularContent({
    ...(category ? { p_category: category } : {}),
    p_limit: limit,
  });
}

/**
 * Cached helper function to fetch recent content
 * Uses Cache Components to reduce function invocations
 * @param category
 * @param limit
 * @param days
 
 * @returns {unknown} Description of return value*/
async function getCachedRecentContent(
  category: ContentCategory | null,
  limit: number,
  days: number
): Promise<RecentContentRow[]> {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire

  const supabase = createSupabaseAnonClient();
  const service = new TrendingService(supabase);
  return service.getRecentContent({
    ...(category ? { p_category: category } : {}),
    p_limit: limit,
    p_days: days,
  });
}

const CORS = getOnlyCorsHeaders;
type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];
const DEFAULT_CATEGORY: ContentCategory = 'agents';

type TrendingMetricsRow =
  DatabaseGenerated['public']['Functions']['get_trending_metrics_with_content']['Returns'][number];
type PopularContentRow =
  DatabaseGenerated['public']['Functions']['get_popular_content']['Returns'][number];
type RecentContentRow =
  DatabaseGenerated['public']['Functions']['get_recent_content']['Returns'][number];

type LooseTrendingRow = Partial<TrendingMetricsRow> & {
  author?: null | string;
  bookmarks_total?: null | number;
  category?: ContentCategory | null;
  copies_total?: null | number;
  description?: null | string;
  engagement_score?: null | number;
  freshness_score?: null | number;
  slug: TrendingMetricsRow['slug'];
  source?: null | string;
  tags?: null | string[];
  title?: null | string;
  trending_score?: null | number;
  views_total?: null | number;
};

type LoosePopularRow = Partial<PopularContentRow> & {
  author?: null | string;
  category?: ContentCategory | null;
  copy_count?: null | number;
  description?: null | string;
  popularity_score?: null | number;
  slug: PopularContentRow['slug'];
  tags?: null | string[];
  title?: null | string;
  view_count?: null | number;
};

type LooseRecentRow = Partial<RecentContentRow> & {
  author?: null | string;
  category?: ContentCategory | null;
  created_at?: null | string;
  description?: null | string;
  slug: RecentContentRow['slug'];
  tags?: null | string[];
  title?: null | string;
};

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

/**
 * Convert database trending rows into frontend-ready trending item objects.
 *
 * Maps each LooseTrendingRow to an object with normalized fields (category, slug, title,
 * description, author, tags, source) and numeric metrics (viewCount, copyCount, bookmarkCount,
 * popularity, engagementScore, freshnessScore). If a row field is missing it will be omitted
 * (set to `undefined`) and `fallbackCategory` or `DEFAULT_CATEGORY` is used when the row's
 * category is absent.
 *
 * @param rows - Array of database rows containing trending metrics (LooseTrendingRow[])
 * @param fallbackCategory - Category to use when a row's category is null/undefined; when this is
 *   also null, `DEFAULT_CATEGORY` is applied
 * @returns An array of normalized trending items suitable for frontend consumption, with fields:
 *   `category`, `slug`, `title`, `description`, `author`, `tags`, `source`, `viewCount`,
 *   `copyCount`, `bookmarkCount`, `popularity`, `engagementScore`, and `freshnessScore`
 *
 * @see mapPopularRows
 * @see mapRecentRows
 * @see DEFAULT_CATEGORY
 */
function mapTrendingRows(rows: LooseTrendingRow[], fallbackCategory: ContentCategory | null) {
  return rows.map((row) => ({
    category:
      (row.category as ContentCategory | null | undefined) ?? fallbackCategory ?? DEFAULT_CATEGORY,
    slug: row.slug,
    title: (row.title as null | string | undefined) ?? row.slug,
    description: row.description ?? undefined,
    author: row.author ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
    source: row.source ?? undefined,
    viewCount: row.views_total ?? undefined,
    copyCount: row.copies_total ?? undefined,
    bookmarkCount: row.bookmarks_total ?? undefined,
    popularity: row.trending_score ?? undefined,
    engagementScore: row.engagement_score ?? undefined,
    freshnessScore: row.freshness_score ?? undefined,
  }));
}

/**
 * Convert database popular rows into frontend-friendly popular item objects.
 *
 * @param rows - Array of database rows representing popular content (`LoosePopularRow[]`)
 * @param fallbackCategory - Category to use when a row's category is null or undefined (`ContentCategory | null`)
 * @returns An array of mapped popular items where each object contains `category`, `slug`, `title`, and optionally `description`, `author`, `tags`, `viewCount`, `copyCount`, and `popularity`
 * @see DEFAULT_CATEGORY
 */
function mapPopularRows(rows: LoosePopularRow[], fallbackCategory: ContentCategory | null) {
  return rows.map((row) => ({
    category:
      (row.category as ContentCategory | null | undefined) ?? fallbackCategory ?? DEFAULT_CATEGORY,
    slug: row.slug,
    title: (row.title as null | string | undefined) ?? row.slug,
    description: row.description ?? undefined,
    author: row.author ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
    viewCount: row.view_count ?? undefined,
    copyCount: row.copy_count ?? undefined,
    popularity: row.popularity_score ?? undefined,
  }));
}

/**
 * Convert recent-content database rows into frontend-ready items, filling missing categories with the provided fallback or the default.
 *
 * @param rows - LooseRecentRow[]: Array of recent-content rows; individual rows may contain partial or optional fields
 * @param fallbackCategory - ContentCategory | null: Category to use when a row's `category` is null; if `null`, `DEFAULT_CATEGORY` is applied
 * @returns An array of mapped items: `{ category: ContentCategory, slug: string, title: string, description?: string, author?: string, tags?: string[], created_at?: string }`
 * @see mapPopularRows
 * @see mapTrendingRows
 */
function mapRecentRows(rows: LooseRecentRow[], fallbackCategory: ContentCategory | null) {
  return rows.map((row) => ({
    category: (row.category ?? fallbackCategory ?? DEFAULT_CATEGORY) satisfies ContentCategory,
    slug: row.slug,
    title: row.title ?? row.slug,
    description: row.description ?? undefined,
    author: row.author ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
    created_at: row.created_at ?? undefined,
  }));
}

/**
 * Create sidebar-ready items from trending rows.
 *
 * @param rows - (LooseTrendingRow[]) Array of trending rows to transform
 * @param fallbackCategory - (ContentCategory | null) Category to use when a row has no category; if `null`, `DEFAULT_CATEGORY` is used
 * @returns {Array<{ title: string; slug: string; views: string }>} Array of sidebar items where `slug` is `/<category>/<slug>` and `views` is formatted like `"1,234 views"`
 * @see mapSidebarRecent
 * @see DEFAULT_CATEGORY
 */
function mapSidebarTrending(rows: LooseTrendingRow[], fallbackCategory: ContentCategory | null) {
  return rows.map((row) => ({
    title: row.title ?? row.slug,
    slug: `/${
      (row.category ?? fallbackCategory ?? DEFAULT_CATEGORY) satisfies ContentCategory
    }/${row.slug}`,
    views: `${Number(row.views_total ?? 0).toLocaleString()} views`,
  }));
}

/**
 * Create sidebar items from recent content rows with a category-prefixed slug and a localized date.
 *
 * @param {LooseRecentRow[]} rows - Array of recent-content rows from the database; individual fields may be missing.
 * @param {ContentCategory | null} fallbackCategory - Category to use when a row's category is absent; if `null`, `DEFAULT_CATEGORY` is used.
 * @returns {{ title: string; slug: string; date: string; }[]} An array of sidebar items where `title` is `row.title` or the row's `slug` fallback, `slug` is prefixed with `/<category>/`, and `date` is a localized "Mon DD, YYYY" string or an empty string if the creation date is unavailable.
 * @see mapSidebarTrending
 * @see DEFAULT_CATEGORY
 */
function mapSidebarRecent(rows: LooseRecentRow[], fallbackCategory: ContentCategory | null) {
  return rows.map((row) => {
    const displayCategory = (row.category ??
      fallbackCategory ??
      DEFAULT_CATEGORY) satisfies ContentCategory;
    const createdAt = row.created_at ?? null;
    return {
      title: row.title ?? row.slug,
      slug: `/${displayCategory}/${row.slug}`,
      date: createdAt
        ? new Date(createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '',
    };
  });
}

async function handlePageTabs(url: URL, reqLogger: ReturnType<typeof logger.child>) {
  const tab = (url.searchParams.get('tab') ?? 'trending').toLowerCase();
  const limit = clampLimit(Number(url.searchParams.get('limit') ?? '12'));
  const category = parseCategory(url.searchParams.get('category'));

  reqLogger.info({ tab, category: category ?? 'all', limit }, 'Processing trending page tabs');

  try {
    if (tab === 'trending') {
      const rows = await getCachedTrendingMetrics(category, limit);
      const trending = mapTrendingRows(rows, category);
      return jsonResponse(
        {
          trending,
          totalCount: trending.length,
        },
        200,
        CORS,
        buildCacheHeaders('trending_page')
      );
    }

    if (tab === 'popular') {
      const rows = await getCachedPopularContent(category, limit);
      const popular = mapPopularRows(rows, category);
      return jsonResponse(
        {
          popular,
          totalCount: popular.length,
        },
        200,
        CORS,
        buildCacheHeaders('trending_page')
      );
    }

    if (tab === 'recent') {
      const rows = await getCachedRecentContent(category, limit, 30);
      const recent = mapRecentRows(rows, category);
      return jsonResponse(
        {
          recent,
          totalCount: recent.length,
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
      route: '/api/trending',
      operation: 'TrendingAPI',
      method: 'GET',
    });
  }
}

async function handleSidebar(url: URL, reqLogger: ReturnType<typeof logger.child>) {
  const limit = clampLimit(Number(url.searchParams.get('limit') ?? '8'));
  const category = parseCategory(url.searchParams.get('category')) ?? 'guides';

  reqLogger.info({ category, limit }, 'Processing trending sidebar');

  try {
    const [trendingRows, recentRows] = await Promise.all([
      getCachedTrendingMetrics(category, limit),
      getCachedRecentContent(category, limit, 30),
    ]);

    const trending = mapSidebarTrending(trendingRows, category);
    const recent = mapSidebarRecent(recentRows, category);

    return jsonResponse({ trending, recent }, 200, CORS, buildCacheHeaders('trending_sidebar'));
  } catch (error) {
    const normalized = normalizeError(error, 'Trending sidebar error');
    reqLogger.error({ err: normalized }, 'Trending sidebar error');
    return createErrorResponse(normalized, {
      route: '/api/trending',
      operation: 'TrendingAPI',
      method: 'GET',
    });
  }
}

export function GET(request: NextRequest) {
  const reqLogger = logger.child({
    operation: 'TrendingAPI',
    route: '/api/trending',
    method: 'GET',
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
      route: '/api/trending',
      operation: 'TrendingAPI',
      method: 'GET',
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
    status: 204,
    headers: {
      ...getOnlyCorsHeaders,
    },
  });
}
