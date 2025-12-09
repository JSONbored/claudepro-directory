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
 * @see {@link packages/web-runtime/src/inngest/functions/changelog/notify.ts | Notification Handler}
 * @see {@link .github/workflows/release.yml | GitHub Actions Workflow}
 */

import 'server-only';
import { timingSafeEqual } from 'node:crypto';

import { Constants, type Database } from '@heyclaude/database-types';
import { buildSecurityHeaders, APP_CONFIG, requireEnvVar } from '@heyclaude/shared-runtime';
import {
  generateOptimizedTitle,
  generateOptimizedDescription,
  extractKeywords,
  generateOGImageUrl,
} from '@heyclaude/web-runtime';
import { logger, normalizeError, createErrorResponse } from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAdminClient,
  badRequestResponse,
  postCorsHeaders,
  pgmqSend,
} from '@heyclaude/web-runtime/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CORS = postCorsHeaders;

// Zod schema for request body validation
const changelogSyncRequestSchema = z.object({
  version: z.string().min(1),
  date: z.string().min(1),
  tldr: z.string().optional(),
  whatChanged: z.string().optional(),
  sections: z.record(z.string(), z.array(z.string())).optional(),
  content: z.string().min(1),
  rawContent: z.string().optional(),
});

/**
 * Validates the authentication token using timing-safe comparison to prevent timing attacks.
 *
 * @param authHeader - The Authorization header value from the request
 * @param expectedToken - The expected token value from environment
 * @param reqLogger - Request-scoped logger for error logging
 * @returns True if token is valid, false otherwise
 */
