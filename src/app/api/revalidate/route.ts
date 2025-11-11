/**
 * On-Demand ISR Revalidation - Database-First Architecture
 * Called by PostgreSQL trigger when content changes
 *
 * Payload format from PostgreSQL trigger:
 * {
 *   "secret": "REVALIDATE_SECRET",
 *   "category": "agents",
 *   "slug": "code-reviewer"
 * }
 */

import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, category, slug } = body;

    // Verify secret from body (PostgreSQL trigger sends in payload)
    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
      logger.warn('Revalidate webhook unauthorized', {
        hasSecret: !!secret,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    if (!category || typeof category !== 'string') {
      logger.warn('Revalidate webhook invalid payload', {
        hasCategory: !!category,
        categoryType: typeof category,
        bodyKeys: Object.keys(body).join(', '),
      });
      return NextResponse.json(
        { error: 'Missing or invalid category in webhook payload' },
        { status: 400 }
      );
    }

    // Determine paths to revalidate
    const paths: string[] = [];

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

    logger.info('Revalidated paths successfully', {
      category,
      slug: slug || null,
      pathCount: paths.length,
    });

    return NextResponse.json({
      revalidated: true,
      paths,
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
