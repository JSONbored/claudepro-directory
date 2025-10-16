'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/src/components/ui/badge';
import { Card } from '@/src/components/ui/card';
import {
  trackRelatedContentClick,
  trackRelatedContentView,
} from '@/src/lib/analytics/events/related-content';
import { Sparkles } from '@/src/lib/icons';
import type {
  RelatedCarouselClientProps,
  RelatedContentItem,
} from '@/src/lib/schemas/related-content.schema';
import type { ContentCategory } from '@/src/lib/schemas/shared.schema';
import { getContentItemUrl } from '@/src/lib/utils/content.utils';

export function RelatedCarouselClient({
  items,
  performance,
  trackingEnabled = true,
  className = '',
  showTitle = true,
  title = 'Related Content',
}: RelatedCarouselClientProps) {
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track view when component comes into viewport
  useEffect(() => {
    if (!trackingEnabled || hasTrackedView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          trackRelatedContentView(window.location.pathname, items.length, performance.cacheHit);
          setHasTrackedView(true);
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [trackingEnabled, hasTrackedView, items.length, performance.cacheHit]);

  // Handle item click - memoized to prevent recreation on every render
  const handleItemClick = useCallback(
    (item: RelatedContentItem, index: number) => {
      if (!trackingEnabled) return;

      // Generate URL from category and slug using centralized helper
      const itemUrl = getContentItemUrl({
        category: item.category as ContentCategory,
        slug: item.slug,
      });

      // Track click event with source-specific analytics
      trackRelatedContentClick(
        window.location.pathname,
        itemUrl,
        index + 1,
        item.score,
        item.matchType
      );
    },
    [trackingEnabled]
  );

  // Get match type badge color - memoized as it's a pure function
  const getMatchTypeBadge = useMemo(
    () => (matchType: string) => {
      const badges: Record<
        string,
        { label: string; variant: 'default' | 'secondary' | 'outline' }
      > = {
        same_category: { label: 'Related', variant: 'default' },
        tag_match: { label: 'Similar Topics', variant: 'secondary' },
        keyword_match: { label: 'Keyword', variant: 'secondary' }, // Short label to prevent overflow
        trending: { label: 'Trending', variant: 'default' },
        popular: { label: 'Popular', variant: 'default' },
        cross_category: { label: 'Recommended', variant: 'outline' },
      };

      return badges[matchType] || { label: 'Related', variant: 'outline' };
    },
    []
  );

  // Use existing color scheme from config-badge.tsx - memoized as it's a pure function
  const getCategoryStyles = useMemo(
    () =>
      (category: string): { badge: string; border: string; accent: string } => {
        const styles: Record<string, { badge: string; border: string; accent: string }> = {
          agents: {
            badge: 'badge-category-agents',
            border:
              'border-[var(--color-category-agents-border)] hover:border-[var(--color-category-agents-hover)]',
            accent: 'from-[var(--color-category-agents)] to-[var(--color-category-agents)]',
          },
          mcp: {
            badge: 'badge-category-mcp',
            border:
              'border-[var(--color-category-mcp-border)] hover:border-[var(--color-category-mcp-hover)]',
            accent: 'from-[var(--color-category-mcp)] to-[var(--color-category-mcp)]',
          },
          rules: {
            badge: 'badge-category-rules',
            border:
              'border-[var(--color-category-rules-border)] hover:border-[var(--color-category-rules-hover)]',
            accent: 'from-[var(--color-category-rules)] to-[var(--color-category-rules)]',
          },
          commands: {
            badge: 'badge-category-commands',
            border:
              'border-[var(--color-category-commands-border)] hover:border-[var(--color-category-commands-hover)]',
            accent: 'from-[var(--color-category-commands)] to-[var(--color-category-commands)]',
          },
          hooks: {
            badge: 'badge-category-hooks',
            border:
              'border-[var(--color-category-hooks-border)] hover:border-[var(--color-category-hooks-hover)]',
            accent: 'from-[var(--color-category-hooks)] to-[var(--color-category-hooks)]',
          },
          tutorials: {
            badge: 'badge-category-tutorials',
            border:
              'border-[var(--color-category-tutorials-border)] hover:border-[var(--color-category-tutorials-hover)]',
            accent: 'from-[var(--color-category-tutorials)] to-[var(--color-category-tutorials)]',
          },
          comparisons: {
            badge: 'bg-primary/20 text-primary border-primary/30',
            border: 'border-primary/30 hover:border-primary/60',
            accent: 'from-primary to-primary/80',
          },
          workflows: {
            badge: 'badge-category-workflows',
            border:
              'border-[var(--color-category-workflows-border)] hover:border-[var(--color-category-workflows-hover)]',
            accent: 'from-[var(--color-category-workflows)] to-[var(--color-category-workflows)]',
          },
          'use-cases': {
            badge: 'badge-category-use-cases',
            border:
              'border-[var(--color-category-use-cases-border)] hover:border-[var(--color-category-use-cases-hover)]',
            accent: 'from-[var(--color-category-use-cases)] to-[var(--color-category-use-cases)]',
          },
          troubleshooting: {
            badge: 'badge-category-troubleshooting',
            border:
              'border-[var(--color-category-troubleshooting-border)] hover:border-[var(--color-category-troubleshooting-hover)]',
            accent:
              'from-[var(--color-category-troubleshooting)] to-[var(--color-category-troubleshooting)]',
          },
        };

        return (
          styles[category as keyof typeof styles] || {
            badge: 'bg-muted/20 text-muted border-muted/30',
            border: 'border-muted/30 hover:border-muted/60',
            accent: 'from-muted to-muted/80',
          }
        );
      },
    []
  );

  if (items.length === 0) return null;

  return (
    <section
      ref={containerRef}
      itemScope
      itemType="https://schema.org/ItemList"
      className={`my-12 ${className}`}
    >
      {showTitle && (
        <div
          className={
            'mb-8 p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl'
          }
        >
          <div
            className={
              'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'
            }
          >
            <div className={'flex items-center gap-3 sm:gap-4'}>
              <div className={'p-2 bg-primary/10 rounded-lg flex-shrink-0'}>
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h2
                  className={'text-xl sm:text-2xl font-bold text-foreground mb-1'}
                  itemProp="name"
                >
                  {title}
                </h2>
                <p className={'text-xs sm:text-sm text-muted-foreground'}>
                  Intelligently curated based on your current content
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={
                'bg-primary/10 text-primary border-primary/30 font-medium px-2 sm:px-3 py-1 text-xs sm:text-sm flex-shrink-0'
              }
            >
              AI Powered
            </Badge>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {items.map((item, index) => {
          const matchBadge = getMatchTypeBadge(item.matchType);
          const categoryStyles = getCategoryStyles(item.category);

          return (
            <Card
              key={`${item.category}-${item.slug}`}
              itemScope
              itemType="https://schema.org/ListItem"
              className={`group relative border-2 ${categoryStyles.border} bg-card hover:shadow-xl hover:shadow-current/5 transition-all duration-300 h-full overflow-hidden flex flex-col`}
            >
              {/* Colored gradient accent line based on category */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${categoryStyles.accent} opacity-70 group-hover:opacity-100 transition-opacity`}
              />

              <Link
                href={getContentItemUrl({
                  category: item.category as ContentCategory,
                  slug: item.slug,
                })}
                onClick={() => handleItemClick(item, index)}
                className={
                  'block flex-1 p-4 sm:p-6 hover:bg-accent/20 transition-colors flex flex-col'
                }
              >
                <div className={'flex items-start justify-between gap-2 mb-4'}>
                  <Badge
                    className={`${categoryStyles.badge} font-medium px-2 sm:px-3 py-1 border text-xs sm:text-sm flex-shrink-0`}
                    variant="secondary"
                  >
                    {item.category}
                  </Badge>
                  <Badge
                    variant={matchBadge.variant}
                    className={
                      'text-2xs sm:text-xs font-medium border px-1.5 sm:px-2 py-1 group-hover:border-current/40 transition-colors flex-shrink-0'
                    }
                    title={matchBadge.label === 'Keyword' ? 'Keyword Match' : matchBadge.label}
                  >
                    {matchBadge.label}
                  </Badge>
                </div>

                <div className={'flex-1 flex flex-col'}>
                  <h3
                    className={
                      'text-base sm:text-lg font-bold leading-tight line-clamp-2 mb-3 group-hover:text-current transition-colors'
                    }
                    itemProp="name"
                  >
                    {item.title}
                  </h3>

                  <p
                    className={
                      'text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3 mb-4 text-xs sm:text-sm flex-1'
                    }
                    itemProp="description"
                  >
                    {item.description}
                  </p>
                </div>

                {item.matchDetails?.matchedTags && item.matchDetails.matchedTags.length > 0 && (
                  <div className={'pt-3 border-t border-border/30 mt-auto'}>
                    <div className="flex flex-wrap gap-1">
                      {item.matchDetails.matchedTags.slice(0, 2).map((tag: string) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className={
                            'text-2xs sm:text-xs bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 transition-colors px-1.5 sm:px-2 py-1'
                          }
                        >
                          {tag}
                        </Badge>
                      ))}
                      {item.matchDetails.matchedTags.length > 2 && (
                        <Badge
                          variant="outline"
                          className={
                            'text-2xs sm:text-xs bg-muted/50 text-muted-foreground border-muted px-1.5 sm:px-2 py-1'
                          }
                        >
                          +{item.matchDetails.matchedTags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
