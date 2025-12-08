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
 * @see {@link .github/workflows/auto-release.yml | GitHub Actions Workflow}
 */

import 'server-only';

import type { Database } from '@heyclaude/database-types';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime';
import {
  generateRequestId,
  logger,
  normalizeError,
  createErrorResponse,
} from '@heyclaude/web-runtime/logging/server';
import {
  createSupabaseAdminClient,
  badRequestResponse,
  getOnlyCorsHeaders,
} from '@heyclaude/web-runtime/server';
import {
  generateOptimizedTitle,
  generateOptimizedDescription,
  extractKeywords,
  generateOGImageUrl,
} from '@heyclaude/web-runtime';
import { APP_CONFIG } from '@heyclaude/shared-runtime';
import { NextRequest, NextResponse } from 'next/server';
import { pgmqSend } from '@heyclaude/web-runtime/server';

const CORS = getOnlyCorsHeaders;
const CHANGELOG_SYNC_TOKEN = process.env['CHANGELOG_SYNC_TOKEN'];

/**
 * Validates the authentication token.
 */
function validateToken(authHeader: string | null): boolean {
  if (!CHANGELOG_SYNC_TOKEN) {
    logger.warn('CHANGELOG_SYNC_TOKEN not configured', {
      route: '/api/changelog/sync',
    });
    return false;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  return token === CHANGELOG_SYNC_TOKEN;
}

/**
 * Generates a slug from version and date.
 */
function generateSlug(version: string, date: string): string {
  // Format: 2025-12-07-v1-2-0
  const datePart = date.replace(/-/g, '-');
  const versionPart = version.replace(/\./g, '-').toLowerCase();
  return `${datePart}-v${versionPart}`;
}

/**
 * Converts sections object to database format.
 */
function convertSectionsToChanges(
  sections: Record<string, string[]>
): Database['public']['Tables']['changelog']['Row']['changes'] {
  const changes: Database['public']['Tables']['changelog']['Row']['changes'] = {};

  // Map section names to changelog categories
  // Note: Statistics, Technical Details, Deployment are metadata sections, not categories
  const categoryMap: Record<string, keyof typeof changes> = {
    Added: 'Added',
    Changed: 'Changed',
    Fixed: 'Fixed',
    Removed: 'Removed',
    Deprecated: 'Deprecated',
    Security: 'Security',
  };

  for (const [sectionName, items] of Object.entries(sections)) {
    const category = categoryMap[sectionName];
    if (category && items.length > 0) {
      changes[category] = items.map((item) => ({ content: item }));
    }
  }

  return changes;
}

/**
 * POST handler for changelog sync.
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'ChangelogSyncAPI',
    route: '/api/changelog/sync',
    method: 'POST',
  });

  try {
    // Validate authentication
    const authHeader = request.headers.get('authorization');
    if (!validateToken(authHeader)) {
      reqLogger.warn('Unauthorized changelog sync attempt');
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

    // Parse request body
    const body = await request.json();
    const { version, date, tldr, whatChanged, sections, content, rawContent } = body;

    // Validate required fields
    if (!version || !date || !content) {
      return badRequestResponse('Missing required fields: version, date, content', CORS);
    }

    reqLogger.info('Changelog sync request received', { version, date });

    // Generate slug
    const slug = generateSlug(version, date);

    // Convert sections to database format
    const changes = sections ? convertSectionsToChanges(sections) : {};

    // Generate SEO-optimized fields
    const seoTitle = generateOptimizedTitle(version, sections || {});
    const seoDescription = generateOptimizedDescription(sections || {}, date);
    const keywords = extractKeywords(sections || {});

    // Generate canonical URL and OG image
    const changelogPath = `/changelog/${slug}`;
    const canonicalUrl = `${APP_CONFIG.url}${changelogPath}`;
    const ogImageUrl = generateOGImageUrl(changelogPath);

    // Create Supabase admin client
    const supabase = createSupabaseAdminClient();

    // Check if entry already exists
    const { data: existing } = await supabase
      .from('changelog')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      reqLogger.info('Changelog entry already exists', { slug, id: existing.id });
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
    const changelogEntry: Database['public']['Tables']['changelog']['Insert'] = {
      title: version,
      slug,
      tldr: tldr || whatChanged || '',
      description: tldr || whatChanged || '',
      content: content || rawContent || '',
      raw_content: rawContent || content || '',
      release_date: date,
      published: true,
      featured: false,
      source: 'automation',
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
      reqLogger.error('Failed to insert changelog entry', normalizeError(insertError));
      throw new Error(`Changelog insert failed: ${insertError.message}`);
    }

    reqLogger.info('Changelog entry inserted', { id: changelogData.id, slug });

    // Enqueue notification job
    const notificationJob = {
      entryId: changelogData.id,
      slug,
      title: version,
      tldr: tldr || whatChanged || '',
      sections: sections || {},
      releaseDate: date,
    };

    await pgmqSend('changelog_notify', notificationJob);

    reqLogger.info('Notification job enqueued', { entryId: changelogData.id });

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
    reqLogger.error('Changelog sync API error', normalizeError(error));
    return createErrorResponse(error, {
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
