/**
 * Notification Router - Discord handlers, changelog sync, notification APIs, webhooks.
 */

import { Resend } from 'npm:resend@4.0.0';
import { revalidateChangelogPages } from '../_shared/changelog/service.ts';
import { SITE_URL, supabaseServiceRole } from '../_shared/clients/supabase.ts';
import { RESEND_ENV } from '../_shared/config/email-config.ts';
import { edgeEnv } from '../_shared/config/env.ts';
import {
  getCacheConfigNumber,
  getCacheConfigStringArray,
} from '../_shared/config/statsig-cache.ts';
import { handleChangelogSyncRequest } from '../_shared/handlers/changelog/handler.ts';
import { handleDiscordNotification } from '../_shared/handlers/discord/handler.ts';
import {
  createNotificationTrace,
  dismissNotificationsForUser,
  getActiveNotificationsForUser,
  insertNotification,
} from '../_shared/notifications/service.ts';
import { requireAuthUser } from '../_shared/utils/auth.ts';
import { sendDiscordWebhook } from '../_shared/utils/discord/client.ts';
import {
  buildChangelogEmbed,
  type ChangelogSection,
  type GitHubCommit,
} from '../_shared/utils/discord/embeds.ts';
import {
  badRequestResponse,
  changelogCorsHeaders,
  discordCorsHeaders,
  errorResponse,
  notificationCorsHeaders,
  successResponse,
  unauthorizedResponse,
  webhookCorsHeaders,
} from '../_shared/utils/http.ts';
import { updateContactEngagement } from '../_shared/utils/integrations/resend.ts';
import { createRouter, type HttpMethod, type RouterContext } from '../_shared/utils/router.ts';
import { ingestWebhookEvent, WebhookIngestError } from '../_shared/utils/webhook/ingest.ts';

interface NotificationRouterContext extends RouterContext {
  pathname: string;
  segments: string[];
  searchParams: URLSearchParams;
  discordNotificationType: string | null;
  notificationType: string | null;
}

const router = createRouter<NotificationRouterContext>({
  buildContext: (request) => {
    const url = new URL(request.url);
    const originalMethod = request.method.toUpperCase() as HttpMethod;
    const normalizedMethod = (originalMethod === 'HEAD' ? 'GET' : originalMethod) as HttpMethod;
    const pathname = url.pathname.replace(/^\/notification-router/, '') || '/';

    return {
      request,
      url,
      pathname,
      segments: pathname === '/' ? [] : pathname.replace(/^\/+/, '').split('/').filter(Boolean),
      searchParams: url.searchParams,
      method: normalizedMethod,
      originalMethod,
      discordNotificationType: request.headers.get('X-Discord-Notification-Type'),
      notificationType: request.headers.get('X-Notification-Type'),
    };
  },
  defaultCors: notificationCorsHeaders,
  onNoMatch: () => badRequestResponse('Unknown notification route', notificationCorsHeaders),
  routes: [
    {
      name: 'discord',
      methods: ['POST', 'OPTIONS'],
      cors: discordCorsHeaders,
      match: (ctx) => Boolean(ctx.discordNotificationType),
      handler: (ctx) => {
        const notificationType = ctx.discordNotificationType;
        if (!notificationType) {
          return Promise.resolve(
            badRequestResponse('Missing X-Discord-Notification-Type header', discordCorsHeaders)
          );
        }
        return handleDiscordNotification(ctx.request, notificationType);
      },
    },
    {
      name: 'active-notifications',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      cors: notificationCorsHeaders,
      match: (ctx) => ctx.pathname.startsWith('/active-notifications'),
      handler: (ctx) => handleActiveNotifications(ctx),
    },
    {
      name: 'dismiss-notifications',
      methods: ['POST', 'OPTIONS'],
      cors: notificationCorsHeaders,
      match: (ctx) => ctx.pathname.startsWith('/dismiss'),
      handler: (ctx) => handleDismissNotifications(ctx),
    },
    {
      name: 'changelog-sync',
      methods: ['POST', 'OPTIONS'],
      cors: changelogCorsHeaders,
      match: (ctx) =>
        ctx.pathname.startsWith('/changelog-sync') || ctx.notificationType === 'changelog-sync',
      handler: (ctx) => handleChangelogSyncRequest(ctx.request),
    },
    {
      name: 'changelog-release-worker',
      methods: ['POST', 'OPTIONS'],
      cors: notificationCorsHeaders,
      match: (ctx) => ctx.pathname.startsWith('/changelog-release-worker'),
      handler: () => handleChangelogReleaseQueue(),
    },
    {
      name: 'pulse-queue-worker',
      methods: ['POST', 'OPTIONS'],
      cors: notificationCorsHeaders,
      match: (ctx) => ctx.pathname.startsWith('/pulse-queue-worker'),
      handler: () => handlePulseQueue(),
    },
  ],
  defaultRoute: {
    name: 'webhook',
    methods: ['POST', 'OPTIONS'],
    cors: webhookCorsHeaders,
    handler: (ctx) => handleExternalWebhook(ctx),
  },
});

