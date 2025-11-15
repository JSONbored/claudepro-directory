import { supabaseAnon } from '../../_shared/clients/supabase.ts';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
} from '../../_shared/utils/http.ts';

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

  const category = categoryParam === 'all' ? null : categoryParam;

  const { data, error } = await supabaseAnon.rpc('get_content_paginated_slim', {
    p_category: category,
    p_limit: limitParam,
    p_offset: offsetParam,
  });

  if (error) {
    return errorResponse(error, 'data-api:get_content_paginated_slim', CORS);
  }

  const items = data?.items ?? [];

  return new Response(JSON.stringify(items), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Generated-By': 'supabase.rpc.get_content_paginated_slim',
      ...CORS,
      ...buildCacheHeaders('content_paginated'),
    },
  });
}
