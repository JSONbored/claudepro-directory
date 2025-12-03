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
 * Forward GET requests from the catch-all /api/flux route to the Flux router.
 *
 * Resolves dynamic path segments from `context`, creates a request-scoped log context, and delegates
 * handling to the Flux routing implementation.
 *
 * @param request - NextRequest — the incoming request for the GET operation
 * @param context - RouteContext — runtime route context whose resolved `params.path` is the array of path segments to route
 * @returns Response — the HTTP response produced by the Flux router for the routed GET request
 * @see routeFluxRequest
 * @see generateRequestId
 * @see logger
 * @see createErrorResponse
 * @see normalizeError
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
 * Forward a POST request to the Flux router for the resolved catch-all path.
 *
 * @param {NextRequest} request - The incoming Next.js POST request to forward.
 * @param {RouteContext} context - Route context whose `params.path` (a resolved promise) contains the dynamic path segments.
 * @returns {Promise<Response>} The HTTP Response produced by the Flux router for the provided path and request.
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
 * Produce the HTTP response for a CORS preflight (OPTIONS) request on the Flux catch-all API route.
 *
 * @returns The `Response` configured for CORS preflight with the allowed methods and headers set.
 * @see handleOptions
 */
export function OPTIONS() {
  return handleOptions();
}