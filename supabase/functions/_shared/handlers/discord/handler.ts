import { supabaseServiceRole } from '../../clients/supabase.ts';
import { edgeEnv } from '../../config/env.ts';
import type { Database as DatabaseGenerated } from '../../database.types.ts';
import type { Database } from '../../database-overrides.ts';
import { callRpc, NOTIFICATION_TYPE_VALUES, updateTable } from '../../database-overrides.ts';
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
  type GitHubCommit,
} from '../../utils/discord/embeds.ts';
import { errorToString } from '../../utils/error-handling.ts';
import {
  badRequestResponse,
  discordCorsHeaders,
  errorResponse,
  successResponse,
} from '../../utils/http.ts';
import { createDiscordHandlerContext, withContext } from '../../utils/logging.ts';
import {
  type DatabaseWebhookPayload,
  didStatusChangeTo,
  filterEventType,
  validateWebhookUrl,
} from '../../utils/webhook/database-events.ts';

type JobRow = Database['public']['Tables']['jobs']['Row'];
type ContentSubmission = Database['public']['Tables']['content_submissions']['Row'];

/**
 * Direct handler for job notifications (called from Realtime subscriptions)
 * Accepts payload directly instead of Request object
 */
export async function handleJobNotificationDirect(
  payload: DatabaseWebhookPayload<JobRow>
): Promise<void> {
  const webhookUrl = validateWebhookUrl(edgeEnv.discord.jobs, 'DISCORD_WEBHOOK_JOBS');
  if (webhookUrl instanceof Response) {
    console.error('[discord-handler] Discord webhook not configured for jobs');
    return;
  }

  const job = payload.record;

  if (job.is_placeholder) {
    console.log('[discord-handler] Skipping placeholder job', {
      jobId: job.id,
    });
    return;
  }

  if (!job.status || job.status === 'draft') {
    console.log('[discord-handler] Skipping draft job', { jobId: job.id });
    return;
  }

  const rpcArgs = {
    p_job_id: job.id,
  } satisfies DatabaseGenerated['public']['Functions']['build_job_discord_embed']['Args'];
  const { data: embedData, error: embedError } = await callRpc('build_job_discord_embed', rpcArgs);

  if (embedError || !embedData) {
    const logContext = createDiscordHandlerContext('job-notification', {
      jobId: job.id,
    });
    console.error('[discord-handler] Failed to build embed', {
      ...logContext,
      error: embedError instanceof Error ? embedError.message : String(embedError),
    });
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
  embedData: unknown,
  webhookUrl: string
): Promise<void> {
  const logContext = createDiscordHandlerContext('job-notification', {
    jobId: job.id,
  });

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
      logContext,
    }
  );

  if (!messageId) {
    console.error('[discord-handler] Discord response missing message ID', logContext);
    return;
  }

  const updateData = {
    discord_message_id: messageId,
  } satisfies DatabaseGenerated['public']['Tables']['jobs']['Update'];
  const { error: updateError } = await updateTable('jobs', updateData, job.id);

  if (updateError) {
    console.error('[discord-handler] Failed to store discord_message_id', {
      ...logContext,
      error: updateError instanceof Error ? updateError.message : String(updateError),
    });
  }
}

