'use client';

/**
 * SwipeableCardWrapper Component
 *
 * Production-grade mobile gesture wrapper for interactive cards.
 * Adds swipe-to-action gestures with visual feedback and haptic-like animations.
 *
 * Architecture:
 * - Client-side only (uses motion/react, localStorage detection)
 * - Uses web-runtime config system for animation settings
 * - Structured logging for errors
 * - Generic action callbacks (not tied to specific actions)
 *
 * Features:
 * - Swipe right → Custom action (green feedback)
 * - Swipe left → Custom action (blue feedback)
 * - Visual swipe indicators with icons
 * - Spring physics for natural feel
 * - Mobile-only (disabled on desktop via media query detection)
 * - Respects prefers-reduced-motion
 * - Accessible (keyboard shortcuts still work via parent card)
 *
 * Usage:
 * ```tsx
 * import { SwipeableCardWrapper } from '@heyclaude/web-runtime/ui';
 *
 * <SwipeableCardWrapper
 *   onSwipeRight={() => handleCopy()}
 *   onSwipeLeft={() => handleBookmark()}
 * >
 *   <Card>...</Card>
 * </SwipeableCardWrapper>
 * ```
 *
 * Bundle Impact: +2 KB (Motion.dev drag utilities)
 */

import { SPRING } from '../../../design-system/index.ts';
import { useDragControls } from '../../../hooks/motion/index.ts';
import { logger } from '../../../logger.ts';
import { normalizeError } from '../../../errors.ts';
import { Bookmark, Copy as CopyIcon } from '../../../icons.tsx';
import { POSITION_PATTERNS } from '../../constants.ts';
import { iconSize } from '../../../design-system/index.ts';
// COLORS removed - using direct Tailwind utilities
import { motion } from 'motion/react';
import { useMotionValue, useTransform } from '../../../hooks/motion/index.ts';
import { useReducedMotion } from '../../../hooks/motion/index.ts';
import type { ReactNode } from 'react';
import { useMediaQuery } from '../../../hooks/use-media-query.ts';

export interface SwipeableCardWrapperProps {
  /** Child components to wrap with swipe gestures */
  children: ReactNode;
  /** Callback for swipe right gesture (e.g., copy action) */
  onSwipeRight?: (() => void | Promise<void>) | undefined;
  /** Callback for swipe left gesture (e.g., bookmark action) */
  onSwipeLeft?: (() => void | Promise<void>) | undefined;
  /** Explicitly enable/disable gestures (default: auto-detect mobile) */
  enableGestures?: boolean | undefined;
}

/**
 * Swipeable Card Wrapper
 *
 * Adds horizontal swipe gestures to cards for quick actions.
 * Designed for mobile-first experience with natural spring physics.
 *
 * @param props - Component props
 * @returns Wrapped children with swipe gesture support
 */
export function SwipeableCardWrapper({
  children,
  onSwipeRight,
  onSwipeLeft,
  enableGestures,
}: SwipeableCardWrapperProps) {
  // Use useMediaQuery for responsive detection (replaces window.innerWidth checks)
  const isNarrowScreen = useMediaQuery('(max-width: 1023px)'); // lg breakpoint (1024px)
  
  // Detect touch capability
  const hasTouchScreen = useMediaQuery('(pointer:coarse)');
  
  // Mobile detection: touch-capable devices with narrow screens
  const isMobile = hasTouchScreen && isNarrowScreen;
  
  // Use Motion.dev's useReducedMotion hook (replaces window.matchMedia for prefers-reduced-motion)
  const prefersReducedMotion = useReducedMotion();
  
  const dragControls = useDragControls();
  // Spring animation config from design system
  const springSmooth = SPRING.smooth;


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
        className={`pointer-events-none ${POSITION_PATTERNS.ABSOLUTE_INSET_Y_LEFT} z-0 flex w-20 items-center justify-start pl-4`}
        style={{ opacity: copyIndicatorOpacity }}
      >
        <div className="rounded-lg p-3 text-color-swipe-copy-text-dark border-color-swipe-copy-border bg-color-swipe-copy-bg">
          <CopyIcon className={iconSize.md} aria-hidden="true" />
        </div>
      </motion.div>

      {/* Swipe Indicator - Bookmark (Left) */}
      <motion.div
        className={`pointer-events-none ${POSITION_PATTERNS.ABSOLUTE_INSET_Y_RIGHT} z-0 flex w-20 items-center justify-end pr-4`}
        style={{ opacity: bookmarkIndicatorOpacity }}
      >
        <div className="rounded-lg p-3 text-color-swipe-bookmark-text-dark border-color-swipe-bookmark-border bg-color-swipe-bookmark-bg">
          <Bookmark className={iconSize.md} aria-hidden="true" />
        </div>
      </motion.div>

      {/* Draggable Card Content */}
      <motion.div
        drag="x"
        dragControls={dragControls}
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.2}
        dragMomentum={true}
        dragDirectionLock={true}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
        style={{ x }}
        onDragEnd={(
          _event: MouseEvent | TouchEvent | PointerEvent,
          info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }
        ) => {
          try {
            const threshold = 100;
            const velocityThreshold = 500; // Minimum velocity for momentum-based swipe
            
            // Check if swipe meets threshold OR has sufficient velocity (momentum-based)
            const hasRightMomentum = info.offset.x > 50 && info.velocity.x > velocityThreshold;
            const hasLeftMomentum = info.offset.x < -50 && info.velocity.x < -velocityThreshold;
            
            // Swipe right threshold: 100px OR momentum-based
            if ((info.offset.x > threshold || hasRightMomentum) && onSwipeRight) {
              onSwipeRight();
              // Animate back with momentum
              x.set(0);
            }
            // Swipe left threshold: -100px OR momentum-based
            else if ((info.offset.x < -threshold || hasLeftMomentum) && onSwipeLeft) {
              onSwipeLeft();
              // Animate back with momentum
              x.set(0);
            }
            // Not enough swipe - animate back smoothly
            else {
              // Animate back to original position
              x.set(0);
            }
          } catch (error) {
            const normalized = normalizeError(error, 'SwipeableCardWrapper: Swipe action failed');
            logger.error({ err: normalized, component: 'SwipeableCardWrapper',
              offsetX: info.offset.x, }, 'SwipeableCardWrapper: Swipe action failed');
            // Always snap back on error
            x.set(0);
          }
        }}
        transition={springSmooth}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
