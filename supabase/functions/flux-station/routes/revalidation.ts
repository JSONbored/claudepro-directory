/**
 * Revalidation Route
 * Processes revalidation queue: Invalidate Next.js cache tags
 */

import { edgeEnv } from '../../_shared/config/env.ts';
import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';
import { invalidateCacheTags } from '../../_shared/utils/cache.ts';
import { errorToString } from '../../_shared/utils/error-handling.ts';
import { errorResponse, successResponse } from '../../_shared/utils/http.ts';
import { runWithRetry } from '../../_shared/utils/integrations/http-client.ts';
import { createUtilityContext } from '../../_shared/utils/logging.ts';
import { pgmqDelete, pgmqRead } from '../../_shared/utils/pgmq-client.ts';
import { TIMEOUT_PRESETS, withTimeout } from '../../_shared/utils/timeout.ts';

const CONTENT_REVALIDATION_QUEUE = 'revalidation';
const QUEUE_BATCH_SIZE = 10;

// Type guard to validate revalidation payload structure
interface RevalidationPayload {
  type: string;
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown> | null;
  secret?: string;
}

function isValidRevalidationPayload(value: unknown): value is RevalidationPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc?.value;
  };

  const getStringProperty = (obj: unknown, key: string): string | undefined => {
    const value = getProperty(obj, key);
    return typeof value === 'string' ? value : undefined;
  };

  const type = getStringProperty(value, 'type');
  const table = getStringProperty(value, 'table');
  const schema = getStringProperty(value, 'schema');
  const record = getProperty(value, 'record');

  if (!(type && table && schema) || typeof record !== 'object' || record === null) {
    return false;
  }

  return true;
}

// Type guard to validate content_category enum
function isValidContentCategory(
  value: string
): value is DatabaseGenerated['public']['Enums']['content_category'] {
  const validCategories: DatabaseGenerated['public']['Enums']['content_category'][] = [
    'agents',
    'mcp',
    'commands',
    'hooks',
    'rules',
    'statuslines',
    'skills',
    'collections',
    'guides',
  ];
  for (const validCategory of validCategories) {
    if (value === validCategory) {
      return true;
    }
  }
  return false;
}

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

    const results: Array<{
      msg_id: string;
      status: 'success' | 'skipped' | 'failed';
      reason?: string;
      errors?: string[];
      will_retry?: boolean;
    }> = [];
    for (const msg of messages) {
      try {
        // Validate queue message structure
        if (!isValidRevalidationPayload(msg.message)) {
          console.error('[flux-station] Invalid revalidation payload structure', {
            msg_id: msg.msg_id.toString(),
          });
          results.push({
            msg_id: msg.msg_id.toString(),
            status: 'failed',
            errors: ['Invalid message structure'],
            will_retry: false, // Don't retry invalid messages
          });
          continue;
        }

        const payload = msg.message;

        // Verify secret (from database trigger)
        const getProperty = (obj: unknown, key: string): unknown => {
          if (typeof obj !== 'object' || obj === null) {
            return undefined;
          }
          const desc = Object.getOwnPropertyDescriptor(obj, key);
          return desc?.value;
        };

        const getStringProperty = (obj: unknown, key: string): string | undefined => {
          const value = getProperty(obj, key);
          return typeof value === 'string' ? value : undefined;
        };

        const secret = getStringProperty(payload, 'secret');
        if (!secret || secret !== edgeEnv.revalidate.secret) {
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
        const categoryRaw = getStringProperty(record, 'category');
        const category =
          categoryRaw !== null && categoryRaw !== undefined && isValidContentCategory(categoryRaw)
            ? categoryRaw
            : null;
        const slug = getStringProperty(record, 'slug');
        const tagsValue = getProperty(record, 'tags');
        const tags = Array.isArray(tagsValue)
          ? tagsValue.filter((tag): tag is string => typeof tag === 'string')
          : null;

        // Build tags to invalidate
        const tagsToInvalidate = ['content', 'homepage', 'trending'];
        if (tags && Array.isArray(tags)) {
          tagsToInvalidate.push(...tags);
        }

        // Call existing cache invalidation utility (which calls /api/revalidate)
        // Wrap with timeout and retry for reliability
        const contentId = getStringProperty(record, 'id');
        const logContext = createUtilityContext('flux-station', 'content-revalidation', {
          operation: payload.type,
          ...(contentId ? { contentId } : {}),
        });
        await withTimeout(
          runWithRetry(
            () =>
              invalidateCacheTags(tagsToInvalidate, {
                ...(category !== null && category !== undefined ? { category } : {}),
                ...(slug !== null && slug !== undefined ? { slug } : {}),
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
          errors: [errorMsg],
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
