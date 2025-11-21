/**
 * Create Notification Route
 * POST /notifications/create - Create a new notification
 *
 * Notifications are global (visible to all users), so auth is optional.
 * If auth token is provided, it's used for logging context only.
 */

import type { Database as DatabaseGenerated } from '../../../_shared/database.types.ts';
import {
  createNotificationTrace,
  insertNotification,
  type NotificationInsertPayload,
} from '../../../_shared/notifications/service.ts';
import { getAuthUserFromHeader } from '../../../_shared/utils/auth.ts';
import {
  badRequestResponse,
  errorResponse,
  notificationCorsHeaders,
  successResponse,
} from '../../../_shared/utils/http.ts';
import { MAX_BODY_SIZE, validateBodySize } from '../../../_shared/utils/input-validation.ts';
import { createNotificationRouterContext } from '../../../_shared/utils/logging.ts';

export async function handleCreateNotification(req: Request): Promise<Response> {
  // Optional auth - use for logging context if provided
  const authHeader = req.headers.get('Authorization');
  const authResult = authHeader ? await getAuthUserFromHeader(authHeader) : null;

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    return badRequestResponse(`Invalid JSON payload: ${errorMessage}`, notificationCorsHeaders);
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

  function isValidNotificationType(value: string): value is NotificationType {
    const validTypes: NotificationType[] = ['announcement', 'feedback'];
    for (const validType of validTypes) {
      if (value === validType) {
        return true;
      }
    }
    return false;
  }

  function isValidNotificationPriority(value: string): value is NotificationPriority {
    const validPriorities: NotificationPriority[] = ['high', 'medium', 'low'];
    for (const validPriority of validPriorities) {
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

  try {
    const trace = createNotificationTrace({
      userId: authResult?.user.id,
      source: 'main-app',
    });
    const logContext = createNotificationRouterContext('create-notification', {
      ...(authResult?.user.id !== undefined ? { userId: authResult.user.id } : {}),
      source: 'main-app',
    });

    const notification = await insertNotification(sanitizedPayload, logContext);

    return successResponse(
      {
        notification,
        traceId: trace.traceId,
      },
      200,
      notificationCorsHeaders
    );
  } catch (error) {
    return errorResponse(error, 'flux-station:create-notification', notificationCorsHeaders);
  }
}