function validateToken(
  authHeader: null | string,
  expectedToken: string,
  reqLogger: ReturnType<typeof logger.child>
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
 * Generates a slug from version and date.
 * @param version
 * @param date
 
 * @returns {unknown} Description of return value*/
function generateSlug(version: string, date: string): string {
  // Format: 2025-12-07-v1-2-0
  const versionPart = version.replaceAll('.', '-').toLowerCase();
  return `${date}-v${versionPart}`;
}

/**
 * Converts sections object to database format.
 * @param sections
 
 * @returns {unknown} Description of return value*/
function convertSectionsToChanges(
  sections: Record<string, string[]>
): Database['public']['Tables']['changelog']['Row']['changes'] {
  const changes: Database['public']['Tables']['changelog']['Row']['changes'] = {};

  // Map section names to changelog categories using Constants enum
  // Note: Statistics, Technical Details, Deployment are metadata sections, not categories
  const validCategories = Constants.public.Enums.changelog_category;
  const categoryMap: Record<string, Database['public']['Enums']['changelog_category']> = {
    Added: 'Added',
    Changed: 'Changed',
    Fixed: 'Fixed',
    Removed: 'Removed',
    Deprecated: 'Deprecated',
    Security: 'Security',
  };

  for (const [sectionName, items] of Object.entries(sections)) {
    const category = categoryMap[sectionName];
    // Validate category is in enum and items array is non-empty
    if (
      category &&
      validCategories.includes(category) &&
      Array.isArray(items) &&
      items.length > 0
    ) {
      changes[category] = items.map((item) => ({ content: item }));
    }
  }

  return changes;
}

/**
 * POST handler for changelog sync.
 * @param request
 */
export async function POST(request: NextRequest) {
  const reqLogger = logger.child({
    operation: 'ChangelogSyncAPI',
    route: '/api/changelog/sync',
    method: 'POST',
  });

  try {
    // Get environment variable with validation
    let changelogSyncToken: string;
    try {
      changelogSyncToken = requireEnvVar(
        'CHANGELOG_SYNC_TOKEN',
        'CHANGELOG_SYNC_TOKEN is required'
      );
    } catch (error) {
      reqLogger.error({ err: normalizeError(error) }, 'CHANGELOG_SYNC_TOKEN not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...buildSecurityHeaders(),
            ...CORS,
          },
        }
      );
    }

    // Validate authentication
    const authHeader = request.headers.get('authorization');
    if (!validateToken(authHeader, changelogSyncToken, reqLogger)) {
      reqLogger.warn({}, 'Unauthorized changelog sync attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...buildSecurityHeaders(),
            ...CORS,
          },
        }
      );
    }

    // Parse and validate request body with Zod schema
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to parse request body as JSON');
      reqLogger.error(
        {
          err: normalized,
          route: '/api/changelog/sync',
          operation: 'POST',
          method: 'POST',
        },
        'Invalid JSON in request body'
      );
      return badRequestResponse('Invalid JSON in request body', CORS);
    }

    const parseResult = changelogSyncRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map((e) => e.message).join(', ');
      reqLogger.warn(
        {
          errorCount: parseResult.error.issues.length,
          errorMessages: parseResult.error.issues.map((e) => e.message),
        },
        'Invalid request body'
      );
      return badRequestResponse(`Invalid request body: ${errorMessages}`, CORS);
    }

    const { version, date, tldr, whatChanged, sections, content, rawContent } = parseResult.data;

    reqLogger.info(
      {
        version,
        date,
        audit: true,
        action: 'changelog_sync_request',
      },
      'Changelog sync request received'
    );

    // Generate slug
    const slug = generateSlug(version, date);

    // Convert sections to database format (sections is now properly typed)
    const changes = sections ? convertSectionsToChanges(sections) : {};

    // Generate SEO-optimized fields (sections is now properly typed)
    const sectionsForSeo = sections ?? {};
    const seoTitle = generateOptimizedTitle(version, sectionsForSeo);
    const seoDescription = generateOptimizedDescription(sectionsForSeo, date);
    const keywords = extractKeywords(sectionsForSeo);

    // Generate canonical URL and OG image
    const changelogPath = `/changelog/${slug}`;
    const canonicalUrl = `${APP_CONFIG.url}${changelogPath}`;
    const ogImageUrl = generateOGImageUrl(changelogPath);

    // NOTE: Admin client bypasses RLS and is required here because:
    // 1. This is an automated webhook endpoint (GitHub Actions) that needs to bypass RLS
    // 2. Changelog entries are system-generated content, not user-generated
    // 3. The endpoint is protected by Bearer token authentication (CHANGELOG_SYNC_TOKEN)
    // 4. This is a trusted automation source, not user-facing functionality
    // 5. RLS policies on changelog table may restrict access that automation needs

    const supabase = createSupabaseAdminClient();

    // Check if entry already exists
    const { data: existing } = await supabase
      .from('changelog')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      reqLogger.info(
        {
          slug,
          id: existing.id,
          audit: true,
          action: 'changelog_sync_check',
        },
        'Changelog entry already exists'
      );
      return NextResponse.json(
        { success: true, message: 'Entry already exists', id: existing.id },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...buildSecurityHeaders(),
            ...CORS,
          },
        }
      );
    }

    // Prepare changelog entry
    // Note: tldr and whatChanged are both optional, so we use the first available or empty string
    const tldrValue = tldr ?? whatChanged ?? '';
    const rawContentValue = rawContent ?? content;
    const changelogEntry: Database['public']['Tables']['changelog']['Insert'] = {
      title: version,
      slug,
      tldr: tldrValue,
      description: tldrValue,
      content: content,
      raw_content: rawContentValue,
      release_date: date,
      published: true,
      featured: false,
      source: Constants.public.Enums.changelog_source[2], // 'automation'
      changes,
      // SEO fields (optimized)
      seo_title: seoTitle, // SEO-optimized title (53-60 chars)
      seo_description: seoDescription, // SEO-optimized description (150-160 chars)
      keywords: keywords.length > 0 ? keywords : null,
      og_image: ogImageUrl,
      canonical_url: canonicalUrl,
      og_type: 'article', // Changelog entries are articles
      twitter_card: 'summary_large_image',
      robots_index: true,
      robots_follow: true,
      // Metadata (for version display in timeline)
      metadata: {
        version,
      },
    };

    // Insert changelog entry
    const { data: changelogData, error: insertError } = await supabase
      .from('changelog')
      .insert(changelogEntry)
      .select('id')
      .single();

    if (insertError) {
      reqLogger.error(
        {
          err: normalizeError(insertError),
          audit: true,
          action: 'changelog_insert_failed',
          slug,
        },
        'Failed to insert changelog entry'
      );
      throw new Error(`Changelog insert failed: ${insertError.message}`);
    }

    if (!changelogData) {
      throw new Error('Changelog insert returned no data');
    }

    reqLogger.info(
      {
        id: changelogData.id,
        slug,
        audit: true,
        action: 'changelog_insert',
      },
      'Changelog entry inserted'
    );

    // Enqueue notification job (best-effort, non-fatal)
    const notificationJob = {
      entryId: changelogData.id,
      slug,
      title: version,
      tldr: tldrValue,
      sections: sections ?? {},
      releaseDate: date,
    };

    try {
      await pgmqSend('changelog_notify', notificationJob);
      reqLogger.info(
        {
          entryId: changelogData.id,
          audit: true,
          action: 'notification_enqueued',
        },
        'Notification job enqueued'
      );
    } catch (error) {
      // Notification is best-effort - log error but don't fail the request
      reqLogger.error(
        {
          err: normalizeError(error),
          entryId: changelogData.id,
          slug,
          audit: true,
          action: 'notification_enqueue_failed',
        },
        'Failed to enqueue notification (non-fatal)'
      );
    }

    return NextResponse.json(
      {
        success: true,
        id: changelogData.id,
        slug,
        message: 'Changelog entry synced successfully',
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...buildSecurityHeaders(),
          ...CORS,
        },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Changelog sync API error');
    reqLogger.error({ err: normalized }, 'Changelog sync API error');
    return createErrorResponse(normalized, {
      route: '/api/changelog/sync',
      operation: 'ChangelogSyncAPI',
      method: 'POST',
    });
  }
}

/**
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...buildSecurityHeaders(),
      ...CORS,
    },
  });
}
