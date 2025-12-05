/**
 * Changelog Notify Inngest Function
 *
 * Processes changelog_notify queue: Send Discord + insert notifications + invalidate cache
 * Runs as a cron job to process notification queue.
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { normalizeError, getEnvVar } from '@heyclaude/shared-runtime';
import { revalidateTag } from 'next/cache';

import { inngest } from '../../client';
import { createSupabaseAdminClient } from '../../../supabase/admin';
import { pgmqRead, pgmqDelete, type PgmqMessage } from '../../../supabase/pgmq-client';
import { logger, generateRequestId, createWebAppContextWithId } from '../../../logging/server';

const CHANGELOG_NOTIFY_QUEUE = 'changelog_notify';
const BATCH_SIZE = 5;

interface ChangelogSection {
  type: string;
  commits: Array<{
    scope?: string;
    description: string;
    sha: string;
    author: string;
  }>;
}

interface ChangelogReleaseJob {
  entryId: string;
  slug: string;
  title: string;
  tldr: string;
  sections: ChangelogSection[];
  commits: unknown[];
  releaseDate: string;
  metadata?: unknown;
}

function buildDiscordEmbed(job: ChangelogReleaseJob): Record<string, unknown> {
  const siteUrl = getEnvVar('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';
  const typeEmoji: Record<string, string> = {
    feat: '✨',
    fix: '🐛',
    perf: '⚡',
    refactor: '♻️',
    docs: '📚',
  };

  const fields = job.sections.slice(0, 4).map((section) => ({
    name: `${typeEmoji[section.type] || '📝'} ${section.type.charAt(0).toUpperCase() + section.type.slice(1)}`,
    value: section.commits
      .slice(0, 3)
      .map((c) => `• ${c.description}`)
      .join('\n'),
    inline: true,
  }));

  return {
    title: job.title,
    description: job.tldr,
    url: `${siteUrl}/changelog/${job.slug}`,
    color: 0xff6b35, // Brand orange
    fields,
    footer: {
      text: `Released ${job.releaseDate}`,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Process changelog notifications from queue
 */
export const processChangelogNotifyQueue = inngest.createFunction(
  {
    id: 'changelog-notify',
    name: 'Changelog Notify',
    retries: 2,
  },
  { cron: '*/30 * * * *' }, // Every 30 minutes
  async ({ step }) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const logContext = createWebAppContextWithId(requestId, '/inngest/changelog/notify', 'processChangelogNotifyQueue');

    logger.info('Changelog notify queue processing started', logContext);

    const supabase = createSupabaseAdminClient();

    // Step 1: Read messages from queue
    const messages = await step.run('read-queue', async (): Promise<PgmqMessage<ChangelogReleaseJob>[]> => {
      try {
        const data = await pgmqRead<ChangelogReleaseJob>(CHANGELOG_NOTIFY_QUEUE, {
          vt: 300,
          qty: BATCH_SIZE,
        });

        if (!data || data.length === 0) {
          return [];
        }

        // Filter valid changelog release jobs
        return data.filter((msg) =>
          msg.message && 
          typeof msg.message.entryId === 'string' && 
          typeof msg.message.slug === 'string'
        );
      } catch (error) {
        logger.warn('Failed to read changelog notify queue', {
          ...logContext,
          errorMessage: normalizeError(error, 'Queue read failed').message,
        });
        return [];
      }
    });

    if (messages.length === 0) {
      logger.info('No messages in changelog notify queue', logContext);
      return { processed: 0, notified: 0 };
    }

    let notifiedCount = 0;
    const processedMsgIds: bigint[] = [];

    // Process each message
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg) continue;

      const result = await step.run(`notify-changelog-${i}`, async (): Promise<{
        success: boolean;
        discordSent: boolean;
        notificationInserted: boolean;
      }> => {
        const job = msg.message;
        let discordSent = false;
        let notificationInserted = false;

        try {
          // 1. Send Discord webhook
          const discordWebhookUrl = getEnvVar('DISCORD_CHANGELOG_WEBHOOK_URL');
          if (discordWebhookUrl) {
            try {
              const embed = buildDiscordEmbed(job);
              const discordResponse = await fetch(discordWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: '🚀 **New Release Deployed**',
                  embeds: [embed],
                }),
              });

              if (discordResponse.ok) {
                discordSent = true;
                logger.info('Discord webhook sent', {
                  ...logContext,
                  slug: job.slug,
                });
              } else {
                logger.warn('Discord webhook failed', {
                  ...logContext,
                  status: discordResponse.status,
                });
              }
            } catch (error) {
              logger.warn('Discord webhook error', {
                ...logContext,
                errorMessage: normalizeError(error, 'Discord failed').message,
              });
            }
          }

          // 2. Insert notification (critical path)
          const notificationInsert: DatabaseGenerated['public']['Tables']['notifications']['Insert'] = {
            id: job.entryId,
            title: job.title,
            message: job.tldr || 'We just shipped a fresh Claude Pro Directory release.',
            type: 'announcement',
            priority: 'high',
            action_label: 'Read release notes',
            action_href: `/changelog/${job.slug}`,
          };

          const { error: notifyError } = await supabase
            .from('notifications')
            .upsert(notificationInsert, { onConflict: 'id' });

          if (notifyError) {
            throw new Error(`Notification insert failed: ${notifyError.message}`);
          }

          notificationInserted = true;
          logger.info('Notification inserted', {
            ...logContext,
            entryId: job.entryId,
          });

          // 3. Invalidate cache tags
          // Using 'max' profile for stale-while-revalidate semantics (Next.js 16+)
          try {
            revalidateTag('changelog', 'max');
            revalidateTag(`changelog-${job.slug}`, 'max');
            logger.info('Cache invalidated', {
              ...logContext,
              tags: ['changelog', `changelog-${job.slug}`],
            });
          } catch (error) {
            logger.warn('Cache invalidation failed', {
              ...logContext,
              errorMessage: normalizeError(error, 'Cache invalidation failed').message,
            });
          }

          return { success: true, discordSent, notificationInserted };
        } catch (error) {
          const normalized = normalizeError(error, 'Changelog notification failed');
          logger.warn('Changelog notification failed', {
            ...logContext,
            entryId: job.entryId,
            errorMessage: normalized.message,
          });
          return { success: notificationInserted, discordSent, notificationInserted };
        }
      });

      if (result.success) {
        processedMsgIds.push(msg.msg_id);
        if (result.notificationInserted) {
          notifiedCount++;
        }
      }
    }

    // Delete processed messages
    if (processedMsgIds.length > 0) {
      await step.run('delete-processed', async () => {
        for (const msgId of processedMsgIds) {
          await pgmqDelete(CHANGELOG_NOTIFY_QUEUE, msgId);
        }
      });
    }

    const durationMs = Date.now() - startTime;
    logger.info('Changelog notify queue processing completed', {
      ...logContext,
      durationMs,
      processed: messages.length,
      notified: notifiedCount,
    });

    return {
      processed: messages.length,
      notified: notifiedCount,
    };
  }
);
