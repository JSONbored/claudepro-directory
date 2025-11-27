/**
 * Dismiss Notifications Route
 * POST /dismiss - Dismiss notifications for authenticated user
 */

import {
  badRequestResponse,
  createNotificationTrace,
  dismissNotificationsForUser,
  errorResponse,
  initRequestLogging,
  notificationCorsHeaders,
  requireAuthUser,
  successResponse,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import {
  createNotificationRouterContext,
  errorToString,
  getProperty,
  logger,
  MAX_BODY_SIZE,
  validateBodySize,
} from '@heyclaude/shared-runtime';

export async function handleDismissNotifications(req: Request): Promise<Response> {
  const authResult = await requireAuthUser(req, {
    cors: notificationCorsHeaders,
    errorMessage: 'Missing or invalid Authorization header',
  });

  if ('response' in authResult) {
    return authResult.response;
  }
  
  // Create log context early for logging
  const logContext = createNotificationRouterContext('dismiss-notifications', {
    userId: authResult.user.id,
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Dismiss notifications request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: logContext.request_id,
    operation: logContext.action || 'dismiss-notifications',
    userId: authResult.user.id,
  });

  // Validate body size before reading
  const contentLength = req.headers.get('content-length');
  const bodySizeValidation = validateBodySize(contentLength, MAX_BODY_SIZE.dismiss);
  if (!bodySizeValidation.valid) {
    return badRequestResponse(
      bodySizeValidation.error ?? 'Request body too large',
      notificationCorsHeaders
    );
  }

  let payload: unknown;
  try {
    const bodyText = await req.text();
    // Double-check size after reading (in case Content-Length was missing/wrong)
    if (bodyText.length > MAX_BODY_SIZE.dismiss) {
      return badRequestResponse(
        `Request body too large (max ${MAX_BODY_SIZE.dismiss} bytes)`,
        notificationCorsHeaders
      );
    }
    payload = JSON.parse(bodyText);
  } catch (error) {
    return badRequestResponse(
      `Invalid JSON payload: ${errorToString(error)}`,
      notificationCorsHeaders
    );
  }

  // Validate payload structure
  const notificationIdsValue = getProperty(payload, 'notificationIds');
  const sanitizedIds = Array.isArray(notificationIdsValue)
    ? Array.from(
        new Set(
          notificationIdsValue
            .map((id) => (typeof id === 'string' ? id.trim() : ''))
            .filter(Boolean)
        )
      ).slice(0, 50)
    : [];

  if (sanitizedIds.length === 0) {
    return badRequestResponse('notificationIds array is required', notificationCorsHeaders);
  }
  
  // Update bindings with notification count
  logger.setBindings({
    notificationCount: sanitizedIds.length,
  });
  traceStep(`Dismissing ${sanitizedIds.length} notifications`, logContext);

  try {
    const trace = createNotificationTrace({
      dismissRequestCount: sanitizedIds.length,
      userId: authResult.user.id,
    });
    
    await dismissNotificationsForUser(authResult.user.id, sanitizedIds, logContext);
    traceRequestComplete(logContext);
    
    return successResponse(
      {
        dismissed: sanitizedIds.length,
        traceId: trace.traceId,
      },
      200,
      notificationCorsHeaders
    );
  } catch (error) {
    traceRequestComplete(logContext);
    return await errorResponse(error, 'flux-station:dismiss-notifications', notificationCorsHeaders, logContext);
  }
}
