/**
 * POST /api/bookmarks/remove - Remove bookmark
 *
 * Removes a bookmark for the authenticated user.
 * Requires authentication.
 *
 * @example
 * ```ts
 * // Request
 * POST /api/bookmarks/remove
 * Body: { content_type: "mcp", content_slug: "my-server" }
 *
 * // Response (200)
 * { success: true, data: { ... } }
 * ```
 */

import 'server-only';

import { removeBookmark } from '@heyclaude/web-runtime/actions/bookmarks';
import {
  bookmarkResponseSchema,
  errorResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import {
  createOptionsHandler as createApiOptionsHandler,
  createApiRoute,
} from '@heyclaude/web-runtime/api/route-factory';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { content_categorySchema } from '@heyclaude/web-runtime/prisma-zod-schemas';
import { jsonResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { connection } from 'next/server';
import { z } from 'zod';

/**
 * Schema for removing a bookmark
 * Exported for OpenAPI generation
 */
export const removeBookmarkSchema = z.object({
  content_slug: z.string(),
  content_type: content_categorySchema,
});

export const POST = createApiRoute({
  bodySchema: removeBookmarkSchema,
  cors: 'auth',
  handler: async ({ body, cors, logger }) => {
    await connection();
    const { content_slug, content_type } = body;

    logger.info(
      {
        contentSlug: content_slug,
        contentType: content_type,
      },
      'Bookmark remove request'
    );

    // Call server action - authedAction handles authentication
    const result = await removeBookmark({
      content_slug,
      content_type,
    });

    // Handle authentication errors (authedAction returns serverError for auth failures)
    if (
      result &&
      typeof result === 'object' &&
      'serverError' in result &&
      (result as { serverError?: string }).serverError
    ) {
      const serverError =
        (result as { serverError?: string }).serverError || 'Internal server error';

      // Check if this is an authentication error
      if (serverError.includes('Unauthorized') || serverError.includes('sign in')) {
        logger.warn({ serverError }, 'Authentication failed');
        return jsonResponse(
          {
            error: 'Unauthorized',
            message: 'Authentication required. Please sign in to continue.',
          },
          401,
          cors
        );
      }

      // Other server errors
      logger.error({ serverError }, 'Action returned serverError');
      return jsonResponse({ error: serverError }, 500, cors);
    }

    // Success - return the action result
    return jsonResponse(result, 200, cors);
  },
  method: 'POST',
  openapi: {
    description:
      'Removes a bookmark for the authenticated user. Requires authentication via authedAction.',
    operationId: 'removeBookmark',
    requestBody: {
      description: 'Bookmark details including content slug and content type',
      required: true,
    },
    responses: {
      200: {
        description: 'Bookmark removed successfully',
        example: {
          data: {
            content_slug: 'my-server',
            content_type: 'mcp',
            id: 'bookmark-123',
          },
          success: true,
        },
        headers: {
          'X-RateLimit-Remaining': {
            description: 'Remaining rate limit requests',
            schema: { type: 'string' },
          },
        },
        schema: bookmarkResponseSchema,
      },
      400: {
        description: 'Invalid request body',
        example: {
          error: 'Invalid request body',
          message: 'content_slug is required and must be a string',
        },
        schema: errorResponseSchema,
      },
      401: {
        description: 'Unauthorized - user not authenticated',
        example: {
          error: 'Unauthorized',
          message: 'Authentication required. Please provide a valid JWT token.',
        },
        headers: {
          'WWW-Authenticate': {
            description: 'Authentication challenge',
            schema: { type: 'string' },
          },
        },
        schema: errorResponseSchema,
      },
      500: {
        description: 'Internal server error',
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while removing the bookmark',
        },
        schema: errorResponseSchema,
      },
    },
    security: [{ bearerAuth: [] }],
    summary: 'Remove bookmark',
    tags: ['bookmarks', 'user'],
  },
  operation: 'BookmarkAPI',
  route: getVersionedRoute('bookmarks/remove'),
});

export const OPTIONS = createApiOptionsHandler('auth');
