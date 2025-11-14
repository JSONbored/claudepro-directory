/**
 * Discord Router - Unified Discord notification handler
 * Routes ALL Discord notifications through single edge function
 * Called by database triggers with X-Discord-Notification-Type header
 */

import type { Database } from '../_shared/database.types.ts';
import {
  buildChangelogEmbed,
  buildContentEmbed,
  buildErrorEmbed,
  buildSubmissionEmbed,
  type ChangelogSection,
  type GitHubCommit,
  logOutboundWebhookEvent,
  sendDiscordWebhook,
  updateDiscordMessage as updateDiscordMessageUtil,
  updateWebhookEventStatus,
} from '../_shared/utils/discord.ts';
import {
  badRequestResponse,
  errorResponse,
  methodNotAllowedResponse,
  publicCorsHeaders,
  successResponse,
} from '../_shared/utils/response.ts';
import { supabaseServiceRole } from '../_shared/utils/supabase-service-role.ts';
import {
  type DatabaseWebhookPayload,
  didStatusChangeTo,
  filterEventType,
  validateWebhookUrl,
} from '../_shared/utils/webhook-handler.ts';

type JobRow = Database['public']['Tables']['jobs']['Row'];
type ContentSubmission = Database['public']['Tables']['content_submissions']['Row'];
interface WebhookEventRecord {
  id: string;
  type: string;
  created_at: string;
  error: string | null;
  data: Record<string, unknown>;
  processed: boolean;
  processed_at: string | null;
  retry_count: number;
  next_retry_at: string | null;
  received_at: string;
  svix_id: string | null;
}

// Discord-specific CORS headers
const discordCorsHeaders = {
  ...publicCorsHeaders,
  'Access-Control-Allow-Headers': 'Content-Type, X-Discord-Notification-Type',
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: discordCorsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return methodNotAllowedResponse('POST', discordCorsHeaders);
  }

  // Route based on X-Discord-Notification-Type header (set by database trigger)
  const notificationType = req.headers.get('X-Discord-Notification-Type');

  if (!notificationType) {
    return badRequestResponse('Missing X-Discord-Notification-Type header', discordCorsHeaders);
  }

  try {
    switch (notificationType) {
      case 'job':
        return await handleJobNotification(req);
      case 'submission':
        return await handleSubmissionNotification(req);
      case 'content':
        return await handleContentNotification(req);
      case 'error':
        return await handleErrorNotification(req);
      case 'changelog':
        return await handleChangelogNotification(req);
      default:
        return badRequestResponse(
          `Unknown notification type: ${notificationType}`,
          discordCorsHeaders
        );
    }
  } catch (error) {
    return errorResponse(error, `discord-router:${notificationType}`, discordCorsHeaders);
  }
});

/**
 * Job Notifications - Option 1 (Single Message with In-Place Updates)
 * Identical logic to jobs-handler/index.ts (after Phase 3 refactor)
 */
async function handleJobNotification(req: Request): Promise<Response> {
  const webhookUrl = validateWebhookUrl(
    Deno.env.get('DISCORD_WEBHOOK_JOBS'),
    'DISCORD_WEBHOOK_JOBS'
  );
  if (webhookUrl instanceof Response) {
    return errorResponse(
      new Error('Discord webhook not configured'),
      'handleJobNotification',
      discordCorsHeaders
    );
  }

  const payload: DatabaseWebhookPayload<JobRow> = await req.json();
  const job = payload.record;

  // Skip placeholder jobs
  if (job.is_placeholder) {
    return successResponse({ skipped: true, reason: 'Placeholder job' }, 200, discordCorsHeaders);
  }

  // Skip if not a relevant status
  if (!job.status || job.status === 'draft') {
    return successResponse(
      { skipped: true, reason: 'Draft status - no notification needed' },
      200,
      discordCorsHeaders
    );
  }

  // Get unified Discord embed from database
  const { data: embedData, error: embedError } = await supabaseServiceRole.rpc(
    'build_job_discord_embed',
    { p_job_id: job.id }
  );

  if (embedError || !embedData) {
    console.error('Failed to build embed:', embedError);
    throw new Error('Embed generation failed');
  }

  // OPTION 1 LOGIC: Check if Discord message already exists
  if (job.discord_message_id) {
    // UPDATE existing message
    return await updateJobDiscordMessage(job, embedData, webhookUrl);
  }
  // CREATE new message
  return await createJobDiscordMessage(job, embedData, webhookUrl);
}

