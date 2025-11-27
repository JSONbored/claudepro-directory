import { supabaseServiceRole } from '../../clients/supabase.ts';
import { edgeEnv } from '../../config/env.ts';
import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { insertNotification } from '../../notifications/service.ts';
import { invalidateCacheByKey } from '../../utils/cache.ts';
import {
  createDiscordMessageWithLogging,
  sendDiscordWebhook,
  updateDiscordMessage as updateDiscordMessageUtil,
} from '../../utils/discord/client.ts';
import {
  buildChangelogEmbed,
  buildContentEmbed,
  buildErrorEmbed,
  buildSubmissionEmbed,
} from '../../utils/discord/embeds.ts';
import { errorToString, logError, logInfo } from '@heyclaude/shared-runtime';
import { logger } from '../../utils/logger.ts';
import {
  badRequestResponse,
  discordCorsHeaders,
  errorResponse,
  successResponse,
} from '../../utils/http.ts';
import { createDiscordHandlerContext, withContext } from '@heyclaude/shared-runtime';
import { pgmqSend } from '../../utils/pgmq-client.ts';
import {
  type DatabaseWebhookPayload,
  didStatusChangeTo,
  filterEventType,
  validateWebhookUrl,
} from '../../utils/webhook/database-events.ts';

type JobRow = DatabaseGenerated['public']['Tables']['jobs']['Row'];
type ContentSubmission = DatabaseGenerated['public']['Tables']['content_submissions']['Row'];
type WebhookEventRecord = DatabaseGenerated['public']['Tables']['webhook_events']['Row'];
type ChangelogRow = DatabaseGenerated['public']['Tables']['changelog']['Row'];
type JobDiscordEmbed = DatabaseGenerated['public']['CompositeTypes']['discord_embed'];

type DiscordEmbedPayload = {
  title?: string;
  description?: string;
  color?: number | null;
  fields: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
  timestamp?: string;
};

function formatJobDiscordEmbed(embed: JobDiscordEmbed): DiscordEmbedPayload {
  const fields =
    embed.fields?.map((field) => ({
      name: field?.name ?? '—',
      value: field?.value ?? 'N/A',
      inline: field?.inline ?? false,
    })) ?? [];

  return {
    ...(embed.title ? { title: embed.title } : {}),
    ...(embed.description ? { description: embed.description } : {}),
    ...(embed.color !== null ? { color: embed.color } : {}),
    fields,
    ...(embed.footer?.text ? { footer: { text: embed.footer.text } } : {}),
    ...(embed.timestamp ? { timestamp: embed.timestamp } : {}),
  };
}

// Type guard to validate database webhook payload structure
function isValidDatabaseWebhookPayload<T>(
  value: unknown,
  validateRecord: (record: unknown) => record is T
): value is DatabaseWebhookPayload<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc?.value;
  };

  const getStringProperty = (obj: unknown, key: string): string | undefined => {
    const value = getProperty(obj, key);
    return typeof value === 'string' ? value : undefined;
  };

  const type = getStringProperty(value, 'type');
  const table = getStringProperty(value, 'table');
  const schema = getStringProperty(value, 'schema');
  const record = getProperty(value, 'record');
  const oldRecord = getProperty(value, 'old_record');

  // Validate type is one of the allowed values
  if (type !== 'INSERT' && type !== 'UPDATE' && type !== 'DELETE') {
    return false;
  }

  if (!(table && schema && validateRecord(record))) {
    return false;
  }

  // old_record is optional, but if present must be T or null
  if (oldRecord !== undefined && oldRecord !== null) {
    if (!validateRecord(oldRecord)) {
      return false;
    }
  }

  return true;
}

// Type guard to validate JobRow
function isValidJobRow(value: unknown): value is JobRow {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  // Basic validation - check for required fields
  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc?.value;
  };
  const id = getProperty(value, 'id');
  return typeof id === 'string';
}

// Type guard to validate ContentSubmission
function isValidContentSubmission(value: unknown): value is ContentSubmission {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc?.value;
  };
  const id = getProperty(value, 'id');
  return typeof id === 'string';
}

// Type guard to validate WebhookEventRecord
function isValidWebhookEventRecord(value: unknown): value is WebhookEventRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc?.value;
  };
  const id = getProperty(value, 'id');
  return typeof id === 'string';
}

