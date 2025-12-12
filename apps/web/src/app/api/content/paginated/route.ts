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
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { createApiRoute, createApiOptionsHandler, paginationSchema, categorySchema } from '@heyclaude/web-runtime/server';
import { normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  buildCacheHeaders,
  createSupabaseAnonClient,
  getOnlyCorsHeaders,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';

/******
 * Cached helper function to fetch paginated content.
 * All parameters become part of the cache key, so different queries have different cache entries.
 * @param {{
  category?: DatabaseGenerated['public']['Enums']['content_category'] | undefined;
  limit: number;
  offset: number;
}} params
 * @param {{
  category?: DatabaseGenerated['public']['Enums']['content_category'] | undefined;
  limit: number;
  offset: number;
}} params.category
 * @param {{
  category?: DatabaseGenerated['public']['Enums']['content_category'] | undefined;
  limit: number;
  offset: number;
}} params.limit
 * @param {{
  category?: DatabaseGenerated['public']['Enums']['content_category'] | undefined;
  limit: number;
  offset: number;
}} params.offset
 
 * @returns {unknown} Description of return value * @param {{
  category?: DatabaseGenerated['public']['Enums']['content_category'] | undefined;
  limit: number;
  offset: number;
}} params Parameter description
 * @param {{
  category?: DatabaseGenerated['public']['Enums']['content_category'] | undefined;
  limit: number;
  offset: number;
}} params Parameter description
 * @param {{
  category?: DatabaseGenerated['public']['Enums']['content_category'] | undefined;
  limit: number;
  offset: number;
}} params Parameter description
 * @param {{
  category?: DatabaseGenerated['public']['Enums']['content_category'] | undefined;
  limit: number;
  offset: number;
}} params Parameter description
 * @param {{
  category?: DatabaseGenerated['public']['Enums']['content_category'] | undefined;
  limit: number;
  offset: number;
}} params Parameter description
 * @param {{
  category?: DatabaseGenerated['public']['Enums']['content_category'] | undefined;
  limit: number;
  offset: number;
}} params Parameter description
*/
async function getCachedPaginatedContent(params: {
  category?: DatabaseGenerated['public']['Enums']['content_category'] | undefined;
  limit: number;
  offset: number;
}): Promise<{
  data: DatabaseGenerated['public']['Functions']['get_content_paginated_slim']['Returns'] | null;
  error: null | { code?: string; message: string };
}> {
  'use cache';
  cacheLife({ expire: 2_592_000, revalidate: 21_600, stale: 86_400 }); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  const supabase = createSupabaseAnonClient();
  const service = new ContentService(supabase);
  const rpcArgs: DatabaseGenerated['public']['Functions']['get_content_paginated_slim']['Args'] = {
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
  route: '/api/content/paginated',
  operation: 'ContentPaginatedAPI',
  method: 'GET',
  cors: 'anon',
  querySchema: paginationSchema.extend({
    category: categorySchema,
  }),
  openapi: {
    summary: 'Get paginated content',
    description: 'Returns paginated content with optional category filtering. Supports offset/limit pagination and category filtering.',
    tags: ['content', 'pagination'],
    operationId: 'getPaginatedContent',
    responses: {
      200: {
        description: 'Paginated content retrieved successfully',
      },
      400: {
        description: 'Invalid pagination or category parameters',
      },
    },
  },
  handler: async ({ logger, query }) => {
    // Zod schema ensures proper types - category is already transformed to null if 'all'
    const { limit, offset, category } = query;

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
        'X-Generated-By': 'supabase.rpc.get_content_paginated_slim',
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
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
