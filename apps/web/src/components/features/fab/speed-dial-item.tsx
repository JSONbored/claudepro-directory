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

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { iconSize , shadow , shadowColor, backdrop , radius, borderColor, hoverBg,
  justify,
  textColor,
  alignItems,
  display,
  position,
  bgColor,
  border,
  hoverBorder,
  willChange,
  focusRing,
  ring,
} from '@heyclaude/web-runtime/design-system';
import type { SpeedDialAction } from '@heyclaude/web-runtime/types/component.types';
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
      logger.error('[SpeedDialItem] Error in onClick handler', normalized);
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
      className={`${position.relative} ${display.flex} ${iconSize['3xl']} ${alignItems.center} ${justify.center} ${radius.full} ${border.default} ${borderColor['border/50']} ${bgColor['card/95']} ${textColor.foreground} ${shadowColor.black} ${shadow.lg} ${backdrop.md} ${willChange.transform} ${hoverBorder.accent} ${hoverBg.accentSolid} hover:${textColor.accentForeground} ${focusRing.accentWithOffset} focus:${ring.accent20} dark:${shadowColor.blackStrong} ${visibilityClasses}`}
      aria-label={label}
      type="button"
    >
      <Icon className={iconSize.md} aria-hidden="true" />

      {/* Badge indicator (notification count) - only show for notifications action */}
      {badge !== undefined && badge > 0 && label === 'Notifications' && (
        <NotificationBadge className={`-right-1 -top-1 ${position.absolute}`} />
      )}
    </motion.button>
  );
}
