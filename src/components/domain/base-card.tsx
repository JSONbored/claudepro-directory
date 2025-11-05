'use client';

/**
 * BaseCard Component
 *
 * Reusable card component that eliminates duplication between ConfigCard and CollectionCard.
 * Provides a composition-based architecture with customizable slots.
 *
 * Features:
 * - Shared card structure and navigation logic
 * - Customizable badge, action, and metadata slots
 * - Integrated useCardNavigation hook
 * - Sponsored content tracking support
 * - Full accessibility (ARIA labels, keyboard navigation)
 * - Performance optimized with React.memo
 * - Motion.dev hover/tap animations (Phase 1.1 - October 2025)
 *
 * Architecture:
 * - Composition over inheritance (render props pattern)
 * - Type-safe props with TypeScript
 * - Follows existing UI_CLASSES constants
 * - Maintains existing shadcn/ui Card patterns
 *
 * @module components/shared/base-card
 */

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { memo } from 'react';
import { SwipeableCardWrapper } from '@/src/components/domain/swipeable-card-wrapper';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { SponsoredTracker } from '@/src/components/features/sponsored/sponsored-tracker';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { type UseCardNavigationOptions, useCardNavigation } from '@/src/hooks/use-card-navigation';
import { APP_CONFIG, SOCIAL_LINKS } from '@/src/lib/constants';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { getViewTransitionStyle } from '@/src/lib/utils/view-transitions.utils';

/**
 * Props for BaseCard component
 */
export interface BaseCardProps {
  /**
   * Target path for card navigation (optional for review cards)
   * @example "/agents/code-reviewer"
   */
  targetPath?: string;

  /**
   * Display title for the card
   */
  displayTitle: string;

  /**
   * Card description text (optional for some variants)
   */
  description?: string;

  /**
   * Author name (optional for review/changelog variants)
   */
  author?: string;

  /**
   * Author profile URL (GitHub, personal site, etc.)
   * Falls back to SOCIAL_LINKS.authorProfile if not provided
   */
  authorProfileUrl?: string;

  /**
   * Content source (e.g., "official", "community")
   */
  source?: string;

  /**
   * Array of tags to display
   */
  tags?: string[];

  /**
   * Maximum number of tags to show before "+N more"
   * @default 4
   */
  maxVisibleTags?: number;

  /**
   * Display variant
   * @default "default"
   */
  variant?: 'default' | 'detailed' | 'review' | 'changelog';

  /**
   * Whether to show action buttons
   * @default true
   */
  showActions?: boolean;

  /**
   * ARIA label for the card
   */
  ariaLabel: string;

  /**
   * Custom render function for header content
   * Used by review cards for avatar/rating, changelog for date
   */
  renderHeader?: () => ReactNode;

  /**
   * Custom render function for top badges
   * (e.g., TypeBadge, CollectionTypeBadge, DifficultyBadge)
   */
  renderTopBadges?: () => ReactNode;

  /**
   * Custom render function for content section
   * Used by review cards for expandable text
   */
  renderContent?: () => ReactNode;

  /**
   * Custom render function for metadata badges
   * (e.g., view count, item count, setup time)
   */
  renderMetadataBadges?: () => ReactNode;

  /**
   * Custom render function for action buttons
   * (e.g., repository, documentation, bookmark, copy)
   */
  renderActions?: () => ReactNode;

  /**
   * Custom metadata text to show in footer
   * (e.g., "50% popular", "5-10 min")
   */
  customMetadataText?: ReactNode;

  /**
   * Whether this is sponsored content
   */
  isSponsored?: boolean;

  /**
   * Sponsored content ID for tracking
   */
  sponsoredId?: string;

  /**
   * Position in list (for sponsored tracking)
   */
  position?: number;

  /**
   * Custom click handler (called before navigation)
   */
  onBeforeNavigate?: () => void;

  /**
   * Disable navigation (for review cards that don't link)
   */
  disableNavigation?: boolean;

  /**
   * Show author in footer
   * @default true
   */
  showAuthor?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show subtle top accent border for related content
   * Used by related content carousel for visual distinction
   * @default false
   */
  topAccent?: boolean;

