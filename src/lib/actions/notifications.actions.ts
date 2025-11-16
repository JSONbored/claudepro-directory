'use server';

import { z } from 'zod';
import { traceMeta } from '@/src/lib/actions/action-helpers';
import { authedAction } from '@/src/lib/actions/safe-action';
import { getActiveNotifications, type NotificationRecord } from '@/src/lib/data/notifications';
import { dismissNotifications } from '@/src/lib/notifications/service';
import { logActionFailure } from '@/src/lib/utils/error.utils';

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
  .schema(getActiveNotificationsSchema)
  .action(async ({ parsedInput, ctx }): Promise<GetActiveNotificationsActionResult> => {
    const dismissedIds = parsedInput.dismissedIds ?? [];
    const meta = traceMeta<{ dismissedCount: number }>({ dismissedCount: dismissedIds.length });

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
  .schema(dismissNotificationsSchema)
  .action(async ({ parsedInput, ctx }): Promise<DismissNotificationsActionResult> => {
    const uniqueIds = Array.from(
      new Set(parsedInput.notificationIds.map((id) => id.trim()).filter(Boolean))
    );
    const meta = traceMeta<{
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
      const dismissed = await dismissNotifications({
        userId: ctx.userId,
        notificationIds: uniqueIds,
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
