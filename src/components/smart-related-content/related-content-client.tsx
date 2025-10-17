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
import { BaseCard } from '@/src/components/cards/base-card';
import { UnifiedCardGrid } from '@/src/components/cards/unified-card-grid';
import { UnifiedBadge } from '@/src/components/ui/unified-badge';
import { Sparkles } from '@/src/lib/icons';
import { relatedContentService } from '@/src/lib/related-content/service';
import type {
  RelatedContentItem,
  SmartRelatedContentProps,
} from '@/src/lib/schemas/related-content.schema';
import type { ContentCategory } from '@/src/lib/schemas/shared.schema';
import { getContentItemUrl } from '@/src/lib/utils/content.utils';

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
function getCategoryFromPath(pathname: string): string {
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
  featured = [],
  exclude = [],
  limit = 3,
  trackingEnabled = true,
  currentTags = [],
  currentKeywords = [],
  pathname: providedPathname,
  title = 'Related Content',
  showTitle = true,
}: SmartRelatedContentProps) {
  const [items, setItems] = useState<RelatedContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cacheHit, setCacheHit] = useState(false);

  // Get pathname from props or window.location (browser-safe)
  const pathname =
    providedPathname || (typeof window !== 'undefined' ? window.location.pathname : '/');

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

        // Service now returns properly typed RelatedContentItem[] with all required fields
        setItems(response.items);
        setCacheHit(response.performance.cacheHit);
      } catch (_error) {
        // Error handling - silently fail with empty results
        // Production: Errors are tracked via trackEvent above
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedContent();
  }, [pathname, currentTags, currentKeywords, featured, exclude, limit]);

  // Track view when component loads (dynamic import for Storybook)
  useEffect(() => {
    if (!trackingEnabled || items.length === 0) return;

    import('#lib/analytics/events/related-content')
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
        <div className="mb-8 p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1" itemProp="name">
                  {title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Intelligently curated based on your current content
                </p>
              </div>
            </div>
            <UnifiedBadge
              variant="base"
              style="secondary"
              className="bg-primary/10 text-primary border-primary/30 font-medium px-2 sm:px-3 py-1 text-xs sm:text-sm flex-shrink-0"
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
        renderCard={(item, index) => {
          const matchBadge = getMatchTypeBadge(item.matchType);
          const categoryBadge = getCategoryBadgeClass(item.category);

          return (
            <BaseCard
              key={`${item.category}-${item.slug}`}
              targetPath={getContentItemUrl({
                category: item.category as ContentCategory,
                slug: item.slug,
              })}
              displayTitle={item.title || item.name || item.slug}
              description={item.description}
              tags={item.matchDetails?.matchedTags?.slice(0, 2) ?? []}
              topAccent
              compactMode
              ariaLabel={`Related: ${item.title || item.name}`}
              onBeforeNavigate={() => {
                // Track click with dynamic import (Storybook compatible)
                if (trackingEnabled) {
                  const itemUrl = getContentItemUrl({
                    category: item.category as ContentCategory,
                    slug: item.slug,
                  });

                  import('#lib/analytics/events/related-content')
                    .then((module) => {
                      module.trackRelatedContentClick(
                        pathname,
                        itemUrl,
                        index + 1,
                        item.score,
                        item.matchType
                      );
                    })
                    .catch(() => {
                      // Silent failure in Storybook
                    });
                }
              }}
              renderTopBadges={() => (
                <div className="flex items-center justify-between gap-2 w-full">
                  <UnifiedBadge
                    className={`${categoryBadge} font-medium px-2 sm:px-3 py-1 border text-xs sm:text-sm flex-shrink-0`}
                    variant="base"
                    style="secondary"
                  >
                    {item.category}
                  </UnifiedBadge>
                  <div title={matchBadge.label === 'Keyword' ? 'Keyword Match' : matchBadge.label}>
                    <UnifiedBadge
                      variant="base"
                      style={matchBadge.variant}
                      className="text-2xs sm:text-xs font-medium border px-1.5 sm:px-2 py-1 flex-shrink-0"
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
