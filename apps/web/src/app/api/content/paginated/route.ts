/**
 * Paginated Content API Route
 * Migrated from public-api edge function
 */

import 'server-only';
import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { logger, normalizeError, createErrorResponse } from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  badRequestResponse,
  jsonResponse,
  getOnlyCorsHeaders,
  buildCacheHeaders,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

/**
 * Cached helper function to fetch paginated content.
 * All parameters become part of the cache key, so different queries have different cache entries.
 * @param params
 * @param params.category
 * @param params.limit
 * @param params.offset
 
 * @returns {unknown} Description of return value*/
async function getCachedPaginatedContent(params: {
  category?: DatabaseGenerated['public']['Enums']['content_category'] | undefined;
  limit: number;
  offset: number;
}): Promise<{
  data: DatabaseGenerated['public']['Functions']['get_content_paginated_slim']['Returns'] | null;
  error: null | { code?: string; message: string };
}> {
  'use cache';
  cacheLife({ stale: 86400, revalidate: 21600, expire: 2592000 }); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  const supabase = createSupabaseAnonClient();
  const rpcArgs: DatabaseGenerated['public']['Functions']['get_content_paginated_slim']['Args'] = {
    ...(params.category === undefined ? {} : { p_category: params.category }),
    p_limit: params.limit,
    p_offset: params.offset,
  };

  const { data, error } = await supabase.rpc('get_content_paginated_slim', rpcArgs);

  return {
    data,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * Normalize and validate a content category string against the allowed enum values.
 *
 * The input is normalized (trimmed and lowercased) and returned if it matches one of
 * the known content category values; otherwise `undefined` is returned.
 *
 * @param value - `string | undefined` — the raw category value to normalize and validate
 * @returns `DatabaseGenerated['public']['Enums']['content_category'] | undefined` — the normalized category when valid, or `undefined` when missing or invalid
 * @see CONTENT_CATEGORY_VALUES
 */
function toContentCategory(
  value: string | undefined
): DatabaseGenerated['public']['Enums']['content_category'] | undefined {
  if (!value) return undefined;
  const lowered = value.trim().toLowerCase();
  return CONTENT_CATEGORY_VALUES.includes(
    lowered as DatabaseGenerated['public']['Enums']['content_category']
  )
    ? (lowered as DatabaseGenerated['public']['Enums']['content_category'])
    : undefined;
}

/**
 * Handle GET requests to retrieve paginated content with optional category filtering.
 *
 * Parses `offset`, `limit`, and `category` from the request URL, validates parameters,
 * invokes the `get_content_paginated_slim` stored procedure, and returns the resulting
 * items as a JSON array with appropriate CORS and caching headers. On validation failure
 * or RPC errors, returns a structured error response with an appropriate HTTP status.
 *
 * @param request - The incoming NextRequest for the GET operation
 * @returns A Next.js Response containing a JSON array of content items on success (HTTP 200),
 *          a 400 Bad Request for invalid query parameters, or a structured error response
 *          for RPC/internal errors (e.g., HTTP 500). Responses include CORS headers,
 *          an `X-Generated-By` header when data is returned, and cache headers for
 *          the paginated content.
 *
 * @see toContentCategory
 * @see createSupabaseAnonClient
 * @see buildCacheHeaders
 */
export async function GET(request: NextRequest) {
  const reqLogger = logger.child({
    operation: 'ContentPaginatedAPI',
    route: '/api/content/paginated',
    method: 'GET',
  });

  try {
    const url = new URL(request.url);
    const offsetParam = Number.parseInt(url.searchParams.get('offset') ?? '0', 10);
    const limitParam = Number.parseInt(url.searchParams.get('limit') ?? '30', 10);
    const categoryParam = (url.searchParams.get('category') ?? 'all').trim().toLowerCase();

    if (Number.isNaN(offsetParam) || offsetParam < 0) {
      return badRequestResponse('offset must be a non-negative integer', CORS);
    }

    if (Number.isNaN(limitParam) || limitParam < 1 || limitParam > 100) {
      return badRequestResponse('limit must be between 1 and 100', CORS);
    }

    const category = categoryParam === 'all' ? undefined : toContentCategory(categoryParam);

    if (categoryParam !== 'all' && category === undefined) {
      return badRequestResponse(
        `Invalid category '${categoryParam}'. Valid categories: all, ${CONTENT_CATEGORY_VALUES.join(', ')}`,
        CORS
      );
    }

    reqLogger.info(
      {
        offset: offsetParam,
        limit: limitParam,
        category: category ?? 'all',
      },
      'Paginated content request received'
    );

    const { data, error } = await getCachedPaginatedContent({
      category,
      limit: limitParam,
      offset: offsetParam,
    });

    if (error) {
      const normalizedError = normalizeError(error, 'Content paginated RPC error');
      reqLogger.error(
        {
          err: normalizedError,
          rpcName: 'get_content_paginated_slim',
          offset: offsetParam,
          limit: limitParam,
          category: category ?? 'all',
        },
        'Content paginated RPC error'
      );
      reqLogger.error(
        {
          err: normalizedError,
          rpcName: 'get_content_paginated_slim',
          offset: offsetParam,
          limit: limitParam,
          category: category ?? 'all',
        },
        'Content paginated RPC error'
      );
      return createErrorResponse(normalizedError, {
        route: '/api/content/paginated',
        operation: 'ContentPaginatedAPI',
        method: 'GET',
        logContext: {
          rpcName: 'get_content_paginated_slim',
          offset: offsetParam,
          limit: limitParam,
          category: category ?? 'all',
        },
      });
    }

    const itemsValue = (data as null | { items?: unknown })?.items;
    if (!Array.isArray(itemsValue)) {
      reqLogger.warn({}, 'Content paginated returned invalid data structure');
      return jsonResponse([], 200, CORS, {
        'X-Generated-By': 'supabase.rpc.get_content_paginated_slim',
        ...buildCacheHeaders('content_paginated'),
      });
    }

    const items = itemsValue;

    reqLogger.info(
      {
        itemCount: items.length,
        offset: offsetParam,
        limit: limitParam,
      },
      'Paginated content retrieved'
    );

    return jsonResponse(items, 200, CORS, {
      'X-Generated-By': 'supabase.rpc.get_content_paginated_slim',
      ...buildCacheHeaders('content_paginated'),
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Operation failed');
    reqLogger.error({ err: normalizeError(error) }, 'Content paginated API error');
    return createErrorResponse(normalized, {
      route: '/api/content/paginated',
      operation: 'ContentPaginatedAPI',
      method: 'GET',
    });
  }
}

/**
 * Handle CORS preflight requests by responding with 204 No Content and only the allowed CORS headers.
 *
 * @returns A NextResponse with HTTP status 204 (No Content) and CORS headers from `getOnlyCorsHeaders`.
 * @see getOnlyCorsHeaders
 * @see NextResponse
 */
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getOnlyCorsHeaders,
    },
  });
}
