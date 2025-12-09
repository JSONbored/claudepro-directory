/**
 * Discord Submissions Inngest Function
 *
 * Processes discord_submissions queue: Send Discord notifications for content submissions
 * Handles INSERT (new submission) and UPDATE (status changes, especially merged) events.
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { normalizeError, getEnvVar } from '@heyclaude/shared-runtime';

import { inngest } from '../../client';
import { pgmqRead, pgmqDelete, type PgmqMessage } from '../../../supabase/pgmq-client';
import { logger, createWebAppContextWithId } from '../../../logging/server';

type ContentSubmission = DatabaseGenerated['public']['Tables']['content_submissions']['Row'];

const DISCORD_SUBMISSIONS_QUEUE = 'discord_submissions';
const BATCH_SIZE = 10;

interface SubmissionWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: ContentSubmission;
  old_record: ContentSubmission | null;
}

function buildSubmissionEmbed(submission: ContentSubmission, isNew: boolean): Record<string, unknown> {
  const siteUrl = getEnvVar('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  fields.push({
    name: '📁 Category',
    value: submission.category || 'Unknown',
    inline: true,
  });

  fields.push({
    name: '📊 Status',
    value: submission.status || 'pending',
    inline: true,
  });

  if (submission.github_url) {
    fields.push({
      name: '🔗 URL',
      value: submission.github_url.slice(0, 100),
      inline: false,
    });
  }

  return {
    title: submission.name || 'New Submission',
    description: submission.description?.slice(0, 300) || 'No description provided.',
    url: `${siteUrl}/admin/submissions/${submission.id}`,
    color: isNew ? 0x8b5cf6 : 0x22c55e, // Purple for new, green for merged
    fields,
    footer: {
      text: isNew ? '📬 New Submission' : '✅ Content Published',
    },
    timestamp: new Date().toISOString(),
  };
}

function buildMergedEmbed(submission: ContentSubmission): Record<string, unknown> {
  const siteUrl = getEnvVar('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';

  // Determine content URL based on category
  const categoryToPath: Record<string, string> = {
    mcp: 'mcp-servers',
    rules: 'rules',
    skills: 'skills',
    agents: 'agents',
    commands: 'commands',
    hooks: 'hooks',
  };

  const basePath = categoryToPath[submission.category || ''] || 'browse';
  const slug = submission.approved_slug || submission.id;
  const contentUrl = `${siteUrl}/${basePath}/${slug}`;

  return {
    title: `🎉 ${submission.name || 'New Content'} is now live!`,
    description: submission.description?.slice(0, 300) || 'Check out this new addition to the directory.',
    url: contentUrl,
    color: 0x22c55e, // Green
    fields: [
      {
        name: '📁 Category',
        value: submission.category || 'Unknown',
        inline: true,
      },
      {
        name: '👤 Contributor',
        // Use author field, otherwise 'Community Contributor' (avoid PII exposure)
        value: submission.author || 'Community Contributor',
        inline: true,
      },
    ],
    footer: {
      text: '✨ Community Contribution',
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Process Discord submission notifications from queue
 */
