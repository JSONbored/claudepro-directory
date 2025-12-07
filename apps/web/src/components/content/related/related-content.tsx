'use client';

/**
 * Related Content - Client-side fetching with UnifiedCardGrid
 */

import { type Database } from '@heyclaude/database-types';
import { getContentItemUrl, isValidCategory } from '@heyclaude/web-runtime/core';
import { getRelatedContent } from '@heyclaude/web-runtime/data';
import { Sparkles } from '@heyclaude/web-runtime/icons';
import { logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { UI_CLASSES, UnifiedBadge, UnifiedCardGrid, BaseCard } from '@heyclaude/web-runtime/ui';
import { useEffect, useState } from 'react';

// Use the generated composite type directly
type RelatedContentItemWithUI = Database['public']['CompositeTypes']['related_content_item'] & {
  matchDetails?: {
    matchedKeywords: string[];
    matchedTags: string[];
  };
  matchType?: string;
};

export interface SmartRelatedContentProps {
  currentKeywords?: string[];
  currentTags?: string[];
  exclude?: string[];
  featured?: boolean;
  limit?: number;
  pathname?: string;
  showTitle?: boolean;
  title?: string;
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

  return classes[category] || 'bg-muted/20 text-muted border-muted/30';
}

function getMatchTypeBadge(matchType: string): {
  label: string;
  variant: 'default' | 'outline' | 'secondary';
} {
  const badges: Record<string, { label: string; variant: 'default' | 'outline' | 'secondary' }> = {
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
  const pathPart = pathname.split('/').find(Boolean);
  return pathPart || 'unknown';
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
    providedPathname ?? (globalThis.window === undefined ? '/' : globalThis.location.pathname);

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
        logClientError(
          '[Content] Failed to fetch related content',
          normalizeError(error, 'Failed to fetch related content'),
          'RelatedContentClient.fetchRelatedContent',
          {
            component: 'RelatedContentClient',
            action: 'fetch-related-content',
            category: 'content',
          }
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedContent().catch((error) => {
      logClientError(
        '[Content] Related content fetch promise rejected',
        normalizeError(error, 'Related content fetch promise rejected'),
        'RelatedContentClient.fetchRelatedContent',
        {
          component: 'RelatedContentClient',
          action: 'fetch-related-content',
          category: 'content',
        }
      );
    });
  }, [pathname, currentTags, currentKeywords, featured, exclude, limit]);

  return (
    <section
      itemScope
      itemType="https://schema.org/ItemList"
      className="my-12"
      aria-label="Related content"
    >
      {showTitle ? (
        <div className="border-primary/20 from-primary/5 to-primary/10 mb-8 rounded-xl border bg-linear-to-r p-4 sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-primary/10 shrink-0 rounded-lg p-2">
                <Sparkles className={`${UI_CLASSES.ICON_MD} text-primary sm:h-6 sm:w-6`} />
              </div>
              <div className="min-w-0">
                <h2 className="text-foreground mb-1 text-xl font-bold sm:text-2xl" itemProp="name">
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
              className="shrink-0 border-primary/30 bg-primary/10 text-primary px-2 py-1 text-xs font-medium sm:px-3 sm:text-sm"
            >
              AI Powered
            </UnifiedBadge>
          </div>
        </div>
      ) : null}

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
              topAccent
              compactMode
              ariaLabel={`Related: ${relatedItem.title}`}
              renderTopBadges={() => (
                <div className="flex w-full items-center justify-between gap-2">
                  <UnifiedBadge
                    className={`${categoryBadge} shrink-0 border px-2 py-1 text-xs font-medium sm:px-3 sm:text-sm`}
                    variant="base"
                    style="secondary"
                  >
                    {relatedItem.category ?? 'unknown'}
                  </UnifiedBadge>
                  <div title={matchBadge.label === 'Keyword' ? 'Keyword Match' : matchBadge.label}>
                    <UnifiedBadge
                      variant="base"
                      style={matchBadge.variant}
                      className="text-2xs shrink-0 border px-1.5 py-1 font-medium sm:px-2 sm:text-xs"
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
