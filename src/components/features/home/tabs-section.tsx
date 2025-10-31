'use client';

/**
 * TabsSection Component
 * SHA-2102: Extracted from home-page-client.tsx for better modularity
 * SHA-XXXX: Made dynamic using HOMEPAGE_TAB_CATEGORIES
 *
 * Production 2025 Architecture:
 * - TanStack Virtual for list virtualization
 * - Only renders ~15 visible items regardless of total count
 * - Constant memory usage and 60fps performance
 * - Scales to 10,000+ items with same performance
 *
 * Adding a new tab now only requires updating HOMEPAGE_TAB_CATEGORIES
 */

import { motion } from 'motion/react';
import Link from 'next/link';
import { type FC, memo, useMemo } from 'react';
import { ConfigCard } from '@/src/components/domain/config-card';
import { UnifiedCardGrid } from '@/src/components/domain/unified-card-grid';
import { Button } from '@/src/components/primitives/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/primitives/tabs';
import {
  HOMEPAGE_TAB_CATEGORIES,
  type UnifiedCategoryConfig,
} from '@/src/lib/config/category-config';
import { ROUTES } from '@/src/lib/constants/routes';
import type { ContentItem } from '@/src/lib/schemas/component.schema';

interface TabsSectionProps {
  activeTab: string;
  filteredResults: readonly ContentItem[];
  onTabChange: (value: string) => void;
  categoryConfigs: Record<string, UnifiedCategoryConfig>;
}

const TabsSectionComponent: FC<TabsSectionProps> = ({
  activeTab,
  filteredResults,
  onTabChange,
  categoryConfigs,
}) => {
  // Get content tabs (exclude 'community' which has custom content)
  const contentTabs = useMemo(
    () => HOMEPAGE_TAB_CATEGORIES.filter((tab) => tab !== 'community'),
    []
  );

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-8">
      {/* Tabs with horizontal scroll on mobile/tablet */}
      <TabsList className="w-full overflow-x-auto lg:w-auto lg:grid lg:grid-flow-col lg:auto-cols-fr gap-1 scrollbar-hide">
        <div className="flex lg:contents min-w-max lg:min-w-0">
          {HOMEPAGE_TAB_CATEGORIES.map((tab) => {
            let displayName = tab.charAt(0).toUpperCase() + tab.slice(1);

            if (tab !== 'all' && tab !== 'community') {
              const config = categoryConfigs[tab];
              if (config) {
                displayName = config.pluralTitle;
              }
            }

            return (
              <motion.div
                key={tab}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <TabsTrigger
                  value={tab}
                  className="text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
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
              renderCard={(item: ContentItem) => (
                <ConfigCard item={item} variant="default" showCategory={true} showActions={true} />
              )}
            />
          </TabsContent>
        );
      })}

      {/* Community tab with custom content */}
      <TabsContent value="community" className="space-y-6">
        <div className={'text-center mb-8'}>
          <h3 className={'text-2xl font-bold mb-2'}>Featured Contributors</h3>
          <p className="text-muted-foreground">
            Meet the experts creating amazing Claude configurations
          </p>
        </div>

        <div className="text-center">
          <p className={'text-lg text-muted-foreground mb-6'}>
            Coming soon! Featured contributors who create amazing Claude configurations.
          </p>
        </div>

        <div className={'text-center pt-8'}>
          <Button variant="outline" asChild>
            <Link href={ROUTES.COMMUNITY}>View All Contributors</Link>
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export const TabsSection = memo(TabsSectionComponent);
