import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  initRequestLogging,
  methodNotAllowedResponse,
  supabaseAnon,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import {
  buildSecurityHeaders,
  createDataApiContext,
  logger,
  getStringProperty,
  getNumberProperty,
  getObjectProperty,
} from '@heyclaude/shared-runtime';

const CORS = getOnlyCorsHeaders;

/**
 * Normalize a raw `get_api_health` RPC result (snake_case) into a camelCase health-report object.
 *
 * Missing or undefined fields are replaced with sensible defaults: top-level `status` defaults to `"unhealthy"`,
 * `timestamp` defaults to the current time, `apiVersion` defaults to `"1.0.0"`, each sub-check `status` defaults to `"error"`,
 * and numeric metrics default to `0`. If a sub-check includes an `error` string it will be preserved.
 *
 * @param result - The raw RPC return value from `get_api_health`, expected in snake_case form
 * @returns An object with `status`, `timestamp`, `apiVersion`, and a `checks` object containing:
 * - `database`: `{ status, latency, error? }`
 * - `contentTable`: `{ status, count, error? }`
 * - `categoryConfigs`: `{ status, count, error? }`
 */
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

/**
 * Handle requests to the /status health-check endpoint.
 *
 * Processes a request to the /status route, validates the path and method, runs the API health check, and returns a structured JSON health report.
 *
 * @param segments - Path segments following `/status`; requests with any segments return 404
 * @param _url - Original request URL (unused)
 * @param method - HTTP method of the request; only `GET` is allowed
 * @returns A Response containing the JSON-formatted health report. Responses:
 * - 404 when extra path segments are present
 * - 405 when the method is not `GET`
 * - 200 when health status is `healthy` or `degraded`
 * - 503 for other health statuses
 * The response includes CORS and security headers, an `X-Generated-By: supabase.rpc.get_api_health` header, and cache headers for the `status` resource.
 */
export async function handleStatusRoute(
  segments: string[],
  _url: URL,
  method: string
): Promise<Response> {
  const logContext = createDataApiContext('status', {
    path: '/status',
    method,
    app: 'public-api',
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Status/health check request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'status',
    method,
  });
  
  if (segments.length > 0) {
    // Return 404 for paths that don't exist
    return new Response(
      JSON.stringify({ error: 'Not Found', message: `Endpoint /status/${segments.join('/')} does not exist` }),
      { 
        status: 404, 
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          ...buildSecurityHeaders(),
          ...CORS,
        } 
      }
    );
  }

  if (method !== 'GET') {
    return methodNotAllowedResponse('GET', CORS);
  }

  traceStep('Running health checks', logContext);
  const { data, error } = await supabaseAnon.rpc('get_api_health', undefined);
  if (error) {
    // Use dbQuery serializer for consistent database query formatting
    return await errorResponse(error, 'data-api:get_api_health', CORS, {
      ...logContext,
      dbQuery: {
        rpcName: 'get_api_health',
      },
    });
  }

  if (!data) {
    return await errorResponse(new Error('Health check returned null'), 'data-api:get_api_health', CORS, logContext);
  }

  // Validate data structure without type assertion
  const transformed = transformHealthResult(data);

  // Determine HTTP status code based on health status
  const statusCode =
    transformed.status === 'healthy' ? 200 : transformed.status === 'degraded' ? 200 : 503;

  traceRequestComplete(logContext);
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