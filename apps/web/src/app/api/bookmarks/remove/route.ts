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

import { removeBookmark } from '@heyclaude/web-runtime/actions';
import {
  createApiOptionsHandler,
  createApiRoute,
  jsonResponse,
} from '@heyclaude/web-runtime/server';
import { connection } from 'next/server';
import { z } from 'zod';

const removeBookmarkSchema = z.object({
  content_slug: z.string(),
  content_type: z.enum([
    'agents',
    'mcp',
    'rules',
    'commands',
    'hooks',
    'statuslines',
    'skills',
    'collections',
    'guides',
    'jobs',
    'changelog',
  ]),
});

export const POST = createApiRoute({
  bodySchema: removeBookmarkSchema,
  cors: 'auth',
  handler: async ({ body, cors, logger, user }) => {
    // Defer to request time for non-deterministic operations (required for Cache Components)
    await connection();

    if (!user) {
      logger.warn({}, 'Unauthorized bookmark remove attempt');
      return jsonResponse({ error: 'Unauthorized - authentication required' }, 401, cors);
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
  route: '/api/bookmarks/remove',
});

export const OPTIONS = createApiOptionsHandler('auth');
