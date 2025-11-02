'use client';

/**
 * Related Content Client Component
 * Modern client-side implementation using UnifiedCardGrid
 *
 * **Architecture Changes (2025 Modernization):**
 * - ✅ Client component (removed next/headers server dependency)
 * - ✅ Uses UnifiedCardGrid for consistency
 * - ✅ Uses BaseCard with topAccent for visual distinction
 * - ✅ Browser-compatible data fetching with useEffect
 * - ✅ Dynamic analytics imports (Storybook compatible)
 * - ✅ Proper loading/error states
 *
 * **Replaces:**
 * - carousel.tsx (338 LOC) - Custom card rendering
 * - index.tsx (118 LOC) - Server component with next/headers
 * - with-metadata.tsx (43 LOC) - Metadata wrapper
 *
 * @module components/smart-related-content/related-content-client
 */

import { useEffect, useState } from 'react';
import { BaseCard } from '@/src/components/domain/base-card';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { UnifiedCardGrid } from '@/src/components/domain/unified-card-grid';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { Sparkles } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { relatedContentService } from '@/src/lib/related-content/service';
import { getContentItemUrl } from '@/src/lib/utils/content.utils';

/**
 * Extended ContentItem for related content with matching metadata
 */
type RelatedContentItem = ContentItem & {
  score?: number;
  matchType?: string;
  matchDetails?: {
    matchedTags: string[];
    matchedKeywords: string[];
  };
};

/**
 * Props for SmartRelatedContentProps
 */
export interface SmartRelatedContentProps {
  /** Current pathname for context */
  pathname?: string;
  /** Current tags for matching */
  currentTags?: string[];
  /** Current keywords for matching */
  currentKeywords?: string[];
  /** Show featured content */
  featured?: boolean;
  /** Slugs to exclude from results */
  exclude?: string[];
  /** Maximum number of items to show */
  limit?: number;
  /** Enable analytics tracking */
  trackingEnabled?: boolean;
  /** Section title */
  title?: string;
  /** Show section title */
  showTitle?: boolean;
}

/**
 * Get category color styles for badges
 * Matches existing carousel.tsx pattern
 */
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

/**
 * Get match type badge configuration
 */
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
 * Extract category from pathname
 */
function getCategoryFromPath(pathname: string | undefined): string {
  if (!pathname) return 'unknown';
  const pathParts = pathname.split('/').filter(Boolean);
  return pathParts[0] || 'unknown';
}

/**
 * RelatedContentClient Component
 *
 * Client-side related content with UnifiedCardGrid integration.
 * Fetches data on mount and renders using BaseCard composition.
 *
 * @example
 * ```tsx
 * <RelatedContentClient
 *   pathname="/agents/code-reviewer"
 *   currentTags={['typescript', 'code-review']}
 *   limit={3}
 * />
 * ```
 */
export function RelatedContentClient({
  featured = false,
  exclude = [],
  limit = 3,
  trackingEnabled = true,
  currentTags = [],
  currentKeywords = [],
  pathname: providedPathname,
  title = 'Related Content',
  showTitle = true,
}: SmartRelatedContentProps) {
  // Extended ContentItem with related content properties already exists in schema
  const [items, setItems] = useState<RelatedContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cacheHit, setCacheHit] = useState(false);

  // Get pathname from props or window.location (browser-safe)
  // Nullish coalescing ensures type safety (only falls back on null/undefined, not empty string)
  const pathname: string =
    providedPathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');

  useEffect(() => {
    const fetchRelatedContent = async () => {
      try {
        const response = await relatedContentService.getRelatedContent({
          currentPath: pathname,
          currentCategory: getCategoryFromPath(pathname),
          currentTags,
          currentKeywords,
          featured,
          exclude,
          limit,
        });

        // Convert service response to RelatedContentItem format
        const convertedItems = response.items.map(
          (item: any): RelatedContentItem =>
            ({
              category: item.category,
              slug: item.slug,
              title: item.title,
              description: item.description,
              author: item.author,
              date_added: item.date_added,
              tags: item.tags,
              // Add related content specific properties
              score: item.score,
              matchType: item.match_type,
              matchDetails: {
                matchedTags: item.matched_tags || [],
                matchedKeywords: [],
              },
            }) as unknown as RelatedContentItem
        );

        // Service now returns properly typed RelatedContentItem[] with all required fields
        setItems(convertedItems);
        setCacheHit(response.performance.cacheHit);
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

  // Track view when component loads (dynamic import for Storybook)
  useEffect(() => {
    if (!trackingEnabled || items.length === 0) return;

    import('@/src/lib/analytics/events/related-content')
      .then((module) => {
        module.trackRelatedContentView(pathname, items.length, cacheHit);
      })
      .catch(() => {
        // Silent failure in Storybook
      });
  }, [trackingEnabled, pathname, items.length, cacheHit]);

  return (
    <section
      itemScope
      itemType="https://schema.org/ItemList"
      className="my-12"
      aria-label="Related content"
    >
      {showTitle && (
        <div className="mb-8 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4 sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2">
                <Sparkles className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
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
              className="flex-shrink-0 border-primary/30 bg-primary/10 px-2 py-1 font-medium text-primary text-xs sm:px-3 sm:text-sm"
            >
              AI Powered
            </UnifiedBadge>
          </div>
        </div>
      )}

      <UnifiedCardGrid
        items={items as readonly ContentItem[]}
        variant="tight"
        loading={loading}
        emptyMessage="No related content available"
        loadingMessage="Finding related content..."
        renderCard={(item, index) => {
          // Cast back to RelatedContentItem to access extended properties
          const relatedItem = item as RelatedContentItem;
          const matchBadge = getMatchTypeBadge(relatedItem.matchType ?? 'unknown');
          const categoryBadge = getCategoryBadgeClass(relatedItem.category);

          return (
            <BaseCard
              key={`${relatedItem.category}-${relatedItem.slug}`}
              targetPath={getContentItemUrl({
                category: relatedItem.category as any,
                slug: relatedItem.slug,
              })}
              displayTitle={relatedItem.title ?? relatedItem.slug}
              description={relatedItem.description}
              tags={relatedItem.matchDetails?.matchedTags?.slice(0, 2) ?? []}
              topAccent
              compactMode
              ariaLabel={`Related: ${relatedItem.title}`}
              onBeforeNavigate={() => {
                // Track click with dynamic import (Storybook compatible)
                if (trackingEnabled) {
                  const itemUrl = getContentItemUrl({
                    category: relatedItem.category as any,
                    slug: relatedItem.slug,
                  });

                  import('@/src/lib/analytics/events/related-content')
                    .then((module) => {
                      module.trackRelatedContentClick(
                        pathname,
                        itemUrl,
                        index + 1,
                        relatedItem.score ?? 0
                      );
                    })
                    .catch(() => {
                      // Silent failure in Storybook
                    });
                }
              }}
              renderTopBadges={() => (
                <div className="flex w-full items-center justify-between gap-2">
                  <UnifiedBadge
                    className={`${categoryBadge} flex-shrink-0 border px-2 py-1 font-medium text-xs sm:px-3 sm:text-sm`}
                    variant="base"
                    style="secondary"
                  >
                    {relatedItem.category}
                  </UnifiedBadge>
                  <div title={matchBadge.label === 'Keyword' ? 'Keyword Match' : matchBadge.label}>
                    <UnifiedBadge
                      variant="base"
                      style={matchBadge.variant}
                      className="flex-shrink-0 border px-1.5 py-1 font-medium text-2xs sm:px-2 sm:text-xs"
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
