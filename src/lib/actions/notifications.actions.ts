'use server';

import { z } from 'zod';
import { authedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import { dismissNotifications, getActiveNotifications } from '@/src/lib/notifications/service';

const getActiveNotificationsSchema = z.object({
  dismissedIds: z.array(z.string()).optional(),
});

const dismissNotificationsSchema = z.object({
  notificationIds: z.array(z.string().min(1, 'Notification ID required')),
});

export type ActiveNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  action_label: string | null;
  action_href: string | null;
  action_onclick: string | null;
  active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export const getActiveNotificationsAction = authedAction
  .metadata({
    actionName: 'getActiveNotifications',
    category: 'user',
  })
  .schema(getActiveNotificationsSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      return await getActiveNotifications({
        userId: ctx.userId,
        ...(parsedInput.dismissedIds ? { dismissedIds: parsedInput.dismissedIds } : {}),
      });
    } catch (error) {
      logger.error(
        'Failed to load active notifications',
        error instanceof Error ? error : new Error(String(error)),
        { userId: ctx.userId }
      );
      throw error;
    }
  });

export const dismissNotificationsAction = authedAction
  .metadata({
    actionName: 'dismissNotifications',
    category: 'user',
  })
  .schema(dismissNotificationsSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      await dismissNotifications({
        userId: ctx.userId,
        notificationIds: parsedInput.notificationIds,
      });
      return { success: true };
    } catch (error) {
      logger.error(
        'Failed to dismiss notifications',
        error instanceof Error ? error : new Error(String(error)),
        { userId: ctx.userId }
      );
      throw error;
    }
  });
