/**
 * Notification FAB (Floating Action Button)
 *
 * Mobile-only floating bell icon in bottom-right corner.
 * Opens notification sheet on click. Only shows if unread notifications exist.
 *
 * Features:
 * - WCAG 2.1 AA compliant (44x44px touch target)
 * - Motion.dev animations (entrance, hover, tap)
 * - Badge showing unread count
 * - Hidden on desktop (md: 768px+)
 * - z-index below back-to-top button (z-30 vs z-40)
 *
 * @module components/features/notifications/notification-fab
 */

'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Bell } from '@/src/lib/icons';
import { type NotificationStore, useNotificationStore } from '@/src/lib/stores/notification-store';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { NotificationBadge } from './notification-badge';

export function NotificationFAB() {
  // ✅ Select stable state value (not function call)
  const unreadCount = useNotificationStore((state: NotificationStore) => state.unreadCount);
  const openSheet = useNotificationStore((state: NotificationStore) => state.openSheet);

  // Hide if no unread notifications
  if (unreadCount === 0) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.button
        onClick={openSheet}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 17,
        }}
        className={
          'fixed relative right-6 bottom-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-black/20 shadow-lg transition-colors duration-200 will-change-transform hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background md:hidden dark:shadow-black/40'
        }
        aria-label={`${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`}
      >
        <Bell className={UI_CLASSES.ICON_LG} aria-hidden="true" />
        <NotificationBadge />
      </motion.button>
    </AnimatePresence>
  );
}
