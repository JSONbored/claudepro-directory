'use client';

/** Homepage client consuming homepageConfigs for runtime-tunable featured categories */

import { type Database } from '@heyclaude/database-types';
import { getHomepageConfigBundle } from '@heyclaude/web-runtime/config/static-configs';
import { logUnhandledPromise, trackHomepageSectionError, trackMissingData } from '@heyclaude/web-runtime/core';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import {
  SearchProvider,
  SearchResults,
  useSearchAPI,
  useSearchContext,
} from '@heyclaude/web-runtime/search';
import { logClientInfo, logClientError } from '@heyclaude/web-runtime/logging/client';
import type { FilterState } from '@heyclaude/web-runtime/types/component.types';
import {
  type DisplayableContent,
  type HomePageClientProps,
} from '@heyclaude/web-runtime/types/component.types';
import { useAuthModal } from '@/src/hooks/use-auth-modal';
import { usePathname } from 'next/navigation';
import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState, useDeferredValue } from 'react';

import {
  LazyFeaturedSections,
  LazyTabsSection,
} from '@/src/components/features/home/lazy-home-sections';
import { useHeroSearchConnection } from '@/src/components/features/home/hero-search-connection';
import { HomepageSearchBar } from '@/src/components/features/home/homepage-search-wrapper';
import { 
  NumberTicker, 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import { MICROINTERACTIONS, SPRING, VIEWPORT, STAGGER } from '@heyclaude/web-runtime/design-system';
import { getCategoryConfigs, getCategoryStatsConfig } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { motion } from 'motion/react';
import Link from 'next/link';

/**
 * Inner component that uses search context
 */
function HomePageClientContent({
  initialData,
  featuredByCategory,
  stats,
  featuredJobs = [],
  weekStart,
  serverCategoryIds,
}: HomePageClientProps) {
  const { setSearchFocused } = useHeroSearchConnection();
  const { query } = useSearchContext();
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();
  const [allConfigs, setAllConfigs] = useState<DisplayableContent[]>([]);
  const [isLoadingAllConfigs, setIsLoadingAllConfigs] = useState(false);
  const [hasMoreAllConfigs, setHasMoreAllConfigs] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const hasInitialFetchRef = useRef(false);

  // Category stats config for counters
  const categoryStatsConfig = useMemo(() => getCategoryStatsConfig(), []);

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

  const categoryConfigs = useMemo(() => getCategoryConfigs(), []);

  // Track missing stats data
  useEffect(() => {
    if (stats && Object.keys(stats).length === 0) {
      trackMissingData('stats', 'stats-data', {
        note: 'Stats data is empty',
      });
    }
  }, [stats]);

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
  }, [serverCategoryIds, initialData]);

  const fetchAllConfigs = useCallback(
    async (offset: number, limit = 30) => {
      if (isLoadingAllConfigs || !hasMoreAllConfigs) {
        return;
      }

      setIsLoadingAllConfigs(true);

      try {
        const { fetchPaginatedContent } = await import('@heyclaude/web-runtime/actions');

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

        setAllConfigs((prev) => {
          // Deduplicate items by slug to prevent duplicate keys
          // Create a Set of existing slugs for O(1) lookup
          const existingSlugs = new Set(prev.map((item) => item.slug).filter(Boolean));
          
          // Filter out items that already exist
          const uniqueNewItems = newItems.filter((item) => {
            if (!item.slug) return true; // Keep items without slugs (shouldn't happen, but defensive)
            if (existingSlugs.has(item.slug)) {
              return false;
            }
            existingSlugs.add(item.slug);
            return true;
          });
          
          const updated = [...prev, ...uniqueNewItems];
          return updated;
        });
      } catch (error) {
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
        trackHomepageSectionError('all-content', 'fetch-all-configs', error, {
          offset,
          limit,
        });
      } finally {
        setIsLoadingAllConfigs(false);
      }
    },
    [hasMoreAllConfigs]
  );

  const handleFetchMore = useCallback(async () => {
    await fetchAllConfigs(allConfigs.length);
  }, [fetchAllConfigs, allConfigs.length]);

  useEffect(() => {
    if (activeTab === 'all' && allConfigs.length === 0 && !isLoadingAllConfigs && !hasInitialFetchRef.current) {
      hasInitialFetchRef.current = true;
      fetchAllConfigs(0).catch((error) => {
        trackHomepageSectionError('all-content', 'initial-fetch', error, {
          activeTab,
        });
        logUnhandledPromise('HomePageClient: initial fetchAllConfigs failed', error);
      });
    }
  }, [activeTab, allConfigs.length, isLoadingAllConfigs, fetchAllConfigs]);

  // Search is now handled by SearchProvider + useSearch (unified search system)

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

  // Get search results from SearchProvider
  const { results: searchResults } = useSearchContext();
  
  // Defer query for performance (keeps input responsive while filtering)
  const deferredQuery = useDeferredValue(query);
  
  // Client-side filtering function for matching query in content
  const matchesQuery = useCallback((item: DisplayableContent, searchQuery: string): boolean => {
    if (!searchQuery.trim()) return true;
    
    const queryLower = searchQuery.toLowerCase().trim();
    const title = item.title?.toLowerCase() || '';
    const description = item.description?.toLowerCase() || '';
    const slug = item.slug?.toLowerCase() || '';
    const category = item.category?.toLowerCase() || '';
    
    return (
      title.includes(queryLower) ||
      description.includes(queryLower) ||
      slug.includes(queryLower) ||
      category.includes(queryLower)
    );
  }, []);
  
  // Filter allConfigs by search query (client-side filtering)
  const filteredAllConfigs = useMemo((): DisplayableContent[] => {
    if (!deferredQuery.trim()) return allConfigs;
    
    try {
      return allConfigs.filter((item) => matchesQuery(item, deferredQuery));
    } catch (error) {
      const normalized = normalizeError(error, 'filteredAllConfigs computation failed');
      logClientWarn(
        '[HomePageClient] filteredAllConfigs computation error',
        normalized,
        'HomePageClient.filteredAllConfigs.error',
        {
          component: 'HomePageClient',
          action: 'compute-filtered-all-configs-error',
          category: 'search',
          query: deferredQuery,
        }
      );
      return [];
    }
  }, [allConfigs, deferredQuery, matchesQuery]);
  
  // Merge search API results with filtered local content (deduplicate by slug)
  const mergedResults = useMemo((): DisplayableContent[] => {
    if (!deferredQuery.trim()) return [];
    
    try {
      const apiResults = Array.isArray(searchResults) ? searchResults : [];
      const localResults = filteredAllConfigs;
      
      // Deduplicate by slug - prioritize API results (more comprehensive)
      const seen = new Set<string>();
      const merged: DisplayableContent[] = [];
      
      // Add API results first (prioritized)
      for (const item of apiResults) {
        if (item.slug && !seen.has(item.slug)) {
          seen.add(item.slug);
          merged.push(item);
        }
      }
      
      // Add unique local results
      for (const item of localResults) {
        if (item.slug && !seen.has(item.slug)) {
          seen.add(item.slug);
          merged.push(item);
        }
      }
      
      return merged;
    } catch (error) {
      const normalized = normalizeError(error, 'mergedResults computation failed');
      logClientWarn(
        '[HomePageClient] mergedResults computation error',
        normalized,
        'HomePageClient.mergedResults.error',
        {
          component: 'HomePageClient',
          action: 'compute-merged-results-error',
          category: 'search',
          query: deferredQuery,
        }
      );
      return Array.isArray(searchResults) ? searchResults : [];
    }
  }, [searchResults, filteredAllConfigs, deferredQuery]);
  
  // Filter results by active tab (for tabs section, not search)
  // When searching, use mergedResults; otherwise filter allConfigs by tab
  const filteredResults = useMemo((): DisplayableContent[] => {
    try {
      // If searching, use merged results
      if (deferredQuery.trim()) {
        return mergedResults;
      }
      
      // Not searching - filter allConfigs by tab
      const dataSource = Array.isArray(allConfigs) ? allConfigs : [];

      if (activeTab === 'all' || activeTab === 'community') {
        return dataSource;
      }

      const lookupSet = slugLookupMaps[activeTab];
      if (!lookupSet) {
        return dataSource;
      }

      return dataSource.filter((item) => {
        if (!item || typeof item !== 'object') return false;
        const slug = 'slug' in item ? item.slug : null;
        return slug && typeof slug === 'string' && lookupSet.has(slug);
      });
    } catch (error) {
      // Catch any errors in filteredResults computation to prevent crashes
      const normalized = normalizeError(error, 'filteredResults computation failed');
      logClientWarn(
        '[HomePageClient] filteredResults computation error',
        normalized,
        'HomePageClient.filteredResults.error',
        {
          component: 'HomePageClient',
          action: 'compute-filtered-results-error',
          category: 'tabs',
          activeTab,
        }
      );
      // Return empty array on error to prevent crashes
      return [];
    }
  }, [allConfigs, activeTab, slugLookupMaps, deferredQuery, mergedResults]);

  // Handle tab change (search is now handled by SearchProvider)
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      // Search is now handled by SearchProvider, which syncs with URL
    },
    []
  );

  return (
    <>
      {/* Search Bar and Category Stats Section - Below Hero */}
      <section className="container mx-auto px-4 pt-8 pb-4">
        <div className="mx-auto max-w-4xl">
          {/* Search Bar - New Unified Search System */}
          <div className="mb-6">
            <HomepageSearchBar onFocusChange={setSearchFocused} />
          </div>

          {/* Category Stats Grid - Mobile and Desktop */}
          {stats && typeof stats === 'object' && Object.keys(stats).length > 0 ? (
            <>
              {/* Mobile Stats - Horizontal scroll */}
              <TooltipProvider delayDuration={300}>
                <motion.div
                  className="flex gap-2 overflow-x-auto pb-2 md:hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={VIEWPORT.default}
                  transition={SPRING.smooth}
                >
                  {categoryStatsConfig.map(({ categoryId, delay }, index: number) => {
                    const categoryRoute = ROUTES[categoryId.toUpperCase() as keyof typeof ROUTES];
                    const count =
                      typeof stats[categoryId] === 'number'
                        ? stats[categoryId]
                        : stats[categoryId]?.total || 0;
                    const categoryConfig = categoryConfigs[categoryId as Database['public']['Enums']['content_category']];
                    const tooltipText = categoryConfig?.description || `View all ${categoryId} configurations`;

                    return (
                      <Tooltip key={categoryId}>
                        <TooltipTrigger asChild>
                          <Link
                            href={categoryRoute}
                            className="group no-underline"
                            aria-label={`View all ${categoryId} configurations`}
                          >
                            <motion.div
                              className="flex min-w-fit items-center gap-1.5 rounded-md border border-border/30 px-2 py-1 whitespace-nowrap transition-colors cursor-help bg-transparent"
                              initial={{ opacity: 0, x: -8 }}
                              whileInView={{ 
                                opacity: 1, 
                                x: 0,
                              }}
                              viewport={VIEWPORT.default}
                              transition={{
                                delay: index * STAGGER.fast,
                                ...SPRING.smooth,
                              }}
                              whileHover={{
                                scale: MICROINTERACTIONS.button.hover.scale,
                                borderColor: 'rgba(249, 115, 22, 0.5)',
                                transition: MICROINTERACTIONS.button.transition,
                              }}
                              whileTap={{
                                scale: MICROINTERACTIONS.button.tap.scale,
                                transition: MICROINTERACTIONS.button.transition,
                              }}
                            >
                              <UnifiedBadge
                                variant="category"
                                category={categoryId}
                                href={null}
                                className="shrink-0 text-xs"
                              />
                              <NumberTicker
                                value={count}
                                delay={delay}
                                className="text-xs font-semibold tabular-nums"
                              />
                            </motion.div>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs text-center">
                          {tooltipText}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </motion.div>
              </TooltipProvider>

              {/* Desktop Stats */}
              <TooltipProvider delayDuration={300}>
                <div className="hidden flex-wrap justify-center gap-2 md:flex lg:gap-2">
                  {categoryStatsConfig.map(({ categoryId, delay }, index: number) => {
                    const categoryRoute = ROUTES[categoryId.toUpperCase() as keyof typeof ROUTES];
                    const count =
                      typeof stats[categoryId] === 'number'
                        ? stats[categoryId]
                        : stats[categoryId]?.total || 0;
                    const categoryConfig = categoryConfigs[categoryId as Database['public']['Enums']['content_category']];
                    const tooltipText = categoryConfig?.description || `View all ${categoryId} configurations`;

                    return (
                      <Tooltip key={categoryId}>
                        <TooltipTrigger asChild>
                          <Link
                            href={categoryRoute}
                            className="group no-underline"
                            aria-label={`View all ${categoryId} configurations`}
                          >
                            <motion.div
                              className="group flex items-center gap-1.5 rounded-md border border-border/30 px-2 py-1 transition-colors cursor-help bg-transparent"
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ 
                                opacity: 1, 
                                y: 0,
                              }}
                              viewport={VIEWPORT.default}
                              transition={{
                                delay: index * STAGGER.fast,
                                ...SPRING.smooth,
                              }}
                              whileHover={{
                                scale: MICROINTERACTIONS.button.hover.scale,
                                borderColor: 'rgba(249, 115, 22, 0.5)',
                                transition: MICROINTERACTIONS.button.transition,
                              }}
                              whileTap={{
                                scale: MICROINTERACTIONS.button.tap.scale,
                                transition: MICROINTERACTIONS.button.transition,
                              }}
                            >
                              <UnifiedBadge
                                variant="category"
                                category={categoryId}
                                href={null}
                                className="shrink-0 text-xs"
                              />
                              <NumberTicker
                                value={count}
                                delay={delay}
                                className="text-xs font-semibold tabular-nums"
                              />
                            </motion.div>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs text-center">
                          {tooltipText}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            </>
          ) : null}
        </div>
      </section>

      {/* Main Content Section */}
      <section className="container mx-auto px-4 pb-16">
        {/* Search Results Section - Show at top when there's an active search query */}
        {query.trim().length > 0 && (
          <div className="mb-8">
            <Suspense fallback={<div className="text-muted-foreground p-8 text-center">Loading search results...</div>}>
              <SearchResults
                showCategory
                showActions
                onAuthRequired={() => {
                  openAuthModal({
                    valueProposition: 'Sign in to save bookmarks',
                    redirectTo: pathname ?? undefined,
                  });
                }}
              />
            </Suspense>
          </div>
        )}

        {/* Featured Content Sections - Always visible (maintains context) */}
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

        {/* Tabs Section - Always visible (shows filtered content when searching) */}
        <LazyTabsSection
          activeTab={activeTab}
          filteredResults={filteredResults}
          onTabChange={handleTabChange}
          categoryConfigs={categoryConfigs}
          onFetchMore={handleFetchMore}
          serverHasMore={hasMoreAllConfigs}
          {...(weekStart ? { weekStart } : {})}
        />
      </section>
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders when initialData prop hasn't changed
const HomePageClientContentMemo = memo(HomePageClientContent);

/**
 * HomePageClient - Wrapper with SearchProvider
 */
function HomePageClientComponent(props: HomePageClientProps) {
  const pulse = usePulse();
  const searchFunction = useSearchAPI({
    apiPath: '/api/search',
    limit: 50,
    offset: 0,
  });

  // Handle search with analytics
  const handleSearch = useCallback(
    async (query: string, filters: FilterState) => {
      const searchStart = Date.now();
      
      logClientInfo(
        '[HomePageClient] handleSearch called',
        'HomePageClient.handleSearch.start',
        {
          component: 'HomePageClient',
          action: 'handle-search-start',
          query: query.trim(),
          queryLength: query.trim().length,
          filters: JSON.stringify(filters),
          timestamp: searchStart,
        }
      );
      
      try {
        logClientInfo(
          '[HomePageClient] Calling searchFunction',
          'HomePageClient.handleSearch.callFunction',
          {
            component: 'HomePageClient',
            action: 'handle-search-call-function',
            query: query.trim(),
            timestamp: Date.now(),
          }
        );
        
        const functionCallStart = Date.now();
        const results = await searchFunction(query, filters);
        const functionCallDuration = Date.now() - functionCallStart;
        
        logClientInfo(
          '[HomePageClient] searchFunction completed',
          'HomePageClient.handleSearch.functionCompleted',
          {
            component: 'HomePageClient',
            action: 'handle-search-function-completed',
            query: query.trim(),
            resultsCount: Array.isArray(results) ? results.length : 0,
            isArray: Array.isArray(results),
            functionDuration: functionCallDuration,
            timestamp: Date.now(),
          }
        );

        // Track search analytics (fire and forget)
        if (query.trim()) {
          logClientInfo(
            '[HomePageClient] Tracking search analytics',
            'HomePageClient.handleSearch.analytics',
            {
              component: 'HomePageClient',
              action: 'handle-search-analytics',
              query: query.trim(),
              resultsCount: results.length,
              timestamp: Date.now(),
            }
          );
          
          // Use 'agents' as default category for homepage search (no specific category)
          pulse
            .search({
              category: 'agents',
              slug: '',
              query: query.trim(),
              metadata: {
                filters,
                resultCount: results.length,
              },
            })
            .catch((error) => {
              const normalized = normalizeError(error, 'Analytics tracking failed');
              logClientError(
                '[HomePageClient] Analytics tracking error',
                normalized,
                'HomePageClient.handleSearch.analyticsError',
                {
                  component: 'HomePageClient',
                  action: 'handle-search-analytics-error',
                  query: query.trim(),
                  timestamp: Date.now(),
                }
              );
            });
        }

        logClientInfo(
          '[HomePageClient] handleSearch completed successfully',
          'HomePageClient.handleSearch.success',
          {
            component: 'HomePageClient',
            action: 'handle-search-success',
            query: query.trim(),
            resultsCount: Array.isArray(results) ? results.length : 0,
            totalDuration: Date.now() - searchStart,
            timestamp: Date.now(),
          }
        );

        return results;
      } catch (error) {
        const normalized = normalizeError(error, 'handleSearch failed');
        
        logClientError(
          '[HomePageClient] handleSearch error',
          normalized,
          'HomePageClient.handleSearch.error',
          {
            component: 'HomePageClient',
            action: 'handle-search-error',
            query: query.trim(),
            errorName: error instanceof Error ? error.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
            duration: Date.now() - searchStart,
            timestamp: Date.now(),
          }
        );
        
        throw normalized;
      }
    },
    [searchFunction, pulse]
  );

  return (
    <SearchProvider
      onSearch={handleSearch}
      defaultQuery=""
      defaultFilters={{}}
    >
      <HomePageClientContentMemo {...props} />
    </SearchProvider>
  );
}

const HomePageClient = memo(HomePageClientComponent);

export { HomePageClient };