Deno.serve((request) => router(request));

async function handleActiveNotifications(ctx: NotificationRouterContext): Promise<Response> {
  const authResult = await requireAuthUser(ctx.request, {
    cors: notificationCorsHeaders,
    errorMessage: 'Missing or invalid Authorization header',
  });

  if ('response' in authResult) {
    return authResult.response;
  }

  const dismissedParam = ctx.searchParams.get('dismissed');
  const dismissedIds = dismissedParam
    ? dismissedParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  try {
    const trace = createNotificationTrace({
      dismissedCount: dismissedIds.length,
      userId: authResult.user.id,
    });
    const logContext = createNotificationRouterContext('get-active-notifications', {
      userId: authResult.user.id,
    });
    const notifications = await getActiveNotificationsForUser(
      authResult.user.id,
      dismissedIds,
      logContext
    );

    return successResponse(
      {
        notifications,
        traceId: trace.traceId,
      },
      200,
      notificationCorsHeaders
    );
  } catch (error) {
    return errorResponse(
      error,
      'notification-router:active-notifications',
      notificationCorsHeaders
    );
  }
}

async function handleDismissNotifications(ctx: NotificationRouterContext): Promise<Response> {
  const authResult = await requireAuthUser(ctx.request, {
    cors: notificationCorsHeaders,
    errorMessage: 'Missing or invalid Authorization header',
  });

  if ('response' in authResult) {
    return authResult.response;
  }

  let payload: unknown;
  try {
    payload = await ctx.request.json();
  } catch (error) {
    return badRequestResponse(
      `Invalid JSON payload: ${(error as Error).message}`,
      notificationCorsHeaders
    );
  }

  const sanitizedIds =
    typeof payload === 'object' &&
    payload !== null &&
    Array.isArray((payload as { notificationIds?: unknown[] }).notificationIds)
      ? Array.from(
          new Set(
            (payload as { notificationIds: unknown[] }).notificationIds
              .map((id) => (typeof id === 'string' ? id.trim() : ''))
              .filter(Boolean)
          )
        ).slice(0, 50)
      : [];

  if (sanitizedIds.length === 0) {
    return badRequestResponse('notificationIds array is required', notificationCorsHeaders);
  }

  try {
    const trace = createNotificationTrace({
      dismissRequestCount: sanitizedIds.length,
      userId: authResult.user.id,
    });
    const logContext = createNotificationRouterContext('dismiss-notifications', {
      userId: authResult.user.id,
    });
    await dismissNotificationsForUser(authResult.user.id, sanitizedIds, logContext);
    return successResponse(
      {
        dismissed: sanitizedIds.length,
        traceId: trace.traceId,
      },
      200,
      notificationCorsHeaders
    );
  } catch (error) {
    return errorResponse(error, 'notification-router:dismiss', notificationCorsHeaders);
  }
}

async function handleExternalWebhook(ctx: NotificationRouterContext): Promise<Response> {
  try {
    const body = await ctx.request.text();
    const result = await ingestWebhookEvent(body, ctx.request.headers);
    const cors = result.cors ?? webhookCorsHeaders;

    const logContext = createNotificationRouterContext('external-webhook', {
      source: result.source,
    });

    if (result.duplicate) {
      console.log('[notification-router] Webhook already processed', {
        ...logContext,
        duplicate: result.duplicate,
        received_at: new Date().toISOString(),
      });
    } else {
      console.log('[notification-router] Webhook routed', {
        ...logContext,
        duplicate: result.duplicate,
        received_at: new Date().toISOString(),
      });
    }

    return successResponse(
      { message: 'OK', source: result.source, duplicate: result.duplicate },
      200,
      cors
    );
  } catch (error) {
    const logContext = createNotificationRouterContext('external-webhook', {
      source: ctx.notificationType ?? ctx.discordNotificationType ?? 'unknown',
    });

    if (error instanceof WebhookIngestError) {
      if (error.status === 'unauthorized') {
        console.warn('[notification-router] Unauthorized webhook', {
          ...logContext,
          message: error.message,
        });
        return unauthorizedResponse(error.message, webhookCorsHeaders);
      }
      console.warn('[notification-router] Bad webhook payload', {
        ...logContext,
        message: error.message,
      });
      return badRequestResponse(error.message, webhookCorsHeaders);
    }

    console.error('[notification-router] Unexpected webhook error', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error, 'notification-router:webhook', webhookCorsHeaders);
  }
}

