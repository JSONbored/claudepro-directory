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

import { logger } from '@heyclaude/web-runtime/core';
import { handleApiError } from '@heyclaude/web-runtime/utils/error-handler';
import { generateRequestId } from '@heyclaude/web-runtime/utils/request-context';
import { revalidatePath, revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { secret, category, slug, tags } = body;

    // Verify secret from body (PostgreSQL trigger sends in payload)
    if (!secret || secret !== process.env['REVALIDATE_SECRET']) {
      const duration = Date.now() - startTime;
      logger.warn('Revalidate webhook unauthorized', undefined, {
        requestId: generateRequestId(),
        operation: 'RevalidateAPI',
        route: '/api/revalidate',
        hasSecret: !!secret,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        duration,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paths: string[] = [];
    const invalidatedTags: string[] = [];

    // Path revalidation (existing logic)
    if (category && typeof category === 'string') {
      // Always revalidate homepage (shows recent content)
      paths.push('/');

      // Revalidate category list page
      paths.push(`/${category}`);

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
        const duration = Date.now() - startTime;
        logger.warn('Revalidate webhook: invalid tags', undefined, {
          requestId: generateRequestId(),
          operation: 'RevalidateAPI',
          route: '/api/revalidate',
          invalidTags,
          duration,
        });
        return NextResponse.json(
          { error: 'All tags must be strings', invalidTags },
          { status: 400 }
        );
      }

      // Invalidate each tag
      for (const tag of tags) {
        revalidateTag(tag, 'default');
        invalidatedTags.push(tag);
      }
    }

    // If neither category nor tags provided, return error
    if (!category && (!tags || tags.length === 0)) {
      const duration = Date.now() - startTime;
      logger.warn('Revalidate webhook invalid payload', undefined, {
        requestId: generateRequestId(),
        operation: 'RevalidateAPI',
        route: '/api/revalidate',
        hasCategory: !!category,
        hasTags: Array.isArray(tags),
        bodyKeys: Object.keys(body),
        duration,
      });
      return NextResponse.json(
        { error: 'Missing category or tags in webhook payload' },
        { status: 400 }
      );
    }

    const duration = Date.now() - startTime;
    // Structured logging with revalidation targets, cache tags, and duration
    logger.info('Revalidated successfully', {
      requestId: generateRequestId(),
      operation: 'RevalidateAPI',
      route: '/api/revalidate',
      category: category || null,
      slug: slug || null,
      paths, // Array of revalidated paths - better for querying
      pathCount: paths.length,
      tags: invalidatedTags, // Array support enables better log querying
      tagCount: invalidatedTags.length,
      revalidationTargets: {
        paths,
        tags: invalidatedTags,
      },
      duration,
    });

    return NextResponse.json({
      revalidated: true,
      ...(paths.length > 0 && { paths }),
      ...(invalidatedTags.length > 0 && { tags: invalidatedTags }),
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    return handleApiError(error, {
      route: '/api/revalidate',
      operation: 'RevalidateAPI',
      method: 'POST',
      logContext: { duration },
    });
  }
}
