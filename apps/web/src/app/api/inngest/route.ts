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
