/**
 * Notification Badge Component
 *
 * Simple badge showing unread notification count.
 * Used in NotificationFAB and navigation.
 *
 * Features:
 * - ARIA live region for screen reader announcements
 * - Animation on count change
 * - Conditional rendering (only shows if count > 0)
 *
 * @module components/features/notifications/notification-badge
 */

'use client';

import { AnimatePresence, motion } from 'motion/react';
import { type NotificationStore, useNotificationStore } from '@/src/lib/stores/notification-store';

interface NotificationBadgeProps {
  /** Custom className for styling */
  className?: string;
}

export function NotificationBadge({ className = '' }: NotificationBadgeProps) {
  const unreadCount = useNotificationStore((state: NotificationStore) => state.getUnreadCount());

  if (unreadCount === 0) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={unreadCount}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`
          absolute -top-1 -right-1
          h-5 w-5
          rounded-full
          bg-destructive
          text-destructive-foreground
          text-xs font-medium
          flex items-center justify-center
          shadow-md
          ${className}
        `}
        aria-live="polite"
        aria-label={`${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`}
      >
        {unreadCount > 9 ? '9+' : unreadCount}
      </motion.div>
    </AnimatePresence>
  );
}
