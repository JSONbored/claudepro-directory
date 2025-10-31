/**
 * Notification Item - Individual notification card with actions
 */

'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Button } from '@/src/components/primitives/button';
import type { Tables } from '@/src/types/database.types';

type Notification = Tables<'notifications'>;

import { Bell, X } from '@/src/lib/icons';
import { type NotificationStore, useNotificationStore } from '@/src/lib/stores/notification-store';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const dismiss = useNotificationStore((state: NotificationStore) => state.dismiss);
  const closeSheet = useNotificationStore((state: NotificationStore) => state.closeSheet);

  const handleDismiss = () => {
    dismiss(notification.id);
  };

  const handleActionClick = () => {
    // Close sheet when action is clicked
    closeSheet();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`
        relative
        p-4
        bg-card
        border border-border/50
        rounded-lg
        shadow-sm
        hover:shadow-md
        transition-shadow duration-200
      `}
    >
      <button
        type="button"
        onClick={handleDismiss}
        className={`
          absolute top-2 right-2
          p-1
          rounded-md
          text-muted-foreground
          hover:text-foreground
          hover:bg-accent
          focus:outline-none focus:ring-2 focus:ring-accent
          transition-colors duration-150
        `}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex gap-3 pr-6">
        <div
          className={`
            flex-shrink-0
            h-10 w-10
            rounded-full
            flex items-center justify-center
            ${
              notification.type === 'announcement'
                ? 'bg-primary/10 text-primary'
                : 'bg-accent/10 text-accent'
            }
          `}
        >
          <Bell className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-1">
          <h4 className="font-medium text-sm text-foreground">{notification.title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{notification.message}</p>

          {notification.action_label && (
            <div className="pt-2">
              {notification.action_href ? (
                <Button asChild variant="outline" size="sm" onClick={handleActionClick}>
                  <Link href={notification.action_href}>{notification.action_label}</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleActionClick}>
                  {notification.action_label}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
