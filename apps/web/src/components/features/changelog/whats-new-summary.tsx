'use client';

/**
 * What's New This Week Summary Card
 *
 * A beautiful animated card showing recent changelog activity.
 * Displays a summary of changes from the past 7 days with category breakdown.
 *
 * @module features/changelog/whats-new-summary
 */

import type { Database } from '@heyclaude/database-types';
import {
  animateDuration,
  bgColor,
  cluster,
  flexWrap,
  gap,
  iconSize,
  alignItems,
  justify,
  marginBottom,
  marginTop,
  muted,
  overflow,
  padding,
  radius,
  size,
  spaceY,
  textColor,
  transition,
  weight,
  squareSize,
} from '@heyclaude/web-runtime/design-system';
import {
  Sparkles,
  Plus,
  RefreshCw,
  Settings,
  Trash,
  AlertTriangle,
  Shield,
  ChevronRight,
  Calendar,
} from '@heyclaude/web-runtime/icons';
import { cn } from '@heyclaude/web-runtime/ui';
import { motion, useInView } from 'motion/react';
import Link from 'next/link';
import { useRef, useMemo } from 'react';

type ChangelogCategory = Database['public']['Enums']['changelog_category'];

interface ChangelogEntry {
  slug: string;
  title: string;
  release_date: string;
  changes?: Record<string, unknown> | null;
}

interface WhatsNewSummaryProps {
  /** All changelog entries */
  entries: ChangelogEntry[];
  /** Number of days to look back (default: 7) */
  daysBack?: number;
  /** Target path builder */
  getTargetPath?: (slug: string) => string;
  /** Optional className */
  className?: string;
}

// Category configuration with icons and colors
const CATEGORY_CONFIG: Record<
  ChangelogCategory,
  { icon: typeof Plus; color: string; bgColor: string; label: string }
> = {
  Added: {
    icon: Plus,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    label: 'New Features',
  },
  Changed: {
    icon: RefreshCw,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'Improvements',
  },
  Fixed: {
    icon: Settings,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    label: 'Bug Fixes',
  },
  Removed: {
    icon: Trash,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'Removed',
  },
  Deprecated: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    label: 'Deprecated',
  },
  Security: {
    icon: Shield,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    label: 'Security',
  },
};

/**
 * Count changes by category across entries
 */
function countChangesByCategory(
  entries: ChangelogEntry[]
): Record<ChangelogCategory, number> {
  const counts: Record<ChangelogCategory, number> = {
    Added: 0,
    Changed: 0,
    Fixed: 0,
    Removed: 0,
    Deprecated: 0,
    Security: 0,
  };

  for (const entry of entries) {
    if (!entry.changes) continue;
    for (const [category, items] of Object.entries(entry.changes)) {
      if (category in counts && Array.isArray(items)) {
        counts[category as ChangelogCategory] += items.length;
      }
    }
  }

  return counts;
}

/**
 * Get the most recent featured entry
 */
function getFeaturedEntry(entries: ChangelogEntry[]): ChangelogEntry | null {
  if (entries.length === 0) return null;
  // Return the most recent entry with at least one "Added" change
  const withAdded = entries.find((e) => {
    const changes = e.changes as Record<string, unknown[]> | null | undefined;
    return changes?.['Added'] && changes['Added'].length > 0;
  });
  return withAdded ?? entries[0] ?? null;
}

/**
 * What's New This Week Summary Card
 */
