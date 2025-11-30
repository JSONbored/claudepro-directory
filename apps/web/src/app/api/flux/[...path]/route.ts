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

import { routeFluxRequest, handleOptions } from '@heyclaude/web-runtime/flux';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
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
  const reqLogger = logger.child({
    requestId,
    operation: 'FluxAPI',
    route: `/api/flux/${params.path.join('/')}`,
    method: 'GET',
  });
  reqLogger.debug('Flux GET request', { path: params.path });
  return routeFluxRequest('GET', params.path, request);
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
  const reqLogger = logger.child({
    requestId,
    operation: 'FluxAPI',
    route: `/api/flux/${params.path.join('/')}`,
    method: 'POST',
  });
  reqLogger.debug('Flux POST request', { path: params.path });
  return routeFluxRequest('POST', params.path, request);
}

/**
 * Produce a CORS preflight response for the Flux catch-all API route.
 *
 * @returns The HTTP Response configured for CORS preflight, including allowed methods and headers.
 */
export function OPTIONS() {
  return handleOptions();
}