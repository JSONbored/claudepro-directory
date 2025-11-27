/**
 * On-Demand ISR Revalidation - Realtime-Based Architecture
 * Called by edge function via Supabase Realtime (logical replication)
 *
 * Flow: Database Trigger → Table Change → Realtime (postgres_changes) → Edge Function → This API Route
 *
 * Payload format from edge function:
 * {
 *   "secret": "REVALIDATE_SECRET",
 *   "category": "agents",
 *   "slug": "code-reviewer",
 *   "tags": ["content", "homepage", "trending"]
 * }
 *
 * Runtime: Node.js (required for revalidatePath/revalidateTag)
 */
export const runtime = 'nodejs';

import { generateRequestId, logger, normalizeError, handleApiError } from '@heyclaude/web-runtime/logging/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Generate single requestId for this API request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'RevalidateAPI',
    route: '/api/revalidate',
    module: 'apps/web/src/app/api/revalidate',
  });

  try {
    const body = (await request.json()) as {
      secret?: unknown;
      category?: unknown;
      slug?: unknown;
      tags?: unknown;
    };
    const { secret, category, slug, tags } = body;

    // Verify secret from body (PostgreSQL trigger sends in payload)
    if (!secret || secret !== process.env['REVALIDATE_SECRET']) {
      reqLogger.warn('Revalidate webhook unauthorized', {
        hasSecret: !!secret,
        ip: request.headers.get('x-forwarded-for') ?? 'unknown',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paths: string[] = [];
    const invalidatedTags: string[] = [];

    // Path revalidation (existing logic)
    if (category && typeof category === 'string') {
      // Always revalidate homepage (shows recent content)
      paths.push('/', `/${category}`);

      // Revalidate detail page if slug provided
      if (slug && typeof slug === 'string') {
        paths.push(`/${category}/${slug}`);
      }

      // Revalidate all paths
      for (const path of paths) {
        revalidatePath(path);
      }
    }

    // Tag invalidation (new logic)
    if (tags && Array.isArray(tags)) {
      // Validate all tags are strings
      const invalidTags = tags.filter((tag) => typeof tag !== 'string');
      if (invalidTags.length > 0) {
        reqLogger.warn('Revalidate webhook: invalid tags', {
          invalidTags,
        });
        return NextResponse.json(
          { error: 'All tags must be strings', invalidTags },
          { status: 400 }
        );
      }

      // Invalidate each tag (tags are validated as strings above)
      for (const tag of tags) {
        if (typeof tag === 'string') {
          revalidateTag(tag, 'default');
          invalidatedTags.push(tag);
        }
      }
    }

    // If neither category nor tags provided, return error
    const tagsArray = Array.isArray(tags) ? tags : [];
    if (!category && tagsArray.length === 0) {
      reqLogger.warn('Revalidate webhook invalid payload', {
        hasCategory: !!category,
        hasTags: Array.isArray(tags),
        bodyKeys: Object.keys(body),
      });
      return NextResponse.json(
        { error: 'Missing category or tags in webhook payload' },
        { status: 400 }
      );
    }

    // Structured logging with revalidation targets and cache tags
    reqLogger.info('Revalidated successfully', {
      ...(typeof category === 'string' ? { category } : {}),
      ...(typeof slug === 'string' ? { slug } : {}),
      paths, // Array of revalidated paths - better for querying
      pathCount: paths.length,
      tags: invalidatedTags.length > 0 ? invalidatedTags : undefined, // Array support enables better log querying
      tagCount: invalidatedTags.length,
      revalidationTargets: {
        paths,
        tags: invalidatedTags,
      },
    });

    return NextResponse.json({
      revalidated: true,
      ...(paths.length > 0 && { paths }),
      ...(invalidatedTags.length > 0 && { tags: invalidatedTags }),
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const normalized = normalizeError(error, 'Revalidate API error');
    reqLogger.error('Revalidate API error', normalized, {
      section: 'error-handling',
    });
    return handleApiError(error, {
      route: '/api/revalidate',
      operation: 'RevalidateAPI',
      method: 'POST',
    });
  }
}
