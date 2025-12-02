'use client';

/**
 * Last Visit Tracking
 *
 * Tracks when users last visited and shows what's new since then.
 * Uses localStorage for persistence (per-device).
 *
 * Smart behavior:
 * - Only shows banner if there ARE new items
 * - Falls back gracefully when nothing is new
 * - Updates timestamp on each visit
 * - Handles first-time visitors gracefully
 *
 * @module features/indicators/last-visit
 */

import {
  bgColor,
  borderColor,
  cluster,
  gap,
  iconSize,
  alignItems,
  justify,
  muted,
  overflow,
  padding,
  radius,
  srOnly,
  textColor,
  weight,
} from '@heyclaude/web-runtime/design-system';
import { Sparkles, X, TrendingUp } from '@heyclaude/web-runtime/icons';
import { cn } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'heyclaude_last_visit';
const FIRST_VISIT_WINDOW_DAYS = 7; // Show content from last 7 days for first-time visitors

// ============================================================================
// Types
// ============================================================================

export interface LastVisitData {
  /** Timestamp of last visit */
  lastVisit: number | null;
  /** Whether this is a first-time visitor */
  isFirstVisit: boolean;
  /** Update the last visit timestamp to now */
  updateLastVisit: () => void;
  /** Check if a date is after last visit */
  isNewSinceLastVisit: (date: string | null | undefined) => boolean;
  /** Count items that are new since last visit */
  countNewItems: <T extends { date_added?: string | null; updated_at?: string | null }>(
    items: T[]
  ) => number;
  /** Get items that are new since last visit */
  getNewItems: <T extends { date_added?: string | null; updated_at?: string | null }>(
    items: T[]
  ) => T[];
}

// ============================================================================
// Hook: useLastVisit
// ============================================================================

/**
 * Hook to track and manage last visit timestamp
 *
 * @example
 * ```tsx
 * const { isNewSinceLastVisit, countNewItems, updateLastVisit } = useLastVisit();
 *
 * // Check if specific item is new
 * const isNew = isNewSinceLastVisit(item.date_added);
 *
 * // Count new items in a list
 * const newCount = countNewItems(items);
 *
 * // Update timestamp when user has "seen" content
 * useEffect(() => { updateLastVisit(); }, []);
 * ```
 */
