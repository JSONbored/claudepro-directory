/**
 * Jobs Discord Route
 * Processes discord_jobs queue: Send Discord notifications for job changes
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import type { DatabaseWebhookPayload } from '@heyclaude/edge-runtime';
import {
  errorResponse,
  handleJobNotificationDirect,
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
  normalizeError,
  getProperty,
  logError,
  TIMEOUT_PRESETS,
  withTimeout,
} from '@heyclaude/shared-runtime';

type JobRow = DatabaseGenerated['public']['Tables']['jobs']['Row'];

const JOB_DISCORD_QUEUE = 'discord_jobs';
const QUEUE_BATCH_SIZE = 10;

// Fields that trigger Discord notifications when changed
const JOB_MONITORED_FIELDS = [
  'status',
  'tier',
  'title',
  'company',
  'description',
  'location',
  'salary',
  'remote',
  'type',
  'workplace',
  'experience',
  'category',
] as const;

/**
 * Type guard that validates whether a value matches the DatabaseWebhookPayload<JobRow> shape for job webhooks.
 *
 * Checks that `type` is 'INSERT' | 'UPDATE' | 'DELETE', `table` and `schema` are strings, `record` is a non-null object,
 * and `old_record` is either absent, `null`, or an object.
 *
 * @param value - The value to validate as a `DatabaseWebhookPayload<JobRow]`
 * @returns `true` if `value` matches the expected webhook payload shape for a job, `false` otherwise.
 */
function isValidJobWebhookPayload(value: unknown): value is DatabaseWebhookPayload<JobRow> {
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

/**
 * Checks whether a string is a valid webhook operation type.
 *
 * @param value - The string to validate as a webhook type.
 * @returns `true` if `value` is 'INSERT', 'UPDATE', or 'DELETE', `false` otherwise.
 */
function isValidWebhookType(value: string): value is 'INSERT' | 'UPDATE' | 'DELETE' {
  return value === 'INSERT' || value === 'UPDATE' || value === 'DELETE';
}

/**
 * Process queued job webhook messages and dispatch Discord notifications for relevant INSERT and UPDATE events.
 *
 * Reads a batch of messages, validates and filters payloads (skipping drafts, placeholders, DELETE events, and updates where monitored fields did not change), invokes the direct job-notification handler for eligible items, and deletes or retains queue messages according to outcome.
 *
 * @returns An HTTP Response whose body is a summary object with `processed` (number) and `results` (array). Each result contains `msg_id`, `status` (`success` | `skipped` | `failed`), and optional `reason`, `errors`, and `will_retry` fields indicating whether a failed item will be retried.
 */
export async function handleDiscordJobs(_req: Request): Promise<Response> {
  const logContext = createUtilityContext('flux-station', 'discord-jobs', {});
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Starting Discord jobs queue processing', logContext);
  
  try {
    // Read messages with timeout protection
    traceStep('Reading Discord jobs queue', logContext);
    const messages = await withTimeout(
      pgmqRead(JOB_DISCORD_QUEUE, {
        sleep_seconds: 0,
        n: QUEUE_BATCH_SIZE,
      }),
      TIMEOUT_PRESETS.rpc,
      'Discord jobs queue read timed out'
    );

    if (!messages || messages.length === 0) {
      traceRequestComplete(logContext);
      return successResponse({ message: 'No messages in queue', processed: 0 }, 200);
    }
    
    traceStep(`Processing ${messages.length} Discord job notifications`, logContext);

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
        if (!isValidJobWebhookPayload(msg.message)) {
          const validationLogContext = {
            ...logContext,
            msg_id: msg.msg_id.toString(),
            operation: 'validate-payload',
          };
          await logError('Invalid job webhook payload structure', validationLogContext);

          // Delete invalid message to prevent infinite retries
          try {
            await pgmqDelete(JOB_DISCORD_QUEUE, msg.msg_id);
          } catch (error) {
            // Wrap logError in try-catch to prevent logging errors from blocking execution
            try {
              await logError('Failed to delete invalid message', validationLogContext, error);
            } catch (logErr) {
              // Fallback to console.error if logging itself fails
              console.error('Failed to log error:', logErr);
            }
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
          const typeValidationLogContext = {
            ...logContext,
            msg_id: msg.msg_id.toString(),
            type: payload.type,
            operation: 'validate-type',
          };
          await logError('Invalid webhook type', typeValidationLogContext);

          // Delete invalid message to prevent infinite retries
          try {
            await pgmqDelete(JOB_DISCORD_QUEUE, msg.msg_id);
          } catch (error) {
            await logError('Failed to delete invalid message', typeValidationLogContext, error);
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
        const webhookPayload: DatabaseWebhookPayload<JobRow> = {
          type: payload.type,
          table: payload.table,
          record: payload.record,
          old_record: payload.old_record ?? null,
          schema: payload.schema,
        };

        // Handle DELETE webhook type
        if (payload.type === 'DELETE') {
          // DELETE events don't need Discord notifications for jobs
          // Just delete the message and skip
          await pgmqDelete(JOB_DISCORD_QUEUE, msg.msg_id);
          results.push({
            msg_id: msg.msg_id.toString(),
            status: 'skipped',
            reason: 'DELETE events not handled for job notifications',
          });
          continue;
        }

        // Check trigger conditions (preserved from original triggers)
        if (payload.type === 'INSERT') {
          // Original condition: status != 'draft' AND NOT is_placeholder
          const jobRecord = payload.record;
          if (jobRecord.status === 'draft' || jobRecord.is_placeholder) {
            await pgmqDelete(JOB_DISCORD_QUEUE, msg.msg_id);
            results.push({
              msg_id: msg.msg_id.toString(),
              status: 'skipped',
              reason: 'draft or placeholder',
            });
            continue;
          }
        } else if (payload.type === 'UPDATE') {
          // Original condition: Check if monitored fields changed
          // This is already handled by trigger WHEN clause, but double-check
          const oldRecord = payload.old_record;
          const newRecord = payload.record;
          if (!oldRecord) {
            await pgmqDelete(JOB_DISCORD_QUEUE, msg.msg_id);
            results.push({
              msg_id: msg.msg_id.toString(),
              status: 'skipped',
              reason: 'no old record',
            });
            continue;
          }

          const fieldsChanged = JOB_MONITORED_FIELDS.some(
            (field) => oldRecord[field] !== newRecord[field]
          );

          if (!fieldsChanged) {
            await pgmqDelete(JOB_DISCORD_QUEUE, msg.msg_id);
            results.push({
              msg_id: msg.msg_id.toString(),
              status: 'skipped',
              reason: 'no monitored fields changed',
            });
            continue;
          }
        }

        // Call direct handler (no HTTP, no router)
        await handleJobNotificationDirect(webhookPayload);

        await pgmqDelete(JOB_DISCORD_QUEUE, msg.msg_id);
        results.push({ msg_id: msg.msg_id.toString(), status: 'success' });
      } catch (error) {
        const errorMsg = normalizeError(error, "Operation failed").message;
        const errorLogContext = createUtilityContext('flux-station', 'discord-jobs-notify', {
          msg_id: msg.msg_id.toString(),
        });
        await logError('Job Discord notification failed', errorLogContext, error);
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
    await logError('Job Discord queue error', logContext, error);
    return await errorResponse(error, 'flux-station:discord-jobs-error', publicCorsHeaders, logContext);
  }
}