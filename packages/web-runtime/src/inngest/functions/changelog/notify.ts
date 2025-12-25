/**
 * Changelog Notify Inngest Function
 *
 * Processes changelog_notify queue: Send Discord + insert notifications + invalidate cache
 * Runs as a cron job to process notification queue.
 */

import { Prisma } from '@prisma/client';
type notificationsCreateInput = Prisma.notificationsCreateInput;
import { normalizeError } from '@heyclaude/shared-runtime';
import { env } from '@heyclaude/shared-runtime/schemas/env';
import { revalidateTag } from 'next/cache';

import { pgmqRead, pgmqDelete, type PgmqMessage } from '../../../supabase/pgmq-client';
import { logger } from '../../../logging/server';
import { getService } from '../../../data/service-factory';
import { createInngestFunction } from '../../utils/function-factory';
import { renderEmailTemplate } from '../../../email/base-template';
import { ChangelogReleaseEmail } from '../../../email/templates/changelog-release';
import { HELLO_FROM } from '../../../email/config/email-config';
import { getResendClient } from '../../../integrations/resend';

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
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://claudepro.directory';
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
 * Uses singleton pattern to prevent duplicate runs
 */
export const processChangelogNotifyQueue = createInngestFunction(
  {
    id: 'changelog-notify',
    name: 'Changelog Notify',
    route: '/inngest/changelog/notify',
    retries: 2,
    // Singleton pattern: Only one changelog notify processor can run at a time
    singleton: {
      key: 'changelog-notify',
    },
  },
  { cron: '*/30 * * * *' }, // Every 30 minutes
  async ({ step, logContext }) => {
    // Step 1: Read messages from queue
    const messages = await step.run(
      'read-queue',
      async (): Promise<PgmqMessage<ChangelogReleaseJob>[]> => {
        try {
          const data = await pgmqRead<ChangelogReleaseJob>(CHANGELOG_NOTIFY_QUEUE, {
            vt: 300,
            qty: BATCH_SIZE,
          });

          if (!data || data.length === 0) {
            return [];
          }

          // Filter valid changelog release jobs
          return data.filter(
            (msg) =>
              msg.message &&
              typeof msg.message.entryId === 'string' &&
              typeof msg.message.slug === 'string'
          );
        } catch (error) {
          logger.warn(
            { ...logContext, errorMessage: normalizeError(error, 'Queue read failed').message },
            'Failed to read changelog notify queue'
          );
          return [];
        }
      }
    );

    if (messages.length === 0) {
      logger.info(logContext, 'No messages in changelog notify queue');
      return { processed: 0, notified: 0 };
    }

    let notifiedCount = 0;
    const processedMsgIds: bigint[] = [];

    // Process each message
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg) continue;

      const result = await step.run(
        `notify-changelog-${i}`,
        async (): Promise<{
          success: boolean;
          discordSent: boolean;
          notificationInserted: boolean;
          emailsSent: number;
        }> => {
          const job = msg.message;
          let discordSent = false;
          let notificationInserted = false;
          let emailsSent = 0;

          try {
            // 1. Send Discord webhook
            const discordWebhookUrl = env.DISCORD_CHANGELOG_WEBHOOK_URL;
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
                  logger.info({ ...logContext, slug: job.slug }, 'Discord webhook sent');
                } else {
                  logger.warn(
                    { ...logContext, status: discordResponse.status },
                    'Discord webhook failed'
                  );
                }
              } catch (error) {
                logger.warn(
                  { ...logContext, errorMessage: normalizeError(error, 'Discord failed').message },
                  'Discord webhook error'
                );
              }
            }

            // 2. Insert notification (critical path)
            // Build notification data carefully to avoid exactOptionalPropertyTypes issues
            const notificationInsert: notificationsCreateInput = {
              id: job.entryId,
              title: job.title,
              message: job.tldr || 'We just shipped a fresh Claude Pro Directory release.',
              type: 'announcement',
              priority: 'high',
              action_label: 'Read release notes',
              action_href: `/changelog/${job.slug}`,
            };

            const service = await getService('misc');
            // Type assertion needed due to exactOptionalPropertyTypes mismatch between dist/src types
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await service.upsertNotification(notificationInsert as any);

            notificationInserted = true;
            logger.info({ ...logContext, entryId: job.entryId }, 'Notification inserted');

            // 3. Send email to newsletter subscribers
            // NOTE: Currently sends to all active subscribers. Once the changelog segment is created
            // in Resend dashboard and RESEND_SEGMENT_IDS.changelog is updated, we can optionally
            // add logic to filter contacts by segment membership (requires querying each contact's
            // segments via Resend API, which may be inefficient for large lists).
            try {
              const newsletterService = await getService('newsletter');
              const subscribers = await newsletterService.getActiveSubscribers();

              if (subscribers && subscribers.length > 0) {
                // Build email HTML using React Email template
                const html = await renderEmailTemplate(ChangelogReleaseEmail, {
                  title: job.title,
                  tldr: job.tldr || 'We just shipped a fresh Claude Pro Directory release.',
                  sections: job.sections || [],
                  releaseDate: job.releaseDate,
                  slug: job.slug,
                });

                const resend = getResendClient();
                const subject = `New Release: ${job.title}`;

                // Use Resend batch API (up to 100 recipients per batch)
                const batchSize = 100;
                for (let batchStart = 0; batchStart < subscribers.length; batchStart += batchSize) {
                  const batch = subscribers.slice(batchStart, batchStart + batchSize);

                  try {
                    const result = await resend.batch.send(
                      batch.map((email) => ({
                        from: HELLO_FROM,
                        to: email,
                        subject,
                        html,
                        tags: [
                          { name: 'type', value: 'announcement' },
                          { name: 'category', value: 'changelog' },
                        ],
                      }))
                    );

                    if (result.data) {
                      const batchSuccessCount = result.data['length'] || batch.length;
                      emailsSent += batchSuccessCount;
                      logger.info(
                        {
                          ...logContext,
                          slug: job.slug,
                          batchSize: batchSuccessCount,
                          totalSent: emailsSent,
                        },
                        'Changelog email batch sent'
                      );
                    }
                  } catch (batchError) {
                    const normalized = normalizeError(batchError, 'Email batch send failed');
                    logger.warn(
                      {
                        ...logContext,
                        slug: job.slug,
                        errorMessage: normalized.message,
                        batchStart,
                      },
                      'Changelog email batch failed'
                    );
                  }
                }

                logger.info(
                  {
                    ...logContext,
                    slug: job.slug,
                    totalEmailsSent: emailsSent,
                    totalSubscribers: subscribers.length,
                  },
                  'Changelog emails sent to subscribers'
                );
              } else {
                logger.info(
                  { ...logContext, slug: job.slug },
                  'No subscribers to notify via email'
                );
              }
            } catch (emailError) {
              const normalized = normalizeError(emailError, 'Changelog email send failed');
              logger.warn(
                {
                  ...logContext,
                  slug: job.slug,
                  errorMessage: normalized.message,
                },
                'Changelog email send failed (non-fatal)'
              );
              // Don't fail the entire notification if email fails
            }

            // 4. Invalidate cache tags
            // Using 'max' profile for stale-while-revalidate semantics (Next.js 16+)
            try {
              revalidateTag('changelog', 'max');
              revalidateTag(`changelog-${job.slug}`, 'max');
              logger.info(
                {
                  ...logContext,
                  tags: ['changelog', `changelog-${job.slug}`],
                },
                'Cache invalidated'
              );
            } catch (error) {
              logger.warn(
                {
                  ...logContext,
                  errorMessage: normalizeError(error, 'Cache invalidation failed').message,
                },
                'Cache invalidation failed'
              );
            }

            return { success: true, discordSent, notificationInserted, emailsSent };
          } catch (error) {
            const normalized = normalizeError(error, 'Changelog notification failed');
            logger.warn(
              { ...logContext, entryId: job.entryId, errorMessage: normalized.message },
              'Changelog notification failed'
            );
            return { success: notificationInserted, discordSent, notificationInserted, emailsSent };
          }
        }
      );

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

    // Additional custom logging (duration logging is handled by factory)
    // Note: Email count is logged inside each step, not aggregated here
    logger.info(
      { ...logContext, processed: processedMsgIds.length, notified: notifiedCount },
      'Changelog notify queue processing completed'
    );

    // Return count of successfully processed messages, not just messages read
    // This ensures processed count matches actual processing, not just queue reads
    return {
      processed: processedMsgIds.length, // Count of successfully processed messages
      notified: notifiedCount,
    };
  }
);
