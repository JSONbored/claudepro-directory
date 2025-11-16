'use client';

/** Homepage tabs consuming homepageConfigs for runtime-tunable tab categories */

import { motion } from 'motion/react';
import Link from 'next/link';
import { type FC, memo, useEffect, useMemo, useState } from 'react';
import { UnifiedCardGrid } from '@/src/components/core/domain/cards/card-grid';
import { ConfigCard } from '@/src/components/core/domain/cards/config-card';
import { Button } from '@/src/components/primitives/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/primitives/ui/tabs';
import { getAnimationConfig } from '@/src/lib/actions/feature-flags.actions';
import type { UnifiedCategoryConfig } from '@/src/lib/data/config/category';
import { ROUTES } from '@/src/lib/data/config/constants';
import { logger } from '@/src/lib/logger';
import type { DisplayableContent } from '@/src/lib/types/component.types';

interface TabsSectionProps {
  activeTab: string;
  filteredResults: readonly DisplayableContent[];
  onTabChange: (value: string) => void;
  categoryConfigs: Record<string, UnifiedCategoryConfig>;
  onFetchMore?: () => Promise<void>;
  serverHasMore?: boolean;
}

const TabsSectionComponent: FC<TabsSectionProps> = ({
  activeTab,
  filteredResults,
  onTabChange,
  categoryConfigs,
  onFetchMore,
  serverHasMore = false,
}) => {
  const [tabCategories, setTabCategories] = useState<readonly string[]>([]);
  const [springDefault, setSpringDefault] = useState({
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const { getHomepageTabCategories } = await import('@/src/lib/data/config/category');
        const categories = await getHomepageTabCategories();
        setTabCategories(categories);
      } catch (error) {
        logger.error(
          'Homepage Tabs: failed to load tab categories',
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
    loadCategories().catch((err) => {
      logger.error('Homepage Tabs: failed to initialize categories', err);
    });
  }, []);

  useEffect(() => {
    getAnimationConfig({})
      .then((result) => {
        if (!result?.data) return;
        const config = result.data;
        setSpringDefault({
          type: 'spring' as const,
          stiffness: config['animation.spring.default.stiffness'],
          damping: config['animation.spring.default.damping'],
        });
      })
      .catch((error) => {
        logger.error('Homepage Tabs: failed to load animation config', error);
      });
  }, []);

  const contentTabs = useMemo(
    () => tabCategories.filter((tab) => tab !== 'community'),
    [tabCategories]
  );

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
              infiniteScroll
              batchSize={30}
              emptyMessage={`No ${categoryName} found. Try adjusting your filters.`}
              ariaLabel={`${categoryName} results`}
              keyExtractor={(item) => item.slug}
              renderCard={(item) => (
                <ConfigCard item={item} variant="default" showCategory={true} showActions={true} />
              )}
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
          <Button variant="outline" asChild>
            <Link href={ROUTES.COMMUNITY}>View All Contributors</Link>
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export const TabsSection = memo(TabsSectionComponent);
