import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  jsonResponse,
  supabaseAnon,
} from '@heyclaude/edge-runtime';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';

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

export async function handlePaginatedContent(url: URL): Promise<Response> {
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

  const rpcArgs: DatabaseGenerated['public']['Functions']['get_content_paginated_slim']['Args'] = {
    ...(category !== undefined ? { p_category: category } : {}),
    p_limit: limitParam,
    p_offset: offsetParam,
  };
  const { data, error } = await supabaseAnon.rpc('get_content_paginated_slim', rpcArgs);

  if (error) {
    return errorResponse(error, 'data-api:get_content_paginated_slim', CORS);
  }

  // Validate RPC return value without type assertion
  if (!data || typeof data !== 'object' || !('items' in data)) {
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

  return jsonResponse(items, 200, {
    ...buildSecurityHeaders(),
    ...CORS,
    ...buildCacheHeaders('content_paginated'),
    'X-Generated-By': 'supabase.rpc.get_content_paginated_slim',
  });
}
