/**
 * Category Configs API Route
 *
 * Returns category configuration data including features, metadata, and display settings.
 * Used by the frontend to render category-specific UI and determine available features.
 *
 * @example
 * ```ts
 * // Request
 * GET /api/content/category-configs
 *
 * // Response (200)
 * [
 *   {
 *     "category": "skills",
 *     "display_name": "Skills",
 *     "features": ["search", "filter", "bookmark"],
 *     "metadata": { ... }
 *   }
 * ]
 * ```
 */

import 'server-only';
import {
  createOptionsHandler as createApiOptionsHandler,
  createCachedApiRoute,
  type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import {
  categoryConfigsResponseSchema,
  errorResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';

/**
 * GET /api/content/category-configs - Get category configurations
 *
 * Returns category configuration data including features, metadata, and display settings.
 * Used by the frontend to render category-specific UI and determine available features.
 *
 * OPTIMIZATION: Uses createCachedApiRoute to eliminate cached helper function boilerplate.
 */
export const GET = createCachedApiRoute({
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes
  cacheTags: ['category-configs'],
  cors: 'anon',
  method: 'GET',
  openapi: {
    description:
      'Returns category configuration data including features, metadata, and display settings. Used by the frontend to render category-specific UI and determine available features.',
    operationId: 'getCategoryConfigs',
    responses: {
      200: {
        description: 'Category configurations retrieved successfully',
        schema: categoryConfigsResponseSchema,
        headers: {
          'Cache-Control': {
            schema: { type: 'string' },
            description: 'Cache control directive',
          },
          'X-Generated-By': {
            schema: { type: 'string' },
            description: 'Source of the response data',
          },
        },
        example: [
          {
            category: 'skills',
            display_name: 'Skills',
            features: ['search', 'filter', 'bookmark'],
            metadata: {
              icon: 'code',
              color: 'blue',
            },
          },
          {
            category: 'agents',
            display_name: 'Agents',
            features: ['search', 'filter', 'bookmark', 'export'],
            metadata: {
              icon: 'robot',
              color: 'purple',
            },
          },
        ],
      },
      500: {
        description: 'Internal server error',
        schema: errorResponseSchema,
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while fetching category configurations',
        },
      },
    },
    summary: 'Get category configurations',
    tags: ['content', 'categories', 'config'],
  },
  operation: 'CategoryConfigsAPI',
  responseHandler: (result: unknown, _query: unknown, _body: unknown, ctx: RouteHandlerContext) => {
    const { logger } = ctx;
    const data = result as null | undefined | unknown[];

    logger.info(
      {
        count: Array.isArray(data) ? data.length : 'unknown',
      },
      'Category configs retrieved'
    );

    return jsonResponse(data, 200, getOnlyCorsHeaders, {
      'X-Generated-By': 'prisma.category_configs.findMany', // Migrated from RPC to Prisma
    });
  },
  route: getVersionedRoute('content/category-configs'),
  service: {
    methodArgs: () => [],
    methodName: 'getCategoryConfigs',
    serviceKey: 'content',
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
