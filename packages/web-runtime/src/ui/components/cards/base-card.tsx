'use client';

/**
 * BaseCard Component
 *
 * Reusable card component that eliminates duplication between ConfigCard and CollectionCard.
 * Provides a composition-based architecture with customizable slots.
 *
 * Architecture:
 * - Client-side only (uses hooks, motion)
 * - Accepts app-specific primitives as optional props (Card, HoverCard)
 * - Uses web-runtime utilities (navigation, badges, view transitions)
 * - Structured logging for errors
 * - Performance optimized with React.memo
 *
 * Features:
 * - Shared card structure and navigation logic
 * - Customizable badge, action, and metadata slots
 * - Integrated useCardNavigation hook
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

import { getViewTransitionName, cn } from '../../utils.ts';
import { UnifiedBadge } from '../badges/unified-badge.tsx';
import { SwipeableCardWrapper } from './swipeable-card.tsx';
import { motion } from 'motion/react';
import { MICROINTERACTIONS } from '../../../design-system/index.ts';
import { useReducedMotion } from '../../../hooks/motion/index.ts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../card.tsx';
import {
  type UseCardNavigationOptions,
  useCardNavigation,
} from '../../../hooks/use-card-navigation.ts';
// COLORS removed - border colors handled via className
// useTheme removed - reserved for future use
import { logger } from '../../../logger.ts';
import { normalizeError } from '../../../errors.ts';
import type { ReactNode, HTMLAttributes } from 'react';
import { memo } from 'react';

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

    // Detect current theme for semantic color tokens (currently unused, reserved for future use)
    // const theme = useTheme();
    const shouldReduceMotion = useReducedMotion();

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

      // Card content - shared between both CardComponent and motion.div
      const cardContent = (
        <>
          {/* Top accent border for related content */}
          {topAccent && (
            <div className="bg-border absolute top-0 right-0 left-0 h-px opacity-70 transition-opacity group-hover:opacity-100" />
          )}

          <CardHeaderComponent
            className={`${variant === 'review' ? 'mb-2 p-0' : 'pb-3'} ${compactMode ? 'pb-1' : ''}`}
          >
            {/* Custom header slot (for review avatar/rating, changelog date) */}
            {renderHeader?.()}

            {/* Standard header (config/collection cards) */}
            {!renderHeader && (
              <div className={'flex items-start justify-between overflow-visible'}>
                <div className="flex-1 overflow-visible">
                  {/* Top badges slot (type, difficulty, sponsored, etc.) */}
                  {renderTopBadges && (
                    <div className="mb-1 flex flex-wrap items-center gap-2 overflow-visible">
                      {renderTopBadges()}
                    </div>
                  )}

                  {/* Title */}
                  <CardTitleComponent
                    className={`text-foreground text-lg font-semibold ${disableNavigation ? '' : 'transition-colors-smooth'}`}
                  >
                    {displayTitle}
                  </CardTitleComponent>

                  {/* Description */}
                  {description && (
                    <CardDescriptionComponent
                      className={'text-muted-foreground mt-1 line-clamp-2 text-sm'}
                    >
                      {description}
                    </CardDescriptionComponent>
                  )}
                </div>

                {/* Source badge (right side of header) */}
                {source && (
                  <div className="ml-2 flex items-center gap-1">
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
            {renderContent && <div className="mb-2">{renderContent()}</div>}

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
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
                    className="border-muted-foreground/20 text-muted-foreground text-xs font-semibold"
                  >
                    +{overflowCount}
                  </UnifiedBadge>
                )}
              </div>
            )}

            {/* Footer: Metadata and Actions */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              {/* Left side: Author and custom metadata */}
              {(showAuthor && author) || customMetadataText ? (
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  {showAuthor &&
                    author &&
                    (() => {
                      // Only show profile link if authorProfileUrl is explicitly provided
                      // Don't fallback to default - if no profile URL exists, don't show a link
                      if (authorProfileUrl) {
                        // Check if this is an internal user profile link
                        const isInternalProfile = authorProfileUrl.startsWith('/u/');

                        return (
                          <span>
                            by{' '}
                            {isInternalProfile ? (
                              <a
                                href={authorProfileUrl}
                                className="hover:text-foreground transition-colors hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {typeof author === 'string' ? author : author}
                              </a>
                            ) : (
                              <a
                                href={authorProfileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-foreground transition-colors hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {typeof author === 'string' ? author : author}
                              </a>
                            )}
                          </span>
                        );
                      }

                      // No profile URL - just show author name without link
                      return <span>by {typeof author === 'string' ? author : author}</span>;
                    })()}
                  {customMetadataText}
                </div>
              ) : (
                <div />
              )}

              {/* Right side: Metadata badges and actions */}
              <div className="flex flex-nowrap items-center gap-2 text-xs">
                {/* Metadata badges slot (view count, item count, etc.) */}
                {renderMetadataBadges?.()}

                {/* Action buttons slot */}
                {showActions && renderActions?.()}
              </div>
            </div>
          </CardContentComponent>
        </>
      );

      // Card wrapper - apply motion animations directly using design system tokens
      // For non-navigation cards, use CardComponent. For interactive cards, use motion.div with Card styling
      // Motion.dev handles hover border color via whileHover - no CSS hover classes needed
      // Base classes: layout, border width, background, text - border color comes from CARD_INTERACTIVE for interactive cards
      const cardClassName = cn(
        // Base card styles
        'flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm',
        // Border color: explicit for non-interactive, provided by card-gradient for interactive
        disableNavigation && 'border-border/50',
        // Interactive card styles (hover effects, cursor, etc.)
        !disableNavigation &&
          'card-gradient transition-smooth group cursor-pointer border-border/50',
        // Variant-specific styles
        variant === 'detailed' && 'p-6',
        variant === 'review' && 'rounded-lg border border-border/50 p-4',
        // Compact mode
        compactMode && 'p-4',
        // Custom className prop
        className,
        // Always relative for positioning
        'relative'
      );

      const cardElement = disableNavigation ? (
        <CardComponent
          className={cardClassName}
          style={{
            ...viewTransitionStyle,
            contain: 'layout style',
          }}
          role="article"
          aria-label={ariaLabel}
        >
          {cardContent}
        </CardComponent>
      ) : (
        <motion.div
          className={cardClassName}
          style={{
            ...viewTransitionStyle,
            // Border color handled via className (NO inline styles)
            // 3D transform support for forward tilt animation
            perspective: '1000px',
            transformStyle: 'preserve-3d',
          }}
          initial={false}
          whileHover={
            shouldReduceMotion
              ? {}
              : {
                  ...MICROINTERACTIONS.card.hover,
                  // Border color on hover handled via className (NO inline styles)
                }
          }
          whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.card.tap}
          transition={MICROINTERACTIONS.card.transition}
          onClick={handleCardClick}
          role="article"
          aria-label={ariaLabel}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          data-slot="card"
        >
          {cardContent}
        </motion.div>
      );

      // Optionally wrap with swipeable gestures for mobile quick actions
      const finalCardContent = enableSwipeGestures ? (
        <SwipeableCardWrapper
          onSwipeRight={onSwipeRight}
          onSwipeLeft={onSwipeLeft}
          enableGestures={enableSwipeGestures}
        >
          {cardElement}
        </SwipeableCardWrapper>
      ) : (
        cardElement
      );

      return finalCardContent;
    } catch (error) {
      const normalized = normalizeError(error, 'BaseCard: Rendering failed');
      logger.warn(
        {
          err: normalized,
          category: 'render',
          component: 'BaseCard',
          recoverable: true,
          targetPath,
          hasTitle: Boolean(displayTitle),
        },
        '[Render] BaseCard rendering failed'
      );
      // Return a minimal fallback
      return (
        <div className="rounded-lg border p-4" role="article" aria-label={ariaLabel}>
          <h3 className="font-semibold">{displayTitle}</h3>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      );
    }
  }
);

BaseCard.displayName = 'BaseCard';
