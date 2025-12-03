/**
 * Trending API Route
 * Migrated from public-api edge function
 */

import 'server-only';

import { TrendingService } from '@heyclaude/data-layer';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import {
  generateRequestId,
  logger,
  normalizeError,
  createErrorResponse,
} from '@heyclaude/web-runtime/logging/server';
import {
  badRequestResponse,
  buildCacheHeaders,
  createSupabaseAnonClient,
  getOnlyCorsHeaders,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { NextRequest, NextResponse } from 'next/server';

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
 * Map raw recent-content rows into normalized recent content objects.
 *
 * @param rows - Array of loose recent content rows returned from the database
 * @param fallbackCategory - Category to use when a row's `category` is null or undefined; if this is also null, `DEFAULT_CATEGORY` is used
 * @returns An array of objects with the shape `{ category: ContentCategory, slug: string, title: string, description?: string, author?: string, tags?: string[], created_at?: string }`
 * @see mapTrendingRows, mapPopularRows
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
 * Map recent content rows into sidebar-ready items with title, slug, and formatted date.
 *
 * @param rows - Array of recent content rows to map; each row should include at least `slug` and may include `title`, `category`, and `created_at`.
 * @param fallbackCategory - Category to use when a row's `category` is missing; if also missing, `DEFAULT_CATEGORY` is used.
 * @returns An array of objects each containing:
 *  - `title`: the row title or `slug` when title is missing,
 *  - `slug`: a path string in the form `"/{category}/{slug}"` where `category` is row.category, fallbackCategory, or `DEFAULT_CATEGORY`,
 *  - `date`: a localized US-formatted date string like "Dec 1, 2025" when `created_at` is present, or an empty string when absent.
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

  reqLogger.info('Processing trending page tabs', { tab, category: category ?? 'all', limit });

  const supabase = createSupabaseAnonClient();
  const service = new TrendingService(supabase);

  try {
    if (tab === 'trending') {
      const rows = await service.getTrendingMetrics({
        ...(category ? { p_category: category } : {}),
        p_limit: limit,
      });
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
      const rows = await service.getPopularContent({
        ...(category ? { p_category: category } : {}),
        p_limit: limit,
      });
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
      const rows = await service.getRecentContent({
        ...(category ? { p_category: category } : {}),
        p_limit: limit,
        p_days: 30,
      });
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
    reqLogger.error('Trending page tabs error', normalizeError(error));
    return createErrorResponse(error, {
      route: '/api/trending',
      operation: 'TrendingAPI',
      method: 'GET',
    });
  }
}

async function handleSidebar(url: URL, reqLogger: ReturnType<typeof logger.child>) {
  const limit = clampLimit(Number(url.searchParams.get('limit') ?? '8'));
  const category = parseCategory(url.searchParams.get('category')) ?? 'guides';

  reqLogger.info('Processing trending sidebar', { category, limit });

  const supabase = createSupabaseAnonClient();
  const service = new TrendingService(supabase);

  try {
    const [trendingRows, recentRows] = await Promise.all([
      service.getTrendingMetrics({
        p_category: category,
        p_limit: limit,
      }),
      service.getRecentContent({
        p_category: category,
        p_limit: limit,
        p_days: 30,
      }),
    ]);

    const trending = mapSidebarTrending(trendingRows, category);
    const recent = mapSidebarRecent(recentRows, category);

    return jsonResponse({ trending, recent }, 200, CORS, buildCacheHeaders('trending_sidebar'));
  } catch (error) {
    reqLogger.error('Trending sidebar error', normalizeError(error));
    return createErrorResponse(error, {
      route: '/api/trending',
      operation: 'TrendingAPI',
      method: 'GET',
    });
  }
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'TrendingAPI',
    route: '/api/trending',
    method: 'GET',
  });

  try {
    reqLogger.info('Trending request received');

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
    reqLogger.error('Trending API error', normalizeError(error));
    return createErrorResponse(error, {
      route: '/api/trending',
      operation: 'TrendingAPI',
      method: 'GET',
    });
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getOnlyCorsHeaders,
    },
  });
}