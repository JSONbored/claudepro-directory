/**
 * Discord Jobs Inngest Function
 *
 * Processes discord_jobs queue: Send Discord notifications for job changes
 * Handles INSERT and UPDATE events for the jobs table.
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { normalizeError, getEnvVar, sanitizeForDiscord } from '@heyclaude/shared-runtime';

import { inngest } from '../../client';
import { pgmqRead, pgmqDelete, type PgmqMessage } from '../../../supabase/pgmq-client';
import { logger, createWebAppContextWithId } from '../../../logging/server';
import { sendCronSuccessHeartbeat } from '../../utils/monitoring';

type JobRow = DatabaseGenerated['public']['Tables']['jobs']['Row'];

const DISCORD_JOBS_QUEUE = 'discord_jobs';
const BATCH_SIZE = 10;

// Fields that trigger Discord notifications when changed
const MONITORED_FIELDS = [
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

interface JobWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: JobRow;
  old_record: JobRow | null;
}

/**
 * Validate slug is safe for URL construction
 */
function isValidSlug(slug: string | null | undefined): slug is string {
  return typeof slug === 'string' && /^[a-zA-Z0-9-_]+$/.test(slug);
}

function buildJobEmbed(job: JobRow, isNew: boolean): Record<string, unknown> | null {
  const siteUrl = getEnvVar('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';

  // Validate slug before constructing URL
  if (!isValidSlug(job.slug)) {
    logger.warn({ slug: job.slug }, 'Invalid job slug, skipping embed');
    return null;
  }

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  if (job.company) {
    fields.push({ name: '🏢 Company', value: sanitizeForDiscord(job.company), inline: true });
  }

  if (job.location) {
    fields.push({ name: '📍 Location', value: sanitizeForDiscord(job.location), inline: true });
  }

  if (job.remote) {
    fields.push({ name: '🌐 Remote', value: 'Yes', inline: true });
  }

  if (job.type) {
    fields.push({ name: '💼 Type', value: sanitizeForDiscord(job.type), inline: true });
  }

  if (job.salary) {
    fields.push({ name: '💰 Salary', value: sanitizeForDiscord(job.salary), inline: true });
  }

  if (job.tier) {
    fields.push({ name: '⭐ Tier', value: sanitizeForDiscord(job.tier), inline: true });
  }

  return {
    title: sanitizeForDiscord(job.title, 256) || 'New Job Listing',
    description: sanitizeForDiscord(job.description, 200) || 'No description provided.',
    url: `${siteUrl}/jobs/${job.slug}`,
    color: isNew ? 0x22c55e : 0x3b82f6, // Green for new, blue for updates
    fields: fields.slice(0, 6), // Discord limit
    footer: {
      text: isNew ? '🆕 New Listing' : '📝 Updated',
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Process Discord job notifications from queue
 */
export const processDiscordJobsQueue = inngest.createFunction(
  {
    id: 'discord-jobs-processor',
    name: 'Discord Jobs Processor',
    retries: 2,
  },
  { cron: '*/30 * * * *' }, // Every 30 minutes
  async ({ step }) => {
    const startTime = Date.now();
    const logContext = createWebAppContextWithId('/inngest/discord/jobs', 'processDiscordJobsQueue');

    logger.info(logContext, 'Discord jobs queue processing started');

    const discordWebhookUrl = getEnvVar('DISCORD_JOBS_WEBHOOK_URL');

    if (!discordWebhookUrl) {
      logger.warn(logContext, 'Discord jobs webhook URL not configured');
      return { processed: 0, sent: 0, skipped: 'no_webhook_url' };
    }

    // Step 1: Read messages from queue
    const messages = await step.run('read-queue', async (): Promise<PgmqMessage<JobWebhookPayload>[]> => {
      try {
        const data = await pgmqRead<JobWebhookPayload>(DISCORD_JOBS_QUEUE, {
          vt: 60,
          qty: BATCH_SIZE,
        });

        if (!data || data.length === 0) {
          return [];
        }

        // Filter valid webhook payloads
        return data.filter((msg) =>
          msg.message && ['INSERT', 'UPDATE', 'DELETE'].includes(msg.message.type)
        );
      } catch (error) {
        logger.warn({ ...logContext,
          errorMessage: normalizeError(error, 'Queue read failed').message, }, 'Failed to read Discord jobs queue');
        return [];
      }
    });

    if (messages.length === 0) {
      logger.info(logContext, 'No messages in Discord jobs queue');
      return { processed: 0, sent: 0 };
    }

    let sentCount = 0;
    const processedMsgIds: bigint[] = [];

    // Process each message
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg) continue;

      const result = await step.run(`process-job-${i}`, async (): Promise<{
        success: boolean;
        sent: boolean;
        reason?: string;
      }> => {
        const payload = msg.message;

        try {
          // Skip DELETE events
          if (payload.type === 'DELETE') {
            return { success: true, sent: false, reason: 'delete_event' };
          }

          const job = payload.record;

          // Skip drafts and placeholders for INSERT
          if (payload.type === 'INSERT') {
            if (job.status === 'draft' || job.is_placeholder) {
              return { success: true, sent: false, reason: 'draft_or_placeholder' };
            }
          }

          // For UPDATE, check if monitored fields changed
          if (payload.type === 'UPDATE') {
            const oldRecord = payload.old_record;
            if (!oldRecord) {
              return { success: true, sent: false, reason: 'no_old_record' };
            }

            const fieldsChanged = MONITORED_FIELDS.some(
              (field) => oldRecord[field] !== job[field]
            );

            if (!fieldsChanged) {
              return { success: true, sent: false, reason: 'no_monitored_fields_changed' };
            }
          }

          // Build and send Discord embed
          const embed = buildJobEmbed(job, payload.type === 'INSERT');
          if (!embed) {
            return { success: true, sent: false, reason: 'invalid_slug' };
          }
          
          const discordResponse = await fetch(discordWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: payload.type === 'INSERT'
                ? '🎉 **New Job Posted**'
                : '📝 **Job Updated**',
              embeds: [embed],
            }),
          });

          if (!discordResponse.ok) {
            logger.warn({ ...logContext,
              jobId: job.id,
              status: discordResponse.status, }, 'Discord webhook failed');
            return { success: false, sent: false };
          }

          logger.info({ ...logContext,
            jobId: job.id,
            type: payload.type, }, 'Discord job notification sent');

          return { success: true, sent: true };
        } catch (error) {
          const normalized = normalizeError(error, 'Discord job notification failed');
          logger.warn({ ...logContext,
            errorMessage: normalized.message, }, 'Discord job notification failed');
          return { success: false, sent: false };
        }
      });

      if (result.success) {
        processedMsgIds.push(msg.msg_id);
        if (result.sent) {
          sentCount++;
        }
      }
    }

    // Delete processed messages
    if (processedMsgIds.length > 0) {
      await step.run('delete-processed', async () => {
        for (const msgId of processedMsgIds) {
          await pgmqDelete(DISCORD_JOBS_QUEUE, msgId);
        }
      });
    }

    const durationMs = Date.now() - startTime;
    logger.info({ ...logContext,
      durationMs,
      processed: messages.length,
      sent: sentCount, }, 'Discord jobs queue processing completed');

    const result = {
      processed: messages.length,
      sent: sentCount,
    };

    // BetterStack monitoring: Send success heartbeat (feature-flagged)
    if (result.sent > 0) {
      sendCronSuccessHeartbeat('BETTERSTACK_HEARTBEAT_INNGEST_CRON', {
        functionName: 'processDiscordJobsQueue',
        result: { sent: result.sent },
      });
    }

    return result;
  }
);
