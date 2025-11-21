import { supabaseAnon } from '../../_shared/clients/supabase.ts';
import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';
import {
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  methodNotAllowedResponse,
} from '../../_shared/utils/http.ts';
import { buildSecurityHeaders } from '../../_shared/utils/security-headers.ts';

const CORS = getOnlyCorsHeaders;

// Transform snake_case to camelCase for JSON API response
function transformHealthResult(
  result: DatabaseGenerated['public']['Functions']['get_api_health']['Returns']
): {
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
  // Safely extract properties from result
  const getStringProperty = (obj: unknown, key: string): string | undefined => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    if (desc && typeof desc.value === 'string') {
      return desc.value;
    }
    return undefined;
  };

  const getNumberProperty = (obj: unknown, key: string): number | undefined => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    if (desc && typeof desc.value === 'number') {
      return desc.value;
    }
    return undefined;
  };

  const getObjectProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    if (desc && typeof desc.value === 'object' && desc.value !== null) {
      return desc.value;
    }
    return undefined;
  };

  const checks = getObjectProperty(result, 'checks');
  const checksDb = checks ? getObjectProperty(checks, 'database') : undefined;
  const checksContent = checks ? getObjectProperty(checks, 'content_table') : undefined;
  const checksCategory = checks ? getObjectProperty(checks, 'category_configs') : undefined;

  // Build response object conditionally to satisfy exactOptionalPropertyTypes
  const response: {
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
  } = {
    status: getStringProperty(result, 'status') ?? 'unhealthy',
    timestamp: getStringProperty(result, 'timestamp') ?? new Date().toISOString(),
    apiVersion: getStringProperty(result, 'api_version') ?? '1.0.0',
    checks: {
      database: {
        status: checksDb ? (getStringProperty(checksDb, 'status') ?? 'error') : 'error',
        latency: checksDb ? (getNumberProperty(checksDb, 'latency') ?? 0) : 0,
      },
      contentTable: {
        status: checksContent ? (getStringProperty(checksContent, 'status') ?? 'error') : 'error',
        count: checksContent ? (getNumberProperty(checksContent, 'count') ?? 0) : 0,
      },
      categoryConfigs: {
        status: checksCategory ? (getStringProperty(checksCategory, 'status') ?? 'error') : 'error',
        count: checksCategory ? (getNumberProperty(checksCategory, 'count') ?? 0) : 0,
      },
    },
  };

  // Conditionally add error properties
  const dbError = checksDb ? getStringProperty(checksDb, 'error') : undefined;
  if (dbError !== undefined) {
    response.checks.database.error = dbError;
  }
  const contentError = checksContent ? getStringProperty(checksContent, 'error') : undefined;
  if (contentError !== undefined) {
    response.checks.contentTable.error = contentError;
  }
  const categoryError = checksCategory ? getStringProperty(checksCategory, 'error') : undefined;
  if (categoryError !== undefined) {
    response.checks.categoryConfigs.error = categoryError;
  }

  return response;
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

  const { data, error } = await supabaseAnon.rpc('get_api_health', undefined);
  if (error) {
    return errorResponse(error, 'data-api:get_api_health', CORS);
  }

  if (!data) {
    return errorResponse(new Error('Health check returned null'), 'data-api:get_api_health', CORS);
  }

  // Validate data structure without type assertion
  const transformed = transformHealthResult(data);

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
