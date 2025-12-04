/**
 * Inngest API Route Handler
 *
 * This is the endpoint that Inngest uses to invoke functions.
 * Wraps the Inngest serve handlers with logging for observability.
 *
 * @see https://www.inngest.com/docs/reference/serve
 */

import {
  GET as inngestGET,
  POST as inngestPOST,
  PUT as inngestPUT,
} from '@heyclaude/web-runtime/inngest';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import { type NextRequest } from 'next/server';

/**
 * Handle GET requests to /api/inngest by forwarding the incoming Next.js request to the Inngest runtime handler.
 *
 * Creates a per-request logger and delegates processing to the underlying Inngest GET handler.
 *
 * @param request - The incoming Next.js request object for the route.
 * @param context - Route handler context provided by Next.js (opaque; forwarded to the Inngest handler).
 * @returns The Response produced by the Inngest runtime handler.
 *
 * @see {@link @heyclaude/web-runtime/inngest~GET} - Underlying Inngest GET handler
 * @see {@link @heyclaude/web-runtime/logging/server~generateRequestId} - Request ID generator used for tracing
 * @see {@link @heyclaude/web-runtime/logging/server~logger} - Logger used to create a per-request child logger
 */
export async function GET(request: NextRequest, context: unknown) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'InngestAPI',
    route: '/api/inngest',
    method: 'GET',
  });
  reqLogger.debug('Inngest GET request (introspection)');
  return inngestGET(request, context);
}

/**
 * Handle POST requests to /api/inngest by adding per-request logging and delegating to the Inngest POST handler.
 *
 * @param request - The incoming NextRequest for the API route.
 * @param context - The Next.js route handler context (framework-provided).
 * @returns The HTTP response produced by the Inngest POST handler.
 *
 * @see {@link inngestPOST}
 * @see {@link generateRequestId}
 * @see {@link logger}
 */
export async function POST(request: NextRequest, context: unknown) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'InngestAPI',
    route: '/api/inngest',
    method: 'POST',
  });
  reqLogger.debug('Inngest POST request (function invocation)');
  return inngestPOST(request, context);
}

/**
 * Handle PUT requests to /api/inngest by creating a request-scoped logger and delegating to the Inngest sync handler.
 *
 * @param request - The Next.js request object for the incoming HTTP request.
 * @param context - The route context passed through to the Inngest handler.
 * @returns The Response produced by the underlying Inngest PUT handler.
 * @see {@link @heyclaude/web-runtime/inngest#PUT}
 * @see {@link @heyclaude/web-runtime/logging/server.generateRequestId}
 * @see {@link @heyclaude/web-runtime/logging/server.logger}
 */
export async function PUT(request: NextRequest, context: unknown) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'InngestAPI',
    route: '/api/inngest',
    method: 'PUT',
  });
  reqLogger.debug('Inngest PUT request (sync)');
  return inngestPUT(request, context);
}
