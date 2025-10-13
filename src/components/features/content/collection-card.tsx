'use client';

/**
 * CollectionCard Component - Refactored to use BaseCard
 *
 * Displays a collection of related content items with metadata and actions.
 * Now leverages BaseCard for consistent structure and reduced duplication.
 *
 * Refactoring Benefits:
 * - Eliminates ~80 lines of duplicated code
 * - Leverages BaseCard for shared structure
 * - Maintains all existing features (difficulty badges, item counts, setup time)
 * - Easier to maintain and extend
 *
 * @see components/shared/base-card.tsx - Base card pattern
 */

import { memo } from 'react';
import { BaseCard } from '@/src/components/shared/base-card';
import { BookmarkButton } from '@/src/components/shared/bookmark-button';
import { CardCopyAction } from '@/src/components/shared/card-copy-action';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Clock, Copy as CopyIcon, Eye, Layers } from '@/src/lib/icons';
import type { CollectionContent } from '@/src/lib/schemas/content/collection.schema';
import { BADGE_COLORS, CARD_BEHAVIORS, UI_CLASSES } from '@/src/lib/ui-constants';
import { getDisplayTitle } from '@/src/lib/utils';
import { formatCopyCount, formatViewCount } from '@/src/lib/utils/content.utils';

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
    | (Omit<CollectionContent, 'items'> & {
        items?: CollectionContent['items'];
      });
  /** Display variant (default or detailed) */
  variant?: 'default' | 'detailed';
  /** Show action buttons (copy, view) */
  showActions?: boolean;
}

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

    // Get behavior configuration for collections
    const behavior = CARD_BEHAVIORS.collections;

    // Extract view/copy counts
    const viewCount = (item as { viewCount?: number }).viewCount;
    const copyCount = (item as { copyCount?: number }).copyCount;

    return (
      <BaseCard
        targetPath={targetPath}
        displayTitle={displayTitle}
        description={item.description}
        author={item.author}
        {...(item.source && { source: item.source })}
        {...(item.tags && { tags: item.tags })}
        variant={variant}
        showActions={showActions}
        ariaLabel={`${displayTitle} - ${COLLECTION_TYPE_LABELS[item.collectionType]} collection by ${item.author}`}
        // Custom render slots
        renderTopBadges={() => (
          <>
            {/* Collection Type Badge */}
            <Badge
              variant="outline"
              className={`${UI_CLASSES.TEXT_XS} border-blue-500/20 bg-blue-500/10 text-blue-400`}
            >
              <Layers className="h-3 w-3 mr-1" aria-hidden="true" />
              {COLLECTION_TYPE_LABELS[item.collectionType]}
            </Badge>

            {/* Difficulty Badge */}
            <Badge
              variant="outline"
              className={`${UI_CLASSES.TEXT_XS} ${BADGE_COLORS.difficulty[item.difficulty]}`}
            >
              {item.difficulty}
            </Badge>

            {/* Item Count Badge */}
            <Badge
              variant="outline"
              className={`${UI_CLASSES.TEXT_XS} border-muted-foreground/20 text-muted-foreground`}
            >
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Badge>
          </>
        )}
        renderMetadataBadges={() => (
          <>
            {/* View count badge */}
            {behavior.showViewCount && viewCount !== undefined && (
              <Badge
                variant="secondary"
                className="h-7 px-2.5 gap-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs">{formatViewCount(viewCount)}</span>
              </Badge>
            )}

            {/* Copy count badge */}
            {behavior.showCopyCount && copyCount !== undefined && copyCount > 0 && (
              <Badge
                variant="secondary"
                className="h-7 px-2.5 gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/15 transition-colors font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <CopyIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs">{formatCopyCount(copyCount)}</span>
              </Badge>
            )}
          </>
        )}
        renderActions={() => (
          <>
            <BookmarkButton contentType="collections" contentSlug={item.slug} />

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
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = targetPath;
              }}
              aria-label={`View collection details for ${displayTitle}`}
            >
              View Collection
            </Button>
          </>
        )}
        customMetadataText={
          <>
            {/* Estimated setup time */}
            {item.estimatedSetupTime && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {item.estimatedSetupTime}
                </span>
              </>
            )}
          </>
        }
      />
    );
  }
);

CollectionCard.displayName = 'CollectionCard';