export const processDiscordSubmissionsQueue = inngest.createFunction(
  {
    id: 'discord-submissions-processor',
    name: 'Discord Submissions Processor',
    retries: 2,
  },
  { cron: '*/30 * * * *' }, // Every 30 minutes
  async ({ step }) => {
    const startTime = Date.now();
    const logContext = createWebAppContextWithId('/inngest/discord/submissions', 'processDiscordSubmissionsQueue');

    logger.info('Discord submissions queue processing started', logContext);

    const adminWebhookUrl = getEnvVar('DISCORD_SUBMISSIONS_WEBHOOK_URL');
    const announcementWebhookUrl = getEnvVar('DISCORD_ANNOUNCEMENTS_WEBHOOK_URL');

    if (!adminWebhookUrl && !announcementWebhookUrl) {
      logger.warn('Discord submission webhook URLs not configured', logContext);
      return { processed: 0, sent: 0, skipped: 'no_webhook_urls' };
    }

    // Step 1: Read messages from queue
    const messages = await step.run('read-queue', async (): Promise<PgmqMessage<SubmissionWebhookPayload>[]> => {
      try {
        const data = await pgmqRead<SubmissionWebhookPayload>(DISCORD_SUBMISSIONS_QUEUE, {
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
        logger.warn('Failed to read Discord submissions queue', {
          ...logContext,
          errorMessage: normalizeError(error, 'Queue read failed').message,
        });
        return [];
      }
    });

    if (messages.length === 0) {
      logger.info('No messages in Discord submissions queue', logContext);
      return { processed: 0, sent: 0 };
    }

    let sentCount = 0;
    const processedMsgIds: bigint[] = [];

    // Process each message
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg) continue;

      const result = await step.run(`process-submission-${i}`, async (): Promise<{
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

          const submission = payload.record;

          // Handle INSERT - new submission notification (admin channel)
          if (payload.type === 'INSERT' && adminWebhookUrl) {
            const embed = buildSubmissionEmbed(submission, true);
            
            // Send with timeout to avoid hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            let response: Response;
            try {
              response = await fetch(adminWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: '📬 **New Content Submission**',
                  embeds: [embed],
                }),
                signal: controller.signal,
              });
            } catch (fetchError) {
              clearTimeout(timeoutId);
              if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                logger.warn('Discord submission notification timed out', {
                  ...logContext,
                  submissionId: submission.id,
                });
              }
              return { success: false, sent: false };
            }
            clearTimeout(timeoutId);

            if (!response.ok) {
              logger.warn('Discord submission notification failed', {
                ...logContext,
                submissionId: submission.id,
                status: response.status,
              });
              return { success: false, sent: false };
            }

            logger.info('Discord submission notification sent', {
              ...logContext,
              submissionId: submission.id,
            });

            return { success: true, sent: true };
          }

          // Handle UPDATE - check if status changed to 'merged'
          if (payload.type === 'UPDATE') {
            const oldRecord = payload.old_record;
            
            // Check if status changed to 'merged'
            const wasMerged = oldRecord?.status !== 'merged' && submission.status === 'merged';

            if (wasMerged && announcementWebhookUrl) {
              const embed = buildMergedEmbed(submission);
              
              // Send with timeout to avoid hanging
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000);

              let response: Response;
              try {
                response = await fetch(announcementWebhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    content: '🎉 **New Content Published**',
                    embeds: [embed],
                  }),
                  signal: controller.signal,
                });
              } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                  logger.warn('Discord merged notification timed out', {
                    ...logContext,
                    submissionId: submission.id,
                  });
                }
                return { success: false, sent: false };
              }
              clearTimeout(timeoutId);

              if (!response.ok) {
                logger.warn('Discord merged notification failed', {
                  ...logContext,
                  submissionId: submission.id,
                  status: response.status,
                });
                return { success: false, sent: false };
              }

              logger.info('Discord merged notification sent', {
                ...logContext,
                submissionId: submission.id,
              });

              return { success: true, sent: true };
            }

            // Status didn't change to merged, just acknowledge
            return { success: true, sent: false, reason: 'no_merge_transition' };
          }

          return { success: true, sent: false, reason: 'unhandled_type' };
        } catch (error) {
          const normalized = normalizeError(error, 'Discord submission notification failed');
          logger.warn('Discord submission notification failed', {
            ...logContext,
            errorMessage: normalized.message,
          });
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
          await pgmqDelete(DISCORD_SUBMISSIONS_QUEUE, msgId);
        }
      });
    }

    const durationMs = Date.now() - startTime;
    logger.info('Discord submissions queue processing completed', {
      ...logContext,
      durationMs,
      processed: messages.length,
      sent: sentCount,
    });

    return {
      processed: messages.length,
      sent: sentCount,
    };
  }
);
