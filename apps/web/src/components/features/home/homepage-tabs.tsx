'use client';

/** Homepage tabs consuming homepageConfigs for runtime-tunable tab categories */

import { getHomepageConfigBundle } from '@heyclaude/web-runtime/actions';
import { logger, type UnifiedCategoryConfig } from '@heyclaude/web-runtime/core';
import { getHomepageTabCategories } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import type { DisplayableContent } from '@heyclaude/web-runtime/types/component.types';
import { motion } from 'motion/react';
import Link from 'next/link';
import { type FC, memo, useEffect, useMemo, useState } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { UnifiedCardGrid } from '@/src/components/core/domain/cards/card-grid';
import { ConfigCard } from '@/src/components/core/domain/cards/config-card';
import { Button } from '@/src/components/primitives/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/primitives/ui/tabs';
import { getTrendingSlugs, isNewSince } from '@/src/utils/content-highlights';

export interface TabsSectionProps {
  activeTab: string;
  filteredResults: readonly DisplayableContent[];
  onTabChange: (value: string) => void;
  categoryConfigs: Record<string, UnifiedCategoryConfig>;
  onFetchMore?: () => Promise<void>;
  serverHasMore?: boolean;
  weekStart?: string;
}

const TabsSectionComponent: FC<TabsSectionProps> = ({
  activeTab,
  filteredResults,
  onTabChange,
  categoryConfigs,
  onFetchMore,
  serverHasMore = false,
  weekStart,
}) => {
  const [tabCategories, setTabCategories] = useState<readonly string[]>([]);
  const [springDefault, setSpringDefault] = useState({
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
  });

  // OPTIMIZATION: Use config bundle instead of separate calls (reduces 2 calls to 1)
  useEffect(() => {
    getHomepageConfigBundle()
      .then((bundle) => {
        // Extract tab categories from homepage config
        const categories = Array.isArray(bundle.homepageConfig['homepage.tab_categories'])
          ? bundle.homepageConfig['homepage.tab_categories']
          : [];
        setTabCategories(categories.map((value) => String(value)));

        // Extract animation config
        setSpringDefault({
          type: 'spring' as const,
          stiffness: bundle.animationConfig['animation.spring.default.stiffness'],
          damping: bundle.animationConfig['animation.spring.default.damping'],
        });
      })
      .catch((error) => {
        logger.error('Homepage Tabs: failed to load config bundle', error);
        // Fallback: still try to get tab categories individually
        getHomepageTabCategories()
          .then((categories) => {
            setTabCategories(categories);
          })
          .catch((err) => {
            logger.error('Homepage Tabs: failed to load tab categories fallback', err);
          });
      });
  }, []);

  const contentTabs = useMemo(
    () => tabCategories.filter((tab) => tab !== 'community'),
    [tabCategories]
  );

  const weekStartDate = useMemo(() => {
    if (!weekStart) return null;
    const parsed = new Date(weekStart);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [weekStart]);
  const trendingSlugs = useMemo(() => getTrendingSlugs(filteredResults, 6), [filteredResults]);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-8">
      {/* Tabs with horizontal scroll on mobile/tablet */}
      <TabsList className="scrollbar-hide w-full gap-1 overflow-x-auto lg:grid lg:w-auto lg:auto-cols-fr lg:grid-flow-col">
        <div className="flex min-w-max lg:contents lg:min-w-0">
          {tabCategories.map((tab) => {
            let displayName = tab.charAt(0).toUpperCase() + tab.slice(1);

            if (tab !== 'all' && tab !== 'community') {
              const config = categoryConfigs[tab];
              if (config) {
                displayName = config.pluralTitle;
              }
            }

            return (
              <motion.div key={tab} whileTap={{ scale: 0.95 }} transition={springDefault}>
                <TabsTrigger
                  value={tab}
                  className="whitespace-nowrap px-3 text-xs sm:px-4 sm:text-sm"
                >
                  {displayName}
                </TabsTrigger>
              </motion.div>
            );
          })}
        </div>
      </TabsList>

      {/* Tab content for all content tabs */}
      {contentTabs.map((tab) => {
        const categoryName =
          tab === 'all'
            ? 'configurations'
            : categoryConfigs[tab]?.pluralTitle?.toLowerCase() || tab;

        return (
          <TabsContent key={tab} value={tab} className="space-y-6">
            <UnifiedCardGrid
              items={filteredResults}
              variant="normal"
              infiniteScroll={true}
              batchSize={30}
              emptyMessage={`No ${categoryName} found. Try adjusting your filters.`}
              ariaLabel={`${categoryName} results`}
              keyExtractor={(item) => item.slug ?? ''}
              renderCard={(item) => {
                const slug = typeof item.slug === 'string' ? item.slug : null;
                const showNew = Boolean(weekStartDate && isNewSince(item, weekStartDate));
                const showTrending = Boolean(slug && trendingSlugs.has(slug));

                return (
                  <div className="relative h-full">
                    {(showNew || showTrending) && (
                      <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col gap-2">
                        {showNew && (
                          <UnifiedBadge
                            variant="base"
                            style="secondary"
                            className="text-[10px] uppercase"
                          >
                            New this week
                          </UnifiedBadge>
                        )}
                        {showTrending && (
                          <UnifiedBadge
                            variant="base"
                            style="outline"
                            className="text-[10px] uppercase"
                          >
                            Trending
                          </UnifiedBadge>
                        )}
                      </div>
                    )}
                    <ConfigCard
                      item={item}
                      variant="default"
                      showCategory={true}
                      showActions={true}
                    />
                  </div>
                );
              }}
              {...(tab === 'all' && onFetchMore ? { onFetchMore, serverHasMore } : {})}
            />
          </TabsContent>
        );
      })}

      {/* Community tab with custom content */}
      <TabsContent value="community" className="space-y-6">
        <div className={'mb-8 text-center'}>
          <h3 className={'mb-2 font-bold text-2xl'}>Featured Contributors</h3>
          <p className="text-muted-foreground">
            Meet the experts creating amazing Claude configurations
          </p>
        </div>

        <div className="text-center">
          <p className={'mb-6 text-lg text-muted-foreground'}>
            Coming soon! Featured contributors who create amazing Claude configurations.
          </p>
        </div>

        <div className={'pt-8 text-center'}>
          <Button variant="outline" asChild={true}>
            <Link href={ROUTES.COMMUNITY}>View All Contributors</Link>
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export const TabsSection = memo(TabsSectionComponent);
