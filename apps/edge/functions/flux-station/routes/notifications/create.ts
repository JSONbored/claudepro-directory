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
  unauthorizedResponse,
} from '@heyclaude/edge-runtime';
import {
  createNotificationRouterContext,
  errorToString,
  logger,
  MAX_BODY_SIZE,
  validateBodySize,
} from '@heyclaude/shared-runtime';

// Type guards for enum validation (module scope - don't depend on handler-scoped variables)
type NotificationType = DatabaseGenerated['public']['Enums']['notification_type'];
type NotificationPriority = DatabaseGenerated['public']['Enums']['notification_priority'];

// Use enum values directly from @heyclaude/database-types Constants
const notificationTypeValues = Constants.public.Enums.notification_type;
const notificationPriorityValues = Constants.public.Enums.notification_priority;

/**
 * Checks whether a string matches one of the allowed notification type values.
 *
 * @param value - The string to validate as a notification type
 * @returns `true` if `value` is a valid `NotificationType`, `false` otherwise
 */
function isValidNotificationType(value: string): value is NotificationType {
  for (const validType of notificationTypeValues) {
    if (value === validType) {
      return true;
    }
  }
  return false;
}

/**
 * Checks whether a string is one of the allowed notification priority values.
 *
 * @param value - The string to validate as a notification priority
 * @returns `true` if `value` is a valid `NotificationPriority`, `false` otherwise.
 */
function isValidNotificationPriority(value: string): value is NotificationPriority {
  for (const validPriority of notificationPriorityValues) {
    if (value === validPriority) {
      return true;
    }
  }
  return false;
}

/**
 * Create a global notification for an authenticated user from a POST /notifications/create request.
 *
 * Validates the authorization header, request body size and JSON shape, enforces non-empty `title` and `message`,
 * validates optional `type`, `priority`, `action_label`, and `action_href`, persists the notification, and records a trace.
 *
 * @returns An object with the created `notification` and its `traceId` on success; a structured error response on failure.
 */
export async function handleCreateNotification(req: Request): Promise<Response> {
  // Optional auth - use for logging context if provided
  const authHeader = req.headers.get('Authorization');
  const authResult = authHeader ? await getAuthUserFromHeader(authHeader) : null;

  // Require a valid authenticated caller for creating global notifications
  if (!authResult) {
    return unauthorizedResponse(
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
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'create-notification',
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

  // Validate action_href as a URL if provided (prevent javascript: URIs and malformed URLs)
  if (actionHref) {
    try {
      const url = new URL(actionHref);
      // Reject javascript: and data: URIs for security
      if (url.protocol === 'javascript:' || url.protocol === 'data:') {
        return badRequestResponse(
          'Invalid action_href: javascript: and data: URIs are not allowed',
          notificationCorsHeaders
        );
      }
    } catch {
      return badRequestResponse(
        'Invalid action_href: must be a valid URL',
        notificationCorsHeaders
      );
    }
  }

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
    return await errorResponse(error, 'flux-station:create-notification', notificationCorsHeaders, logContext);
  }
}