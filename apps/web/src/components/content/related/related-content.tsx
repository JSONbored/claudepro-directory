'use client';

/**
 * Related Content - Client-side fetching with UnifiedCardGrid
 */

import type { Database } from '@heyclaude/database-types';
import {
  alignItems,
  bgColor,
  bgGradient,
  borderColor,
  cluster,
  display,
  flexDir,
  flexGrow,
  gap,
  gradientFrom,
  gradientTo,
  iconSize,
  justify,
  marginBottom,
  muted,
  padding,
  paddingLeft,
  radius,
  size,
  textColor,
  weight,
  width,
  marginY,
  minWidth,
  border,
} from '@heyclaude/web-runtime/design-system';
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
    comparisons: `${bgColor['primary/20']} ${textColor.primary} ${borderColor['primary/30']}`,
    workflows: 'badge-category-workflows',
    'use-cases': 'badge-category-use-cases',
    troubleshooting: 'badge-category-troubleshooting',
  };

  return classes[category as keyof typeof classes] || `${bgColor['muted/20']} ${textColor.muted} ${borderColor['border/30']}`;
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
      className={marginY.section}
      aria-label="Related content"
    >
      {showTitle && (
        <div className={`${marginBottom.relaxed} ${radius.xl} ${border.default} ${borderColor['primary/20']} ${bgGradient.toR} ${gradientFrom.primary5} ${gradientTo.primary10} ${padding.default} sm:${padding.comfortable}`}>
          <div className={`${display.flex} ${flexDir.col} ${alignItems.start} ${justify.between} ${gap.comfortable} sm:${display.flex}-row sm:${alignItems.center}`}>
            <div className={`${cluster.default} sm:${gap.comfortable}`}>
              <div className={`${flexGrow.shrink0} ${radius.lg} ${bgColor['primary/10']} ${padding.tight}`}>
                <Sparkles className={`${iconSize.md} ${textColor.primary} sm:${iconSize.lg} sm:${iconSize.lg}`} />
              </div>
              <div className={minWidth[0]}>
                <h2 className={`${marginBottom.micro} ${weight.bold} ${textColor.foreground} ${size.xl} sm:${size['2xl']}`} itemProp="name">
                  {title}
                </h2>
                <p className={`${muted.default} ${size.xs} sm:${size.sm}`}>
                  Intelligently curated based on your current content
                </p>
              </div>
            </div>
            <UnifiedBadge
              variant="base"
              style="secondary"
              className={`${flexGrow.shrink0} ${borderColor['primary/30']} ${bgColor['primary/10']} ${padding.xTight} ${padding.yMicro} ${weight.medium} ${textColor.primary} ${size.xs} sm:${paddingLeft.default} sm:${size.sm}`}
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
                <div className={`${display.flex} ${width.full} ${alignItems.center} ${justify.between} ${gap.compact}`}>
                  <UnifiedBadge
                    className={`${categoryBadge} ${flexGrow.shrink0} ${border.default} ${padding.xTight} ${padding.yMicro} ${weight.medium} ${size.xs} sm:${paddingLeft.default} sm:${size.sm}`}
                    variant="base"
                    style="secondary"
                  >
                    {relatedItem.category ?? 'unknown'}
                  </UnifiedBadge>
                  <div title={matchBadge.label === 'Keyword' ? 'Keyword Match' : matchBadge.label}>
                    <UnifiedBadge
                      variant="base"
                      style={matchBadge.variant}
                      className={`${flexGrow.shrink0} ${border.default} ${padding.xSnug} ${padding.yMicro} ${weight.medium} ${size['2xs']} sm:${paddingLeft.compact} sm:${size.xs}`}
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