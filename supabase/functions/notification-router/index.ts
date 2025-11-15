/**
 * Notification Router - Discord handlers, changelog sync, notification APIs, webhooks.
 */

import { revalidateChangelogPages } from '../_shared/changelog/service.ts';
import { SITE_URL, supabaseServiceRole } from '../_shared/clients/supabase.ts';
import { edgeEnv } from '../_shared/config/env.ts';
import { getCacheConfigStringArray } from '../_shared/config/statsig-cache.ts';
import type { Database } from '../_shared/database.types.ts';
import { handleChangelogSyncRequest } from '../_shared/handlers/changelog/handler.ts';
import { handleDiscordNotification } from '../_shared/handlers/discord/handler.ts';
import {
  createNotificationTrace,
  dismissNotificationsForUser,
  getActiveNotificationsForUser,
  insertNotification,
} from '../_shared/notifications/service.ts';
import { trackInteractionEdge } from '../_shared/utils/analytics/tracker.ts';
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
    const notifications = await getActiveNotificationsForUser(authResult.user.id, dismissedIds);

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
    await dismissNotificationsForUser(authResult.user.id, sanitizedIds);
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

    const logContext = {
      source: result.source,
      duplicate: result.duplicate,
      receivedAt: new Date().toISOString(),
    };

    if (result.duplicate) {
      console.log('[notification-router] Webhook already processed', logContext);
      logWebhookAnalytics(
        {
          source: result.source,
          status: 'duplicate',
          metadata: logContext,
        },
        ctx.pathname
      );
    } else {
      console.log('[notification-router] Webhook routed', logContext);
      logWebhookAnalytics(
        {
          source: result.source,
          status: 'ingest',
          metadata: logContext,
        },
        ctx.pathname
      );
    }

    return successResponse(
      { message: 'OK', source: result.source, duplicate: result.duplicate },
      200,
      cors
    );
  } catch (error) {
    if (error instanceof WebhookIngestError) {
      if (error.status === 'unauthorized') {
        console.warn('[notification-router] Unauthorized webhook', { message: error.message });
        logWebhookAnalytics(
          {
            source: ctx.notificationType ?? ctx.discordNotificationType ?? 'unknown',
            status: 'error',
            metadata: { message: error.message, status: error.status },
          },
          ctx.pathname
        );
        return unauthorizedResponse(error.message, webhookCorsHeaders);
      }
      console.warn('[notification-router] Bad webhook payload', { message: error.message });
      logWebhookAnalytics(
        {
          source: ctx.notificationType ?? ctx.discordNotificationType ?? 'unknown',
          status: 'error',
          metadata: { message: error.message, status: error.status },
        },
        ctx.pathname
      );
      return badRequestResponse(error.message, webhookCorsHeaders);
    }

    console.error('[notification-router] Unexpected webhook error', error);
    logWebhookAnalytics(
      {
        source: ctx.notificationType ?? ctx.discordNotificationType ?? 'unknown',
        status: 'error',
        metadata: { message: error instanceof Error ? error.message : String(error) },
      },
      ctx.pathname
    );
    return errorResponse(error, 'notification-router:webhook', webhookCorsHeaders);
  }
}

type WebhookInteractionMetadata =
  Database['public']['Tables']['user_interactions']['Insert']['metadata'];

function logWebhookAnalytics(
  event: {
    source: string | null;
    status: 'ingest' | 'duplicate' | 'error';
    metadata?: Record<string, unknown>;
  },
  path: string
) {
  const metadata: WebhookInteractionMetadata = {
    path,
    source: event.source ?? 'unknown',
    ...(event.metadata ?? {}),
  };

  trackInteractionEdge({
    contentType: 'webhook',
    contentSlug: event.source ?? 'unknown',
    interactionType: `webhook_${event.status}`,
    metadata,
  }).catch((error) => {
    console.warn('[notification-router] analytics logging failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  });
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
    await insertNotification({
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
    });

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

    // Track failure immediately (critical path failure)
    trackInteractionEdge({
      interactionType: 'changelog_release_failure',
      contentType: 'changelog',
      contentSlug: job.slug,
      metadata: {
        entryId: job.entryId,
        msg_id: msg_id.toString(),
        attempt: message.read_ct,
        enqueued_at: message.enqueued_at,
        processed_at: new Date().toISOString(),
        errors,
        discordSuccess,
        notificationSuccess,
      },
    }).catch((analyticsError) => {
      console.warn('[notification-router] Analytics tracking failed', {
        ...logContext,
        error: analyticsError instanceof Error ? analyticsError.message : String(analyticsError),
      });
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
    await revalidateChangelogPages(job.slug);
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

  // 5. Track analytics (success/partial)
  if (notificationSuccess) {
    const durationMs = Date.now() - startTime;
    trackInteractionEdge({
      interactionType:
        errors.length === 0 ? 'changelog_release_success' : 'changelog_release_partial',
      contentType: 'changelog',
      contentSlug: job.slug,
      metadata: {
        entryId: job.entryId,
        msg_id: msg_id.toString(),
        attempt: message.read_ct,
        enqueued_at: message.enqueued_at,
        processed_at: new Date().toISOString(),
        duration_ms: durationMs,
        discordSuccess,
        notificationSuccess,
        cacheInvalidationSuccess,
        revalidationSuccess,
        errors: errors.length > 0 ? errors : undefined,
      },
    }).catch((error) => {
      console.warn('[notification-router] Analytics tracking failed', {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
      });
    });
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
