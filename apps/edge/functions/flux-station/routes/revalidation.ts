/**
 * Revalidation Route
 * Processes revalidation queue: Invalidate Next.js cache tags
 */

import { Constants, type Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  edgeEnv,
  errorResponse,
  initRequestLogging,
  invalidateCacheTags,
  pgmqDelete,
  pgmqRead,
  publicCorsHeaders,
  runWithRetry,
  successResponse,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import {
  createUtilityContext,
  errorToString,
  getProperty,
  logError,
  logWarn,
  TIMEOUT_PRESETS,
  timingSafeEqual,
  withTimeout,
} from '@heyclaude/shared-runtime';

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

// Helper to safely get string property
const getStringProperty = (obj: unknown, key: string): string | undefined => {
  const value = getProperty(obj, key);
  return typeof value === 'string' ? value : undefined;
};

function isValidRevalidationPayload(value: unknown): value is RevalidationPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

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
// Uses canonical enum values from database-types to prevent drift
function isValidContentCategory(
  value: string
): value is DatabaseGenerated['public']['Enums']['content_category'] {
  const validCategories = Constants.public.Enums.content_category;
  return validCategories.includes(value as DatabaseGenerated['public']['Enums']['content_category']);
}

export async function handleRevalidation(_req: Request): Promise<Response> {
  const logContext = createUtilityContext('flux-station', 'content-revalidation', {});
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Starting revalidation processing', logContext);
  
  try {
    // Read messages with timeout protection
    traceStep('Reading revalidation queue', logContext);
    const messages = await withTimeout(
      pgmqRead(CONTENT_REVALIDATION_QUEUE, {
        sleep_seconds: 0,
        n: QUEUE_BATCH_SIZE,
      }),
      TIMEOUT_PRESETS.rpc,
      'Revalidation queue read timed out'
    );

    if (!messages || messages.length === 0) {
      traceRequestComplete(logContext);
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
          const invalidLogContext = createUtilityContext('flux-station', 'content-revalidation', {
            msg_id: msg.msg_id.toString(),
            operation: 'validate-payload',
          });
          logError('Invalid revalidation payload structure', invalidLogContext);

          // Delete invalid message to prevent infinite retries
          try {
            await pgmqDelete(CONTENT_REVALIDATION_QUEUE, msg.msg_id);
          } catch (error) {
            logError('Failed to delete invalid message', invalidLogContext, error);
          }

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
        const secret = getStringProperty(payload, 'secret');
        const expectedSecret = edgeEnv.revalidate.secret;

        // Use timing-safe comparison to prevent timing attacks
        if (!(secret && expectedSecret && timingSafeEqual(secret, expectedSecret))) {
          const unauthorizedLogContext = createUtilityContext(
            'flux-station',
            'content-revalidation',
            {
              msg_id: msg.msg_id.toString(),
              operation: 'authorize',
            }
          );
          logWarn('Content revalidation unauthorized', unauthorizedLogContext);
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
        const errorLogContext = createUtilityContext('flux-station', 'content-revalidation', {
          msg_id: msg.msg_id.toString(),
          operation: 'process-message',
        });
        const errorMsg = errorToString(error);
        logError('Content revalidation failed', errorLogContext, error);
        // Leave in queue for retry
        results.push({
          msg_id: msg.msg_id.toString(),
          status: 'failed',
          errors: [errorMsg],
          will_retry: true,
        });
      }
    }

    traceRequestComplete(logContext);
    return successResponse(
      {
        message: `Processed ${messages.length} messages`,
        processed: messages.length,
        results,
      },
      200
    );
  } catch (error) {
    logError('Content revalidation queue error', logContext, error);
    return errorResponse(error, 'flux-station:revalidation-error', publicCorsHeaders, logContext);
  }
}
