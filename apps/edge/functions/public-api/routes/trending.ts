import { TrendingService } from '@heyclaude/data-layer';
import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  jsonResponse,
  methodNotAllowedResponse,
  supabaseAnon,
} from '@heyclaude/edge-runtime';

const CORS = getOnlyCorsHeaders;
type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];
const DEFAULT_CATEGORY: ContentCategory = 'agents';

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

  const service = new TrendingService(supabaseAnon);

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
        {
          ...CORS,
          ...buildCacheHeaders('trending_page'),
        }
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
        {
          ...CORS,
          ...buildCacheHeaders('trending_page'),
        }
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

  const service = new TrendingService(supabaseAnon);

  try {
    const [trendingRows, recentRows] = await Promise.all([
      service.getTrendingMetrics({
        ...(category ? { p_category: category } : {}),
        p_limit: limit,
      }),
      service.getRecentContent({
        ...(category ? { p_category: category } : {}),
        p_limit: limit,
        p_days: 30,
      }),
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

function isValidContentCategory(value: unknown): value is ContentCategory {
  if (typeof value !== 'string') {
    return false;
  }
  // Use enum values directly from @heyclaude/database-types Constants
  const validValues = Constants.public.Enums.content_category;
  for (const validValue of validValues) {
    if (value === validValue) {
      return true;
    }
  }
  return false;
}

function parseCategory(value: string | null): ContentCategory | null {
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

function mapTrendingRows(rows: TrendingMetricsRow[], fallbackCategory: ContentCategory | null) {
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

function mapPopularRows(rows: PopularContentRow[], fallbackCategory: ContentCategory | null) {
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

function mapRecentRows(rows: RecentContentRow[], fallbackCategory: ContentCategory | null) {
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

function mapSidebarTrending(rows: TrendingMetricsRow[], fallbackCategory: ContentCategory | null) {
  return rows.map((row) => ({
    title: row.title ?? row.slug,
    slug: `/${row.category ?? fallbackCategory ?? DEFAULT_CATEGORY}/${row.slug}`,
    views: `${Number(row.views_total ?? 0).toLocaleString()} views`,
  }));
}

function mapSidebarRecent(rows: RecentContentRow[], fallbackCategory: ContentCategory | null) {
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
