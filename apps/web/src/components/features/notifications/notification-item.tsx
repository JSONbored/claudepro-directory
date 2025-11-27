/**
 * Notification Item - Individual notification card with actions
 */

'use client';

import type { Database } from '@heyclaude/database-types';
import { Bell, X } from '@heyclaude/web-runtime/icons';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Button } from '@heyclaude/web-runtime/ui';
import { useNotificationsContext } from '@/src/components/providers/notifications-provider';

type NotificationRecord = Database['public']['Tables']['notifications']['Row'];

interface NotificationItemProps {
  notification: NotificationRecord;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { dismiss, closeSheet } = useNotificationsContext();

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
      className={
        'relative rounded-lg border border-border/50 bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md'
      }
    >
      <button
        type="button"
        onClick={handleDismiss}
        className={
          'absolute top-2 right-2 rounded-md p-1 text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent'
        }
        aria-label="Dismiss notification"
      >
        <X className={UI_CLASSES.ICON_SM} />
      </button>

      <div className="flex gap-3 pr-6">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            notification.type === 'announcement'
              ? 'bg-primary/10 text-primary'
              : 'bg-accent/10 text-accent'
          }
          `}
        >
          <Bell className={UI_CLASSES.ICON_MD} />
        </div>

        <div className="flex-1 space-y-1">
          <h4 className="font-medium text-foreground text-sm">{notification.title}</h4>
          <p className="text-muted-foreground text-xs leading-relaxed">{notification.message}</p>

          {notification.action_label && (
            <div className="pt-2">
              {notification.action_href ? (
                <Button asChild={true} variant="outline" size="sm">
                  <Link href={notification.action_href} onClick={handleActionClick}>
                    {notification.action_label}
                  </Link>
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
