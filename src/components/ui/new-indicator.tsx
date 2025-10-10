'use client';

import type * as React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip';
import { cn } from '@/src/lib/utils';

/**
 * NewIndicator Component
 *
 * A subtle animated dot indicator with optional tooltip to highlight new navigation items.
 * Follows WCAG 2.1 AA accessibility standards with screen reader support.
 *
 * @example
 * ```tsx
 * <NewIndicator label="New category" />
 * <NewIndicator label="New feature" className="ml-2" />
 * ```
 *
 * Design Pattern: Hybrid Dot + Tooltip
 * - Desktop: Animated dot with hover tooltip
 * - Mobile: Same dot (tooltips work on long-press on mobile)
 * - Accessible: Screen reader announces via sr-only text
 * - Performance: CSS animations with reduced-motion support
 *
 * @see Research Report: "Methods to Highlight New Navigation Items"
 */
export interface NewIndicatorProps {
  /**
   * Accessible label for screen readers and tooltip content
   * @default "New feature"
   */
  label?: string;

  /**
   * Additional CSS classes for positioning/styling
   */
  className?: string;

  /**
   * Tooltip placement side
   * @default "bottom"
   */
  side?: 'top' | 'right' | 'bottom' | 'left';

  /**
   * Delay before tooltip appears (ms)
   * @default 300
   */
  delayDuration?: number;
}

/**
 * NewIndicator Component Implementation
 *
 * Features:
 * - Animated pulsing dot (accent color)
 * - Tooltip on hover/focus
 * - Screen reader accessible
 * - Reduced motion support
 * - Zero dependencies beyond existing UI components
 */
export function NewIndicator({
  label = 'New feature',
  className,
  side = 'bottom',
  delayDuration = 300,
}: NewIndicatorProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <output className={cn('relative flex h-2 w-2', className)} aria-label={label}>
            {/* Screen reader text - hidden visually but accessible */}
            <span className="sr-only">{label}</span>

            {/* Animated ping effect - outer ring */}
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75 motion-reduce:animate-none"
              aria-hidden="true"
            />

            {/* Static dot - inner circle */}
            <span
              className="relative inline-flex h-2 w-2 rounded-full bg-accent"
              aria-hidden="true"
            />
          </output>
        </TooltipTrigger>
        <TooltipContent side={side} className="text-xs font-medium">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * NewBadge Component (Alternative)
 *
 * Text-based "NEW" badge for mobile or when explicit text is preferred.
 * More visible than dot indicator, better for mobile interfaces.
 *
 * @example
 * ```tsx
 * <NewBadge />
 * <NewBadge variant="outline" />
 * ```
 */
export interface NewBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Badge style variant
   * @default "default"
   */
  variant?: 'default' | 'outline';

  /**
   * Badge text content
   * @default "NEW"
   */
  children?: React.ReactNode;
}

export function NewBadge({
  variant = 'default',
  children = 'NEW',
  className,
  ...props
}: NewBadgeProps) {
  const variantStyles = {
    default: 'bg-green-500/10 text-green-400 border-green-500/20',
    outline: 'bg-accent/10 text-accent border-accent/20',
  };

  return (
    <output
      className={cn(
        // Base styles
        'inline-flex items-center justify-center',
        'px-1.5 py-0.5',
        'text-[10px] font-semibold uppercase tracking-wider',
        'rounded border',
        'transition-colors duration-200',
        // Variant styles
        variantStyles[variant],
        // Custom classes
        className
      )}
      aria-label="New"
      {...props}
    >
      {children}
    </output>
  );
}
