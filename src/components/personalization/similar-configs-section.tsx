'use client';

/**
 * Similar Configs Section
 * Displays similar configurations on content detail pages
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/src/lib/analytics/tracker';
import { EVENTS } from '@/src/lib/analytics/events.config';
import { getSimilarConfigs } from '@/src/lib/actions/personalization-actions';
import type { SimilarConfigsResponse } from '@/src/lib/schemas/personalization.schema';
import { ContentCard } from '@/src/components/shared/content-card';

interface SimilarConfigsSectionProps {
  contentType: string;
  contentSlug: string;
}

export function SimilarConfigsSection({ contentType, contentSlug }: SimilarConfigsSectionProps) {
  const [similarItems, setSimilarItems] = useState<SimilarConfigsResponse['similar_items']>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSimilarConfigs() {
      try {
        const result = await getSimilarConfigs({
          content_type: contentType,
          content_slug: contentSlug,
          limit: 6,
        });

        if (result?.data) {
          setSimilarItems(result.data.similar_items);
        }
      } catch (error) {
        console.error('Failed to load similar configs:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSimilarConfigs();
  }, [contentType, contentSlug]);

  const handleClick = (targetSlug: string, score: number) => {
    trackEvent(EVENTS.PERSONALIZATION_SIMILAR_CONFIG_CLICKED, {
      source_slug: contentSlug,
      target_slug: targetSlug,
      similarity_score: score,
    });
  };

  if (loading) {
    return (
      <section className="mt-12 py-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Similar Configurations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (similarItems.length === 0) {
    return null; // Don't show section if no similar items
  }

  return (
    <section className="mt-12 py-8 border-t">
      <h2 className="text-2xl font-bold mb-6">Similar Configurations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {similarItems.map((item) => (
          <div
            key={`${item.category}:${item.slug}`}
            onClick={() => handleClick(item.slug, item.score)}
          >
            <Link href={item.url}>
              <ContentCard
                title={item.title}
                description={item.description}
                category={item.category}
                slug={item.slug}
                url={item.url}
                tags={item.tags || []}
                author={item.author}
                showCategory
              />
              <div className="mt-2 text-xs text-muted-foreground">
                {Math.round(item.score)}% match
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
