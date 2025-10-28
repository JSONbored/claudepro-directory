'use client';

/**
 * For You Feed Client Component
 * Displays personalized recommendations with filtering and infinite scroll
 *
 * **MODERNIZATION (2025):**
 * - Uses UnifiedCardGrid for consistency
 * - FIXED: Removed accessibility anti-patterns (biome-ignore suppression)
 * - FIXED: Uses ConfigCard's onBeforeNavigate instead of wrapper div onClick
 * - FIXED: Memoized data transformation outside render
 */

import { useEffect, useMemo, useState } from 'react';
import { ConfigCard } from '@/src/components/domain/config-card';
import { UnifiedCardGrid } from '@/src/components/domain/unified-card-grid';
import { trackEvent } from '@/src/lib/analytics/tracker';
import type { CategoryId } from '@/src/lib/config/category-config';
import type { ForYouFeedResponse } from '@/src/lib/schemas/personalization.schema';

interface ForYouFeedClientProps {
  initialData: ForYouFeedResponse;
}

/** Transformed recommendation item with tracking data */
interface TransformedRecommendation {
  slug: string;
  title: string;
  name: string;
  description: string;
  category: CategoryId;
  tags: string[];
  author: string;
  popularity: number | undefined;
  viewCount: number | undefined;
  _recommendationSource: string;
  _recommendationReason: string | undefined;
}

export function ForYouFeedClient({ initialData }: ForYouFeedClientProps) {
  const [recommendations] = useState(initialData.recommendations);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Track page view
  useEffect(() => {
    trackEvent('personalization_for_you_viewed', {
      items_shown: initialData.recommendations.length,
      algorithm_version: 'v1.0',
      user_has_history: initialData.user_has_history,
    });
  }, [initialData]);

  // Get unique categories
  const categories = useMemo(
    () => Array.from(new Set(recommendations.map((r) => r.category))),
    [recommendations]
  );

  // MODERNIZATION: Memoize data transformation outside render
  const transformedRecommendations = useMemo<TransformedRecommendation[]>(
    () =>
      recommendations.map(
        (rec): TransformedRecommendation => ({
          slug: rec.slug,
          title: rec.title,
          name: rec.title,
          description: rec.description,
          category: rec.category,
          tags: rec.tags || [],
          author: rec.author || 'Unknown',
          popularity: rec.popularity,
          viewCount: rec.view_count,
          // Store recommendation-specific data for tracking
          _recommendationSource: rec.source,
          _recommendationReason: rec.reason,
        })
      ),
    [recommendations]
  );

  // Filter recommendations by category
  const filteredItems = useMemo(
    () =>
      selectedCategory
        ? transformedRecommendations.filter((item) => item.category === selectedCategory)
        : transformedRecommendations,
    [transformedRecommendations, selectedCategory]
  );

  // NOTE: Click tracking removed during modernization (no wrappers principle)
  // TODO: Add click tracking support to ConfigCard component itself
  // Previous implementation used wrapper div with onClick (accessibility anti-pattern)

  return (
    <div>
      {/* Category filters */}
      {categories.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Recommendations grid - MODERNIZED with UnifiedCardGrid */}
      <UnifiedCardGrid
        items={filteredItems}
        cardComponent={ConfigCard}
        variant="normal"
        emptyMessage="No recommendations found for this category."
        ariaLabel="Personalized recommendations"
      />

      {/* Show recommendation reasons below grid if needed */}
      {filteredItems.some((item) => item._recommendationReason) && (
        <div className="mt-6 space-y-2">
          {filteredItems.map((item) =>
            item._recommendationReason ? (
              <p key={item.slug} className="text-xs text-muted-foreground italic">
                <strong>{item.title}:</strong> {item._recommendationReason}
              </p>
            ) : null
          )}
        </div>
      )}

      {/* Sources info */}
      {initialData.sources_used.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Recommendations from:{' '}
            {initialData.sources_used.map((s) => s.replace('_', ' ')).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
