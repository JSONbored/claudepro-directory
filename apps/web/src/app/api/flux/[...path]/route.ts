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
import {
  generateRequestId,
  logger,
  createErrorResponse,
} from '@heyclaude/web-runtime/logging/server';
import { type NextRequest } from 'next/server';

interface RouteContext {
  params: Promise<{
    path: string[];
  }>;
}

type HttpMethod = 'GET' | 'POST';

/**
 * Route a Flux API request to the Flux runtime, build per-request logging, and return the resulting HTTP response.
 *
 * Routes the incoming request to the runtime using the supplied HTTP method and the dynamic path segments resolved from `context.params.path`.
 *
 * @param method - 'GET' or 'POST' indicating the Flux operation to perform
 * @param request - The Next.js request object for the incoming HTTP request
 * @param context - Route context whose `params` promise resolves to an object containing `path: string[]` (dynamic route segments)
 * @returns A Response produced by the Flux runtime for the requested route and method, or an error Response when processing fails
 *
 * @see routeFluxRequest
 * @see normalizeError
 * @see createErrorResponse
 * @see generateRequestId
 * @see logger
 */
async function handleFluxRequest(
  method: HttpMethod,
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  const requestId = generateRequestId();
  const params = await context.params;
  const route = `/api/flux/${params.path.join('/')}`;
  const reqLogger = logger.child({
    requestId,
    operation: 'FluxAPI',
    route,
    method,
  });

  try {
    reqLogger.debug(`Flux ${method} request`, { path: params.path });
    return await routeFluxRequest(method, params.path, request);
  } catch (error) {
    const normalized = normalizeError(error, `Flux ${method} request failed`);
    reqLogger.error(`Flux ${method} request failed`, normalized, {
      path: params.path.join('/'),
    });
    return createErrorResponse(normalized, {
      route,
      operation: `FluxAPI:${method}`,
      method,
      logContext: { requestId, path: params.path.join('/') },
    });
  }
}

/**
 * Handles GET requests for the Flux catch-all API route by delegating to the Flux router.
 *
 * @param request - NextRequest - Incoming Next.js request object for the GET operation.
 * @param context - RouteContext - Route context whose `params.path` resolves to the array of dynamic path segments for this request.
 * @returns Response - The HTTP response produced by the Flux router for this GET request.
 * @see routeFluxRequest
 * @see handleFluxRequest
 * @see generateRequestId
 * @see logger
 */
export async function GET(request: NextRequest, context: RouteContext) {
  return handleFluxRequest('GET', request, context);
}

/**
 * Handle POST requests to the Flux catch-all API route by delegating processing to the Flux router.
 *
 * @param request - The incoming Next.js request for the POST operation.
 * @param context - Route context containing a promise-resolved `params.path` array of path segments.
 * @returns The Response produced by the Flux router for the given path and request.
 *
 * @see routeFluxRequest
 * @see generateRequestId
 * @see logger
 */
export async function POST(request: NextRequest, context: RouteContext) {
  return handleFluxRequest('POST', request, context);
}

/**
 * Produce a CORS preflight response for the Flux catch-all API route.
 *
 * Delegates to the runtime's handleOptions helper to create a Response with
 * appropriate CORS headers and allowed methods for OPTIONS requests.
 *
 * @returns A Response configured for CORS preflight (allowed methods and headers).
 * @see {@link @heyclaude/web-runtime/flux~handleOptions}
 */
export function OPTIONS() {
  return handleOptions();
}
