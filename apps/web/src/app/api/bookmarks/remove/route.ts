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
import { content_categorySchema } from '@heyclaude/web-runtime/prisma-zod-schemas';
import {
  createApiOptionsHandler,
  createApiRoute,
  getVersionedRoute,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
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
    responses: {
      200: {
        description: 'Bookmark removed successfully',
      },
      400: {
        description: 'Invalid request body',
      },
      401: {
        description: 'Unauthorized - user not authenticated',
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
