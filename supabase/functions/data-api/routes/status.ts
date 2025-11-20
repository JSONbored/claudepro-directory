import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';
import { callRpc } from '../../_shared/database-overrides.ts';
import {
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  methodNotAllowedResponse,
} from '../../_shared/utils/http.ts';
import { buildSecurityHeaders } from '../../_shared/utils/security-headers.ts';

const CORS = getOnlyCorsHeaders;

type ApiHealthResult = DatabaseGenerated['public']['Functions']['get_api_health']['Returns'];

// Transform snake_case to camelCase for JSON API response
function transformHealthResult(result: ApiHealthResult): {
  status: string;
  timestamp: string;
  apiVersion: string;
  checks: {
    database: {
      status: string;
      latency: number;
      error?: string;
    };
    contentTable: {
      status: string;
      count: number;
      error?: string;
    };
    categoryConfigs: {
      status: string;
      count: number;
      error?: string;
    };
  };
} {
  const checks = result.checks;
  return {
    status: result.status ?? 'unhealthy',
    timestamp: result.timestamp ?? new Date().toISOString(),
    apiVersion: result.api_version ?? '1.0.0',
    checks: {
      database: {
        status: checks?.database?.status ?? 'error',
        latency: checks?.database?.latency ?? 0,
        ...(checks?.database?.error ? { error: checks.database.error } : {}),
      },
      contentTable: {
        status: checks?.content_table?.status ?? 'error',
        count: checks?.content_table?.count ?? 0,
        ...(checks?.content_table?.error ? { error: checks.content_table.error } : {}),
      },
      categoryConfigs: {
        status: checks?.category_configs?.status ?? 'error',
        count: checks?.category_configs?.count ?? 0,
        ...(checks?.category_configs?.error ? { error: checks.category_configs.error } : {}),
      },
    },
  };
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

  if (!data) {
    return errorResponse(new Error('Health check returned null'), 'data-api:get_api_health', CORS);
  }

  // Use generated type directly
  const health = data as ApiHealthResult;
  const transformed = transformHealthResult(health);

  // Determine HTTP status code based on health status
  const statusCode =
    transformed.status === 'healthy' ? 200 : transformed.status === 'degraded' ? 200 : 503;

  return new Response(JSON.stringify(transformed), {
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
