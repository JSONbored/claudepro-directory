'use client';

/**
 * TabsSection Component
 * SHA-2102: Extracted from home-page-client.tsx for better modularity
 *
 * Handles tabbed content navigation with infinite scroll
 */

import Link from 'next/link';
import { type FC, memo } from 'react';
import { LazyConfigCard, LazyInfiniteScrollContainer } from '@/components/shared/lazy-components';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UnifiedContentItem } from '@/lib/schemas/component.schema';
import { UI_CLASSES } from '@/lib/ui-constants';

interface TabsSectionProps {
  activeTab: string;
  displayedItems: UnifiedContentItem[];
  filteredResults: readonly UnifiedContentItem[];
  hasMore: boolean;
  loadMore: () => Promise<UnifiedContentItem[]>;
  onTabChange: (value: string) => void;
}

const TabsSectionComponent: FC<TabsSectionProps> = ({
  activeTab,
  displayedItems,
  filteredResults,
  hasMore,
  loadMore,
  onTabChange,
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={UI_CLASSES.SPACE_Y_8}>
      <TabsList className={`grid ${UI_CLASSES.W_FULL} lg:w-auto grid-cols-7`}>
        <TabsTrigger value="all" className={UI_CLASSES.TEXT_SM}>
          All
        </TabsTrigger>
        <TabsTrigger value="rules" className={UI_CLASSES.TEXT_SM}>
          Rules
        </TabsTrigger>
        <TabsTrigger value="mcp" className={UI_CLASSES.TEXT_SM}>
          MCP
        </TabsTrigger>
        <TabsTrigger value="agents" className={UI_CLASSES.TEXT_SM}>
          Agents
        </TabsTrigger>
        <TabsTrigger value="commands" className={UI_CLASSES.TEXT_SM}>
          Commands
        </TabsTrigger>
        <TabsTrigger value="hooks" className={UI_CLASSES.TEXT_SM}>
          Hooks
        </TabsTrigger>
        <TabsTrigger value="community" className={UI_CLASSES.TEXT_SM}>
          Community
        </TabsTrigger>
      </TabsList>

      {/* Tab content for all tabs except community */}
      {['all', 'rules', 'mcp', 'agents', 'commands', 'hooks'].map((tab) => (
        <TabsContent key={tab} value={tab} className={UI_CLASSES.SPACE_Y_6}>
          {filteredResults.length > 0 ? (
            <LazyInfiniteScrollContainer<UnifiedContentItem>
              items={displayedItems}
              renderItem={(item: UnifiedContentItem, _index: number) => (
                <LazyConfigCard
                  key={item.slug}
                  item={item}
                  variant="default"
                  showCategory={true}
                  showActions={true}
                />
              )}
              loadMore={loadMore}
              hasMore={hasMore}
              pageSize={20}
              gridClassName={UI_CLASSES.GRID_RESPONSIVE_3}
              emptyMessage={`No ${tab === 'all' ? 'configurations' : tab} found`}
              keyExtractor={(item: UnifiedContentItem, _index: number) => item.slug}
            />
          ) : (
            <div className={`${UI_CLASSES.TEXT_CENTER} py-12`}>
              <p className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                No {tab === 'all' ? 'configurations' : tab} found
              </p>
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-2`}>
                Try adjusting your filters.
              </p>
            </div>
          )}
        </TabsContent>
      ))}

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
            <Link href="/community">View All Contributors</Link>
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export const TabsSection = memo(TabsSectionComponent);
