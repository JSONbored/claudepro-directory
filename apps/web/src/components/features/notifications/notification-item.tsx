/**
 * Notification Item - Individual notification card with actions
 */

'use client';

import type { Database } from '@heyclaude/database-types';
import { iconSize, weight, muted, size, gap, spaceY, radius, borderColor,
  leading,
  animateDuration,
  transition,
  bgColor,
  justify,
  textColor,
  alignItems,
  flexGrow,
  padding,
  shadow,
} from '@heyclaude/web-runtime/design-system';
import { Bell, X } from '@heyclaude/web-runtime/icons';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Button } from '@heyclaude/web-runtime/ui';
import { useNotificationsContext } from '@/src/components/providers/notifications-provider';

type NotificationRecord = Database['public']['Tables']['notifications']['Row'];

interface NotificationItemProps {
  notification: NotificationRecord;
}

/**
 * Render a notification card with a dismiss control and an optional action button or link.
 *
 * @param props.notification - Notification record containing title, message, type, action_label, action_href, and id.
 * @returns The JSX element representing the notification item.
 *
 * @see useNotificationsContext
 * @see NotificationRecord
 */
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
        `relative ${radius.lg} border ${borderColor[`border/50`]} ${bgColor.card} ${padding.default} ${shadow.sm} ${transition.shadow} ${animateDuration.default} hover:${shadow.md}`
      }
    >
      <button
        type="button"
        onClick={handleDismiss}
        className={
          `absolute top-2 right-2 ${radius.md} ${padding.micro} ${muted.default} ${transition.colors} ${animateDuration.fast} hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent`
        }
        aria-label="Dismiss notification"
      >
        <X className={iconSize.sm} />
      </button>

      <div className={`flex ${gap.default} pr-6`}>
        <div
          className={`flex ${iconSize['2xl']} ${flexGrow.shrink0} ${alignItems.center} ${justify.center} ${radius.full} ${
            notification.type === 'announcement'
              ? `bg-primary/10 ${textColor.primary}`
              : `bg-accent/10 ${textColor.accent}`
          }
          `}
        >
          <Bell className={iconSize.md} />
        </div>

        <div className={`flex-1 ${spaceY.tight}`}>
          <h4 className={`${weight.medium} ${textColor.foreground} ${size.sm}`}>{notification.title}</h4>
          <p className={`${muted.default} ${size.xs} ${leading.relaxed}`}>{notification.message}</p>

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