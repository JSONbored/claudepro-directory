'use client';

/**
 * Trending Content Tabs - Client component due to Radix Tabs + motion animations
 */

import { Clock, Star, TrendingUp } from '@heyclaude/web-runtime/icons';
import { iconSize, spaceY, marginBottom, weight, size, maxWidth , zLayer } from '@heyclaude/web-runtime/design-system';
import type { TrendingContentProps } from '@heyclaude/web-runtime/types/component.types';
import { useId } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { UnifiedCardGrid } from '@heyclaude/web-runtime/ui';
import { ConfigCard } from '@heyclaude/web-runtime/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@heyclaude/web-runtime/ui';

interface TabConfig {
  value: string;
  label: string;
  heading: string;
  icon: typeof TrendingUp;
  emptyMessage: string;
}

const TAB_CONFIGS: TabConfig[] = [
  {
    value: 'trending',
    label: 'Trending',
    heading: 'Trending This Week',
    icon: TrendingUp,
    emptyMessage: 'No trending content available yet. Check back soon!',
  },
  {
    value: 'popular',
    label: 'Popular',
    heading: 'Most Popular',
    icon: Star,
    emptyMessage: 'No popular content available yet. Check back soon!',
  },
  {
    value: 'recent',
    label: 'Recent',
    heading: 'Recently Added',
    icon: Clock,
    emptyMessage: 'No recent content available yet. Check back soon!',
  },
];

export function TrendingContent({ trending, popular, recent }: TrendingContentProps) {
  // Map data to tab configs
  const tabData = {
    trending: trending || [],
    popular: popular || [],
    recent: recent || [],
  };

  // Generate unique IDs for headings (accessibility)
  const trendingHeadingId = useId();
  const popularHeadingId = useId();
  const recentHeadingId = useId();
  const headingIds = {
    trending: trendingHeadingId,
    popular: popularHeadingId,
    recent: recentHeadingId,
  };

  return (
    <Tabs defaultValue="trending" className={spaceY.loose}>
      <TabsList
        className={`mx-auto grid w-full ${maxWidth.md} grid-cols-3`}
        role="tablist"
        aria-label="Trending content categories"
      >
        {TAB_CONFIGS.map((config) => {
          const Icon = config.icon;
          return (
            <TabsTrigger
              key={config.value}
              value={config.value}
              aria-label={`View ${config.label.toLowerCase()} configurations`}
            >
              <Icon className={`mr-2 ${iconSize.sm}`} aria-hidden="true" />
              {config.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {TAB_CONFIGS.map((config) => {
        const items = tabData[config.value as keyof typeof tabData];
        const headingId = headingIds[config.value as keyof typeof headingIds];
        const showRankBadge = config.value === 'trending';

        return (
          <TabsContent
            key={config.value}
            value={config.value}
            className={spaceY.loose}
            role="tabpanel"
            aria-labelledby={headingId}
          >
            <div>
              <h2 id={headingId} className={`${marginBottom.default} ${weight.bold} ${size['2xl']}`}>
                {config.heading}
              </h2>
              <UnifiedCardGrid
                items={items}
                variant="list"
                emptyMessage={config.emptyMessage}
                ariaLabel={`${config.label} content`}
                prefetchCount={3}
                renderCard={(item, index) => {
                  // ConfigCard accepts DisplayableContent union type
                  // ContentItem is part of that union, so spread is type-safe
                  const cardItem = { ...item, position: index };

                  return (
                    <div key={item.slug} className="relative">
                      {showRankBadge && index < 3 && (
                        <UnifiedBadge
                          className={`-top-2 -right-2 absolute ${zLayer.raised}`}
                          variant="base"
                          style="default"
                          aria-label={`Rank ${index + 1}`}
                        >
                          #{index + 1}
                        </UnifiedBadge>
                      )}
                      <ConfigCard
                        item={cardItem}
                        variant="default"
                        showCategory={true}
                        showActions={true}
                      />
                    </div>
                  );
                }}
              />
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