async function updateJobDiscordMessageDirect(
  job: JobRow,
  embedData: unknown,
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
    { embeds: [embedData] },
    'job_notification',
    job.id,
    { action: 'update', job_id: job.id, status: job.status },
    logContext
  );

  if (result.deleted) {
    const nullUpdateData = {
      discord_message_id: null,
    } satisfies DatabaseGenerated['public']['Tables']['jobs']['Update'];
    await updateTable('jobs', nullUpdateData, job.id);
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
    console.error('[discord-handler] Discord webhook not configured for submissions');
    return;
  }

  if (!filterEventType(payload, ['INSERT'])) {
    console.log('[discord-handler] Skipping non-INSERT submission event', {
      type: payload.type,
      submissionId: payload.record.id,
    });
    return;
  }

  const SPAM_THRESHOLD = 0.7;
  if (payload.record.spam_score !== null && payload.record.spam_score > SPAM_THRESHOLD) {
    console.log('[discord-handler] Skipping spam submission', {
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
    console.error('[discord-handler] Discord webhook not configured for announcements');
    return;
  }

  if (!didStatusChangeTo(payload, 'merged')) {
    console.log('[discord-handler] Skipping non-merged submission', {
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
    .single<Database['public']['Tables']['content']['Row']>();

  const logContext = createDiscordHandlerContext('content-notification', {
    ...(content?.id !== undefined ? { contentId: content.id } : {}),
    ...(content?.category !== undefined ? { category: content.category } : {}),
    ...(content?.slug !== undefined ? { slug: content.slug } : {}),
  });

  if (contentError || !content) {
    console.error('[discord-handler] Failed to fetch content', {
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
      type: NOTIFICATION_TYPE_VALUES[0], // 'announcement'
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

  // Invalidate cache after notification insert (same as original handler)
  await invalidateCacheByKey('cache.invalidate.notifications', ['notifications'], {
    logContext: updatedContext,
  }).catch((error) => {
    console.warn('[discord-handler] Cache invalidation failed', {
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
    console.warn('[discord-handler] Cache invalidation failed', {
      ...updatedContext,
      error: errorToString(error),
    });
  });
}

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
  const webhookUrl = validateWebhookUrl(edgeEnv.discord.jobs, 'DISCORD_WEBHOOK_JOBS');
  if (webhookUrl instanceof Response) {
    return errorResponse(
      new Error('Discord webhook not configured'),
      'handleJobNotification',
      discordCorsHeaders
    );
  }

  const payload = (await req.json()) as DatabaseWebhookPayload<JobRow>;
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
  const { data: embedData, error: embedError } = await callRpc('build_job_discord_embed', rpcArgs);

  if (embedError || !embedData) {
    const logContext = createDiscordHandlerContext('job-notification', {
      jobId: job.id,
    });
    console.error('[discord-handler] Failed to build embed', {
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
  embedData: unknown,
  webhookUrl: string
): Promise<Response> {
  const logContext = createDiscordHandlerContext('job-notification', {
    jobId: job.id,
  });

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
      logContext,
    }
  );

  if (!messageId) {
    throw new Error('Discord response missing message ID');
  }

  // Use type-safe helper to ensure proper type inference
  const updateData = {
    discord_message_id: messageId,
  } satisfies DatabaseGenerated['public']['Tables']['jobs']['Update'];
  const { error: updateError } = await updateTable('jobs', updateData, job.id);

  if (updateError) {
    const logContext = createDiscordHandlerContext('job-notification', {
      jobId: job.id,
    });
    console.error('[discord-handler] Failed to store discord_message_id', {
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
  embedData: unknown,
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
    { embeds: [embedData] },
    'job_notification',
    job.id,
    { action: 'update', job_id: job.id, status: job.status },
    logContext
  );

  if (result.deleted) {
    // Use type-safe helper to ensure proper type inference
    const nullUpdateData = {
      discord_message_id: null,
    } satisfies DatabaseGenerated['public']['Tables']['jobs']['Update'];
    await updateTable('jobs', nullUpdateData, job.id);
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

  const payload = (await req.json()) as DatabaseWebhookPayload<ContentSubmission>;

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

  const payload = (await req.json()) as DatabaseWebhookPayload<ContentSubmission>;

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
    .single<Database['public']['Tables']['content']['Row']>();

  // Create logContext after fetching content
  const logContext = createDiscordHandlerContext('content-notification', {
    ...(content?.id !== undefined ? { contentId: content.id } : {}),
    ...(content?.category !== undefined ? { category: content.category } : {}),
    ...(content?.slug !== undefined ? { slug: content.slug } : {}),
  });

  if (contentError || !content) {
    console.error('[discord-handler] Failed to fetch content', {
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
      type: NOTIFICATION_TYPE_VALUES[0], // 'announcement'
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
    console.warn('[discord-handler] Cache invalidation failed', {
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
    console.warn('[discord-handler] Cache invalidation failed', {
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

  const payload = (await req.json()) as DatabaseWebhookPayload<WebhookEventRecord>;

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

  const payload = (await req.json()) as DatabaseWebhookPayload<
    Database['public']['Tables']['changelog']['Row']
  >;
  const entry = payload.record;

  // Create logContext
  const logContext = createDiscordHandlerContext('changelog-notification', {
    changelogId: entry.id,
    slug: entry.slug,
  });

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
    tldr: entry.tldr ?? '',
    sections,
    commits: [] as GitHubCommit[],
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
      type: NOTIFICATION_TYPE_VALUES[0], // 'announcement'
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
    console.warn('[discord-handler] Cache invalidation failed', {
      ...logContext,
      error: errorToString(error),
    });
  });

  await invalidateCacheByKey('cache.invalidate.changelog', ['changelog'], {
    category: 'changelog',
    slug: entry.slug,
    logContext,
  }).catch((error) => {
    console.warn('[discord-handler] Cache invalidation failed', {
      ...logContext,
      error: errorToString(error),
    });
  });

  return successResponse({ changelog_id: entry.id }, 200, discordCorsHeaders);
}
