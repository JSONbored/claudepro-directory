/**
 * Create Notification Route
 * POST /notifications/create - Create a new notification
 *
 * Notifications are global (visible to all users).
 * Auth is required to create a notification.
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import {
  badRequestResponse,
  createNotificationTrace,
  errorResponse,
  getAuthUserFromHeader,
  initRequestLogging,
  insertNotification,
  type NotificationInsertPayload,
  notificationCorsHeaders,
  successResponse,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import {
  createNotificationRouterContext,
  logger,
  MAX_BODY_SIZE,
  validateBodySize,
} from '@heyclaude/shared-runtime';

export async function handleCreateNotification(req: Request): Promise<Response> {
  // Optional auth - use for logging context if provided
  const authHeader = req.headers.get('Authorization');
  const authResult = authHeader ? await getAuthUserFromHeader(authHeader) : null;

  // Require a valid authenticated caller for creating global notifications
  if (!authResult) {
    return badRequestResponse(
      'Unauthorized: missing or invalid Authorization header',
      notificationCorsHeaders
    );
  }
  
  // Create log context early for logging
  const logContext = createNotificationRouterContext('create-notification', {
    userId: authResult.user.id,
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Create notification request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: logContext.request_id,
    operation: logContext.action || 'create-notification',
    userId: authResult.user.id,
  });

  // Validate body size before reading
  const contentLength = req.headers.get('content-length');
  const bodySizeValidation = validateBodySize(contentLength, MAX_BODY_SIZE.default);
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
    if (bodyText.length > MAX_BODY_SIZE.default) {
      return badRequestResponse(
        `Request body too large (max ${MAX_BODY_SIZE.default} bytes)`,
        notificationCorsHeaders
      );
    }
    payload = JSON.parse(bodyText);
  } catch (error) {
    const { errorToString } = await import('@heyclaude/shared-runtime');
    return badRequestResponse(
      `Invalid JSON payload: ${errorToString(error)}`,
      notificationCorsHeaders
    );
  }

  // Validate payload structure
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

  // Type guards for enum validation
  type NotificationType = DatabaseGenerated['public']['Enums']['notification_type'];
  type NotificationPriority = DatabaseGenerated['public']['Enums']['notification_priority'];

  // Use enum values directly from @heyclaude/database-types Constants
  const notificationTypeValues = Constants.public.Enums.notification_type;
  const notificationPriorityValues = Constants.public.Enums.notification_priority;

  function isValidNotificationType(value: string): value is NotificationType {
    for (const validType of notificationTypeValues) {
      if (value === validType) {
        return true;
      }
    }
    return false;
  }

  function isValidNotificationPriority(value: string): value is NotificationPriority {
    for (const validPriority of notificationPriorityValues) {
      if (value === validPriority) {
        return true;
      }
    }
    return false;
  }

  const title = getStringProperty(payload, 'title');
  const message = getStringProperty(payload, 'message');

  if (!(title && message)) {
    return badRequestResponse(
      'Invalid payload: title and message are required strings',
      notificationCorsHeaders
    );
  }

  // Build sanitized payload
  const sanitizedTitle = title.trim();
  const sanitizedMessage = message.trim();

  if (!(sanitizedTitle && sanitizedMessage)) {
    return badRequestResponse(
      'Invalid payload: title and message cannot be empty',
      notificationCorsHeaders
    );
  }

  // Validate and extract optional enum fields
  const typeValue = getStringProperty(payload, 'type');
  const priorityValue = getStringProperty(payload, 'priority');
  const actionLabel = getStringProperty(payload, 'action_label');
  const actionHref = getStringProperty(payload, 'action_href');

  const sanitizedPayload: NotificationInsertPayload = {
    title: sanitizedTitle,
    message: sanitizedMessage,
    // Optional fields with proper enum validation
    ...(typeValue && isValidNotificationType(typeValue) ? { type: typeValue } : {}),
    ...(priorityValue && isValidNotificationPriority(priorityValue)
      ? { priority: priorityValue }
      : {}),
    ...(actionLabel ? { action_label: actionLabel } : {}),
    ...(actionHref ? { action_href: actionHref } : {}),
  };
  
  // Update bindings with notification details
  logger.setBindings({
    notificationType: typeValue || 'default',
    priority: priorityValue || 'default',
  });
  traceStep('Inserting notification', logContext);

  try {
    const trace = createNotificationTrace({
      userId: authResult.user.id,
      source: 'main-app',
    });

    const notification = await insertNotification(sanitizedPayload, logContext);
    traceRequestComplete(logContext);

    return successResponse(
      {
        notification,
        traceId: trace.traceId,
      },
      200,
      notificationCorsHeaders
    );
  } catch (error) {
    return errorResponse(error, 'flux-station:create-notification', notificationCorsHeaders, logContext);
  }
}
