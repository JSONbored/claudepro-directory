/**
 * Trending API Route (v1)
 *
 * Returns trending, popular, or recent content based on tab selection.
 * Supports both page and sidebar modes with category filtering.
 */

import 'server-only';

import { type content_category } from '@heyclaude/data-layer/prisma';
import { createOptionsHandler as createApiOptionsHandler, createCachedApiRoute, type RouteHandlerContext } from '@heyclaude/web-runtime/api/route-factory';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { trendingQuerySchema } from '@heyclaude/web-runtime/api/schemas';

type ContentCategory = content_category;

// Shared method args builder
function buildTrendingMethodArgs(category: ContentCategory | null | undefined, limit: number) {
  return [{
    ...(category ? { p_category: category } : {}),
    p_limit: limit,
  }];
}

// Shared response builder
function buildTabResponse(data: unknown[], key: 'trending' | 'popular' | 'recent') {
  const items = Array.isArray(data) ? data : [];
  return jsonResponse(
    key === 'trending'
      ? { totalCount: items.length, trending: items }
      : { [key]: items, totalCount: items.length },
    200,
    getOnlyCorsHeaders
  );
}

/**
 * GET /api/v1/trending - Get trending, popular, or recent content
 *
 * Returns trending, popular, or recent content based on tab selection.
 * Supports both page and sidebar modes with category filtering.
 */
export const GET = createCachedApiRoute({
  route: getVersionedRoute('trending'),
  operation: 'TrendingAPI',
  method: 'GET',
  cors: 'anon',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: (query) => {
    const category = query.category as ContentCategory | null;
    const mode = query.mode as 'sidebar' | undefined;
    const tab = query.tab as 'popular' | 'recent' | 'trending' | undefined;
    const tags = ['trending'];
    if (category) tags.push(`trending-${category}`);
    if (mode) tags.push(`trending-${mode}`);
    if (tab) tags.push(`trending-${tab}`);
    return tags;
  },
  querySchema: trendingQuerySchema as any,
  service: {
    serviceKey: 'trending',
    methodName: 'getTrendingMetricsFormatted',
    methodArgs: (query) => buildTrendingMethodArgs(query.category as ContentCategory | null, query.limit as number),
  },
  responseHandler: async (_result: unknown, query: { category?: ContentCategory | null; limit: number; mode?: 'sidebar'; tab?: 'popular' | 'recent' | 'trending' }, _body: unknown, ctx: RouteHandlerContext<{ category?: ContentCategory | null; limit: number; mode?: 'sidebar'; tab?: 'popular' | 'recent' | 'trending' }, unknown>) => {
    const { logger } = ctx;
    const { category, limit, mode, tab } = query;

    // Import service once
    const { TrendingService } = await import('@heyclaude/data-layer');
    const service = new TrendingService();

    // Handle sidebar mode
    if (mode === 'sidebar') {
      const sidebarCategory = category ?? 'guides';
      logger.info({ category: sidebarCategory, limit }, 'Processing trending sidebar');
      const [trending, recent] = await Promise.all([
        service.getSidebarTrendingFormatted(buildTrendingMethodArgs(sidebarCategory, limit)[0] as any),
        service.getSidebarRecentFormatted({ ...buildTrendingMethodArgs(sidebarCategory, limit)[0] as any, p_days: 30 }),
      ]);
      return jsonResponse(
        {
          recent: Array.isArray(recent) ? recent : [],
          trending: Array.isArray(trending) ? trending : [],
        },
        200,
        getOnlyCorsHeaders
      );
    }

    // Handle page tabs
    logger.info({ category: category ?? 'all', limit, tab }, 'Processing trending page tabs');

    if (tab === 'trending') {
      const trending = await service.getTrendingMetricsFormatted(buildTrendingMethodArgs(category, limit)[0] as any);
      return buildTabResponse(Array.isArray(trending) ? trending : [], 'trending');
    }

    if (tab === 'popular') {
      const popular = await service.getPopularContentFormatted(buildTrendingMethodArgs(category, limit)[0] as any);
      return buildTabResponse(Array.isArray(popular) ? popular : [], 'popular');
    }

    if (tab === 'recent') {
      const recent = await service.getRecentContentFormatted({ ...buildTrendingMethodArgs(category, limit)[0] as any, p_days: 30 });
      return buildTabResponse(Array.isArray(recent) ? recent : [], 'recent');
    }

    throw new Error('Invalid tab. Valid tabs: trending, popular, recent');
  },
  openapi: {
    summary: 'Get trending, popular, or recent content',
    description:
      'Returns trending, popular, or recent content based on tab selection. Supports both page and sidebar modes with category filtering.',
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
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
