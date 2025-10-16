'use client';

/**
 * For You Feed Client Component
 * Displays personalized recommendations with filtering and infinite scroll
 */

import { useEffect, useState } from 'react';
import { ConfigCard } from '@/src/components/features/content/config-card';
import { EVENTS } from '@/src/lib/analytics/events.constants';
import { trackEvent } from '@/src/lib/analytics/tracker';
import type { ForYouFeedResponse } from '@/src/lib/schemas/personalization.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface ForYouFeedClientProps {
  initialData: ForYouFeedResponse;
}

export function ForYouFeedClient({ initialData }: ForYouFeedClientProps) {
  const [recommendations] = useState(initialData.recommendations);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Track page view
  useEffect(() => {
    trackEvent(EVENTS.PERSONALIZATION_FOR_YOU_VIEWED, {
      items_shown: initialData.recommendations.length,
      algorithm_version: 'v1.0',
      user_has_history: initialData.user_has_history,
    });
  }, [initialData]);

  // Filter recommendations by category
  const filteredRecommendations = selectedCategory
    ? recommendations.filter((rec) => rec.category === selectedCategory)
    : recommendations;

  // Get unique categories
  const categories = Array.from(new Set(recommendations.map((r) => r.category)));

  // Track clicks
  const handleClick = (slug: string, category: string, position: number, source: string) => {
    trackEvent(EVENTS.PERSONALIZATION_RECOMMENDATION_CLICKED, {
      content_slug: slug,
      content_type: category,
      position,
      recommendation_source: source,
    });
  };

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

      {/* Recommendations grid */}
      {filteredRecommendations.length > 0 ? (
        <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
          {filteredRecommendations.map((rec, index) => {
            // Convert recommendation to UnifiedContentItem format
            const item = {
              slug: rec.slug,
              title: rec.title,
              name: rec.title,
              description: rec.description,
              category: rec.category,
              tags: rec.tags || [],
              author: rec.author || 'Unknown',
              popularity: rec.popularity,
              viewCount: rec.view_count,
            };

            return (
              <div key={`${rec.category}:${rec.slug}`}>
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: Click bubbles from interactive ConfigCard */}
                {/* biome-ignore lint/a11y/noStaticElementInteractions: ConfigCard handles keyboard navigation */}
                <div onClick={() => handleClick(rec.slug, rec.category, index, rec.source)}>
                  <ConfigCard item={item} showCategory />
                </div>
                {rec.reason && (
                  <p className="mt-2 text-xs text-muted-foreground italic">{rec.reason}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No recommendations found for this category.</p>
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
