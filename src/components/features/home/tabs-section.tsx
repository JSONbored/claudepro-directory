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
import { ConfigCard } from '@/src/components/features/content/config-card';
import { VirtualizedGrid } from '@/src/components/shared/virtualized-grid';
import { Button } from '@/src/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { CATEGORY_CONFIGS, HOMEPAGE_TAB_CATEGORIES } from '@/src/lib/config/category-config';
import { ROUTES } from '@/src/lib/constants/routes';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
    <Tabs value={activeTab} onValueChange={onTabChange} className={UI_CLASSES.SPACE_Y_8}>
      <TabsList className="grid w-full lg:w-auto lg:grid-flow-col lg:auto-cols-fr gap-1">
        {HOMEPAGE_TAB_CATEGORIES.map((tab) => {
          // Get display name from category config, or use tab name
          let displayName = tab.charAt(0).toUpperCase() + tab.slice(1);

          if (tab !== 'all' && tab !== 'community') {
            const config = CATEGORY_CONFIGS[tab];
            if (config) {
              displayName = config.pluralTitle;
            }
          }

          return (
            <TabsTrigger key={tab} value={tab} className={UI_CLASSES.TEXT_SM}>
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
            : CATEGORY_CONFIGS[tab]?.pluralTitle?.toLowerCase() || tab;

        return (
          <TabsContent key={tab} value={tab} className={UI_CLASSES.SPACE_Y_6}>
            {filteredResults.length > 0 ? (
              <VirtualizedGrid<UnifiedContentItem>
                items={filteredResults}
                estimateSize={400}
                overscan={5}
                gap={24}
                renderItem={(item: UnifiedContentItem) => (
                  <ConfigCard
                    item={item}
                    variant="default"
                    showCategory={true}
                    showActions={true}
                  />
                )}
                emptyMessage={`No ${categoryName} found`}
                keyExtractor={(item: UnifiedContentItem) => item.slug}
              />
            ) : (
              <div className={`${UI_CLASSES.TEXT_CENTER} py-12`}>
                <p className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                  No {categoryName} found
                </p>
                <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-2`}>
                  Try adjusting your filters.
                </p>
              </div>
            )}
          </TabsContent>
        );
      })}

      {/* Community tab with custom content */}
      <TabsContent value="community" className={UI_CLASSES.SPACE_Y_6}>
        <div className={`${UI_CLASSES.TEXT_CENTER} ${UI_CLASSES.MB_8}`}>
          <h3 className={`text-2xl ${UI_CLASSES.FONT_BOLD} ${UI_CLASSES.MB_2}`}>
            Featured Contributors
          </h3>
          <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
            Meet the experts creating amazing Claude configurations
          </p>
        </div>

        <div className={UI_CLASSES.TEXT_CENTER}>
          <p
            className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} ${UI_CLASSES.MB_6}`}
          >
            Coming soon! Featured contributors who create amazing Claude configurations.
          </p>
        </div>

        <div className={`${UI_CLASSES.TEXT_CENTER} pt-8`}>
          <Button variant="outline" asChild>
            <Link href={ROUTES.COMMUNITY}>View All Contributors</Link>
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export const TabsSection = memo(TabsSectionComponent);