export function WhatsNewSummary({
  entries,
  daysBack = 7,
  getTargetPath = (slug) => `/changelog/${slug}`,
  className,
}: WhatsNewSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  // Filter entries from the last N days
  const recentEntries = useMemo(() => {
    const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;
    return entries.filter(
      (entry) => new Date(entry.release_date).getTime() > cutoff
    );
  }, [entries, daysBack]);

  // Count changes by category
  const categoryCounts = useMemo(
    () => countChangesByCategory(recentEntries),
    [recentEntries]
  );

  // Get featured entry
  const featuredEntry = useMemo(
    () => getFeaturedEntry(recentEntries),
    [recentEntries]
  );

  // Total changes
  const totalChanges = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  // Categories with changes (sorted by count)
  const activeCategories = (Object.entries(categoryCounts) as [ChangelogCategory, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  // Don't render if nothing is new
  if (recentEntries.length === 0 || totalChanges === 0) {
    return null;
  }

  return (
    <motion.div
      ref={ref}
      className={cn(
  `relative ${overflow.hidden}`, className)}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Card */}
      <div
        className={cn(
          `${radius.xl} border bg-gradient-to-br from-card via-card to-accent/5`,
          `relative ${padding.comfortable} md:${padding.relaxed}`
        )}
      >
        {/* Decorative gradient blur */}
        <div className={`pointer-events-none absolute -right-20 -top-20 ${squareSize.avatar5xl} ${radius.full} ${bgColor['accent/10']} blur-3xl`} />
        <div className={`pointer-events-none absolute -bottom-20 -left-20 ${squareSize.avatar5xl} ${radius.full} ${bgColor['primary/10']} blur-3xl`} />

        {/* Header */}
        <div className={`relative ${spaceY.comfortable}`}>
          <div className={cluster.default}>
            <motion.div
              className={`flex ${alignItems.center} ${justify.center} ${radius.full} bg-gradient-to-br from-amber-500/20 to-orange-500/20 ${padding.tight}`}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className={`${iconSize.md} ${textColor.amber}`} />
            </motion.div>
            <div>
              <h2 className={`${weight.bold} ${size.xl}`}>What&apos;s New This Week</h2>
              <p className={muted.sm}>
                {recentEntries.length} update{recentEntries.length !== 1 ? 's' : ''} with{' '}
                {totalChanges} change{totalChanges !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Category breakdown */}
          <div className={`flex ${flexWrap.wrap} ${gap.compact}`}>
            {activeCategories.map(([category, count], index) => {
              const config = CATEGORY_CONFIG[category];
              const Icon = config.icon;

              return (
                <motion.div
                  key={category}
                  className={cn(
                    `${radius.lg} ${cluster.tight}`,
                    `border ${padding.xCompact} ${padding.ySnug}`,
                    config.bgColor
                  )}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={
                    isInView
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.8 }
                  }
                  transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                >
                  <Icon className={cn(iconSize.xs, config.color)} />
                  <span className={`${size.sm} ${weight.medium}`}>{count}</span>
                  <span className={muted.xs}>{config.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Featured entry preview */}
        {featuredEntry && (
          <motion.div
            className={`relative ${marginTop.comfortable}`}
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Link
              href={getTargetPath(featuredEntry.slug)}
              className="group block"
            >
              <div
                className={cn(
                  `${radius.lg} border bg-background/50 ${padding.default}`,
                  `transition-all ${animateDuration.default} hover:border-primary/30 hover:bg-background`
                )}
              >
                <div className={`${cluster.tight} ${muted.xs} ${marginBottom.tight}`}>
                  <Calendar className={iconSize.xs} />
                  <time dateTime={featuredEntry.release_date}>
                    {new Date(featuredEntry.release_date).toLocaleDateString(
                      undefined,
                      {
                        month: 'short',
                        day: 'numeric',
                      }
                    )}
                  </time>
                  <span>•</span>
                  <span>Latest</span>
                </div>

                <div className={`flex ${alignItems.center} ${justify.between} ${gap.comfortable}`}>
                  <h3
                    className={`${weight.semibold} ${size.base} group-hover:text-primary ${transition.colors} line-clamp-1`}
                  >
                    {featuredEntry.title}
                  </h3>
                  <motion.div
                    className={`shrink-0 ${textColor.primary}`}
                    animate={{ x: [0, 4, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <ChevronRight className={iconSize.sm} />
                  </motion.div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* View all link */}
        {recentEntries.length > 1 && (
          <motion.p
            className={`${marginTop.default} text-center`}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className={muted.sm}>
              Plus {recentEntries.length - 1} more update
              {recentEntries.length > 2 ? 's' : ''} this week
            </span>
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