/**
 * Changelog Release Queue Worker
 * Processes changelog release jobs from Supabase Queue (pgmq)
 */
const QUEUE_NAME = 'changelog_release';
const BATCH_SIZE = 5;
const DISCORD_CHANGELOG_WEBHOOK_URL = edgeEnv.discord.changelog;
const REVALIDATE_SECRET = edgeEnv.revalidate.secret;

interface ChangelogReleaseJob {
  entryId: string;
  slug: string;
  title: string;
  tldr: string;
  sections: ChangelogSection[];
  commits: GitHubCommit[];
  releaseDate: string;
  metadata: unknown;
}

interface QueueMessage {
  msg_id: bigint;
  read_ct: number;
  vt: string;
  enqueued_at: string;
  message: ChangelogReleaseJob;
}

async function processChangelogRelease(message: QueueMessage): Promise<{
  success: boolean;
  errors: string[];
}> {
  const { msg_id, message: job } = message;
  const errors: string[] = [];
  let discordSuccess = false;
  let notificationSuccess = false;
  let cacheInvalidationSuccess = false;
  let revalidationSuccess = false;

  // Create structured log context (reused in all logs)
  const logContext = {
    job_id: msg_id.toString(),
    entry_id: job.entryId,
    slug: job.slug,
    attempt: message.read_ct,
    enqueued_at: message.enqueued_at,
  };

  const startTime = Date.now();

  console.log('[notification-router] Processing changelog release job', logContext);

  // 1. Send Discord webhook (non-critical)
  if (DISCORD_CHANGELOG_WEBHOOK_URL) {
    try {
      const embed = buildChangelogEmbed({
        slug: job.slug,
        title: job.title,
        tldr: job.tldr,
        sections: job.sections,
        commits: job.commits,
        date: job.releaseDate,
      });

      await sendDiscordWebhook(
        DISCORD_CHANGELOG_WEBHOOK_URL,
        {
          content: '🚀 **New Release Deployed**',
          embeds: [embed],
        },
        'changelog_notification',
        {
          relatedId: job.entryId,
          metadata: {
            changelog_id: job.entryId,
            slug: job.slug,
            msg_id: msg_id.toString(),
          },
          logContext,
        }
      );

      discordSuccess = true;
      console.log('[notification-router] Discord webhook sent', {
        ...logContext,
        success: discordSuccess,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Discord: ${errorMsg}`);
      console.error('[notification-router] Discord webhook failed', {
        ...logContext,
        error: errorMsg,
      });
    }
  }

  // 2. Insert notification (idempotent, critical path)
  try {
    await insertNotification(
      {
        id: job.entryId,
        title: job.title,
        message: job.tldr || 'We just shipped a fresh Claude Pro Directory release.',
        type: 'announcement',
        priority: 'high',
        action_label: 'Read release notes',
        action_href: `${SITE_URL}/changelog/${job.slug}`,
        metadata: {
          slug: job.slug,
          changelog_id: job.entryId,
          source: 'changelog-release-worker',
          msg_id: msg_id.toString(),
        },
      },
      logContext
    );

    notificationSuccess = true;
    console.log('[notification-router] Notification inserted', {
      ...logContext,
      success: notificationSuccess,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`Notification: ${errorMsg}`);
    console.error('[notification-router] Notification insert failed', {
      ...logContext,
      error: errorMsg,
    });
  }

  // 3. Invalidate cache tags (non-critical, after notification insert)
  if (notificationSuccess) {
    try {
      // Fetch tags from Statsig (with fallback to default)
      const cacheTags = getCacheConfigStringArray(
        'cache.invalidate.changelog',
        ['changelog'] // Fallback default
      );

      if (REVALIDATE_SECRET && cacheTags.length > 0) {
        const revalidateUrl = `${SITE_URL}/api/revalidate`;
        const response = await fetch(revalidateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: REVALIDATE_SECRET,
            category: 'changelog',
            slug: job.slug,
            tags: cacheTags,
          }),
        });

        if (response.ok) {
          cacheInvalidationSuccess = true;
          console.log('[notification-router] Cache tags invalidated', {
            ...logContext,
            success: cacheInvalidationSuccess,
            tags: cacheTags,
          });
        } else {
          const errorText = await response.text();
          console.warn('[notification-router] Cache invalidation failed', {
            ...logContext,
            status: response.status,
            error: errorText,
            tags: cacheTags,
          });
          errors.push(`Cache invalidation: ${response.status} ${errorText}`);
        }
      } else if (!REVALIDATE_SECRET) {
        console.warn('[notification-router] Cache invalidation skipped (no secret)', logContext);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn('[notification-router] Cache invalidation error', {
        ...logContext,
        error: errorMsg,
      });
      errors.push(`Cache invalidation: ${errorMsg}`);
      // Non-critical, don't fail the job
    }
  }

  // 4. Revalidate Next.js pages (non-critical)
  try {
    await revalidateChangelogPages(job.slug, { invalidateTags: true });
    revalidationSuccess = true;
    console.log('[notification-router] Pages revalidated', {
      ...logContext,
      success: revalidationSuccess,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`Revalidation: ${errorMsg}`);
    console.warn('[notification-router] Revalidation failed', {
      ...logContext,
      error: errorMsg,
    });
  }

  // 5. Log completion (success/partial)
  if (notificationSuccess) {
    const durationMs = Date.now() - startTime;
    if (errors.length === 0) {
      console.log('[notification-router] Changelog release completed successfully', {
        ...logContext,
        duration_ms: durationMs,
        discordSuccess,
        notificationSuccess,
        cacheInvalidationSuccess,
        revalidationSuccess,
      });
    } else {
      console.warn('[notification-router] Changelog release completed with partial errors', {
        ...logContext,
        duration_ms: durationMs,
        errors,
        discordSuccess,
        notificationSuccess,
        cacheInvalidationSuccess,
        revalidationSuccess,
      });
    }
  }

  // Success if notification inserted (most critical)
  const success = notificationSuccess || errors.length === 0;
  const durationMs = Date.now() - startTime;

  console.log('[notification-router] Changelog release job completed', {
    ...logContext,
    success,
    errors: errors.length > 0 ? errors : undefined,
    discordSuccess,
    notificationSuccess,
    cacheInvalidationSuccess,
    revalidationSuccess,
    duration_ms: durationMs,
  });

  return { success, errors };
}

async function deleteQueueMessage(msgId: bigint): Promise<void> {
  try {
    const { error } = await supabaseServiceRole.schema('pgmq_public').rpc('delete', {
      queue_name: QUEUE_NAME,
      msg_id: msgId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('[notification-router] Failed to delete queue message', {
      msg_id: msgId.toString(),
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - message will remain in queue for retry
  }
}

async function handleChangelogReleaseQueue(): Promise<Response> {
  try {
    // Read messages from queue
    const { data: messages, error: readError } = await supabaseServiceRole
      .schema('pgmq_public')
      .rpc('read', {
        queue_name: QUEUE_NAME,
        sleep_seconds: 0,
        n: BATCH_SIZE,
      });

    if (readError) {
      console.error('[notification-router] Queue read error', { error: readError.message });
      return errorResponse(
        new Error(`Failed to read queue: ${readError.message}`),
        'notification-router:queue-read'
      );
    }

    if (!messages || messages.length === 0) {
      return successResponse({ message: 'No messages in queue', processed: 0 }, 200);
    }

    console.log(`[notification-router] Processing ${messages.length} changelog release jobs`);

    const results = [];

    // Process each message
    for (const message of messages as QueueMessage[]) {
      try {
        const result = await processChangelogRelease(message);

        if (result.success) {
          await deleteQueueMessage(message.msg_id);
          results.push({
            msg_id: message.msg_id.toString(),
            status: 'success',
            errors: result.errors,
          });
        } else {
          // Leave in queue for retry
          results.push({
            msg_id: message.msg_id.toString(),
            status: 'failed',
            errors: result.errors,
            will_retry: true,
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[notification-router] Unexpected error processing message', {
          msg_id: message.msg_id.toString(),
          error: errorMsg,
        });
        results.push({
          msg_id: message.msg_id.toString(),
          status: 'error',
          error: errorMsg,
          will_retry: true,
        });
      }
    }

    return successResponse(
      {
        message: `Processed ${messages.length} messages`,
        processed: messages.length,
        results,
      },
      200
    );
  } catch (error) {
    console.error('[notification-router] Fatal queue processing error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error, 'notification-router:queue-fatal');
  }
}

/**
 * Pulse Queue Worker
 * Processes user_interactions queue in batches for hyper-optimized egress reduction
 * Batch size is configurable via Statsig dynamic config (queue.pulse.batch_size)
 * Default: 100 events per batch
 */
const PULSE_QUEUE_NAME = 'user_interactions';
const PULSE_BATCH_SIZE_DEFAULT = 100; // Fallback if Statsig config unavailable

interface PulseEvent {
  user_id?: string | null;
  content_type: string | null;
  content_slug: string | null;
  interaction_type: string;
  session_id?: string | null;
  metadata?: unknown | null;
}

interface PulseQueueMessage {
  msg_id: bigint;
  read_ct: number;
  vt: string;
  enqueued_at: string;
  message: PulseEvent;
}

/**
 * Process search events batch - inserts into search_queries table
 */
async function processSearchEventsBatch(messages: PulseQueueMessage[]): Promise<{
  inserted: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let inserted = 0;
  let failed = 0;

  try {
    const searchQueries = messages.map((msg) => {
      const event = msg.message;
      const metadata = event.metadata as Record<string, unknown> | null;
      return {
        query: (metadata?.query as string) || '',
        filters: metadata?.filters ?? null,
        result_count: (metadata?.result_count as number) ?? 0,
        user_id: event.user_id ?? null,
        session_id: event.session_id ?? null,
      };
    });

    // Batch insert into search_queries table
    const { error } = await supabaseServiceRole.from('search_queries').insert(searchQueries);

    if (error) {
      throw error;
    }

    inserted = searchQueries.length;
    return { inserted, failed, errors };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`Search events batch insert failed: ${errorMsg}`);
    console.error('[notification-router] Search events batch insert error', {
      error: errorMsg,
      message_count: messages.length,
    });
    failed = messages.length;
    return { inserted: 0, failed, errors };
  }
}

/**
 * Update Resend contact engagement for copy/view events
 * Non-blocking, fire-and-forget - failures don't affect batch processing
 */
async function updateResendEngagement(messages: PulseQueueMessage[]): Promise<void> {
  if (!RESEND_ENV.apiKey) {
    return; // Resend not configured
  }

  const resend = new Resend(RESEND_ENV.apiKey);
  const engagementEvents: Array<{ userId: string; activityType: 'copy_content' | 'visit_page' }> =
    [];

  // Filter for copy/view events with user_id
  for (const msg of messages) {
    const event = msg.message;
    if (event.user_id && (event.interaction_type === 'copy' || event.interaction_type === 'view')) {
      engagementEvents.push({
        userId: event.user_id,
        activityType: event.interaction_type === 'copy' ? 'copy_content' : 'visit_page',
      });
    }
  }

  if (engagementEvents.length === 0) {
    return;
  }

  // Get unique user IDs
  const userIds = [...new Set(engagementEvents.map((e) => e.userId))];

  // Batch query newsletter subscriptions to get emails
  const { data: subscriptions, error } = await supabaseServiceRole
    .from('newsletter_subscriptions')
    .select('email, user_id')
    .in('user_id', userIds);

  if (error || !subscriptions || subscriptions.length === 0) {
    return; // No subscribers found or query failed
  }

  // Create email map
  const emailMap = new Map<string, string>();
  for (const sub of subscriptions) {
    if (sub.user_id && sub.email) {
      emailMap.set(sub.user_id, sub.email);
    }
  }

  // Update engagement for each event (fire-and-forget)
  for (const event of engagementEvents) {
    const email = emailMap.get(event.userId);
    if (email) {
      updateContactEngagement(resend, email, event.activityType).catch(() => {
        // Silent fail per event
      });
    }
  }
}

/**
 * Process user interactions batch - inserts into user_interactions table
 */
async function processUserInteractionsBatch(messages: PulseQueueMessage[]): Promise<{
  inserted: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let inserted = 0;
  let failed = 0;

  try {
    // Extract events from messages and convert to JSONB array format
    const events = messages.map((msg) => msg.message as Record<string, unknown>);

    // Batch insert all events in single transaction
    const { data: result, error: batchError } = await supabaseServiceRole.rpc(
      'batch_insert_user_interactions',
      {
        p_interactions: events,
      }
    );

    if (batchError) {
      throw batchError;
    }

    // Parse result from RPC (returns jsonb with inserted, failed, total, errors)
    const batchResult = result as {
      inserted?: number;
      failed?: number;
      total?: number;
      errors?: Array<{ interaction: unknown; error: string }>;
    };

    inserted = batchResult.inserted ?? 0;
    failed = batchResult.failed ?? 0;

    if (batchResult.errors && Array.isArray(batchResult.errors)) {
      for (const err of batchResult.errors) {
        errors.push(`Interaction failed: ${err.error}`);
      }
    }

    // Update Resend contact engagement for copy/view events (non-blocking)
    if (inserted > 0 && RESEND_ENV.apiKey) {
      updateResendEngagement(messages).catch((error) => {
        // Silent fail - Resend updates are best-effort, don't block batch processing
        console.warn('[notification-router] Resend engagement update failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }

    return { inserted, failed, errors };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`Batch insert failed: ${errorMsg}`);
    console.error('[notification-router] Pulse batch insert error', {
      error: errorMsg,
      message_count: messages.length,
    });
    return { inserted: 0, failed: messages.length, errors };
  }
}

/**
 * Process sponsored events batch - inserts into sponsored_impressions and sponsored_clicks tables
 */
async function processSponsoredEventsBatch(messages: PulseQueueMessage[]): Promise<{
  inserted: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let inserted = 0;
  let failed = 0;

  try {
    const impressions: Array<{
      sponsored_id: string;
      user_id: string | null;
      page_url?: string;
      position?: number;
    }> = [];
    const clicks: Array<{
      sponsored_id: string;
      user_id: string | null;
      target_url: string;
    }> = [];

    for (const msg of messages) {
      const event = msg.message;
      const metadata = event.metadata as Record<string, unknown> | null;

      if (metadata?.event_type === 'impression') {
        impressions.push({
          sponsored_id: event.content_slug ?? '',
          user_id: event.user_id ?? null,
          page_url: metadata.page_url as string | undefined,
          position: metadata.position as number | undefined,
        });
      } else if (metadata?.event_type === 'click') {
        clicks.push({
          sponsored_id: event.content_slug ?? '',
          user_id: event.user_id ?? null,
          target_url: metadata.target_url as string,
        });
      }
    }

    // Batch insert impressions
    if (impressions.length > 0) {
      const { error: impressionsError } = await supabaseServiceRole
        .from('sponsored_impressions')
        .insert(impressions);

      if (impressionsError) {
        errors.push(`Sponsored impressions insert failed: ${impressionsError.message}`);
        failed += impressions.length;
      } else {
        inserted += impressions.length;
      }
    }

    // Batch insert clicks
    if (clicks.length > 0) {
      const { error: clicksError } = await supabaseServiceRole
        .from('sponsored_clicks')
        .insert(clicks);

      if (clicksError) {
        errors.push(`Sponsored clicks insert failed: ${clicksError.message}`);
        failed += clicks.length;
      } else {
        inserted += clicks.length;
      }
    }

    return { inserted, failed, errors };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`Sponsored events batch processing failed: ${errorMsg}`);
    console.error('[notification-router] Sponsored events batch processing error', {
      error: errorMsg,
      message_count: messages.length,
    });
    return { inserted: 0, failed: messages.length, errors };
  }
}

async function processPulseBatch(messages: PulseQueueMessage[]): Promise<{
  success: boolean;
  inserted: number;
  failed: number;
  errors: string[];
}> {
  // Separate events by type for routing to appropriate tables
  const searchEvents: PulseQueueMessage[] = [];
  const sponsoredEvents: PulseQueueMessage[] = [];
  const otherEvents: PulseQueueMessage[] = [];

  for (const msg of messages) {
    if (msg.message.interaction_type === 'search') {
      searchEvents.push(msg);
    } else if (msg.message.content_type === 'sponsored') {
      sponsoredEvents.push(msg);
    } else {
      otherEvents.push(msg);
    }
  }

  const allErrors: string[] = [];
  let totalInserted = 0;
  let totalFailed = 0;

  // Process search events separately (insert into search_queries)
  if (searchEvents.length > 0) {
    const searchResult = await processSearchEventsBatch(searchEvents);
    totalInserted += searchResult.inserted;
    totalFailed += searchResult.failed;
    allErrors.push(...searchResult.errors);
  }

  // Process sponsored events separately (insert into sponsored_impressions/sponsored_clicks)
  if (sponsoredEvents.length > 0) {
    const sponsoredResult = await processSponsoredEventsBatch(sponsoredEvents);
    totalInserted += sponsoredResult.inserted;
    totalFailed += sponsoredResult.failed;
    allErrors.push(...sponsoredResult.errors);
  }

  // Process other events (insert into user_interactions)
  if (otherEvents.length > 0) {
    const interactionsResult = await processUserInteractionsBatch(otherEvents);
    totalInserted += interactionsResult.inserted;
    totalFailed += interactionsResult.failed;
    allErrors.push(...interactionsResult.errors);
  }

  return {
    success: totalInserted > 0,
    inserted: totalInserted,
    failed: totalFailed,
    errors: allErrors,
  };
}

async function deletePulseMessages(msgIds: bigint[]): Promise<void> {
  // Delete all processed messages
  for (const msgId of msgIds) {
    try {
      const { error } = await supabaseServiceRole.schema('pgmq_public').rpc('delete', {
        queue_name: PULSE_QUEUE_NAME,
        msg_id: msgId,
      });

      if (error) {
        console.warn('[notification-router] Failed to delete pulse message', {
          msg_id: msgId.toString(),
          error: error.message,
        });
      }
    } catch (error) {
      console.warn('[notification-router] Exception deleting pulse message', {
        msg_id: msgId.toString(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function handlePulseQueue(): Promise<Response> {
  // Get batch size from Statsig dynamic config (with fallback)
  const batchSize = getCacheConfigNumber('queue.pulse.batch_size', PULSE_BATCH_SIZE_DEFAULT);

  // Validate batch size (safety limits)
  const safeBatchSize = Math.max(1, Math.min(batchSize, 500)); // Between 1 and 500

  const logContext = {
    queue: PULSE_QUEUE_NAME,
    batch_size: safeBatchSize,
    config_source: batchSize !== PULSE_BATCH_SIZE_DEFAULT ? 'statsig' : 'default',
  };

  try {
    // Read messages from queue
    const { data: messages, error: readError } = await supabaseServiceRole
      .schema('pgmq_public')
      .rpc('read', {
        queue_name: PULSE_QUEUE_NAME,
        sleep_seconds: 0,
        n: safeBatchSize,
      });

    if (readError) {
      console.error('[notification-router] Pulse queue read error', {
        ...logContext,
        error: readError.message,
      });
      return errorResponse(
        new Error(`Failed to read pulse queue: ${readError.message}`),
        'notification-router:pulse-queue-read'
      );
    }

    if (!messages || messages.length === 0) {
      return successResponse({ message: 'No messages in pulse queue', processed: 0 }, 200);
    }

    console.log(`[notification-router] Processing ${messages.length} pulse events`, logContext);

    const pulseMessages = messages as PulseQueueMessage[];

    // Process batch
    const result = await processPulseBatch(pulseMessages);

    if (result.success && result.inserted > 0) {
      // Delete successfully processed messages
      // Note: We delete ALL messages in the batch (even if some failed in the RPC)
      // because the RPC handles partial failures internally and returns which ones succeeded
      // Failed ones within the batch are logged but the message is still consumed
      // If the entire batch fails, we don't delete (handled below)
      const msgIds = pulseMessages.map((msg) => msg.msg_id);
      await deletePulseMessages(msgIds);
    } else if (result.inserted === 0) {
      // All failed - don't delete, let them retry via queue visibility timeout
      console.warn('[notification-router] All pulse events failed, will retry', {
        ...logContext,
        failed: result.failed,
        errors: result.errors,
      });
    }

    console.log('[notification-router] Pulse batch processed', {
      ...logContext,
      processed: messages.length,
      inserted: result.inserted,
      failed: result.failed,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });

    return successResponse(
      {
        message: `Processed ${messages.length} pulse events`,
        processed: messages.length,
        inserted: result.inserted,
        failed: result.failed,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
      200
    );
  } catch (error) {
    console.error('[notification-router] Fatal pulse queue processing error', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error, 'notification-router:pulse-queue-fatal');
  }
}
