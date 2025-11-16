import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';
import { callRpc } from '../../_shared/database-overrides.ts';
import {
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  methodNotAllowedResponse,
} from '../../_shared/utils/http.ts';

const CORS = getOnlyCorsHeaders;

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  apiVersion: string;
  checks: Record<string, unknown>;
}

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

  const health = data as HealthStatus | null;
  if (
    !health ||
    typeof health.status !== 'string' ||
    !['healthy', 'degraded', 'unhealthy'].includes(health.status)
  ) {
    return errorResponse(new Error('Invalid health status'), 'data-api:get_api_health', CORS);
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return new Response(JSON.stringify(health), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Generated-By': 'supabase.rpc.get_api_health',
      ...CORS,
      ...buildCacheHeaders('status'),
    },
  });
}
