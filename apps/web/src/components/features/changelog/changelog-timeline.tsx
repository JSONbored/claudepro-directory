'use client';

/**
 * Changelog Timeline Component
 *
 * Beautiful animated timeline for changelog entries with:
 * - Vertical timeline line with animated dots
 * - Category-colored dots (Added=green, Fixed=yellow, etc.)
 * - Scroll-triggered entry animations
 * - Staggered reveal effects
 *
 * @module features/changelog/changelog-timeline
 */

import type { Database } from '@heyclaude/database-types';
import {
  animateDuration,
  cluster,
  flexDir,
  flexWrap,
  gap,
  iconSize,
  marginBottom,
  muted,
  padding,
  shadow,
  shadowColor,
  size,
  spaceY,
  transition,
  weight,
  bgColor,
  justify,
  alignItems,
  radius,
} from '@heyclaude/web-runtime/design-system';
import { Calendar, ChevronRight } from '@heyclaude/web-runtime/icons';
import { cn } from '@heyclaude/web-runtime/ui';
import { motion, useInView } from 'motion/react';
import Link from 'next/link';
import { useRef } from 'react';

type ChangelogCategory = Database['public']['Enums']['changelog_category'];

// ============================================================================
// Category Colors
// ============================================================================

const CATEGORY_COLORS: Record<ChangelogCategory, { dot: string; glow: string; border: string; cssColor: string }> = {
  Added: {
    dot: 'bg-emerald-500',
    glow: shadowColor.emerald,
    border: 'border-emerald-500/30',
    cssColor: 'rgb(16 185 129)', // emerald-500
  },
  Changed: {
    dot: 'bg-blue-500',
    glow: shadowColor.blue,
    border: 'border-blue-500/30',
    cssColor: 'rgb(59 130 246)', // blue-500
  },
  Fixed: {
    dot: 'bg-amber-500',
    glow: shadowColor.amber,
    border: 'border-amber-500/30',
    cssColor: 'rgb(245 158 11)', // amber-500
  },
  Removed: {
    dot: 'bg-red-500',
    glow: shadowColor.red,
    border: 'border-red-500/30',
    cssColor: 'rgb(239 68 68)', // red-500
  },
  Deprecated: {
    dot: 'bg-orange-500',
    glow: shadowColor.orange,
    border: 'border-orange-500/30',
    cssColor: 'rgb(249 115 22)', // orange-500
  },
  Security: {
    dot: 'bg-purple-500',
    glow: shadowColor.purple,
    border: 'border-purple-500/30',
    cssColor: 'rgb(168 85 247)', // purple-500
  },
};

// ============================================================================
// Timeline Dot Component
// ============================================================================

interface TimelineDotProps {
  category: ChangelogCategory;
  isInView: boolean;
  index: number;
}

