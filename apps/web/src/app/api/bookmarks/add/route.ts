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
  bookmarkResponseSchema,
  errorResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import {
  createOptionsHandler as createApiOptionsHandler, createApiRoute,
} from '@heyclaude/web-runtime/api/route-factory';
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
    let result;
    try {
      result = await addBookmark({
        content_slug,
        content_type,
        notes: notes || '',
      });
    } catch (error) {
      throw error;
    }
    if (
      result &&
      typeof result === 'object' &&
      'serverError' in result &&
      (result as { serverError?: string }).serverError
    ) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:92',message:'Returning 500 for serverError',data:{serverError:(result as {serverError?:string}).serverError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      logger.error(
        { serverError: (result as { serverError?: string }).serverError },
        'Action returned serverError'
      );
      return jsonResponse(
        { error: (result as { serverError?: string }).serverError || 'Internal server error' },
        500,
        cors
      );
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:102',message:'About to return jsonResponse (success)',data:{resultType:typeof result,statusCode:200},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return jsonResponse(result, 200, cors);
  },
  method: 'POST',
  openapi: {
    description: 'Adds a bookmark for the authenticated user. Requires authentication.',
    operationId: 'addBookmark',
    requestBody: {
      description: 'Bookmark details including content slug, content type, and optional notes',
      required: true,
    },
    responses: {
      200: {
        description: 'Bookmark added successfully',
        example: {
          data: {
            content_slug: 'my-server',
            content_type: 'mcp',
            id: 'bookmark-123',
            notes: 'Optional notes',
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
          message: 'An unexpected error occurred while adding the bookmark',
        },
        schema: errorResponseSchema,
      },
    },
    security: [{ bearerAuth: [] }],
    summary: 'Add bookmark',
    tags: ['bookmarks', 'user'],
  },
  operation: 'BookmarkAPI',
  requireAuth: true,
  route: getVersionedRoute('bookmarks/add'),
});

export const OPTIONS = createApiOptionsHandler('auth');
