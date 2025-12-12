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
import { type Database } from '@heyclaude/database-types';
import { requireEnvVar } from '@heyclaude/shared-runtime';
import { createApiRoute, createApiOptionsHandler, unauthorizedResponse, postCorsHeaders } from '@heyclaude/web-runtime/server';
import { normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAdminClient,
  pgmqSend,
} from '@heyclaude/web-runtime/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Zod schema for changelog sync request body validation
 */
const changelogSyncRequestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  date: z.string().min(1, 'Date is required'),
  rawContent: z.string().optional(),
  sections: z.record(z.string(), z.array(z.string())).optional(),
  tldr: z.string().optional(),
  version: z.string().min(1, 'Version is required'),
  whatChanged: z.string().optional(),
});

/**
 * Validates the authentication token using timing-safe comparison to prevent timing attacks.
 *
 * @param authHeader - The Authorization header value from the request
 * @param expectedToken - The expected token value from environment
 * @param logger - Request-scoped logger for error logging
 * @returns True if token is valid, false otherwise
 */
function validateToken(
  authHeader: null | string,
  expectedToken: string,
  logger: ReturnType<typeof import('@heyclaude/web-runtime/logging/server').logger.child>
): boolean {
  if (!expectedToken) {
    logger.warn({ route: '/api/changelog/sync' }, 'CHANGELOG_SYNC_TOKEN not configured');
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

// All client-side transformations (slug generation, section conversion) moved to database RPC
// This eliminates CPU-intensive string manipulation and object mapping (10-15% CPU savings)
// Database RPC sync_changelog_entry handles all transformations internally

/**
 * POST /api/changelog/sync - Sync changelog entry
 * 
 * Syncs changelog entry from CHANGELOG.md to database and enqueues notification.
 * Requires Bearer token authentication (CHANGELOG_SYNC_TOKEN).
 */
export const POST = createApiRoute({
  route: '/api/changelog/sync',
  operation: 'ChangelogSyncAPI',
  method: 'POST',
  cors: 'auth',
  bodySchema: changelogSyncRequestSchema,
  openapi: {
    summary: 'Sync changelog entry',
    description: 'Syncs changelog entry from CHANGELOG.md to database and enqueues notification. Called by GitHub Actions after generating changelog and creating tag. Requires Bearer token authentication.',
    tags: ['changelog', 'sync', 'webhook'],
    operationId: 'syncChangelog',
    responses: {
      200: {
        description: 'Changelog entry synced successfully',
      },
      401: {
        description: 'Unauthorized - invalid or missing Bearer token',
      },
      400: {
        description: 'Invalid request body',
      },
    },
  },
  handler: async ({ logger, request, body }) => {
    // Get environment variable with validation
    let changelogSyncToken: string;
    try {
      changelogSyncToken = requireEnvVar(
        'CHANGELOG_SYNC_TOKEN',
        'CHANGELOG_SYNC_TOKEN is required'
      );
    } catch (error) {
      // Log as warning, not error - missing token is an expected auth failure (401), not a server error
      // Don't include error object to avoid hasError/isErrorLevel flags
      logger.warn(
        {
          securityEvent: true,
          reason: 'CHANGELOG_SYNC_TOKEN environment variable not set',
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

    // Note: SEO fields (seo_title, seo_description, keywords, canonical_url, etc.) are now
    // auto-generated by database trigger generate_changelog_seo_fields_trigger() on INSERT.
    // The trigger analyzes the changes JSONB and generates optimized SEO fields automatically.

    // NOTE: Admin client bypasses RLS and is required here because:
    // 1. This is an automated webhook endpoint (GitHub Actions) that needs to bypass RLS
    // 2. Changelog entries are system-generated content, not user-generated
    // 3. The endpoint is protected by Bearer token authentication (CHANGELOG_SYNC_TOKEN)
    // 4. This is a trusted automation source, not user-facing functionality
    // 5. RLS policies on changelog table may restrict access that automation needs

    const supabase = createSupabaseAdminClient();
    const service = new ChangelogService(supabase);

    // Database RPC handles all transformations (slug generation, section conversion) internally
    // This eliminates CPU-intensive client-side processing (10-15% CPU savings)
    const baseArgs = {
      p_content: content,
      p_date: date,
      p_metadata: {
        version,
      },
      p_version: version,
    } satisfies Pick<
      Database['public']['Functions']['sync_changelog_entry']['Args'],
      'p_content' | 'p_date' | 'p_metadata' | 'p_version'
    >;

    const optionalArgs: Partial<
      Pick<
        Database['public']['Functions']['sync_changelog_entry']['Args'],
        'p_raw_content' | 'p_sections' | 'p_tldr' | 'p_what_changed'
      >
    > = {};
    if (tldr) optionalArgs.p_tldr = tldr;
    if (whatChanged) optionalArgs.p_what_changed = whatChanged;
    if (rawContent) optionalArgs.p_raw_content = rawContent;
    if (sections && Object.keys(sections).length > 0) {
      // TypeScript needs explicit type assertion here because sections could be undefined
      // but we've already checked it exists and has keys
      optionalArgs.p_sections =
        sections satisfies Database['public']['Functions']['sync_changelog_entry']['Args']['p_sections'];
    }

    const syncArgs = {
      ...baseArgs,
      ...optionalArgs,
    } satisfies Database['public']['Functions']['sync_changelog_entry']['Args'];
    const changelogData = await service.syncChangelogEntry(syncArgs);

    if (!changelogData) {
      throw new Error('Changelog upsert returned no data');
    }

    // Check if entry was newly created or already existed
    // If created_at equals updated_at, it's a new entry (they're set to same timestamp on insert)
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
      return NextResponse.json(
        { id: changelogData.id, message: 'Entry already exists', success: true },
        {
          headers: {
            'Content-Type': 'application/json',
            ...postCorsHeaders,
          },
          status: 200,
        }
      );
    }

    // Enqueue notification job (best-effort, non-fatal)
    const tldrValue = changelogData.tldr ?? tldr ?? whatChanged ?? '';
    const notificationJob = {
      entryId: changelogData.id,
      releaseDate: date,
      sections: sections ?? {},
      slug,
      title: version,
      tldr: tldrValue,
    };

    try {
      await pgmqSend('changelog_notify', notificationJob);
      logger.info(
        {
          action: 'notification_enqueued',
          audit: true,
          entryId: changelogData.id,
        },
        'Notification job enqueued'
      );
    } catch (error) {
      // Notification is best-effort - log error but don't fail the request
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

    return NextResponse.json(
      {
        id: changelogData.id,
        message: 'Changelog entry synced successfully',
        slug,
        success: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...postCorsHeaders,
        },
        status: 200,
      }
    );
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('auth');
