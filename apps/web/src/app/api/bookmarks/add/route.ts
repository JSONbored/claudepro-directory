/**
 * POST /api/bookmarks/add - Add bookmark
 *
 * Adds a bookmark for the authenticated user.
 * Requires authentication.
 *
 * @example
 * ```ts
 * // Request
 * POST /api/bookmarks/add
 * Body: { content_type: "mcp", content_slug: "my-server", notes: "Optional notes" }
 *
 * // Response (200)
 * { success: true, data: { ... } }
 * ```
 */

import 'server-only';

import { addBookmark } from '@heyclaude/web-runtime/actions/bookmarks';
import {
  createApiRoute, createOptionsHandler as createApiOptionsHandler,
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
 * Schema for adding a bookmark
 * Exported for OpenAPI generation
 */
export const addBookmarkSchema = z.object({
  content_slug: z.string(),
  content_type: content_categorySchema,
  notes: z.string().optional(),
});

export const POST = createApiRoute({
  bodySchema: addBookmarkSchema,
  cors: 'auth',
  handler: async ({ body, cors, logger, user }) => {
    await connection();
    // user is guaranteed (requireAuth: true)
    if (!user) {
      throw new Error('User not authenticated');
    }
    const { content_slug, content_type, notes } = body;

    logger.info(
      {
        contentSlug: content_slug,
        contentType: content_type,
        userId: user.id,
      },
      'Bookmark add request'
    );

    // Call server action internally
    const result = await addBookmark({
      content_slug,
      content_type,
      notes: notes || '',
    });

    return jsonResponse(result, 200, cors);
  },
  method: 'POST',
  openapi: {
    description: 'Adds a bookmark for the authenticated user. Requires authentication.',
    operationId: 'addBookmark',
    security: [{ bearerAuth: [] }],
    requestBody: {
      description: 'Bookmark details including content slug, content type, and optional notes',
      required: true,
    },
    responses: {
      200: {
        description: 'Bookmark added successfully',
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
            notes: 'Optional notes',
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
          message: 'An unexpected error occurred while adding the bookmark',
        },
      },
    },
    summary: 'Add bookmark',
    tags: ['bookmarks', 'user'],
  },
  operation: 'BookmarkAPI',
  requireAuth: true,
  route: getVersionedRoute('bookmarks/add'),
});

export const OPTIONS = createApiOptionsHandler('auth');
