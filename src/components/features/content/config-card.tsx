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
import { BaseCard } from '@/src/components/shared/base-card';
import { BookmarkButton } from '@/src/components/shared/bookmark-button';
import { CardCopyAction } from '@/src/components/shared/card-copy-action';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { TypeBadge } from '@/src/components/ui/config-badge';
import { SponsoredBadge } from '@/src/components/ui/sponsored-badge';
import { ExternalLink, Eye, Github } from '@/src/lib/icons';
import type { ConfigCardProps } from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { getDisplayTitle } from '@/src/lib/utils';
import { formatViewCount } from '@/src/lib/utils/transformers';

export const ConfigCard = memo(
  ({ item, variant = 'default', showCategory = true, showActions = true }: ConfigCardProps) => {
    const displayTitle = getDisplayTitle(item);
    const targetPath = `/${item.category}/${item.slug}`;

    // Extract sponsored metadata
    const isSponsored = (item as { isSponsored?: boolean }).isSponsored;
    const sponsoredId = (item as { sponsoredId?: string }).sponsoredId;
    const sponsorTier = (item as { sponsorTier?: string }).sponsorTier;
    const position = (item as { position?: number }).position;
    const viewCount = (item as { viewCount?: number }).viewCount;

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
                }
              />
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
            {/* View count badge - prominent on bottom right */}
            {viewCount !== undefined && (
              <Badge
                variant="secondary"
                className="h-7 px-2.5 gap-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-xs">{formatViewCount(viewCount)}</span>
              </Badge>
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

            <CardCopyAction
              url={`${typeof window !== 'undefined' ? window.location.origin : ''}${targetPath}`}
              category={item.category || ''}
              slug={item.slug}
              title={displayTitle}
              componentName="config-card"
            />

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
    );
  }
);

ConfigCard.displayName = 'ConfigCard';
