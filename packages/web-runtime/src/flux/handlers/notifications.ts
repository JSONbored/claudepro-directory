/**
 * Notifications Handlers
 *
 * Handles notification-related flux operations:
 * - GET /api/flux/notifications/active - Get active notifications for user
 * - POST /api/flux/notifications/dismiss - Dismiss notifications for user
 * - POST /api/flux/notifications/create - Create a notification (auth required)
 */

import { NextRequest, NextResponse } from 'next/server';

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { normalizeError } from '@heyclaude/shared-runtime';

import { createSupabaseAdminClient } from '../../supabase/admin';
import { createSupabaseServerClient } from '../../supabase/server';
import { logger, generateRequestId, createWebAppContextWithId } from '../../logging/server';
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
 * GET /api/flux/notifications/active
 * Fetch active notifications for the authenticated user
 */
export async function handleActiveNotifications(_request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const logContext = createWebAppContextWithId(
    requestId,
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

    // Fetch active notifications using admin client
    const supabase = createSupabaseAdminClient();
    
    // Fetch dismissed notification IDs from database (source of truth)
    const { data: dismissedRecords } = await supabase
      .from('notification_dismissals')
      .select('notification_id')
      .eq('user_id', user.id);

    const dismissedIds = (dismissedRecords || []).map((r) => r.notification_id);

    // Get notifications that are active and not expired
    const { data: notifications, error: queryError } = await supabase
      .from('notifications')
      .select('*')
      .eq('active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (queryError) {
      throw queryError;
    }

    // Filter out dismissed notifications
    const filteredNotifications = (notifications || []).filter(
      (n) => !dismissedIds.includes(n.id)
    );

    const traceId = createNotificationTraceId();
    const durationMs = Date.now() - startTime;

    logger.info('Active notifications retrieved', {
      ...logContext,
      durationMs,
      userId: user.id,
      count: filteredNotifications.length,
      dismissedCount: dismissedIds.length,
    });

    return NextResponse.json(
      { notifications: filteredNotifications, traceId },
      { status: 200, headers: NOTIFICATION_CORS_HEADERS }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to get active notifications');
    logger.error('Active notifications failed', normalized, logContext);

    return createErrorResponse(error, {
      route: '/api/flux/notifications/active',
      operation: 'GET',
      method: 'GET',
      logContext: { requestId },
    });
  }
}

/**
 * POST /api/flux/notifications/dismiss
 * Dismiss one or more notifications for the authenticated user
 */
export async function handleDismissNotifications(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const logContext = createWebAppContextWithId(
    requestId,
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

    // Record dismissals in database
    const supabase = createSupabaseAdminClient();
    
    // Insert dismissal records (upsert to handle duplicates)
    const dismissals = sanitizedIds.map((notificationId) => ({
      user_id: user.id,
      notification_id: notificationId,
      dismissed_at: new Date().toISOString(),
    }));

    const { error: dismissError } = await supabase
      .from('notification_dismissals')
      .upsert(dismissals, { onConflict: 'user_id,notification_id' });

    if (dismissError) {
      // Upsert handles duplicates via onConflict, so any error is a real problem
      // Check for specific error codes that might be tolerable
      const errorCode = (dismissError as { code?: string }).code;
      if (errorCode === '23505') {
        // Unique violation - shouldn't happen with upsert but tolerate it
        logger.warn('Notification dismissal duplicate (unexpected)', {
          ...logContext,
          errorMessage: dismissError.message,
          errorCode,
        });
      } else {
        // Real error - log and throw
        const normalized = normalizeError(dismissError, 'Notification dismissal failed');
        logger.error('Notification dismissal failed', normalized, {
          ...logContext,
          errorCode,
        });
        throw dismissError;
      }
    }

    const traceId = createNotificationTraceId();
    const durationMs = Date.now() - startTime;

    logger.info('Notifications dismissed', {
      ...logContext,
      durationMs,
      userId: user.id,
      dismissedCount: sanitizedIds.length,
    });

    return NextResponse.json(
      { dismissed: sanitizedIds.length, traceId },
      { status: 200, headers: NOTIFICATION_CORS_HEADERS }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to dismiss notifications');
    logger.error('Dismiss notifications failed', normalized, logContext);

    return createErrorResponse(error, {
      route: '/api/flux/notifications/dismiss',
      operation: 'POST',
      method: 'POST',
      logContext: { requestId },
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
  const requestId = generateRequestId();
  const logContext = createWebAppContextWithId(
    requestId,
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

    const traceId = createNotificationTraceId();
    const durationMs = Date.now() - startTime;

    logger.info('Notification created', {
      ...logContext,
      durationMs,
      userId: user.id,
      notificationId: notification.id,
      notificationType: notification.type,
    });

    return NextResponse.json(
      { notification, traceId },
      { status: 200, headers: NOTIFICATION_CORS_HEADERS }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to create notification');
    logger.error('Create notification failed', normalized, logContext);

    return createErrorResponse(error, {
      route: '/api/flux/notifications/create',
      operation: 'POST',
      method: 'POST',
      logContext: { requestId },
    });
  }
}
