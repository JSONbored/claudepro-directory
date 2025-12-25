/**
 * Flux Catch-All API Route
 *
 * Handles all flux operations via dynamic routing:
 * - GET  /api/flux/email/count           -> Newsletter subscriber count
 * - POST /api/flux/discord/direct        -> Send Discord notification
 * - POST /api/flux/revalidation          -> Process revalidation queue
 * - POST /api/flux/webhook/external      -> Process external webhooks
 *
 * This replaces the flux-station Supabase Edge Functions.
 *
 * @see packages/web-runtime/src/flux for implementation
 */

import 'server-only';

import {
  errorResponseSchema,
  fluxResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import {
  createApiRoute,
  createOptionsHandler as createApiOptionsHandler,
} from '@heyclaude/web-runtime/api/route-factory';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { routeFluxRequest } from '@heyclaude/web-runtime/flux/router';
import { NextRequest } from 'next/server';

interface RouteContext {
  params: Promise<{
    path: string[];
  }>;
}

// Shared Flux handler (GET and POST follow same pattern)
async function handleFluxRequest(
  method: 'GET' | 'POST',
  logger: ReturnType<typeof import('@heyclaude/web-runtime/logging/server').logger.child>,
  nextContext: unknown,
  request: NextRequest
) {
  const context = nextContext as RouteContext;
  if (!context?.params) {
    logger.error({}, 'Missing route context for Flux handler');
    throw new Error('Missing route context');
  }
  const params = await context.params;
  logger.debug({ method, path: params.path }, `Flux ${method} request`);
  return await routeFluxRequest(method, params.path, request);
}

/**
 * GET /api/flux/[...path] - Flux catch-all GET handler
 *
 * Routes GET requests to appropriate Flux handlers based on path segments.
 */
export const GET = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, nextContext, request }) =>
    handleFluxRequest('GET', logger, nextContext, request),
  method: 'GET',
  openapi: {
    description:
      'Routes GET requests to appropriate Flux handlers based on path segments (e.g., /api/flux/email/count). Supports dynamic routing for internal services.',
    operationId: 'fluxGet',
    responses: {
      200: {
        description: 'Request routed successfully',
        example: {
          count: 1234,
        },
        headers: {
          'Cache-Control': {
            description: 'Cache control directive',
            schema: { type: 'string' },
          },
          'X-RateLimit-Remaining': {
            description: 'Remaining rate limit requests',
            schema: { type: 'string' },
          },
        },
        schema: fluxResponseSchema,
      },
      404: {
        description: 'Route not found',
        example: {
          error: 'Route not found',
          message: 'No Flux handler found for path: invalid/path',
        },
        schema: errorResponseSchema,
      },
      500: {
        description: 'Internal server error',
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while routing Flux request',
        },
        schema: errorResponseSchema,
      },
    },
    summary: 'Flux catch-all GET handler',
    tags: ['flux', 'internal'],
  },
  operation: 'FluxAPI',
  route: getVersionedRoute('flux/[...path]'),
});

/**
 * POST /api/flux/[...path] - Flux catch-all POST handler
 *
 * Routes POST requests to appropriate Flux handlers based on path segments.
 */
export const POST = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, nextContext, request }) =>
    handleFluxRequest('POST', logger, nextContext, request),
  method: 'POST',
  openapi: {
    description:
      'Routes POST requests to appropriate Flux handlers based on path segments (e.g., /api/flux/discord/direct). Supports dynamic routing for internal services.',
    operationId: 'fluxPost',
    requestBody: {
      description:
        'Request body varies by Flux handler path (e.g., Discord notification payload, webhook data)',
      required: false,
    },
    responses: {
      200: {
        description: 'Request routed successfully',
        example: {
          message: 'Discord notification sent',
          success: true,
        },
        headers: {
          'X-RateLimit-Remaining': {
            description: 'Remaining rate limit requests',
            schema: { type: 'string' },
          },
        },
        schema: fluxResponseSchema,
      },
      404: {
        description: 'Route not found',
        example: {
          error: 'Route not found',
          message: 'No Flux handler found for path: invalid/path',
        },
        schema: errorResponseSchema,
      },
      500: {
        description: 'Internal server error',
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while routing Flux request',
        },
        schema: errorResponseSchema,
      },
    },
    summary: 'Flux catch-all POST handler',
    tags: ['flux', 'internal'],
  },
  operation: 'FluxAPI',
  route: getVersionedRoute('flux/[...path]'),
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
