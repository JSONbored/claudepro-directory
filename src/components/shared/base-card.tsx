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
 *
 * Architecture:
 * - Composition over inheritance (render props pattern)
 * - Type-safe props with TypeScript
 * - Follows existing UI_CLASSES constants
 * - Maintains existing shadcn/ui Card patterns
 *
 * @module components/shared/base-card
 */

import type { ReactNode } from 'react';
import { memo } from 'react';
import { SponsoredTracker } from '@/src/components/features/sponsored/sponsored-tracker';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { UnifiedBadge } from '@/src/components/ui/unified-badge';
import { type UseCardNavigationOptions, useCardNavigation } from '@/src/hooks/use-card-navigation';
import { SOCIAL_LINKS } from '@/src/lib/constants';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
  }: BaseCardProps) => {
    const navigationParam: string | UseCardNavigationOptions | undefined =
      disableNavigation || !targetPath
        ? undefined
        : onBeforeNavigate
          ? {
              path: targetPath,
              onBeforeNavigate,
            }
          : targetPath;

    const { handleCardClick, handleKeyDown } = useCardNavigation(
      navigationParam as string | UseCardNavigationOptions
    );

    // Calculate visible and overflow tags
    const visibleTags = tags?.slice(0, maxVisibleTags);
    const overflowCount = tags && tags.length > maxVisibleTags ? tags.length - maxVisibleTags : 0;

    const cardContent = (
      <Card
        className={`${disableNavigation ? '' : UI_CLASSES.CARD_INTERACTIVE} ${variant === 'detailed' ? 'p-6' : ''} ${variant === 'review' ? 'p-4 rounded-lg border' : ''} ${className || ''}`}
        onClick={disableNavigation ? undefined : handleCardClick}
        role="article"
        aria-label={ariaLabel}
        tabIndex={disableNavigation ? undefined : 0}
        onKeyDown={disableNavigation ? undefined : handleKeyDown}
      >
        <CardHeader className={variant === 'review' ? 'p-0 mb-3' : 'pb-3'}>
          {/* Custom header slot (for review avatar/rating, changelog date) */}
          {renderHeader?.()}

          {/* Standard header (config/collection cards) */}
          {!renderHeader && (
            <div className={'flex items-start justify-between'}>
              <div className="flex-1">
                {/* Top badges slot (type, difficulty, sponsored, etc.) */}
                {renderTopBadges && (
                  <div className={'flex items-center gap-2 mb-1'}>{renderTopBadges()}</div>
                )}

                {/* Title */}
                <CardTitle
                  className={`text-lg font-semibold text-foreground ${disableNavigation ? '' : 'group-hover:text-accent transition-colors-smooth'}`}
                >
                  {displayTitle}
                </CardTitle>

                {/* Description */}
                {description && (
                  <CardDescription className={'text-sm text-muted-foreground mt-1 line-clamp-2'}>
                    {description}
                  </CardDescription>
                )}
              </div>

              {/* Source badge (right side of header) */}
              {source && (
                <div className={'flex items-center gap-1 ml-2'}>
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

        <CardContent className={variant === 'review' ? 'p-0' : 'pt-0'}>
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
                  className={'text-xs border-muted-foreground/20 text-muted-foreground'}
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
              <div className={'flex items-center gap-2 text-xs text-muted-foreground'}>
                {showAuthor && author && (
                  <span>
                    by{' '}
                    <a
                      href={SOCIAL_LINKS.authorProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:text-foreground transition-colors"
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

    // Wrap in sponsored tracker if this is sponsored content
    if (isSponsored && sponsoredId && targetPath) {
      return (
        <SponsoredTracker
          sponsoredId={sponsoredId}
          targetUrl={`https://claudepro.directory${targetPath}`}
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
