/**
 * Submissions Discord Route
 * Processes discord_submissions queue: Send Discord notifications for content submissions
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  handleContentNotificationDirect,
  handleSubmissionNotificationDirect,
} from '@heyclaude/edge-runtime/handlers/discord/handler.ts';
import { errorResponse, successResponse } from '@heyclaude/edge-runtime/utils/http.ts';
import { pgmqDelete, pgmqRead } from '@heyclaude/edge-runtime/utils/pgmq-client.ts';
import type { DatabaseWebhookPayload } from '@heyclaude/edge-runtime/utils/webhook/database-events.ts';
import { errorToString, TIMEOUT_PRESETS, withTimeout } from '@heyclaude/shared-runtime';

type ContentSubmission = DatabaseGenerated['public']['Tables']['content_submissions']['Row'];

const SUBMISSION_DISCORD_QUEUE = 'discord_submissions';
const QUEUE_BATCH_SIZE = 10;

// Type guard to validate database webhook payload structure
function isValidSubmissionWebhookPayload(
  value: unknown
): value is DatabaseWebhookPayload<ContentSubmission> {
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
function isValidWebhookType(value: string): value is 'INSERT' | 'UPDATE' | 'DELETE' {
  return value === 'INSERT' || value === 'UPDATE' || value === 'DELETE';
}

export async function handleDiscordSubmissions(_req: Request): Promise<Response> {
  try {
    // Read messages with timeout protection
    const messages = await withTimeout(
      pgmqRead(SUBMISSION_DISCORD_QUEUE, {
        sleep_seconds: 0,
        n: QUEUE_BATCH_SIZE,
      }),
      TIMEOUT_PRESETS.rpc,
      'Discord submissions queue read timed out'
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
        if (!isValidSubmissionWebhookPayload(msg.message)) {
          console.error('[flux-station] Invalid submission webhook payload structure', {
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

        // Validate webhook type
        if (!isValidWebhookType(payload.type)) {
          console.error('[flux-station] Invalid webhook type', {
            msg_id: msg.msg_id.toString(),
            type: payload.type,
          });
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
        }

        await pgmqDelete(SUBMISSION_DISCORD_QUEUE, msg.msg_id);
        results.push({ msg_id: msg.msg_id.toString(), status: 'success' });
      } catch (error) {
        const errorMsg = errorToString(error);
        console.error('[flux-station] Submission Discord notification failed', {
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
    console.error('[flux-station] Submission Discord queue error', {
      error: errorToString(error),
    });
    return errorResponse(error, 'flux-station:discord-submissions-error');
  }
}