export function useLastVisit(): LastVisitData {
  const [lastVisit, setLastVisit] = useState<number | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const timestamp = parseInt(stored, 10);
        if (!isNaN(timestamp)) {
          setLastVisit(timestamp);
        }
      } else {
        setIsFirstVisit(true);
        // For first-time visitors, set a fake "last visit" from X days ago
        // so they see some "new" content
        const firstVisitWindow = Date.now() - FIRST_VISIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
        setLastVisit(firstVisitWindow);
      }
    } catch {
      // localStorage might not be available (SSR, private browsing)
      setIsFirstVisit(true);
    }
    setIsInitialized(true);
  }, []);

  // Update last visit timestamp
  const updateLastVisit = useCallback(() => {
    const now = Date.now();
    setLastVisit(now);
    setIsFirstVisit(false);
    try {
      localStorage.setItem(STORAGE_KEY, now.toString());
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Check if a date is after last visit
  const isNewSinceLastVisit = useCallback(
    (date: string | null | undefined): boolean => {
      if (!date || !lastVisit) return false;
      const itemDate = new Date(date).getTime();
      return itemDate > lastVisit;
    },
    [lastVisit]
  );

  // Count new items
  const countNewItems = useCallback(
    <T extends { date_added?: string | null; updated_at?: string | null }>(items: T[]): number => {
      if (!isInitialized || !lastVisit) return 0;
      return items.filter((item) => {
        const relevantDate = item.updated_at ?? item.date_added;
        return isNewSinceLastVisit(relevantDate);
      }).length;
    },
    [isInitialized, lastVisit, isNewSinceLastVisit]
  );

  // Get new items
  const getNewItems = useCallback(
    <T extends { date_added?: string | null; updated_at?: string | null }>(items: T[]): T[] => {
      if (!isInitialized || !lastVisit) return [];
      return items.filter((item) => {
        const relevantDate = item.updated_at ?? item.date_added;
        return isNewSinceLastVisit(relevantDate);
      });
    },
    [isInitialized, lastVisit, isNewSinceLastVisit]
  );

  return {
    lastVisit,
    isFirstVisit,
    updateLastVisit,
    isNewSinceLastVisit,
    countNewItems,
    getNewItems,
  };
}

// ============================================================================
// Banner Component
// ============================================================================

interface NewSinceLastVisitBannerProps {
  /** Number of new items */
  newCount: number;
  /** Category name (optional, for context) */
  category?: string;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
  /** Callback when "View new" is clicked */
  onViewNew?: () => void;
  /** Additional class name */
  className?: string;
  /** Fallback content when nothing is new */
  fallbackContent?: React.ReactNode;
}

/**
 * Animated banner showing new content since last visit
 *
 * Features:
 * - Only shows when there ARE new items
 * - Animated entrance with sparkles
 * - Dismissible
 * - Falls back gracefully when nothing is new
 */
export function NewSinceLastVisitBanner({
  newCount,
  category,
  onDismiss,
  onViewNew,
  className,
  fallbackContent,
}: NewSinceLastVisitBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  // Show fallback if no new items
  if (newCount === 0) {
    if (fallbackContent) {
      return <>{fallbackContent}</>;
    }
    return null;
  }

  const categoryText = category ? ` in ${category}` : '';

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
        className={cn(
          `relative ${overflow.hidden} ${radius.xl} border border-violet-500/20`,
          'bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-violet-500/10',
          padding.default,
          className
        )}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Animated background shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        <div className={`relative flex ${alignItems.center} ${justify.between} ${gap.comfortable}`}>
          <div className={cluster.compact}>
            {/* Animated sparkle icon */}
            <motion.div
              className={`${radius.full} bg-violet-500/20 ${padding.tight}`}
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Sparkles className={cn(iconSize.md, 'text-violet-500')} />
            </motion.div>

            <div>
              <p className={`${weight.semibold} ${textColor.foreground}`}>
                <motion.span
                  className="inline-block text-violet-500"
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {newCount}
                </motion.span>{' '}
                new {newCount === 1 ? 'item' : 'items'}
                {categoryText} since your last visit
              </p>
              <p className={muted.sm}>Check out what's been added!</p>
            </div>
          </div>

          <div className={cluster.compact}>
            {onViewNew && (
              <Button
                variant="default"
                size="sm"
                onClick={onViewNew}
                className="bg-violet-500 hover:bg-violet-600"
              >
                <TrendingUp className={iconSize.xs} />
                View new
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className={`${iconSize.xl} ${muted.default} hover:text-foreground`}
            >
              <X className={iconSize.sm} />
              <span className={srOnly.default}>Dismiss</span>
            </Button>
          </div>
        </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Trending Fallback Component
// ============================================================================

interface TrendingFallbackProps {
  className?: string;
}

/**
 * Fallback shown when there's nothing new
 * Points users to trending content instead
 */
export function TrendingFallback({ className }: TrendingFallbackProps) {
  return (
    <motion.div
      className={cn(
        `${radius.xl} border ${borderColor['border/50']} ${bgColor['muted/30']} ${padding.default}`,
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={cluster.compact}>
        <div className={`${radius.full} bg-amber-500/20 ${padding.tight}`}>
          <TrendingUp className={cn(iconSize.md, 'text-amber-500')} />
        </div>
        <div>
          <p className={`${weight.medium} ${textColor.foreground}`}>You're all caught up!</p>
          <p className={muted.sm}>Check out what's trending in the meantime.</p>
        </div>
      </div>
    </motion.div>
  );
}
