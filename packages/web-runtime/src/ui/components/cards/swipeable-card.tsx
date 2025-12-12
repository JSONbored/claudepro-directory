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
import { logger } from '../../../logger.ts';
import { normalizeError } from '../../../errors.ts';
import { Bookmark, Copy as CopyIcon } from '../../../icons.tsx';
import { POSITION_PATTERNS, UI_CLASSES } from '../../constants.ts';
import { COLORS } from '../../../design-tokens/index.ts';
import { motion, useMotionValue, useTransform } from 'motion/react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

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
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  // Spring animation config from design system
  const springSmooth = SPRING.smooth;

  // Detect mobile and reduced motion preference
  useEffect(() => {
    // Mobile detection (touch-capable devices with narrow screens)
    const checkMobile = () => {
      try {
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isNarrowScreen = window.innerWidth < 1024; // lg breakpoint
        setIsMobile(hasTouchScreen && isNarrowScreen);
      } catch (error) {
        const normalized = normalizeError(error, 'SwipeableCardWrapper: Mobile detection failed');
        logger.warn({ err: normalized,
          component: 'SwipeableCardWrapper', }, 'SwipeableCardWrapper: Mobile detection failed');
        setIsMobile(false);
      }
    };

    // Reduced motion preference
    try {
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
    } catch (error) {
      const normalized = normalizeError(error, 'SwipeableCardWrapper: Media query setup failed');
      logger.warn({ err: normalized,
        component: 'SwipeableCardWrapper', }, 'SwipeableCardWrapper: Media query setup failed');
      return () => {};
    }
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
        className={`pointer-events-none ${POSITION_PATTERNS.ABSOLUTE_INSET_Y_LEFT} z-0 flex w-20 items-center justify-start pl-4`}
        style={{ opacity: copyIndicatorOpacity }}
      >
        <div
          className="rounded-lg p-3"
          style={{
            color: COLORS.semantic.swipe.copy.dark.text,
            borderColor: COLORS.semantic.swipe.copy.dark.border,
            backgroundColor: COLORS.semantic.swipe.copy.dark.background,
          }}
        >
          <CopyIcon className={UI_CLASSES.ICON_MD} aria-hidden="true" />
        </div>
      </motion.div>

      {/* Swipe Indicator - Bookmark (Left) */}
      <motion.div
        className={`pointer-events-none ${POSITION_PATTERNS.ABSOLUTE_INSET_Y_RIGHT} z-0 flex w-20 items-center justify-end pr-4`}
        style={{ opacity: bookmarkIndicatorOpacity }}
      >
        <div
          className="rounded-lg p-3"
          style={{
            color: COLORS.semantic.swipe.bookmark.dark.text,
            borderColor: COLORS.semantic.swipe.bookmark.dark.border,
            backgroundColor: COLORS.semantic.swipe.bookmark.dark.background,
          }}
        >
          <Bookmark className={UI_CLASSES.ICON_MD} aria-hidden="true" />
        </div>
      </motion.div>

      {/* Draggable Card Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.2}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={(
          _event: MouseEvent | TouchEvent | PointerEvent,
          info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }
        ) => {
          try {
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
