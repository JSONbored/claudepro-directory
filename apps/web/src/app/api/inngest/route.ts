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
 * Handle GET requests for /api/inngest by delegating to the Inngest runtime while adding per-request logging and error normalization.
 *
 * Creates a request-scoped logger with a generated requestId, logs the incoming request, delegates to the underlying Inngest GET handler, and on failure normalizes and logs the error before re-throwing it.
 *
 * @param {NextRequest} request - Incoming Next.js request for the route.
 * @param {unknown} context - Route handler context provided by Next.js; forwarded to the Inngest handler.
 * @returns {Response} The Response produced by the Inngest runtime handler.
 * @throws {*} Re-throws the original error if the underlying Inngest handler fails.
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
    reqLogger.error('Inngest GET request failed', normalized, {
      requestId,
      operation: 'InngestAPI',
      route: '/api/inngest',
      method: 'GET',
    });
    throw error;
  }
}

/**
 * Add per-request logging and forward POST requests to the Inngest POST handler for /api/inngest.
 *
 * @param {NextRequest} request - The incoming NextRequest for the API route.
 * @param {unknown} context - The Next.js route handler context provided by the framework.
 * @returns {Promise<Response>} The HTTP response produced by the Inngest POST handler.
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
    reqLogger.error('Inngest POST request failed', normalized, {
      requestId,
      operation: 'InngestAPI',
      route: '/api/inngest',
      method: 'POST',
    });
    throw error;
  }
}

/**
 * Handle PUT requests to /api/inngest and delegate to the Inngest sync handler.
 *
 * @param {NextRequest} request - The incoming Next.js request object for this route.
 * @param {unknown} context - Route context forwarded to the Inngest handler.
 * @returns {Response} The response produced by the Inngest PUT handler.
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
    reqLogger.error('Inngest PUT request failed', normalized, {
      requestId,
      operation: 'InngestAPI',
      route: '/api/inngest',
      method: 'PUT',
    });
    throw error;
  }
}