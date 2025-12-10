/**
 * Notifications Handlers
 *
 * Handles notification-related flux operations:
 * - GET /api/flux/notifications/active - Get active notifications for user
 * - POST /api/flux/notifications/dismiss - Dismiss notifications for user
 * - POST /api/flux/notifications/create - Create a notification (auth required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cacheLife, cacheTag } from 'next/cache';

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { normalizeError } from '@heyclaude/shared-runtime';

import { createSupabaseAdminClient } from '../../supabase/admin';
import { createSupabaseServerClient } from '../../supabase/server';
import { logger, createWebAppContextWithId } from '../../logging/server';
import { createErrorResponse } from '../../utils/error-handler';

// Type guards for enum validation
type NotificationType = DatabaseGenerated['public']['Enums']['notification_type'];
type NotificationPriority = DatabaseGenerated['public']['Enums']['notification_priority'];

const notificationTypeValues = Constants.public.Enums.notification_type;
const notificationPriorityValues = Constants.public.Enums.notification_priority;

function isValidNotificationType(value: string): value is NotificationType {
  return notificationTypeValues.includes(value as NotificationType);
}

function isValidNotificationPriority(value: string): value is NotificationPriority {
  return notificationPriorityValues.includes(value as NotificationPriority);
}

// CORS headers for notification routes
const NOTIFICATION_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Max body size for dismiss (8KB)
const MAX_DISMISS_BODY_SIZE = 8192;

/**
 * Generate a trace ID for notification operations
 */
function createNotificationTraceId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Cached helper function to fetch active notifications for a user
 * Uses Cache Components to reduce function invocations
 * @param userId - The user ID to fetch notifications for
 * @returns Promise resolving to an array of active notifications
 */
async function getCachedActiveNotifications(userId: string) {
  'use cache';
  cacheTag(`notifications-${userId}`);
  cacheTag('notifications'); // Global tag for invalidation on create
  cacheLife({ stale: 60, revalidate: 300, expire: 900 }); // 1min stale, 5min revalidate, 15min expire

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('get_active_notifications_for_user', {
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * GET /api/flux/notifications/active
 * Fetch active notifications for the authenticated user
 */
export async function handleActiveNotifications(_request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const logContext = createWebAppContextWithId(
    '/api/flux/notifications/active',
    'handleActiveNotifications'
  );

  try {
    // Get user from auth header
    const supabaseClient = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: NOTIFICATION_CORS_HEADERS }
      );
    }

    // Fetch active notifications using RPC (with caching)
    const notifications = await getCachedActiveNotifications(user.id);

    const traceId = createNotificationTraceId();
    const durationMs = Date.now() - startTime;

    logger.info({ ...logContext,
      durationMs,
      userId: user.id,
      count: notifications.length, }, 'Active notifications retrieved');

    return NextResponse.json(
      { notifications, traceId },
      { status: 200, headers: NOTIFICATION_CORS_HEADERS }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to get active notifications');
    logger.error({ err: normalized, ...logContext }, 'Active notifications failed');

    return createErrorResponse(error, {
      route: '/api/flux/notifications/active',
      operation: 'GET',
      method: 'GET',
      logContext: {},
    });
  }
}

/**
 * POST /api/flux/notifications/dismiss
 * Dismiss one or more notifications for the authenticated user
 */
export async function handleDismissNotifications(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const logContext = createWebAppContextWithId(
    '/api/flux/notifications/dismiss',
    'handleDismissNotifications'
  );

  // Validate body size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_DISMISS_BODY_SIZE) {
    return NextResponse.json(
      { error: 'Request body too large' },
      { status: 400, headers: NOTIFICATION_CORS_HEADERS }
    );
  }

  try {
    // Get user from auth header
    const supabaseClient = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: NOTIFICATION_CORS_HEADERS }
      );
    }

    // Parse request body
    const body = await request.json() as { notificationIds?: unknown };
    
    // Validate and sanitize notification IDs
    const notificationIdsValue = body.notificationIds;
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
      return NextResponse.json(
        { error: 'notificationIds array is required' },
        { status: 400, headers: NOTIFICATION_CORS_HEADERS }
      );
    }

    // Record dismissals in database using RPC
    const supabase = createSupabaseAdminClient();
    const { data: dismissedCount, error: dismissError } = await supabase.rpc('dismiss_notifications', {
      p_user_id: user.id,
      p_notification_ids: sanitizedIds,
    });

    if (dismissError) {
      const normalized = normalizeError(dismissError, 'Notification dismissal failed');
      logger.error({ err: normalized, ...logContext }, 'Notification dismissal failed');
      throw dismissError;
    }

    // Invalidate cache for this user's notifications
    const { revalidateTag } = await import('next/cache');
    try {
      revalidateTag(`notifications-${user.id}`, 'max');
    } catch {
      // revalidateTag may fail in some contexts, but that's okay
    }

    const traceId = createNotificationTraceId();
    const durationMs = Date.now() - startTime;

    logger.info({ ...logContext,
      durationMs,
      userId: user.id,
      dismissedCount: dismissedCount || sanitizedIds.length, }, 'Notifications dismissed');

    return NextResponse.json(
      { dismissed: dismissedCount || sanitizedIds.length, traceId },
      { status: 200, headers: NOTIFICATION_CORS_HEADERS }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to dismiss notifications');
    logger.error({ err: normalized, ...logContext }, 'Dismiss notifications failed');

    return createErrorResponse(error, {
      route: '/api/flux/notifications/dismiss',
      operation: 'POST',
      method: 'POST',
      logContext: {},
    });
  }
}

