'use client';

/**
 * For You Feed Client Component
 * Displays personalized recommendations with filtering and infinite scroll
 */

import { useEffect, useState } from 'react';
import { trackEvent } from '@/src/lib/analytics/tracker';
import { EVENTS } from '@/src/lib/analytics/events.config';
import type { ForYouFeedResponse } from '@/src/lib/schemas/personalization.schema';
import { ContentCard } from '@/src/components/shared/content-card';

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((rec, index) => (
            <div
              key={`${rec.category}:${rec.slug}`}
              onClick={() => handleClick(rec.slug, rec.category, index, rec.source)}
            >
              <ContentCard
                title={rec.title}
                description={rec.description}
                category={rec.category}
                slug={rec.slug}
                url={rec.url}
                tags={rec.tags}
                author={rec.author}
                viewCount={rec.view_count}
                showCategory
              />
              {rec.reason && (
                <p className="mt-2 text-xs text-muted-foreground italic">
                  {rec.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No recommendations found for this category.
          </p>
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
