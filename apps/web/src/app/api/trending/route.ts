/**
 * Trending API Route (v1)
 *
 * Returns trending, popular, or recent content based on tab selection.
 * Supports both page and sidebar modes with category filtering.
 */

import 'server-only';

import {
  errorResponseSchema,
  trendingPageResponseSchema,
  trendingSidebarResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import {
  createCachedApiRoute, createOptionsHandler as createApiOptionsHandler, type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { trendingQuerySchema } from '@heyclaude/web-runtime/api/schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { type content_category } from '@prisma/client';
import { z } from 'zod';

type ContentCategory = content_category;

// Shared method args builder
function buildTrendingMethodArgs(category: ContentCategory | null | undefined, limit: number) {
  return [
    {
      ...(category ? { p_category: category } : {}),
      p_limit: limit,
    },
  ];
}

// Shared response builder
function buildTabResponse(data: unknown[], key: 'popular' | 'recent' | 'trending') {
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
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: (query) => {
    const category = query.category as ContentCategory | null;
    const mode = query.mode;
    const tab = query.tab;
    const tags = ['trending'];
    if (category) tags.push(`trending-${category}`);
    if (mode) tags.push(`trending-${mode}`);
    if (tab) tags.push(`trending-${tab}`);
    return tags;
  },
  cors: 'anon',
  method: 'GET',
  openapi: {
    description:
      'Returns trending, popular, or recent content based on tab selection. Supports both page and sidebar modes with category filtering.',
    operationId: 'getTrending',
    responses: {
      200: {
        description: 'Trending content retrieved successfully',
        example: {
          items: [
            {
              category: 'skills',
              id: 'content-1',
              popularity_score: 95.5,
              slug: 'example-content',
              title: 'Example Content',
            },
          ],
        },
        headers: {
          'Cache-Control': {
            description: 'Cache control directive',
            schema: { type: 'string' },
          },
          'X-Generated-By': {
            description: 'Source of the response data',
            schema: { type: 'string' },
          },
          'X-RateLimit-Remaining': {
            description: 'Remaining rate limit requests',
            schema: { type: 'string' },
          },
        },
        schema: z.union([trendingPageResponseSchema, trendingSidebarResponseSchema]),
      },
      400: {
        description: 'Invalid tab or category parameter',
        example: {
          error: 'Invalid tab or category parameter',
          message: 'Invalid tab. Valid tabs: trending, popular, recent',
        },
        schema: errorResponseSchema,
      },
      500: {
        description: 'Internal server error',
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while fetching trending content',
        },
        schema: errorResponseSchema,
      },
    },
    summary: 'Get trending, popular, or recent content',
    tags: ['content', 'trending'],
  },
  operation: 'TrendingAPI',
  querySchema: trendingQuerySchema,
  responseHandler: async (
    _result: unknown,
    query: {
      category?: ContentCategory | null;
      limit: number;
      mode?: 'page' | 'sidebar';
      tab?: 'popular' | 'recent' | 'trending';
    },
    _body: unknown,
    ctx: RouteHandlerContext<{
      category?: ContentCategory | null;
      limit: number;
      mode?: 'page' | 'sidebar';
      tab?: 'popular' | 'recent' | 'trending';
    }>
  ) => {
    const { logger } = ctx;
    const { category, limit, mode, tab } = query;

    // Import service once
    const { TrendingService } = await import('@heyclaude/data-layer');
    const service = new TrendingService();

    // Handle sidebar mode
    if (mode === 'sidebar') {
      const sidebarCategory = category ?? 'guides';
      logger.info({ category: sidebarCategory, limit }, 'Processing trending sidebar');
      const sidebarArgs = buildTrendingMethodArgs(sidebarCategory, limit);
      const baseArgs = sidebarArgs[0];
      if (!baseArgs) {
        throw new Error('Failed to build trending method args');
      }
      const [trending, recent] = await Promise.all([
        service.getSidebarTrendingFormatted(baseArgs),
        service.getSidebarRecentFormatted({
          ...baseArgs,
          p_days: 30,
        }),
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

    const methodArgs = buildTrendingMethodArgs(category, limit);
    const baseArgs = methodArgs[0];
    if (!baseArgs) {
      throw new Error('Failed to build trending method args');
    }

    if (tab === 'trending') {
      const trending = await service.getTrendingMetricsFormatted(baseArgs);
      return buildTabResponse(Array.isArray(trending) ? trending : [], 'trending');
    }

    if (tab === 'popular') {
      const popular = await service.getPopularContentFormatted(baseArgs);
      return buildTabResponse(Array.isArray(popular) ? popular : [], 'popular');
    }

    if (tab === 'recent') {
      const recent = await service.getRecentContentFormatted({
        ...baseArgs,
        p_days: 30,
      });
      return buildTabResponse(Array.isArray(recent) ? recent : [], 'recent');
    }

    throw new Error('Invalid tab. Valid tabs: trending, popular, recent');
  },
  route: getVersionedRoute('trending'),
  service: {
    methodArgs: (query) =>
      buildTrendingMethodArgs(query.category as ContentCategory | null, query.limit),
    methodName: 'getTrendingMetricsFormatted',
    serviceKey: 'trending',
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
