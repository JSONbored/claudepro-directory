/**
 * Revalidation Route
 * Processes revalidation queue: Invalidate Next.js cache tags
 */

import { edgeEnv } from '../../_shared/config/env.ts';
import { invalidateCacheTags } from '../../_shared/utils/cache.ts';
import { errorToString } from '../../_shared/utils/error-handling.ts';
import { errorResponse, successResponse } from '../../_shared/utils/http.ts';
import { runWithRetry } from '../../_shared/utils/integrations/http-client.ts';
import { createUtilityContext } from '../../_shared/utils/logging.ts';
import { pgmqDelete, pgmqRead } from '../../_shared/utils/pgmq-client.ts';
import { TIMEOUT_PRESETS, withTimeout } from '../../_shared/utils/timeout.ts';

const CONTENT_REVALIDATION_QUEUE = 'revalidation';
const QUEUE_BATCH_SIZE = 10;

export async function handleRevalidation(_req: Request): Promise<Response> {
  try {
    // Read messages with timeout protection
    const messages = await withTimeout(
      pgmqRead(CONTENT_REVALIDATION_QUEUE, {
        sleep_seconds: 0,
        n: QUEUE_BATCH_SIZE,
      }),
      TIMEOUT_PRESETS.rpc,
      'Revalidation queue read timed out'
    );

    if (!messages || messages.length === 0) {
      return successResponse({ message: 'No messages in queue', processed: 0 }, 200);
    }

    const results = [];
    for (const msg of messages) {
      try {
        const payload = msg.message as {
          type: string;
          table: string;
          schema: string;
          record: Record<string, unknown>;
          old_record?: Record<string, unknown> | null;
          secret?: string;
        };

        // Verify secret (from database trigger)
        if (!payload.secret || payload.secret !== edgeEnv.revalidate.secret) {
          console.warn('[flux-station] Content revalidation unauthorized', {
            msg_id: msg.msg_id.toString(),
          });
          await pgmqDelete(CONTENT_REVALIDATION_QUEUE, msg.msg_id);
          results.push({
            msg_id: msg.msg_id.toString(),
            status: 'skipped',
            reason: 'unauthorized',
          });
          continue;
        }

        const record = payload.record;
        const category = record.category as string | null;
        const slug = record.slug as string | null;
        const tags = record.tags as string[] | null;

        // Build tags to invalidate
        const tagsToInvalidate = ['content', 'homepage', 'trending'];
        if (tags && Array.isArray(tags)) {
          tagsToInvalidate.push(...tags);
        }

        // Call existing cache invalidation utility (which calls /api/revalidate)
        // Wrap with timeout and retry for reliability
        const logContext = createUtilityContext('flux-station', 'content-revalidation', {
          operation: payload.type,
          contentId: record.id as string | null,
        });
        await withTimeout(
          runWithRetry(
            () =>
              invalidateCacheTags(tagsToInvalidate, {
                category: category || undefined,
                slug: slug || undefined,
                logContext,
              }),
            {
              attempts: 2,
              baseDelayMs: 500,
              logContext,
            }
          ),
          TIMEOUT_PRESETS.external,
          'Cache invalidation timed out'
        );

        await pgmqDelete(CONTENT_REVALIDATION_QUEUE, msg.msg_id);
        results.push({ msg_id: msg.msg_id.toString(), status: 'success' });
      } catch (error) {
        const errorMsg = errorToString(error);
        console.error('[flux-station] Content revalidation failed', {
          msg_id: msg.msg_id.toString(),
          error: errorMsg,
        });
        // Leave in queue for retry
        results.push({
          msg_id: msg.msg_id.toString(),
          status: 'failed',
          error: errorMsg,
          will_retry: true,
        });
      }
    }

    return successResponse(
      {
        message: `Processed ${messages.length} messages`,
        processed: messages.length,
        results,
      },
      200
    );
  } catch (error) {
    console.error('[flux-station] Content revalidation queue error', {
      error: errorToString(error),
    });
    return errorResponse(error, 'flux-station:revalidation-error');
  }
}
