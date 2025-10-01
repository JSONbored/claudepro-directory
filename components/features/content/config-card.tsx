'use client';

import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { toast } from 'sonner';
import { trackCopy } from '@/app/actions/track-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SourceBadge, TagBadge, TypeBadge } from '@/components/ui/config-badge';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { SOCIAL_LINKS } from '@/lib/constants';
import { Check, Copy, ExternalLink, Github } from '@/lib/icons';
import type { ConfigCardProps } from '@/lib/schemas/component.schema';
import { UI_CLASSES } from '@/lib/ui-constants';
import { getDisplayTitle } from '@/lib/utils';

export const ConfigCard = memo(
  ({ item, variant = 'default', showCategory = true, showActions = true }: ConfigCardProps) => {
    const router = useRouter();
    const displayTitle = getDisplayTitle(item);

    // Map types to their actual route paths - fixed routing
    const targetPath = `/${item.category}/${item.slug}`;

    const { copied, copy } = useCopyToClipboard({
      onSuccess: () => {
        // Track copy action for analytics (silent fail)
        trackCopy(item.category || '', item.slug).catch(() => {
          // Silent fail - don't break UX
        });

        toast.success('Link copied!', {
          description: 'The config link has been copied to your clipboard.',
        });
      },
      onError: () => {
        toast.error('Failed to copy', {
          description: 'Could not copy the link to clipboard.',
        });
      },
      context: {
        component: 'config-card',
        action: 'copy-link',
      },
    });

    const handleCopy = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await copy(`${window.location.origin}${targetPath}`);
    };

    const handleViewConfig = (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(targetPath);
    };

    const handleCardClick = () => {
      router.push(targetPath);
    };

    return (
      <Card
        className={`${UI_CLASSES.CARD_INTERACTIVE} ${variant === 'detailed' ? 'p-6' : ''}`}
        onClick={handleCardClick}
        role="article"
        aria-label={`${displayTitle} - ${item.category} by ${item.author}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
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
              {item.popularity !== undefined && (
                <>
                  <span>•</span>
                  <span>{item.popularity}% popular</span>
                </>
              )}
            </div>

            {showActions && (
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
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

                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-7 p-0 ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                  onClick={handleCopy}
                  aria-label={copied ? 'Link copied to clipboard' : `Copy link to ${displayTitle}`}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3 w-3" aria-hidden="true" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                  onClick={handleViewConfig}
                  aria-label={`View details for ${displayTitle}`}
                >
                  View
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

ConfigCard.displayName = 'ConfigCard';
