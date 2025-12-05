/**
 * Email Handlers
 *
 * Handles email-related flux operations:
 * - GET /api/flux/email/count - Newsletter subscriber count
 */

import { NextRequest, NextResponse } from 'next/server';

import { NewsletterService } from '@heyclaude/data-layer';
import { normalizeError } from '@heyclaude/shared-runtime';

import { createSupabaseAdminClient } from '../../supabase/admin';
import { logger, generateRequestId, createWebAppContextWithId } from '../../logging/server';
import { createErrorResponse } from '../../utils/error-handler';

// Cache TTL in seconds (5 minutes)
const NEWSLETTER_COUNT_TTL_SECONDS = 300;

// In-memory cache for serverless
let newsletterCountCache: { value: number; expiresAt: number } | null = null;

/**
 * Get cached newsletter count
 */
async function getCachedNewsletterCount(): Promise<number> {
  const now = Date.now();

  if (newsletterCountCache && newsletterCountCache.expiresAt > now) {
    return newsletterCountCache.value;
  }

  const supabase = createSupabaseAdminClient();
  const service = new NewsletterService(supabase);
  const count = await service.getNewsletterSubscriberCount();

  newsletterCountCache = {
    value: count,
    expiresAt: now + NEWSLETTER_COUNT_TTL_SECONDS * 1000,
  };

  return count;
}

/**
 * GET /api/flux/email/count
 * Returns the current newsletter subscriber count with caching headers
 */
export async function handleEmailCount(_request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const logContext = createWebAppContextWithId(
    requestId,
    '/api/flux/email/count',
    'handleEmailCount'
  );

  try {
    const count = await getCachedNewsletterCount();

    const durationMs = Date.now() - startTime;
    logger.info('Newsletter count retrieved', {
      ...logContext,
      durationMs,
      count,
    });

    const cacheControl = `public, max-age=${NEWSLETTER_COUNT_TTL_SECONDS}, stale-while-revalidate=${NEWSLETTER_COUNT_TTL_SECONDS}`;

    return NextResponse.json(
      { count },
      {
        status: 200,
        headers: {
          'Cache-Control': cacheControl,
          'CDN-Cache-Control': cacheControl,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${NEWSLETTER_COUNT_TTL_SECONDS}, stale-while-revalidate=${NEWSLETTER_COUNT_TTL_SECONDS}`,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to get newsletter count');
    logger.error('Newsletter count failed', normalized, logContext);

    return createErrorResponse(error, {
      route: '/api/flux/email/count',
      operation: 'GET',
      method: 'GET',
      logContext: { requestId },
    });
  }
}
