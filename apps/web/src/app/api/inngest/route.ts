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
  errorResponseSchema,
  inngestResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import {
  createApiRoute,
  createOptionsHandler as createApiOptionsHandler,
} from '@heyclaude/web-runtime/api/route-factory';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import {
  GET as inngestGET,
  POST as inngestPOST,
  PUT as inngestPUT,
} from '@heyclaude/web-runtime/inngest/serve';
import { connection, NextRequest } from 'next/server';

// Shared Inngest handler (all methods follow same pattern)
async function handleInngestRequest(
  method: 'GET' | 'POST' | 'PUT',
  handler: typeof inngestGET,
  logger: ReturnType<typeof import('@heyclaude/web-runtime/logging/server').logger.child>,
  request: NextRequest,
  nextContext: unknown
) {
  await connection();
  logger.debug({ method, url: request.url }, `Inngest ${method} request`);
  return await handler(request, nextContext);
}

/**
 * GET /api/inngest - Inngest introspection endpoint
 *
 * Handles GET requests from Inngest for function introspection.
 * Delegates to Inngest's GET handler.
 */
export const GET = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, nextContext, request }) =>
    handleInngestRequest('GET', inngestGET, logger, request, nextContext),
  method: 'GET',
  openapi: {
    description:
      'Handles GET requests from Inngest for function introspection. Delegates to Inngest runtime.',
    operationId: 'inngestIntrospection',
    responses: {
      200: {
        description: 'Function definitions returned successfully',
        example: {
          functions: [
            {
              id: 'changelog/notify',
              name: 'changelog/notify',
              triggers: [{ event: 'changelog/sync' }],
            },
          ],
        },
        headers: {
          'Cache-Control': {
            description: 'Cache control directive',
            schema: { type: 'string' },
          },
        },
        schema: inngestResponseSchema,
      },
      500: {
        description: 'Internal server error',
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while processing Inngest request',
        },
        schema: errorResponseSchema,
      },
    },
    summary: 'Inngest introspection endpoint',
    tags: ['inngest', 'webhooks'],
  },
  operation: 'InngestAPI',
  route: getVersionedRoute('inngest'),
});

/**
 * POST /api/inngest - Inngest function invocation endpoint
 *
 * Handles POST requests from Inngest to invoke functions.
 * Delegates to Inngest's POST handler.
 */
export const POST = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, nextContext, request }) =>
    handleInngestRequest('POST', inngestPOST, logger, request, nextContext),
  method: 'POST',
  openapi: {
    description:
      'Handles POST requests from Inngest to invoke functions. Delegates to Inngest runtime.',
    operationId: 'inngestInvoke',
    requestBody: {
      description: 'Inngest function invocation payload (varies by function)',
      required: false,
    },
    responses: {
      200: {
        description: 'Function executed successfully',
        example: {
          functionId: 'changelog/notify',
          result: { notified: true },
          success: true,
        },
        headers: {
          'X-RateLimit-Remaining': {
            description: 'Remaining rate limit requests',
            schema: { type: 'string' },
          },
        },
        schema: inngestResponseSchema,
      },
      500: {
        description: 'Internal server error',
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while executing Inngest function',
        },
        schema: errorResponseSchema,
      },
    },
    summary: 'Inngest function invocation endpoint',
    tags: ['inngest', 'webhooks'],
  },
  operation: 'InngestAPI',
  route: getVersionedRoute('inngest'),
});

/**
 * PUT /api/inngest - Inngest sync endpoint
 *
 * Handles PUT requests from Inngest for function synchronization.
 * Delegates to Inngest's PUT handler.
 */
export const PUT = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, nextContext, request }) =>
    handleInngestRequest('PUT', inngestPUT, logger, request, nextContext),
  method: 'PUT',
  openapi: {
    description:
      'Handles PUT requests from Inngest for function synchronization. Delegates to Inngest runtime.',
    operationId: 'inngestSync',
    requestBody: {
      description: 'Inngest sync payload (varies by sync type)',
      required: false,
    },
    responses: {
      200: {
        description: 'Sync completed successfully',
        example: {
          success: true,
          synced: true,
        },
        headers: {
          'X-RateLimit-Remaining': {
            description: 'Remaining rate limit requests',
            schema: { type: 'string' },
          },
        },
        schema: inngestResponseSchema,
      },
      500: {
        description: 'Internal server error',
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while syncing Inngest functions',
        },
        schema: errorResponseSchema,
      },
    },
    summary: 'Inngest sync endpoint',
    tags: ['inngest', 'webhooks'],
  },
  operation: 'InngestAPI',
  route: getVersionedRoute('inngest'),
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
