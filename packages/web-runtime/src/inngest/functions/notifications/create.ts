/**
 * Notifications Create Inngest Function
 *
 * Event-driven function to create global notifications.
 * Used for system announcements, feature releases, etc.
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';

import { inngest } from '../../client';
import { createSupabaseAdminClient } from '../../../supabase/admin';
import { logger, createWebAppContextWithId } from '../../../logging/server';

type NotificationType = DatabaseGenerated['public']['Enums']['notification_type'];
type NotificationPriority = DatabaseGenerated['public']['Enums']['notification_priority'];

// Type guards
function isValidNotificationType(value: string): value is NotificationType {
  const validTypes = Constants.public.Enums.notification_type;
  return validTypes.includes(value as NotificationType);
}

function isValidNotificationPriority(value: string): value is NotificationPriority {
  const validPriorities = Constants.public.Enums.notification_priority;
  return validPriorities.includes(value as NotificationPriority);
}

/**
 * Create a global notification
 *
 * Event payload:
 * - title: string (required)
 * - message: string (required)
 * - type?: 'info' | 'success' | 'warning' | 'error' | 'announcement'
 * - priority?: 'low' | 'normal' | 'high' | 'urgent'
 * - action_label?: string
 * - action_href?: string
 * - id?: string (for idempotency)
 */
export const createNotification = inngest.createFunction(
  {
    id: 'notifications-create',
    name: 'Create Notification',
    retries: 3,
  },
  { event: 'notification/create' },
  async ({ event, step }) => {
    const startTime = Date.now();
    const logContext = createWebAppContextWithId('/inngest/notifications/create', 'createNotification');

    const { title, message, type, priority, action_label, action_href, id } = event.data;

    logger.info({ ...logContext,
      title,
      type: type ?? 'info',
      priority: priority ?? 'normal', }, 'Creating notification');

    // Validate required fields
    if (!title || typeof title !== 'string') {
      logger.warn(logContext, 'Invalid notification: missing title');
      throw new Error('Invalid notification: title is required');
    }

    if (!message || typeof message !== 'string') {
      logger.warn(logContext, 'Invalid notification: missing message');
      throw new Error('Invalid notification: message is required');
    }

    // Validate action_href if provided - only allow http(s) protocols
    if (action_href) {
      try {
        const url = new URL(action_href);
        if (!['http:', 'https:'].includes(url.protocol)) {
          logger.warn({ ...logContext,
            action_href, }, 'Invalid action_href: only http/https allowed');
          throw new Error('Invalid action_href: only http and https URLs are allowed');
        }
      } catch (urlError) {
        if (urlError instanceof Error && urlError.message.includes('only http')) {
          throw urlError; // Re-throw our validation error
        }
        logger.warn({ ...logContext,
          action_href, }, 'Invalid action_href: invalid URL format');
        throw new Error('Invalid action_href: must be a valid URL');
      }
    }

    // Step 1: Create the notification
    const notification = await step.run('create-notification', async (): Promise<{
      id: string;
    }> => {
      const supabase = createSupabaseAdminClient();

      // Use provided ID or generate new one
      const notificationId = id ?? crypto.randomUUID();

      // Build notification data carefully to avoid exactOptionalPropertyTypes issues
      const notificationData: DatabaseGenerated['public']['Tables']['notifications']['Insert'] = {
        id: notificationId,
        title: title.trim(),
        message: message.trim(),
        type: (type && isValidNotificationType(type) ? type : 'info') as NotificationType,
        priority: (priority && isValidNotificationPriority(priority) ? priority : 'normal') as NotificationPriority,
      };

      // Add optional fields only if they have values
      if (action_label) {
        notificationData.action_label = action_label;
      }
      if (action_href) {
        notificationData.action_href = action_href;
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select('id')
        .single();

      if (error) {
        throw new Error(`Notification insert failed: ${error.message}`);
      }

      return { id: data.id };
    });

    // Step 2: Log the notification creation
    await step.run('log-notification', async () => {
      logger.info({ ...logContext,
        notificationId: notification.id, }, 'Notification created successfully');
    });

    const durationMs = Date.now() - startTime;
    logger.info({ ...logContext,
      durationMs,
      notificationId: notification.id, }, 'Create notification function completed');

    return {
      success: true,
      notificationId: notification.id,
    };
  }
);

/**
 * Broadcast a notification (system-wide announcement)
 *
 * Similar to createNotification but with different defaults
 * and potentially different distribution logic.
 */
export const broadcastNotification = inngest.createFunction(
  {
    id: 'notifications-broadcast',
    name: 'Broadcast Notification',
    retries: 2,
  },
  { event: 'notification/broadcast' },
  async ({ event, step }) => {
    const startTime = Date.now();
    const logContext = createWebAppContextWithId('/inngest/notifications/broadcast', 'broadcastNotification');

    const { title, message, type, priority, action_label, action_href } = event.data;

    logger.info({ ...logContext,
      title,
      type: type ?? 'announcement', }, 'Broadcasting notification');

    // Validate required fields
    if (!title || typeof title !== 'string') {
      logger.warn(logContext, 'Invalid broadcast notification: missing title');
      throw new Error('Invalid notification: title is required');
    }

    if (!message || typeof message !== 'string') {
      logger.warn(logContext, 'Invalid broadcast notification: missing message');
      throw new Error('Invalid notification: message is required');
    }

    // Validate action_href if provided - only allow http(s) protocols
    if (action_href) {
      try {
        const url = new URL(action_href);
        if (!['http:', 'https:'].includes(url.protocol)) {
          logger.warn({ ...logContext,
            action_href, }, 'Invalid action_href: only http/https allowed');
          throw new Error('Invalid action_href: only http and https URLs are allowed');
        }
      } catch (urlError) {
        if (urlError instanceof Error && urlError.message.includes('only http')) {
          throw urlError; // Re-throw our validation error
        }
        logger.warn({ ...logContext,
          action_href, }, 'Invalid action_href: invalid URL format');
        throw new Error('Invalid action_href: must be a valid URL');
      }
    }

    // Step 1: Create the notification
    const notification = await step.run('create-broadcast-notification', async (): Promise<{
      id: string;
    }> => {
      const supabase = createSupabaseAdminClient();

      const notificationId = crypto.randomUUID();

      // Build notification data carefully to avoid exactOptionalPropertyTypes issues
      const notificationData: DatabaseGenerated['public']['Tables']['notifications']['Insert'] = {
        id: notificationId,
        title: title.trim(),
        message: message.trim(),
        type: (type && isValidNotificationType(type) ? type : 'announcement') as NotificationType,
        priority: (priority && isValidNotificationPriority(priority) ? priority : 'high') as NotificationPriority,
      };

      // Add optional fields only if they have values
      if (action_label) {
        notificationData.action_label = action_label;
      }
      if (action_href) {
        notificationData.action_href = action_href;
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select('id')
        .single();

      if (error) {
        throw new Error(`Broadcast notification insert failed: ${error.message}`);
      }

      return { id: data.id };
    });

    // Step 2: Log the broadcast (actual delivery handled by notification system)
    await step.run('log-broadcast', async () => {
      logger.info({ ...logContext,
        notificationId: notification.id, }, 'Broadcast notification created');
    });

    const durationMs = Date.now() - startTime;
    logger.info({ ...logContext,
      durationMs,
      notificationId: notification.id, }, 'Broadcast notification completed');

    return {
      success: true,
      notificationId: notification.id,
      broadcast: true,
    };
  }
);
