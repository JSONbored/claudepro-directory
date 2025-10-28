'use client';

import { memo, useId } from 'react';
import { ConfigCard } from '@/src/components/domain/config-card';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { UnifiedCardGrid } from '@/src/components/domain/unified-card-grid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/primitives/tabs';
import { Clock, Star, TrendingUp } from '@/src/lib/icons';
import type { ContentItem, TrendingContentProps } from '@/src/lib/schemas/component.schema';

/**
 * Trending Content Component
 *
 * Performance Optimizations:
 * - Memoized to prevent unnecessary re-renders when parent state changes
 * - Only re-renders when trending/popular/recent data actually changes
 * - Renders 10-20+ ConfigCard items per tab (expensive DOM operations)
 */
function TrendingContentComponent({ trending, popular, recent }: TrendingContentProps) {
  // Generate unique IDs for headings
  const trendingHeadingId = useId();
  const popularHeadingId = useId();
  const recentHeadingId = useId();

  // Removed unused getConfigType function

  return (
    <Tabs defaultValue="trending" className="space-y-8">
      <TabsList
        className={'grid w-full grid-cols-3 max-w-md mx-auto'}
        role="tablist"
        aria-label="Trending content categories"
      >
        <TabsTrigger value="trending" aria-label="View trending configurations">
          <TrendingUp className={'h-4 w-4 mr-2'} aria-hidden="true" />
          Trending
        </TabsTrigger>
        <TabsTrigger value="popular" aria-label="View most popular configurations">
          <Star className={'h-4 w-4 mr-2'} aria-hidden="true" />
          Popular
        </TabsTrigger>
        <TabsTrigger value="recent" aria-label="View recently added configurations">
          <Clock className={'h-4 w-4 mr-2'} aria-hidden="true" />
          Recent
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="trending"
        className="space-y-8"
        role="tabpanel"
        aria-labelledby={trendingHeadingId}
      >
        <div>
          <h2 id={trendingHeadingId} className={'text-2xl font-bold mb-4'}>
            Trending This Week
          </h2>
          <UnifiedCardGrid
            items={trending}
            variant="list"
            emptyMessage="No trending content available yet. Check back soon!"
            ariaLabel="Trending content"
            prefetchCount={3}
            renderCard={(item, index) => (
              <div key={item.slug} className="relative">
                {index < 3 && (
                  <UnifiedBadge
                    className={'absolute -top-2 -right-2 z-10'}
                    variant="base"
                    style="default"
                    aria-label={`Rank ${index + 1}`}
                  >
                    #{index + 1}
                  </UnifiedBadge>
                )}
                <ConfigCard
                  item={{ ...item, position: index } as ContentItem}
                  variant="default"
                  showCategory={true}
                  showActions={false}
                />
              </div>
            )}
          />
        </div>
      </TabsContent>

      <TabsContent
        value="popular"
        className="space-y-8"
        role="tabpanel"
        aria-labelledby={popularHeadingId}
      >
        <div>
          <h2 id={popularHeadingId} className={'text-2xl font-bold mb-4'}>
            Most Popular
          </h2>
          <UnifiedCardGrid
            items={popular}
            variant="list"
            emptyMessage="No popular content available yet. Check back soon!"
            ariaLabel="Popular content"
            prefetchCount={3}
            renderCard={(item, index) => (
              <ConfigCard
                key={item.slug}
                item={{ ...item, position: index } as ContentItem}
                variant="default"
                showCategory={true}
                showActions={false}
              />
            )}
          />
        </div>
      </TabsContent>

      <TabsContent
        value="recent"
        className="space-y-8"
        role="tabpanel"
        aria-labelledby={recentHeadingId}
      >
        <div>
          <h2 id={recentHeadingId} className={'text-2xl font-bold mb-4'}>
            Recently Added
          </h2>
          <UnifiedCardGrid
            items={recent}
            variant="list"
            emptyMessage="No recent content available yet. Check back soon!"
            ariaLabel="Recent content"
            prefetchCount={3}
            renderCard={(item, index) => (
              <ConfigCard
                key={item.slug}
                item={{ ...item, position: index } as ContentItem}
                variant="default"
                showCategory={true}
                showActions={false}
              />
            )}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

// Export memoized component
export const TrendingContent = memo(TrendingContentComponent);