  /**
   * Compact mode with tighter spacing for grid layouts
   * Reduces padding and gaps for denser card displays
   * @default false
   */
  compactMode?: boolean;

  /**
   * Enable swipe gestures on mobile
   * Swipe right → Copy, Swipe left → Bookmark
   * Auto-detects mobile, respects prefers-reduced-motion
   * @default true
   */
  enableSwipeGestures?: boolean;

  /**
   * Callback for swipe right gesture (usually copy action)
   */
  onSwipeRight?: () => void | Promise<void>;

  /**
   * Callback for swipe left gesture (usually bookmark action)
   */
  onSwipeLeft?: () => void | Promise<void>;

  /**
   * Enable View Transitions API for smooth page morphing
   * Progressive enhancement - works where supported, instant navigation elsewhere
   * @default false
   */
  useViewTransitions?: boolean;

  /**
   * Unique slug for view transition naming
   * Used to create stable view-transition-name for card → detail morphing
   */
  viewTransitionSlug?: string;
}

/**
 * BaseCard component
 *
 * Provides shared card structure with customizable slots for different card types.
 * Eliminates ~140 lines of duplication between ConfigCard and CollectionCard.
 *
 * @param props - Component props
 * @returns Reusable card component with customizable slots
 *
 * @example
 * ConfigCard usage:
 * - targetPath: `/agents/${slug}`
 * - displayTitle: "Code Reviewer Agent"
 * - renderTopBadges: () => TypeBadge component
 * - renderActions: () => Action buttons
 */
