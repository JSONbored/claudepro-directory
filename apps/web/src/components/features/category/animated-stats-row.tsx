'use client';

/**
 * Animated Stats Row Component
 *
 * Displays category statistics with animated number counting
 * triggered when the component enters the viewport.
 *
 * Features:
 * - Spring-based number animations
 * - Scroll-triggered via useInView
 * - Staggered entrance animations
 * - Category-themed colors
 * - Real data from content items
 *
 * @module features/category/animated-stats-row
 */

import type { Database } from '@heyclaude/database-types';
import { colors, animation, muted, padding, radius, weight, size } from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';
import {
  motion,
  useMotionValue,
  useSpring,
  useInView,
  useTransform,
} from 'motion/react';
import { useRef, useEffect, type ReactNode } from 'react';

type ContentCategory = Database['public']['Enums']['content_category'];

/**
 * Safely get category color with fallback to default
 */
function getCategoryColor(category: ContentCategory | undefined): string {
  if (!category) return colors.category.default.base;
  
  // Type-safe lookup with fallback
  const categoryColors = colors.category as Record<string, { base: string } | undefined>;
  return categoryColors[category]?.base ?? colors.category.default.base;
}

export interface StatItem {
  label: string;
  value: number;
  icon: ReactNode;
  /** Format function for display (e.g., "1.2K" instead of 1200) */
  format?: (value: number) => string;
}

interface AnimatedStatsRowProps {
  stats: StatItem[];
  category?: ContentCategory;
  className?: string;
}

/**
 * Format large numbers to K/M format
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return value.toLocaleString();
}

/**
 * Animated number component with spring physics
 */
function AnimatedNumber({
  value,
  format = formatCompactNumber,
  className,
  isInView,
  delay = 0,
}: {
  value: number;
  format?: (value: number) => string;
  className?: string;
  isInView: boolean;
  delay?: number;
}) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  const displayValue = useTransform(springValue, (latest) => format(Math.round(latest)));
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => {
        motionValue.set(value);
      }, delay);
      return () => clearTimeout(timeout);
    }
    motionValue.set(0);
    return undefined;
  }, [isInView, value, motionValue, delay]);

  // Subscribe to displayValue changes
  useEffect(() => {
    const unsubscribe = displayValue.on('change', (latest) => {
      if (displayRef.current) {
        displayRef.current.textContent = latest;
      }
    });
    return unsubscribe;
  }, [displayValue]);

  return (
    <span ref={displayRef} className={className}>
      {format(0)}
    </span>
  );
}

/**
 * Individual stat card with entrance animation
 */
function StatCard({
  stat,
  index,
  isInView,
  categoryColor,
}: {
  stat: StatItem;
  index: number;
  isInView: boolean;
  categoryColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
      transition={{
        duration: 0.5,
        delay: index * animation.stagger.default,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(
        'group relative flex flex-col items-center ${gap.compact} rounded-xl border border-border/30',
        'bg-gradient-to-br from-background to-muted/10 ${padding.xComfortable} ${padding.yDefault}',
        'transition-all duration-300 hover:border-accent/40 hover:shadow-lg'
      )}
    >
      {/* Glow effect on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${categoryColor}20, transparent 70%)`,
        }}
      />

      {/* Icon */}
      <div
        className={`relative z-10 ${radius.lg} ${padding.tight} transition-colors duration-200`}
        style={{
          backgroundColor: `${categoryColor}15`,
          color: categoryColor,
        }}
      >
        {stat.icon}
      </div>

      {/* Value */}
      <AnimatedNumber
        value={stat.value}
        format={stat.format ?? formatCompactNumber}
        isInView={isInView}
        delay={index * 100 + 200}
        className={`relative z-10 ${weight.bold} ${size['2xl']} tabular-nums tracking-tight`}
      />

      {/* Label */}
      <span className={cn('relative z-10', muted.sm)}>{stat.label}</span>
    </motion.div>
  );
}

/**
 * Main animated stats row component
 */
export function AnimatedStatsRow({ stats, category, className }: AnimatedStatsRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  // Get category color or default
  const categoryColor = getCategoryColor(category);

  if (stats.length === 0) {
    return null;
  }

  return (
    <motion.div
      ref={containerRef}
      className={cn('grid ${gap.comfortable}', className)}
      style={{
        gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))`,
      }}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
    >
      {stats.map((stat, index) => (
        <StatCard
          key={stat.label}
          stat={stat}
          index={index}
          isInView={isInView}
          categoryColor={categoryColor}
        />
      ))}
    </motion.div>
  );
}

// aggregateContentStats has been moved to @heyclaude/web-runtime/utils/content-stats
// Re-export for backward compatibility
export { aggregateContentStats } from '@heyclaude/web-runtime/utils/content-stats';
