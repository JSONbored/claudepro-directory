/**
 * Create Notification Route
 * POST /notifications/create - Create a new notification
 *
 * Notifications are global (visible to all users), so auth is optional.
 * If auth token is provided, it's used for logging context only.
 */

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
    return badRequestResponse(
      `Invalid JSON payload: ${(error as Error).message}`,
      notificationCorsHeaders
    );
  }

  // Validate payload structure
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('title' in payload) ||
    !('message' in payload) ||
    typeof (payload as { title: unknown }).title !== 'string' ||
    typeof (payload as { message: unknown }).message !== 'string'
  ) {
    return badRequestResponse(
      'Invalid payload: title and message are required strings',
      notificationCorsHeaders
    );
  }

  // Sanitize and validate payload
  const sanitizedPayload = payload as NotificationInsertPayload;
  if (!(sanitizedPayload.title.trim() && sanitizedPayload.message.trim())) {
    return badRequestResponse(
      'Invalid payload: title and message cannot be empty',
      notificationCorsHeaders
    );
  }

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