// Type guard to validate ChangelogRow
function isValidChangelogRow(value: unknown): value is ChangelogRow {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc?.value;
  };
  const id = getProperty(value, 'id');
  return typeof id === 'string';
}

/**
 * Direct handler for job notifications (called from Realtime subscriptions)
 * Accepts payload directly instead of Request object
 */
export async function handleJobNotificationDirect(
  payload: DatabaseWebhookPayload<JobRow>
): Promise<void> {
  const webhookUrl = validateWebhookUrl(edgeEnv.discord.jobs, 'DISCORD_WEBHOOK_JOBS');
  if (webhookUrl instanceof Response) {
    logger.error('Discord webhook not configured for jobs');
    return;
  }

  const job = payload.record;

  if (job.is_placeholder) {
    logger.info('Skipping placeholder job', { jobId: job.id });
    return;
  }

  if (!job.status || job.status === 'draft') {
    logger.info('Skipping draft job', { jobId: job.id });
    return;
  }

  const rpcArgs = {
    p_job_id: job.id,
  } satisfies DatabaseGenerated['public']['Functions']['build_job_discord_embed']['Args'];
  const { data, error: embedError } = await supabaseServiceRole.rpc('build_job_discord_embed', rpcArgs);
  const embedData = data as JobDiscordEmbed | null;

  if (embedError || !embedData) {
    const logContext = createDiscordHandlerContext('job-notification', {
      jobId: job.id,
    });
    const error = embedError instanceof Error ? embedError : new Error(String(embedError));
    logger.error('Failed to build embed', { ...logContext, err: error });
    return;
  }

  if (job.discord_message_id) {
    await updateJobDiscordMessageDirect(job, embedData, webhookUrl);
  } else {
    await createJobDiscordMessageDirect(job, embedData, webhookUrl);
  }
}

async function createJobDiscordMessageDirect(
  job: JobRow,
  embedData: JobDiscordEmbed,
  webhookUrl: string
): Promise<void> {
  const logContext = createDiscordHandlerContext('job-notification', {
    jobId: job.id,
  });

  const payload = { embeds: [formatJobDiscordEmbed(embedData)] };
  const { messageId } = await createDiscordMessageWithLogging(
    webhookUrl,
    payload,
    'job_notification_create',
    {
      relatedId: job.id,
      metadata: {
        job_id: job.id,
        status: job.status,
        action: 'create',
      },
      logContext,
    }
  );

  if (!messageId) {
    logger.error('Discord response missing message ID', logContext);
    return;
  }

  const updateData = {
    discord_message_id: messageId,
  } satisfies DatabaseGenerated['public']['Tables']['jobs']['Update'];
  const { error: updateError } = await supabaseServiceRole
    .from('jobs')
    .update(updateData)
    .eq('id', job.id);

  if (updateError) {
    logger.error('Failed to store discord_message_id', {
      ...logContext,
      error: updateError instanceof Error ? updateError.message : String(updateError),
    });
  }
}

async function updateJobDiscordMessageDirect(
  job: JobRow,
  embedData: JobDiscordEmbed,
  webhookUrl: string
): Promise<void> {
  const logContext = createDiscordHandlerContext('job-notification', {
    jobId: job.id,
  });

  if (!job.discord_message_id) {
    await createJobDiscordMessageDirect(job, embedData, webhookUrl);
    return;
  }

  const result = await updateDiscordMessageUtil(
    webhookUrl,
    job.discord_message_id,
    { embeds: [formatJobDiscordEmbed(embedData)] },
    'job_notification_update',
    job.id,
    { action: 'update', job_id: job.id, status: job.status },
    logContext
  );

  if (result.deleted) {
    const nullUpdateData = {
      discord_message_id: null,
    } satisfies DatabaseGenerated['public']['Tables']['jobs']['Update'];
    await supabaseServiceRole.from('jobs').update(nullUpdateData).eq('id', job.id);
    await createJobDiscordMessageDirect(job, embedData, webhookUrl);
  }
}

/**
 * Direct handler for submission notifications (called from Realtime subscriptions)
 */
