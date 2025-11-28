import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  initRequestLogging,
  jsonResponse,
  supabaseAnon,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import { buildSecurityHeaders, createDataApiContext, logger } from '@heyclaude/shared-runtime';

const CORS = getOnlyCorsHeaders;
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

/**
 * Map an input string to a recognized `content_category` enum value.
 *
 * @param value - Input string to map; leading/trailing whitespace and letter case are ignored.
 * @returns The matching `content_category` enum value, or `undefined` if the input is not recognized.
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
 * Serve a paginated content listing based on URL query parameters.
 *
 * Parses `offset`, `limit`, and `category` from `url`, validates them, queries the database for the requested page of content, and returns the resulting items as a JSON array with security, CORS, and caching headers.
 *
 * @param url - The request URL containing query parameters:
 *   - `offset`: non-negative integer, defaults to `0`
 *   - `limit`: integer between `1` and `100`, defaults to `30`
 *   - `category`: `'all'` or a content category string (case-insensitive)
 * @returns A Response whose body is the JSON array of content items on success; for invalid parameters or RPC failures returns a structured error response. Responses include security, CORS, and cache headers.
export async function handlePaginatedContent(url: URL): Promise<Response> {
  const logContext = createDataApiContext('content-paginated', {
    path: url.pathname,
    method: 'GET',
    app: 'public-api',
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Paginated content request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: typeof logContext['request_id'] === 'string' ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === 'string' ? logContext['action'] : 'content-paginated',
    method: 'GET',
  });
  
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
  
  // Update bindings with pagination parameters
  logger.setBindings({
    offset: offsetParam,
    limit: limitParam,
    category: category || 'all',
  });
  traceStep(`Fetching paginated content (offset: ${offsetParam}, limit: ${limitParam})`, logContext);

  const rpcArgs: DatabaseGenerated['public']['Functions']['get_content_paginated_slim']['Args'] = {
    ...(category !== undefined ? { p_category: category } : {}),
    p_limit: limitParam,
    p_offset: offsetParam,
  };
  const { data, error } = await supabaseAnon.rpc('get_content_paginated_slim', rpcArgs);

  if (error) {
    // Use dbQuery serializer for consistent database query formatting
    return await errorResponse(error, 'data-api:get_content_paginated_slim', CORS, {
      ...logContext,
      dbQuery: {
        rpcName: 'get_content_paginated_slim',
        args: rpcArgs, // Will be redacted by Pino's redact config
      },
    });
  }

  // Validate RPC return value without type assertion
  if (!data || typeof data !== 'object' || !('items' in data)) {
    traceRequestComplete(logContext);
    return jsonResponse([], 200, {
      ...buildSecurityHeaders(),
      ...CORS,
      ...buildCacheHeaders('content_paginated'),
      'X-Generated-By': 'supabase.rpc.get_content_paginated_slim',
    });
  }

  // Safely extract items array
  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc?.value;
  };

  const itemsValue = getProperty(data, 'items');
  const items = Array.isArray(itemsValue) ? itemsValue : [];

  traceRequestComplete(logContext);
  return jsonResponse(items, 200, {
    ...buildSecurityHeaders(),
    ...CORS,
    ...buildCacheHeaders('content_paginated'),
    'X-Generated-By': 'supabase.rpc.get_content_paginated_slim',
  });
}