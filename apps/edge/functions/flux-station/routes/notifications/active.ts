/**
 * Active Notifications Route
 * GET /active-notifications - Fetch active notifications for authenticated user
 */

import {
  createNotificationTrace,
  errorResponse,
  getActiveNotificationsForUser,
  initRequestLogging,
  notificationCorsHeaders,
  requireAuthUser,
  successResponse,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import { createNotificationRouterContext, logger } from '@heyclaude/shared-runtime';

export async function handleActiveNotifications(req: Request): Promise<Response> {
  const authResult = await requireAuthUser(req, {
    cors: notificationCorsHeaders,
    errorMessage: 'Missing or invalid Authorization header',
  });

  if ('response' in authResult) {
    return authResult.response;
  }
  
  // Create log context early for logging
  const logContext = createNotificationRouterContext('get-active-notifications', {
    userId: authResult.user.id,
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Get active notifications request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: logContext.request_id,
    operation: logContext.action || 'get-active-notifications',
    userId: authResult.user.id,
  });

  const url = new URL(req.url);
  const dismissedParam = url.searchParams.get('dismissed');
  const dismissedIds = dismissedParam
    ? dismissedParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : [];
  
  // Update bindings with dismissed count
  logger.setBindings({
    dismissedCount: dismissedIds.length,
  });
  traceStep(`Fetching active notifications (excluding ${dismissedIds.length} dismissed)`, logContext);

  try {
    const trace = createNotificationTrace({
      dismissedCount: dismissedIds.length,
      userId: authResult.user.id,
    });
    
    const notifications = await getActiveNotificationsForUser(
      authResult.user.id,
      dismissedIds,
      logContext
    );
    traceRequestComplete(logContext);

    return successResponse(
      {
        notifications,
        traceId: trace.traceId,
      },
      200,
      notificationCorsHeaders
    );
  } catch (error) {
    return await errorResponse(error, 'flux-station:active-notifications', notificationCorsHeaders, logContext);
  }
}
