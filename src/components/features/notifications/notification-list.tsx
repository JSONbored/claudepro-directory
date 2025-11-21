/**
 * Notification List - Displays notification cards with animations
 */

'use client';

import { AnimatePresence, motion } from 'motion/react';
import { memo } from 'react';
import { Button } from '@/src/components/primitives/ui/button';
import { useNotificationsContext } from '@/src/components/providers/notifications-provider';
import type { Database } from '@/src/types/database.types';
import { NotificationItem } from './notification-item';

type NotificationRecord = Database['public']['Tables']['notifications']['Row'];

function NotificationListComponent() {
  const { notifications, dismissAll } = useNotificationsContext();

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground text-sm">No new notifications</p>
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
        {notifications.map((notification: NotificationRecord) => (
          <motion.div key={notification.id} layout={true}>
            <NotificationItem notification={notification} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export const NotificationList = memo(NotificationListComponent);
NotificationList.displayName = 'NotificationList';
