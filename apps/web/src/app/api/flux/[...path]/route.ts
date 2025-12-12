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
import { createApiRoute, createApiOptionsHandler } from '@heyclaude/web-runtime/server';

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
  route: '/api/flux/[...path]',
  operation: 'FluxAPI',
  method: 'GET',
  cors: 'anon',
  openapi: {
    summary: 'Flux catch-all GET handler',
    description: 'Routes GET requests to appropriate Flux handlers based on path segments (e.g., /api/flux/email/count).',
    tags: ['flux', 'internal'],
    operationId: 'fluxGet',
    responses: {
      200: {
        description: 'Request routed successfully',
      },
      404: {
        description: 'Route not found',
      },
    },
  },
  handler: async ({ logger, request, nextContext }) => {
    // Extract path from Next.js route context
    const context = nextContext as RouteContext;
    if (!context || !context.params) {
      logger.error({}, 'Missing route context for Flux handler');
      throw new Error('Missing route context');
    }

    const params = await context.params;
    
    logger.debug({ path: params.path }, 'Flux GET request');
    
    // Delegate to Flux router
    return await routeFluxRequest('GET', params.path, request);
  },
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
  route: '/api/flux/[...path]',
  operation: 'FluxAPI',
  method: 'POST',
  cors: 'anon',
  openapi: {
    summary: 'Flux catch-all POST handler',
    description: 'Routes POST requests to appropriate Flux handlers based on path segments (e.g., /api/flux/discord/direct).',
    tags: ['flux', 'internal'],
    operationId: 'fluxPost',
    responses: {
      200: {
        description: 'Request routed successfully',
      },
      404: {
        description: 'Route not found',
      },
    },
  },
  handler: async ({ logger, request, nextContext }) => {
    // Extract path from Next.js route context
    const context = nextContext as RouteContext;
    if (!context || !context.params) {
      logger.error({}, 'Missing route context for Flux handler');
      throw new Error('Missing route context');
    }

    const params = await context.params;
    
    logger.debug({ path: params.path }, 'Flux POST request');
    
    // Delegate to Flux router
    return await routeFluxRequest('POST', params.path, request);
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
