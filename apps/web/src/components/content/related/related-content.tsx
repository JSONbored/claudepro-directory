'use client';

/**
 * Related Content - Client-side fetching with UnifiedCardGrid
 */

import type { Database } from '@heyclaude/database-types';
import { iconSize, cluster, marginBottom, weight, muted ,size , padding , gap , radius } from '@heyclaude/web-runtime/design-system';
import { getContentItemUrl, isValidCategory, logger, normalizeError } from '@heyclaude/web-runtime/core';
import { getRelatedContent } from '@heyclaude/web-runtime/data';
import { Sparkles } from '@heyclaude/web-runtime/icons';
import { useEffect, useState } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { UnifiedCardGrid } from '@heyclaude/web-runtime/ui';
import { BaseCard } from '@heyclaude/web-runtime/ui';

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

/**
 * Extracts the first path segment from a pathname to determine the content category.
 *
 * @param pathname - A URL pathname (may include leading/trailing slashes). If `undefined`, it is treated as missing.
 * @returns The first non-empty segment from `pathname` (the category), or `'unknown'` if no segment is available.
 *
 * @see getRelatedContent
 * @see RelatedContentClient
 */
function getCategoryFromPath(pathname: string | undefined): string {
  if (!pathname) return 'unknown';
  const pathParts = pathname.split('/').filter(Boolean);
  return pathParts[0] || 'unknown';
}

/**
 * Renders a related content section that fetches and displays a curated grid of related items.
 *
 * Fetching is driven by the provided pathname, tags, keywords, and filtering flags; the component
 * displays an optional titled header and a unified card grid with category and match-type badges.
 *
 * @param featured - When true, prioritize featured related items.
 * @param exclude - Array of slugs to exclude from results.
 * @param limit - Maximum number of related items to display.
 * @param currentTags - Tags from the current content used to influence relatedness.
 * @param currentKeywords - Keywords from the current content used to influence relatedness.
 * @param pathname - Optional explicit pathname to use when resolving the current category; falls back to window location when omitted.
 * @param title - Header title text for the related content section.
 * @param showTitle - When true, render the section header.
 *
 * @returns The section element containing the related content list and card grid.
 *
 * @see getRelatedContent
 * @see getCategoryFromPath
 * @see UnifiedCardGrid
 */
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
          normalizeError(error, 'Failed to fetch related content'),
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
        normalizeError(error, 'Related content fetch promise rejected'),
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
        <div className={`${marginBottom.relaxed} rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 ${padding.default} sm:p-6`}>
          <div className={`flex flex-col items-start justify-between ${gap.comfortable} sm:flex-row sm:items-center`}>
            <div className={`${cluster.default} sm:${gap.comfortable}`}>
              <div className={`shrink-0 ${radius.lg} bg-primary/10 ${padding.tight}`}>
                <Sparkles className={`${iconSize.md} text-primary sm:h-6 sm:w-6`} />
              </div>
              <div className="min-w-0">
                <h2 className={`${marginBottom.micro} ${weight.bold} text-foreground ${size.xl} sm:${size['2xl']}`} itemProp="name">
                  {title}
                </h2>
                <p className={`${muted.default} ${size.xs} sm:text-sm`}>
                  Intelligently curated based on your current content
                </p>
              </div>
            </div>
            <UnifiedBadge
              variant="base"
              style="secondary"
              className={`shrink-0imary/30 bg-primary/10 ${padding.xTight} ${padding.yMicro} ${weight.medium} text-primary ${size.xs} sm:px-3 sm:text-sm`}
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
                <div className={`flex w-full items-center justify-between ${gap.compact}`}>
                  <UnifiedBadge
                    className={`${categoryBadge} shrink-0 border ${padding.xTight} ${padding.yMicro} ${weight.medium} ${size.xs} sm:px-3 sm:text-sm`}
                    variant="base"
                    style="secondary"
                  >
                    {relatedItem.category ?? 'unknown'}
                  </UnifiedBadge>
                  <div title={matchBadge.label === 'Keyword' ? 'Keyword Match' : matchBadge.label}>
                    <UnifiedBadge
                      variant="base"
                      style={matchBadge.variant}
                      className={`shrink-0 border ${padding.xSnug} ${padding.yMicro} ${weight.medium} text-2xs sm:px-2 sm:text-xs`}
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