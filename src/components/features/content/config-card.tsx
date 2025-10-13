'use client';

/**
 * ConfigCard Component - Refactored to use BaseCard
 *
 * Displays configuration content (agents, mcp, commands, rules, hooks, guides)
 * with consistent card structure using BaseCard component.
 *
 * Refactoring Benefits:
 * - Eliminates ~100 lines of duplicated code
 * - Leverages BaseCard for shared structure
 * - Maintains all existing features (sponsored tracking, view counts, etc.)
 * - Easier to maintain and extend
 */

import { memo } from 'react';
import { StarRatingCompact } from '@/src/components/features/reviews/star-rating';
import { BaseCard } from '@/src/components/shared/base-card';
import { BookmarkButton } from '@/src/components/shared/bookmark-button';
import { CardCopyAction } from '@/src/components/shared/card-copy-action';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { TypeBadge } from '@/src/components/ui/config-badge';
import { BorderBeam } from '@/src/components/ui/magic/border-beam';
import { SponsoredBadge } from '@/src/components/ui/sponsored-badge';
import {
  Award,
  Copy as CopyIcon,
  ExternalLink,
  Eye,
  Github,
  Layers,
  Sparkles,
} from '@/src/lib/icons';
import type { ConfigCardProps } from '@/src/lib/schemas/component.schema';
import { BADGE_COLORS, CARD_BEHAVIORS, UI_CLASSES } from '@/src/lib/ui-constants';
import { getDisplayTitle } from '@/src/lib/utils';
import { formatCopyCount, formatViewCount, getContentItemUrl } from '@/src/lib/utils/content.utils';

