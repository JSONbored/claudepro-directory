/**
 * Revalidation Handlers
 *
 * Handles cache revalidation operations:
 * - POST /api/flux/revalidation - Process revalidation queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

import { Constants, type Database as DatabaseGenerated } from '@heyclaude/database-types';
import { getEnvVar, normalizeError } from '@heyclaude/shared-runtime';

import { pgmqRead, pgmqDelete } from '../../supabase/pgmq-client';
import { logger, createWebAppContextWithId } from '../../logging/server';
import { createErrorResponse } from '../../utils/error-handler';

// CORS headers
const REVALIDATION_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CONTENT_REVALIDATION_QUEUE = 'revalidation';
const QUEUE_BATCH_SIZE = 10;

interface RevalidationPayload {
  type: string;
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown> | null;
  secret?: string;
}

/**
 * Validate revalidation payload structure
 */
function isValidRevalidationPayload(value: unknown): value is RevalidationPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  const type = obj['type'];
  const table = obj['table'];
  const schema = obj['schema'];
  const record = obj['record'];

  if (
    typeof type !== 'string' ||
    typeof table !== 'string' ||
    typeof schema !== 'string' ||
    typeof record !== 'object' ||
    record === null
  ) {
    return false;
  }

  return true;
}

/**
 * Validate content_category enum
 */
function isValidContentCategory(
  value: string
): value is DatabaseGenerated['public']['Enums']['content_category'] {
  const validCategories = Constants.public.Enums.content_category;
  return validCategories.includes(value as DatabaseGenerated['public']['Enums']['content_category']);
}

/**
 * Timing-safe string comparison
 * Compares in constant time regardless of string length to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  // Pad to max length to avoid length leak
  const maxLen = Math.max(a.length, b.length);
  let result = 0;
  for (let i = 0; i < maxLen; i++) {
    const aChar = i < a.length ? a.charCodeAt(i) : 0;
    const bChar = i < b.length ? b.charCodeAt(i) : 0;
    result |= aChar ^ bChar;
  }
  // Also verify lengths match
  return result === 0 && a.length === b.length;
}

/**
 * POST /api/flux/revalidation
 * Process revalidation queue and invalidate Next.js cache tags
 * 
 * NOTE: revalidateTag() must be called from Next.js server context, so this
 * cannot be moved to Inngest. The handler processes the queue synchronously
 * which is necessary for revalidateTag() to work correctly.
 * 
 * This endpoint is called infrequently (only when content changes via database triggers),
 * so it's not a major source of function invocations. The current approach is optimal.
 */
export async function handleRevalidation(_request: NextRequest): Promise<NextResponse> {
  const logContext = createWebAppContextWithId(
    '/api/flux/revalidation',
    'handleRevalidation'
  );

  try {
    // Read messages from queue
    const messages = await pgmqRead<RevalidationPayload>(CONTENT_REVALIDATION_QUEUE, {
      vt: 30,
      qty: QUEUE_BATCH_SIZE,
    });

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { message: 'No messages in queue', processed: 0 },
        { status: 200, headers: REVALIDATION_CORS_HEADERS }
      );
    }

    const expectedSecret = getEnvVar('REVALIDATE_SECRET');
    const results: Array<{
      msg_id: string;
      status: 'success' | 'skipped' | 'failed';
      reason?: string;
      errors?: string[];
      will_retry?: boolean;
    }> = [];

    for (const msg of messages) {
      try {
        // Validate payload structure
        if (!isValidRevalidationPayload(msg.message)) {
          logger.warn({ ...logContext,
            msgId: String(msg.msg_id), }, 'Invalid revalidation payload structure');

          // Delete invalid message
          await pgmqDelete(CONTENT_REVALIDATION_QUEUE, msg.msg_id);
          results.push({
            msg_id: String(msg.msg_id),
            status: 'failed',
            errors: ['Invalid message structure'],
            will_retry: false,
          });
          continue;
        }

        const payload = msg.message;

        // Verify secret
        const secret = payload.secret;
        if (!(secret && expectedSecret && timingSafeEqual(secret, expectedSecret))) {
          logger.warn({ ...logContext,
            msgId: String(msg.msg_id), }, 'Revalidation unauthorized');
          await pgmqDelete(CONTENT_REVALIDATION_QUEUE, msg.msg_id);
          results.push({
            msg_id: String(msg.msg_id),
            status: 'skipped',
            reason: 'unauthorized',
          });
          continue;
        }

        const record = payload.record;
        const categoryRaw = record['category'] as string | undefined;
        const category = categoryRaw && isValidContentCategory(categoryRaw) ? categoryRaw : null;
        const slug = record['slug'] as string | undefined;
        const tags = record['tags'] as string[] | undefined;

        // Build tags to invalidate
        const tagsToInvalidate = ['content', 'homepage', 'trending'];
        if (category) {
          tagsToInvalidate.push(category);
        }
        if (category && slug) {
          tagsToInvalidate.push(`${category}-${slug}`);
        }
        if (tags && Array.isArray(tags)) {
          tagsToInvalidate.push(...tags.filter((t): t is string => typeof t === 'string'));
        }

        // Invalidate cache tags
        // Using 'max' profile for stale-while-revalidate semantics (Next.js 16+)
        for (const tag of tagsToInvalidate) {
          try {
            revalidateTag(tag, 'max');
          } catch {
            // revalidateTag may fail in some contexts, but that's okay
          }
        }

        await pgmqDelete(CONTENT_REVALIDATION_QUEUE, msg.msg_id);
        results.push({ msg_id: String(msg.msg_id), status: 'success' });

        logger.info({ ...logContext,
          msgId: String(msg.msg_id),
          tags: tagsToInvalidate, }, 'Cache tags invalidated');
      } catch (error) {
        const errorObj = normalizeError(error, 'Revalidation failed');
        logger.warn({ ...logContext,
          msgId: String(msg.msg_id),
          errorMessage: errorObj.message, }, 'Revalidation message failed');
        // Leave in queue for retry
        results.push({
          msg_id: String(msg.msg_id),
          status: 'failed',
          errors: [errorObj.message],
          will_retry: true,
        });
      }
    }

    logger.info({ ...logContext,
      processed: messages.length,
      results, }, 'Revalidation processing completed');

    return NextResponse.json(
      {
        message: `Processed ${messages.length} messages`,
        processed: messages.length,
        results,
      },
      { status: 200, headers: REVALIDATION_CORS_HEADERS }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Revalidation queue error');
    logger.error({ err: normalized, ...logContext }, 'Revalidation queue error');

    return createErrorResponse(error, {
      route: '/api/flux/revalidation',
      operation: 'POST',
      method: 'POST',
      logContext: {},
    });
  }
}
