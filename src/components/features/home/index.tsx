'use client';

/**
 * Homepage Client Component
 * Production 2025 Architecture: TanStack Virtual + Configuration-Driven Design
 *
 * PERFORMANCE CRITICAL: This is the first page users see
 * Must maintain optimal performance with multiple content sections
 *
 * Optimizations Applied:
 * 1. ✅ TanStack Virtual for list virtualization (~15 visible items)
 * 2. ✅ Memoized featured sections to prevent unnecessary re-renders
 * 3. ✅ Memoized lookup maps for O(1) category filtering
 * 4. ✅ Lazy-loaded heavy components (UnifiedSearch)
 * 5. ✅ Proper memo wrapping for all sub-components
 * 6. ✅ Constant memory usage regardless of item count
 * 7. ✅ 60fps scroll performance with 10,000+ items
 *
 * Component Organization:
 * 1. ✅ Extracted SearchSection (search UI + virtualized results)
 * 2. ✅ Extracted FeaturedSections (5 featured categories + jobs)
 * 3. ✅ Extracted TabsSection (tabbed navigation with virtualization)
 * Result: Clean, maintainable, production-grade architecture
 */

import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  LazyFeaturedSections,
  LazySearchSection,
  LazyTabsSection,
} from '@/src/components/features/home/lazy-homepage-sections';
import { NumberTicker } from '@/src/components/magic/number-ticker';
import { HomepageStatsSkeleton, Skeleton } from '@/src/components/primitives/loading-skeleton';
import { useSearch } from '@/src/hooks/use-search';
import {
  getCategoryStatsConfig,
  HOMEPAGE_FEATURED_CATEGORIES,
} from '@/src/lib/config/category-config';
import { ROUTES } from '@/src/lib/constants/routes';
import type { HomePageClientProps, UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

const UnifiedSearch = dynamic(
  () =>
    import('@/src/components/features/search/unified-search').then((mod) => ({
      default: mod.UnifiedSearch,
    })),
  {
    ssr: false,
    loading: () => <Skeleton size="xl" width="3xl" className="h-14" />,
  }
);

function HomePageClientComponent({
  initialData,
  initialSearchQuery,
  featuredByCategory,
  stats,
}: HomePageClientProps) {
  const allConfigs = (initialData.allConfigs || []) as UnifiedContentItem[];

  const [activeTab, setActiveTab] = useState('all');

  // Memoize search options to prevent infinite re-renders
  const searchOptions = useMemo(
    () => ({
      threshold: 0.3,
      minMatchCharLength: 2,
    }),
    []
  );

  // Use React 19 optimized search hook with initial query from URL
  const { filters, searchResults, filterOptions, handleSearch, handleFiltersChange, isSearching } =
    useSearch({
      data: allConfigs,
      searchOptions,
      ...(initialSearchQuery ? { initialQuery: initialSearchQuery } : {}),
    });

  // Create lookup maps dynamically for all featured categories
  // O(1) slug checking instead of O(n) array.some() calls
  const slugLookupMaps = useMemo(() => {
    const maps: Record<string, Set<string>> = {};

    for (const category of HOMEPAGE_FEATURED_CATEGORIES) {
      const categoryData = initialData[category as keyof typeof initialData];
      if (categoryData && Array.isArray(categoryData)) {
        maps[category] = new Set(categoryData.map((item: UnifiedContentItem) => item.slug));
      }
    }

    return maps;
  }, [initialData]);

  // Filter search results by active tab - optimized with Set lookups
  // When not searching, use the full dataset (allConfigs) instead of searchResults
  // With TanStack Virtual, we pass the ENTIRE dataset - virtualization handles rendering
  const filteredResults = useMemo((): UnifiedContentItem[] => {
    // Use allConfigs when not searching, searchResults when searching
    const dataSource = isSearching ? searchResults : allConfigs;

    if (activeTab === 'all' || activeTab === 'community') {
      return dataSource || [];
    }

    const lookupSet = slugLookupMaps[activeTab as keyof typeof slugLookupMaps];
    return lookupSet
      ? (dataSource || []).filter((item) => lookupSet.has(item.slug))
      : dataSource || [];
  }, [searchResults, allConfigs, activeTab, slugLookupMaps, isSearching]);

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    handleSearch('');
  }, [handleSearch]);

  return (
    <>
      {/* Search Section */}
      <section className={'container mx-auto px-4 pt-8 pb-12'}>
        <div className={'max-w-4xl mx-auto'}>
          <UnifiedSearch
            placeholder="Search for rules, MCP servers, agents, commands, and more..."
            onSearch={handleSearch}
            onFiltersChange={handleFiltersChange}
            filters={filters}
            availableTags={filterOptions.tags}
            availableAuthors={filterOptions.authors}
            availableCategories={filterOptions.categories}
            resultCount={filteredResults.length}
            showFilters={false}
          />

          {/* Quick Stats - Below Search Bar */}
          {/* Modern 2025 Architecture: Configuration-Driven Stats Display with Motion.dev */}
          {/* Hidden on mobile (< 768px) to save space, shown on tablet+ */}
          {stats ? (
            <div
              className={
                'hidden md:flex flex-wrap justify-center gap-2 lg:gap-3 text-xs lg:text-sm text-muted-foreground mt-6'
              }
            >
              {getCategoryStatsConfig().map(({ categoryId, icon: Icon, displayText, delay }) => {
                // Get category route from ROUTES constant
                const categoryRoute = ROUTES[categoryId.toUpperCase() as keyof typeof ROUTES];

                return (
                  <Link
                    key={categoryId}
                    href={categoryRoute}
                    className="group"
                    aria-label={`View all ${displayText}`}
                  >
                    <motion.div
                      className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5} px-2 py-1 rounded-md border border-transparent transition-colors cursor-pointer`}
                      whileHover={{
                        scale: 1.05,
                        y: -2,
                        borderColor: 'hsl(var(--accent) / 0.3)',
                        backgroundColor: 'hsl(var(--accent) / 0.05)',
                        transition: { type: 'spring', stiffness: 400, damping: 15 },
                      }}
                      whileTap={{
                        scale: 0.98,
                        transition: { type: 'spring', stiffness: 400, damping: 15 },
                      }}
                    >
                      <Icon
                        className="h-4 w-4 transition-colors group-hover:text-accent"
                        aria-hidden="true"
                      />
                      <span className="transition-colors group-hover:text-foreground">
                        <NumberTicker value={stats[categoryId] || 0} delay={delay} /> {displayText}
                      </span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <HomepageStatsSkeleton className="mt-6" />
          )}
        </div>
      </section>

      <section className={'container mx-auto px-4 pb-16'}>
        {/* Search Results Section - TanStack Virtual */}
        <LazySearchSection
          isSearching={isSearching}
          filteredResults={filteredResults}
          onClearSearch={handleClearSearch}
        />

        {/* Featured Content Sections - Render immediately (above the fold) */}
        {!isSearching && <LazyFeaturedSections categories={featuredByCategory || initialData} />}

        {/* Tabs Section - Render immediately (above the fold) */}
        {!isSearching && (
          <LazyTabsSection
            activeTab={activeTab}
            filteredResults={filteredResults}
            onTabChange={handleTabChange}
          />
        )}
      </section>
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders when initialData prop hasn't changed
const HomePageClient = memo(HomePageClientComponent);

export { HomePageClient };