export const ConfigCard = memo(
  ({ item, variant = 'default', showCategory = true, showActions = true }: ConfigCardProps) => {
    const displayTitle = getDisplayTitle(item);
    const targetPath = getContentItemUrl(item);

    // Get behavior configuration for this content type
    const behavior =
      CARD_BEHAVIORS[item.category as keyof typeof CARD_BEHAVIORS] || CARD_BEHAVIORS.default;

    // Extract sponsored metadata
    const isSponsored = (item as { isSponsored?: boolean }).isSponsored;
    const sponsoredId = (item as { sponsoredId?: string }).sponsoredId;
    const sponsorTier = (item as { sponsorTier?: string }).sponsorTier;
    const position = (item as { position?: number }).position;
    const viewCount = (item as { viewCount?: number }).viewCount;
    const copyCount = (item as { copyCount?: number }).copyCount;

    // Extract featured metadata (weekly algorithm selection)
    const featuredData = (item as { _featured?: { rank: number; score: number } })._featured;
    const isFeatured = !!featuredData;
    const featuredRank = featuredData?.rank;

    // Extract rating metadata (if available)
    const ratingData = (item as { _rating?: { average: number; count: number } })._rating;
    const hasRating = ratingData && ratingData.count > 0;

    // Extract collection-specific metadata (tree-shakeable - only loaded for collections)
    const isCollection = item.category === 'collections';
    const collectionType = isCollection
      ? (item as { collectionType?: 'starter-kit' | 'workflow' | 'advanced-system' | 'use-case' })
          .collectionType
      : undefined;
    const collectionDifficulty = isCollection
      ? (item as { difficulty?: 'beginner' | 'intermediate' | 'advanced' }).difficulty
      : undefined;
    const itemCount = isCollection ? (item as { itemCount?: number }).itemCount : undefined;

    // Collection type label mapping (tree-shakeable)
    const COLLECTION_TYPE_LABELS = isCollection
      ? {
          'starter-kit': 'Starter Kit',
          workflow: 'Workflow',
          'advanced-system': 'Advanced System',
          'use-case': 'Use Case',
        }
      : undefined;

    return (
      <div className="relative">
        {/* Border Beam for #1 Featured Items */}
        {isFeatured && featuredRank === 1 && (
          <BorderBeam
            size={200}
            duration={8}
            colorFrom="#ffaa40"
            colorTo="#ffd700"
            borderWidth={1.5}
          />
        )}

        <BaseCard
          targetPath={targetPath}
          displayTitle={displayTitle}
          description={item.description}
          author={item.author}
          {...(item.source && { source: item.source })}
          {...(item.tags && { tags: item.tags })}
          variant={variant}
          showActions={showActions}
          ariaLabel={`${displayTitle} - ${item.category} by ${item.author}`}
          {...(isSponsored && { isSponsored })}
          {...(sponsoredId && { sponsoredId })}
          {...(position !== undefined && { position })}
          // Custom render slots
          renderTopBadges={() => (
            <>
              {showCategory && (
                <TypeBadge
                  type={
                    (item.category || 'agents') as
                      | 'hooks'
                      | 'agents'
                      | 'mcp'
                      | 'rules'
                      | 'commands'
                      | 'guides'
                      | 'collections'
                  }
                />
              )}

              {/* Collection-specific badges (tree-shakeable) */}
              {isCollection && collectionType && COLLECTION_TYPE_LABELS && (
                <Badge
                  variant="outline"
                  className={`${UI_CLASSES.TEXT_XS} ${BADGE_COLORS.collectionType[collectionType]}`}
                >
                  <Layers className="h-3 w-3 mr-1" aria-hidden="true" />
                  {COLLECTION_TYPE_LABELS[collectionType]}
                </Badge>
              )}

              {isCollection && collectionDifficulty && (
                <Badge
                  variant="outline"
                  className={`${UI_CLASSES.TEXT_XS} ${BADGE_COLORS.difficulty[collectionDifficulty]}`}
                >
                  {collectionDifficulty}
                </Badge>
              )}

              {isCollection && itemCount !== undefined && (
                <Badge
                  variant="outline"
                  className={`${UI_CLASSES.TEXT_XS} border-muted-foreground/20 text-muted-foreground`}
                >
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </Badge>
              )}

              {/* Featured badge - weekly algorithm selection */}
              {isFeatured && (
                <Badge
                  variant="secondary"
                  className="gap-1 border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-600 dark:text-amber-400 hover:from-amber-500/15 hover:to-yellow-500/15 transition-all duration-300 shadow-sm hover:shadow-md font-semibold animate-in fade-in slide-in-from-top-2"
                >
                  {featuredRank && featuredRank <= 3 ? (
                    <Award className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Featured
                  {featuredRank && <span className="text-xs opacity-75">#{featuredRank}</span>}
                </Badge>
              )}
              {isSponsored && sponsorTier && (
                <SponsoredBadge
                  tier={sponsorTier as 'featured' | 'promoted' | 'spotlight'}
                  showIcon={true}
                />
              )}
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

              {/* Copy count badge - social proof for engagement */}
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

              {/* Rating badge - shows average rating and count */}
              {behavior.showRating && hasRating && ratingData && (
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  className="bg-transparent border-0 p-0 cursor-default"
                >
                  <StarRatingCompact
                    average={ratingData.average}
                    count={ratingData.count}
                    size="sm"
                  />
                </button>
              )}
            </>
          )}
          renderActions={() => (
            <>
              {item.repository && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-7 p-0 ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(item.repository, '_blank');
                  }}
                  aria-label={`View ${displayTitle} repository on GitHub`}
                >
                  <Github className="h-3 w-3" aria-hidden="true" />
                </Button>
              )}

              {item.documentationUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-7 p-0 ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(item.documentationUrl, '_blank');
                  }}
                  aria-label={`View ${displayTitle} documentation`}
                >
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </Button>
              )}

              <BookmarkButton contentType={item.category || 'agents'} contentSlug={item.slug} />

              {behavior.showCopyButton && (
                <CardCopyAction
                  url={`${typeof window !== 'undefined' ? window.location.origin : ''}${targetPath}`}
                  category={item.category || ''}
                  slug={item.slug}
                  title={displayTitle}
                  componentName="config-card"
                />
              )}

              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = targetPath;
                }}
                aria-label={`View details for ${displayTitle}`}
              >
                View
              </Button>
            </>
          )}
          customMetadataText={
            <>
              {/* Show static popularity if no view count */}
              {viewCount === undefined && item.popularity !== undefined && (
                <>
                  <span>•</span>
                  <span>{item.popularity}% popular</span>
                </>
              )}
            </>
          }
        />
      </div>
    );
  }
);

ConfigCard.displayName = 'ConfigCard';
