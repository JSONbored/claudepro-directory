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

import { motion } from 'motion/react';
import { logger } from '@/src/lib/logger';
import type { SpeedDialAction } from './fab.types';

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
      logger.error('[SpeedDialItem] Error in onClick handler', error as Error);
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
      className={`relative flex h-12 w-12 items-center justify-center rounded-full border border-border/50 bg-card/95 text-foreground shadow-black/10 shadow-lg backdrop-blur-md will-change-transform hover:border-accent/50 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background dark:shadow-black/30 ${visibilityClasses}`}
      aria-label={label}
      type="button"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />

      {/* Badge indicator (notification count) */}
      {badge !== undefined && badge > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 20,
          }}
          className="-right-1 -top-1 absolute flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 font-bold text-[10px] text-white shadow-md"
        >
          {badge > 99 ? '99+' : badge}
        </motion.span>
      )}
    </motion.button>
  );
}
