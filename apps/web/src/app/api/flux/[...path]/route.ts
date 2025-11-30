/**
 * Flux Catch-All API Route
 *
 * Handles all flux operations via dynamic routing:
 * - GET  /api/flux/email/count           -> Newsletter subscriber count
 * - POST /api/flux/discord/direct        -> Send Discord notification
 * - GET  /api/flux/notifications/active  -> Get active notifications
 * - POST /api/flux/notifications/dismiss -> Dismiss notifications
 * - POST /api/flux/revalidation          -> Process revalidation queue
 * - POST /api/flux/webhook/external      -> Process external webhooks
 *
 * This replaces the flux-station Supabase Edge Functions.
 *
 * @see packages/web-runtime/src/flux for implementation
 */

import { normalizeError } from '@heyclaude/shared-runtime';
import { routeFluxRequest, handleOptions } from '@heyclaude/web-runtime/flux';
import { generateRequestId, logger, createErrorResponse  } from '@heyclaude/web-runtime/logging/server';
import { type NextRequest } from 'next/server';

interface RouteContext {
  params: Promise<{
    path: string[];
  }>;
}

/**
 * Handle GET requests for the Flux catch-all API route and forward them to the Flux router.
 *
 * Resolves the dynamic path segments from `context`, creates a request-scoped log context, and delegates
 * processing to the Flux routing implementation.
 *
 * @param request - The incoming Next.js request object for the GET operation.
 * @param context - Route context containing resolved dynamic route parameters; `context.params.path` is the path segments array.
 * @returns A Response object representing the Flux API response for the routed GET request.
 * @see routeFluxRequest
 * @see generateRequestId
 * @see logger
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = generateRequestId();
  const params = await context.params;
  const route = `/api/flux/${params.path.join('/')}`;
  const reqLogger = logger.child({
    requestId,
    operation: 'FluxAPI',
    route,
    method: 'GET',
  });

  try {
    reqLogger.debug('Flux GET request', { path: params.path });
    return await routeFluxRequest('GET', params.path, request);
  } catch (error) {
    const normalized = normalizeError(error, 'Flux GET request failed');
    reqLogger.error('Flux GET request failed', normalized);
    return createErrorResponse(error, {
      route,
      operation: 'FluxAPI:GET',
      method: 'GET',
      logContext: { requestId },
    });
  }
}

/**
 * Handle POST requests for the Flux catch-all API route and forward them to the Flux router.
 *
 * @param {NextRequest} request - The incoming Next.js request for the POST operation.
 * @param {RouteContext} context - Route context containing a promise-resolved `params.path` array of path segments.
 * @returns {Promise<Response>} A Response produced by the Flux router for the given path and request.
 *
 * @see routeFluxRequest
 * @see generateRequestId
 * @see logger
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = generateRequestId();
  const params = await context.params;
  const route = `/api/flux/${params.path.join('/')}`;
  const reqLogger = logger.child({
    requestId,
    operation: 'FluxAPI',
    route,
    method: 'POST',
  });

  try {
    reqLogger.debug('Flux POST request', { path: params.path });
    return await routeFluxRequest('POST', params.path, request);
  } catch (error) {
    const normalized = normalizeError(error, 'Flux POST request failed');
    reqLogger.error('Flux POST request failed', normalized);
    return createErrorResponse(error, {
      route,
      operation: 'FluxAPI:POST',
      method: 'POST',
      logContext: { requestId },
    });
  }
}

/**
 * Handle CORS preflight and OPTIONS requests for the Flux catch-all API route.
 *
 * Delegates to the runtime's `handleOptions` helper to produce the appropriate
 * preflight response with allowed methods and headers.
 *
 * @returns The `Response` produced by `handleOptions`, configured for CORS/preflight.
 * @see {@link @heyclaude/web-runtime/flux~handleOptions}
 */
export function OPTIONS() {
  return handleOptions();
}