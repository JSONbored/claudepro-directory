/**
 * Discord error notifications from webhook_events table
 */

import { buildErrorEmbed, sendDiscordWebhook } from '../_shared/utils/discord.ts';
import {
  type DatabaseWebhookPayload,
  filterEventType,
  handleCorsPreflight,
  validateWebhookUrl,
  webhookErrorResponse,
  webhookSkipResponse,
  webhookSuccessResponse,
} from '../_shared/utils/webhook-handler.ts';

interface WebhookEventRecord {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown>;
  processed: boolean;
  processed_at: string | null;
  error: string | null;
  retry_count: number;
  next_retry_at: string | null;
  received_at: string;
  svix_id: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflight();
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const webhookUrl = validateWebhookUrl(
      Deno.env.get('DISCORD_EDGE_FUNCTION_ERRORS_WEBHOOK'),
      'DISCORD_EDGE_FUNCTION_ERRORS_WEBHOOK'
    );
    if (webhookUrl instanceof Response) return webhookUrl;

    const payload: DatabaseWebhookPayload<WebhookEventRecord> = await req.json();

    if (!filterEventType(payload, ['INSERT', 'UPDATE'])) {
      console.log(`Skipping ${payload.type} event`);
      return webhookSkipResponse('Not an INSERT/UPDATE event');
    }

    if (!payload.record.error) {
      console.log('Skipping - no error present');
      return webhookSkipResponse('No error present');
    }

    const embed = buildErrorEmbed(payload.record);
    await sendDiscordWebhook(
      webhookUrl,
      { embeds: [embed] },
      'error_notification',
      payload.record.id
    );

    console.log(`Discord error notification sent for event: ${payload.record.id}`);
    return webhookSuccessResponse({ event_id: payload.record.id });
  } catch (error) {
    return webhookErrorResponse(error, 'Discord error relay');
  }
});
