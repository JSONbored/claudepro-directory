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
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
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
  try {
    return await inngestGET(request, context);
  } catch (error) {
    const normalized = normalizeError(error, 'Inngest GET handler failed');
    reqLogger.error('Inngest GET handler failed', normalized);
    throw error;
  }
}

/**
 * Handle POST requests to /api/inngest by delegating to the Inngest POST handler with per-request tracing.
 *
 * Creates a per-request logger and forwards the incoming `request` and `context` to `inngestPOST`; on failure the original error is normalized and logged before being re-thrown.
 *
 * @param request - NextRequest - The incoming request for the API route.
 * @param context - unknown - The Next.js route handler context provided to the API route.
 * @returns Promise<Response> - The HTTP response produced by the Inngest POST handler.
 * @throws Any error thrown by the underlying `inngestPOST` handler is re-thrown after being normalized and logged.
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
  try {
    return await inngestPOST(request, context);
  } catch (error) {
    const normalized = normalizeError(error, 'Inngest POST handler failed');
    reqLogger.error('Inngest POST handler failed', normalized);
    throw error;
  }
}

/**
 * Handle PUT requests to /api/inngest by forwarding the request to the Inngest sync handler while scoping logs and normalizing errors.
 *
 * @param request - The Next.js request object for the incoming HTTP request
 * @param context - The route context forwarded to the Inngest handler
 * @returns The Response produced by the Inngest PUT handler
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
  try {
    return await inngestPUT(request, context);
  } catch (error) {
    const normalized = normalizeError(error, 'Inngest PUT handler failed');
    reqLogger.error('Inngest PUT handler failed', normalized);
    throw error;
  }
}