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

// OPTIMIZATION: Removed unused imports - factory handles errors automatically
import {
  errorResponseSchema,
  statusResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import {
  createCachedApiRoute, createOptionsHandler as createApiOptionsHandler, type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';

/**
 * GET /api/status - Health check endpoint
 *
 * Queries the database via Prisma and returns a normalized health report.
 * HTTP status is 200 for `healthy` or `degraded`, and 503 for any other status.
 *
 * OPTIMIZATION: Uses createCachedApiRoute to eliminate cached helper function boilerplate.
 */
export const GET = createCachedApiRoute({
  cacheLife: 'short', // 15min stale, 5min revalidate, 2hr expire - Health status changes infrequently
  cacheTags: ['status', 'health'],
  cors: 'anon',
  method: 'GET',
  openapi: {
    description:
      'Returns the current health status of the API and database connections. Used for monitoring, uptime checks, and health dashboards.',
    operationId: 'getApiStatus',
    responses: {
      200: {
        description: 'API is healthy or degraded',
        example: {
          database: 'connected',
          status: 'healthy',
          timestamp: '2025-01-11T12:00:00Z',
          version: '1.1.0',
        },
        headers: {
          'Cache-Control': {
            description: 'Cache control directive',
            schema: { type: 'string' },
          },
          'X-Generated-By': {
            description: 'Source of the response data',
            schema: { type: 'string' },
          },
        },
        schema: statusResponseSchema,
      },
      500: {
        description: 'Internal server error',
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while checking API status',
        },
        schema: errorResponseSchema,
      },
      503: {
        description: 'API is unhealthy',
        example: {
          database: 'disconnected',
          status: 'unhealthy',
          timestamp: '2025-01-11T12:00:00Z',
        },
        headers: {
          'Cache-Control': {
            description: 'Cache control directive',
            schema: { type: 'string' },
          },
        },
        schema: statusResponseSchema,
      },
    },
    summary: 'Get API health status',
    tags: ['health', 'monitoring'],
  },
  operation: 'StatusAPI',
  responseHandler: (result: unknown, _query: unknown, _body: unknown, ctx: RouteHandlerContext) => {
    const { logger } = ctx;
    const data = result as null | undefined | { [key: string]: unknown; status?: string };

    // Determine HTTP status code based on health status
    // Handle case where status might be a composite type string (from database function)
    let status = 'unhealthy';
    if (typeof data === 'object' && data !== null && 'status' in data) {
      const statusValue = String(data['status']);
      // If status is a composite type string (starts with '('), extract the actual status
      if (statusValue.startsWith('(')) {
        // Parse composite type string: (healthy,"timestamp",version,checks)
        const match = statusValue.match(/^\((\w+),/);
        status = match?.[1] ? match[1] : 'unhealthy';
      } else {
        status = statusValue;
      }
    }
    const statusCode = status === 'healthy' ? 200 : (status === 'degraded' ? 200 : 503);

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
      'X-Generated-By': 'prisma.rpc.get_api_health_formatted',
    });
  },
  route: getVersionedRoute('status'),
  service: {
    methodArgs: () => [],
    methodName: 'getApiHealthFormatted',
    serviceKey: 'misc',
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
