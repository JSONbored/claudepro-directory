import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';
import { callRpc, type GetApiHealthReturn } from '../../_shared/database-overrides.ts';
import {
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  methodNotAllowedResponse,
} from '../../_shared/utils/http.ts';
import { buildSecurityHeaders } from '../../_shared/utils/security-headers.ts';

const CORS = getOnlyCorsHeaders;

export async function handleStatusRoute(
  segments: string[],
  _url: URL,
  method: string
): Promise<Response> {
  if (segments.length > 0) {
    return methodNotAllowedResponse('GET', CORS);
  }

  if (method !== 'GET') {
    return methodNotAllowedResponse('GET', CORS);
  }

  const { data, error } = await callRpc(
    'get_api_health',
    {} as DatabaseGenerated['public']['Functions']['get_api_health']['Args'],
    true
  );
  if (error) {
    return errorResponse(error, 'data-api:get_api_health', CORS);
  }

  if (!data) {
    return errorResponse(new Error('Health check returned null'), 'data-api:get_api_health', CORS);
  }

  // Type assertion to our return type (callRpc returns Json, we know the structure)
  const health = data as GetApiHealthReturn;

  // Determine HTTP status code based on health status
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return new Response(JSON.stringify(health), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Generated-By': 'supabase.rpc.get_api_health',
      ...buildSecurityHeaders(),
      ...CORS,
      ...buildCacheHeaders('status'),
    },
  });
}
