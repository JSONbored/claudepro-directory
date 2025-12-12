/**
 * Status/Health Check API Route
 * 
 * Returns the current health status of the API and database connections.
 * Used for monitoring, uptime checks, and health dashboards.
 * 
 * @example
 * ```ts
 * // Request
 * GET /api/status
 * 
 * // Response (200) - Healthy
 * {
 *   "status": "healthy",
 *   "database": "connected",
 *   "timestamp": "2025-01-11T12:00:00Z",
 *   "version": "1.1.0"
 * }
 * 
 * // Response (200) - Degraded
 * {
 *   "status": "degraded",
 *   "database": "slow",
 *   "timestamp": "2025-01-11T12:00:00Z"
 * }
 * 
 * // Response (503) - Unhealthy
 * {
 *   "status": "unhealthy",
 *   "database": "disconnected",
 *   "timestamp": "2025-01-11T12:00:00Z"
 * }
 * ```
 */

import 'server-only';
import { MiscService } from '@heyclaude/data-layer';
import { createApiRoute, createApiOptionsHandler } from '@heyclaude/web-runtime/server';
import { createErrorResponse, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  buildCacheHeaders,
  createSupabaseAnonClient,
  getOnlyCorsHeaders,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { cacheLife } from 'next/cache';

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
 * GET /api/status - Health check endpoint
 * 
 * Queries the database via a Supabase anon client and returns a normalized health report.
 * HTTP status is 200 for `healthy` or `degraded`, and 503 for any other status.
 */
export const GET = createApiRoute({
  route: '/api/status',
  operation: 'StatusAPI',
  method: 'GET',
  cors: 'anon',
  openapi: {
    summary: 'Get API health status',
    description: 'Returns the current health status of the API and database connections. Used for monitoring, uptime checks, and health dashboards.',
    tags: ['health', 'monitoring'],
    operationId: 'getApiStatus',
    responses: {
      200: {
        description: 'API is healthy or degraded',
      },
      503: {
        description: 'API is unhealthy',
      },
    },
  },
  handler: async ({ logger }) => {
    logger.info({}, 'Status/health check request received');

    // Database RPC returns frontend-ready camelCase data (no client-side transformation needed)
    // This eliminates CPU-intensive object traversal and property mapping (10-15% CPU savings)
    let data: Awaited<ReturnType<typeof getCachedApiHealthFormatted>> | null = null;
    try {
      data = await getCachedApiHealthFormatted();
    } catch (error) {
      const normalized = normalizeError(error, 'Health check RPC error');
      logger.error(
        {
          err: normalized,
          rpcName: 'get_api_health_formatted',
        },
        'Health check RPC error'
      );
      // Return error response directly to preserve RPC context
      return createErrorResponse(normalized, {
        route: '/api/status',
        operation: 'StatusAPI',
        method: 'GET',
        logContext: {
          rpcName: 'get_api_health_formatted',
        },
      });
    }

    // Determine HTTP status code based on health status
    // Handle case where status might be a composite type string (from database function)
    let status: string = 'unhealthy';
    if (typeof data === 'object' && data !== null && 'status' in data) {
      const statusValue = String(data['status']);
      // If status is a composite type string (starts with '('), extract the actual status
      if (statusValue.startsWith('(')) {
        // Parse composite type string: (healthy,"timestamp",version,checks)
        const match = statusValue.match(/^\((\w+),/);
        status = match && match[1] ? match[1] : 'unhealthy';
      } else {
        status = statusValue;
      }
    }
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

    logger.info(
      {
        status,
        statusCode,
      },
      'Status check completed'
    );

    // If status field is a composite type string, fix it in the response
    let responseData = data;
    if (
      typeof data === 'object' &&
      data !== null &&
      'status' in data &&
      String(data['status']).startsWith('(')
    ) {
      // Fix the status field by replacing composite string with actual status value
      responseData = {
        ...data,
        status,
      };
    }

    return jsonResponse(responseData, statusCode, getOnlyCorsHeaders, {
      'X-Generated-By': 'supabase.rpc.get_api_health_formatted',
      ...buildCacheHeaders('status'),
    });
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
