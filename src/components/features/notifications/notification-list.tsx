/**
 * Notification List - Displays notification cards with animations
 */

'use client';

import { AnimatePresence, motion } from 'motion/react';
import { memo } from 'react';
import { Button } from '@/src/components/primitives/button';
import type { Tables } from '@/src/types/database.types';

type Notification = Tables<'notifications'>;

import { type NotificationStore, useNotificationStore } from '@/src/lib/stores/notification-store';
import { NotificationItem } from './notification-item';

function NotificationListComponent() {
  const notifications = useNotificationStore((state: NotificationStore) => state.notifications);
  const dismissAll = useNotificationStore((state: NotificationStore) => state.dismissAll);

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">No new notifications</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.length > 1 && (
        <div className="flex justify-end px-1">
          <Button variant="ghost" size="sm" onClick={dismissAll} className="text-xs">
            Dismiss All
          </Button>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {notifications.map((notification: Notification) => (
          <motion.div key={notification.id} layout>
            <NotificationItem notification={notification} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export const NotificationList = memo(NotificationListComponent);
NotificationList.displayName = 'NotificationList';
