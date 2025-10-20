'use client';

/**
 * Section Progress Indicator
 * 
 * Visual indicator showing scroll progress through a section.
 * Useful for long-form content like guides and articles.
 * 
 * Features:
 * - Smooth progress bar (0-100%)
 * - Configurable position (top/bottom/side)
 * - Motion.dev scaleX animation
 * - GPU-accelerated
 * 
 * @module components/shared/section-progress
 */

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useSectionProgress } from '@/src/hooks/use-scroll-animation';
import { cn } from '@/src/lib/utils';

export interface SectionProgressProps {
  /**
   * Content to wrap
   */
  children: ReactNode;

  /**
   * Position of progress bar
   * @default 'top'
   */
  position?: 'top' | 'bottom' | 'left' | 'right';

  /**
   * Height of progress bar (px)
   * @default 2
   */
  height?: number;

  /**
   * Color of progress bar
   * @default 'bg-accent'
   */
  color?: string;

  /**
   * Additional classes for container
   */
  className?: string;

  /**
   * Show percentage label
   * @default false
   */
  showLabel?: boolean;
}

/**
 * SectionProgress Component
 * 
 * Wraps content with a scroll progress indicator.
 * Bar fills as user scrolls through the section.
 * 
 * @example
 * ```tsx
 * <SectionProgress position="top" height={3} color="bg-primary">
 *   <article>
 *     Long content here...
 *   </article>
 * </SectionProgress>
 * ```
 */
export function SectionProgress({
  children,
  position = 'top',
  height = 2,
  color = 'bg-accent',
  className,
  showLabel = false,
}: SectionProgressProps) {
  const { ref, progress } = useSectionProgress();

  const barClasses = cn(
    'absolute z-50',
    color,
    position === 'top' && 'top-0 left-0 right-0',
    position === 'bottom' && 'bottom-0 left-0 right-0',
    position === 'left' && 'top-0 bottom-0 left-0',
    position === 'right' && 'top-0 bottom-0 right-0'
  );

  const barStyle = {
    height: position === 'top' || position === 'bottom' ? `${height}px` : '100%',
    width: position === 'left' || position === 'right' ? `${height}px` : '100%',
    ...(position === 'top' || position === 'bottom'
      ? { scaleX: progress, transformOrigin: 'left' }
      : { scaleY: progress, transformOrigin: 'top' }),
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Progress bar */}
      <motion.div className={barClasses} style={barStyle} />

      {/* Optional percentage label */}
      {showLabel && (
        <motion.div
          className="fixed top-4 right-4 z-50 rounded-full bg-background/80 px-3 py-1 text-xs font-medium backdrop-blur-sm border border-border"
          style={{
            opacity: progress,
          }}
        >
          <motion.span>
            {progress.get() ? Math.round(progress.get() * 100) : 0}%
          </motion.span>
        </motion.div>
      )}

      {/* Content */}
      {children}
    </div>
  );
}

/**
 * Preset variants for common use cases
 */
export const SectionProgressPresets = {
  /**
   * Top accent bar (default)
   */
  TopBar: ({ children }: { children: ReactNode }) => (
    <SectionProgress position="top" height={2} color="bg-accent">
      {children}
    </SectionProgress>
  ),

  /**
   * Bottom bar (less intrusive)
   */
  BottomBar: ({ children }: { children: ReactNode }) => (
    <SectionProgress position="bottom" height={2} color="bg-accent">
      {children}
    </SectionProgress>
  ),

  /**
   * Side indicator (modern)
   */
  SideBar: ({ children }: { children: ReactNode }) => (
    <SectionProgress position="left" height={4} color="bg-gradient-to-b from-accent to-primary">
      {children}
    </SectionProgress>
  ),

  /**
   * With percentage label
   */
  WithLabel: ({ children }: { children: ReactNode }) => (
    <SectionProgress position="top" height={3} color="bg-accent" showLabel>
      {children}
    </SectionProgress>
  ),

  /**
   * Thick accent bar
   */
  Bold: ({ children }: { children: ReactNode }) => (
    <SectionProgress position="top" height={4} color="bg-accent">
      {children}
    </SectionProgress>
  ),
} as const;
