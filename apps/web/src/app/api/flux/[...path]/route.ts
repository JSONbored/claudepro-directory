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
 * Route a Flux API request to the runtime, building per-request logging and returning a HTTP response.
 *
 * @param method - HTTP method for the Flux operation ('GET' or 'POST')
 * @param request - The incoming Next.js request object
 * @param context - Route context containing resolved route params (expects `params.path` as string[])
 * @returns A Response produced by the Flux runtime for the given route and method, or an error Response if processing failed
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
    return createErrorResponse(error, {
      route,
      operation: `FluxAPI:${method}`,
      method,
      logContext: { requestId, path: params.path.join('/') },
    });
  }
}

/**
 * Handles GET requests for the Flux catch-all API route and forwards them to the Flux router.
 *
 * Resolves dynamic path segments from `context`, creates a request-scoped log context, and delegates
 * processing to the Flux routing implementation.
 *
 * @param request - NextRequest: The incoming Next.js request object for the GET operation.
 * @param context - RouteContext: Route context containing resolved dynamic route parameters; `context.params.path` is the path segments array.
 * @returns Response: The Response object produced by the Flux router for this GET request.
 * @see routeFluxRequest
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