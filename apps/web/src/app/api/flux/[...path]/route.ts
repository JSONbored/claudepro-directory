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
 * @param request - The incoming NextRequest for the GET operation.
 * @param context - RouteContext whose resolved `params.path` is the array of path segments to route.
 * @returns The Response produced by the Flux router for the routed GET request.
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
 * Forwards POST requests to the Flux router for the matched catch-all path.
 *
 * @param request - Incoming Next.js request for the POST operation.
 * @param context - Route context whose `params.path` (resolved promise) contains path segments.
 * @returns The Response produced by the Flux router for the given path and request.
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