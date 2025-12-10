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
import { logger, createWebAppContextWithId } from '../../logging/server';
import { createErrorResponse } from '../../utils/error-handler';
import { cacheLife } from 'next/cache';

/**
 * Cached helper function to fetch newsletter subscriber count
 * Uses Cache Components to reduce function invocations (replaces broken in-memory cache)
 * Newsletter count changes frequently, so we use the 'quarter' cacheLife profile
 */
async function getCachedNewsletterCount(): Promise<number> {
  'use cache';
  cacheLife('quarter'); // 15min stale, 5min revalidate, 2hr expire - Newsletter count changes frequently

  const supabase = createSupabaseAdminClient();
  const service = new NewsletterService(supabase);
  return await service.getNewsletterSubscriberCount();
}

/**
 * GET /api/flux/email/count
 * Returns the current newsletter subscriber count with caching headers
 */
export async function handleEmailCount(_request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const logContext = createWebAppContextWithId(
    '/api/flux/email/count',
    'handleEmailCount'
  );

  try {
    const count = await getCachedNewsletterCount();

    const durationMs = Date.now() - startTime;
    logger.info({ ...logContext,
      durationMs,
      count, }, 'Newsletter count retrieved');

    // Cache Components handles HTTP-level caching automatically
    // Additional cache headers for CDN/edge caching
    return NextResponse.json(
      { count },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to get newsletter count');
    logger.error({ err: normalized, ...logContext }, 'Newsletter count failed');

    return createErrorResponse(error, {
      route: '/api/flux/email/count',
      operation: 'GET',
      method: 'GET',
      logContext: {},
    });
  }
}
