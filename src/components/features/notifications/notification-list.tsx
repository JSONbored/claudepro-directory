/**
 * Notification List Component
 *
 * Simple list of notification cards.
 * Displays active, non-dismissed notifications.
 *
 * Features:
 * - AnimatePresence for smooth exit animations
 * - Empty state handling
 * - Dismiss all button
 *
 * @module components/features/notifications/notification-list
 */

'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/src/components/primitives/button';
import type { Notification } from '@/src/config/notifications';
import { type NotificationStore, useNotificationStore } from '@/src/lib/stores/notification-store';
import { NotificationItem } from './notification-item';

export function NotificationList() {
  // ✅ Select stable state reference (not function call)
  const activeNotifications = useNotificationStore(
    (state: NotificationStore) => state.activeNotifications
  );
  const dismissAll = useNotificationStore((state: NotificationStore) => state.dismissAll);

  if (activeNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">No new notifications</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Dismiss All Button */}
      {activeNotifications.length > 1 && (
        <div className="flex justify-end px-1">
          <Button variant="ghost" size="sm" onClick={dismissAll} className="text-xs">
            Dismiss All
          </Button>
        </div>
      )}

      {/* Notification Cards */}
      <AnimatePresence mode="popLayout">
        {activeNotifications.map((notification: Notification) => (
          <motion.div key={notification.id} layout>
            <NotificationItem notification={notification} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
