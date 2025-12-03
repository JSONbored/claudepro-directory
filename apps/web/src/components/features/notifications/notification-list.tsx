/**
 * Notification List - Displays notification cards with animations
 */

'use client';

import type { Database } from '@heyclaude/database-types';
import {
  alignItems,
  display,
  flexDir,
  justify,
  muted,
  padding,
  size,
  spaceY,
  textAlign,
} from '@heyclaude/web-runtime/design-system';
import { AnimatePresence, motion } from 'motion/react';
import { memo } from 'react';
import { Button } from '@heyclaude/web-runtime/ui';
import { useNotificationsContext } from '@/src/components/providers/notifications-provider';
import { NotificationItem } from './notification-item';

type NotificationRecord = Database['public']['Tables']['notifications']['Row'];

function NotificationListComponent() {
  const { notifications, dismissAll } = useNotificationsContext();

  if (notifications.length === 0) {
    return (
      <div className={`${display.flex} ${flexDir.col} ${alignItems.center} ${justify.center} ${padding.relaxed} ${textAlign.center}`}>
        <p className={muted.sm}>No new notifications</p>
      </div>
    );
  }

  return (
    <div className={spaceY.default}>
      {notifications.length > 1 && (
        <div className={`${display.flex} ${justify.end} ${padding.xMicro}`}>
          <Button variant="ghost" size="sm" onClick={dismissAll} className={size.xs}>
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
