'use client';

/**
 * Trending Content Tabs - Client component due to Radix Tabs + motion animations
 */

import { Clock, Star, TrendingUp } from '@heyclaude/web-runtime/icons';
import { type TrendingContentProps } from '@heyclaude/web-runtime/types/component.types';
import {
  UnifiedBadge,
  UnifiedCardGrid,
  ConfigCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@heyclaude/web-runtime/ui';
import { Award } from '@heyclaude/web-runtime/icons';
import { useId } from 'react';

interface TabConfig {
  emptyMessage: string;
  heading: string;
  icon: typeof TrendingUp;
  label: string;
  value: string;
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
    <Tabs defaultValue="trending" className="space-y-8">
      <TabsList
        className="mx-auto grid w-full max-w-md grid-cols-3"
        role="tablist"
        aria-label="Trending content categories"
      >
        {TAB_CONFIGS.map((config) => {
          const Icon = config.icon;
          const tooltipContent = 
            config.value === 'trending'
              ? 'Most viewed and copied configurations this week'
              : config.value === 'popular'
              ? 'All-time most popular configurations based on views and engagement'
              : 'Recently added or updated configurations';
          
          return (
            <TooltipProvider key={config.value}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value={config.value}
                    aria-label={`View ${config.label.toLowerCase()} configurations`}
                  >
                    <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                    {config.label}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{config.heading}</p>
                  <p className="text-xs text-muted-foreground">{tooltipContent}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
            className="space-y-8"
            role="tabpanel"
            aria-labelledby={headingId}
          >
            <div>
              <h2 id={headingId} className="mb-4 text-2xl font-bold">
                {config.heading}
              </h2>
              <UnifiedCardGrid
                items={items}
                variant="list"
                emptyMessage={config.emptyMessage}
                ariaLabel={`${config.label} content`}
                prefetchCount={3}
                keyExtractor={(item) => `${config.value}-${item.slug ?? ''}`}
                renderCard={(item, index) => {
                  // ConfigCard accepts DisplayableContent union type
                  // ContentItem is part of that union, so spread is type-safe
                  const cardItem = { ...item, position: index };

                  return (
                    <div key={item.slug} className="relative">
                      {showRankBadge && index < 3 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <UnifiedBadge
                                  className="absolute -top-2 -right-2 z-10"
                                  variant="base"
                                  style="default"
                                  aria-label={`Rank ${index + 1}`}
                                >
                                  <Award className="mr-1 h-3 w-3" aria-hidden="true" />
                                  #{index + 1}
                                </UnifiedBadge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Rank #{index + 1}</p>
                              <p className="text-xs text-muted-foreground">
                                {index === 0 
                                  ? 'Most trending this week'
                                  : index === 1
                                  ? 'Second most trending'
                                  : 'Third most trending'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : null}
                      <ConfigCard item={cardItem} variant="default" showCategory showActions />
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
