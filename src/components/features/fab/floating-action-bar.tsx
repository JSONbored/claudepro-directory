/**
 * Floating Action Bar Component
 *
 * Unified FAB system that consolidates:
 * - FloatingMobileSearch (search button)
 * - BackToTopButton (scroll to top)
 * - NotificationFAB (notification bell)
 * - Navigation Create button (moved from nav bar)
 *
 * Features:
 * - Single bottom-right FAB (z-60)
 * - Speed dial menu (expands upward)
 * - Scroll-aware visibility (hide on scroll down, show on scroll up)
 * - Responsive actions (mobile/desktop conditional items)
 * - Performance optimized (rAF throttling, passive listeners)
 * - Statsig feature flag controlled migration path
 *
 * @module components/features/fab/floating-action-bar
 */

'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logger } from '@/src/lib/logger';
import { type NotificationStore, useNotificationStore } from '@/src/lib/stores/notification-store';
import { createMainFABConfig, createSpeedDialActions } from './fab-config';
import { SpeedDialItem } from './speed-dial-item';
import { useScrollDirection } from './use-scroll-direction';

interface FloatingActionBarProps {
  /** Scroll threshold to show/hide FAB (px) */
  threshold?: number;
}

export function FloatingActionBar({ threshold = 100 }: FloatingActionBarProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  // Scroll state for visibility control
  const scrollState = useScrollDirection({ threshold });

  // Notification state
  const unreadCount = useNotificationStore((state: NotificationStore) => state.unreadCount);
  const openNotificationSheet = useNotificationStore((state: NotificationStore) => state.openSheet);

  // Main FAB config (Create button)
  const mainFAB = createMainFABConfig(() => {
    try {
      setIsExpanded(false); // Close speed dial on navigate
      router.push('/submit');
    } catch (error) {
      logger.error('[FloatingActionBar] Error navigating to /submit', error as Error);
    }
  });

  // Speed dial actions config
  const speedDialActions = createSpeedDialActions(unreadCount, () => {
    try {
      setIsExpanded(false); // Close speed dial when opening notifications
      openNotificationSheet();
    } catch (error) {
      logger.error('[FloatingActionBar] Error opening notification sheet', error as Error);
    }
  });

  // Filter speed dial actions based on `show` property
  const visibleActions = speedDialActions.filter((action) => action.show !== false);

  // Toggle speed dial expansion
  const toggleExpanded = () => {
    try {
      setIsExpanded((prev) => !prev);
    } catch (error) {
      logger.error('[FloatingActionBar] Error toggling expansion', error as Error);
    }
  };

  // Main FAB icon component
  const MainIcon = mainFAB.icon;

  return (
    <div className="fixed right-6 bottom-6 z-60">
      {/* Speed Dial Items (expand upward) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mb-3 flex flex-col gap-3"
          >
            {visibleActions.map((action, index) => (
              <SpeedDialItem
                key={action.id}
                {...action}
                delay={index * 0.05} // Stagger animation
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <AnimatePresence mode="wait">
        {scrollState.isVisible && (
          <motion.button
            onClick={toggleExpanded}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 17,
            }}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-black/20 shadow-lg backdrop-blur-md will-change-transform hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background dark:shadow-black/40"
            aria-label={isExpanded ? 'Close speed dial menu' : mainFAB.label}
            aria-expanded={isExpanded}
            type="button"
          >
            {/* Main FAB Icon with rotation animation when expanded */}
            <motion.div
              animate={{ rotate: isExpanded ? 45 : 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
            >
              <MainIcon className="h-6 w-6" aria-hidden="true" />
            </motion.div>

            {/* Badge for main FAB (if needed in future) */}
            {mainFAB.badge !== undefined && mainFAB.badge > 0 && (
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
                {mainFAB.badge > 99 ? '99+' : mainFAB.badge}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
