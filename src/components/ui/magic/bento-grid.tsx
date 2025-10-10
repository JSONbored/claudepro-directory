'use client';

/**
 * Bento Grid Component
 *
 * Modern grid layout inspired by bento boxes with varying card sizes.
 * Uses CSS Grid with explicit placement for visually striking layouts.
 *
 * @module components/ui/magic/bento-grid
 */

import type { ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

interface BentoGridProps {
  /**
   * Grid items
   */
  children: ReactNode;

  /**
   * Number of columns (desktop)
   * @default 3
   */
  columns?: number;

  /**
   * Gap between items (in Tailwind scale)
   * @default 6
   */
  gap?: number;

  /**
   * Additional CSS classes
   */
  className?: string;
}

interface BentoCardProps {
  /**
   * Card content
   */
  children: ReactNode;

  /**
   * Column span (1-6)
   * @default 1
   */
  colSpan?: number;

  /**
   * Row span (1-4)
   * @default 1
   */
  rowSpan?: number;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Background gradient direction
   */
  gradient?: 'none' | 'to-br' | 'to-tr' | 'to-bl' | 'to-tl';
}

/**
 * BentoGrid Container
 *
 * Creates a responsive grid layout for bento cards.
 * Automatically adjusts columns based on screen size.
 *
 * @example
 * ```tsx
 * <BentoGrid columns={3} gap={6}>
 *   <BentoCard colSpan={2}>Large card</BentoCard>
 *   <BentoCard>Small card</BentoCard>
 * </BentoGrid>
 * ```
 */
export function BentoGrid({ children, columns = 3, gap = 6, className }: BentoGridProps) {
  const gapClass =
    {
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      6: 'gap-6',
      8: 'gap-8',
    }[gap] || 'gap-6';

  const columnsClass =
    {
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4',
      5: 'lg:grid-cols-5',
      6: 'lg:grid-cols-6',
    }[columns] || 'lg:grid-cols-3';

  return (
    <div
      className={cn(
        'grid auto-rows-[minmax(200px,auto)] grid-cols-1 md:grid-cols-2',
        columnsClass,
        gapClass,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * BentoCard Component
 *
 * Individual card within the bento grid.
 * Supports custom column/row spanning and gradient backgrounds.
 *
 * @example
 * ```tsx
 * <BentoCard colSpan={2} rowSpan={2} gradient="to-br">
 *   <h3>Featured Content</h3>
 *   <p>Description</p>
 * </BentoCard>
 * ```
 */
export function BentoCard({
  children,
  colSpan = 1,
  rowSpan = 1,
  className,
  gradient = 'none',
}: BentoCardProps) {
  const colSpanClass =
    {
      1: 'lg:col-span-1',
      2: 'lg:col-span-2',
      3: 'lg:col-span-3',
      4: 'lg:col-span-4',
      5: 'lg:col-span-5',
      6: 'lg:col-span-6',
    }[colSpan] || 'lg:col-span-1';

  const rowSpanClass =
    {
      1: 'lg:row-span-1',
      2: 'lg:row-span-2',
      3: 'lg:row-span-3',
      4: 'lg:row-span-4',
    }[rowSpan] || 'lg:row-span-1';

  const gradientClass = {
    none: '',
    'to-br': 'bg-gradient-to-br from-background via-accent/5 to-accent/10',
    'to-tr': 'bg-gradient-to-tr from-background via-accent/5 to-accent/10',
    'to-bl': 'bg-gradient-to-bl from-background via-accent/5 to-accent/10',
    'to-tl': 'bg-gradient-to-tl from-background via-accent/5 to-accent/10',
  }[gradient];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-border/50 bg-card p-6',
        'transition-all duration-300',
        'hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5',
        colSpanClass,
        rowSpanClass,
        gradientClass,
        className
      )}
    >
      {children}
    </div>
  );
}
