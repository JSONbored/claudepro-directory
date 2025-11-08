/**
 * Discord announcements for newly published content (status → merged)
 */

import type { Database } from '../_shared/database.types.ts';
import { buildContentEmbed, sendDiscordWebhook } from '../_shared/utils/discord.ts';
import { supabaseServiceRole } from '../_shared/utils/supabase-service-role.ts';
import {
  type DatabaseWebhookPayload,
  didStatusChangeTo,
  handleCorsPreflight,
  validateWebhookUrl,
  webhookErrorResponse,
  webhookSkipResponse,
  webhookSuccessResponse,
} from '../_shared/utils/webhook-handler.ts';

type ContentSubmission = Database['public']['Tables']['content_submissions']['Row'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflight();
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const webhookUrl = validateWebhookUrl(
      Deno.env.get('DISCORD_ANNOUNCEMENTS_WEBHOOK_URL'),
      'DISCORD_ANNOUNCEMENTS_WEBHOOK_URL'
    );
    if (webhookUrl instanceof Response) return webhookUrl;

    const payload: DatabaseWebhookPayload<ContentSubmission> = await req.json();

    if (!didStatusChangeTo(payload, 'merged')) {
      console.log(
        `Skipping - status not changed to merged (old: ${payload.old_record?.status}, new: ${payload.record.status})`
      );
      return webhookSkipResponse('Status not changed to merged');
    }

    const { data: content, error: contentError } = await supabaseServiceRole
      .from('content')
      .select(
        'id, category, slug, title, display_title, description, author, author_profile_url, tags, date_added'
      )
      .eq('category', payload.record.category)
      .eq('slug', payload.record.auto_slug ?? '')
      .single();

    if (contentError || !content) {
      console.error('Failed to fetch content:', contentError);
      throw new Error(`Content not found for slug: ${payload.record.auto_slug}`);
    }

    const embed = buildContentEmbed(content);
    await sendDiscordWebhook(
      webhookUrl,
      { content: '🎉 **New Content Added to Claude Pro Directory!**', embeds: [embed] },
      'content_announcement',
      content.id
    );

    console.log(`Discord announcement sent for content: ${content.id}`);
    return webhookSuccessResponse({ content_id: content.id });
  } catch (error) {
    return webhookErrorResponse(error, 'Discord announcement');
  }
});
