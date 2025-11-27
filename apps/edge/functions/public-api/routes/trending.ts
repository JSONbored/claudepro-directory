import { TrendingService } from '@heyclaude/data-layer';
import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  initRequestLogging,
  jsonResponse,
  methodNotAllowedResponse,
  supabaseAnon,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import { createDataApiContext, logger } from '@heyclaude/shared-runtime';

const CORS = getOnlyCorsHeaders;
type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];
const DEFAULT_CATEGORY: ContentCategory = 'agents';

type TrendingMetricsRow =
  DatabaseGenerated['public']['Functions']['get_trending_metrics_with_content']['Returns'][number];
type PopularContentRow =
  DatabaseGenerated['public']['Functions']['get_popular_content']['Returns'][number];
type RecentContentRow =
  DatabaseGenerated['public']['Functions']['get_recent_content']['Returns'][number];

/**
 * Route handler for the public trending API that validates the request and dispatches to page or sidebar handlers.
 *
 * @param segments - Path segments following the trending route (e.g., ["sidebar"] for the sidebar route)
 * @param url - The full request URL, used to read query parameters such as `mode`, `tab`, `limit`, and `category`
 * @param method - The HTTP method of the request; only `GET` requests are accepted
 * @returns A Response containing the requested trending data or an error response (e.g., 400, 405)
 */
export async function handleTrendingRoute(
  segments: string[],
  url: URL,
  method: string
): Promise<Response> {
  const logContext = createDataApiContext('trending', {
    path: url.pathname,
    method,
    app: 'public-api',
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Trending request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: logContext.request_id,
    operation: logContext.action || 'trending',
    method,
  });
  
  if (method !== 'GET') {
    return methodNotAllowedResponse('GET', CORS);
  }

  if (segments.length > 0) {
    if (segments[0] === 'sidebar') {
      return handleSidebar(url, logContext);
    }
    return badRequestResponse('Invalid trending route path', CORS);
  }

  const mode = (url.searchParams.get('mode') || 'page').toLowerCase();
  if (mode === 'sidebar') {
    return handleSidebar(url, logContext);
  }

  return handlePageTabs(url, logContext);
}

/**
 * Handle requests for the trending page tabs (trending, popular, recent) and return the corresponding JSON payload.
 *
 * Reads `tab`, `limit`, and `category` from the provided URL's query parameters, clamps/validates them, fetches the requested data, and returns a JSON response containing the matching items and a `totalCount`.
 *
 * @param url - The request URL containing query parameters `tab`, `limit`, and `category`
 * @param logContext - Structured logging/tracing context for the current data-api request
 * @returns A Response with a JSON body containing either `{ trending | popular | recent, totalCount }`, a 400 for invalid tab, or an error response on failure
 */
async function handlePageTabs(url: URL, logContext: ReturnType<typeof createDataApiContext>): Promise<Response> {
  const tab = (url.searchParams.get('tab') || 'trending').toLowerCase();
  const limit = clampLimit(Number(url.searchParams.get('limit') || '12'));
  const category = parseCategory(url.searchParams.get('category'));
  
  traceStep(`Processing trending page tabs (tab: ${tab})`, logContext);
  
  // Update bindings with tab and category
  logger.setBindings({
    tab,
    category: category || 'all',
    limit,
  });

  const service = new TrendingService(supabaseAnon);

  try {
    if (tab === 'trending') {
      const rows = await service.getTrendingMetrics({
        ...(category ? { p_category: category } : {}),
        p_limit: limit,
      });
      const trending = mapTrendingRows(rows, category);
      traceRequestComplete(logContext);
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
      traceRequestComplete(logContext);
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
      traceRequestComplete(logContext);
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
    return await errorResponse(error, 'data-api:trending', CORS, logContext);
  }
}

/**
 * Fetches trending metrics and recent content for a sidebar by category and returns them as a JSON response.
 *
 * @param url - The request URL; supports query parameters `limit` (number) and `category` (string or "all")
 * @param logContext - Request logging/tracing context created by `createDataApiContext`
 * @returns A Response with a JSON body `{ trending: Array, recent: Array }`, CORS and cache headers, and status 200 on success
 */
async function handleSidebar(url: URL, logContext: ReturnType<typeof createDataApiContext>): Promise<Response> {
  const limit = clampLimit(Number(url.searchParams.get('limit') || '8'));
  const category = parseCategory(url.searchParams.get('category')) ?? 'guides';
  
  traceStep(`Processing trending sidebar (category: ${category})`, logContext);
  
  // Update bindings with category and limit
  logger.setBindings({
    category,
    limit,
  });

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

    traceRequestComplete(logContext);
    return jsonResponse({ trending, recent }, 200, {
      ...CORS,
      ...buildCacheHeaders('trending_sidebar'),
    });
  } catch (error) {
    return await errorResponse(error, 'data-api:trending-sidebar', CORS, logContext);
  }
}

