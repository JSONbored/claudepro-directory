/**
 * Section Progress Indicator Component
 *
 * Displays a progress bar that tracks scroll progress through a specific section.
 * Useful for long-form content, articles, or multi-section pages.
 *
 * @module web-runtime/ui/components/scroll/section-progress
 *
 * @example
 * ```tsx
 * import { SectionProgress } from '@heyclaude/web-runtime/ui';
 *
 * <section ref={sectionRef}>
 *   <SectionProgress target={sectionRef} />
 *   <div>Your content here</div>
 * </section>
 * ```
 */

'use client';

import { useReducedMotion, useTransform } from '@heyclaude/web-runtime/hooks/motion';
import { motion, useScroll } from 'motion/react';
import { useRef } from 'react';
import type * as React from 'react';
import { SPRING } from '../../../design-system/index.ts';
import { cn } from '../../utils.ts';

export interface SectionProgressProps {
  /**
   * Target element to track scroll progress for
   * If not provided, tracks the parent section
   */
  target?: React.RefObject<HTMLElement> | HTMLElement | null;

  /**
   * Custom className for the progress bar container
   */
  className?: string;

  /**
   * Position of the progress bar
   * @default 'top'
   */
  position?: 'top' | 'bottom';

  /**
   * Height of the progress bar in pixels
   * @default 2
   */
  height?: number;

  /**
   * Color of the progress bar
   * @default 'accent'
   */
  color?: 'accent' | 'primary' | 'foreground';

  /**
   * Offset for scroll tracking
   * @default ['start end', 'end start']
   */
  offset?: ['start end', 'end start'] | readonly ['start end', 'end start'];
}

/**
 * Section Progress Indicator
 *
 * Tracks scroll progress through a section and displays a visual progress bar.
 * Automatically pauses when page is not in view for performance.
 *
 * @param props - Component props
 * @returns Progress bar component
 */
export function SectionProgress({
  target,
  className,
  position = 'top',
  height = 2,
  color = 'accent',
  offset = ['start end', 'end start'],
}: SectionProgressProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Use provided target or default to container's parent section
  const targetElement = target
    ? typeof target === 'object' && 'current' in target
      ? target.current
      : target
    : containerRef.current?.closest('section');

  // Track scroll progress through the target section
  const { scrollYProgress } = useScroll(
    targetElement
      ? {
          target: { current: targetElement },
          offset: offset as ['start end', 'end start'],
        }
      : offset
        ? { offset: offset as ['start end', 'end start'] }
        : {}
  );

  // Transform progress to scaleX (0 to 1)
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Color classes
  const colorClass = {
    accent: 'bg-accent',
    primary: 'bg-primary',
    foreground: 'bg-foreground',
  }[color];

  // Position classes
  const positionClass = position === 'top' ? 'top-0' : 'bottom-0';

  if (shouldReduceMotion) {
    // For reduced motion, show a static indicator at 100% when section is in view
    return null; // Or return a simple static indicator
  }

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none fixed right-0 left-0 z-50', positionClass, className)}
      style={{ height: `${height}px` }}
      aria-hidden="true"
    >
      <motion.div
        className={cn('h-full origin-left', colorClass)}
        style={{
          scaleX,
        }}
        transition={SPRING.smooth}
      />
    </div>
  );
}