export async function handleSubmissionNotificationDirect(
  payload: DatabaseWebhookPayload<ContentSubmission>
): Promise<void> {
  const webhookUrl = validateWebhookUrl(edgeEnv.discord.defaultWebhook, 'DISCORD_WEBHOOK_URL');
  if (webhookUrl instanceof Response) {
    logger.error('Discord webhook not configured for submissions');
    return;
  }

  if (!filterEventType(payload, ['INSERT'])) {
    logger.info('Skipping non-INSERT submission event', {
      type: payload.type,
      submissionId: payload.record.id,
    });
    return;
  }

  const SPAM_THRESHOLD = 0.7;
  if (payload.record.spam_score !== null && payload.record.spam_score > SPAM_THRESHOLD) {
    logger.info('Skipping spam submission', {
      submissionId: payload.record.id,
      spamScore: payload.record.spam_score,
    });
    return;
  }

  const logContext = createDiscordHandlerContext('submission-notification', {
    contentId: payload.record.id,
  });

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
      logContext,
    }
  );
}

/**
 * Direct handler for content announcements (called from Realtime subscriptions)
 */
export async function handleContentNotificationDirect(
  payload: DatabaseWebhookPayload<ContentSubmission>
): Promise<void> {
  const webhookUrl = validateWebhookUrl(
    edgeEnv.discord.announcements,
    'DISCORD_ANNOUNCEMENTS_WEBHOOK_URL'
  );
  if (webhookUrl instanceof Response) {
    logger.error('Discord webhook not configured for announcements');
    return;
  }

  if (!didStatusChangeTo(payload, 'merged')) {
    logger.info('Skipping non-merged submission', {
      submissionId: payload.record.id,
      status: payload.record.status,
    });
    return;
  }

  const { data: content, error: contentError } = await supabaseServiceRole
    .from('content')
    .select(
      'id, category, slug, title, display_title, description, author, author_profile_url, tags, date_added'
    )
    .eq('category', payload.record.category)
    .eq('slug', payload.record.approved_slug ?? '')
    .single<DatabaseGenerated['public']['Tables']['content']['Row']>();

  const logContext = createDiscordHandlerContext('content-notification', {
    ...(content?.id !== undefined ? { contentId: content.id } : {}),
    ...(content?.category !== null && content?.category !== undefined
      ? { category: content.category }
      : {}),
    ...(content?.slug !== null && content?.slug !== undefined ? { slug: content.slug } : {}),
  });

  if (contentError || !content) {
    logger.error('Failed to fetch content', {
      ...logContext,
      error: errorToString(contentError),
      approved_slug: payload.record.approved_slug,
    });
    return;
  }

  const updatedContext = withContext(logContext, {
    content_id: content.id,
    category: content.category,
    slug: content.slug,
  });

  const embed = buildContentEmbed(content);
  await sendDiscordWebhook(
    webhookUrl,
    {
      content: '🎉 **New Content Added to Claude Pro Directory!**',
      embeds: [embed],
    },
    'content_announcement',
    {
      relatedId: content.id,
      metadata: {
        content_id: content.id,
        category: content.category,
        slug: content.slug,
      },
      logContext: updatedContext,
    }
  );

  // Insert notification (same as original handler)
  await insertNotification(
    {
      id: content.id,
      title: content.display_title ?? content.title ?? 'New content',
      message: content.description ?? payload.record.description ?? 'New content just dropped.',
      type: 'announcement' satisfies DatabaseGenerated['public']['Enums']['notification_type'],
      priority: 'medium',
      action_label: 'View content',
      // Database constraint requires action_href to start with '/' (relative path) or be NULL
      action_href: `/${content.category}/${content.slug}`,
      metadata: {
        content_id: content.id,
        category: content.category,
        slug: content.slug,
        source: 'content-notification',
      },
    },
    updatedContext
  );

  // Enqueue content card generation (non-blocking, async processing)
  // Only enqueue if content has a title (required for card generation)
  const cardTitle = content.display_title ?? content.title;
  if (cardTitle && cardTitle.trim()) {
    try {
      await pgmqSend('image_generation', {
        type: 'card',
        content_id: content.id,
        category: content.category,
        slug: content.slug,
        params: {
          title: cardTitle,
          description: content.description ?? '',
          author: content.author ?? '',
          tags: content.tags ?? [],
          featured: false, // Could check if content is featured in the future
          rating: null,
          viewCount: 0,
        },
        priority: 'normal',
        created_at: new Date().toISOString(),
      });
      logInfo('Content card generation queued', {
        ...updatedContext,
        content_id: content.id,
      });
    } catch (error) {
      // Non-critical - log but don't fail the webhook
      logError('Failed to enqueue card generation', updatedContext, error);
    }
  } else {
    logInfo('Skipping card generation - content has no title', {
      ...updatedContext,
      content_id: content.id,
    });
  }

  // Invalidate cache after notification insert (same as original handler)
  await invalidateCacheByKey('cache.invalidate.notifications', ['notifications'], {
    logContext: updatedContext,
  }).catch((error) => {
    logger.warn('Cache invalidation failed', {
      ...updatedContext,
      error: errorToString(error),
    });
  });

  await invalidateCacheByKey(
    'cache.invalidate.content_create',
    ['content', 'homepage', 'trending'],
    {
      ...(content.category !== undefined ? { category: content.category } : {}),
      ...(content.slug !== undefined ? { slug: content.slug } : {}),
      logContext: updatedContext,
    }
  ).catch((error) => {
    logger.warn('Cache invalidation failed', {
      ...updatedContext,
      error: errorToString(error),
    });
  });
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
  const webhookUrl = validateWebhookUrl(edgeEnv.discord.jobs, 'DISCORD_WEBHOOK_JOBS');
  if (webhookUrl instanceof Response) {
    return errorResponse(
      new Error('Discord webhook not configured'),
      'handleJobNotification',
      discordCorsHeaders
    );
  }

  const body = await req.json();
  if (!isValidDatabaseWebhookPayload(body, isValidJobRow)) {
    return badRequestResponse('Invalid webhook payload structure', discordCorsHeaders);
  }
  const payload = body;
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

  const rpcArgs = {
    p_job_id: job.id,
  } satisfies DatabaseGenerated['public']['Functions']['build_job_discord_embed']['Args'];
  const { data, error: embedError } = await supabaseServiceRole.rpc('build_job_discord_embed', rpcArgs);
  const embedData = data as JobDiscordEmbed | null;

  if (embedError || !embedData) {
    const logContext = createDiscordHandlerContext('job-notification', {
      jobId: job.id,
    });
    logger.error('Failed to build embed', {
      ...logContext,
      error: embedError instanceof Error ? embedError.message : String(embedError),
    });
    throw new Error('Embed generation failed');
  }

  if (job.discord_message_id) {
    return await updateJobDiscordMessage(job, embedData, webhookUrl);
  }
  return await createJobDiscordMessage(job, embedData, webhookUrl);
}

