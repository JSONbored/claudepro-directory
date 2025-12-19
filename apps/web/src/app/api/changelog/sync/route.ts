/**
 * Changelog Sync API Route
 *
 * Syncs changelog entry from CHANGELOG.md to database and enqueues notification.
 * Called by GitHub Actions after generating changelog and creating tag.
 *
 * **Authentication:**
 * - Requires Bearer token (CHANGELOG_SYNC_TOKEN secret)
 * - Validates token before processing
 *
 * **Request Body:**
 * ```json
 * {
 *   "version": "1.2.0",
 *   "date": "2025-12-07",
 *   "tldr": "Summary",
 *   "whatChanged": "...",
 *   "sections": {
 *     "Added": ["..."],
 *     "Changed": ["..."],
 *     "Fixed": ["..."]
 *   },
 *   "content": "Full markdown content",
 *   "rawContent": "Raw markdown"
 * }
 * ```
 *
 * **What it does:**
 * 1. Validates authentication token
 * 2. Parses changelog entry JSON
 * 3. Generates slug from version/date
 * 4. Inserts into changelog table
 * 5. Enqueues to changelog_notify queue (for Discord notification)
 * 6. Returns success response
 *
 * @example
 * ```ts
 * // Request
 * POST /api/changelog/sync
 * Authorization: Bearer <token>
 * Content-Type: application/json
 *
 * {
 *   "version": "1.2.0",
 *   "date": "2025-12-07",
 *   "content": "..."
 * }
 *
 * // Response (200)
 * {
 *   "success": true,
 *   "id": "...",
 *   "slug": "1-2-0-2025-12-07",
 *   "message": "Changelog entry synced successfully"
 * }
 * ```
 *
 * @see {@link packages/web-runtime/src/inngest/functions/changelog/notify.ts | Notification Handler}
 * @see {@link .github/workflows/release.yml | GitHub Actions Workflow}
 */

import 'server-only';
import { timingSafeEqual } from 'node:crypto';

import { ChangelogService } from '@heyclaude/data-layer';
import { type SyncChangelogEntryArgs } from '@heyclaude/database-types/postgres-types';
import { requireEnvVar } from '@heyclaude/shared-runtime';
import {
  createApiRoute, createOptionsHandler as createApiOptionsHandler, type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import {
  changelogSyncResponseSchema,
  errorResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  jsonResponse,
  postCorsHeaders,
  unauthorizedResponse,
} from '@heyclaude/web-runtime/server/api-helpers';
import { pgmqSend } from '@heyclaude/web-runtime/supabase/pgmq-client';
import { z } from 'zod';

/**
 * Zod schema for changelog sync request body validation
 * Exported for OpenAPI generation
 */
export const changelogSyncRequestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  date: z.string().min(1, 'Date is required'),
  rawContent: z.string().optional(),
  sections: z.record(z.string(), z.array(z.string())).optional(),
  tldr: z.string().optional(),
  version: z.string().min(1, 'Version is required'),
  whatChanged: z.string().optional(),
});

/*****
 *
 * Validates the authentication token using timing-safe comparison to prevent timing attacks.
 * @param {null | string} authHeader
 * @param {string} expectedToken
 * @param {RouteHandlerContext['logger']} reqLogger
 * @returns {boolean} Return value description
 */
