/**
 * Active Notifications Route
 * GET /active-notifications - Fetch active notifications for authenticated user
 */

import {
  createNotificationTrace,
  getActiveNotificationsForUser,
} from '@heyclaude/edge-runtime/notifications/service.ts';
import { requireAuthUser } from '@heyclaude/edge-runtime/utils/auth.ts';
import {
  errorResponse,
  notificationCorsHeaders,
  successResponse,
} from '@heyclaude/edge-runtime/utils/http.ts';
import { createNotificationRouterContext } from '@heyclaude/shared-runtime';

export async function handleActiveNotifications(req: Request): Promise<Response> {
  const authResult = await requireAuthUser(req, {
    cors: notificationCorsHeaders,
    errorMessage: 'Missing or invalid Authorization header',
  });

  if ('response' in authResult) {
    return authResult.response;
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
    return errorResponse(error, 'flux-station:active-notifications', notificationCorsHeaders);
  }
}
