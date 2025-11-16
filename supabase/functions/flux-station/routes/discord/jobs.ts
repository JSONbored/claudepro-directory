/**
 * Jobs Discord Route
 * Processes discord_jobs queue: Send Discord notifications for job changes
 */

import type { Database } from '../../../_shared/database-overrides.ts';
import { handleJobNotificationDirect } from '../../../_shared/handlers/discord/handler.ts';
import { errorToString } from '../../../_shared/utils/error-handling.ts';
import { errorResponse, successResponse } from '../../../_shared/utils/http.ts';
import { pgmqDelete, pgmqRead } from '../../../_shared/utils/pgmq-client.ts';
import { TIMEOUT_PRESETS, withTimeout } from '../../../_shared/utils/timeout.ts';
import type { DatabaseWebhookPayload } from '../../../_shared/utils/webhook/database-events.ts';

type JobRow = Database['public']['Tables']['jobs']['Row'];

const JOB_DISCORD_QUEUE = 'discord_jobs';
const QUEUE_BATCH_SIZE = 10;

export async function handleDiscordJobs(_req: Request): Promise<Response> {
  try {
    // Read messages with timeout protection
    const messages = await withTimeout(
      pgmqRead(JOB_DISCORD_QUEUE, {
        sleep_seconds: 0,
        n: QUEUE_BATCH_SIZE,
      }),
      TIMEOUT_PRESETS.rpc,
      'Discord jobs queue read timed out'
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
          record: JobRow;
          old_record?: JobRow | null;
        };

        // Transform payload to DatabaseWebhookPayload format
        const webhookPayload: DatabaseWebhookPayload<JobRow> = {
          type: payload.type as 'INSERT' | 'UPDATE' | 'DELETE',
          table: payload.table,
          record: payload.record,
          old_record: payload.old_record || null,
          schema: payload.schema,
        };

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

          const fieldsChanged =
            oldRecord.status !== newRecord.status ||
            oldRecord.tier !== newRecord.tier ||
            oldRecord.title !== newRecord.title ||
            oldRecord.company !== newRecord.company ||
            oldRecord.description !== newRecord.description ||
            oldRecord.location !== newRecord.location ||
            oldRecord.salary !== newRecord.salary ||
            oldRecord.remote !== newRecord.remote ||
            oldRecord.type !== newRecord.type ||
            oldRecord.workplace !== newRecord.workplace ||
            oldRecord.experience !== newRecord.experience ||
            oldRecord.category !== newRecord.category;

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
        const errorMsg = errorToString(error);
        console.error('[flux-station] Job Discord notification failed', {
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
    console.error('[flux-station] Job Discord queue error', {
      error: errorToString(error),
    });
    return errorResponse(error, 'flux-station:discord-jobs-error');
  }
}
