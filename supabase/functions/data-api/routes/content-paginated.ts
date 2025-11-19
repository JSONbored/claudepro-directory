import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';
import { callRpc } from '../../_shared/database-overrides.ts';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
} from '../../_shared/utils/http.ts';
import { buildSecurityHeaders } from '../../_shared/utils/security-headers.ts';

const CORS = getOnlyCorsHeaders;

export async function handlePaginatedContent(url: URL): Promise<Response> {
  const offsetParam = Number.parseInt(url.searchParams.get('offset') ?? '0', 10);
  const limitParam = Number.parseInt(url.searchParams.get('limit') ?? '30', 10);
  const categoryParam = url.searchParams.get('category') ?? 'all';

  if (Number.isNaN(offsetParam) || offsetParam < 0) {
    return badRequestResponse('offset must be a non-negative integer', CORS);
  }

  if (Number.isNaN(limitParam) || limitParam < 1 || limitParam > 100) {
    return badRequestResponse('limit must be between 1 and 100', CORS);
  }

  const category = categoryParam === 'all' ? undefined : categoryParam;

  const rpcArgs: DatabaseGenerated['public']['Functions']['get_content_paginated_slim']['Args'] = {
    ...(category !== undefined ? { p_category: category } : {}),
    p_limit: limitParam,
    p_offset: offsetParam,
  };
  const { data, error } = await callRpc('get_content_paginated_slim', rpcArgs, true);

  if (error) {
    return errorResponse(error, 'data-api:get_content_paginated_slim', CORS);
  }

  // Type-safe access to RPC return value - ensure items array is properly typed
  type PaginatedResult =
    DatabaseGenerated['public']['Functions']['get_content_paginated_slim']['Returns'];
  const result = data as PaginatedResult;
  const items =
    result && typeof result === 'object' && 'items' in result && Array.isArray(result['items'])
      ? result['items']
      : [];

  return new Response(JSON.stringify(items), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Generated-By': 'supabase.rpc.get_content_paginated_slim',
      ...buildSecurityHeaders(),
      ...CORS,
      ...buildCacheHeaders('content_paginated'),
    },
  });
}
