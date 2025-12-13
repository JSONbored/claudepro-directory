/**
 * Inngest API Route Handler
 *
 * This is the endpoint that Inngest uses to invoke functions.
 * Uses the API route factory for consistent error handling and logging.
 *
 * @see https://www.inngest.com/docs/reference/serve
 */

import 'server-only';

import {
  GET as inngestGET,
  POST as inngestPOST,
  PUT as inngestPUT,
} from '@heyclaude/web-runtime/inngest';
import { createApiOptionsHandler, createApiRoute } from '@heyclaude/web-runtime/server';
import { connection } from 'next/server';

/**
 * GET /api/inngest - Inngest introspection endpoint
 *
 * Handles GET requests from Inngest for function introspection.
 * Delegates to Inngest's GET handler.
 *
 * @example
 * ```ts
 * // Request - Inngest introspection
 * GET /api/inngest
 *
 * // Response (200) - Function definitions
 * { functions: [...] }
 * ```
 */
export const GET = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, nextContext, request }) => {
    // Defer to request time for non-deterministic operations (required for Cache Components)
    await connection();

    logger.debug({ url: request.url }, 'Inngest GET request (introspection)');
    // Delegate to Inngest handler with original request and context
    return await inngestGET(request, nextContext);
  },
  method: 'GET',
  openapi: {
    description:
      'Handles GET requests from Inngest for function introspection. Delegates to Inngest runtime.',
    operationId: 'inngestIntrospection',
    responses: {
      200: {
        description: 'Function definitions returned successfully',
      },
    },
    summary: 'Inngest introspection endpoint',
    tags: ['inngest', 'webhooks'],
  },
  operation: 'InngestAPI',
  route: '/api/inngest',
});

/**
 * POST /api/inngest - Inngest function invocation endpoint
 *
 * Handles POST requests from Inngest to invoke functions.
 * Delegates to Inngest's POST handler.
 *
 * @example
 * ```ts
 * // Request - Inngest function invocation
 * POST /api/inngest
 * Body: { event: {...}, function_id: "..." }
 *
 * // Response (200) - Function execution result
 * { result: {...} }
 * ```
 */
export const POST = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, nextContext, request }) => {
    // Defer to request time for non-deterministic operations (required for Cache Components)
    await connection();

    logger.debug({ url: request.url }, 'Inngest POST request (function invocation)');
    // Delegate to Inngest handler with original request and context
    return await inngestPOST(request, nextContext);
  },
  method: 'POST',
  openapi: {
    description:
      'Handles POST requests from Inngest to invoke functions. Delegates to Inngest runtime.',
    operationId: 'inngestInvoke',
    responses: {
      200: {
        description: 'Function executed successfully',
      },
    },
    summary: 'Inngest function invocation endpoint',
    tags: ['inngest', 'webhooks'],
  },
  operation: 'InngestAPI',
  route: '/api/inngest',
});

/**
 * PUT /api/inngest - Inngest sync endpoint
 *
 * Handles PUT requests from Inngest for function synchronization.
 * Delegates to Inngest's PUT handler.
 *
 * @example
 * ```ts
 * // Request - Inngest sync
 * PUT /api/inngest
 *
 * // Response (200) - Sync completed
 * { synced: true }
 * ```
 */
export const PUT = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, nextContext, request }) => {
    // Defer to request time for non-deterministic operations (required for Cache Components)
    await connection();

    logger.debug({ url: request.url }, 'Inngest PUT request (sync)');
    // Delegate to Inngest handler with original request and context
    return await inngestPUT(request, nextContext);
  },
  method: 'PUT',
  openapi: {
    description:
      'Handles PUT requests from Inngest for function synchronization. Delegates to Inngest runtime.',
    operationId: 'inngestSync',
    responses: {
      200: {
        description: 'Sync completed successfully',
      },
    },
    summary: 'Inngest sync endpoint',
    tags: ['inngest', 'webhooks'],
  },
  operation: 'InngestAPI',
  route: '/api/inngest',
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
