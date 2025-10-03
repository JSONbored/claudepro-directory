'use client';

/**
 * CollectionCard Component
 *
 * Displays a collection of related content items with metadata and actions.
 * Follows the same design pattern as ConfigCard for consistency.
 *
 * Features:
 * - Shows collection type, difficulty, and item count
 * - Displays estimated setup time
 * - Interactive copy and view actions
 * - Responsive layout with accessibility
 * - Analytics tracking for user interactions
 *
 * @see components/features/content/config-card.tsx - Base card pattern
 */

import { memo } from 'react';
import { CardCopyAction } from '@/src/components/shared/card-copy-action';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { SourceBadge, TagBadge } from '@/src/components/ui/config-badge';
import { useCardNavigation } from '@/src/hooks/use-card-navigation';
import { Clock, Layers } from '@/src/lib/icons';
import type { CollectionContent } from '@/src/lib/schemas/content/collection.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { getDisplayTitle } from '@/src/lib/utils';

/**
 * CollectionCard Props
 *
 * Supports both metadata-only (for list pages) and full content (for detail pages).
 * When items are not provided, displays item count as 0 or hides the count.
 */
export interface CollectionCardProps {
  /** Collection content item to display (supports both metadata and full content) */
  item:
    | CollectionContent
    | (Omit<CollectionContent, 'items'> & { items?: CollectionContent['items'] });
  /** Display variant (default or detailed) */
  variant?: 'default' | 'detailed';
  /** Show action buttons (copy, view) */
  showActions?: boolean;
}

/**
 * Difficulty badge variant mapping
 */
const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
} as const;

/**
 * Collection type label mapping
 */
const COLLECTION_TYPE_LABELS = {
  'starter-kit': 'Starter Kit',
  workflow: 'Workflow',
  'advanced-system': 'Advanced System',
  'use-case': 'Use Case',
} as const;

/**
 * CollectionCard component
 *
 * Displays a collection card with metadata, tags, and interactive actions.
 * Follows accessibility best practices with ARIA labels and keyboard navigation.
 */
export const CollectionCard = memo(
  ({ item, variant = 'default', showActions = true }: CollectionCardProps) => {
    const displayTitle = getDisplayTitle(item);
    const targetPath = `/collections/${item.slug}`;
    const itemCount = item.items?.length || 0;

    const { handleCardClick, handleKeyDown, handleActionClick } = useCardNavigation(targetPath);

    return (
      <Card
        className={`${UI_CLASSES.CARD_INTERACTIVE} ${variant === 'detailed' ? 'p-6' : ''}`}
        onClick={handleCardClick}
        role="article"
        aria-label={`${displayTitle} - ${COLLECTION_TYPE_LABELS[item.collectionType]} collection by ${item.author}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <CardHeader className="pb-3">
          <div
            className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.JUSTIFY_BETWEEN}`}
          >
            <div className={UI_CLASSES.FLEX_1}>
              {/* Collection Type & Difficulty Badges */}
              <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-2 mb-2`}>
                <Badge
                  variant="outline"
                  className={`${UI_CLASSES.TEXT_XS} border-blue-500/20 bg-blue-500/10 text-blue-400`}
                >
                  <Layers className="h-3 w-3 mr-1" aria-hidden="true" />
                  {COLLECTION_TYPE_LABELS[item.collectionType]}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${UI_CLASSES.TEXT_XS} ${DIFFICULTY_COLORS[item.difficulty]}`}
                >
                  {item.difficulty}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${UI_CLASSES.TEXT_XS} border-muted-foreground/20 text-muted-foreground`}
                >
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </Badge>
              </div>

              <CardTitle
                className={`${UI_CLASSES.TEXT_LG} font-semibold text-foreground ${UI_CLASSES.HOVER_TEXT_ACCENT}`}
              >
                {displayTitle}
              </CardTitle>
              <CardDescription
                className={`text-sm text-muted-foreground mt-1 ${UI_CLASSES.LINE_CLAMP_2}`}
              >
                {item.description}
              </CardDescription>
            </div>
            {item.source && (
              <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-1 ml-2`}>
                <SourceBadge source={item.source} />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Tags */}
          <div className={`${UI_CLASSES.FLEX_WRAP_GAP_1} ${UI_CLASSES.MB_4}`}>
            {item.tags?.slice(0, 4).map((tag: string) => (
              <TagBadge key={tag} tag={tag} />
            ))}
            {item.tags && item.tags.length > 4 && (
              <Badge
                variant="outline"
                className={`${UI_CLASSES.TEXT_XS} border-muted-foreground/20 text-muted-foreground`}
              >
                +{item.tags.length - 4}
              </Badge>
            )}
          </div>

          {/* Metadata & Actions */}
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            <div
              className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-2 ${UI_CLASSES.TEXT_XS} text-muted-foreground`}
            >
              <span>by {item.author}</span>
              {item.estimatedSetupTime && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {item.estimatedSetupTime}
                  </span>
                </>
              )}
            </div>

            {showActions && (
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                <CardCopyAction
                  url={`${typeof window !== 'undefined' ? window.location.origin : ''}${targetPath}`}
                  category="collections"
                  slug={item.slug}
                  title={displayTitle}
                  componentName="collection-card"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                  onClick={handleActionClick}
                  aria-label={`View collection details for ${displayTitle}`}
                >
                  View Collection
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

CollectionCard.displayName = 'CollectionCard';
