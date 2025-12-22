/**
 * Discord Errors Inngest Function
 *
 * Processes discord_errors queue: Send Discord notifications for webhook errors
 * Triggered by webhook_events table inserts with error != null.
 */

import { normalizeError } from '@heyclaude/shared-runtime';
import { env } from '@heyclaude/shared-runtime/schemas/env';

import { pgmqRead, pgmqDelete } from '../../../supabase/pgmq-client';
import { logger } from '../../../logging/server';
import { createInngestFunction } from '../../utils/function-factory';

const DISCORD_ERRORS_QUEUE = 'discord_errors';
const BATCH_SIZE = 10;
const MAX_RETRY_COUNT = 5; // Delete message after this many attempts
const DISCORD_TIMEOUT_MS = 10000; // 10 second timeout

interface ErrorWebhookPayload {
  webhook_event_id: string;
  source: string;
  type: string;
  error: string;
  created_at: string;
}

function buildErrorEmbed(payload: ErrorWebhookPayload): Record<string, unknown> {
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    { name: '🔗 Source', value: payload.source || 'unknown', inline: true },
    { name: '📋 Type', value: payload.type || 'unknown', inline: true },
    { name: '🆔 Event ID', value: payload.webhook_event_id || 'unknown', inline: true },
  ];

  // Safe access with fallback for error field
  const errorText = payload.error ?? 'No error message provided';
  // Truncate error message if too long and replace triple backticks to prevent code block injection
  const sanitizedError = errorText.replace(/```/g, "'''");
  const errorMessage =
    sanitizedError.length > 1000 ? sanitizedError.slice(0, 997) + '...' : sanitizedError;

  return {
    title: '⚠️ Webhook Error',
    description: `\`\`\`\n${errorMessage}\n\`\`\``,
    color: 0xff6b6b, // Red color for errors
    fields,
    timestamp: payload.created_at || new Date().toISOString(),
    footer: {
      text: 'Webhook Error Alert',
    },
  };
}

/**
 * Process discord_errors queue
 * Runs every 30 minutes to send error notifications to Discord.
 * Optimized: Increased from 15 minutes (errors don't need immediate alerts).
 * Uses singleton pattern to prevent duplicate runs.
 */
export const processDiscordErrorsQueue = createInngestFunction(
  {
    id: 'discord-errors-queue',
    name: 'Process Discord Errors Queue',
    route: '/inngest/discord-errors',
    retries: 3,
    // Singleton pattern: Only one Discord errors processor can run at a time
    singleton: {
      key: 'discord-errors',
    },
  },
  { cron: '*/30 * * * *' }, // Every 30 minutes (optimized from 15 minutes)
  async ({ step, logContext }) => {

    // Step 1: Read messages from queue
    const messages = await step.run('read-queue', async () => {
      logger.info(logContext, 'Reading discord_errors queue');

      const result = await pgmqRead<ErrorWebhookPayload>(DISCORD_ERRORS_QUEUE, {
        vt: 120, // 2 minutes to process batch of 10 messages safely
        qty: BATCH_SIZE,
      });

      return result || [];
    });

    if (messages.length === 0) {
      logger.info(logContext, 'No error messages to process');
      return { processed: 0 };
    }

    logger.info(
      { ...logContext, messageCount: messages.length },
      'Processing discord error messages'
    );

    // Step 2: Get Discord webhook URL
    const webhookUrl = await step.run('get-webhook-url', async () => {
      const url = env.DISCORD_ERROR_WEBHOOK_URL;
      if (!url) {
        throw new Error('DISCORD_ERROR_WEBHOOK_URL not configured');
      }
      return url;
    });

    // Step 3: Process each message
    const results: Array<{ msgId: string; success: boolean; error?: string }> = [];

    for (const msg of messages) {
      const msgId = String(msg.msg_id);

      const result = await step.run(`process-error-${msgId}`, async () => {
        try {
          // Check if message has exceeded max retries
          const readCount = msg.read_ct ?? 0;
          if (readCount > MAX_RETRY_COUNT) {
            logger.warn(
              { ...logContext, msgId, readCount },
              'Message exceeded max retries, deleting'
            );
            await pgmqDelete(DISCORD_ERRORS_QUEUE, msg.msg_id);
            return { msgId, success: false, error: 'Max retries exceeded' };
          }

          const payload = msg.message;
          const embed = buildErrorEmbed(payload);

          // Send to Discord with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), DISCORD_TIMEOUT_MS);

          let response: Response;
          try {
            response = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                embeds: [embed],
              }),
              signal: controller.signal,
            });
          } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
              throw new Error('Discord webhook request timed out');
            }
            throw fetchError;
          }
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Discord API error: ${response.status} - ${errorText}`);
          }

          // Delete message from queue on success
          await pgmqDelete(DISCORD_ERRORS_QUEUE, msg.msg_id);

          logger.info(
            { ...logContext, msgId, webhookEventId: payload.webhook_event_id },
            'Discord error notification sent'
          );

          return { msgId, success: true };
        } catch (error) {
          const normalized = normalizeError(error, 'Failed to send Discord error notification');
          logger.error(
            { err: normalized, ...logContext, msgId },
            'Discord error notification failed'
          );
          return { msgId, success: false, error: normalized.message };
        }
      });

      results.push(result);
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    logger.info(
      { ...logContext, successCount, failedCount, totalProcessed: messages.length },
      'Discord errors queue processing complete'
    );

    return {
      processed: messages.length,
      success: successCount,
      failed: failedCount,
      results,
    };
  }
);
