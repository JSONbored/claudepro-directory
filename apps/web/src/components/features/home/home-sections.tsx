'use client';

/** Homepage client consuming homepageConfigs for runtime-tunable featured categories */

import { type Database } from '@heyclaude/database-types';
import { getHomepageConfigBundle } from '@heyclaude/web-runtime/config/static-configs';
import {
  logUnhandledPromise,
  trackHomepageSectionError,
  trackMissingData,
} from '@heyclaude/web-runtime/core';
import { getCategoryConfigs } from '@heyclaude/web-runtime/data';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import {
  type DisplayableContent,
  type FilterState,
  type HomePageClientProps,
} from '@heyclaude/web-runtime/types/component.types';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  LazyFeaturedSections,
  LazySearchSection,
  LazyTabsSection,
} from '@/src/components/features/home/lazy-home-sections';
import { useHeroSearchConnection } from '@/src/components/features/home/hero-search-connection';
import { searchCache } from '@/src/utils/search-cache';

// UnifiedSearch is now wrapped in MagneticSearchWrapper for enhanced interactions

function HomePageClientComponent({
  initialData,
  featuredByCategory,
  stats,
  featuredJobs = [],
  searchFilters,
  weekStart,
  serverCategoryIds,
}: HomePageClientProps) {
  const { setSearchFocused, setSearchProps } = useHeroSearchConnection();
  const [allConfigs, setAllConfigs] = useState<DisplayableContent[]>([]);
  const [isLoadingAllConfigs, setIsLoadingAllConfigs] = useState(false);
  const [hasMoreAllConfigs, setHasMoreAllConfigs] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchResults, setSearchResults] = useState<DisplayableContent[]>([]);
  const [isSearching, setIsSearching] = useState(false); // Loading state only
  const [filters, setFilters] = useState<FilterState>({});
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitialFetchRef = useRef(false);

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
    [hasMoreAllConfigs, runLoggedAsync]
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
        hasInitialFetch: hasInitialFetchRef.current,
      }
    );

    if (activeTab === 'all' && allConfigs.length === 0 && !isLoadingAllConfigs && !hasInitialFetchRef.current) {
      hasInitialFetchRef.current = true;
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
  }, [activeTab, allConfigs.length, isLoadingAllConfigs, fetchAllConfigs]);

  const handleSearch = useCallback(
    async (query: string, categoryOverride?: string, signal?: AbortSignal) => {
      const trimmedQuery = query.trim();

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
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
      
      // Check cache first - if cached, use immediately without loading state
      const effectiveTab = categoryOverride ?? activeTab;
      const categories =
        effectiveTab !== 'all' && effectiveTab !== 'community' ? [effectiveTab] : undefined;
      // Normalize sort for cache key - map 'trending' to 'relevance' to match API behavior
      const normalizedSort = filters.sort === 'trending' ? 'relevance' : (filters.sort || 'relevance');
      const cacheKey = {
        categories: categories || [],
        tags: filters.tags || [],
        authors: filters.author ? [filters.author] : [],
        sort: normalizedSort,
      };

      const cachedResults = searchCache.get(trimmedQuery, cacheKey);
      if (cachedResults) {
        // Use cached results immediately without showing loading state
        setSearchResults(cachedResults as DisplayableContent[]);
        setIsSearching(false);
        return;
      }
      
      // No cache - show loading state and fetch
      setIsSearching(true);

      try {
        await runLoggedAsync(
          async () => {
            // Check if request was aborted
            if (signal?.aborted) {
              return;
            }

            // Build query parameters for API route
            // Follows architectural strategy: API route -> data layer -> database RPC -> DB
            // Note: API determines searchType internally based on entities and job filters
            const searchParams = new URLSearchParams({
              q: trimmedQuery,
              entities: 'content', // Use unified search when entities are specified
              limit: '50',
            });

            // Map FilterState sort to API route sort
            if (filters.sort) {
              const sortMap: Record<string, 'relevance' | 'popularity' | 'newest' | 'alphabetical'> =
                {
                  trending: 'relevance', // Map 'trending' to 'relevance' for API compatibility
                  relevance: 'relevance',
                  popularity: 'popularity',
                  newest: 'newest',
                  alphabetical: 'alphabetical',
                };
              const mappedSort = sortMap[filters.sort];
              if (mappedSort) {
                searchParams.set('sort', mappedSort);
              }
            }

            // Add category filter if provided
            if (categories && categories.length > 0) {
              searchParams.set('categories', categories.join(','));
            }

            // Add tag filters if provided
            if (filters.tags && filters.tags.length > 0) {
              searchParams.set('tags', filters.tags.join(','));
            }

            // Add author filter if provided
            if (filters.author) {
              searchParams.set('authors', filters.author);
            }

            logClientWarn(
              '[HomePageClient] Calling /api/search',
              undefined,
              'HomePageClient.handleSearch.call',
              {
                component: 'HomePageClient',
                action: 'handle-search-call',
                category: 'search',
                query: trimmedQuery,
                entities: ['content'],
                searchParams: searchParams.toString(),
              }
            );

            // Call API route (follows architectural strategy: API route -> data layer -> database RPC -> DB)
            const response = await fetch(`/api/search?${searchParams.toString()}`, {
              method: 'GET',
              ...(signal ? { signal } : {}), // Support request cancellation
            });

            if (!response.ok) {
              throw new Error(`Search API returned ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // Check if request was aborted before setting results
            if (signal?.aborted) {
              return;
            }

            // Extract results - ensure we have an array
            // Defensive: Handle various response formats
            let results: DisplayableContent[] = [];
            if (result && typeof result === 'object') {
              if (Array.isArray(result.results)) {
                results = result.results as DisplayableContent[];
              } else if (result.results && typeof result.results === 'object' && 'data' in result.results) {
                // Handle nested results structure if database returns it differently
                const nestedResults = (result.results as { data?: unknown[] }).data;
                results = Array.isArray(nestedResults) ? (nestedResults as DisplayableContent[]) : [];
              }
            }
            
            logClientWarn(
              '[HomePageClient] /api/search result received',
              undefined,
              'HomePageClient.handleSearch.result',
              {
                component: 'HomePageClient',
                action: 'handle-search-result',
                category: 'search',
                query: trimmedQuery,
                hasResult: Boolean(result),
                resultType: typeof result,
                resultsType: result?.results ? typeof result.results : 'undefined',
                resultsIsArray: Array.isArray(result?.results),
                resultsLength: Array.isArray(result?.results) ? result.results.length : 0,
                extractedLength: results.length,
                firstResultSlug: results[0]?.slug,
                searchType: result?.searchType,
              }
            );
            
            // Log if we got unexpected results structure
            if (result && !Array.isArray(result.results) && result.results !== null && result.results !== undefined) {
              logClientWarn(
                '[HomePageClient] Search returned non-array results',
                undefined,
                'HomePageClient.handleSearch.unexpectedResults',
                {
                  component: 'HomePageClient',
                  action: 'handle-search-unexpected',
                  category: 'search',
                  query: trimmedQuery,
                  resultsType: typeof result.results,
                  hasResults: result.results !== null && result.results !== undefined,
                  resultKeys: result ? Object.keys(result) : [],
                }
              );
            }

            // Cache the results
            searchCache.set(trimmedQuery, cacheKey, results);

            // Update state
            logClientWarn(
              '[HomePageClient] Setting search results',
              undefined,
              'HomePageClient.handleSearch.setResults',
              {
                component: 'HomePageClient',
                action: 'set-search-results',
                category: 'search',
                query: trimmedQuery,
                resultsLength: results.length,
                willUpdateState: true,
              }
            );
            // Ensure we always set an array, never null or undefined
            setSearchResults(Array.isArray(results) ? results : []);
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
    try {
      // Show search results if there's an active search query
      if (currentSearchQuery.length > 0) {
        // Ensure searchResults is an array and handle null/undefined
        const results = Array.isArray(searchResults) ? searchResults : [];
        logClientWarn(
          '[HomePageClient] Computing filteredResults for search',
          undefined,
          'HomePageClient.filteredResults.search',
          {
            component: 'HomePageClient',
            action: 'compute-filtered-results',
            category: 'search',
            currentSearchQuery,
            searchResultsLength: Array.isArray(searchResults) ? searchResults.length : 0,
            filteredResultsLength: results.length,
            searchResultsIsArray: Array.isArray(searchResults),
            searchResultsType: typeof searchResults,
          }
        );
        return results;
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
          category: 'search',
          currentSearchQuery,
          activeTab,
        }
      );
      // Return empty array on error to prevent crashes
      return [];
    }
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

  // Memoize search props to prevent unnecessary re-renders
  const searchPropsMemo = useMemo(
    () => ({
      onSearch: (query: string) => {
        // UnifiedSearch already debounces (400ms), so this will be called after debounce
        // Create new AbortController for this search
        const controller = new AbortController();
        abortControllerRef.current = controller;
        // handleSearch will cancel previous request if still pending
        handleSearch(query, undefined, controller.signal).catch((error) => {
          // Ignore abort errors (expected when canceling)
          if (error instanceof Error && error.name !== 'AbortError') {
            const normalized = normalizeError(error, 'Search handler failed');
            logClientWarn(
              '[HomePageClient] handleSearch error',
              normalized,
              'HomePageClient.onSearch.error',
              {
                component: 'HomePageClient',
                action: 'on-search-error',
                category: 'search',
                query: query.trim(),
              }
            );
            trackHomepageSectionError('search', 'search-handler', error, {
              query: query.trim(),
            });
          }
        });
      },
      onFiltersChange: handleFiltersChange,
      filters,
      availableTags: filterOptions.tags,
      availableAuthors: filterOptions.authors,
      availableCategories: filterOptions.categories,
      resultCount: filteredResults.length,
      onFocusChange: setSearchFocused,
    }),
    [handleSearch, handleFiltersChange, filters, filterOptions.tags, filterOptions.authors, filterOptions.categories, filteredResults.length, setSearchFocused]
  );

  // Set search props in context so hero can render the search bar
  useEffect(() => {
    setSearchProps(searchPropsMemo);
  }, [searchPropsMemo, setSearchProps]);

  return (
    <>
      {/* Search Section and Stats removed - now rendered in hero */}
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