/**
 * Determines whether a value is a valid content category.
 *
 * @param value - The value to test for membership in the ContentCategory set
 * @returns `true` if `value` is a valid `ContentCategory` string, `false` otherwise.
 */
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

/**
 * Convert a category string into a ContentCategory, or return null when unspecified or invalid.
 *
 * @param value - The category value to parse; may be a category name, `'all'`, or `null`
 * @returns The corresponding `ContentCategory` when `value` matches a valid category; `null` if `value` is `null`, `'all'`, or not a recognized category
 */
function parseCategory(value: string | null): ContentCategory | null {
  if (!value || value === 'all') {
    return null;
  }
  return isValidContentCategory(value) ? value : null;
}

/**
 * Clamp a requested limit to the valid range used by the API.
 *
 * @param rawLimit - The numeric limit provided by the caller; may be `NaN`
 * @returns `rawLimit` constrained to the range 1–100, or 12 if `rawLimit` is `NaN`
 */
function clampLimit(rawLimit: number): number {
  if (Number.isNaN(rawLimit)) {
    return 12;
  }
  return Math.min(Math.max(rawLimit, 1), 100);
}

/**
 * Normalize database trending metric rows into API-friendly trending items.
 *
 * @param rows - Raw trending metric rows from the database
 * @param fallbackCategory - Category to use when a row's category is missing; if `null`, uses the module default
 * @returns An array of trending items containing: `category` (resolved category), `slug`, `title`, optional `description`, optional `author`, optional `tags`, optional `source`, optional numeric counters `viewCount`, `copyCount`, `bookmarkCount`, and optional numeric scores `popularity`, `engagementScore`, and `freshnessScore`
 */
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

/**
 * Convert database popular-content rows into API-friendly records with safe fallbacks.
 *
 * @param rows - Rows returned from the database for popular content
 * @param fallbackCategory - Category to use when a row's `category` is null; if `null`, `DEFAULT_CATEGORY` is used
 * @returns An array of objects containing `category`, `slug`, `title`, optional `description`, optional `author`, optional `tags`, optional `viewCount`, optional `copyCount`, and optional `popularity` fields
 */
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

/**
 * Normalize recent content rows into API-ready objects, ensuring a category is set.
 *
 * @param rows - Recent content rows from the database
 * @param fallbackCategory - Category to use when a row's category is missing; if `null`, `DEFAULT_CATEGORY` is used
 * @returns An array of recent content objects with properties: `category`, `slug`, `title`, `description`, `author`, `tags`, and `created_at`
 */
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

/**
 * Convert trending metric rows into lightweight sidebar items.
 *
 * @param rows - Database rows containing trending metrics for content items
 * @param fallbackCategory - Category to use when a row's category is missing; if `null`, uses the default category
 * @returns An array of sidebar items with `title`, `slug` (path formatted as `/category/slug`), and `views` (human-readable string like `"1,234 views"`)
 */
function mapSidebarTrending(rows: TrendingMetricsRow[], fallbackCategory: ContentCategory | null) {
  return rows.map((row) => ({
    title: row.title ?? row.slug,
    slug: `/${row.category ?? fallbackCategory ?? DEFAULT_CATEGORY}/${row.slug}`,
    views: `${Number(row.views_total ?? 0).toLocaleString()} views`,
  }));
}

/**
 * Maps recent content rows into sidebar-friendly entries with title, category-prefixed slug, and a formatted date.
 *
 * @param rows - Recent content rows to map
 * @param fallbackCategory - Category to use when a row's category is missing; if null, uses the default category
 * @returns An array of objects each containing `title` (row title or slug), `slug` ("/category/slug"), and `date` (formatted as an "Mon D, YYYY" en-US string or empty string if no date)
 */
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