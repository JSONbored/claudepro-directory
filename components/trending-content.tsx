'use client';

import { useId } from 'react';
import { ConfigCard } from '@/components/config-card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Star, TrendingUp } from '@/lib/icons';
import type { TrendingContentProps, UnifiedContentItem } from '@/lib/schemas/component.schema';
import { UI_CLASSES } from '@/lib/ui-constants';

export function TrendingContent({ trending, popular, recent }: TrendingContentProps) {
  // Generate unique IDs for headings
  const trendingHeadingId = useId();
  const popularHeadingId = useId();
  const recentHeadingId = useId();

  // Removed unused getConfigType function

  return (
    <Tabs defaultValue="trending" className={UI_CLASSES.SPACE_Y_8}>
      <TabsList
        className={`grid ${UI_CLASSES.W_FULL} grid-cols-3 max-w-md mx-auto`}
        role="tablist"
        aria-label="Trending content categories"
      >
        <TabsTrigger value="trending" aria-label="View trending configurations">
          <TrendingUp className={`h-4 w-4 ${UI_CLASSES.MR_2}`} aria-hidden="true" />
          Trending
        </TabsTrigger>
        <TabsTrigger value="popular" aria-label="View most popular configurations">
          <Star className={`h-4 w-4 ${UI_CLASSES.MR_2}`} aria-hidden="true" />
          Popular
        </TabsTrigger>
        <TabsTrigger value="recent" aria-label="View recently added configurations">
          <Clock className={`h-4 w-4 ${UI_CLASSES.MR_2}`} aria-hidden="true" />
          Recent
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="trending"
        className={UI_CLASSES.SPACE_Y_8}
        role="tabpanel"
        aria-labelledby={trendingHeadingId}
      >
        <div>
          <h2 id={trendingHeadingId} className={`text-2xl ${UI_CLASSES.FONT_BOLD} mb-4`}>
            🔥 Trending This Week
          </h2>
          <ul className={UI_CLASSES.GRID_RESPONSIVE_LIST}>
            {trending.map((item: UnifiedContentItem, index: number) => (
              <li key={item.slug} className="relative">
                {index < 3 && (
                  <Badge
                    className={`absolute -top-2 -right-2 ${UI_CLASSES.Z_10}`}
                    variant="default"
                    aria-label={`Rank ${index + 1}`}
                  >
                    #{index + 1}
                  </Badge>
                )}
                <ConfigCard item={item} variant="default" showCategory={true} showActions={false} />
              </li>
            ))}
          </ul>
        </div>
      </TabsContent>

      <TabsContent
        value="popular"
        className={UI_CLASSES.SPACE_Y_8}
        role="tabpanel"
        aria-labelledby={popularHeadingId}
      >
        <div>
          <h2 id={popularHeadingId} className={`text-2xl ${UI_CLASSES.FONT_BOLD} mb-4`}>
            ⭐ Most Popular
          </h2>
          <ul className={UI_CLASSES.GRID_RESPONSIVE_LIST}>
            {popular.map((item) => (
              <li key={item.slug}>
                <ConfigCard item={item} variant="default" showCategory={true} showActions={false} />
              </li>
            ))}
          </ul>
        </div>
      </TabsContent>

      <TabsContent
        value="recent"
        className={UI_CLASSES.SPACE_Y_8}
        role="tabpanel"
        aria-labelledby={recentHeadingId}
      >
        <div>
          <h2 id={recentHeadingId} className={`text-2xl ${UI_CLASSES.FONT_BOLD} mb-4`}>
            🆕 Recently Added
          </h2>
          <ul className={UI_CLASSES.GRID_RESPONSIVE_LIST}>
            {recent.map((item) => (
              <li key={item.slug}>
                <ConfigCard item={item} variant="default" showCategory={true} showActions={false} />
              </li>
            ))}
          </ul>
        </div>
      </TabsContent>
    </Tabs>
  );
}
