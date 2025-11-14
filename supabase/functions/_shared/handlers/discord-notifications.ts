import type { Database } from '../database.types.ts';
import {
  createDiscordMessageWithLogging,
  sendDiscordWebhook,
  updateDiscordMessage as updateDiscordMessageUtil,
} from '../utils/discord/client.ts';
import {
  buildChangelogEmbed,
  buildContentEmbed,
  buildErrorEmbed,
  buildSubmissionEmbed,
  type GitHubCommit,
} from '../utils/discord/embeds.ts';
import { insertNotification } from '../utils/notifications-service.ts';
import {
  badRequestResponse,
  discordCorsHeaders,
  errorResponse,
  successResponse,
} from '../utils/response.ts';
import { SITE_URL, supabaseServiceRole } from '../utils/supabase-clients.ts';
import {
  type DatabaseWebhookPayload,
  didStatusChangeTo,
  filterEventType,
  validateWebhookUrl,
} from '../utils/webhook/database-events.ts';

type JobRow = Database['public']['Tables']['jobs']['Row'];
type ContentSubmission = Database['public']['Tables']['content_submissions']['Row'];

interface WebhookEventRecord {
  id: string;
  type: string;
  created_at: string;
  error: string | null;
}

export async function handleDiscordNotification(
  req: Request,
  notificationType: string
): Promise<Response> {
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
    return errorResponse(error, `discord-notification:${notificationType}`, discordCorsHeaders);
  }
}

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

  if (job.is_placeholder) {
    return successResponse({ skipped: true, reason: 'Placeholder job' }, 200, discordCorsHeaders);
  }

  if (!job.status || job.status === 'draft') {
    return successResponse(
      { skipped: true, reason: 'Draft status - no notification needed' },
      200,
      discordCorsHeaders
    );
  }

  const { data: embedData, error: embedError } = await supabaseServiceRole.rpc(
    'build_job_discord_embed',
    { p_job_id: job.id }
  );

  if (embedError || !embedData) {
    console.error('Failed to build embed:', embedError);
    throw new Error('Embed generation failed');
  }

  if (job.discord_message_id) {
    return await updateJobDiscordMessage(job, embedData, webhookUrl);
  }
  return await createJobDiscordMessage(job, embedData, webhookUrl);
}

async function createJobDiscordMessage(
  job: JobRow,
  embedData: unknown,
  webhookUrl: string
): Promise<Response> {
  const payload = { embeds: [embedData] };
  const { messageId } = await createDiscordMessageWithLogging(
    webhookUrl,
    payload,
    'job_notification',
    {
      relatedId: job.id,
      metadata: {
        job_id: job.id,
        status: job.status,
        action: 'create',
      },
      logType: 'job_notification_create',
    }
  );

  if (!messageId) {
    throw new Error('Discord response missing message ID');
  }

  const { error: updateError } = await supabaseServiceRole
    .from('jobs')
    .update({ discord_message_id: messageId })
    .eq('id', job.id);

  if (updateError) {
    console.error('Failed to store discord_message_id:', updateError);
  }

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

async function updateJobDiscordMessage(
  job: JobRow,
  embedData: unknown,
  webhookUrl: string
): Promise<Response> {
  if (!job.discord_message_id) {
    return await createJobDiscordMessage(job, embedData, webhookUrl);
  }

  const result = await updateDiscordMessageUtil(
    webhookUrl,
    job.discord_message_id,
    { embeds: [embedData] },
    'job_notification',
    job.id,
    { action: 'update', job_id: job.id, status: job.status }
  );

  if (result.deleted) {
    await supabaseServiceRole.from('jobs').update({ discord_message_id: null }).eq('id', job.id);
    return await createJobDiscordMessage(job, embedData, webhookUrl);
  }

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
    return successResponse(
      { skipped: true, reason: 'Not an INSERT event' },
      200,
      discordCorsHeaders
    );
  }

  const SPAM_THRESHOLD = 0.7;
  if (payload.record.spam_score !== null && payload.record.spam_score > SPAM_THRESHOLD) {
    return successResponse({ skipped: true, reason: 'Spam detected' }, 200, discordCorsHeaders);
  }

  const embed = buildSubmissionEmbed(payload.record);
  await sendDiscordWebhook(
    webhookUrl,
    { content: '🆕 **New Content Submission**', embeds: [embed] },
    'submission_notification',
    {
      relatedId: payload.record.id,
      metadata: {
        submission_id: payload.record.id,
        submission_type: payload.record.submission_type,
        category: payload.record.category,
      },
    }
  );

  return successResponse({ submission_id: payload.record.id }, 200, discordCorsHeaders);
}

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
    {
      relatedId: content.id,
      metadata: {
        content_id: content.id,
        category: content.category,
        slug: content.slug,
      },
    }
  );

  await insertNotification({
    id: content.id,
    title: content.display_title ?? content.title,
    message: content.description ?? payload.record.description ?? 'New content just dropped.',
    type: 'announcement',
    priority: 'medium',
    action_label: 'View content',
    action_href: `${SITE_URL}/${content.category}/${content.slug}`,
    metadata: {
      content_id: content.id,
      category: content.category,
      slug: content.slug,
      source: 'content-notification',
    },
  });

  return successResponse({ content_id: content.id }, 200, discordCorsHeaders);
}

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
    return successResponse(
      { skipped: true, reason: 'Not an INSERT/UPDATE event' },
      200,
      discordCorsHeaders
    );
  }

  if (!payload.record.error) {
    return successResponse({ skipped: true, reason: 'No error present' }, 200, discordCorsHeaders);
  }

  const embed = buildErrorEmbed(payload.record);
  await sendDiscordWebhook(
    webhookUrl,
    { content: '⚠️ **Edge Function Error Alert**', embeds: [embed] },
    'error_notification',
    {
      relatedId: payload.record.id,
      metadata: {
        webhook_event_id: payload.record.id,
        type: payload.record.type,
        error: payload.record.error,
      },
    }
  );

  return successResponse({ webhook_event_id: payload.record.id }, 200, discordCorsHeaders);
}

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

  const payload: DatabaseWebhookPayload<Database['public']['Tables']['changelog_entries']['Row']> =
    await req.json();
  const entry = payload.record;

  if (!entry) {
    return badRequestResponse('Missing changelog record', discordCorsHeaders);
  }

  const sections = (entry.changes || []) as Array<{
    title: string;
    items: string[];
  }>;

  const embed = buildChangelogEmbed({
    slug: entry.slug,
    title: entry.title,
    tldr: entry.summary ?? '',
    sections,
    commits: [] as GitHubCommit[],
    date: entry.published_at ?? entry.created_at ?? new Date().toISOString(),
  });

  await sendDiscordWebhook(
    webhookUrl,
    { content: '📝 **Changelog Update**', embeds: [embed] },
    'changelog_notification',
    {
      relatedId: entry.id,
      metadata: {
        changelog_id: entry.id,
        slug: entry.slug,
      },
    }
  );

  await insertNotification({
    id: entry.id,
    title: entry.title,
    message: entry.summary ?? 'We just published new release notes.',
    type: 'announcement',
    priority: 'medium',
    action_label: 'View changelog',
    action_href: `${SITE_URL}/changelog/${entry.slug}`,
    metadata: {
      slug: entry.slug,
      changelog_id: entry.id,
      source: 'changelog-notification',
    },
  });

  return successResponse({ changelog_id: entry.id }, 200, discordCorsHeaders);
}
