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
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { NumberTicker } from '@/src/components/core/magic/number-ticker';
import {
  LazyFeaturedSections,
  LazySearchSection,
  LazyTabsSection,
} from '@/src/components/features/home/lazy-homepage-sections';
import { HomepageStatsSkeleton, Skeleton } from '@/src/components/primitives/loading-skeleton';
import {
  getCategoryConfigs,
  getCategoryStatsConfig,
  HOMEPAGE_FEATURED_CATEGORIES,
} from '@/src/lib/config/category-config';
import { ROUTES } from '@/src/lib/constants';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { logger } from '@/src/lib/logger';
import type { DisplayableContent, FilterState } from '@/src/lib/types/component.types';
import type { HomePageClientProps } from '@/src/lib/types/page-props.types';
import { ANIMATION_CONSTANTS, UI_CLASSES } from '@/src/lib/ui-constants';

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

function HomePageClientComponent({ initialData, featuredByCategory, stats }: HomePageClientProps) {
  const [allConfigs, setAllConfigs] = useState<ContentItem[]>([]);
  const [isLoadingAllConfigs, setIsLoadingAllConfigs] = useState(false);
  const [hasMoreAllConfigs, setHasMoreAllConfigs] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchResults, setSearchResults] = useState<DisplayableContent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({});
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');

  const categoryStatsConfig = useMemo(() => getCategoryStatsConfig(), []);
  const categoryConfigs = useMemo(() => getCategoryConfigs(), []);

  const fetchAllConfigs = useCallback(
    async (offset: number, limit = 30) => {
      if (isLoadingAllConfigs || !hasMoreAllConfigs) return;

      setIsLoadingAllConfigs(true);

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!(supabaseUrl && supabaseKey)) {
          throw new Error('Missing Supabase environment variables');
        }

        const url = `${supabaseUrl}/functions/v1/content-paginated?offset=${offset}&limit=${limit}&category=all`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const newItems: ContentItem[] = await response.json();

        if (newItems.length < limit) {
          setHasMoreAllConfigs(false);
        }

        setAllConfigs((prev) => [...prev, ...newItems]);
      } catch (error) {
        logger.error('Failed to load content', error as Error, { source: 'fetchAllConfigs' });
      } finally {
        setIsLoadingAllConfigs(false);
      }
    },
    [isLoadingAllConfigs, hasMoreAllConfigs]
  );

  const handleFetchMore = useCallback(async () => {
    await fetchAllConfigs(allConfigs.length);
  }, [fetchAllConfigs, allConfigs.length]);

  useEffect(() => {
    if (activeTab === 'all' && allConfigs.length === 0 && !isLoadingAllConfigs) {
      fetchAllConfigs(0).catch(() => {
        // Error already logged in fetchAllConfigs
      });
    }
  }, [activeTab, allConfigs.length, fetchAllConfigs, isLoadingAllConfigs]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(
    async (query: string, categoryOverride?: string) => {
      if (!query.trim()) {
        setSearchResults(allConfigs);
        setIsSearching(false);
        setCurrentSearchQuery('');
        return;
      }

      setCurrentSearchQuery(query.trim());
      setIsSearching(true);

      try {
        const { searchContent } = await import('@/src/lib/edge/search-client');

        const effectiveTab = categoryOverride ?? activeTab;
        const categories =
          effectiveTab !== 'all' && effectiveTab !== 'community' ? [effectiveTab] : undefined;

        const response = await searchContent(query.trim(), {
          ...(categories && { categories }),
          limit: 50,
        });

        setSearchResults(response.results);
      } catch (error) {
        logger.error('Search failed', error as Error, { source: 'HomePageSearch' });
        setSearchResults(allConfigs);
      } finally {
        setIsSearching(false);
      }
    },
    [allConfigs, activeTab]
  );

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const filterOptions = { tags: [], authors: [], categories: [] };

  // Create lookup maps dynamically for all featured categories
  // O(1) slug checking instead of O(n) array.some() calls
  // Only used for non-search tab filtering
  const slugLookupMaps = useMemo(() => {
    const maps: Record<string, Set<string>> = {};

    for (const category of HOMEPAGE_FEATURED_CATEGORIES) {
      const categoryData = initialData[category as keyof typeof initialData];
      if (categoryData && Array.isArray(categoryData)) {
        maps[category] = new Set(categoryData.map((item: DisplayableContent) => item.slug));
      }
    }

    return maps;
  }, [initialData]);

  // Filter results by active tab
  // Performance: When searching, DB filters by category (no client-side filtering needed)
  // When not searching, use Set lookups for O(1) filtering
  const filteredResults = useMemo((): DisplayableContent[] => {
    if (isSearching) {
      // DB already filtered by category - return as-is
      return searchResults || [];
    }

    // Not searching - filter allConfigs by tab
    const dataSource = allConfigs;

    if (activeTab === 'all' || activeTab === 'community') {
      return dataSource || [];
    }

    const lookupSet = slugLookupMaps[activeTab as keyof typeof slugLookupMaps];
    return lookupSet
      ? (dataSource || []).filter((item) => lookupSet.has(item.slug))
      : dataSource || [];
  }, [searchResults, allConfigs, activeTab, slugLookupMaps, isSearching]);

  // Handle tab change - re-trigger search if currently searching
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      // If currently searching, re-run search with new category filter (DB-side)
      if (isSearching && currentSearchQuery) {
        handleSearch(currentSearchQuery, value).catch(() => {
          // Silent fail - search will retry on next user interaction
        });
      }
    },
    [isSearching, currentSearchQuery, handleSearch]
  );

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    handleSearch('').catch(() => {
      // Silent fail - search cleared on error
    });
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
                          transition={ANIMATION_CONSTANTS.SPRING_DEFAULT}
                        >
                          <Icon
                            className={`${UI_CLASSES.ICON_SM} flex-shrink-0 text-accent`}
                            aria-hidden="true"
                          />
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
                      className="group no-underline"
                      aria-label={`View all ${displayText}`}
                    >
                      <motion.div
                        className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5} cursor-pointer rounded-md border border-transparent px-2 py-1 transition-colors`}
                        whileHover={{
                          scale: 1.05,
                          y: -2,
                          borderColor: 'hsl(var(--accent) / 0.3)',
                          backgroundColor: 'hsl(var(--accent) / 0.05)',
                          transition: ANIMATION_CONSTANTS.SPRING_DEFAULT,
                        }}
                        whileTap={{
                          scale: 0.98,
                          transition: ANIMATION_CONSTANTS.SPRING_DEFAULT,
                        }}
                      >
                        <Icon
                          className={`${UI_CLASSES.ICON_SM} transition-colors group-hover:text-accent`}
                          aria-hidden="true"
                        />
                        <span className={`transition-colors ${UI_CLASSES.GROUP_HOVER_ACCENT}`}>
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
            onFetchMore={handleFetchMore}
            serverHasMore={hasMoreAllConfigs}
          />
        )}
      </section>
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders when initialData prop hasn't changed
const HomePageClient = memo(HomePageClientComponent);

export { HomePageClient };