function TimelineDot({ category, isInView, index }: TimelineDotProps) {
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Added;

  return (
    <motion.div
      className={`relative flex ${alignItems.center} ${justify.center}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 20,
        delay: index * 0.1,
      }}
    >
      {/* Outer glow ring */}
      <motion.div
        className={cn(
          `absolute ${iconSize.lg} ${radius.full}`,
          colors.dot,
          'opacity-20 blur-sm'
        )}
        animate={
          isInView
            ? {
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.1, 0.2],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.2,
        }}
      />

      {/* Main dot */}
      <motion.div
        className={cn(
          `relative ${iconSize.xs} ${radius.full}`,
          colors.dot,
          shadow.lg,
          colors.glow
        )}
        animate={
          isInView
            ? {
                boxShadow: [
                  `0 0 0 0 ${colors.cssColor}`,
                  `0 0 0 8px transparent`,
                ],
              }
            : {}
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut',
          delay: index * 0.1,
        }}
      />
    </motion.div>
  );
}

// ============================================================================
// Timeline Entry Component
// ============================================================================

interface TimelineEntryProps {
  entry: {
    slug: string;
    title: string;
    tldr?: string | null;
    release_date: string;
    changes?: Record<string, unknown> | null;
  };
  index: number;
  targetPath: string;
}

export function TimelineEntry({ entry, index, targetPath }: TimelineEntryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  // Get primary category from changes
  const primaryCategory = getPrimaryCategory(entry.changes);
  const colors = CATEGORY_COLORS[primaryCategory] ?? CATEGORY_COLORS.Added;

  return (
    <motion.div
      ref={ref}
      className={`relative grid grid-cols-[auto_1fr] ${gap.relaxed}`}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Timeline column */}
      <div className={`relative flex ${flexDir.col} ${alignItems.center}`}>
        {/* Connecting line (above) */}
        {index > 0 && (
          <motion.div
            className="absolute bottom-1/2 top-0 w-0.5 bg-gradient-to-b from-border/50 to-border"
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            style={{ originY: 0 }}
          />
        )}

        {/* Dot */}
        <TimelineDot category={primaryCategory} isInView={isInView} index={index} />

        {/* Connecting line (below) */}
        <motion.div
          className="absolute top-1/2 bottom-0 w-0.5 bg-gradient-to-b from-border to-border/50"
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
          style={{ originY: 0 }}
        />
      </div>

      {/* Content */}
      <motion.div
        className="pb-12"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.4, delay: index * 0.1 + 0.1 }}
      >
        {/* Date */}
        <div className={cn(cluster.tight, muted.sm, marginBottom.tight)}>
          <Calendar className={iconSize.sm} />
          <time dateTime={entry.release_date}>
            {new Date(entry.release_date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>

        {/* Card */}
        <Link href={targetPath} className="group block">
          <motion.div
            className={cn(
              `${radius.xl} border ${bgColor.card} ${padding.medium} ${transition.all} ${animateDuration.default}`,
              `hover:${shadow.lg} hover:border-primary/30`,
              colors.border
            )}
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
          >
            {/* Title */}
            <h3 className={`${marginBottom.tight} ${weight.semibold} ${size.lg} group-hover:text-primary ${transition.colors}`}>
              {entry.title}
            </h3>

            {/* TL;DR */}
            {entry.tldr && (
              <p className={cn(muted.sm, marginBottom.compact, 'line-clamp-2')}>
                {entry.tldr}
              </p>
            )}

            {/* Categories */}
            <div className={`flex ${flexWrap.wrap} ${gap.compact} ${marginBottom.compact}`}>
              {Object.keys(entry.changes ?? {}).map((cat) => {
                const catColors = CATEGORY_COLORS[cat as ChangelogCategory];
                if (!catColors) return null;
                return (
                  <span
                    key={cat}
                    className={cn(
                      `${radius.full} px-2.5 ${padding.yHair} ${size.xs} ${weight.medium}`,
                      catColors.dot,
                      'text-white'
                    )}
                  >
                    {cat}
                  </span>
                );
              })}
            </div>

            {/* Read more */}
            <div className={cn(cluster.tight, `text-primary ${size.sm} ${weight.medium}`)}>
              <span>Read more</span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronRight className={iconSize.sm} />
              </motion.div>
            </div>
          </motion.div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get the primary category from changes object
 */
function getPrimaryCategory(changes: Record<string, unknown> | null | undefined): ChangelogCategory {
  if (!changes) return 'Added';

  // Priority order for primary category
  const priority: ChangelogCategory[] = ['Security', 'Added', 'Fixed', 'Changed', 'Deprecated', 'Removed'];

  for (const cat of priority) {
    const catChanges = changes[cat];
    if (Array.isArray(catChanges) && catChanges.length > 0) {
      return cat;
    }
  }

  return 'Added';
}

// ============================================================================
// Timeline Container
// ============================================================================

interface ChangelogTimelineProps {
  entries: Array<{
    slug: string;
    title: string;
    tldr?: string | null;
    release_date: string;
    changes?: Record<string, unknown> | null;
  }>;
  getTargetPath: (slug: string) => string;
  className?: string;
}

/**
 * Main timeline container component
 */
export function ChangelogTimeline({ entries, getTargetPath, className }: ChangelogTimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Background line */}
      <div className="absolute left-[5px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-border via-border to-transparent" />

      {/* Entries */}
      <div className={spaceY.default}>
        {entries.map((entry, index) => (
          <TimelineEntry
            key={entry.slug}
            entry={entry}
            index={index}
            targetPath={getTargetPath(entry.slug)}
          />
        ))}
      </div>
    </div>
  );
}
