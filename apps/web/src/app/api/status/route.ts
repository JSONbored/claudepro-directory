/**
 * Status/Health Check API Route
 * Migrated from public-api edge function
 */

import 'server-only';
import { MiscService } from '@heyclaude/data-layer';
import { createErrorResponse, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  buildCacheHeaders,
  createSupabaseAnonClient,
  getOnlyCorsHeaders,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const CORS = getOnlyCorsHeaders;

/**
 * Cached helper function to fetch API health status
 * Uses Cache Components to reduce function invocations
 * Database RPC returns frontend-ready camelCase data (no client-side transformation needed)
 *
 * @returns {Promise<unknown>} API health status data
 */
async function getCachedApiHealthFormatted() {
  'use cache';
  cacheLife('quarter'); // 15min stale, 5min revalidate, 2hr expire - Health status changes infrequently

  const supabase = createSupabaseAnonClient();
  const service = new MiscService(supabase);
  return await service.getApiHealthFormatted();
}

/**
 * Handle GET /api/status by querying the `get_api_health_formatted` RPC and returning a normalized health report.
 *
 * Queries the database via a Supabase anon client, which returns frontend-ready camelCase data.
 * Responds with JSON including CORS and cache headers. HTTP status is 200 for `healthy`
 * or `degraded`, and 503 for any other status. If the RPC returns an error or an unexpected exception
 * occurs, a structured error response is returned.
 *
 * @param _request - NextRequest representing the incoming request (unused)
 * @returns A NextResponse containing the health report JSON on success, or a structured error response on failure
 *
 * @see createSupabaseAnonClient
 * @see createErrorResponse
 */
export async function GET(_request: NextRequest) {
  const reqLogger = logger.child({
    method: 'GET',
    operation: 'StatusAPI',
    route: '/api/status',
  });

  try {
    reqLogger.info({}, 'Status/health check request received');

    // Database RPC returns frontend-ready camelCase data (no client-side transformation needed)
    // This eliminates CPU-intensive object traversal and property mapping (10-15% CPU savings)
    let data: Awaited<ReturnType<typeof getCachedApiHealthFormatted>> | null = null;
    try {
      data = await getCachedApiHealthFormatted();
    } catch (error) {
      const normalized = normalizeError(error, 'Health check RPC error');
      reqLogger.error(
        {
          err: normalized,
          rpcName: 'get_api_health_formatted',
        },
        'Health check RPC error'
      );
      return createErrorResponse(normalized, {
        logContext: {
          rpcName: 'get_api_health_formatted',
        },
        method: 'GET',
        operation: 'StatusAPI',
        route: '/api/status',
      });
    }

    // Determine HTTP status code based on health status
    const status =
      typeof data === 'object' && data !== null && 'status' in data
        ? String(data['status'])
        : 'unhealthy';
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

    reqLogger.info(
      {
        status,
        statusCode,
      },
      'Status check completed'
    );

    return jsonResponse(data, statusCode, CORS, {
      'X-Generated-By': 'supabase.rpc.get_api_health_formatted',
      ...buildCacheHeaders('status'),
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Operation failed');
    reqLogger.error({ err: normalizeError(error) }, 'Status API error');
    return createErrorResponse(normalized, {
      method: 'GET',
      operation: 'StatusAPI',
      route: '/api/status',
    });
  }
}

/**
 * Responds to HTTP OPTIONS requests with CORS headers and no response body.
 *
 * Returns a 204 No Content response including only the CORS headers required for preflight requests.
 *
 * @returns A NextResponse with status 204 and CORS headers.
 * @see getOnlyCorsHeaders
 */
export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      ...getOnlyCorsHeaders,
    },
    status: 204,
  });
}
