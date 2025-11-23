'use server';

import { dismissNotifications } from '../notifications.ts';
import { getActiveNotifications } from '../data/notifications.ts';
import { logActionFailure } from '../errors.ts';
import { authedAction } from './safe-action.ts';
import { traceMeta } from '../trace.ts'; import { type NotificationRecord } from '../notifications.ts'; // traceMeta is in trace.ts, NotificationRecord in notifications.ts (conflict?)
// Check imports again. NotificationRecord was imported from `../core` in original, which exported it from `../notifications.ts`.
// traceMeta was in `../core`.
// In package:
// notifications.ts has NotificationRecord
// trace.ts has traceMeta

import { z } from 'zod';

const MAX_NOTIFICATION_IDS = 50;

const getActiveNotificationsSchema = z.object({
  dismissedIds: z.array(z.string()).max(MAX_NOTIFICATION_IDS).optional(),
});

const dismissNotificationsSchema = z.object({
  notificationIds: z.array(z.string().min(1, 'Notification ID required')).max(MAX_NOTIFICATION_IDS),
});

export type ActiveNotification = NotificationRecord;
export type GetActiveNotificationsActionResult = {
  notifications: ActiveNotification[];
  traceId: string;
  dismissedCount: number;
};
export type DismissNotificationsActionResult = {
  success: true;
  dismissed: number;
  traceId: string;
  dismissRequestCount: number;
  notificationIds: string[];
};

export const getActiveNotificationsAction = authedAction
  .metadata({
    actionName: 'getActiveNotifications',
    category: 'user',
  })
  .inputSchema(getActiveNotificationsSchema)
  .action(async ({ parsedInput, ctx }): Promise<GetActiveNotificationsActionResult> => {
    const dismissedIds = parsedInput.dismissedIds ?? [];
    const meta = await traceMeta<{ dismissedCount: number }>({
      dismissedCount: dismissedIds.length,
    });

    try {
      const notifications = await getActiveNotifications({
        userId: ctx.userId,
        dismissedIds,
      });

      return {
        notifications: notifications as ActiveNotification[],
        ...meta,
      };
    } catch (error) {
      throw logActionFailure('notifications.getActiveNotifications', error, {
        userId: ctx.userId,
        ...meta,
      });
    }
  });

export const dismissNotificationsAction = authedAction
  .metadata({
    actionName: 'dismissNotifications',
    category: 'user',
  })
  .inputSchema(dismissNotificationsSchema)
  .action(async ({ parsedInput, ctx }): Promise<DismissNotificationsActionResult> => {
    const uniqueIds = Array.from(
      new Set(parsedInput.notificationIds.map((id) => id.trim()).filter(Boolean))
    ) as string[];
    const meta = await traceMeta<{
      dismissRequestCount: number;
      notificationIdsSnapshot: string;
    }>({
      dismissRequestCount: uniqueIds.length,
      notificationIdsSnapshot: uniqueIds.slice(0, 10).join(','),
    });

    if (uniqueIds.length === 0) {
      throw logActionFailure(
        'notifications.dismissNotifications',
        new Error('No notification IDs provided'),
        {
          userId: ctx.userId,
          ...meta,
        }
      );
    }

    try {
      // Use auth token from authedAction context (no client creation needed)
      if (!ctx.authToken) {
        throw logActionFailure(
          'notifications.dismissNotifications',
          new Error('User must be authenticated to dismiss notifications'),
          {
            userId: ctx.userId,
            ...meta,
          }
        );
      }

      const dismissed = await dismissNotifications({
        userId: ctx.userId,
        notificationIds: uniqueIds,
        authToken: ctx.authToken,
      });
      return {
        success: true,
        dismissed,
        traceId: meta.traceId,
        dismissRequestCount: uniqueIds.length,
        notificationIds: uniqueIds,
      };
    } catch (error) {
      throw logActionFailure('notifications.dismissNotifications', error, {
        userId: ctx.userId,
        ...meta,
      });
    }
  });
