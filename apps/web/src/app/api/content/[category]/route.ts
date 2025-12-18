/**
 * Category Content API Route (v1)
 *
 * Returns category content in multiple formats (LLMs.txt or JSON).
 * Supports filtering by content category with optimized caching.
 *
 * @example
 * ```ts
 * // Request
 * GET /api/v1/content/agents?format=json
 *
 * // Response (200) - application/json
 * [
 *   { "id": "...", "title": "...", ... },
 *   ...
 * ]
 * ```
 */

import 'server-only';
import { type content_category } from '@heyclaude/data-layer/prisma';
import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';
import {
  createOptionsHandler as createApiOptionsHandler,
  createFormatHandlerRoute,
  type FormatHandlerConfig,
  type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { VALID_CATEGORIES } from '@heyclaude/web-runtime/utils/category-validation';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, jsonResponse, textResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { notFoundResponse } from '@heyclaude/web-runtime/server/not-found-response';
import { categoryContentFormatSchema } from '@heyclaude/web-runtime/api/schemas';
import { z } from 'zod';

type CategoryFormat = 'json' | 'llms-category';

// Shared route params extractor
async function getCategoryRouteParams(nextContext: unknown): Promise<{ category: string }> {
  interface RouteContext {
    params: Promise<{ category: string }>;
  }
  const context = nextContext as RouteContext;
  if (!context?.params) throw new Error('Missing route context');
  const params = await context.params;
  if (!isValidCategory(params.category)) {
    throw new Error(`Invalid category '${params.category}'. Valid categories: ${VALID_CATEGORIES.join(', ')}`);
  }
  return params;
}

// Shared method args builder
function buildCategoryMethodArgs(_format: CategoryFormat, _query: { format: CategoryFormat }, _body: unknown, routeParams?: Record<string, string>) {
  const category = routeParams?.['category'];
  if (!category || !isValidCategory(category)) throw new Error('Invalid category in route params');
  return [{ p_category: category as content_category }];
}

/**
 * GET /api/v1/content/[category] - Get category content
 *
 * Returns category content in multiple formats (LLMs.txt or JSON).
 * Supports filtering by content category with optimized caching.
 * Uses format handler factory to eliminate switch/if statements.
 */
export const GET = createFormatHandlerRoute<CategoryFormat, { format: CategoryFormat }, unknown>({
  route: getVersionedRoute('content/[category]'),
  operation: 'ContentCategoryAPI',
  method: 'GET',
  cors: 'anon',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: (format, _query, _body, routeParams) => {
    const category = routeParams?.['category'] ?? '';
    return ['content', 'category', `category-${category}`, `category-${category}-${format}`];
  },
  querySchema: z.object({
    format: categoryContentFormatSchema,
  }),
  formats: {
    json: {
      serviceKey: 'content',
      methodName: 'getCategoryContentList',
      getRouteParams: getCategoryRouteParams,
      methodArgs: buildCategoryMethodArgs,
      responseHandler: (result: unknown, _format: 'json', _query: { format: CategoryFormat }, _body: unknown, ctx: RouteHandlerContext<{ format: CategoryFormat }, unknown>) => {
        const { logger } = ctx;
        const data = result as unknown[] | null | undefined;
        if (!data || (Array.isArray(data) && data.length === 0)) {
          logger.warn({}, 'Category content not found');
          return notFoundResponse('Category content not found', 'CategoryContent');
        }
        logger.info({ itemCount: Array.isArray(data) ? data.length : 1 }, 'Category content retrieved');
        return jsonResponse(data, 200, getOnlyCorsHeaders, {
          'X-Generated-By': 'prisma.rpc.get_category_content_list',
        });
      },
    },
    'llms-category': {
      serviceKey: 'content',
      methodName: 'getCategoryLlmsTxt',
      getRouteParams: getCategoryRouteParams,
      methodArgs: buildCategoryMethodArgs,
      responseHandler: (result: unknown, _format: 'llms-category', _query: { format: CategoryFormat }, _body: unknown, ctx: RouteHandlerContext<{ format: CategoryFormat }, unknown>) => {
        const { logger } = ctx;
        const data = result as string | null;
        if (!data) {
          logger.warn({}, 'Category LLMs.txt not found');
          return notFoundResponse('Category LLMs.txt not found', 'CategoryContent');
        }
        const formatted = data.replaceAll(String.raw`\n`, '\n');
        logger.info({ bytes: formatted.length }, 'Category LLMs.txt generated');
        return textResponse(
          formatted,
          200,
          getOnlyCorsHeaders,
          {
            'X-Generated-By': 'prisma.rpc.generate_category_llms_txt',
          }
        );
      },
    },
  } as Record<CategoryFormat, FormatHandlerConfig<CategoryFormat, { format: CategoryFormat }, unknown>>,
  openapi: {
    summary: 'Get category content',
    description:
      'Returns category content in multiple formats (LLMs.txt or JSON). Supports filtering by content category with optimized caching.',
    tags: ['content', 'categories', 'export'],
    operationId: 'getCategoryContent',
    responses: {
      200: {
        description: 'Category content retrieved successfully',
      },
      400: {
        description: 'Invalid category or format parameter',
      },
      404: {
        description: 'Category content not found',
      },
    },
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
