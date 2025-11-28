/**
 * Status/Health Check API Route
 * Migrated from public-api edge function
 */

import 'server-only';

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
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
 * Normalize a raw `get_api_health` RPC result (snake_case) into a camelCase health-report object.
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
      transformed.status === 'healthy' ? 200 : (transformed.status === 'degraded' ? 200 : 503);

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
