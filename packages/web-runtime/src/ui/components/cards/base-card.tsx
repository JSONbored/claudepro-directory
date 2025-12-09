'use client';

/**
 * BaseCard Component
 *
 * Reusable card component that eliminates duplication between ConfigCard and CollectionCard.
 * Provides a composition-based architecture with customizable slots.
 *
 * Architecture:
 * - Client-side only (uses hooks, motion)
 * - Accepts app-specific primitives as optional props (Card, HoverCard, SponsoredPulse)
 * - Uses web-runtime utilities (navigation, badges, view transitions)
 * - Structured logging for errors
 * - Performance optimized with React.memo
 *
 * Features:
 * - Shared card structure and navigation logic
 * - Customizable badge, action, and metadata slots
 * - Integrated useCardNavigation hook
 * - Sponsored content tracking support (via optional SponsoredPulse wrapper)
 * - Full accessibility (ARIA labels, keyboard navigation)
 * - Motion.dev hover/tap animations (via optional HoverCard wrapper)
 * - View Transitions API support
 *
 * Usage:
 * ```tsx
 * import { BaseCard } from '@heyclaude/web-runtime/ui';
 * import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 *
 * <BaseCard
 *   Card={Card}
 *   CardContent={CardContent}
 *   CardHeader={CardHeader}
 *   CardTitle={CardTitle}
 *   CardDescription={CardDescription}
 *   targetPath="/agents/code-reviewer"
 *   displayTitle="Code Reviewer"
 *   description="AI code review assistant"
 *   renderActions={() => <Button>View</Button>}
 * />
 * ```
 */

import { getSocialLinks } from '../../../data/marketing/contact.ts';
import { APP_CONFIG } from '../../../data/config/constants.ts';
import { getViewTransitionName } from '../../utils.ts';
import { POSITION_PATTERNS, UI_CLASSES } from '../../constants.ts';
import { UnifiedBadge } from '../badges/unified-badge.tsx';
import { SwipeableCardWrapper } from './swipeable-card.tsx';
import { HoverCard } from '../animation/hover-card.tsx';
import { SponsoredPulse } from '../features/sponsored-pulse.tsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../card.tsx';
import { type UseCardNavigationOptions, useCardNavigation } from '../../../hooks/use-card-navigation.ts';
import { logger } from '../../../logger.ts';
import { normalizeError } from '../../../errors.ts';
import type { ReactNode, HTMLAttributes } from 'react';
import { memo } from 'react';

/**
 * Props for BaseCard component
 */
const SOCIAL_LINK_SNAPSHOT = getSocialLinks();

/**
 * Generic card component props - accepts any component that matches Card structure
 */
export interface BaseCardComponentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

export interface BaseCardProps {

  /**
   * Target path for card navigation (optional for review cards)
   * @example "/agents/code-reviewer"
   */
  targetPath?: string;

  /**
   * Display title for the card
   * Can be string or ReactNode (for search highlighting)
   */
  displayTitle: string | ReactNode;

  /**
   * Card description text (optional for some variants)
   * Can be string or ReactNode (for search highlighting)
   */
  description?: string | ReactNode;

  /**
   * Author name (optional for review/changelog variants)
   * Can be string or ReactNode (for search highlighting)
   */
  author?: string | ReactNode;

  /**
   * Author profile URL (GitHub, personal site, etc.)
   * Falls back to marketing contact helper snapshot if not provided
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
   * Highlighted tags (for search highlighting)
   * If provided, tags will be rendered with highlighting
   */
  highlightedTags?: Array<{ original: string; highlighted: ReactNode }>;

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
    highlightedTags,
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
    // Use web-runtime Card components directly
    const CardComponent = Card;
    const CardContentComponent = CardContent;
    const CardHeaderComponent = CardHeader;
    const CardTitleComponent = CardTitle;
    const CardDescriptionComponent = CardDescription;

    try {
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
          ? { viewTransitionName: getViewTransitionName('card', viewTransitionSlug) }
          : undefined;

      // Card content wrapper - conditionally render with or without motion animations
      const cardElement = (
        <CardComponent
          className={`${disableNavigation ? '' : UI_CLASSES.CARD_INTERACTIVE} ${variant === 'detailed' ? UI_CLASSES.CARD_PADDING_DEFAULT : ''} ${variant === 'review' ? `rounded-lg border ${UI_CLASSES.CARD_PADDING_COMPACT}` : ''} ${compactMode ? UI_CLASSES.CARD_PADDING_COMPACT : ''} ${className || ''} relative`}
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
            <div
              className={`${POSITION_PATTERNS.ABSOLUTE_TOP_FULL} h-px bg-border opacity-70 transition-opacity group-hover:opacity-100`}
            />
          )}

