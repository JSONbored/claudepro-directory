/**
 * Submissions Discord Route
 * Processes discord_submissions queue: Send Discord notifications for content submissions
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import type { DatabaseWebhookPayload } from '@heyclaude/edge-runtime';
import {
  errorResponse,
  handleContentNotificationDirect,
  handleSubmissionNotificationDirect,
  initRequestLogging,
  pgmqDelete,
  pgmqRead,
  publicCorsHeaders,
  successResponse,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import {
  createUtilityContext,
  errorToString,
  getProperty,
  logError,
  TIMEOUT_PRESETS,
  withTimeout,
} from '@heyclaude/shared-runtime';

type ContentSubmission = DatabaseGenerated['public']['Tables']['content_submissions']['Row'];

const SUBMISSION_DISCORD_QUEUE = 'discord_submissions';
const QUEUE_BATCH_SIZE = 10;

/**
 * Checks whether a value matches the expected database webhook payload shape for content submissions.
 *
 * @param value - The value to validate
 * @returns `true` if the value matches `DatabaseWebhookPayload<ContentSubmission>`, `false` otherwise.
 */
function isValidSubmissionWebhookPayload(
  value: unknown
): value is DatabaseWebhookPayload<ContentSubmission> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const getStringProperty = (obj: unknown, key: string): string | undefined => {
    const value = getProperty(obj, key);
    return typeof value === 'string' ? value : undefined;
  };

  const type = getStringProperty(value, 'type');
  const table = getStringProperty(value, 'table');
  const schema = getStringProperty(value, 'schema');
  const record = getProperty(value, 'record');
  const oldRecord = getProperty(value, 'old_record');

  // Validate type is one of the allowed values
  if (type !== 'INSERT' && type !== 'UPDATE' && type !== 'DELETE') {
    return false;
  }

  if (!(table && schema) || typeof record !== 'object' || record === null) {
    return false;
  }

  // old_record is optional, but if present must be object or null
  if (oldRecord !== undefined && oldRecord !== null && typeof oldRecord !== 'object') {
    return false;
  }

  return true;
}

// Type guard to validate webhook type enum
// NOTE: This could be extracted to a shared module, but keeping it local for now
/**
 * Checks whether a string is a valid database webhook type used by the handler.
 *
 * @param value - The input string to validate as a webhook type
 * @returns `true` if `value` is `'INSERT'`, `'UPDATE'`, or `'DELETE'`, `false` otherwise
 */
function isValidWebhookType(value: string): value is 'INSERT' | 'UPDATE' | 'DELETE' {
  return value === 'INSERT' || value === 'UPDATE' || value === 'DELETE';
}

/**
 * Process up to 10 messages from the 'discord_submissions' queue and send Discord notifications for content submissions.
 *
 * Validates each queue message, deletes invalid messages to prevent retries, dispatches INSERT payloads to submission notification handling and UPDATE payloads to content notification handling, skips DELETE payloads, and leaves messages in the queue on handler errors for retry.
 *
 * @returns A Response with a summary object containing `message` (string), `processed` (number), and `results` (array of per-message results with `msg_id`, `status`, and optional `reason`, `errors`, and `will_retry`). In case of a top-level error, returns an error response with code `flux-station:discord-submissions-error`.
 */
export async function handleDiscordSubmissions(_req: Request): Promise<Response> {
  const logContext = createUtilityContext('flux-station', 'discord-submissions', {});
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Starting Discord submissions queue processing', logContext);
  
  try {
    // Read messages with timeout protection
    traceStep('Reading Discord submissions queue', logContext);
    const messages = await withTimeout(
      pgmqRead(SUBMISSION_DISCORD_QUEUE, {
        sleep_seconds: 0,
        n: QUEUE_BATCH_SIZE,
      }),
      TIMEOUT_PRESETS.rpc,
      'Discord submissions queue read timed out'
    );

    if (!messages || messages.length === 0) {
      traceRequestComplete(logContext);
      return successResponse({ message: 'No messages in queue', processed: 0 }, 200, publicCorsHeaders);
    }
    
    traceStep(`Processing ${messages.length} Discord submission notifications`, logContext);

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
        if (!isValidSubmissionWebhookPayload(msg.message)) {
          const invalidLogContext = createUtilityContext(
            'flux-station',
            'discord-submissions-validate',
            {
              msg_id: msg.msg_id.toString(),
            }
          );
          await logError('Invalid submission webhook payload structure', invalidLogContext);

          // Delete invalid message to prevent infinite retries
          try {
            await pgmqDelete(SUBMISSION_DISCORD_QUEUE, msg.msg_id);
          } catch (error) {
            await logError('Failed to delete invalid message', invalidLogContext, error);
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

        // Validate webhook type
        if (!isValidWebhookType(payload.type)) {
          const invalidTypeLogContext = createUtilityContext(
            'flux-station',
            'discord-submissions-validate-type',
            {
              msg_id: msg.msg_id.toString(),
              type: payload.type,
            }
          );
          await logError('Invalid webhook type', invalidTypeLogContext);

          // Delete invalid message to prevent infinite retries
          try {
            await pgmqDelete(SUBMISSION_DISCORD_QUEUE, msg.msg_id);
          } catch (error) {
            await logError('Failed to delete invalid message', invalidTypeLogContext, error);
          }

          results.push({
            msg_id: msg.msg_id.toString(),
            status: 'failed',
            errors: [`Invalid webhook type: ${payload.type}`],
            will_retry: false,
          });
          continue;
        }

        // Transform payload to DatabaseWebhookPayload format
        const webhookPayload: DatabaseWebhookPayload<ContentSubmission> = {
          type: payload.type,
          table: payload.table,
          record: payload.record,
          old_record: payload.old_record ?? null,
          schema: payload.schema,
        };

        if (payload.type === 'INSERT') {
          // Call submission notification handler
          await handleSubmissionNotificationDirect(webhookPayload);
        } else if (payload.type === 'UPDATE') {
          // Call content announcement handler (checks for status='merged' internally)
          await handleContentNotificationDirect(webhookPayload);
        } else if (payload.type === 'DELETE') {
          // DELETE not supported for submissions - skip silently
          await pgmqDelete(SUBMISSION_DISCORD_QUEUE, msg.msg_id);
          results.push({
            msg_id: msg.msg_id.toString(),
            status: 'skipped',
            reason: 'DELETE not supported for submissions',
          });
          continue;
        }

        await pgmqDelete(SUBMISSION_DISCORD_QUEUE, msg.msg_id);
        results.push({ msg_id: msg.msg_id.toString(), status: 'success' });
      } catch (error) {
        const errorMsg = errorToString(error);
        const errorLogContext = createUtilityContext('flux-station', 'discord-submissions-notify', {
          msg_id: msg.msg_id.toString(),
        });
        await logError('Submission Discord notification failed', errorLogContext, error);
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
      200,
      publicCorsHeaders
    );
  } catch (error) {
    await logError('Submission Discord queue error', logContext, error);
    return await errorResponse(
      error,
      'flux-station:discord-submissions-error',
      publicCorsHeaders,
      logContext
    );
  }
}