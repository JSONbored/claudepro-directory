import { supabaseAnon } from '../../_shared/clients/supabase.ts';
import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';
import { Constants } from '../../_shared/database.types.ts';

import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  jsonResponse,
  methodNotAllowedResponse,
} from '../../_shared/utils/http.ts';

const CORS = getOnlyCorsHeaders;
const DEFAULT_CATEGORY = 'agents';

// Use generated types directly from RPC return types
type TrendingMetricsRow =
  DatabaseGenerated['public']['Functions']['get_trending_metrics_with_content']['Returns'][number];

type PopularContentRow =
  DatabaseGenerated['public']['Functions']['get_popular_content']['Returns'][number];

type RecentContentRow =
  DatabaseGenerated['public']['Functions']['get_recent_content']['Returns'][number];

export async function handleTrendingRoute(
  segments: string[],
  url: URL,
  method: string
): Promise<Response> {
  if (method !== 'GET') {
    return methodNotAllowedResponse('GET', CORS);
  }

  if (segments.length > 0) {
    if (segments[0] === 'sidebar') {
      return handleSidebar(url);
    }
    return badRequestResponse('Invalid trending route path', CORS);
  }

  const mode = (url.searchParams.get('mode') || 'page').toLowerCase();
  if (mode === 'sidebar') {
    return handleSidebar(url);
  }

  return handlePageTabs(url);
}

async function handlePageTabs(url: URL): Promise<Response> {
  const tab = (url.searchParams.get('tab') || 'trending').toLowerCase();
  const limit = clampLimit(Number(url.searchParams.get('limit') || '12'));
  const category = parseCategory(url.searchParams.get('category'));

  try {
    if (tab === 'trending') {
      const rows = await fetchTrendingMetrics(category, limit);
      const trending = mapTrendingRows(rows, category);
      return jsonResponse(
        {
          trending,
          totalCount: trending.length,
        },
        200,
        {
          ...CORS,
          ...buildCacheHeaders('trending_page'),
        }
      );
    }

    if (tab === 'popular') {
      const rows = await fetchPopularContent(category, limit);
      const popular = mapPopularRows(rows, category);
      return jsonResponse(
        {
          popular,
          totalCount: popular.length,
        },
        200,
        {
          ...CORS,
          ...buildCacheHeaders('trending_page'),
        }
      );
    }

    if (tab === 'recent') {
      const rows = await fetchRecentContent(category, limit);
      const recent = mapRecentRows(rows, category);
      return jsonResponse(
        {
          recent,
          totalCount: recent.length,
        },
        200,
        {
          ...CORS,
          ...buildCacheHeaders('trending_page'),
        }
      );
    }

    return badRequestResponse('Invalid tab. Valid tabs: trending, popular, recent', CORS);
  } catch (error) {
    return errorResponse(error, 'data-api:trending', CORS);
  }
}

async function handleSidebar(url: URL): Promise<Response> {
  const limit = clampLimit(Number(url.searchParams.get('limit') || '8'));
  const category = parseCategory(url.searchParams.get('category')) ?? 'guides';

  try {
    const [trendingRows, recentRows] = await Promise.all([
      fetchTrendingMetrics(category, limit),
      fetchRecentContent(category, limit),
    ]);

    const trending = mapSidebarTrending(trendingRows, category);
    const recent = mapSidebarRecent(recentRows, category);

    return jsonResponse({ trending, recent }, 200, {
      ...CORS,
      ...buildCacheHeaders('trending_sidebar'),
    });
  } catch (error) {
    return errorResponse(error, 'data-api:trending-sidebar', CORS);
  }
}

function isValidContentCategory(
  value: unknown
): value is DatabaseGenerated['public']['Enums']['content_category'] {
  if (typeof value !== 'string') {
    return false;
  }
  // Use enum values directly from database.types.ts Constants
  const validValues = Constants.public.Enums.content_category;
  for (const validValue of validValues) {
    if (value === validValue) {
      return true;
    }
  }
  return false;
}

function parseCategory(value: string | null): string | null {
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

async function fetchTrendingMetrics(
  category: string | null,
  limit: number
): Promise<TrendingMetricsRow[]> {
  const rpcArgs: DatabaseGenerated['public']['Functions']['get_trending_metrics_with_content']['Args'] =
    {
      ...(category !== null && category !== undefined ? { p_category: category } : {}),
      p_limit: limit,
    };
  const { data, error } = await supabaseAnon.rpc('get_trending_metrics_with_content', rpcArgs);

  if (error) {
    throw error;
  }

  // Validate data structure without type assertion
  if (!(data && Array.isArray(data))) {
    return [];
  }
  return data;
}

async function fetchPopularContent(
  category: string | null,
  limit: number
): Promise<PopularContentRow[]> {
  const rpcArgs: DatabaseGenerated['public']['Functions']['get_popular_content']['Args'] = {
    ...(category !== null && category !== undefined ? { p_category: category } : {}),
    p_limit: limit,
  };
  const { data, error } = await supabaseAnon.rpc('get_popular_content', rpcArgs);

  if (error) {
    throw error;
  }

  // Validate data structure without type assertion
  if (!(data && Array.isArray(data))) {
    return [];
  }
  return data;
}

async function fetchRecentContent(
  category: string | null,
  limit: number
): Promise<RecentContentRow[]> {
  const rpcArgs: DatabaseGenerated['public']['Functions']['get_recent_content']['Args'] = {
    ...(category !== null && category !== undefined ? { p_category: category } : {}),
    p_limit: limit,
    p_days: 30,
  };
  const { data, error } = await supabaseAnon.rpc('get_recent_content', rpcArgs);

  if (error) {
    throw error;
  }

  // Validate data structure without type assertion
  if (!(data && Array.isArray(data))) {
    return [];
  }
  return data;
}

function mapTrendingRows(rows: TrendingMetricsRow[], fallbackCategory: string | null) {
  return rows.map((row) => ({
    category: row.category ?? fallbackCategory ?? DEFAULT_CATEGORY,
    slug: row.slug,
    title: row.title ?? row.slug,
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

function mapPopularRows(rows: PopularContentRow[], fallbackCategory: string | null) {
  return rows.map((row) => ({
    category: row.category ?? fallbackCategory ?? DEFAULT_CATEGORY,
    slug: row.slug,
    title: row.title ?? row.slug,
    description: row.description ?? undefined,
    author: row.author ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
    viewCount: row.view_count ?? undefined,
    copyCount: row.copy_count ?? undefined,
    popularity: row.popularity_score ?? undefined,
  }));
}

function mapRecentRows(rows: RecentContentRow[], fallbackCategory: string | null) {
  return rows.map((row) => ({
    category: row.category ?? fallbackCategory ?? DEFAULT_CATEGORY,
    slug: row.slug,
    title: row.title ?? row.slug,
    description: row.description ?? undefined,
    author: row.author ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
    created_at: row.created_at ?? undefined,
  }));
}

function mapSidebarTrending(rows: TrendingMetricsRow[], fallbackCategory: string | null) {
  return rows.map((row) => ({
    title: row.title ?? row.slug,
    slug: `/${row.category ?? fallbackCategory ?? DEFAULT_CATEGORY}/${row.slug}`,
    views: `${Number(row.views_total ?? 0).toLocaleString()} views`,
  }));
}

function mapSidebarRecent(rows: RecentContentRow[], fallbackCategory: string | null) {
  return rows.map((row) => {
    const displayCategory = row.category ?? fallbackCategory ?? DEFAULT_CATEGORY;
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
