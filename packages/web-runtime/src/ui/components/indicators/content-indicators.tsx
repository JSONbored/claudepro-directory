'use client';

/**
 * Content Indicators Component
 *
 * Beautiful, animated indicators for content cards showing:
 * - Freshness (how recently updated)
 * - Source type (official vs community)
 * - "New" badge for fresh content
 *
 * Design principles:
 * - Non-intrusive: Small, positioned in corner
 * - Progressive disclosure: Details in tooltip
 * - Animated: Subtle motion for engagement
 * - Accessible: Proper ARIA labels
 *
 * @module ui/components/indicators/content-indicators
 */

import type { Database } from '@heyclaude/database-types';
import { muted, size as textSize, weight } from '../../../design-system/styles/typography.ts';
import { gap, squareSize, display, alignItems, justify, flexDir, padding, position, inset } from '../../../design-system/styles/layout.ts';
import { iconSize } from '../../../design-system/styles/icons.ts';
import { radius } from '../../../design-system/styles/radius.ts';
import { shadowColor, zLayer, opacityLevel, blur } from '../../../design-system/styles/effects.ts';
import { bgGradient, gradientFrom, gradientVia, gradientTo, bgColor, textColor } from '../../../design-system/styles/colors.ts';
import { CheckCircle, Sparkles, User, Clock } from '../../../icons.tsx';
import { cn } from '../../utils.ts';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { useMemo } from 'react';

type ContentSource = Database['public']['Enums']['content_source'];

// ============================================================================
// Types
// ============================================================================

export interface ContentIndicatorsProps {
  /** When the content was added */
  dateAdded?: string | null;
  /** When the content was last updated */
  updatedAt?: string | null;
  /** Source type: official, community, or claudepro */
  source?: ContentSource | null;
  /** Whether this is a "new" item (for New Since Last Visit feature) */
  isNew?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional class name */
  className?: string;
  /** Show freshness indicator */
  showFreshness?: boolean;
  /** Show source indicator */
  showSource?: boolean;
}

export type FreshnessTier = 'fresh' | 'recent' | 'stable';

// ============================================================================
// Freshness Utilities
// ============================================================================

const FRESHNESS_THRESHOLDS = {
  fresh: 7, // days
  recent: 30, // days
} as const;

/**
 * Calculate freshness tier based on date
 */
