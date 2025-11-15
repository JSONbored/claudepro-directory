/**
 * Notification Router - Discord handlers, changelog sync, notification APIs, webhooks.
 */

import type { Database } from '../_shared/database.types.ts';
import { handleChangelogSyncRequest } from '../_shared/handlers/changelog/handler.ts';
import { handleDiscordNotification } from '../_shared/handlers/discord/handler.ts';
import {
  createNotificationTrace,
  dismissNotificationsForUser,
  getActiveNotificationsForUser,
} from '../_shared/notifications/service.ts';
import { trackInteractionEdge } from '../_shared/utils/analytics/tracker.ts';
import { requireAuthUser } from '../_shared/utils/auth.ts';
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
