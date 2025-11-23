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

import { logger } from '@heyclaude/web-runtime/core';
import { getAnimationConfig } from '@heyclaude/web-runtime/data';
import { POSITION_PATTERNS } from '@heyclaude/web-runtime/ui';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNotificationsContext } from '@/src/components/providers/notifications-provider';

interface NotificationBadgeProps {
  /** Custom className for styling */
  className?: string;
}

export function NotificationBadge({ className = '' }: NotificationBadgeProps) {
  const { unreadCount, flags } = useNotificationsContext();
  const [springBouncy, setSpringBouncy] = useState({
    type: 'spring' as const,
    stiffness: 500,
    damping: 20,
  });

  useEffect(() => {
    getAnimationConfig({})
      .then((result) => {
        if (!result?.data) return;
        const config = result.data;
        setSpringBouncy({
          type: 'spring' as const,
          stiffness: config['animation.spring.bouncy.stiffness'],
          damping: config['animation.spring.bouncy.damping'],
        });
      })
      .catch((error) => {
        logger.error('NotificationBadge: failed to load animation config', error);
      });
  }, []);

  if (!flags.enableNotifications) return null;
  if (unreadCount === 0) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={unreadCount}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={springBouncy}
        className={`${POSITION_PATTERNS.ABSOLUTE_TOP_BADGE} flex h-5 w-5 items-center justify-center rounded-full bg-destructive font-medium text-destructive-foreground text-xs shadow-md ${className}
        `}
        aria-live="polite"
        aria-label={`${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`}
      >
        {unreadCount > 9 ? '9+' : unreadCount}
      </motion.div>
    </AnimatePresence>
  );
}
