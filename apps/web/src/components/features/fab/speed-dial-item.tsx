/**
 * Speed Dial Item Component
 *
 * Individual action button in the FAB speed dial menu.
 * Appears with staggered animation when FAB expands.
 *
 * Features:
 * - Motion.dev spring animations
 * - Badge support (notification count)
 * - Responsive visibility (mobileOnly/desktopOnly)
 * - Accessibility (aria-label, focus states)
 * - Error handling for onClick actions
 *
 * @module components/features/fab/speed-dial-item
 */

'use client';

import { logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { type SpeedDialAction } from '@heyclaude/web-runtime/types/component.types';
import { motion } from 'motion/react';

import { NotificationBadge } from '@/src/components/features/notifications/notification-badge';

interface SpeedDialItemProps extends SpeedDialAction {
  /** Animation delay for stagger effect (seconds) */
  delay?: number;
}

export function SpeedDialItem({
  icon: Icon,
  label,
  onClick,
  badge,
  mobileOnly,
  desktopOnly,
  delay = 0,
}: SpeedDialItemProps) {
  // Responsive visibility classes
  const visibilityClasses = [mobileOnly && 'md:hidden', desktopOnly && 'hidden md:flex']
    .filter(Boolean)
    .join(' ');

  // Handle click with error boundary
  const handleClick = () => {
    try {
      onClick();
    } catch (error) {
      const normalized = normalizeError(error, '[SpeedDialItem] Error in onClick handler');
      logClientError(
        '[SpeedDialItem] Error in onClick handler',
        normalized,
        'SpeedDialItem.handleClick',
        {
          component: 'SpeedDialItem',
          action: 'onClick',
        }
      );
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17,
        delay,
      }}
      className={`border-border/50 bg-card/95 text-foreground hover:border-accent/50 hover:bg-accent hover:text-accent-foreground focus:ring-accent focus:ring-offset-background relative flex h-12 w-12 items-center justify-center rounded-full border shadow-lg shadow-black/10 backdrop-blur-md will-change-transform focus:ring-2 focus:ring-offset-2 focus:outline-none dark:shadow-black/30 ${visibilityClasses}`}
      aria-label={label}
      type="button"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />

      {/* Badge indicator (notification count) - only show for notifications action */}
      {badge !== undefined && badge > 0 && label === 'Notifications' && (
        <NotificationBadge className="absolute -top-1 -right-1" />
      )}
    </motion.button>
  );
}
