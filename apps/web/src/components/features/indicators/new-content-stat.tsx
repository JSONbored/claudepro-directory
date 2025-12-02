'use client';

/**
 * New Content Stat Component
 *
 * A subtle, animated indicator showing new content counts.
 * Used in hero sections for both homepage and category pages.
 *
 * Two modes:
 * - "week": Shows items added in last 7 days (no localStorage)
 * - "visit": Shows items since user's last visit (uses localStorage)
 *
 * @module features/indicators/new-content-stat
 */

import { cluster, muted, weight, textColor, iconSize, size } from '@heyclaude/web-runtime/design-system';
import { Sparkles } from '@heyclaude/web-runtime/icons';
import { cn } from '@heyclaude/web-runtime/ui';
import { motion, AnimatePresence } from 'motion/react';
import { useMemo } from 'react';
import { useLastVisit } from './last-visit';

// ============================================================================
// Types
// ============================================================================

interface BaseProps {
  /** Additional class name */
  className?: string;
}

interface WeekModeProps extends BaseProps {
  /** Mode: count items from last 7 days */
  mode: 'week';
  /** Count of items added in the last 7 days (pre-computed server-side) */
  count: number;
}

interface VisitModeProps extends BaseProps {
  /** Mode: count items since user's last visit */
  mode: 'visit';
  /** Items to check against last visit timestamp */
  items: Array<{ date_added?: string | null; updated_at?: string | null }>;
  /** Optional category name for context */
  category?: string;
}

type NewContentStatProps = WeekModeProps | VisitModeProps;

// ============================================================================
// Component
// ============================================================================

/**
 * Subtle animated stat showing new content
 *
 * Displays as: "✨ 8 new this week" or "✨ 3 new since your last visit"
 *
 * Only renders if count > 0, keeping the UI clean.
 */
export function NewContentStat(props: NewContentStatProps) {
  const { className } = props;

  // For visit mode, use the hook to get count
  const lastVisitData = useLastVisit();

  const { count, label } = useMemo(() => {
    if (props.mode === 'week') {
      return {
        count: props.count,
        label: 'new this week',
      };
    }

    // Visit mode - count new items since last visit
    const newCount = lastVisitData.countNewItems(props.items);
    const categoryLabel = props.category ? ` in ${props.category}` : '';
    return {
      count: newCount,
      label: `new${categoryLabel} since last visit`,
    };
  }, [props, lastVisitData]);

  // Don't render if nothing is new
  if (count === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.span
        className={cn(cluster.tight, size.sm, className)}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Sparkle icon with subtle animation */}
        <motion.span
          className="text-amber-500"
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className={iconSize.xsPlus} />
        </motion.span>

        {/* Animated number */}
        <motion.span
          className={`${weight.semibold} ${textColor.foreground}`}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {count}
        </motion.span>

        {/* Label text */}
        <span className={muted.sm}>{label}</span>
      </motion.span>
    </AnimatePresence>
  );
}

// ============================================================================
// Utility: Count items from last N days (for server-side pre-computation)
// ============================================================================

/**
 * Count items added within the last N days
 * Use this server-side to pre-compute the count for "week" mode
 */
export function countItemsFromLastDays(
  items: Array<{ date_added?: string | null }>,
  days: number = 7
): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return items.filter((item) => {
    if (!item.date_added) return false;
    const itemDate = new Date(item.date_added).getTime();
    return itemDate > cutoff;
  }).length;
}
