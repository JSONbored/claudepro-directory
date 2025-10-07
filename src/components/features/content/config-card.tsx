'use client';

import { memo } from 'react';
import { BookmarkButton } from '@/src/components/shared/bookmark-button';
import { CardCopyAction } from '@/src/components/shared/card-copy-action';
import { SponsoredTracker } from '@/src/components/features/sponsored/sponsored-tracker';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { SourceBadge, TagBadge, TypeBadge } from '@/src/components/ui/config-badge';
import { SponsoredBadge } from '@/src/components/ui/sponsored-badge';
import { useCardNavigation } from '@/src/hooks/use-card-navigation';
import { SOCIAL_LINKS } from '@/src/lib/constants';
import { ExternalLink, Eye, Github } from '@/src/lib/icons';
import type { ConfigCardProps } from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { getDisplayTitle } from '@/src/lib/utils';
import { formatViewCount } from '@/src/lib/utils/transformers';

export const ConfigCard = memo(
  ({ item, variant = 'default', showCategory = true, showActions = true }: ConfigCardProps) => {
    const displayTitle = getDisplayTitle(item);
    const targetPath = `/${item.category}/${item.slug}`;

    const { handleCardClick, handleKeyDown, handleActionClick } = useCardNavigation(targetPath);

    // Check if this item is sponsored
    const isSponsored = (item as { isSponsored?: boolean }).isSponsored;
    const sponsoredId = (item as { sponsoredId?: string }).sponsoredId;
    const sponsorTier = (item as { sponsorTier?: string }).sponsorTier;

    const cardContent = (
      <Card
        className={`${UI_CLASSES.CARD_INTERACTIVE} ${variant === 'detailed' ? 'p-6' : ''}`}
        onClick={handleCardClick}
        role="article"
        aria-label={`${displayTitle} - ${item.category} by ${item.author}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <CardHeader className="pb-3">
          <div
            className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.JUSTIFY_BETWEEN}`}
          >
            <div className={UI_CLASSES.FLEX_1}>
              {showCategory && (
                <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-2 mb-1`}>
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
                  {/* Show sponsored badge if item is sponsored */}
                  {isSponsored && sponsorTier && (
                    <SponsoredBadge
                      tier={sponsorTier as 'featured' | 'promoted' | 'spotlight'}
                      showIcon={true}
                    />
                  )}
                </div>
              )}
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

          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
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
                  {item.author}
                </a>
              </span>
              {/* Show static popularity if no view count */}
              {(item as { viewCount?: number }).viewCount === undefined &&
                item.popularity !== undefined && (
                  <>
                    <span>•</span>
                    <span>{item.popularity}% popular</span>
                  </>
                )}
            </div>

            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
              {/* View count badge - prominent on bottom right */}
              {(item as { viewCount?: number }).viewCount !== undefined && (
                <Badge
                  variant="secondary"
                  className="h-7 px-2.5 gap-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="text-xs">
                    {formatViewCount((item as { viewCount?: number }).viewCount!)}
                  </span>
                </Badge>
              )}

              {showActions && (
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
                    onClick={handleActionClick}
                    aria-label={`View details for ${displayTitle}`}
                  >
                    View
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );

    // Wrap in sponsored tracker if this is a sponsored item
    if (isSponsored && sponsoredId) {
      return (
        <SponsoredTracker
          sponsoredId={sponsoredId}
          targetUrl={`https://claudepro.directory${targetPath}`}
          position={(item as { position?: number }).position}
        >
          {cardContent}
        </SponsoredTracker>
      );
    }

    return cardContent;
  }
);

ConfigCard.displayName = 'ConfigCard';
