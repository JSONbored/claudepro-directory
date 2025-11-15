/**
 * Notification Router - Consolidated Discord + webhook + changelog handling.
 */

import { supabaseServiceRole } from '../_shared/clients/supabase.ts';
import { handleChangelogSyncRequest } from '../_shared/handlers/changelog/handler.ts';
import { handleDiscordNotification } from '../_shared/handlers/discord/handler.ts';
import {
  dismissNotificationsForUser,
  getActiveNotificationsForUser,
} from '../_shared/notifications/service.ts';
import {
  badRequestResponse,
  changelogCorsHeaders,
  discordCorsHeaders,
  errorResponse,
  notificationCorsHeaders,
  requireMethod,
  successResponse,
  unauthorizedResponse,
  webhookCorsHeaders,
} from '../_shared/utils/http.ts';
import { ingestWebhookEvent, WebhookIngestError } from '../_shared/utils/webhook/ingest.ts';

type RouteContext = {
  pathname: string;
  url: URL;
  discordNotificationType: string | null;
  notificationType: string | null;
};

type RouteDefinition = {
  name: string;
  match: (req: Request, ctx: RouteContext) => boolean;
  handler: (req: Request, ctx: RouteContext) => Promise<Response>;
  cors: Record<string, string>;
};

const routeDefinitions: RouteDefinition[] = [
  {
    name: 'discord',
    match: (_, ctx) => Boolean(ctx.discordNotificationType),
    cors: discordCorsHeaders,
    handler: (req, ctx) => {
      const notificationType = ctx.discordNotificationType;
      if (!notificationType) {
        return badRequestResponse('Missing X-Discord-Notification-Type header', discordCorsHeaders);
      }
      return handleDiscordNotification(req, notificationType);
    },
  },
  {
    name: 'active-notifications',
    match: (_, ctx) => ctx.pathname.startsWith('/active-notifications'),
    cors: notificationCorsHeaders,
    handler: (req) => handleActiveNotifications(req),
  },
  {
    name: 'dismiss-notifications',
    match: (_, ctx) => ctx.pathname.startsWith('/dismiss'),
    cors: notificationCorsHeaders,
    handler: (req) => handleDismissNotifications(req),
  },
  {
    name: 'changelog-sync',
    match: (_, ctx) =>
      ctx.pathname.startsWith('/changelog-sync') || ctx.notificationType === 'changelog-sync',
    cors: changelogCorsHeaders,
    handler: (req) => handleChangelogSyncRequest(req),
  },
  {
    name: 'webhook',
    match: () => true,
    cors: webhookCorsHeaders,
    handler: (req) => handleExternalWebhook(req),
  },
];

function buildOptionsResponse(corsHeaders: Record<string, string>): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function resolveRoute(req: Request, ctx: RouteContext): RouteDefinition {
  const fallbackRoute = routeDefinitions[routeDefinitions.length - 1];
  return routeDefinitions.find((route) => route.match(req, ctx)) ?? fallbackRoute;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const pathname = url.pathname.replace(/^\/notification-router/, '');
  const routeContext: RouteContext = {
    pathname,
    url,
    discordNotificationType: req.headers.get('X-Discord-Notification-Type'),
    notificationType: req.headers.get('X-Notification-Type'),
  };

  const route = resolveRoute(req, routeContext);

  if (req.method === 'OPTIONS') {
    return buildOptionsResponse(route.cors);
  }

  return route.handler(req, routeContext);
});

async function handleActiveNotifications(req: Request): Promise<Response> {
  const methodError = requireMethod(req, 'GET', notificationCorsHeaders);
  if (methodError) {
    return methodError;
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;

  if (!token) {
    return unauthorizedResponse('Missing Authorization header', notificationCorsHeaders);
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseServiceRole.auth.getUser(token);

  if (authError || !user) {
    return unauthorizedResponse('Invalid or expired token', notificationCorsHeaders);
  }

  const url = new URL(req.url);
  const dismissedParam = url.searchParams.get('dismissed');
  const dismissedIds = dismissedParam
    ? dismissedParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  try {
    const notifications = await getActiveNotificationsForUser(user.id, dismissedIds);

    return successResponse(
      {
        notifications,
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

async function handleDismissNotifications(req: Request): Promise<Response> {
  const methodError = requireMethod(req, 'POST', notificationCorsHeaders);
  if (methodError) {
    return methodError;
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;

  if (!token) {
    return unauthorizedResponse('Missing Authorization header', notificationCorsHeaders);
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseServiceRole.auth.getUser(token);

  if (authError || !user) {
    return unauthorizedResponse('Invalid or expired token', notificationCorsHeaders);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    return badRequestResponse(
      `Invalid JSON payload: ${(error as Error).message}`,
      notificationCorsHeaders
    );
  }

  const notificationIds =
    typeof payload === 'object' &&
    payload !== null &&
    Array.isArray((payload as { notificationIds?: unknown[] }).notificationIds)
      ? (payload as { notificationIds: unknown[] }).notificationIds
          .map((id) => (typeof id === 'string' ? id.trim() : ''))
          .filter(Boolean)
      : [];

  if (notificationIds.length === 0) {
    return badRequestResponse('notificationIds array is required', notificationCorsHeaders);
  }

  try {
    await dismissNotificationsForUser(user.id, notificationIds);
    return successResponse(
      {
        dismissed: notificationIds.length,
      },
      200,
      notificationCorsHeaders
    );
  } catch (error) {
    return errorResponse(error, 'notification-router:dismiss', notificationCorsHeaders);
  }
}

async function handleExternalWebhook(req: Request): Promise<Response> {
  const methodError = requireMethod(req, 'POST', webhookCorsHeaders);
  if (methodError) {
    return methodError;
  }

  try {
    const body = await req.text();
    const result = await ingestWebhookEvent(body, req.headers);
    const cors = result.cors ?? webhookCorsHeaders;

    const logContext = {
      source: result.source,
      duplicate: result.duplicate,
      receivedAt: new Date().toISOString(),
    };

    if (result.duplicate) {
      console.log('[notification-router] Webhook already processed', logContext);
    } else {
      console.log('[notification-router] Webhook routed', logContext);
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
        return unauthorizedResponse(error.message, webhookCorsHeaders);
      }
      console.warn('[notification-router] Bad webhook payload', { message: error.message });
      return badRequestResponse(error.message, webhookCorsHeaders);
    }

    console.error('[notification-router] Unexpected webhook error', error);
    return errorResponse(error, 'notification-router:webhook', webhookCorsHeaders);
  }
}
