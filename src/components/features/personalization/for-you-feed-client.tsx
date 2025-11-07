'use client';

/**
 * For You Feed Client - Database-First Architecture
 * Uses RPC results with minimal UI transformation only.
 */

import { useEffect, useMemo, useState } from 'react';
import { ConfigCard } from '@/src/components/domain/config-card';
import { UnifiedCardGrid } from '@/src/components/domain/unified-card-grid';
import { trackEvent } from '@/src/lib/analytics/tracker';
import type { Tables } from '@/src/types/database.types';

// Type inlined from database RPC response structure
type ForYouFeedResponse = {
  recommendations: Array<{
    slug: string;
    title: string;
    description: string;
    category: string;
    url: string;
    score: number;
    source: string;
    reason?: string;
    tags?: string[];
    author?: string;
    popularity?: number;
  }>;
  total_count: number;
  sources_used: string[];
  user_has_history: boolean;
  generated_at: string;
};

interface ForYouFeedClientProps {
  initialData: ForYouFeedResponse;
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

  const transformedRecommendations = useMemo(
    () =>
      recommendations.map((rec) => ({
        // Core fields from recommendation
        id: rec.slug,
        slug: rec.slug,
        title: rec.title,
        description: rec.description,
        category: rec.category,
        tags: rec.tags || [],
        author: rec.author || 'Unknown',
        date_added: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source_table: rec.category,
        author_profile_url: null,
        seo_title: null,
        content: null,
        popularity_score: rec.popularity ?? null,
        // Required database fields with defaults
        avg_rating: null,
        bookmark_count: 0,
        copy_count: 0,
        difficulty_score: null,
        display_title: null,
        documentation_url: null,
        download_url: null,
        examples: null,
        features: null,
        fts_vector: null,
        git_hash: null,
        has_breaking_changes: null,
        has_prerequisites: null,
        has_troubleshooting: null,
        json_ld: null,
        metadata: {},
        og_type: null,
        reading_time: null,
        review_count: 0,
        robots_follow: null,
        robots_index: null,
        source: null,
        storage_url: null,
        synced_at: null,
        twitter_card: null,
        use_cases: null,
        view_count: 0,
        // Custom recommendation metadata
        _recommendationSource: rec.source,
        _recommendationReason: rec.reason,
      })) as Tables<'content'>[],
    [recommendations]
  );

  const filteredItems = useMemo(
    () =>
      selectedCategory
        ? transformedRecommendations.filter((item) => item.category === selectedCategory)
        : transformedRecommendations,
    [transformedRecommendations, selectedCategory]
  );

  return (
    <div>
      {/* Category filters */}
      {categories.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`rounded-lg px-4 py-2 font-medium text-sm transition-colors ${
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
              className={`rounded-lg px-4 py-2 font-medium text-sm transition-colors ${
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

      {filteredItems.some(
        (item) => '_recommendationReason' in item && item._recommendationReason
      ) && (
        <div className="mt-6 space-y-2">
          {filteredItems.map((item) =>
            '_recommendationReason' in item && item._recommendationReason ? (
              <p key={item.slug} className="text-muted-foreground text-xs italic">
                <strong>{item.title}:</strong> {item._recommendationReason as string}
              </p>
            ) : null
          )}
        </div>
      )}

      {/* Sources info */}
      {initialData.sources_used.length > 0 && (
        <div className="mt-8 text-center text-muted-foreground text-sm">
          <p>
            Recommendations from:{' '}
            {initialData.sources_used.map((s) => s.replace('_', ' ')).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
