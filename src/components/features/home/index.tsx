'use client';

/**
 * Homepage Client Component
 * Database-First 2025 Architecture: Server data with client interactivity
 *
 * PERFORMANCE CRITICAL: This is the first page users see
 * Data fetched server-side, search redirects to /search page
 *
 * Architecture Changes (2025-10-30):
 * 1. ✅ Data fetched from content table (server-side in page.tsx)
 * 2. ✅ Search uses direct Supabase RPC (database-first, no API route)
 * 3. ✅ No client-side filtering - just display and navigation
 * 4. ✅ Client-only for animations and interactions
 *
 * Component Organization:
 * 1. ✅ Display server-fetched data
 * 2. ✅ Handle search navigation
 * 3. ✅ Interactive UI elements (motion, tabs)
 * Result: Hybrid architecture - server data, client UX
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
import {
  getCategoryConfigs,
  getCategoryStatsConfig,
  HOMEPAGE_FEATURED_CATEGORIES,
} from '@/src/lib/config/category-config';
import { ROUTES } from '@/src/lib/constants/routes';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { logger } from '@/src/lib/logger';
import type { FilterState } from '@/src/lib/schemas/component.schema';
import type { HomePageClientProps } from '@/src/lib/schemas/components/page-props.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * OPTIMIZATION (2025-10-22): Enabled SSR for UnifiedSearch
 * Search bar renders immediately on server, improving perceived performance
 * Interactive search functionality works after client-side hydration
 * Saves ~200-300ms of skeleton display time
 */
const UnifiedSearch = dynamic(
  () =>
    import('@/src/components/features/search/unified-search').then((mod) => ({
      default: mod.UnifiedSearch,
    })),
  {
    ssr: true, // SSR enabled: Search bar visible immediately
    loading: () => <Skeleton size="xl" width="3xl" className="h-14" />,
  }
);

function HomePageClientComponent({
  initialData,
  initialSearchQuery,
  featuredByCategory,
  stats,
}: HomePageClientProps) {
  const allConfigs = (initialData.allConfigs || []) as ContentItem[];
  const [activeTab, setActiveTab] = useState('all');
  const [searchResults, setSearchResults] = useState<ContentItem[]>(allConfigs);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({});

  // Get category configs from static imports (client-side)
  const categoryStatsConfig = useMemo(() => getCategoryStatsConfig(), []);
  const categoryConfigs = useMemo(() => getCategoryConfigs(), []);

  // Handle search using direct Supabase RPC call (database-first)
  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults(allConfigs);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        // Direct database RPC call - no API route middleman
        const { createClient } = await import('@/src/lib/supabase/client');
        const supabase = createClient();

        const { data, error } = await supabase.rpc('search_content_optimized', {
          p_query: query.trim(),
          p_limit: 50,
        });

        if (error) throw error;
        // RPC returns search results - cast to ContentItem[]
        setSearchResults((data || []) as unknown as ContentItem[]);
      } catch (error) {
        logger.error('Search failed', error as Error, { source: 'HomePageSearch' });
        setSearchResults(allConfigs);
      } finally {
        setIsSearching(false);
      }
    },
    [allConfigs]
  );

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const filterOptions = { tags: [], authors: [], categories: [] };

  // Create lookup maps dynamically for all featured categories
  // O(1) slug checking instead of O(n) array.some() calls
  const slugLookupMaps = useMemo(() => {
    const maps: Record<string, Set<string>> = {};

    for (const category of HOMEPAGE_FEATURED_CATEGORIES) {
      const categoryData = initialData[category as keyof typeof initialData];
      if (categoryData && Array.isArray(categoryData)) {
        maps[category] = new Set(categoryData.map((item: ContentItem) => item.slug));
      }
    }

    return maps;
  }, [initialData]);

  // Filter search results by active tab - optimized with Set lookups
  // When not searching, use the full dataset (allConfigs) instead of searchResults
  // With Intersection Observer infinite scroll, we pass the ENTIRE dataset - pagination handles rendering
  const filteredResults = useMemo((): ContentItem[] => {
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
        <div className={'mx-auto max-w-4xl'}>
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

          {/* Quick Stats - Below Search Bar - ENHANCED mobile version */}
          {/* Modern 2025 Architecture: Configuration-Driven Stats Display with Motion.dev */}
          {stats ? (
            <>
              {/* Mobile Stats - Compact horizontal scroll carousel */}
              <motion.div
                className="scrollbar-hide mt-6 overflow-x-auto md:hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex gap-3 px-4 pb-2">
                  {categoryStatsConfig.slice(0, 5).map(({ categoryId, icon: Icon, delay }) => {
                    const categoryRoute = ROUTES[categoryId.toUpperCase() as keyof typeof ROUTES];

                    return (
                      <Link key={categoryId} href={categoryRoute}>
                        <motion.div
                          className="flex min-w-fit items-center gap-2 whitespace-nowrap rounded-lg border border-border/40 bg-card/50 px-4 py-2.5 backdrop-blur-sm"
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
                          <span className="font-medium text-sm">
                            <NumberTicker value={stats[categoryId] || 0} delay={delay} />
                          </span>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>

              {/* Desktop Stats - Full layout (unchanged) */}
              <div
                className={
                  'mt-6 hidden flex-wrap justify-center gap-2 text-muted-foreground text-xs md:flex lg:gap-3 lg:text-sm'
                }
              >
                {categoryStatsConfig.map(({ categoryId, icon: Icon, displayText, delay }) => {
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
                        className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5} cursor-pointer rounded-md border border-transparent px-2 py-1 transition-colors`}
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
                          <NumberTicker value={stats[categoryId] || 0} delay={delay} />{' '}
                          {displayText}
                        </span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </>
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
        {!isSearching && (
          <LazyFeaturedSections
            categories={featuredByCategory || initialData}
            categoryConfigs={categoryConfigs}
          />
        )}

        {/* Tabs Section - Render immediately (above the fold) */}
        {!isSearching && (
          <LazyTabsSection
            activeTab={activeTab}
            filteredResults={filteredResults}
            onTabChange={handleTabChange}
            categoryConfigs={categoryConfigs}
          />
        )}
      </section>
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders when initialData prop hasn't changed
const HomePageClient = memo(HomePageClientComponent);

export { HomePageClient };
