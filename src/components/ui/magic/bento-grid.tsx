/**
 * Bento Grid Component
 * Asymmetric grid layout system (Apple-style)
 *
 * Performance optimizations:
 * - Server-side component (no client JavaScript)
 * - CSS Grid for optimal layout performance
 * - Responsive breakpoints with container queries
 * - GPU-accelerated hover transitions
 *
 * @module components/ui/magic/bento-grid
 */

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

interface BentoGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface BentoCardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Card title
   */
  title?: string;

  /**
   * Card description
   */
  description?: string;

  /**
   * Icon or image component
   */
  icon?: ReactNode;

  /**
   * Card content
   */
  children?: ReactNode;

  /**
   * Span across grid columns
   * @default 1
   */
  colSpan?: 1 | 2 | 3;

  /**
   * Span across grid rows
   * @default 1
   */
  rowSpan?: 1 | 2;

  /**
   * Background gradient class
   */
  background?: string;
}

export function BentoGrid({ className, children, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid auto-rows-[minmax(200px,auto)] gap-4',
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        'w-full',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  className,
  title,
  description,
  icon,
  children,
  colSpan = 1,
  rowSpan = 1,
  background,
  ...props
}: BentoCardProps) {
  const colSpanClasses = {
    1: 'col-span-1',
    2: 'md:col-span-2',
    3: 'lg:col-span-3',
  };

  const rowSpanClasses = {
    1: 'row-span-1',
    2: 'md:row-span-2',
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl',
        'border border-border/50',
        'bg-card',
        'p-6',
        'transition-all duration-300',
        'hover:border-accent/50 hover:shadow-lg',
        'will-change-transform',
        colSpanClasses[colSpan],
        rowSpanClasses[rowSpan],
        background,
        className
      )}
      {...props}
    >
      {/* Background gradient overlay */}
      {background && (
        <div
          className={cn(
            'absolute inset-0 -z-10 opacity-50',
            'transition-opacity duration-300',
            'group-hover:opacity-70'
          )}
        />
      )}

      {/* Icon */}
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
          {icon}
        </div>
      )}

      {/* Title & Description */}
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      {/* Content */}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

BentoGrid.displayName = 'BentoGrid';
BentoCard.displayName = 'BentoCard';
