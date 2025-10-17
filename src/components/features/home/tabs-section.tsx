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

import Link from 'next/link';
import { type FC, memo, useMemo } from 'react';
import { ConfigCard } from '@/src/components/cards/config-card';
import { UnifiedCardGrid } from '@/src/components/cards/unified-card-grid';
import { Button } from '@/src/components/primitives/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/primitives/tabs';
import {
  HOMEPAGE_TAB_CATEGORIES,
  UNIFIED_CATEGORY_REGISTRY,
} from '@/src/lib/config/category-config';
import { ROUTES } from '@/src/lib/constants/routes';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';

interface TabsSectionProps {
  activeTab: string;
  filteredResults: readonly UnifiedContentItem[];
  onTabChange: (value: string) => void;
}

const TabsSectionComponent: FC<TabsSectionProps> = ({
  activeTab,
  filteredResults,
  onTabChange,
}) => {
  // Get content tabs (exclude 'community' which has custom content)
  const contentTabs = useMemo(
    () => HOMEPAGE_TAB_CATEGORIES.filter((tab) => tab !== 'community'),
    []
  );

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-8">
      <TabsList className="grid w-full lg:w-auto lg:grid-flow-col lg:auto-cols-fr gap-1">
        {HOMEPAGE_TAB_CATEGORIES.map((tab) => {
          // Get display name from category config, or use tab name
          let displayName = tab.charAt(0).toUpperCase() + tab.slice(1);

          if (tab !== 'all' && tab !== 'community') {
            const config = UNIFIED_CATEGORY_REGISTRY[tab];
            if (config) {
              displayName = config.pluralTitle;
            }
          }

          return (
            <TabsTrigger key={tab} value={tab} className="text-sm">
              {displayName}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {/* Tab content for all content tabs */}
      {contentTabs.map((tab) => {
        const categoryName =
          tab === 'all'
            ? 'configurations'
            : UNIFIED_CATEGORY_REGISTRY[tab]?.pluralTitle?.toLowerCase() || tab;

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
              renderCard={(item: UnifiedContentItem) => (
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
