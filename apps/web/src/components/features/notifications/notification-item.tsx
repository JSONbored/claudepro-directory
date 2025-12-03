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
  hoverBg,
  justify,
  textColor,
  alignItems,
  flexGrow,
  padding,
  paddingRight,
  paddingTop,
  shadow,
  display,
  hoverText,
  focusRing,
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
 * @param notification - Notification record containing `id`, `title`, `message`, `type`, and optional `action_label` and `action_href`.
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
          `absolute top-2 right-2 ${radius.md} ${padding.micro} ${muted.default} ${transition.colors} ${animateDuration.fast} ${hoverBg.accentSolid} ${hoverText.foreground} ${focusRing.accent}`
        }
        aria-label="Dismiss notification"
      >
        <X className={iconSize.sm} />
      </button>

      <div className={`${display.flex} ${gap.default} ${paddingRight.relaxed}`}>
        <div
          className={`${display.flex} ${iconSize['2xl']} ${flexGrow.shrink0} ${alignItems.center} ${justify.center} ${radius.full} ${
            notification.type === 'announcement'
              ? `${bgColor['primary/10']} ${textColor.primary}`
              : `${bgColor['accent/10']} ${textColor.accent}`
          }
          `}
        >
          <Bell className={iconSize.md} />
        </div>

        <div className={`${flexGrow['1']} ${spaceY.tight}`}>
          <h4 className={`${weight.medium} ${textColor.foreground} ${size.sm}`}>{notification.title}</h4>
          <p className={`${muted.default} ${size.xs} ${leading.relaxed}`}>{notification.message}</p>

          {notification.action_label && (
            <div className={paddingTop.compact}>
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