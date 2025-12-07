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
 * Forward incoming GET requests at /api/inngest to the Inngest runtime handler.
 *
 * Creates a per-request logger for tracing and delegates the Next.js request and context to the underlying Inngest GET handler.
 *
 * @param {NextRequest} request - The incoming Next.js request object for the route.
 * @param {unknown} context - Route handler context provided by Next.js (opaque; forwarded to the Inngest handler).
 * @returns {Promise<Response>} The Response produced by the Inngest runtime handler.
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
    throw normalized;
  }
}

/**
 * Forward POST requests to /api/inngest to the Inngest POST handler while creating a per-request logger.
 *
 * If the underlying handler throws, the error is normalized and logged before being re-thrown.
 *
 * @param request - NextRequest - The incoming request for the API route.
 * @param context - unknown - The Next.js route handler context provided to the API route.
 * @returns Promise<Response> - The HTTP response produced by the Inngest POST handler.
 * @throws Any error thrown by the underlying `inngestPOST` handler is normalized, logged, and then re-thrown.
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
    throw normalized;
  }
}

/**
 * Forward PUT requests to the Inngest sync handler while scoping a per-request logger and normalizing errors.
 *
 * @param request - NextRequest: The Next.js request object for the incoming HTTP request
 * @param context - unknown: The route context forwarded to the Inngest handler
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
    throw normalized;
  }
}