          <CardHeaderComponent
            className={`${variant === 'review' ? `${UI_CLASSES.MARGIN_COMPACT} p-0` : 'pb-3'} ${compactMode ? UI_CLASSES.CARD_HEADER_TIGHT : ''}`}
          >
            {/* Custom header slot (for review avatar/rating, changelog date) */}
            {renderHeader?.()}

            {/* Standard header (config/collection cards) */}
            {!renderHeader && (
              <div className={'flex items-start justify-between'}>
                <div className="flex-1">
                  {/* Top badges slot (type, difficulty, sponsored, etc.) */}
                  {renderTopBadges && (
                    <div className={`mb-1 flex items-center ${UI_CLASSES.SPACE_COMPACT}`}>
                      {renderTopBadges()}
                    </div>
                  )}

                  {/* Title */}
                  <CardTitleComponent
                    className={`${UI_CLASSES.TEXT_CARD_TITLE} text-foreground ${disableNavigation ? '' : 'transition-colors-smooth group-hover:text-accent'}`}
                  >
                    {displayTitle}
                  </CardTitleComponent>

                  {/* Description */}
                  {description && (
                    <CardDescriptionComponent className={'mt-1 line-clamp-2 text-muted-foreground text-sm'}>
                      {description}
                    </CardDescriptionComponent>
                  )}
                </div>

                {/* Source badge (right side of header) */}
                {source && (
                  <div className={`ml-2 flex items-center ${UI_CLASSES.SPACE_TIGHT}`}>
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
          </CardHeaderComponent>

          <CardContentComponent
            className={`${variant === 'review' ? 'p-0' : 'pt-0'} ${compactMode ? 'pt-0' : ''}`}
          >
            {/* Custom content slot (for review expandable text) */}
            {renderContent && <div className={UI_CLASSES.MARGIN_COMPACT}>{renderContent()}</div>}

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className={UI_CLASSES.CARD_BADGE_CONTAINER}>
                {visibleTags?.map((tag: string, index: number) => {
                  // Use highlighted tag if available, otherwise use original
                  const highlightedTag = highlightedTags?.[index];
                  const tagToRender = highlightedTag?.highlighted;
                  // UnifiedBadge tag variant renders props.tag, but we can override with children
                  // If we have highlighted content, render it as children
                  if (tagToRender && typeof tagToRender !== 'string') {
                    // For highlighted tags, we need to render the ReactNode
                    // UnifiedBadge will use children if provided, otherwise props.tag
                    return (
                      <UnifiedBadge key={tag} variant="tag" tag={tag}>
                        {tagToRender}
                      </UnifiedBadge>
                    );
                  }
                  // No highlighting - use default rendering
                  return <UnifiedBadge key={tag} variant="tag" tag={tag} />;
                })}
                {overflowCount > 0 && (
                  <UnifiedBadge
                    variant="base"
                    style="outline"
                    className={`${UI_CLASSES.BADGE_METADATA} ${UI_CLASSES.TEXT_BADGE}`}
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
                <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} ${UI_CLASSES.TEXT_METADATA}`}>
                  {showAuthor && author && (
                    <span>
                      by{' '}
                      <a
                        href={authorProfileUrl || SOCIAL_LINK_SNAPSHOT.authorProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-foreground hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {typeof author === 'string' ? author : author}
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
          </CardContentComponent>
        </CardComponent>
      );

      // Wrap card with hover animation if navigation is enabled
      const motionCard = disableNavigation ? (
        cardElement
      ) : (
        <HoverCard variant="gentle" disabled={disableNavigation}>
          {cardElement}
        </HoverCard>
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
          <SponsoredPulse
            sponsoredId={sponsoredId}
            targetUrl={`${APP_CONFIG.url}${targetPath}`}
            position={position}
            pageUrl={typeof window !== 'undefined' ? window.location.href : undefined}
          >
            {cardContent}
          </SponsoredPulse>
        );
      }

      return cardContent;
    } catch (error) {
      const normalized = normalizeError(error, 'BaseCard: Rendering failed');
      logger.warn({ err: normalized,
        category: 'render',
        component: 'BaseCard',
        recoverable: true,
        targetPath,
        hasTitle: Boolean(displayTitle), }, '[Render] BaseCard rendering failed');
      // Return a minimal fallback
      return (
        <div className="rounded-lg border p-4" role="article" aria-label={ariaLabel}>
          <h3 className="font-semibold">{displayTitle}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      );
    }
  }
);

BaseCard.displayName = 'BaseCard';
