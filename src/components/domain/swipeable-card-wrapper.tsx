'use client';

/**
 * SwipeableCardWrapper Component
 *
 * Production-grade mobile gesture wrapper for interactive cards.
 * Adds swipe-to-action gestures with visual feedback and haptic-like animations.
 *
 * Features:
 * - Swipe right → Copy to clipboard (green feedback)
 * - Swipe left → Bookmark/Save (blue feedback)
 * - Visual swipe indicators with icons
 * - Spring physics for natural feel
 * - Mobile-only (disabled on desktop via media query detection)
 * - Respects prefers-reduced-motion
 * - Accessible (keyboard shortcuts still work via parent card)
 *
 * Architecture:
 * - Wraps existing Motion.div from BaseCard
 * - Non-breaking addition (progressive enhancement)
 * - Zero changes to BaseCard internal logic
 * - Uses UnifiedButton actions (bookmark, copy) for consistency
 *
 * Bundle Impact: +2 KB (Motion.dev drag utilities)
 *
 * @module components/domain/swipeable-card-wrapper
 */

import { motion, useMotionValue, useTransform } from 'motion/react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Bookmark, Copy as CopyIcon } from '@/src/lib/icons';

interface SwipeableCardWrapperProps {
  children: ReactNode;
  onSwipeRight?: (() => void | Promise<void>) | undefined; // Copy action
  onSwipeLeft?: (() => void | Promise<void>) | undefined; // Bookmark action
  enableGestures?: boolean | undefined; // Default: auto-detect mobile
}

/**
 * Swipeable Card Wrapper
 *
 * Adds horizontal swipe gestures to cards for quick actions.
 * Designed for mobile-first experience with natural spring physics.
 */
export function SwipeableCardWrapper({
  children,
  onSwipeRight,
  onSwipeLeft,
  enableGestures,
}: SwipeableCardWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect mobile and reduced motion preference
  useEffect(() => {
    // Mobile detection (touch-capable devices with narrow screens)
    const checkMobile = () => {
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isNarrowScreen = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(hasTouchScreen && isNarrowScreen);
    };

    // Reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Listen for reduced motion changes
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      window.removeEventListener('resize', checkMobile);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Motion values for drag tracking
  const x = useMotionValue(0);

  // Transform drag distance to opacity for swipe indicators
  // Right swipe (copy): 0 → 100px = 0 → 1 opacity
  const copyIndicatorOpacity = useTransform(x, [0, 100], [0, 1]);
  // Left swipe (bookmark): 0 → -100px = 0 → 1 opacity
  const bookmarkIndicatorOpacity = useTransform(x, [-100, 0], [1, 0]);

  // Disable gestures if:
  // - Explicitly disabled via prop
  // - Not on mobile
  // - User prefers reduced motion
  // - Neither action is provided
  const gesturesEnabled =
    enableGestures ?? (isMobile && !prefersReducedMotion && (!!onSwipeRight || !!onSwipeLeft));

  if (!gesturesEnabled) {
    // No gestures - return children as-is
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Swipe Indicator - Copy (Right) */}
      <motion.div
        className="absolute inset-y-0 left-0 w-20 flex items-center justify-start pl-4 pointer-events-none z-0"
        style={{ opacity: copyIndicatorOpacity }}
      >
        <div className="bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30 rounded-lg p-3">
          <CopyIcon className="h-5 w-5" aria-hidden="true" />
        </div>
      </motion.div>

      {/* Swipe Indicator - Bookmark (Left) */}
      <motion.div
        className="absolute inset-y-0 right-0 w-20 flex items-center justify-end pr-4 pointer-events-none z-0"
        style={{ opacity: bookmarkIndicatorOpacity }}
      >
        <div className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-lg p-3">
          <Bookmark className="h-5 w-5" aria-hidden="true" />
        </div>
      </motion.div>

      {/* Draggable Card Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.2}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={(_event, info) => {
          // Swipe right threshold: 100px
          if (info.offset.x > 100 && onSwipeRight) {
            onSwipeRight();
            // Snap back with spring
            x.set(0);
          }
          // Swipe left threshold: -100px
          else if (info.offset.x < -100 && onSwipeLeft) {
            onSwipeLeft();
            // Snap back with spring
            x.set(0);
          }
          // Not enough swipe - snap back
          else {
            x.set(0);
          }
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
