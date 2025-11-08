/**
 * Discord notifications for new content submissions (spam filtered)
 */

import type { Database } from '../_shared/database.types.ts';
import { buildSubmissionEmbed, sendDiscordWebhook } from '../_shared/utils/discord.ts';
import {
  type DatabaseWebhookPayload,
  filterEventType,
  handleCorsPreflight,
  validateWebhookUrl,
  webhookErrorResponse,
  webhookSkipResponse,
  webhookSuccessResponse,
} from '../_shared/utils/webhook-handler.ts';

type ContentSubmission = Database['public']['Tables']['content_submissions']['Row'];

const SPAM_THRESHOLD = 0.7;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflight();
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const webhookUrl = validateWebhookUrl(
      Deno.env.get('DISCORD_WEBHOOK_URL'),
      'DISCORD_WEBHOOK_URL'
    );
    if (webhookUrl instanceof Response) return webhookUrl;

    const payload: DatabaseWebhookPayload<ContentSubmission> = await req.json();

    if (!filterEventType(payload, ['INSERT'])) {
      console.log(`Skipping ${payload.type} event`);
      return webhookSkipResponse('Not an INSERT event');
    }

    if (payload.record.spam_score !== null && payload.record.spam_score > SPAM_THRESHOLD) {
      console.log(`Skipping spam submission (score: ${payload.record.spam_score})`);
      return webhookSkipResponse('Spam detected');
    }

    const embed = buildSubmissionEmbed(payload.record);
    await sendDiscordWebhook(
      webhookUrl,
      { content: '🆕 **New Content Submission**', embeds: [embed] },
      'submission_notification',
      payload.record.id
    );

    console.log(`Discord notification sent for submission: ${payload.record.id}`);
    return webhookSuccessResponse({ submission_id: payload.record.id });
  } catch (error) {
    return webhookErrorResponse(error, 'Discord notification');
  }
});
