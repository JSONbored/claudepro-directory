/**
 * Submissions Discord Route
 * Processes discord_submissions queue: Send Discord notifications for content submissions
 */

import type { Database } from '../../../_shared/database-overrides.ts';
import {
  handleContentNotificationDirect,
  handleSubmissionNotificationDirect,
} from '../../../_shared/handlers/discord/handler.ts';
import { errorToString } from '../../../_shared/utils/error-handling.ts';
import { errorResponse, successResponse } from '../../../_shared/utils/http.ts';
import { pgmqDelete, pgmqRead } from '../../../_shared/utils/pgmq-client.ts';
import { TIMEOUT_PRESETS, withTimeout } from '../../../_shared/utils/timeout.ts';
import type { DatabaseWebhookPayload } from '../../../_shared/utils/webhook/database-events.ts';

type ContentSubmission = Database['public']['Tables']['content_submissions']['Row'];

const SUBMISSION_DISCORD_QUEUE = 'discord_submissions';
const QUEUE_BATCH_SIZE = 10;

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
        const payload = msg.message as {
          type: string;
          table: string;
          schema: string;
          record: ContentSubmission;
          old_record?: ContentSubmission | null;
        };

        // Transform payload to DatabaseWebhookPayload format
        const webhookPayload: DatabaseWebhookPayload<ContentSubmission> = {
          type: payload.type as 'INSERT' | 'UPDATE' | 'DELETE',
          table: payload.table,
          record: payload.record,
          old_record: payload.old_record || null,
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