export const BaseCard = memo(
  ({
    targetPath,
    displayTitle,
    description,
    author,
    authorProfileUrl,
    source,
    tags,
    maxVisibleTags = 4,
    variant = 'default',
    showActions = true,
    ariaLabel,
    renderHeader,
    renderTopBadges,
    renderContent,
    renderMetadataBadges,
    renderActions,
    customMetadataText,
    isSponsored,
    sponsoredId,
    position,
    onBeforeNavigate,
    disableNavigation = false,
    showAuthor = true,
    className,
    topAccent = false,
    compactMode = false,
    enableSwipeGestures = true,
    onSwipeRight,
    onSwipeLeft,
    useViewTransitions = false,
    viewTransitionSlug,
  }: BaseCardProps) => {
    const navigationParam: string | UseCardNavigationOptions | undefined =
      disableNavigation || !targetPath
        ? undefined
        : onBeforeNavigate || useViewTransitions
          ? {
              path: targetPath,
              onBeforeNavigate,
              useViewTransitions,
            }
          : targetPath;

    const { handleCardClick, handleKeyDown } = useCardNavigation(
      navigationParam as string | UseCardNavigationOptions
    );

    // Calculate visible and overflow tags
    const visibleTags = tags?.slice(0, maxVisibleTags);
    const overflowCount = tags && tags.length > maxVisibleTags ? tags.length - maxVisibleTags : 0;

    // View transition style for smooth page morphing
    const viewTransitionStyle =
      useViewTransitions && viewTransitionSlug
        ? getViewTransitionStyle('card', viewTransitionSlug)
        : undefined;

    // Card content wrapper - conditionally render with or without motion animations
    const cardElement = (
      <Card
        className={`${disableNavigation ? '' : UI_CLASSES.CARD_INTERACTIVE} ${variant === 'detailed' ? 'p-6' : ''} ${variant === 'review' ? 'rounded-lg border p-4' : ''} ${compactMode ? 'p-4' : ''} ${className || ''} relative`}
        style={{
          ...viewTransitionStyle,
          contain: 'paint',
        }}
        onClick={disableNavigation ? undefined : handleCardClick}
        role="article"
        aria-label={ariaLabel}
        tabIndex={disableNavigation ? undefined : 0}
        onKeyDown={disableNavigation ? undefined : handleKeyDown}
      >
        {/* Top accent border for related content */}
        {topAccent && (
          <div className="absolute top-0 right-0 left-0 h-px bg-border opacity-70 transition-opacity group-hover:opacity-100" />
        )}

        <CardHeader
          className={`${variant === 'review' ? 'mb-3 p-0' : 'pb-3'} ${compactMode ? 'pb-2' : ''}`}
        >
          {/* Custom header slot (for review avatar/rating, changelog date) */}
          {renderHeader?.()}

          {/* Standard header (config/collection cards) */}
          {!renderHeader && (
            <div className={'flex items-start justify-between'}>
              <div className="flex-1">
                {/* Top badges slot (type, difficulty, sponsored, etc.) */}
                {renderTopBadges && (
                  <div className={'mb-1 flex items-center gap-2'}>{renderTopBadges()}</div>
                )}

                {/* Title */}
                <CardTitle
                  className={`font-semibold text-foreground text-lg ${disableNavigation ? '' : 'transition-colors-smooth group-hover:text-accent'}`}
                >
                  {displayTitle}
                </CardTitle>

                {/* Description */}
                {description && (
                  <CardDescription className={'mt-1 line-clamp-2 text-muted-foreground text-sm'}>
                    {description}
                  </CardDescription>
                )}
              </div>

              {/* Source badge (right side of header) */}
              {source && (
                <div className={'ml-2 flex items-center gap-1'}>
                  <UnifiedBadge
                    variant="source"
                    source={
                      source as
                        | 'official'
                        | 'partner'
                        | 'community'
                        | 'verified'
                        | 'experimental'
                        | 'other'
                    }
                  >
                    {source.charAt(0).toUpperCase() + source.slice(1)}
                  </UnifiedBadge>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent
          className={`${variant === 'review' ? 'p-0' : 'pt-0'} ${compactMode ? 'pt-0' : ''}`}
        >
          {/* Custom content slot (for review expandable text) */}
          {renderContent && <div className="mb-3">{renderContent()}</div>}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className={UI_CLASSES.CARD_BADGE_CONTAINER}>
              {visibleTags?.map((tag: string) => (
                <UnifiedBadge key={tag} variant="tag" tag={tag} />
              ))}
              {overflowCount > 0 && (
                <UnifiedBadge
                  variant="base"
                  style="outline"
                  className={'border-muted-foreground/20 text-muted-foreground text-xs'}
                >
                  +{overflowCount}
                </UnifiedBadge>
              )}
            </div>
          )}

          {/* Footer: Metadata and Actions */}
          <div className={UI_CLASSES.CARD_FOOTER_RESPONSIVE}>
            {/* Left side: Author and custom metadata */}
            {(showAuthor && author) || customMetadataText ? (
              <div className={'flex items-center gap-2 text-muted-foreground text-xs'}>
                {showAuthor && author && (
                  <span>
                    by{' '}
                    <a
                      href={authorProfileUrl || SOCIAL_LINKS.authorProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-foreground hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {author}
                    </a>
                  </span>
                )}
                {customMetadataText}
              </div>
            ) : (
              <div />
            )}

            {/* Right side: Metadata badges and actions */}
            <div className={UI_CLASSES.CARD_METADATA_BADGES}>
              {/* Metadata badges slot (view count, item count, etc.) */}
              {renderMetadataBadges?.()}

              {/* Action buttons slot */}
              {showActions && renderActions?.()}
            </div>
          </div>
        </CardContent>
      </Card>
    );

    // Wrap card with motion animations if navigation is enabled
    const motionCard = disableNavigation ? (
      cardElement
    ) : (
      <motion.div
        whileHover={{
          y: -2,
          transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
        }}
        whileTap={{
          y: 0,
          transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
        }}
        style={{ willChange: 'transform' }}
      >
        {cardElement}
      </motion.div>
    );

    // Optionally wrap with swipeable gestures for mobile quick actions
    const cardContent = enableSwipeGestures ? (
      <SwipeableCardWrapper
        onSwipeRight={onSwipeRight}
        onSwipeLeft={onSwipeLeft}
        enableGestures={enableSwipeGestures}
      >
        {motionCard}
      </SwipeableCardWrapper>
    ) : (
      motionCard
    );

    // Wrap in sponsored tracker if this is sponsored content
    if (isSponsored && sponsoredId && targetPath) {
      return (
        <SponsoredTracker
          sponsoredId={sponsoredId}
          targetUrl={`${APP_CONFIG.url}${targetPath}`}
          position={position}
        >
          {cardContent}
        </SponsoredTracker>
      );
    }

    return cardContent;
  }
);

BaseCard.displayName = 'BaseCard';
