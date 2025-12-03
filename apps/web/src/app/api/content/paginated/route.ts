/**
 * Paginated Content API Route
 * Migrated from public-api edge function
 */

import 'server-only';

import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import {
  generateRequestId,
  logger,
  normalizeError,
  createErrorResponse,
} from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  badRequestResponse,
  jsonResponse,
  getOnlyCorsHeaders,
  buildCacheHeaders,
} from '@heyclaude/web-runtime/server';
import { NextRequest, NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

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

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
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

    reqLogger.info('Paginated content request received', {
      offset: offsetParam,
      limit: limitParam,
      category: category ?? 'all',
    });

    const supabase = createSupabaseAnonClient();
    const rpcArgs: DatabaseGenerated['public']['Functions']['get_content_paginated_slim']['Args'] =
      {
        ...(category === undefined ? {} : { p_category: category }),
        p_limit: limitParam,
        p_offset: offsetParam,
      };

    const { data, error } = await supabase.rpc('get_content_paginated_slim', rpcArgs);

    if (error) {
      reqLogger.error('Content paginated RPC error', normalizeError(error), {
        rpcName: 'get_content_paginated_slim',
        offset: offsetParam,
        limit: limitParam,
        category: category ?? 'all',
      });
      return createErrorResponse(error, {
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
      reqLogger.warn('Content paginated returned invalid data structure');
      return jsonResponse([], 200, CORS, {
        'X-Generated-By': 'supabase.rpc.get_content_paginated_slim',
        ...buildCacheHeaders('content_paginated'),
      });
    }

    const items = itemsValue;

    reqLogger.info('Paginated content retrieved', {
      itemCount: items.length,
      offset: offsetParam,
      limit: limitParam,
    });

    return jsonResponse(items, 200, CORS, {
      'X-Generated-By': 'supabase.rpc.get_content_paginated_slim',
      ...buildCacheHeaders('content_paginated'),
    });
  } catch (error) {
    reqLogger.error('Content paginated API error', normalizeError(error));
    return createErrorResponse(error, {
      route: '/api/content/paginated',
      operation: 'ContentPaginatedAPI',
      method: 'GET',
    });
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getOnlyCorsHeaders,
    },
  });
}
