/**
 * Paginated Content API Route
 *
 * Returns paginated content with optional category filtering.
 * Supports offset/limit pagination and category filtering.
 *
 * @example
 * ```ts
 * // Request
 * GET /api/v1/content/paginated?offset=0&limit=30&category=skills
 *
 * // Response (200)
 * [
 *   { "id": "...", "title": "...", ... },
 *   ...
 * ]
 * ```
 */

import 'server-only';
import type { Prisma, content_category } from '@prisma/client';

type contentModel = Prisma.contentGetPayload<{}>;
import { type GetContentPaginatedSlimArgs } from '@heyclaude/data-layer';
import {
  createCachedApiRoute,
  createOptionsHandler as createApiOptionsHandler,
  type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { categorySchema, paginationSchema } from '@heyclaude/web-runtime/api/schemas';
import {
  errorResponseSchema,
  paginatedContentResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';

/**
 * Query schema for paginated content API
 * Exported for OpenAPI generation
 */
export const paginatedContentQuerySchema = paginationSchema.extend({
  category: categorySchema,
});

// Local type for migrated RPC (RPC removed, using Prisma directly)
type ContentPaginatedSlimItem = contentModel;
interface ContentPaginatedSlimResult {
  items: ContentPaginatedSlimItem[];
  pagination: {
    current_page: number;
    has_more: boolean;
    limit: number;
    offset: number;
    total_count: number;
    total_pages: number;
  };
}

/**
 * GET /api/v1/content/paginated - Get paginated content
 *
 * Returns paginated content with optional category filtering.
 * Supports offset/limit pagination and category filtering.
 */
export const GET = createCachedApiRoute({
  cacheLife: { expire: 2_592_000, revalidate: 21_600, stale: 86_400 }, // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: (query) => {
    const category = query.category as content_category | null;
    return category
      ? ['content-paginated', `content-paginated-${category}`]
      : ['content-paginated'];
  },
  cors: 'anon',
  method: 'GET',
  openapi: {
    description:
      'Returns paginated content with optional category filtering. Supports offset/limit pagination and category filtering.',
    operationId: 'getPaginatedContent',
    responses: {
      200: {
        description: 'Paginated content retrieved successfully',
        schema: paginatedContentResponseSchema,
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
            id: 'content-1',
            title: 'Example Content',
            slug: 'example-content',
            category: 'skills',
            description: 'An example content item',
          },
          {
            id: 'content-2',
            title: 'Another Example',
            slug: 'another-example',
            category: 'skills',
            description: 'Another example content item',
          },
        ],
      },
      400: {
        description: 'Invalid pagination or category parameters',
        schema: errorResponseSchema,
        example: {
          error: 'Invalid pagination or category parameters',
          message: 'Limit must be between 1 and 100',
        },
      },
      500: {
        description: 'Internal server error',
        schema: errorResponseSchema,
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while fetching paginated content',
        },
      },
    },
    summary: 'Get paginated content',
    tags: ['content', 'pagination'],
  },
  operation: 'ContentPaginatedAPI',
  querySchema: paginatedContentQuerySchema,
  responseHandler: (
    result: unknown,
    query: { category: content_category | null; limit: number; offset: number },
    _body: unknown,
    ctx: RouteHandlerContext<{ category: content_category | null; limit: number; offset: number }>
  ) => {
    const { logger } = ctx;
    const { limit, offset } = query;

    const serviceResult = result as ContentPaginatedSlimResult | null | undefined;

    if (!serviceResult || !Array.isArray(serviceResult.items)) {
      logger.warn({}, 'Content paginated returned invalid data structure');
      return jsonResponse([], 200, getOnlyCorsHeaders, {
        'X-Generated-By': 'prisma.rpc.get_content_paginated_slim',
      });
    }

    logger.info(
      {
        itemCount: serviceResult.items.length,
        limit,
        offset,
      },
      'Paginated content retrieved'
    );

    return jsonResponse(serviceResult.items, 200, getOnlyCorsHeaders, {
      'X-Generated-By': 'supabase.rpc.get_content_paginated_slim',
    });
  },
  route: getVersionedRoute('content/paginated'),
  service: {
    methodArgs: (query) => {
      const category = query.category as content_category | null;
      const rpcArgs: GetContentPaginatedSlimArgs = {
        ...(category === null || category === undefined ? {} : { p_category: category }),
        p_limit: query.limit,
        p_offset: query.offset,
      };
      return [rpcArgs];
    },
    methodName: 'getContentPaginatedSlim',
    serviceKey: 'content',
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
