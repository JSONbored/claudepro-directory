'use client';

/**
 * Related Content - Client-side fetching with UnifiedCardGrid
 */

import type { RelatedContentItem } from '@heyclaude/database-types/postgres-types';
import type { content_category } from '@heyclaude/data-layer/prisma';
import { getContentItemUrl } from '@heyclaude/web-runtime/content';
import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';
import { getRelatedContent } from '@heyclaude/web-runtime/data/content/related';
import { Sparkles } from '@heyclaude/web-runtime/icons';
import { logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { UnifiedBadge, UnifiedCardGrid, BaseCard, deepEqual, cn } from '@heyclaude/web-runtime/ui';
import { useIsClient } from '@heyclaude/web-runtime/hooks/use-is-client';
import { useIsMounted } from '@heyclaude/web-runtime/hooks/use-is-mounted';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';
import { useEffect, useState, useRef } from 'react';

// Use the new composite type from @heyclaude/data-layer
type RelatedContentItemWithUI = RelatedContentItem & {
  matchDetails?: {
    matchedKeywords: string[];
    matchedTags: string[];
  } | undefined;
  matchType?: string | undefined;
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

/**
 * Choose the CSS class string to use for a category badge.
 *
 * @param category - The category key (e.g., "agents", "tutorials") to map to a badge class
 * @returns The CSS class string for the given category; a muted/default class is returned when the category is unrecognized
 *
 * @see getCategoryFromPath
 */
function getCategoryBadgeClass(category: string): string {
  const classes: Record<string, string> = {
    agents: 'bg-transparent text-category-agents border-category-agents-border font-semibold',
    mcp: 'bg-transparent text-category-mcp border-category-mcp-border font-semibold',
    rules: 'bg-transparent text-category-rules border-category-rules-border font-semibold',
    commands: 'bg-transparent text-category-commands border-category-commands-border font-semibold',
    hooks: 'bg-transparent text-category-hooks border-category-hooks-border font-semibold',
    tutorials: 'bg-transparent text-category-tutorials border-category-tutorials-border font-semibold',
    comparisons: 'bg-primary/20 text-primary border-primary/30',
    workflows: 'bg-transparent text-category-workflows border-category-workflows-border font-semibold',
    'use-cases': 'bg-transparent text-category-use-cases border-category-use-cases-border font-semibold',
    troubleshooting: 'bg-transparent text-category-troubleshooting border-category-troubleshooting-border font-semibold',
  };

  return classes[category] || 'bg-muted/20 text-muted border-muted/30';
}

/**
 * Map a match-type identifier to a badge label and visual variant.
 *
 * @param matchType - Identifier describing how the item matched (e.g. "same_category", "tag_match", "keyword_match", "trending", "popular", "cross_category")
 * @returns An object with `label` for display and `variant` which is one of `'default' | 'outline' | 'secondary'`. Returns `{ label: 'Related', variant: 'outline' }` when `matchType` is unrecognized.
 */
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

/**
 * Extracts the first non-empty path segment from a URL pathname as the category.
 *
 * @param pathname - The URL pathname (for example "/agents/list" or "agents/list"); may be undefined.
 * @returns The first non-empty path segment if present, otherwise "unknown".
 */
function getCategoryFromPath(pathname: string | undefined): string {
  if (!pathname) return 'unknown';
  const pathPart = pathname.split('/').find(Boolean);
  return pathPart || 'unknown';
}

/**
 * Renders a client-side related content list with UI badges and compact cards.
 *
 * Fetches related content for the current path (or a provided pathname), converts API items into a UI-ready shape, logs fetch errors, and displays results using UnifiedCardGrid and BaseCard with category and match-type badges.
 *
 * @param props.featured - When true, restricts results to featured content.
 * @param props.exclude - Slugs or identifiers to exclude from results.
 * @param props.limit - Maximum number of related items to fetch and render.
 * @param props.currentTags - Tags from the current context used to compute relatedness.
 * @param props.currentKeywords - Keywords from the current context used to compute relatedness.
 * @param props.pathname - Optional explicit pathname to use instead of the current window location.
 * @param props.title - Heading text to show above the related items; defaults to "Related Content".
 * @param props.showTitle - When true, renders the title block and AI badge.
 * @returns A React element containing the related content section with cards and badges.
 *
 * @see getRelatedContent
 * @see UnifiedCardGrid
 * @see BaseCard
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
  const { value: loading, setFalse: setLoadingFalse } = useBoolean(true);
  const isClient = useIsClient();
  const isMounted = useIsMounted();
  const pathname: string =
    providedPathname ?? (isClient ? window.location.pathname : '/');

  // Use refs to track previous values and prevent unnecessary re-fetches
  // Only trigger effect when values actually change (deep comparison)
  const prevExcludeRef = useRef<typeof exclude>(exclude);
  const prevCurrentTagsRef = useRef<typeof currentTags>(currentTags);
  const prevCurrentKeywordsRef = useRef<typeof currentKeywords>(currentKeywords);
  const prevPathnameRef = useRef(pathname);
  const prevFeaturedRef = useRef(featured);
  const prevLimitRef = useRef(limit);

  useEffect(() => {
    // Check if any dependency has actually changed using deep equality
    // This prevents unnecessary API calls when arrays/objects are recreated with same content
    const excludeChanged = !deepEqual(prevExcludeRef.current, exclude);
    const currentTagsChanged = !deepEqual(prevCurrentTagsRef.current, currentTags);
    const currentKeywordsChanged = !deepEqual(prevCurrentKeywordsRef.current, currentKeywords);
    const pathnameChanged = prevPathnameRef.current !== pathname;
    const featuredChanged = prevFeaturedRef.current !== featured;
    const limitChanged = prevLimitRef.current !== limit;

    // Skip fetch if nothing has changed
    if (!excludeChanged && !currentTagsChanged && !currentKeywordsChanged && !pathnameChanged && !featuredChanged && !limitChanged) {
      return;
    }

    // Update refs when values change
    if (excludeChanged) {
      prevExcludeRef.current = exclude;
    }
    if (currentTagsChanged) {
      prevCurrentTagsRef.current = currentTags;
    }
    if (currentKeywordsChanged) {
      prevCurrentKeywordsRef.current = currentKeywords;
    }
    if (pathnameChanged) {
      prevPathnameRef.current = pathname;
    }
    if (featuredChanged) {
      prevFeaturedRef.current = featured;
    }
    if (limitChanged) {
      prevLimitRef.current = limit;
    }

    const fetchRelatedContent = async () => {
      if (!isMounted()) return;
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

        if (!isMounted()) return;

        const convertedItems: RelatedContentItemWithUI[] = (response?.items || [])
          .filter((item) => Boolean(item.category && item.slug && item.title))
          .map((item): RelatedContentItemWithUI => {
            const result: RelatedContentItemWithUI = {
              category: item.category!,
              slug: item.slug!,
              title: item.title!,
              description: item.description ?? '',
              author: item.author ?? '',
              date_added: item.date_added ?? '',
              tags: item.tags ?? [],
              score: item.score ?? 0,
              match_type: item.match_type ?? '',
              views: item.views ?? 0,
              ...(item.match_type ? {
                matchType: item.match_type,
                matchDetails: {
                  matchedKeywords: [],
                  matchedTags: item.tags ?? [],
                },
              } : {}),
              matched_tags: item.matched_tags ?? [],
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
        if (!isMounted()) return;
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
        if (isMounted()) {
          setLoadingFalse();
        }
      }
    };

    void fetchRelatedContent().catch((error) => {
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
    // Dependencies: Use actual values - deep equality check inside effect prevents unnecessary fetches
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, exclude, currentTags, currentKeywords, featured, limit]);

  return (
    <section
      itemScope
      itemType="https://schema.org/ItemList"
      className="my-4"
      aria-label="Related content"
    >
      {showTitle ? (
        <div className={`border-primary/20 from-primary/5 to-primary/10 mb-8 rounded-xl border bg-linear-to-r p-4 sm:p-6`}>
          <div className={`flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-primary/10 shrink-0 rounded-lg p-2">
                <Sparkles className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
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
          // Type narrowing: item is DisplayableContent, cast to RelatedContentItemWithUI
          const relatedItem = item as RelatedContentItemWithUI;
          const matchBadge = getMatchTypeBadge(relatedItem.matchType ?? (relatedItem as RelatedContentItem).match_type ?? 'unknown');
          const categoryBadge = getCategoryBadgeClass(relatedItem.category ?? 'unknown');
          
          // Type narrowing: Ensure category is valid content_category
          const itemCategory = relatedItem.category ?? 'agents';
          const validCategory = isValidCategory(itemCategory) ? itemCategory : 'agents';

          return (
            <BaseCard
              key={`${relatedItem.category}-${relatedItem.slug}`}
              targetPath={getContentItemUrl({
                category: validCategory as content_category,
                slug: relatedItem.slug ?? '',
              })}
              displayTitle={relatedItem.title ?? relatedItem.slug ?? ''}
              description={relatedItem.description ?? undefined}
              tags={relatedItem.matchDetails?.matchedTags?.slice(0, 2) ?? []}
              topAccent
              compactMode
              ariaLabel={`Related: ${relatedItem.title}`}
              renderTopBadges={() => (
                <div className={`flex w-full items-center justify-between gap-2`}>
                  <UnifiedBadge
                    className={cn(categoryBadge, 'shrink-0 border px-3 py-2 text-xs font-medium sm:px-3 sm:text-sm')}
                    variant="base"
                    style="secondary"
                  >
                    {relatedItem.category ?? 'unknown'}
                  </UnifiedBadge>
                  <div title={matchBadge.label === 'Keyword' ? 'Keyword Match' : matchBadge.label}>
                    <UnifiedBadge
                      variant="base"
                      style={matchBadge.variant}
                      className="text-2xs shrink-0 border px-1 py-1 font-medium sm:px-2 sm:text-xs"
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