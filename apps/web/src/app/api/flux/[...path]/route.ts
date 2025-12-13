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

import { routeFluxRequest } from '@heyclaude/web-runtime/flux';
import { createApiOptionsHandler, createApiRoute } from '@heyclaude/web-runtime/server';

interface RouteContext {
  params: Promise<{
    path: string[];
  }>;
}

/**
 * GET /api/flux/[...path] - Flux catch-all GET handler
 *
 * Routes GET requests to appropriate Flux handlers based on path segments.
 *
 * @example
 * ```ts
 * // Request - Newsletter subscriber count
 * GET /api/flux/email/count
 *
 * // Response (200)
 * { count: 1234 }
 * ```
 */
export const GET = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, nextContext, request }) => {
    // Extract path from Next.js route context
    const context = nextContext as RouteContext;
    if (!context?.params) {
      logger.error({}, 'Missing route context for Flux handler');
      throw new Error('Missing route context');
    }

    const params = await context.params;

    logger.debug({ path: params.path }, 'Flux GET request');

    // Delegate to Flux router
    return await routeFluxRequest('GET', params.path, request);
  },
  method: 'GET',
  openapi: {
    description:
      'Routes GET requests to appropriate Flux handlers based on path segments (e.g., /api/flux/email/count).',
    operationId: 'fluxGet',
    responses: {
      200: {
        description: 'Request routed successfully',
      },
      404: {
        description: 'Route not found',
      },
    },
    summary: 'Flux catch-all GET handler',
    tags: ['flux', 'internal'],
  },
  operation: 'FluxAPI',
  route: '/api/flux/[...path]',
});

/**
 * POST /api/flux/[...path] - Flux catch-all POST handler
 *
 * Routes POST requests to appropriate Flux handlers based on path segments.
 *
 * @example
 * ```ts
 * // Request - Send Discord notification
 * POST /api/flux/discord/direct
 * Body: { message: "..." }
 *
 * // Response (200)
 * { success: true }
 * ```
 */
export const POST = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, nextContext, request }) => {
    // Extract path from Next.js route context
    const context = nextContext as RouteContext;
    if (!context?.params) {
      logger.error({}, 'Missing route context for Flux handler');
      throw new Error('Missing route context');
    }

    const params = await context.params;

    logger.debug({ path: params.path }, 'Flux POST request');

    // Delegate to Flux router
    return await routeFluxRequest('POST', params.path, request);
  },
  method: 'POST',
  openapi: {
    description:
      'Routes POST requests to appropriate Flux handlers based on path segments (e.g., /api/flux/discord/direct).',
    operationId: 'fluxPost',
    responses: {
      200: {
        description: 'Request routed successfully',
      },
      404: {
        description: 'Route not found',
      },
    },
    summary: 'Flux catch-all POST handler',
    tags: ['flux', 'internal'],
  },
  operation: 'FluxAPI',
  route: '/api/flux/[...path]',
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
