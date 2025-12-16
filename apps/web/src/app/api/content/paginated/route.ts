/**
 * Paginated Content API Route
 *
 * Returns paginated content with optional category filtering.
 * Supports offset/limit pagination and category filtering.
 *
 * @example
 * ```ts
 * // Request
 * GET /api/content/paginated?offset=0&limit=30&category=skills
 *
 * // Response (200)
 * [
 *   { "id": "...", "title": "...", ... },
 *   ...
 * ]
 * ```
 */

import 'server-only';
import { ContentService } from '@heyclaude/data-layer';
import type { content_category } from '@heyclaude/data-layer/prisma';
import type { GetContentPaginatedSlimArgs, ContentPaginatedSlimResult } from '@heyclaude/database-types/postgres-types';
import { normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  buildCacheHeaders,
  categorySchema,
  createApiOptionsHandler,
  createApiRoute,
  getOnlyCorsHeaders,
  jsonResponse,
  paginationSchema,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';

/**
 * Cached helper function to fetch paginated content.
 * All parameters become part of the cache key, so different queries have different cache entries.
 *
 * @param params - Pagination and category filter parameters
 * @param params.category - Optional content category filter
 * @param params.limit - Maximum number of results to return
 * @param params.offset - Number of results to skip
 * @returns Promise resolving to data and error object
 */
async function getCachedPaginatedContent(params: {
  category?: content_category | undefined;
  limit: number;
  offset: number;
}): Promise<{
  data: ContentPaginatedSlimResult | null;
  error: null | { code?: string; message: string };
}> {
  'use cache';
  cacheLife({ expire: 2_592_000, revalidate: 21_600, stale: 86_400 }); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  const service = new ContentService();
  const rpcArgs: GetContentPaginatedSlimArgs = {
    ...(params.category === undefined ? {} : { p_category: params.category }),
    p_limit: params.limit,
    p_offset: params.offset,
  };

  try {
    const data = await service.getContentPaginatedSlim(rpcArgs);
    return {
      data,
      error: null,
    };
  } catch (error) {
    // Service method already logs the error, just return it in the expected format
    const normalized = normalizeError(error, 'Content paginated RPC error');
    // Extract code from original error if it's a Supabase error
    const code =
      error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined;
    return {
      data: null,
      error: {
        message: normalized.message,
        ...(code !== undefined && { code }),
      },
    };
  }
}

/**
 * GET /api/content/paginated - Get paginated content
 *
 * Returns paginated content with optional category filtering.
 * Supports offset/limit pagination and category filtering.
 */
export const GET = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, query }) => {
    // Zod schema ensures proper types - category is already transformed to null if 'all'
    const { category, limit, offset } = query;

    logger.info(
      {
        category: category ?? 'all',
        limit,
        offset,
      },
      'Paginated content request received'
    );

    const { data, error } = await getCachedPaginatedContent({
      category: category ?? undefined, // Convert null to undefined for RPC
      limit,
      offset,
    });

    if (error) {
      const normalizedError = normalizeError(error, 'Content paginated RPC error');
      logger.error(
        {
          category: category ?? 'all',
          err: normalizedError,
          limit,
          offset,
          rpcName: 'get_content_paginated_slim',
        },
        'Content paginated RPC error'
      );
      throw normalizedError; // Factory will handle error response
    }

    const itemsValue = (data as null | { items?: unknown })?.items;
    if (!Array.isArray(itemsValue)) {
      logger.warn({}, 'Content paginated returned invalid data structure');
      return jsonResponse([], 200, getOnlyCorsHeaders, {
        'X-Generated-By': 'prisma.rpc.get_content_paginated_slim',
        ...buildCacheHeaders('content_paginated'),
      });
    }

    const items = itemsValue;

    logger.info(
      {
        itemCount: items.length,
        limit,
        offset,
      },
      'Paginated content retrieved'
    );

    return jsonResponse(items, 200, getOnlyCorsHeaders, {
      'X-Generated-By': 'supabase.rpc.get_content_paginated_slim',
      ...buildCacheHeaders('content_paginated'),
    });
  },
  method: 'GET',
  openapi: {
    description:
      'Returns paginated content with optional category filtering. Supports offset/limit pagination and category filtering.',
    operationId: 'getPaginatedContent',
    responses: {
      200: {
        description: 'Paginated content retrieved successfully',
      },
      400: {
        description: 'Invalid pagination or category parameters',
      },
    },
    summary: 'Get paginated content',
    tags: ['content', 'pagination'],
  },
  operation: 'ContentPaginatedAPI',
  querySchema: paginationSchema.extend({
    category: categorySchema,
  }),
  route: '/api/content/paginated',
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
