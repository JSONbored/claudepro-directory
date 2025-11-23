/**
 * Dismiss Notifications Route
 * POST /dismiss - Dismiss notifications for authenticated user
 */

import {
  createNotificationTrace,
  dismissNotificationsForUser,
} from '@heyclaude/edge-runtime/notifications/service.ts';
import { requireAuthUser } from '@heyclaude/edge-runtime/utils/auth.ts';
import {
  badRequestResponse,
  errorResponse,
  notificationCorsHeaders,
  successResponse,
} from '@heyclaude/edge-runtime/utils/http.ts';
import {
  createNotificationRouterContext,
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

  try {
    const trace = createNotificationTrace({
      dismissRequestCount: sanitizedIds.length,
      userId: authResult.user.id,
    });
    const logContext = createNotificationRouterContext('dismiss-notifications', {
      userId: authResult.user.id,
    });
    await dismissNotificationsForUser(authResult.user.id, sanitizedIds, logContext);
    return successResponse(
      {
        dismissed: sanitizedIds.length,
        traceId: trace.traceId,
      },
      200,
      notificationCorsHeaders
    );
  } catch (error) {
    return errorResponse(error, 'flux-station:dismiss', notificationCorsHeaders);
  }
}