// Max body size for create (8KB)
const MAX_CREATE_BODY_SIZE = 8192;

interface CreateNotificationPayload {
  title?: unknown;
  message?: unknown;
  type?: unknown;
  priority?: unknown;
  action_label?: unknown;
  action_href?: unknown;
}

/**
 * POST /api/flux/notifications/create
 * Create a new notification (requires authentication)
 */
export async function handleCreateNotification(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const logContext = createWebAppContextWithId(
    '/api/flux/notifications/create',
    'handleCreateNotification'
  );

  // Validate body size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_CREATE_BODY_SIZE) {
    return NextResponse.json(
      { error: 'Request body too large' },
      { status: 400, headers: NOTIFICATION_CORS_HEADERS }
    );
  }

  try {
    // Get user from auth header
    const supabaseClient = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: missing or invalid Authorization header' },
        { status: 401, headers: NOTIFICATION_CORS_HEADERS }
      );
    }

    // Parse request body
    let payload: CreateNotificationPayload;
    try {
      const bodyText = await request.text();
      if (bodyText.length > MAX_CREATE_BODY_SIZE) {
        return NextResponse.json(
          { error: `Request body too large (max ${MAX_CREATE_BODY_SIZE} bytes)` },
          { status: 400, headers: NOTIFICATION_CORS_HEADERS }
        );
      }
      payload = JSON.parse(bodyText) as CreateNotificationPayload;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400, headers: NOTIFICATION_CORS_HEADERS }
      );
    }

    // Extract and validate title and message
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const message = typeof payload.message === 'string' ? payload.message.trim() : '';

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Invalid payload: title and message are required strings' },
        { status: 400, headers: NOTIFICATION_CORS_HEADERS }
      );
    }

    // Validate optional fields
    const typeValue = typeof payload.type === 'string' ? payload.type : null;
    const priorityValue = typeof payload.priority === 'string' ? payload.priority : null;
    const actionLabel = typeof payload.action_label === 'string' ? payload.action_label : null;
    const actionHref = typeof payload.action_href === 'string' ? payload.action_href : null;

    // Validate action_href - only allow http(s) protocols
    if (actionHref) {
      try {
        const url = new URL(actionHref);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return NextResponse.json(
            { error: 'Invalid action_href: only http and https URLs are allowed' },
            { status: 400, headers: NOTIFICATION_CORS_HEADERS }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid action_href: must be a valid URL' },
          { status: 400, headers: NOTIFICATION_CORS_HEADERS }
        );
      }
    }

    // Build the notification insert payload
    const notificationId = crypto.randomUUID();
    const notificationInsert: DatabaseGenerated['public']['Tables']['notifications']['Insert'] = {
      id: notificationId,
      title,
      message,
      type: typeValue && isValidNotificationType(typeValue) ? typeValue : 'announcement',
      active: true,
    };

    // Add optional fields conditionally (satisfies exactOptionalPropertyTypes)
    if (priorityValue && isValidNotificationPriority(priorityValue)) {
      notificationInsert.priority = priorityValue;
    }
    if (actionLabel) {
      notificationInsert.action_label = actionLabel;
    }
    if (actionHref) {
      notificationInsert.action_href = actionHref;
    }

    // Insert into database
    const supabase = createSupabaseAdminClient();
    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert(notificationInsert)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Invalidate all notification caches since new notification affects all users
    // Note: We can't invalidate all user-specific tags, so we invalidate a global tag
    // Individual user caches will expire naturally (5min revalidate)
    const { revalidateTag } = await import('next/cache');
    try {
      revalidateTag('notifications', 'max');
    } catch {
      // revalidateTag may fail in some contexts, but that's okay
    }

    const traceId = createNotificationTraceId();
    const durationMs = Date.now() - startTime;

    logger.info({ ...logContext,
      durationMs,
      userId: user.id,
      notificationId: notification.id,
      notificationType: notification.type, }, 'Notification created');

    return NextResponse.json(
      { notification, traceId },
      { status: 200, headers: NOTIFICATION_CORS_HEADERS }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to create notification');
    logger.error({ err: normalized, ...logContext }, 'Create notification failed');

    return createErrorResponse(error, {
      route: '/api/flux/notifications/create',
      operation: 'POST',
      method: 'POST',
      logContext: {},
    });
  }
}