async function createJobDiscordMessage(
  job: JobRow,
  embedData: JobDiscordEmbed,
  webhookUrl: string
): Promise<Response> {
  const logContext = createDiscordHandlerContext('job-notification', {
    jobId: job.id,
  });

  const payload = { embeds: [formatJobDiscordEmbed(embedData)] };
  const { messageId } = await createDiscordMessageWithLogging(
    webhookUrl,
    payload,
    'job_notification_create',
    {
      relatedId: job.id,
      metadata: {
        job_id: job.id,
        status: job.status,
        action: 'create',
      },
      logContext,
    }
  );

  if (!messageId) {
    throw new Error('Discord response missing message ID');
  }

  const updateData = {
    discord_message_id: messageId,
  } satisfies DatabaseGenerated['public']['Tables']['jobs']['Update'];
  const { error: updateError } = await supabaseServiceRole
    .from('jobs')
    .update(updateData)
    .eq('id', job.id);

  if (updateError) {
    const logContext = createDiscordHandlerContext('job-notification', {
      jobId: job.id,
    });
    logger.error('Failed to store discord_message_id', {
      ...logContext,
      error: updateError instanceof Error ? updateError.message : String(updateError),
    });
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
  embedData: JobDiscordEmbed,
  webhookUrl: string
): Promise<Response> {
  const logContext = createDiscordHandlerContext('job-notification', {
    jobId: job.id,
  });

  if (!job.discord_message_id) {
    return await createJobDiscordMessage(job, embedData, webhookUrl);
  }

  const result = await updateDiscordMessageUtil(
    webhookUrl,
    job.discord_message_id,
    { embeds: [formatJobDiscordEmbed(embedData)] },
    'job_notification_update',
    job.id,
    { action: 'update', job_id: job.id, status: job.status },
    logContext
  );

  if (result.deleted) {
    const nullUpdateData = {
      discord_message_id: null,
    } satisfies DatabaseGenerated['public']['Tables']['jobs']['Update'];
    await supabaseServiceRole.from('jobs').update(nullUpdateData).eq('id', job.id);
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
  const webhookUrl = validateWebhookUrl(edgeEnv.discord.defaultWebhook, 'DISCORD_WEBHOOK_URL');
  if (webhookUrl instanceof Response) {
    return errorResponse(
      new Error('Discord webhook not configured'),
      'handleSubmissionNotification',
      discordCorsHeaders
    );
  }

  const body = await req.json();
  if (!isValidDatabaseWebhookPayload(body, isValidContentSubmission)) {
    return badRequestResponse('Invalid webhook payload structure', discordCorsHeaders);
  }
  const payload = body;

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

  const logContext = createDiscordHandlerContext('submission-notification', {
    contentId: payload.record.id,
  });

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
      logContext,
    }
  );

  return successResponse({ submission_id: payload.record.id }, 200, discordCorsHeaders);
}

