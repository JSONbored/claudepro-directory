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
  createApiRoute,
  createOptionsHandler as createApiOptionsHandler,
} from '@heyclaude/web-runtime/api/route-factory';
import {
  bookmarkResponseSchema,
  errorResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
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
  handler: async ({ body, cors, logger, user }) => {
    await connection();
    // user is guaranteed (requireAuth: true)
    if (!user) {
      throw new Error('User not authenticated');
    }
    const { content_slug, content_type } = body;

    logger.info(
      {
        contentSlug: content_slug,
        contentType: content_type,
        userId: user.id,
      },
      'Bookmark remove request'
    );

    // Call server action internally
    const result = await removeBookmark({
      content_slug,
      content_type,
    });

    return jsonResponse(result, 200, cors);
  },
  method: 'POST',
  openapi: {
    description: 'Removes a bookmark for the authenticated user. Requires authentication.',
    operationId: 'removeBookmark',
    security: [{ bearerAuth: [] }],
    requestBody: {
      description: 'Bookmark details including content slug and content type',
      required: true,
    },
    responses: {
      200: {
        description: 'Bookmark removed successfully',
        schema: bookmarkResponseSchema,
        headers: {
          'X-RateLimit-Remaining': {
            schema: { type: 'string' },
            description: 'Remaining rate limit requests',
          },
        },
        example: {
          success: true,
          data: {
            id: 'bookmark-123',
            content_slug: 'my-server',
            content_type: 'mcp',
          },
        },
      },
      400: {
        description: 'Invalid request body',
        schema: errorResponseSchema,
        example: {
          error: 'Invalid request body',
          message: 'content_slug is required and must be a string',
        },
      },
      401: {
        description: 'Unauthorized - user not authenticated',
        schema: errorResponseSchema,
        headers: {
          'WWW-Authenticate': {
            schema: { type: 'string' },
            description: 'Authentication challenge',
          },
        },
        example: {
          error: 'Unauthorized',
          message: 'Authentication required. Please provide a valid JWT token.',
        },
      },
      500: {
        description: 'Internal server error',
        schema: errorResponseSchema,
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while removing the bookmark',
        },
      },
    },
    summary: 'Remove bookmark',
    tags: ['bookmarks', 'user'],
  },
  operation: 'BookmarkAPI',
  requireAuth: true,
  route: getVersionedRoute('bookmarks/remove'),
});

export const OPTIONS = createApiOptionsHandler('auth');
