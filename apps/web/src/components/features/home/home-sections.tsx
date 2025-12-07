'use client';

/** Homepage client consuming homepageConfigs for runtime-tunable featured categories */

import { type Database } from '@heyclaude/database-types';
import { getHomepageConfigBundle } from '@heyclaude/web-runtime/config/static-configs';
import {
  logUnhandledPromise,
  trackHomepageSectionError,
  trackMissingData,
} from '@heyclaude/web-runtime/core';
import { getCategoryConfigs, getCategoryStatsConfig } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import {
  type DisplayableContent,
  type FilterState,
  type HomePageClientProps,
} from '@heyclaude/web-runtime/types/component.types';
import {
  UI_CLASSES,
  NumberTicker,
  HomepageStatsSkeleton,
  Skeleton,
} from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  LazyFeaturedSections,
  LazySearchSection,
  LazyTabsSection,
} from '@/src/components/features/home/lazy-home-sections';
import { searchCache } from '@/src/utils/search-cache';

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
  serverCategoryIds,
}: HomePageClientProps) {
  const [allConfigs, setAllConfigs] = useState<DisplayableContent[]>([]);
  const [isLoadingAllConfigs, setIsLoadingAllConfigs] = useState(false);
  const [hasMoreAllConfigs, setHasMoreAllConfigs] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchResults, setSearchResults] = useState<DisplayableContent[]>([]);
  const [isSearching, setIsSearching] = useState(false); // Loading state only
  const [filters, setFilters] = useState<FilterState>({});
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Get static config bundle
  useEffect(() => {
    let bundle;
    try {
      bundle = getHomepageConfigBundle();
    } catch (error) {
      // Log error but don't crash - fall back to server-provided data
      const normalized = normalizeError(error, 'Failed to load homepage config bundle');
      logClientWarn(
        '[Home] Failed to load homepage config bundle',
        normalized,
        'HomePageClient.loadConfigBundle',
        {
          component: 'HomePageClient',
          action: 'load-config-bundle',
          category: 'home',
        }
      );
      bundle = null;
    }

    // Extract featured categories from homepage config with defensive checks
    const categories = Array.isArray(bundle?.homepageConfig?.['homepage.featured_categories'])
      ? bundle.homepageConfig['homepage.featured_categories']
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

    // Extract animation config with fallbacks
    setSpringDefault({
      type: 'spring' as const,
      stiffness: bundle?.animationConfig?.['animation.spring.default.stiffness'] ?? 400,
      damping: bundle?.animationConfig?.['animation.spring.default.damping'] ?? 17,
    });
  }, [serverCategoryIds, initialData]);

  const fetchAllConfigs = useCallback(
    async (offset: number, limit = 30) => {
      logClientWarn(
        '[HomePageClient] fetchAllConfigs called',
        null,
        'HomePageClient.fetchAllConfigs.start',
        {
          component: 'HomePageClient',
          action: 'fetch-all-configs-start',
          category: 'home',
          offset,
          limit,
          isLoadingAllConfigs,
          hasMoreAllConfigs,
          willSkip: isLoadingAllConfigs || !hasMoreAllConfigs,
        }
      );

      if (isLoadingAllConfigs || !hasMoreAllConfigs) {
        logClientWarn(
          '[HomePageClient] fetchAllConfigs skipped (already loading or no more)',
          null,
          'HomePageClient.fetchAllConfigs.skipped',
          {
            component: 'HomePageClient',
            action: 'fetch-all-configs-skipped',
            category: 'home',
            isLoadingAllConfigs,
            hasMoreAllConfigs,
          }
        );
        return;
      }

      setIsLoadingAllConfigs(true);

      try {
        await runLoggedAsync(
          async () => {
            logClientWarn(
              '[HomePageClient] Importing fetchPaginatedContent',
              null,
              'HomePageClient.fetchAllConfigs.import',
              {
                component: 'HomePageClient',
                action: 'fetch-all-configs-import',
                category: 'home',
              }
            );

            const { fetchPaginatedContent } = await import('@heyclaude/web-runtime/actions');

            logClientWarn(
              '[HomePageClient] Calling fetchPaginatedContent action',
              null,
              'HomePageClient.fetchAllConfigs.call',
              {
                component: 'HomePageClient',
                action: 'fetch-all-configs-call',
                category: 'home',
                offset,
                limit,
              }
            );

            const result = await fetchPaginatedContent({
              offset,
              limit,
              category: null,
            });

            logClientWarn(
              '[HomePageClient] fetchPaginatedContent result received',
              null,
              'HomePageClient.fetchAllConfigs.result',
              {
                component: 'HomePageClient',
                action: 'fetch-all-configs-result',
                category: 'home',
                hasResult: Boolean(result),
                hasData: Boolean(result?.data),
                hasServerError: Boolean(result?.serverError),
                dataIsArray: Array.isArray(result?.data),
                dataLength: Array.isArray(result?.data) ? result.data.length : 0,
                serverError: result?.serverError,
              }
            );

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

            logClientWarn(
              '[HomePageClient] Processing fetchPaginatedContent result',
              null,
              'HomePageClient.fetchAllConfigs.process',
              {
                component: 'HomePageClient',
                action: 'fetch-all-configs-process',
                category: 'home',
                newItemsLength: newItems.length,
                limit,
                willSetHasMoreFalse: newItems.length < limit,
              }
            );

            if (newItems.length < limit) {
              setHasMoreAllConfigs(false);
            }

            setAllConfigs((prev) => {
              // Deduplicate items by slug to prevent duplicate keys
              // Create a Set of existing slugs for O(1) lookup
              const existingSlugs = new Set(prev.map((item) => item.slug).filter(Boolean));
              
              // Filter out items that already exist
              const uniqueNewItems = newItems.filter((item) => {
                if (!item.slug) return true; // Keep items without slugs (shouldn't happen, but defensive)
                if (existingSlugs.has(item.slug)) {
                  logClientWarn(
                    '[HomePageClient] Duplicate item filtered out',
                    null,
                    'HomePageClient.fetchAllConfigs.deduplicate',
                    {
                      component: 'HomePageClient',
                      action: 'fetch-all-configs-deduplicate',
                      category: 'home',
                      slug: item.slug,
                    }
                  );
                  return false;
                }
                existingSlugs.add(item.slug);
                return true;
              });
              
              const updated = [...prev, ...uniqueNewItems];
              logClientWarn(
                '[HomePageClient] Updated allConfigs state',
                null,
                'HomePageClient.fetchAllConfigs.stateUpdate',
                {
                  component: 'HomePageClient',
                  action: 'fetch-all-configs-state-update',
                  category: 'home',
                  previousLength: prev.length,
                  newItemsLength: newItems.length,
                  uniqueNewItemsLength: uniqueNewItems.length,
                  filteredOutCount: newItems.length - uniqueNewItems.length,
                  updatedLength: updated.length,
                }
              );
              return updated;
            });
          },
          {
            message: 'Failed to fetch paginated content',
            context: { offset, limit, section: 'all-content' },
            level: 'warn',
          }
        );
      } catch (error) {
        // Error already logged by useLoggedAsync, trackHomepageSectionError also called
        const normalized = normalizeError(error, 'fetchAllConfigs failed');
        logClientWarn(
          '[HomePageClient] fetchAllConfigs error caught',
          normalized,
          'HomePageClient.fetchAllConfigs.error',
          {
            component: 'HomePageClient',
            action: 'fetch-all-configs-error',
            category: 'home',
            offset,
            limit,
          }
        );
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
    logClientWarn(
      '[HomePageClient] useEffect triggered for All tab',
      null,
      'HomePageClient.useEffect.allTab',
      {
        component: 'HomePageClient',
        action: 'useEffect-all-tab',
        category: 'home',
        activeTab,
        allConfigsLength: allConfigs.length,
        isLoadingAllConfigs,
        shouldFetch: activeTab === 'all' && allConfigs.length === 0 && !isLoadingAllConfigs,
      }
    );

    if (activeTab === 'all' && allConfigs.length === 0 && !isLoadingAllConfigs) {
      logClientWarn(
        '[HomePageClient] Triggering fetchAllConfigs for All tab',
        null,
        'HomePageClient.fetchAllConfigs.trigger',
        {
          component: 'HomePageClient',
          action: 'fetch-all-configs-trigger',
          category: 'home',
          offset: 0,
        }
      );
      fetchAllConfigs(0).catch((error) => {
        trackHomepageSectionError('all-content', 'initial-fetch', error, {
          activeTab,
        });
        logUnhandledPromise('HomePageClient: initial fetchAllConfigs failed', error);
      });
    }
  }, [activeTab, allConfigs.length, fetchAllConfigs, isLoadingAllConfigs]);

  const handleSearch = useCallback(
    async (query: string, categoryOverride?: string, signal?: AbortSignal) => {
      const trimmedQuery = query.trim();

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clear search if query is empty
      if (!trimmedQuery) {
        setSearchResults([]);
        setIsSearching(false);
        setCurrentSearchQuery('');
        return;
      }

      // Set query immediately (for UI feedback)
      setCurrentSearchQuery(trimmedQuery);
      setIsSearching(true);

      // Check cache first
      const effectiveTab = categoryOverride ?? activeTab;
      const categories =
        effectiveTab !== 'all' && effectiveTab !== 'community' ? [effectiveTab] : undefined;

      const cacheKey = {
        categories: categories || [],
        tags: filters.tags || [],
        authors: filters.author ? [filters.author] : [],
        sort: filters.sort || 'relevance',
      };

      const cachedResults = searchCache.get(trimmedQuery, cacheKey);
      if (cachedResults) {
        // Use cached results immediately
        setSearchResults(cachedResults as DisplayableContent[]);
        setIsSearching(false);
        return;
      }

      try {
        await runLoggedAsync(
          async () => {
            // Check if request was aborted
            if (signal?.aborted) {
              return;
            }

            const { searchUnifiedClient } =
              await import('@heyclaude/web-runtime/edge/search-client');

            // Build filters object - only include defined properties
            const searchFilters: {
              limit: number;
              categories?: string[];
              tags?: string[];
              authors?: string[];
              sort?: 'relevance' | 'popularity' | 'newest' | 'alphabetical';
            } = {
              limit: 50,
            };

            if (categories) {
              searchFilters.categories = categories;
            }

            if (filters.tags && filters.tags.length > 0) {
              searchFilters.tags = filters.tags;
            }

            if (filters.author) {
              searchFilters.authors = [filters.author];
            }

            // Map FilterState sort to UnifiedSearchFilters sort
            if (filters.sort) {
              const sortMap: Record<string, 'relevance' | 'popularity' | 'newest' | 'alphabetical'> =
                {
                  relevance: 'relevance',
                  popularity: 'popularity',
                  newest: 'newest',
                  alphabetical: 'alphabetical',
                };
              const mappedSort = sortMap[filters.sort];
              if (mappedSort) {
                searchFilters.sort = mappedSort;
              }
            }

            const result = await searchUnifiedClient({
              query: trimmedQuery,
              entities: ['content'],
              filters: searchFilters,
            });

            // Check if request was aborted before setting results
            if (signal?.aborted) {
              return;
            }

            const results = (result.results as DisplayableContent[]) || [];

            // Cache the results
            searchCache.set(trimmedQuery, cacheKey, results);

            // Update state
            setSearchResults(results);
          },
          {
            message: 'Search operation failed',
            context: {
              query: trimmedQuery,
              category: effectiveTab,
              section: 'search',
            },
            level: 'warn',
          }
        );
      } catch (error) {
        // Ignore abort errors (expected when canceling)
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        // Error already logged by useLoggedAsync
        const effectiveTab = categoryOverride ?? activeTab;
        trackHomepageSectionError('search', 'search-unified', error, {
          query: trimmedQuery,
          category: effectiveTab,
        });
        setSearchResults([]);
      } finally {
        // Only set isSearching to false if request wasn't aborted
        if (!signal?.aborted) {
          setIsSearching(false);
        }
      }
    },
    [allConfigs, activeTab, runLoggedAsync, filters]
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
    // Show search results if there's an active search query
    if (currentSearchQuery.length > 0) {
      return searchResults || [];
    }

    // Not searching - filter allConfigs by tab
    const dataSource = allConfigs;

    if (activeTab === 'all' || activeTab === 'community') {
      return dataSource || [];
    }

    const lookupSet = slugLookupMaps[activeTab];
    return lookupSet
      ? (dataSource || []).filter((item) => item.slug && lookupSet.has(item.slug))
      : dataSource || [];
  }, [searchResults, allConfigs, activeTab, slugLookupMaps, currentSearchQuery]);

  // Handle tab change - re-trigger search if currently searching
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      // If there's an active search query, re-run search with new category filter (DB-side)
      if (currentSearchQuery.length > 0) {
        // Create new AbortController for this search
        const controller = new AbortController();
        abortControllerRef.current = controller;

        handleSearch(currentSearchQuery, value, controller.signal).catch((error) => {
          // Ignore abort errors
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
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
    [currentSearchQuery, handleSearch]
  );

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    // Cancel any pending search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setCurrentSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  // Cleanup: Cancel pending requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <>
      {/* Search Section */}
      <section className="container mx-auto px-4 pt-8 pb-12">
        <div className="mx-auto max-w-4xl">
          <UnifiedSearch
            placeholder="Search for rules, MCP servers, agents, commands, and more..."
            onSearch={(query) => {
              // Create new AbortController for this search
              const controller = new AbortController();
              abortControllerRef.current = controller;
              handleSearch(query, undefined, controller.signal);
            }}
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
                          className="border-border/40 bg-card/50 flex min-w-fit items-center gap-2 rounded-lg border px-4 py-2.5 whitespace-nowrap backdrop-blur-sm"
                          whileTap={{ scale: 0.95 }}
                          transition={springDefault}
                        >
                          <Icon
                            className={`${UI_CLASSES.ICON_SM} shrink-0-accent`}
                            aria-hidden="true"
                          />
                          <span className="text-sm font-medium">
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
              <div className="text-muted-foreground mt-6 hidden flex-wrap justify-center gap-2 text-xs md:flex lg:gap-3 lg:text-sm">
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
                          borderColor: 'rgba(249, 115, 22, 0.3)', // Claude orange with 30% opacity (was hsl(var(--accent) / 0.3))
                          backgroundColor: 'rgba(249, 115, 22, 0.05)', // Claude orange with 5% opacity (was hsl(var(--accent) / 0.05))
                          transition: springDefault,
                        }}
                        whileTap={{
                          scale: 0.98,
                          transition: springDefault,
                        }}
                      >
                        <Icon
                          className={`${UI_CLASSES.ICON_SM} group-hover:text-accent transition-colors`}
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

      <section className="container mx-auto px-4 pb-16">
        {/* Search Results Section - Show when there's an active search query */}
        {currentSearchQuery.length > 0 && (
          <LazySearchSection
            isSearching={isSearching}
            filteredResults={filteredResults}
            onClearSearch={handleClearSearch}
            searchQuery={currentSearchQuery}
          />
        )}

        {/* Featured Content Sections - Hide when searching */}
        {currentSearchQuery.length === 0 && (
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

        {/* Tabs Section - Hide when searching */}
        {currentSearchQuery.length === 0 && (
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
