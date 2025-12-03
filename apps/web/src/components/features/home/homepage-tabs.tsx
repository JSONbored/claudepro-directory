'use client';

/** Homepage tabs consuming homepageConfigs for runtime-tunable tab categories */

import { HOMEPAGE_CONFIG } from '@heyclaude/web-runtime/config/unified-config';
import { type UnifiedCategoryConfig } from '@heyclaude/web-runtime/core';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import type { DisplayableContent } from '@heyclaude/web-runtime/types/component.types';
import { stack, spaceY, muted, weight, size, gap, padding, zLayer, overflow,   marginBottom,
  display,
  position,
  absolute,
  width,
  height,
  textAlign,
  paddingTop,
  minWidth,
  whitespace,
  pointerEvents,
  transform,
} from '@heyclaude/web-runtime/design-system';
import { animation } from '@heyclaude/web-runtime/design-system/tokens';
import { motion } from 'motion/react';
import Link from 'next/link';
import { type FC, memo, useEffect, useMemo, useState } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { UnifiedCardGrid } from '@heyclaude/web-runtime/ui';
import { ConfigCard } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@heyclaude/web-runtime/ui';
import { getTrendingSlugs, isNewSince } from '@heyclaude/web-runtime/core';

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

  // Get homepage config from unified-config
  useEffect(() => {
    // Extract tab categories from homepage config
    const categories = Array.isArray(HOMEPAGE_CONFIG.tab_categories)
      ? HOMEPAGE_CONFIG.tab_categories
      : [];
    setTabCategories(categories.map((value) => String(value)));

    // Extract animation config from design system tokens
    setSpringDefault(animation.spring.default);
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
    <Tabs value={activeTab} onValueChange={onTabChange} className={spaceY.loose}>
      {/* Tabs with horizontal scroll on mobile/tablet */}
      <TabsList className={`scrollbar-hide ${width.full} ${gap.tight} ${overflow.xAuto} lg:${display.grid} lg:${width.auto} lg:auto-cols-fr lg:grid-flow-col`}>
        <div className={`${display.flex} ${minWidth.max} lg:contents lg:${minWidth[0]}`}>
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
                  className={`${whitespace.nowrap} ${padding.xCompact} ${size.xs} sm:${padding.xDefault} sm:${size.sm}`}
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
          <TabsContent key={tab} value={tab} className={spaceY.relaxed}>
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
                  <div className={`${position.relative} ${height.full}`}>
                    {(showNew || showTrending) && (
                      <div className={`${pointerEvents.none} ${absolute.topLeftOffset} ${zLayer.raised} ${stack.compact}`}>
                        {showNew && (
                          <UnifiedBadge
                            variant="base"
                            style="secondary"
                            className={`${size['2xs']} ${transform.uppercase}`}
                          >
                            New this week
                          </UnifiedBadge>
                        )}
                        {showTrending && (
                          <UnifiedBadge
                            variant="base"
                            style="outline"
                            className={`${size['2xs']} ${transform.uppercase}`}
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
      <TabsContent value="community" className={spaceY.relaxed}>
        <div className={`${marginBottom.relaxed} ${textAlign.center}`}>
          <h3 className={`${marginBottom.tight} ${weight.bold} ${size['2xl']}`}>Featured Contributors</h3>
          <p className={muted.default}>
            Meet the experts creating amazing Claude configurations
          </p>
        </div>

        <div className={textAlign.center}>
          <p className={`${marginBottom.comfortable} ${muted.lg}`}>
            Coming soon! Featured contributors who create amazing Claude configurations.
          </p>
        </div>

        <div className={`${paddingTop.loose} ${textAlign.center}`}>
          <Button variant="outline" asChild={true}>
            <Link href={ROUTES.COMMUNITY}>View All Contributors</Link>
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export const TabsSection = memo(TabsSectionComponent);
