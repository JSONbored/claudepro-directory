/**
 * Discord Direct Notification Inngest Function
 *
 * Sends a direct Discord notification via webhook.
 * This function is triggered by the /api/flux/discord/direct endpoint and handles
 * the external API call asynchronously, eliminating blocking from Vercel functions.
 *
 * Event: discord/direct
 * Data: { notificationType: string, payload: DiscordPayload }
 */

import { inngest } from '../../client';
import { RETRY_CONFIGS } from '../../config';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { getEnvVar } from '@heyclaude/shared-runtime';

const MAX_BODY_SIZE = 200_000; // 200KB limit

interface DiscordPayload {
  content?: string;
  embeds?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

/**
 * Get the appropriate Discord webhook URL based on notification type
 */
function getWebhookUrl(notificationType: string): string | undefined {
  switch (notificationType) {
    case 'changelog':
      return getEnvVar('DISCORD_CHANGELOG_WEBHOOK_URL');
    case 'submission':
      return getEnvVar('DISCORD_SUBMISSIONS_WEBHOOK_URL');
    case 'job':
      return getEnvVar('DISCORD_JOBS_WEBHOOK_URL');
    case 'error':
      return getEnvVar('DISCORD_ERRORS_WEBHOOK_URL');
    default:
      return undefined;
  }
}

export const sendDiscordDirect = inngest.createFunction(
  {
    id: 'discord/direct',
    name: 'Send Discord Direct Notification',
    retries: RETRY_CONFIGS.externalApi,
    timeouts: {
      finish: '30s', // 30 seconds (TIMEOUTS.EXTERNAL_API = 30000ms)
    },
  },
  { event: 'discord/direct' },
  async ({ event, step }) => {
    const { notificationType, payload } = event.data;

    if (!notificationType) {
      logger.warn(
        {
          eventId: event.id,
        },
        'Discord Direct: Missing notification type'
      );
      return { success: false, error: 'Missing notification type' };
    }

    // Validate payload size
    const payloadSize = JSON.stringify(payload).length;
    if (payloadSize > MAX_BODY_SIZE) {
      logger.warn(
        {
          eventId: event.id,
          payloadSize,
          maxSize: MAX_BODY_SIZE,
        },
        'Discord Direct: Payload too large'
      );
      return { success: false, error: 'Payload too large' };
    }

    return await step.run('send-discord-webhook', async () => {
      try {
        const webhookUrl = getWebhookUrl(notificationType);
        if (!webhookUrl) {
          logger.warn(
            {
              eventId: event.id,
              notificationType,
            },
            'Discord Direct: Webhook URL not configured'
          );
          return {
            success: false,
            error: `Webhook not configured for type: ${notificationType}`,
          };
        }

        // Send to Discord with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        let response: Response;
        try {
          response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload as DiscordPayload),
            signal: controller.signal,
          });
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            logger.warn(
              {
                eventId: event.id,
                notificationType,
              },
              'Discord Direct: Webhook timed out'
            );
            return {
              success: false,
              error: 'Discord webhook timed out',
            };
          }
          throw fetchError;
        }
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          logger.warn(
            {
              eventId: event.id,
              notificationType,
              status: response.status,
              errorText: errorText.slice(0, 200),
            },
            'Discord Direct: Webhook failed'
          );
          return {
            success: false,
            error: 'Discord webhook failed',
            status: response.status,
          };
        }

        logger.info(
          {
            eventId: event.id,
            notificationType,
          },
          'Discord Direct: Notification sent'
        );

        return {
          success: true,
          notificationType,
        };
      } catch (error) {
        const normalized = normalizeError(error, 'Discord notification failed');
        logger.error(
          {
            err: normalized,
            eventId: event.id,
            notificationType,
          },
          'Discord Direct: Notification error'
        );
        return {
          success: false,
          error: normalized.message ?? 'Discord notification failed',
        };
      }
    });
  }
);