async function handleContentNotification(req: Request): Promise<Response> {
  const webhookUrl = validateWebhookUrl(
    edgeEnv.discord.announcements,
    'DISCORD_ANNOUNCEMENTS_WEBHOOK_URL'
  );
  if (webhookUrl instanceof Response) {
    return errorResponse(
      new Error('Discord webhook not configured'),
      'handleContentNotification',
      discordCorsHeaders
    );
  }

  const body = await req.json();
  if (!isValidDatabaseWebhookPayload(body, isValidContentSubmission)) {
    return badRequestResponse('Invalid webhook payload structure', discordCorsHeaders);
  }
  const payload = body;

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
    .eq('slug', payload.record.approved_slug ?? '')
    .single<DatabaseGenerated['public']['Tables']['content']['Row']>();

  // Create logContext after fetching content
  const logContext = createDiscordHandlerContext('content-notification', {
    ...(content?.id !== undefined ? { contentId: content.id } : {}),
    ...(content?.category !== null && content?.category !== undefined
      ? { category: content.category }
      : {}),
    ...(content?.slug !== null && content?.slug !== undefined ? { slug: content.slug } : {}),
  });

  if (contentError || !content) {
    logger.error('Failed to fetch content', {
      ...logContext,
      error: contentError instanceof Error ? contentError.message : String(contentError),
      approved_slug: payload.record.approved_slug,
    });
    throw new Error(`Content not found for slug: ${payload.record.approved_slug ?? 'unknown'}`);
  }

  // Update logContext with actual content data
  const updatedContext = withContext(logContext, {
    content_id: content.id,
    category: content.category,
    slug: content.slug,
  });

  const embed = buildContentEmbed(content);
  await sendDiscordWebhook(
    webhookUrl,
    {
      content: '🎉 **New Content Added to Claude Pro Directory!**',
      embeds: [embed],
    },
    'content_announcement',
    {
      relatedId: content.id,
      metadata: {
        content_id: content.id,
        category: content.category,
        slug: content.slug,
      },
      logContext: updatedContext,
    }
  );

  await insertNotification(
    {
      id: content.id,
      title: content.display_title ?? content.title ?? 'New content',
      message: content.description ?? payload.record.description ?? 'New content just dropped.',
      type: 'announcement' satisfies DatabaseGenerated['public']['Enums']['notification_type'],
      priority: 'medium',
      action_label: 'View content',
      // Database constraint requires action_href to start with '/' (relative path) or be NULL
      action_href: `/${content.category}/${content.slug}`,
      metadata: {
        content_id: content.id,
        category: content.category,
        slug: content.slug,
        source: 'content-notification',
      },
    },
    updatedContext
  );

  // Invalidate cache after notification insert
  await invalidateCacheByKey('cache.invalidate.notifications', ['notifications'], {
    logContext: updatedContext,
  }).catch((error) => {
    logger.warn('Cache invalidation failed', {
      ...updatedContext,
      error: errorToString(error),
    });
  });

  await invalidateCacheByKey(
    'cache.invalidate.content_create',
    ['content', 'homepage', 'trending'],
    {
      ...(content.category !== undefined ? { category: content.category } : {}),
      ...(content.slug !== undefined ? { slug: content.slug } : {}),
      logContext: updatedContext,
    }
  ).catch((error) => {
    logger.warn('Cache invalidation failed', {
      ...updatedContext,
      error: errorToString(error),
    });
  });

  return successResponse({ content_id: content.id }, 200, discordCorsHeaders);
}

