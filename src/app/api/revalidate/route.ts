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
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, category, slug, tags } = body;

    // Verify secret from body (PostgreSQL trigger sends in payload)
    if (!secret || secret !== process.env['REVALIDATE_SECRET']) {
      logger.warn('Revalidate webhook unauthorized', {
        hasSecret: !!secret,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
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
      logger.warn('Revalidate webhook invalid payload', {
        hasCategory: !!category,
        hasTags: Array.isArray(tags),
        bodyKeys: Object.keys(body), // Array support enables better log querying
      });
      return NextResponse.json(
        { error: 'Missing category or tags in webhook payload' },
        { status: 400 }
      );
    }

    logger.info('Revalidated successfully', {
      category: category || null,
      slug: slug || null,
      paths, // Array of revalidated paths - better for querying
      pathCount: paths.length,
      tags: invalidatedTags, // Array support enables better log querying
      tagCount: invalidatedTags.length,
    });

    return NextResponse.json({
      revalidated: true,
      ...(paths.length > 0 && { paths }),
      ...(invalidatedTags.length > 0 && { tags: invalidatedTags }),
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    return handleApiError(error, {
      route: '/api/revalidate',
      operation: 'revalidate_content_paths',
      method: 'POST',
    });
  }
}
