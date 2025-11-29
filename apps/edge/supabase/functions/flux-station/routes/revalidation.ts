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
  getProperty,
  logError,
  logWarn,
  normalizeError,
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

/**
 * Checks whether a value matches the RevalidationPayload shape.
 *
 * @param value - The value to validate
 * @returns `true` if `value` has non-empty string properties `type`, `table`, `schema` and a non-null object `record`, `false` otherwise.
 */
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
/**
 * Determines whether a string is a valid canonical `content_category` enum value.
 *
 * @param value - The string to validate against the canonical enum values
 * @returns `true` if `value` is a member of the canonical `content_category` enum, `false` otherwise.
 */
function isValidContentCategory(
  value: string
): value is DatabaseGenerated['public']['Enums']['content_category'] {
  const validCategories = Constants.public.Enums.content_category;
  return validCategories.includes(value as DatabaseGenerated['public']['Enums']['content_category']);
}

/**
 * Consume and process messages from the content revalidation queue, validating payloads and secrets, invalidating cache tags for eligible records, and managing queue deletion or retries.
 *
 * @returns A Response whose body is a summary object with `processed` (number) and `results` (array of per-message outcomes: `msg_id`, `status`, optional `reason`/`errors`, and `will_retry`); on unrecoverable failure returns an error response. 
 */
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
          const validationLogContext = {
            ...logContext,
            msg_id: msg.msg_id.toString(),
            operation: 'validate-payload',
          };
          await logError('Invalid revalidation payload structure', validationLogContext);

          // Delete invalid message to prevent infinite retries
          try {
            await pgmqDelete(CONTENT_REVALIDATION_QUEUE, msg.msg_id);
          } catch (error) {
            await logError('Failed to delete invalid message', validationLogContext, error);
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
          const authLogContext = {
            ...logContext,
            msg_id: msg.msg_id.toString(),
            operation: 'authorize',
          };
          await logWarn('Content revalidation unauthorized', authLogContext);
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
        const messageLogContext = {
          ...logContext,
          operation: payload.type,
          ...(contentId ? { contentId } : {}),
        };
        await withTimeout(
          runWithRetry(
            () =>
              invalidateCacheTags(tagsToInvalidate, {
                ...(category !== null && category !== undefined ? { category } : {}),
                ...(slug !== null && slug !== undefined ? { slug } : {}),
                logContext: messageLogContext,
              }),
            {
              attempts: 2,
              baseDelayMs: 500,
              logContext: messageLogContext,
            }
          ),
          TIMEOUT_PRESETS.external,
          'Cache invalidation timed out'
        );

        await pgmqDelete(CONTENT_REVALIDATION_QUEUE, msg.msg_id);
        results.push({ msg_id: msg.msg_id.toString(), status: 'success' });
      } catch (error) {
        const errorLogContext = {
          ...logContext,
          msg_id: msg.msg_id.toString(),
          operation: 'process-message',
        };
        const errorObj = normalizeError(error, 'Content revalidation failed');
        await logError('Content revalidation failed', errorLogContext, errorObj);
        // Leave in queue for retry
        results.push({
          msg_id: msg.msg_id.toString(),
          status: 'failed',
          errors: [errorObj.message],
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
    await logError('Content revalidation queue error', logContext, error);
    return await errorResponse(error, 'flux-station:revalidation-error', publicCorsHeaders, logContext);
  }
}