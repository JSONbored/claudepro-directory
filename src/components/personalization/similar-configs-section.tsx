'use client';

/**
 * Similar Configs Section
 * Displays similar configurations on content detail pages
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ConfigCard } from '@/src/components/features/content/config-card';
import { ConfigCardSkeleton } from '@/src/components/ui/loading-skeleton';
import { Separator } from '@/src/components/ui/separator';
import { getSimilarConfigs } from '@/src/lib/actions/analytics.actions';
import { EVENTS } from '@/src/lib/analytics/events.config';
import { trackEvent } from '@/src/lib/analytics/tracker';
import type { SimilarConfigsResponse } from '@/src/lib/schemas/personalization.schema';
import type { ContentCategory } from '@/src/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface SimilarConfigsSectionProps {
  contentType: ContentCategory;
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
      } catch {
        // Silently fail - similar configs are optional enhancement
      } finally {
        setLoading(false);
      }
    }

    loadSimilarConfigs().catch(() => {
      // Error already handled inside loadSimilarConfigs
    });
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
      <section className="mt-12 py-8" style={{ minHeight: '400px' }}>
        <Separator className="mb-8" />
        <h2 className="text-2xl font-bold mb-6">Similar Configurations</h2>
        <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
          {[1, 2, 3].map((i) => (
            <ConfigCardSkeleton key={`similar-skeleton-${i}`} />
          ))}
        </div>
      </section>
    );
  }

  if (similarItems.length === 0) {
    return null; // Don't show section if no similar items
  }

  return (
    <section className="mt-12 py-8">
      <Separator className="mb-8" />
      <h2 className="text-2xl font-bold mb-6">Similar Configurations</h2>
      <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
        {similarItems.map((rec) => {
          // Convert recommendation to UnifiedContentItem format
          const item = {
            slug: rec.slug,
            title: rec.title,
            name: rec.title,
            description: rec.description,
            category: rec.category,
            tags: rec.tags || [],
            author: rec.author || 'Unknown',
          };

          return (
            <div key={`${rec.category}:${rec.slug}`}>
              <Link href={rec.url} onClick={() => handleClick(rec.slug, rec.score)}>
                <ConfigCard item={item} showCategory />
                <div className="mt-2 text-xs text-muted-foreground">
                  {Math.round(rec.score)}% match
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
