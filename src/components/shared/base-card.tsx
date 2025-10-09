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
import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { SourceBadge, TagBadge } from '@/src/components/ui/config-badge';
import { useCardNavigation } from '@/src/hooks/use-card-navigation';
import { SOCIAL_LINKS } from '@/src/lib/constants';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Props for BaseCard component
 */
export interface BaseCardProps {
  /**
   * Target path for card navigation
   * @example "/agents/code-reviewer"
   */
  targetPath: string;

  /**
   * Display title for the card
   */
  displayTitle: string;

  /**
   * Card description text
   */
  description: string;

  /**
   * Author name
   */
  author: string;

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
   * Display variant (default or detailed)
   * @default "default"
   */
  variant?: 'default' | 'detailed';

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
   * Custom render function for top badges
   * (e.g., TypeBadge, CollectionTypeBadge, DifficultyBadge)
   */
  renderTopBadges?: () => ReactNode;

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
    renderTopBadges,
    renderMetadataBadges,
    renderActions,
    customMetadataText,
    isSponsored,
    sponsoredId,
    position,
    onBeforeNavigate,
    className,
  }: BaseCardProps) => {
    const { handleCardClick, handleKeyDown } = useCardNavigation(
      onBeforeNavigate
        ? {
            path: targetPath,
            onBeforeNavigate,
          }
        : targetPath
    );

    // Calculate visible and overflow tags
    const visibleTags = tags?.slice(0, maxVisibleTags);
    const overflowCount = tags && tags.length > maxVisibleTags ? tags.length - maxVisibleTags : 0;

    const cardContent = (
      <Card
        className={`${UI_CLASSES.CARD_INTERACTIVE} ${variant === 'detailed' ? 'p-6' : ''} ${className || ''}`}
        onClick={handleCardClick}
        role="article"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <CardHeader className="pb-3">
          <div
            className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.JUSTIFY_BETWEEN}`}
          >
            <div className={UI_CLASSES.FLEX_1}>
              {/* Top badges slot (type, difficulty, sponsored, etc.) */}
              {renderTopBadges && (
                <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-2 mb-1`}>
                  {renderTopBadges()}
                </div>
              )}

              {/* Title */}
              <CardTitle
                className={`${UI_CLASSES.TEXT_LG} font-semibold text-foreground ${UI_CLASSES.HOVER_TEXT_ACCENT}`}
              >
                {displayTitle}
              </CardTitle>

              {/* Description */}
              <CardDescription
                className={`text-sm text-muted-foreground mt-1 ${UI_CLASSES.LINE_CLAMP_2}`}
              >
                {description}
              </CardDescription>
            </div>

            {/* Source badge (right side of header) */}
            {source && (
              <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-1 ml-2`}>
                <SourceBadge source={source} />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className={`${UI_CLASSES.FLEX_WRAP_GAP_1} ${UI_CLASSES.MB_4}`}>
              {visibleTags?.map((tag: string) => (
                <TagBadge key={tag} tag={tag} />
              ))}
              {overflowCount > 0 && (
                <Badge
                  variant="outline"
                  className={`${UI_CLASSES.TEXT_XS} border-muted-foreground/20 text-muted-foreground`}
                >
                  +{overflowCount}
                </Badge>
              )}
            </div>
          )}

          {/* Footer: Metadata and Actions */}
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            {/* Left side: Author and custom metadata */}
            <div
              className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-2 ${UI_CLASSES.TEXT_XS} text-muted-foreground`}
            >
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
              {customMetadataText}
            </div>

            {/* Right side: Metadata badges and actions */}
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
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
    if (isSponsored && sponsoredId) {
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