export function getFreshnessTier(date: string | null | undefined): FreshnessTier {
  if (!date) return 'stable';

  const now = new Date();
  const contentDate = new Date(date);
  const daysDiff = Math.floor((now.getTime() - contentDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= FRESHNESS_THRESHOLDS.fresh) return 'fresh';
  if (daysDiff <= FRESHNESS_THRESHOLDS.recent) return 'recent';
  return 'stable';
}

/**
 * Get human-readable freshness label
 */
export function getFreshnessLabel(date: string | null | undefined): string {
  if (!date) return 'Unknown';

  const now = new Date();
  const contentDate = new Date(date);
  const daysDiff = Math.floor((now.getTime() - contentDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) return 'Today';
  if (daysDiff === 1) return 'Yesterday';
  if (daysDiff < 7) return `${daysDiff} days ago`;
  if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} weeks ago`;
  if (daysDiff < 365) return `${Math.floor(daysDiff / 30)} months ago`;
  return `${Math.floor(daysDiff / 365)} years ago`;
}

// ============================================================================
// Freshness Colors
// ============================================================================

const FRESHNESS_COLORS: Record<FreshnessTier, { dot: string; glow: string; text: string }> = {
  fresh: {
    dot: bgColor.emerald,
    glow: shadowColor.emerald,
    text: textColor.emerald,
  },
  recent: {
    dot: bgColor.amber,
    glow: shadowColor.amber,
    text: textColor.amber,
  },
  stable: {
    dot: bgColor.zinc,
    glow: '',
    text: textColor.zinc,
  },
};

// ============================================================================
// Freshness Indicator Component
// ============================================================================

interface FreshnessIndicatorProps {
  tier: FreshnessTier;
  label: string;
  size: 'sm' | 'md';
}

function FreshnessIndicator({ tier, label, size }: FreshnessIndicatorProps) {
  const colorClasses = FRESHNESS_COLORS[tier];
  const dotSize = size === 'sm' ? squareSize.dotMd : iconSize.xxs;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          className={`${position.relative} ${display.flex} ${alignItems.center} ${justify.center}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          {/* Glow effect for fresh content */}
          {tier === 'fresh' && (
            <motion.div
              className={cn(
                `${position.absolute} ${radius.full}`,
                dotSize,
                colorClasses.dot,
                `${blur.sm} ${opacityLevel[60]}`
              )}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.6, 0.3, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Main dot */}
          <motion.div
            className={cn(`${position.relative} ${radius.full}`, dotSize, colorClasses.dot)}
            animate={
              tier === 'fresh'
                ? {
                    boxShadow: [
                      '0 0 0 0 rgba(16, 185, 129, 0.4)',
                      '0 0 0 4px rgba(16, 185, 129, 0)',
                    ],
                  }
                : {}
            }
            transition={
              tier === 'fresh'
                ? {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }
                : {}
            }
          />
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top" className={textSize.xs}>
        <div className={`${display.flex} ${alignItems.center} ${gap.snug}`}>
          <Clock className={iconSize.xs} />
          <span>Updated {label}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// Source Indicator Component
// ============================================================================

interface SourceIndicatorProps {
  source: ContentSource;
  size: 'sm' | 'md';
}

function SourceIndicator({ source, size }: SourceIndicatorProps) {
  const iconClass = size === 'sm' ? iconSize.xsPlus : iconSize.sm;

  const sourceConfig: Record<
    ContentSource,
    { icon: typeof CheckCircle; label: string; color: string; description: string }
  > = {
    official: {
      icon: CheckCircle,
      label: 'Official',
      color: textColor.info,
      description: 'Verified by maintainers',
    },
    claudepro: {
      icon: CheckCircle,
      label: 'heyclaude',
      color: textColor.purple,
      description: 'Curated by heyclaude',
    },
    community: {
      icon: User,
      label: 'Community',
      color: textColor.zinc,
      description: 'Community contribution',
    },
  };

  const config = sourceConfig[source];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          className={position.relative}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
          whileHover={{ scale: 1.1 }}
        >
          {/* Shine effect for official/claudepro */}
          {(source === 'official' || source === 'claudepro') && (
            <motion.div
              className={`${position.absolute} ${inset['0']} ${radius.full} ${bgGradient.toR} ${gradientFrom.transparent} ${gradientVia.white30} ${gradientTo.transparent}`}
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: '100%', opacity: [0, 1, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut',
              }}
            />
          )}
          <Icon className={cn(iconClass, config.color, `${position.relative} ${zLayer.raised}`)} />
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top" className={textSize.xs}>
        <div className={`${display.flex} ${flexDir.col} ${gap.micro}`}>
          <span className={weight.medium}>{config.label}</span>
          <span className={muted.sm}>{config.description}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// New Badge Component
// ============================================================================

interface NewBadgeProps {
  size: 'sm' | 'md';
}

export function NewBadge({ size }: NewBadgeProps) {
  const textSizeClass = size === 'sm' ? textSize['2xs'] : textSize.xs;

  return (
    <motion.div
      className={cn(
        `${position.relative} ${display.flex} ${alignItems.center} ${gap.tight} ${radius.full} ${padding.xCompact} ${padding.yHair}`,
        `${bgGradient.toR} ${gradientFrom.violet90} ${gradientTo.fuchsia90}`,
        `${textColor.white} ${weight.semibold}`,
        textSizeClass
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 20,
      }}
      whileHover={{ scale: 1.05 }}
    >
      {/* Sparkle animation */}
      <motion.div
        animate={{
          rotate: [0, 15, -15, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Sparkles className={iconSize.xs} />
      </motion.div>
      <span>New</span>

      {/* Shimmer effect */}
      <motion.div
            className={`${position.absolute} ${inset['0']} ${radius.full} ${bgGradient.toR} ${gradientFrom.transparent} ${gradientVia.white20} ${gradientTo.transparent}`}
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
          ease: 'linear',
        }}
      />
    </motion.div>
  );
}

// ============================================================================
// Main Content Indicators Component
// ============================================================================

/**
 * Combined content indicators component
 *
 * Shows freshness dot, source badge, and optional "new" indicator
 * in a compact, non-intrusive format.
 */
export function ContentIndicators({
  dateAdded,
  updatedAt,
  source,
  isNew = false,
  size = 'sm',
  className,
  showFreshness = true,
  showSource = true,
}: ContentIndicatorsProps) {
  // Use most recent date for freshness
  const freshnessDate = updatedAt ?? dateAdded;
  const freshnessTier = useMemo(() => getFreshnessTier(freshnessDate), [freshnessDate]);
  const freshnessLabel = useMemo(() => getFreshnessLabel(freshnessDate), [freshnessDate]);

  // Don't show stable freshness indicator (too old = no indicator)
  const shouldShowFreshness = showFreshness && freshnessTier !== 'stable';
  const shouldShowSource = showSource && source && source !== 'community';
  const shouldShowNew = isNew;

  // If nothing to show, return null
  if (!shouldShowFreshness && !shouldShowSource && !shouldShowNew) {
    return null;
  }

  return (
    <div className={cn(`${display.flex} ${alignItems.center} ${gap.snug}`, className)}>
      <AnimatePresence mode="popLayout">
        {/* New badge takes priority */}
        {shouldShowNew && (
          <motion.div
            key="new"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <NewBadge size={size} />
          </motion.div>
        )}

        {/* Freshness indicator */}
        {shouldShowFreshness && !shouldShowNew && (
          <motion.div
            key="freshness"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <FreshnessIndicator tier={freshnessTier} label={freshnessLabel} size={size} />
          </motion.div>
        )}

        {/* Source indicator */}
        {shouldShowSource && (
          <motion.div
            key="source"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <SourceIndicator source={source} size={size} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to calculate freshness information
 */
export function useFreshness(date: string | null | undefined) {
  return useMemo(
    () => ({
      tier: getFreshnessTier(date),
      label: getFreshnessLabel(date),
      isFresh: getFreshnessTier(date) === 'fresh',
      isRecent: getFreshnessTier(date) === 'recent',
    }),
    [date]
  );
}