function validateToken(
  authHeader: null | string,
  expectedToken: string,
  reqLogger: RouteHandlerContext['logger']
): boolean {
  if (!expectedToken) {
    reqLogger.warn({ route: '/api/changelog/sync' }, 'CHANGELOG_SYNC_TOKEN not configured');
    return false;
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);

  // Convert strings to Buffers for timing-safe comparison
  const tokenBuffer = Buffer.from(token, 'utf8');
  const expectedBuffer = Buffer.from(expectedToken, 'utf8');

  // Length check must happen before timingSafeEqual
  if (tokenBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(tokenBuffer, expectedBuffer);
}

/**
 * POST /api/changelog/sync - Sync changelog entry
 *
 * Syncs changelog entry from CHANGELOG.md to database and enqueues notification.
 * Requires Bearer token authentication (CHANGELOG_SYNC_TOKEN).
 * Database RPC handles all transformations (slug generation, section conversion) internally.
 */
export const POST = createApiRoute({
  bodySchema: changelogSyncRequestSchema,
  cors: 'auth',
  handler: async ({ body, logger, request }) => {
    // Get environment variable with validation
    let changelogSyncToken: string;
    try {
      changelogSyncToken = requireEnvVar(
        'CHANGELOG_SYNC_TOKEN',
        'CHANGELOG_SYNC_TOKEN is required'
      );
    } catch {
      // Log as warning, not error - missing token is an expected auth failure (401), not a server error
      // Don't include error object to avoid hasError/isErrorLevel flags
      logger.warn(
        {
          reason: 'CHANGELOG_SYNC_TOKEN environment variable not set',
          securityEvent: true,
        },
        'CHANGELOG_SYNC_TOKEN not configured - returning 401'
      );
      // Return 401 instead of 500 - missing token is an authentication issue
      return unauthorizedResponse(
        'Server authentication not configured',
        undefined, // No login/signup for automation endpoints
        postCorsHeaders
      );
    }

    // Validate authentication
    const authHeader = request.headers.get('authorization');
    if (!validateToken(authHeader, changelogSyncToken, logger)) {
      logger.warn({}, 'Unauthorized changelog sync attempt');
      return unauthorizedResponse(
        'Invalid or missing Bearer token',
        undefined, // No login/signup for automation endpoints
        postCorsHeaders
      );
    }

    // Zod schema ensures proper types
    const { content, date, rawContent, sections, tldr, version, whatChanged } = body;

    logger.info(
      {
        action: 'changelog_sync_request',
        audit: true,
        date,
        version,
      },
      'Changelog sync request received'
    );

    // SEO fields are auto-generated by database trigger on INSERT
    // Admin client bypasses RLS (required for automated webhook from GitHub Actions)
    const service = new ChangelogService();

    // Database RPC handles all transformations (slug generation, section conversion) internally
    // Build args object, only including optional properties if they have values
    const syncArgs: SyncChangelogEntryArgs = {
      p_content: content,
      p_date: date,
      p_metadata: { version },
      p_version: version,
      ...(tldr && { p_tldr: tldr }),
      ...(whatChanged && { p_what_changed: whatChanged }),
      ...(rawContent && { p_raw_content: rawContent }),
      ...(sections &&
        Object.keys(sections).length > 0 && { p_sections: sections as Record<string, unknown> }),
    };
    const changelogData = await service.syncChangelogEntry(syncArgs);

    if (!changelogData) {
      throw new Error('Changelog upsert returned no data');
    }

    // Check if entry was newly created (created_at === updated_at indicates new entry)
    const isNewEntry = changelogData.created_at === changelogData.updated_at;

    const slug = changelogData.slug;

    if (isNewEntry) {
      logger.info(
        {
          action: 'changelog_insert',
          audit: true,
          id: changelogData.id,
          slug,
        },
        'Changelog entry inserted'
      );
    } else {
      logger.info(
        {
          action: 'changelog_sync_check',
          audit: true,
          id: changelogData.id,
          slug,
        },
        'Changelog entry already exists'
      );
      return jsonResponse(
        { id: changelogData.id, message: 'Entry already exists', success: true },
        200,
        postCorsHeaders
      );
    }

    // Enqueue notification job (best-effort, non-fatal)
    try {
      await pgmqSend('changelog_notify', {
        entryId: changelogData.id,
        releaseDate: date,
        sections: sections ?? {},
        slug,
        title: version,
        tldr: changelogData.tldr ?? tldr ?? whatChanged ?? '',
      });
      logger.info(
        {
          action: 'notification_enqueued',
          audit: true,
          entryId: changelogData.id,
        },
        'Notification job enqueued'
      );
    } catch (error) {
      logger.error(
        {
          action: 'notification_enqueue_failed',
          audit: true,
          entryId: changelogData.id,
          err: normalizeError(error),
          slug,
        },
        'Failed to enqueue notification (non-fatal)'
      );
    }

    return jsonResponse(
      {
        id: changelogData.id,
        message: 'Changelog entry synced successfully',
        slug,
        success: true,
      },
      200,
      postCorsHeaders
    );
  },
  method: 'POST',
  openapi: {
    description:
      'Syncs changelog entry from CHANGELOG.md to database and enqueues notification. Called by GitHub Actions after generating changelog and creating tag. Requires Bearer token authentication.',
    operationId: 'syncChangelog',
    security: [{ bearerAuth: [] }],
    requestBody: {
      description: 'Changelog entry data including version, date, content, and optional metadata (tldr, whatChanged, sections, rawContent)',
      required: true,
    },
    responses: {
      200: {
        description: 'Changelog entry synced successfully',
        schema: changelogSyncResponseSchema,
        headers: {
          'X-RateLimit-Remaining': {
            schema: { type: 'string' },
            description: 'Remaining rate limit requests',
          },
        },
        example: {
          success: true,
          id: 'changelog-entry-123',
          slug: '1-2-0-2025-12-07',
          message: 'Changelog entry synced successfully',
        },
      },
      400: {
        description: 'Invalid request body',
        schema: errorResponseSchema,
        example: {
          error: 'Invalid request body',
          message: 'Content is required',
        },
      },
      401: {
        description: 'Unauthorized - invalid or missing Bearer token',
        schema: errorResponseSchema,
        headers: {
          'WWW-Authenticate': {
            schema: { type: 'string' },
            description: 'Authentication challenge',
          },
        },
        example: {
          error: 'Unauthorized',
          message: 'Invalid or missing Bearer token',
        },
      },
      500: {
        description: 'Internal server error',
        schema: errorResponseSchema,
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while syncing changelog entry',
        },
      },
    },
    summary: 'Sync changelog entry',
    tags: ['changelog', 'sync', 'webhook'],
  },
  operation: 'ChangelogSyncAPI',
  route: getVersionedRoute('changelog/sync'),
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('auth');
