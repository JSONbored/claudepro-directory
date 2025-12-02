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

import { logger } from '../../../logger.ts';
import { normalizeError } from '../../../errors.ts';
import { getAnimationConfig } from '../../../config/static-configs.ts';
import { Bookmark, Copy as CopyIcon } from '../../../icons.tsx';
// Design System imports
import { absolute } from '../../../design-system/styles/position.ts';
import { iconSize } from '../../../design-system/styles/icons.ts';
import { padding } from '../../../design-system/styles/layout.ts';
import { radius } from '../../../design-system/styles/radius.ts';
import { SEMANTIC_COLORS } from '../../colors.ts';
import { motion, useMotionValue, useTransform } from 'motion/react';
import type { PanInfo } from 'motion/react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

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
  const springSmooth = useMemo(() => {
    try {
      const config = getAnimationConfig();
      return {
        type: 'spring' as const,
        stiffness: config['animation.spring.smooth.stiffness'],
        damping: config['animation.spring.smooth.damping'],
      };
    } catch (error) {
      const normalized = normalizeError(error, 'SwipeableCardWrapper: Failed to load animation config');
      logger.warn('SwipeableCardWrapper: Failed to load animation config', {
        err: normalized,
        component: 'SwipeableCardWrapper',
      });
      // Fallback to default values
      return {
        type: 'spring' as const,
        stiffness: 300,
        damping: 25,
      };
    }
  }, []);

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
        logger.warn('SwipeableCardWrapper: Mobile detection failed', {
          err: normalized,
          component: 'SwipeableCardWrapper',
        });
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
      logger.warn('SwipeableCardWrapper: Media query setup failed', {
        err: normalized,
        component: 'SwipeableCardWrapper',
      });
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
        className={`pointer-events-none ${absolute.insetYLeft} z-0 flex w-20 items-center justify-start pl-4`}
        style={{ opacity: copyIndicatorOpacity }}
      >
        <div className={`${radius.lg} ${padding.compact} ${SEMANTIC_COLORS.SWIPE_COPY}`}>
          <CopyIcon className={iconSize.md} aria-hidden="true" />
        </div>
      </motion.div>

      {/* Swipe Indicator - Bookmark (Left) */}
      <motion.div
        className={`pointer-events-none ${absolute.insetYRight} z-0 flex w-20 items-center justify-end pr-4`}
        style={{ opacity: bookmarkIndicatorOpacity }}
      >
        <div className={`${radius.lg} ${padding.compact} ${SEMANTIC_COLORS.SWIPE_BOOKMARK}`}>
          <Bookmark className={iconSize.md} aria-hidden="true" />
        </div>
      </motion.div>

      {/* Draggable Card Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.2}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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
            logger.error('SwipeableCardWrapper: Swipe action failed', normalized, {
              component: 'SwipeableCardWrapper',
              offsetX: info.offset.x,
            });
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