/**
 * Create new Discord message for job with ?wait=true to get message_id
 */
async function createJobDiscordMessage(
  job: JobRow,
  embedData: unknown,
  webhookUrl: string
): Promise<Response> {
  console.log(`Creating new Discord message for job: ${job.id}`);

  // Log webhook event BEFORE Discord API call
  const webhookEventId = await logOutboundWebhookEvent(
    'job_notification_create',
    {
      job_id: job.id,
      status: job.status,
      action: 'create',
    },
    job.id
  );

  const response = await fetch(`${webhookUrl}?wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [embedData],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create Discord message:', {
      status: response.status,
      error: errorText,
    });

    if (webhookEventId) {
      await updateWebhookEventStatus(
        webhookEventId,
        false,
        response.status,
        `Discord API error: ${response.statusText} - ${errorText}`
      );
    }

    throw new Error(`Discord API error: ${response.statusText}`);
  }

  const messageData = await response.json();
  const messageId = messageData.id;

  if (webhookEventId) {
    await updateWebhookEventStatus(webhookEventId, true, response.status, undefined, {
      message_id: messageId,
    });
  }

  // Store message_id in database for future updates
  const { error: updateError } = await supabaseServiceRole
    .from('jobs')
    .update({ discord_message_id: messageId })
    .eq('id', job.id);

  if (updateError) {
    console.error('Failed to store discord_message_id:', updateError);
  }

  console.log(`✅ Created Discord message: ${messageId} for job: ${job.id}`);
  return successResponse(
    {
      job_id: job.id,
      message_id: messageId,
      action: 'created',
    },
    200,
    discordCorsHeaders
  );
}

/**
 * Update existing Discord message for job using PATCH
 */
async function updateJobDiscordMessage(
  job: JobRow,
  embedData: unknown,
  webhookUrl: string
): Promise<Response> {
  if (!job.discord_message_id) {
    console.log(`No discord_message_id for job ${job.id}, creating new message`);
    return await createJobDiscordMessage(job, embedData, webhookUrl);
  }

  console.log(`Updating Discord message: ${job.discord_message_id} for job: ${job.id}`);

  const result = await updateDiscordMessageUtil(
    webhookUrl,
    job.discord_message_id,
    { embeds: [embedData] },
    'job_notification',
    job.id,
    { action: 'update', job_id: job.id, status: job.status }
  );

  // Handle 404 - message was deleted, create new one
  if (result.deleted) {
    console.log('Discord message deleted, creating new one');
    await supabaseServiceRole.from('jobs').update({ discord_message_id: null }).eq('id', job.id);
    return await createJobDiscordMessage(job, embedData, webhookUrl);
  }

  console.log(`✅ Updated Discord message: ${job.discord_message_id} for job: ${job.id}`);
  return successResponse(
    {
      job_id: job.id,
      message_id: job.discord_message_id,
      action: 'updated',
    },
    200,
    discordCorsHeaders
  );
}

/**
 * Submission Notifications - Spam filtered
 * Logic from discord-submission-notification/index.ts
 */
async function handleSubmissionNotification(req: Request): Promise<Response> {
  const webhookUrl = validateWebhookUrl(Deno.env.get('DISCORD_WEBHOOK_URL'), 'DISCORD_WEBHOOK_URL');
  if (webhookUrl instanceof Response) {
    return errorResponse(
      new Error('Discord webhook not configured'),
      'handleSubmissionNotification',
      discordCorsHeaders
    );
  }

  const payload: DatabaseWebhookPayload<ContentSubmission> = await req.json();

  if (!filterEventType(payload, ['INSERT'])) {
    console.log(`Skipping ${payload.type} event`);
    return successResponse(
      { skipped: true, reason: 'Not an INSERT event' },
      200,
      discordCorsHeaders
    );
  }

  const SPAM_THRESHOLD = 0.7;
  if (payload.record.spam_score !== null && payload.record.spam_score > SPAM_THRESHOLD) {
    console.log(`Skipping spam submission (score: ${payload.record.spam_score})`);
    return successResponse({ skipped: true, reason: 'Spam detected' }, 200, discordCorsHeaders);
  }

  const embed = buildSubmissionEmbed(payload.record);
  await sendDiscordWebhook(
    webhookUrl,
    { content: '🆕 **New Content Submission**', embeds: [embed] },
    'submission_notification',
    payload.record.id
  );

  console.log(`Discord notification sent for submission: ${payload.record.id}`);
  return successResponse({ submission_id: payload.record.id }, 200, discordCorsHeaders);
}

/**
 * Content Announcements - Published content (status → merged)
 * Logic from discord-content-announcement/index.ts
 */
async function handleContentNotification(req: Request): Promise<Response> {
  const webhookUrl = validateWebhookUrl(
    Deno.env.get('DISCORD_ANNOUNCEMENTS_WEBHOOK_URL'),
    'DISCORD_ANNOUNCEMENTS_WEBHOOK_URL'
  );
  if (webhookUrl instanceof Response) {
    return errorResponse(
      new Error('Discord webhook not configured'),
      'handleContentNotification',
      discordCorsHeaders
    );
  }

  const payload: DatabaseWebhookPayload<ContentSubmission> = await req.json();

  if (!didStatusChangeTo(payload, 'merged')) {
    console.log(
      `Skipping - status not changed to merged (old: ${payload.old_record?.status}, new: ${payload.record.status})`
    );
    return successResponse(
      { skipped: true, reason: 'Status not changed to merged' },
      200,
      discordCorsHeaders
    );
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
  return successResponse({ content_id: content.id }, 200, discordCorsHeaders);
}

/**
 * Error Notifications - From webhook_events table
 * Logic from discord-error-relay/index.ts
 */
async function handleErrorNotification(req: Request): Promise<Response> {
  const webhookUrl = validateWebhookUrl(
    Deno.env.get('DISCORD_EDGE_FUNCTION_ERRORS_WEBHOOK'),
    'DISCORD_EDGE_FUNCTION_ERRORS_WEBHOOK'
  );
  if (webhookUrl instanceof Response) {
    return errorResponse(
      new Error('Discord webhook not configured'),
      'handleErrorNotification',
      discordCorsHeaders
    );
  }

  const payload: DatabaseWebhookPayload<WebhookEventRecord> = await req.json();

  if (!filterEventType(payload, ['INSERT', 'UPDATE'])) {
    console.log(`Skipping ${payload.type} event`);
    return successResponse(
      { skipped: true, reason: 'Not an INSERT/UPDATE event' },
      200,
      discordCorsHeaders
    );
  }

  if (!payload.record.error) {
    console.log('Skipping - no error present');
    return successResponse({ skipped: true, reason: 'No error present' }, 200, discordCorsHeaders);
  }

  const embed = buildErrorEmbed(payload.record);
  await sendDiscordWebhook(
    webhookUrl,
    { embeds: [embed] },
    'error_notification',
    payload.record.id
  );

  console.log(`Discord error notification sent for event: ${payload.record.id}`);
  return successResponse({ event_id: payload.record.id }, 200, discordCorsHeaders);
}

/**
 * Changelog Announcements - Release notifications
 * For future use (manual changelog creation via admin UI)
 */
async function handleChangelogNotification(req: Request): Promise<Response> {
  const webhookUrl = validateWebhookUrl(
    Deno.env.get('DISCORD_CHANGELOG_WEBHOOK_URL'),
    'DISCORD_CHANGELOG_WEBHOOK_URL'
  );
  if (webhookUrl instanceof Response) {
    return errorResponse(
      new Error('Discord webhook not configured'),
      'handleChangelogNotification',
      discordCorsHeaders
    );
  }

  interface ChangelogPayload {
    slug: string;
    title: string;
    tldr: string;
    sections: ChangelogSection[];
    commits: GitHubCommit[];
    date: string;
    changelog_id?: string;
  }

  const payload: ChangelogPayload = await req.json();

  const embed = buildChangelogEmbed({
    slug: payload.slug,
    title: payload.title,
    tldr: payload.tldr,
    sections: payload.sections,
    commits: payload.commits,
    date: payload.date,
  });

  await sendDiscordWebhook(
    webhookUrl,
    { content: '🚀 **New Release Deployed!**', embeds: [embed] },
    'changelog_announcement',
    payload.changelog_id
  );

  console.log(`Discord changelog announcement sent: ${payload.slug}`);
  return successResponse({ changelog_slug: payload.slug }, 200, discordCorsHeaders);
}
