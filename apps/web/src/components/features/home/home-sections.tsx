'use client';

/** Homepage client consuming homepageConfigs for runtime-tunable featured categories */

import type { Database } from '@heyclaude/database-types';
import { HOMEPAGE_CONFIG } from '@heyclaude/web-runtime/config/unified-config';
import { animation } from '@heyclaude/web-runtime/design-system/tokens';
import {
  logUnhandledPromise,
  trackHomepageSectionError,
  trackMissingData,
} from '@heyclaude/web-runtime/core';
import {
  getCategoryConfigs,
  getCategoryStatsConfig,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import {
  backdrop,
  bgColor,
  borderColor,
  cluster,
  cursor,
  flexGrow,
  flexWrap,
  gap,
  groupHover,
  iconSize,
  alignItems,
  justify,
  marginTop,
  maxWidth,
  muted,
  overflow,
  padding,
  radius,
  size,
  textColor,
  transition,
  weight,
  display,
  container,
  marginX,
  paddingTop,
  paddingBottom,
  whitespace,
  minWidth,
  border,
  height,
} from '@heyclaude/web-runtime/design-system';
import type {
  DisplayableContent,
  FilterState,
  HomePageClientProps,
} from '@heyclaude/web-runtime/types/component.types';
import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  LazyFeaturedSections,
  LazySearchSection,
  LazyTabsSection,
} from '@/src/components/features/home/lazy-home-sections';
import { NumberTicker } from '@heyclaude/web-runtime/ui';
import { HomepageStatsSkeleton, Skeleton } from '@heyclaude/web-runtime/ui';

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
    loading: () => <Skeleton size="xl" width="3xl" className={height.inputLg} />,
  }
);

/**
 * Client-side homepage component that renders search, quick stats, featured sections, and tabbed content using initial and runtime data.
 *
 * Renders an SSR-capable UnifiedSearch, a stats display (mobile carousel and desktop layout), a searchable results section, featured category sections, and a paginated tabs section. Handles client-side pagination, category-aware searching, filter state, and graceful fallbacks if static config is unavailable.
 *
 * @param initialData - Mapping of content category keys to arrays of displayable content used to populate featured sections and build slug lookup maps.
 * @param featuredByCategory - Optional override mapping of featured content per category (used by featured sections); falls back to `initialData` when not provided.
 * @param stats - Optional object with category counts used to render the quick stats display; may contain numeric values or objects with a `total` field.
 * @param featuredJobs - Optional list of featured job rows to pass into featured sections (defaults to an empty array).
 * @param searchFilters - Runtime search filter options (tags, authors, categories) exposed to the search component.
 * @param weekStart - Optional ISO date or week-start value forwarded to sections that accept a `weekStart` prop.
 * @param serverCategoryIds - Optional list of category ids provided by the server used as a fallback when static config or initialData-derived categories are unavailable.
 *
 * @returns The homepage JSX element tree rendered on the client.
 *
 * @see UnifiedSearch
 * @see LazyFeaturedSections
 * @see LazyTabsSection
 */
