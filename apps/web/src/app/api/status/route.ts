/**
 * Status/Health Check API Route
 * Migrated from public-api edge function
 */

import 'server-only';

import { type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { getStringProperty, getNumberProperty, getObjectProperty } from '@heyclaude/shared-runtime';
import {
  generateRequestId,
  logger,
  normalizeError,
  createErrorResponse,
} from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAnonClient,
  jsonResponse,
  getOnlyCorsHeaders,
  buildCacheHeaders,
} from '@heyclaude/web-runtime/server';
import { NextRequest, NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;

/**
 * Convert a raw `get_api_health` RPC result from snake_case into a camelCase health-report object.
 *
 * Produces an object with `apiVersion`, `status`, `timestamp`, and a `checks` block containing
 * `database` (latency, status, optional error), `contentTable` (count, status, optional error),
 * and `categoryConfigs` (count, status, optional error). Missing numeric fields default to 0;
 * missing status or version/timestamp fields use sensible defaults.
 *
 * @param result - The raw RPC return value from `get_api_health` (expected snake_case shape).
 * @returns The normalized health-report object in camelCase containing overall status, timestamp,
 * and per-check details (`database`, `contentTable`, `categoryConfigs`).
 * @see get_api_health
 */
function transformHealthResult(
  result: DatabaseGenerated['public']['Functions']['get_api_health']['Returns']
): {
  apiVersion: string;
  checks: {
    categoryConfigs: {
      count: number;
      error?: string;
      status: string;
    };
    contentTable: {
      count: number;
      error?: string;
      status: string;
    };
    database: {
      error?: string;
      latency: number;
      status: string;
    };
  };
  status: string;
  timestamp: string;
} {
  const checks = getObjectProperty(result, 'checks');
  const checksDb =
    typeof checks === 'object' && checks !== null
      ? getObjectProperty(checks, 'database')
      : undefined;
  const checksContent =
    typeof checks === 'object' && checks !== null
      ? getObjectProperty(checks, 'content_table')
      : undefined;
  const checksCategory =
    typeof checks === 'object' && checks !== null
      ? getObjectProperty(checks, 'category_configs')
      : undefined;

  const response: {
    apiVersion: string;
    checks: {
      categoryConfigs: {
        count: number;
        error?: string;
        status: string;
      };
      contentTable: {
        count: number;
        error?: string;
        status: string;
      };
      database: {
        error?: string;
        latency: number;
        status: string;
      };
    };
    status: string;
    timestamp: string;
  } = {
    status: getStringProperty(result, 'status') ?? 'unhealthy',
    timestamp: getStringProperty(result, 'timestamp') ?? new Date().toISOString(),
    apiVersion: getStringProperty(result, 'api_version') ?? '1.0.0',
    checks: {
      database: {
        status:
          typeof checksDb === 'object' && checksDb !== null
            ? (getStringProperty(checksDb, 'status') ?? 'error')
            : 'error',
        latency:
          typeof checksDb === 'object' && checksDb !== null
            ? (getNumberProperty(checksDb, 'latency') ?? 0)
            : 0,
      },
      contentTable: {
        status:
          typeof checksContent === 'object' && checksContent !== null
            ? (getStringProperty(checksContent, 'status') ?? 'error')
            : 'error',
        count:
          typeof checksContent === 'object' && checksContent !== null
            ? (getNumberProperty(checksContent, 'count') ?? 0)
            : 0,
      },
      categoryConfigs: {
        status:
          typeof checksCategory === 'object' && checksCategory !== null
            ? (getStringProperty(checksCategory, 'status') ?? 'error')
            : 'error',
        count:
          typeof checksCategory === 'object' && checksCategory !== null
            ? (getNumberProperty(checksCategory, 'count') ?? 0)
            : 0,
      },
    },
  };

  // Conditionally add error properties
  const dbError =
    typeof checksDb === 'object' && checksDb !== null
      ? getStringProperty(checksDb, 'error')
      : undefined;
  if (typeof dbError === 'string') {
    response.checks.database.error = dbError;
  }
  const contentError =
    typeof checksContent === 'object' && checksContent !== null
      ? getStringProperty(checksContent, 'error')
      : undefined;
  if (typeof contentError === 'string') {
    response.checks.contentTable.error = contentError;
  }
  const categoryError =
    typeof checksCategory === 'object' && checksCategory !== null
      ? getStringProperty(checksCategory, 'error')
      : undefined;
  if (typeof categoryError === 'string') {
    response.checks.categoryConfigs.error = categoryError;
  }

  return response;
}

/**
 * Handle GET /api/status requests by retrieving API health from the database RPC and returning a normalized health report.
 *
 * Calls the `get_api_health` RPC, transforms the RPC result into a camelCase health object, and returns a JSON response with CORS and cache headers.
 * HTTP status mapping: `healthy` or `degraded` => 200, any other status => 503. If the RPC returns an error or a runtime exception occurs, an error response is returned.
 *
 * @param _request - The incoming Next.js request (unused).
 * @returns A NextResponse containing the health report JSON on success, or an error response on failure.
 *
 * @see transformHealthResult
 * @see createSupabaseAnonClient
 * @see createErrorResponse
 */
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'StatusAPI',
    route: '/api/status',
    method: 'GET',
  });

  try {
    reqLogger.info('Status/health check request received');

    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase.rpc('get_api_health');

    if (error) {
      reqLogger.error('Health check RPC error', normalizeError(error), {
        rpcName: 'get_api_health',
      });
      return createErrorResponse(error, {
        route: '/api/status',
        operation: 'StatusAPI',
        method: 'GET',
        logContext: {
          rpcName: 'get_api_health',
        },
      });
    }

    const transformed = transformHealthResult(data);

    // Determine HTTP status code based on health status
    const statusCode =
      transformed.status === 'healthy' ? 200 : transformed.status === 'degraded' ? 200 : 503;

    reqLogger.info('Status check completed', {
      status: transformed.status,
      statusCode,
    });

    return jsonResponse(transformed, statusCode, CORS, {
      'X-Generated-By': 'supabase.rpc.get_api_health',
      ...buildCacheHeaders('status'),
    });
  } catch (error) {
    reqLogger.error('Status API error', normalizeError(error));
    return createErrorResponse(error, {
      route: '/api/status',
      operation: 'StatusAPI',
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