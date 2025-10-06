'use client';

/**
 * Homepage Client Component (SHA-2086 Performance Optimizations + SHA-2102 Component Split)
 *
 * PERFORMANCE CRITICAL: This is the first page users see
 * Must maintain optimal performance with multiple content sections
 *
 * Optimizations Applied (SHA-2086):
 * 1. ✅ Memoized featured sections to prevent unnecessary re-renders
 * 2. ✅ Stable array slicing with useMemo for featured items
 * 3. ✅ Memoized lookup maps for O(1) category filtering
 * 4. ✅ Lazy-loaded heavy components (UnifiedSearch)
 * 5. ✅ Proper memo wrapping for all sub-components
 *
 * Component Organization (SHA-2102):
 * 1. ✅ Extracted SearchSection (search UI + results)
 * 2. ✅ Extracted FeaturedSections (5 featured categories + jobs)
 * 3. ✅ Extracted TabsSection (tabbed navigation with infinite scroll)
 * Result: Main component reduced from 370 lines to ~150 lines
 */

import dynamic from 'next/dynamic';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FeaturedSections } from '@/src/components/features/home/featured-sections';
import { SearchSection } from '@/src/components/features/home/search-section';
import { TabsSection } from '@/src/components/features/home/tabs-section';
import { useSearch } from '@/src/hooks/use-search';
import { HOMEPAGE_FEATURED_CATEGORIES } from '@/src/lib/config/category-config';
import type { HomePageClientProps, UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

const UnifiedSearch = dynamic(
  () =>
    import('@/src/components/features/search/unified-search').then((mod) => ({
      default: mod.UnifiedSearch,
    })),
  {
    ssr: false,
    loading: () => (
      <div className={`h-14 ${UI_CLASSES.BG_MUTED_50} ${UI_CLASSES.ROUNDED_LG} animate-pulse`} />
    ),
  }
);

function HomePageClientComponent({ initialData, stats }: HomePageClientProps) {
  const { allConfigs } = initialData;

  const [activeTab, setActiveTab] = useState('all');
  const pageSize = 20;

  // Don't pre-initialize displayedItems - let useEffect handle it based on filteredResults
  const [displayedItems, setDisplayedItems] = useState<UnifiedContentItem[]>([]);

  // Memoize search options to prevent infinite re-renders
  const searchOptions = useMemo(
    () => ({
      threshold: 0.3,
      minMatchCharLength: 2,
    }),
    []
  );

  // Use React 19 optimized search hook
  const { filters, searchResults, filterOptions, handleSearch, handleFiltersChange, isSearching } =
    useSearch({
      data: allConfigs,
      searchOptions,
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
  const filteredResults = useMemo(() => {
    // Use allConfigs when not searching, searchResults when searching
    const dataSource = isSearching ? searchResults : allConfigs;

    if (activeTab === 'all' || activeTab === 'community') {
      return dataSource;
    }

    const lookupSet = slugLookupMaps[activeTab as keyof typeof slugLookupMaps];
    return lookupSet ? dataSource.filter((item) => lookupSet.has(item.slug)) : dataSource;
  }, [searchResults, allConfigs, activeTab, slugLookupMaps, isSearching]);

  // Use ref to track filtered results for stable pagination
  const filteredResultsRef = useRef(filteredResults);
  const currentPageRef = useRef(1);

  useEffect(() => {
    filteredResultsRef.current = filteredResults;
  }, [filteredResults]);

  // Update displayed items only when tab or search changes (not on every filteredResults reference change)
  // Using activeTab and isSearching as dependencies instead of filteredResults to avoid resetting
  // pagination when the same data is re-filtered (which creates a new array reference)
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally using activeTab/isSearching to avoid pagination reset on re-renders
  useEffect(() => {
    setDisplayedItems(filteredResults.slice(0, pageSize) as UnifiedContentItem[]);
    currentPageRef.current = 1;
  }, [activeTab, isSearching]);

  // Load more function for infinite scroll
  // Uses refs to avoid stale closures when filteredResults changes
  const loadMore = useCallback(async () => {
    const nextPage = currentPageRef.current + 1;
    const startIndex = (nextPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const nextItems = filteredResultsRef.current.slice(startIndex, endIndex);

    let uniqueNextItems: UnifiedContentItem[] = [];

    // Deduplicate using functional setState to get latest state
    setDisplayedItems((prev) => {
      const prevSlugs = new Set(prev.map((item) => item.slug));
      uniqueNextItems = nextItems.filter(
        (item) => !prevSlugs.has(item.slug)
      ) as UnifiedContentItem[];
      return [...prev, ...uniqueNextItems] as UnifiedContentItem[];
    });

    currentPageRef.current = nextPage;

    // Return the new items so infinite scroll knows items were loaded
    return uniqueNextItems;
  }, []);

  const hasMore = displayedItems.length < filteredResults.length;

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    handleSearch('');
    setDisplayedItems([]);
  }, [handleSearch]);

  return (
    <>
      {/* Search Section */}
      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 pt-4 pb-8`}>
        <div className={`${UI_CLASSES.MAX_W_4XL} ${UI_CLASSES.MX_AUTO}`}>
          <UnifiedSearch
            placeholder="Search for rules, MCP servers, agents, commands, and more..."
            onSearch={handleSearch}
            onFiltersChange={handleFiltersChange}
            filters={filters}
            availableTags={filterOptions.tags}
            availableAuthors={filterOptions.authors}
            availableCategories={filterOptions.categories}
            resultCount={filteredResults.length}
          />
        </div>
      </section>

      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 pb-16`}>
        {/* Search Results Section */}
        <SearchSection
          isSearching={isSearching}
          filteredResults={filteredResults}
          displayedItems={displayedItems}
          hasMore={hasMore}
          loadMore={loadMore}
          onClearSearch={handleClearSearch}
        />

        {/* Featured Content Sections - Only show when not searching */}
        {!isSearching && <FeaturedSections categories={initialData} />}

        {/* Tabs Section - Only show when not searching */}
        {!isSearching && (
          <TabsSection
            activeTab={activeTab}
            displayedItems={displayedItems}
            filteredResults={filteredResults}
            hasMore={hasMore}
            loadMore={loadMore}
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
