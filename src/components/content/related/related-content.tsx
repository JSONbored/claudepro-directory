'use client';

/**
 * Related Content - Client-side fetching with UnifiedCardGrid
 */

import { useEffect, useState } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { UnifiedCardGrid } from '@/src/components/core/domain/cards/card-grid';
import { BaseCard } from '@/src/components/core/domain/cards/content-card-base';
import { isValidCategory } from '@/src/lib/data/config/category';
import { getRelatedContent } from '@/src/lib/data/content/related';
import { Sparkles } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { getContentItemUrl } from '@/src/lib/utils/content.utils';
import type { Database } from '@/src/types/database.types';

// Use the generated composite type directly
type RelatedContentItemWithUI = Database['public']['CompositeTypes']['related_content_item'] & {
  matchType?: string;
  matchDetails?: {
    matchedTags: string[];
    matchedKeywords: string[];
  };
};

export interface SmartRelatedContentProps {
  pathname?: string;
  currentTags?: string[];
  currentKeywords?: string[];
  featured?: boolean;
  exclude?: string[];
  limit?: number;
  title?: string;
  showTitle?: boolean;
}

function getCategoryBadgeClass(category: string): string {
  const classes: Record<string, string> = {
    agents: 'badge-category-agents',
    mcp: 'badge-category-mcp',
    rules: 'badge-category-rules',
    commands: 'badge-category-commands',
    hooks: 'badge-category-hooks',
    tutorials: 'badge-category-tutorials',
    comparisons: 'bg-primary/20 text-primary border-primary/30',
    workflows: 'badge-category-workflows',
    'use-cases': 'badge-category-use-cases',
    troubleshooting: 'badge-category-troubleshooting',
  };

  return classes[category as keyof typeof classes] || 'bg-muted/20 text-muted border-muted/30';
}

function getMatchTypeBadge(matchType: string): {
  label: string;
  variant: 'default' | 'secondary' | 'outline';
} {
  const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    same_category: { label: 'Related', variant: 'default' },
    tag_match: { label: 'Similar Topics', variant: 'secondary' },
    keyword_match: { label: 'Keyword', variant: 'secondary' },
    trending: { label: 'Trending', variant: 'default' },
    popular: { label: 'Popular', variant: 'default' },
    cross_category: { label: 'Recommended', variant: 'outline' },
  };

  return badges[matchType] || { label: 'Related', variant: 'outline' };
}

function getCategoryFromPath(pathname: string | undefined): string {
  if (!pathname) return 'unknown';
  const pathParts = pathname.split('/').filter(Boolean);
  return pathParts[0] || 'unknown';
}

export function RelatedContentClient({
  featured = false,
  exclude = [],
  limit = 3,
  currentTags = [],
  currentKeywords = [],
  pathname: providedPathname,
  title = 'Related Content',
  showTitle = true,
}: SmartRelatedContentProps) {
  const [items, setItems] = useState<RelatedContentItemWithUI[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname: string =
    providedPathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');

  useEffect(() => {
    const fetchRelatedContent = async () => {
      try {
        const response = await getRelatedContent({
          currentPath: pathname,
          currentCategory: getCategoryFromPath(pathname),
          currentTags,
          currentKeywords,
          featured,
          exclude,
          limit,
        });

        const convertedItems: RelatedContentItemWithUI[] = (response.items || [])
          .filter((item) => Boolean(item.category && item.slug && item.title))
          .map((item): RelatedContentItemWithUI => {
            const result: RelatedContentItemWithUI = {
              category: item.category,
              slug: item.slug,
              title: item.title,
              description: item.description,
              author: item.author,
              date_added: item.date_added,
              tags: item.tags,
              score: item.score,
              match_type: item.match_type,
              views: item.views,
              matched_tags: item.matched_tags,
            };
            if (item.match_type !== null && item.match_type !== undefined) {
              result.matchType = item.match_type;
            }
            result.matchDetails = {
              matchedTags: item.matched_tags ?? [],
              matchedKeywords: [],
            };
            return result;
          });

        setItems(convertedItems);
      } catch (error) {
        logger.error(
          'Failed to fetch related content',
          error instanceof Error ? error : new Error(String(error)),
          { source: 'RelatedContentClient' }
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedContent().catch((error) => {
      logger.error(
        'Related content fetch promise rejected',
        error instanceof Error ? error : new Error(String(error)),
        { source: 'RelatedContentClient' }
      );
    });
  }, [pathname, currentTags, currentKeywords, featured, exclude, limit]);

  return (
    <section
      itemScope={true}
      itemType="https://schema.org/ItemList"
      className="my-12"
      aria-label="Related content"
    >
      {showTitle && (
        <div className="mb-8 rounded-xl border border-primary/20 bg-linear-to-r from-primary/5 to-primary/10 p-4 sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="shrink-0 rounded-lg bg-primary/10 p-2">
                <Sparkles className={`${UI_CLASSES.ICON_MD} text-primary sm:h-6 sm:w-6`} />
              </div>
              <div className="min-w-0">
                <h2 className="mb-1 font-bold text-foreground text-xl sm:text-2xl" itemProp="name">
                  {title}
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Intelligently curated based on your current content
                </p>
              </div>
            </div>
            <UnifiedBadge
              variant="base"
              style="secondary"
              className="shrink-0imary/30 bg-primary/10 px-2 py-1 font-medium text-primary text-xs sm:px-3 sm:text-sm"
            >
              AI Powered
            </UnifiedBadge>
          </div>
        </div>
      )}

      <UnifiedCardGrid
        items={items}
        variant="tight"
        loading={loading}
        emptyMessage="No related content available"
        loadingMessage="Finding related content..."
        renderCard={(item) => {
          const relatedItem = item as RelatedContentItemWithUI;
          const matchBadge = getMatchTypeBadge(relatedItem.matchType ?? 'unknown');
          const categoryBadge = getCategoryBadgeClass(relatedItem.category ?? 'unknown');

          return (
            <BaseCard
              key={`${relatedItem.category}-${relatedItem.slug}`}
              targetPath={getContentItemUrl({
                category: isValidCategory(relatedItem.category ?? 'agents')
                  ? (relatedItem.category ?? 'agents')
                  : 'agents',
                slug: relatedItem.slug ?? '',
              })}
              displayTitle={relatedItem.title ?? relatedItem.slug ?? ''}
              description={relatedItem.description ?? undefined}
              tags={relatedItem.matchDetails?.matchedTags?.slice(0, 2) ?? []}
              topAccent={true}
              compactMode={true}
              ariaLabel={`Related: ${relatedItem.title}`}
              renderTopBadges={() => (
                <div className="flex w-full items-center justify-between gap-2">
                  <UnifiedBadge
                    className={`${categoryBadge} shrink-0 border px-2 py-1 font-medium text-xs sm:px-3 sm:text-sm`}
                    variant="base"
                    style="secondary"
                  >
                    {relatedItem.category ?? 'unknown'}
                  </UnifiedBadge>
                  <div title={matchBadge.label === 'Keyword' ? 'Keyword Match' : matchBadge.label}>
                    <UnifiedBadge
                      variant="base"
                      style={matchBadge.variant}
                      className="shrink-0 border px-1.5 py-1 font-medium text-2xs sm:px-2 sm:text-xs"
                    >
                      {matchBadge.label}
                    </UnifiedBadge>
                  </div>
                </div>
              )}
            />
          );
        }}
      />
    </section>
  );
}
