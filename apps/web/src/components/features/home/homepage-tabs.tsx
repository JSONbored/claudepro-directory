'use client';

/** Homepage tabs consuming homepageConfigs for runtime-tunable tab categories */

import { getHomepageConfigBundle } from '@heyclaude/web-runtime/config/static-configs';
import { type UnifiedCategoryConfig } from '@heyclaude/web-runtime/core';
import { getTrendingSlugs, isNewSince } from '@heyclaude/web-runtime/core';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { type DisplayableContent } from '@heyclaude/web-runtime/types/component.types';
import {
  UnifiedBadge,
  UnifiedCardGrid,
  ConfigCard,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@heyclaude/web-runtime/ui';
import { MICROINTERACTIONS } from '@heyclaude/web-runtime/design-system';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useAuthModal } from '@/src/hooks/use-auth-modal';

export interface TabsSectionProps {
  activeTab: string;
  categoryConfigs: Record<string, UnifiedCategoryConfig>;
  filteredResults: readonly DisplayableContent[];
  onFetchMore?: () => Promise<void>;
  onTabChange: (value: string) => void;
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
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();

  const handleAuthRequired = useCallback(() => {
    openAuthModal({
      valueProposition: 'Sign in to save bookmarks',
      redirectTo: pathname ?? undefined,
    });
  }, [openAuthModal, pathname]);

  // Get static config bundle
  useEffect(() => {
    const bundle = getHomepageConfigBundle();

    // Extract tab categories from homepage config
    const categories = Array.isArray(bundle.homepageConfig['homepage.tab_categories'])
      ? bundle.homepageConfig['homepage.tab_categories']
      : [];
    setTabCategories(categories.map(String));
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
              <motion.div key={tab} whileTap={MICROINTERACTIONS.button.tap} transition={MICROINTERACTIONS.button.transition}>
                <TabsTrigger
                  value={tab}
                  className="px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm"
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
              keyExtractor={(item, index) => {
                // Use slug for unique keys
                // DisplayableContent doesn't have an id property
                // Use index as fallback instead of Math.random() to prevent hydration mismatches
                const uniqueId = item.slug ?? `item-${index}`;
                return `${tab}-${uniqueId}`;
              }}
              renderCard={(item) => {
                const slug = typeof item.slug === 'string' ? item.slug : null;
                const showNew = Boolean(weekStartDate && isNewSince(item, weekStartDate));
                const showTrending = Boolean(slug && trendingSlugs.has(slug));

                return (
                  <div className="relative h-full">
                    {showNew || showTrending ? (
                      <TooltipProvider delayDuration={300}>
                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                          {showNew ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <UnifiedBadge
                                    variant="base"
                                    style="secondary"
                                    className="text-[10px] uppercase pointer-events-auto"
                                  >
                                    New this week
                                  </UnifiedBadge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                Added or updated within the last 7 days
                              </TooltipContent>
                            </Tooltip>
                          ) : null}
                          {showTrending ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <UnifiedBadge
                                    variant="base"
                                    style="outline"
                                    className="text-[10px] uppercase pointer-events-auto"
                                  >
                                    Trending
                                  </UnifiedBadge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                Most viewed and copied configurations this week
                              </TooltipContent>
                            </Tooltip>
                          ) : null}
                        </div>
                      </TooltipProvider>
                    ) : null}
                    <ConfigCard
                      item={item}
                      variant="default"
                      showCategory
                      showActions
                      onAuthRequired={handleAuthRequired}
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
        <div className="mb-8 text-center">
          <h3 className="mb-2 text-2xl font-bold">Featured Contributors</h3>
          <p className="text-muted-foreground">
            Meet the experts creating amazing Claude configurations
          </p>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-6 text-lg">
            Coming soon! Featured contributors who create amazing Claude configurations.
          </p>
        </div>

        <div className="pt-8 text-center">
          <Button variant="outline" asChild>
            <Link href={ROUTES.COMMUNITY}>View All Contributors</Link>
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export const TabsSection = memo(TabsSectionComponent);