function HomePageClientComponent({
  initialData,
  featuredByCategory,
  stats,
  featuredJobs = [],
  searchFilters,
  weekStart,
  serverCategoryIds,
}: HomePageClientProps) {
  const [allConfigs, setAllConfigs] = useState<DisplayableContent[]>([]);
  const [isLoadingAllConfigs, setIsLoadingAllConfigs] = useState(false);
  const [hasMoreAllConfigs, setHasMoreAllConfigs] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchResults, setSearchResults] = useState<DisplayableContent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({});
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');

  const runLoggedAsync = useLoggedAsync({
    scope: 'HomePageClient',
    defaultMessage: 'Homepage operation failed',
    defaultRethrow: false,
  });

  // Initialize featuredCategories from server data immediately
  // This ensures content renders even if static config is unavailable
  const [featuredCategories, setFeaturedCategories] = useState<
    readonly Database['public']['Enums']['content_category'][]
  >(() => {
    // First, try using keys from initialData (most reliable - these are categories that have data)
    const categoriesFromData = Object.keys(initialData).filter((cat) => {
      const data = initialData[cat];
      return Array.isArray(data) && data.length > 0;
    }) as readonly Database['public']['Enums']['content_category'][];

    if (categoriesFromData.length > 0) {
      return categoriesFromData;
    }

    // Fallback: Use server-provided categoryIds if initialData is empty (shouldn't happen, but defensive)
    if (serverCategoryIds && serverCategoryIds.length > 0) {
      return serverCategoryIds as readonly Database['public']['Enums']['content_category'][];
    }

    // Final fallback: empty array
    return [] as readonly Database['public']['Enums']['content_category'][];
  });
  const [springDefault, setSpringDefault] = useState({
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
  });

  const categoryStatsConfig = useMemo(() => getCategoryStatsConfig(), []);
  const categoryConfigs = useMemo(() => getCategoryConfigs(), []);

  // Track missing stats data
  useEffect(() => {
    if (stats && Object.keys(stats).length === 0) {
      trackMissingData('stats', 'stats-data', {
        categoryStatsConfigCount: categoryStatsConfig.length,
        expectedCategories: categoryStatsConfig.map((c) => c.categoryId),
      });
    }
  }, [stats, categoryStatsConfig]);

  // Get homepage config from unified-config
  useEffect(() => {
    // Extract featured categories from homepage config
    const categories = Array.isArray(HOMEPAGE_CONFIG.featured_categories)
      ? HOMEPAGE_CONFIG.featured_categories
      : [];

    // Use static categories if available, otherwise fall back to server-provided categoryIds
    // Filter to only include categories that have data in initialData
    const validCategories =
      categories.length > 0
        ? categories.filter(
            (cat) =>
              initialData[cat] && Array.isArray(initialData[cat]) && initialData[cat].length > 0
          )
        : (serverCategoryIds ?? []).filter(
            (cat) =>
              initialData[cat] && Array.isArray(initialData[cat]) && initialData[cat].length > 0
          );

    setFeaturedCategories(
      validCategories as readonly Database['public']['Enums']['content_category'][]
    );

    // Extract animation config with fallbacks from design system tokens
    setSpringDefault(animation.spring.default);
  }, [serverCategoryIds, initialData]);

  const fetchAllConfigs = useCallback(
    async (offset: number, limit = 30) => {
      if (isLoadingAllConfigs || !hasMoreAllConfigs) return;

      setIsLoadingAllConfigs(true);

      try {
        await runLoggedAsync(
          async () => {
            const { fetchPaginatedContent } = await import('@heyclaude/web-runtime/data');

            const result = await fetchPaginatedContent({
              offset,
              limit,
              category: null,
            });

            if (result?.serverError) {
              // Error already logged by safe-action middleware
              trackHomepageSectionError(
                'all-content',
                'fetch-paginated-content',
                result.serverError,
                {
                  offset,
                  limit,
                  source: 'fetchAllConfigs',
                }
              );
              throw new Error(result.serverError);
            }

            // Safe-action returns { data: T, serverError?: ... } structure
            // fetchPaginatedContent returns DisplayableContent[] wrapped in { data: DisplayableContent[] }
            // Defensive: Ensure data is an array before using it
            const newItems: DisplayableContent[] = Array.isArray(result?.data) ? result.data : [];

            if (newItems.length < limit) {
              setHasMoreAllConfigs(false);
            }

            setAllConfigs((prev) => [...prev, ...newItems]);
          },
          {
            message: 'Failed to fetch paginated content',
            context: { offset, limit, section: 'all-content' },
            level: 'warn',
          }
        );
      } catch (error) {
        // Error already logged by useLoggedAsync, trackHomepageSectionError also called
        // No need to do anything else - error is handled
      } finally {
        setIsLoadingAllConfigs(false);
      }
    },
    [isLoadingAllConfigs, hasMoreAllConfigs, runLoggedAsync]
  );

  const handleFetchMore = useCallback(async () => {
    await fetchAllConfigs(allConfigs.length);
  }, [fetchAllConfigs, allConfigs.length]);

  useEffect(() => {
    if (activeTab === 'all' && allConfigs.length === 0 && !isLoadingAllConfigs) {
      fetchAllConfigs(0).catch((error) => {
        trackHomepageSectionError('all-content', 'initial-fetch', error, {
          activeTab,
        });
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
        await runLoggedAsync(
          async () => {
            const { searchUnifiedClient } = await import(
              '@heyclaude/web-runtime/edge/search-client'
            );

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
          },
          {
            message: 'Search operation failed',
            context: {
              query: query.trim(),
              category: categoryOverride ?? activeTab,
              section: 'search',
            },
            level: 'warn',
          }
        );
      } catch (error) {
        // Error already logged by useLoggedAsync
        // trackHomepageSectionError is called by the error handler if needed
        const effectiveTab = categoryOverride ?? activeTab;
        trackHomepageSectionError('search', 'search-unified', error, {
          query: query.trim(),
          category: effectiveTab,
        });
        setSearchResults(allConfigs);
      } finally {
        setIsSearching(false);
      }
    },
    [allConfigs, activeTab, runLoggedAsync]
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
      ? (dataSource || []).filter((item) => item.slug && lookupSet.has(item.slug))
      : dataSource || [];
  }, [searchResults, allConfigs, activeTab, slugLookupMaps, isSearching]);

  // Handle tab change - re-trigger search if currently searching
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      // If currently searching, re-run search with new category filter (DB-side)
      if (isSearching && currentSearchQuery) {
        handleSearch(currentSearchQuery, value).catch((error) => {
          trackHomepageSectionError('search', 'search-retry', error, {
            query: currentSearchQuery,
            tab: value,
          });
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
      trackHomepageSectionError('search', 'clear-search', error);
      logUnhandledPromise('HomePageClient: clear search failed', error);
    });
  }, [handleSearch]);

  return (
    <>
      {/* Search Section */}
      <section className={`${container.default} ${padding.xDefault} ${paddingTop.loose} ${paddingBottom.section}`}>
        <div className={`${marginX.auto} ${maxWidth['4xl']}`}>
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
          {stats && Object.keys(stats).length > 0 ? (
            <>
              {/* Mobile Stats - Compact horizontal scroll carousel */}
              <motion.div
                className={`scrollbar-hide ${marginTop.comfortable} ${overflow.xAuto} md:${display.none}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className={`${display.flex} ${gap.default} ${padding.xDefault} ${paddingBottom.compact}`}>
                  {categoryStatsConfig.slice(0, 5).map(({ categoryId, icon: Icon, delay }) => {
                    const categoryRoute = ROUTES[categoryId.toUpperCase() as keyof typeof ROUTES];

                    return (
                      <Link key={categoryId} href={categoryRoute}>
                        <motion.div
                          className={`${display.flex} ${minWidth.fit} ${alignItems.center} ${gap.compact} ${whitespace.nowrap} ${radius.lg} ${border.default} ${borderColor['border/40']} ${bgColor['card/50']} ${padding.xDefault} ${padding.yBetween} ${backdrop.sm}`}
                          whileTap={{ scale: 0.95 }}
                          transition={springDefault}
                        >
                          <Icon
                            className={`${iconSize.sm} ${flexGrow.shrink0} ${textColor.accent}`}
                            aria-hidden="true"
                          />
                          <span className={`${weight.medium} ${size.sm}`}>
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
                  `${marginTop.comfortable} ${display.none} ${flexWrap.wrap} ${justify.center} ${gap.compact} ${muted.default} ${size.xs} md:${display.flex} lg:${gap.default} lg:${size.sm}`
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
                        className={`${cluster.snug} ${cursor.pointer} ${radius.md} ${border.default} ${borderColor.transparent} ${padding.xTight} ${padding.yMicro} ${transition.colors}`}
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
                          className={`${iconSize.sm} ${transition.colors} ${groupHover.accent}`}
                          aria-hidden="true"
                        />
                        <span className={`${transition.colors} ${groupHover.accent}`}>
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
            <HomepageStatsSkeleton className={marginTop.comfortable} />
          )}
        </div>
      </section>

      <section className={`${container.default} ${padding.xDefault} ${paddingBottom.hero}`}>
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