async function handleErrorNotification(req: Request): Promise<Response> {
  const webhookUrl = validateWebhookUrl(
    edgeEnv.discord.errors,
    'DISCORD_EDGE_FUNCTION_ERRORS_WEBHOOK'
  );
  if (webhookUrl instanceof Response) {
    return errorResponse(
      new Error('Discord webhook not configured'),
      'handleErrorNotification',
      discordCorsHeaders
    );
  }

  const body = await req.json();
  if (!isValidDatabaseWebhookPayload(body, isValidWebhookEventRecord)) {
    return badRequestResponse('Invalid webhook payload structure', discordCorsHeaders);
  }
  const payload = body;

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

  const logContext = createDiscordHandlerContext('error-notification', {
    contentId: payload.record.id,
  });

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
      logContext,
    }
  );

  return successResponse({ webhook_event_id: payload.record.id }, 200, discordCorsHeaders);
}

async function handleChangelogNotification(req: Request): Promise<Response> {
  const webhookUrl = validateWebhookUrl(edgeEnv.discord.changelog, 'DISCORD_CHANGELOG_WEBHOOK_URL');
  if (webhookUrl instanceof Response) {
    return errorResponse(
      new Error('Discord webhook not configured'),
      'handleChangelogNotification',
      discordCorsHeaders
    );
  }

  const body = await req.json();
  if (!isValidDatabaseWebhookPayload(body, isValidChangelogRow)) {
    return badRequestResponse('Invalid webhook payload structure', discordCorsHeaders);
  }
  const payload = body;
  const entry = payload.record;

  // Create logContext
  const logContext = createDiscordHandlerContext('changelog-notification', {
    changelogId: entry.id,
    slug: entry.slug,
  });

  if (!entry) {
    return badRequestResponse('Missing changelog record', discordCorsHeaders);
  }

  // Validate and extract sections from changes (Json type)
  const changesValue = entry.changes;
  const sections: Array<{
    title: string;
    items: string[];
  }> = [];

  if (Array.isArray(changesValue)) {
    for (const section of changesValue) {
      if (typeof section === 'object' && section !== null) {
        const getProperty = (obj: unknown, key: string): unknown => {
          if (typeof obj !== 'object' || obj === null) {
            return undefined;
          }
          const desc = Object.getOwnPropertyDescriptor(obj, key);
          return desc?.value;
        };

        const getStringProperty = (obj: unknown, key: string): string | undefined => {
          const value = getProperty(obj, key);
          return typeof value === 'string' ? value : undefined;
        };

        const title = getStringProperty(section, 'title');
        const itemsValue = getProperty(section, 'items');

        if (title && Array.isArray(itemsValue)) {
          const items = itemsValue.filter((item): item is string => typeof item === 'string');
          if (items.length > 0) {
            sections.push({ title, items });
          }
        }
      }
    }
  }

  const embed = buildChangelogEmbed({
    slug: entry.slug,
    title: entry.title,
    tldr: entry.tldr ?? '',
    sections,
    commits: [], // Empty commits array for changelog notifications
    date: entry.release_date ?? entry.created_at ?? new Date().toISOString(),
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
      logContext,
    }
  );

  await insertNotification(
    {
      id: entry.id,
      title: entry.title,
      message: entry.tldr ?? entry.description ?? 'We just published new release notes.',
      type: 'announcement' satisfies DatabaseGenerated['public']['Enums']['notification_type'],
      priority: 'medium',
      action_label: 'View changelog',
      // Database constraint requires action_href to start with '/' (relative path) or be NULL
      action_href: `/changelog/${entry.slug}`,
      metadata: {
        slug: entry.slug,
        changelog_id: entry.id,
        source: 'changelog-notification',
      },
    },
    logContext
  );

  // Invalidate cache after notification insert
  await invalidateCacheByKey('cache.invalidate.notifications', ['notifications'], {
    logContext,
  }).catch((error) => {
    logger.warn('Cache invalidation failed', {
      ...logContext,
      error: errorToString(error),
    });
  });

  await invalidateCacheByKey('cache.invalidate.changelog', ['changelog'], {
    category: 'changelog',
    slug: entry.slug,
    logContext,
  }).catch((error) => {
    logger.warn('Cache invalidation failed', {
      ...logContext,
      error: errorToString(error),
    });
  });

  return successResponse({ changelog_id: entry.id }, 200, discordCorsHeaders);
}
