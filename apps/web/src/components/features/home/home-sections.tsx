'use client';

/** Homepage client consuming homepageConfigs for runtime-tunable featured categories */

import type { Database } from '@heyclaude/database-types';
import {
  logClientWarning,
  logger,
  logUnhandledPromise,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import {
  getAnimationConfig,
  getCategoryConfigs,
  getCategoryStatsConfig,
  getHomepageFeaturedCategories,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import type {
  ContentItem,
  DisplayableContent,
  FilterState,
  HomePageClientProps,
} from '@heyclaude/web-runtime/types/component.types';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  LazyFeaturedSections,
  LazySearchSection,
  LazyTabsSection,
} from '@/src/components/features/home/lazy-home-sections';
import { NumberTicker } from '@/src/components/primitives/animation/number-ticker';
import {
  HomepageStatsSkeleton,
  Skeleton,
} from '@/src/components/primitives/feedback/loading-skeleton';

/**
 * OPTIMIZATION (2025-10-22): Enabled SSR for UnifiedSearch
 * Search bar renders immediately on server, improving perceived performance
 * Interactive search functionality works after client-side hydration
 * Saves ~200-300ms of skeleton display time
 */
const UnifiedSearch = dynamic(
  () =>
    import('@/src/components/features/search/search').then((mod) => ({
      default: mod.UnifiedSearch,
    })),
  {
    ssr: true, // SSR enabled: Search bar visible immediately
    loading: () => <Skeleton size="xl" width="3xl" className="h-14" />,
  }
);

function HomePageClientComponent({
  initialData,
  featuredByCategory,
  stats,
  featuredJobs = [],
  searchFilters,
  weekStart,
}: HomePageClientProps) {
  const [allConfigs, setAllConfigs] = useState<ContentItem[]>([]);
  const [isLoadingAllConfigs, setIsLoadingAllConfigs] = useState(false);
  const [hasMoreAllConfigs, setHasMoreAllConfigs] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchResults, setSearchResults] = useState<DisplayableContent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({});
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [featuredCategories, setFeaturedCategories] = useState<
    readonly Database['public']['Enums']['content_category'][]
  >([]);
  const [springDefault, setSpringDefault] = useState({
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
  });

  const categoryStatsConfig = useMemo(() => getCategoryStatsConfig(), []);
  const categoryConfigs = useMemo(() => getCategoryConfigs(), []);

  useEffect(() => {
    getHomepageFeaturedCategories()
      .then((categories) => {
        setFeaturedCategories(categories);
      })
      .catch((error) => {
        logClientWarning('HomePageClient: failed to load featured categories', error);
      });
  }, []);

  useEffect(() => {
    getAnimationConfig()
      .then((result) => {
        if (!result) return;
        const config = result;
        setSpringDefault({
          type: 'spring' as const,
          stiffness: config['animation.spring.default.stiffness'],
          damping: config['animation.spring.default.damping'],
        });
      })
      .catch((error) => {
        logger.error('HomePageClient: failed to load animation config', error);
      });
  }, []);

  const fetchAllConfigs = useCallback(
    async (offset: number, limit = 30) => {
      if (isLoadingAllConfigs || !hasMoreAllConfigs) return;

      setIsLoadingAllConfigs(true);

      try {
        const { fetchPaginatedContent } = await import('@heyclaude/web-runtime');

        const result = await fetchPaginatedContent({
          offset,
          limit,
          category: null,
        });

        if (result?.serverError) {
          // Error already logged by safe-action middleware
          const normalized = normalizeError(result.serverError, 'Failed to load content');
          logger.error('Failed to load content', normalized, {
            source: 'fetchAllConfigs',
          });
        }

        const newItems = (result ?? []) as ContentItem[];

        if (newItems.length < limit) {
          setHasMoreAllConfigs(false);
        }

        setAllConfigs((prev) => [...prev, ...newItems]);
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to load content');
        logger.error('Failed to load content', normalized, { source: 'fetchAllConfigs' });
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
      fetchAllConfigs(0).catch((error) => {
        logUnhandledPromise('HomePageClient: initial fetchAllConfigs failed', error);
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
        const { searchUnifiedClient } = await import('@heyclaude/web-runtime/edge/search-client');

        const effectiveTab = categoryOverride ?? activeTab;
        const categories =
          effectiveTab !== 'all' && effectiveTab !== 'community' ? [effectiveTab] : undefined;

        const result = await searchUnifiedClient({
          query: query.trim(),
          entities: ['content'],
          filters: {
            limit: 50,
            ...(categories ? { categories } : {}),
          },
        });

        setSearchResults(result.results as DisplayableContent[]);
      } catch (error) {
        const normalized = normalizeError(error, 'Search failed');
        logger.error('Search failed', normalized, { source: 'HomePageSearch' });
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

  const filterOptions = useMemo(
    () => ({
      tags: searchFilters?.tags ?? [],
      authors: searchFilters?.authors ?? [],
      categories: searchFilters?.categories ?? [],
    }),
    [searchFilters]
  );

  // Create lookup maps dynamically for all featured categories
  // O(1) slug checking instead of O(n) array.some() calls
  const slugLookupMaps = useMemo(() => {
    const maps: Record<string, Set<string>> = {};

    for (const category of featuredCategories) {
      const categoryData = initialData[category as keyof typeof initialData];
      if (categoryData && Array.isArray(categoryData)) {
        // Cast to DisplayableContent[] since we know the structure from RPC
        maps[category] = new Set(
          (categoryData as DisplayableContent[])
            .map((item) => item.slug)
            .filter((slug): slug is string => slug !== null && slug !== undefined)
        );
      }
    }

    return maps;
  }, [initialData, featuredCategories]);

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
        handleSearch(currentSearchQuery, value).catch((error) => {
          logUnhandledPromise('HomePageClient: search retry failed', error, {
            tab: value,
          });
        });
      }
    },
    [isSearching, currentSearchQuery, handleSearch]
  );

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    handleSearch('').catch((error) => {
      logUnhandledPromise('HomePageClient: clear search failed', error);
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
                          transition={springDefault}
                        >
                          <Icon
                            className={`${UI_CLASSES.ICON_SM} shrink-0-accent`}
                            aria-hidden="true"
                          />
                          <span className="font-medium text-sm">
                            <NumberTicker
                              value={
                                typeof stats[categoryId] === 'number'
                                  ? stats[categoryId]
                                  : stats[categoryId]?.total || 0
                              }
                              delay={delay}
                            />
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
                          transition: springDefault,
                        }}
                        whileTap={{
                          scale: 0.98,
                          transition: springDefault,
                        }}
                      >
                        <Icon
                          className={`${UI_CLASSES.ICON_SM} transition-colors group-hover:text-accent`}
                          aria-hidden="true"
                        />
                        <span className={`transition-colors ${UI_CLASSES.GROUP_HOVER_ACCENT}`}>
                          <NumberTicker
                            value={
                              typeof stats[categoryId] === 'number'
                                ? stats[categoryId]
                                : stats[categoryId]?.total || 0
                            }
                            delay={delay}
                          />{' '}
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
          searchQuery={currentSearchQuery}
        />

        {/* Featured Content Sections - Render immediately (above the fold) */}
        {!isSearching && (
          <LazyFeaturedSections
            categories={
              (featuredByCategory || initialData) as Record<string, readonly DisplayableContent[]>
            }
            categoryConfigs={categoryConfigs}
            featuredJobs={
              featuredJobs as ReadonlyArray<Database['public']['Tables']['jobs']['Row']>
            }
            featuredCategories={featuredCategories}
            {...(weekStart ? { weekStart } : {})}
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
            {...(weekStart ? { weekStart } : {})}
          />
        )}
      </section>
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders when initialData prop hasn't changed
const HomePageClient = memo(HomePageClientComponent);

export { HomePageClient };
