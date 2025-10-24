/**
 * Notification Item Component
 *
 * Individual notification card displayed in sheet/list.
 * Shows title, message, action button, and dismiss control.
 *
 * Features:
 * - Motion.dev hover animations
 * - Icon rendering (dynamic lucide icons)
 * - Action button (link or custom handler)
 * - Dismiss button with confirmation
 * - Responsive layout
 *
 * @module components/features/notifications/notification-item
 */

'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Button } from '@/src/components/primitives/button';
import type { Notification } from '@/src/config/notifications';
import { Bell, MessageSquare, Sparkles, X } from '@/src/lib/icons';
import { type NotificationStore, useNotificationStore } from '@/src/lib/stores/notification-store';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const dismiss = useNotificationStore((state: NotificationStore) => state.dismiss);
  const closeSheet = useNotificationStore((state: NotificationStore) => state.closeSheet);

  // Simple icon selection - no unnecessary abstraction
  let Icon = Bell;
  if (notification.icon === 'Sparkles') Icon = Sparkles;
  if (notification.icon === 'MessageSquare') Icon = MessageSquare;

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
      {/* Dismiss Button */}
      <button
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

      {/* Content */}
      <div className="flex gap-3 pr-6">
        {/* Icon */}
        {Icon && (
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
            <Icon className="h-5 w-5" />
          </div>
        )}

        {/* Text Content */}
        <div className="flex-1 space-y-1">
          <h4 className="font-medium text-sm text-foreground">{notification.title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{notification.message}</p>

          {/* Action Button */}
          {notification.action && (
            <div className="pt-2">
              {notification.action.href ? (
                <Button asChild variant="outline" size="sm" onClick={handleActionClick}>
                  <Link href={notification.action.href}>{notification.action.label}</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleActionClick}>
                  {notification.action.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
