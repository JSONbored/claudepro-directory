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

import { BookOpen, Layers, Server, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SearchSection } from '@/src/components/features/home/search-section';
import { useSearch } from '@/src/hooks/use-search';
import { HOMEPAGE_FEATURED_CATEGORIES } from '@/src/lib/config/category-config';
import type { HomePageClientProps, UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// Lazy load heavy components to reduce initial bundle size
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

// Generate stable skeleton keys (prevents unnecessary re-renders)
const featuredSectionKeys = Array.from({ length: 5 }, () => ({
  sectionId: crypto.randomUUID(),
  cardIds: Array.from({ length: 3 }, () => crypto.randomUUID()),
}));

const FeaturedSections = dynamic(
  () =>
    import('@/src/components/features/home/featured-sections').then((mod) => ({
      default: mod.FeaturedSections,
    })),
  {
    loading: () => (
      <div className="space-y-12 py-8">
        {featuredSectionKeys.map(({ sectionId, cardIds }) => (
          <div key={sectionId} className="space-y-4">
            <div className="h-8 w-48 bg-muted/50 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cardIds.map((cardId) => (
                <div key={cardId} className="h-32 bg-card/50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  }
);

// Generate stable skeleton keys for tabs
const tabKeys = Array.from({ length: 6 }, () => crypto.randomUUID());
const tabCardKeys = Array.from({ length: 9 }, () => crypto.randomUUID());

const TabsSection = dynamic(
  () =>
    import('@/src/components/features/home/tabs-section').then((mod) => ({
      default: mod.TabsSection,
    })),
  {
    loading: () => (
      <div className="space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabKeys.map((key) => (
            <div key={key} className="h-10 w-24 bg-muted/50 rounded-md animate-pulse shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabCardKeys.map((key) => (
            <div key={key} className="h-48 bg-card/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
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
  const loadingRef = useRef(false);
  const activeTabRef = useRef(activeTab);

  // ✅ FIX: Update refs synchronously during render (not in useEffect)
  // This prevents race condition where loadMore executes with stale ref data
  filteredResultsRef.current = filteredResults;
  activeTabRef.current = activeTab;

  // Update displayed items when filtered results change
  useEffect(() => {
    // Reset pagination state before updating displayed items
    currentPageRef.current = 1;
    loadingRef.current = false;

    setDisplayedItems(filteredResults.slice(0, pageSize) as UnifiedContentItem[]);
  }, [filteredResults]);

  // Load more function for infinite scroll
  // Uses refs to avoid stale closures when filteredResults changes
  const loadMore = useCallback(async () => {
    // Concurrency protection - prevent multiple simultaneous loads
    if (loadingRef.current) {
      return [];
    }

    loadingRef.current = true;

    try {
      const nextPage = currentPageRef.current + 1;
      const startIndex = (nextPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const nextItems = filteredResultsRef.current.slice(startIndex, endIndex);

      // Validate we're still on the same tab before appending items
      const currentTab = activeTabRef.current;

      let uniqueNextItems: UnifiedContentItem[] = [];

      // Deduplicate using functional setState to get latest state
      setDisplayedItems((prev) => {
        // Additional validation - if tab changed, don't append items
        if (activeTabRef.current !== currentTab) {
          return prev; // Tab changed during load, abort update
        }

        const prevSlugs = new Set(prev.map((item) => item.slug));
        uniqueNextItems = nextItems.filter(
          (item) => !prevSlugs.has(item.slug)
        ) as UnifiedContentItem[];

        return [...prev, ...uniqueNextItems] as UnifiedContentItem[];
      });

      // Only increment page if items were actually added
      if (uniqueNextItems.length > 0) {
        currentPageRef.current = nextPage;
      }

      // Return the new items so infinite scroll knows items were loaded
      return uniqueNextItems;
    } finally {
      loadingRef.current = false;
    }
  }, []);

  // Memoize hasMore to prevent unnecessary re-renders
  const hasMore = useMemo(() => {
    return displayedItems.length < filteredResults.length;
  }, [displayedItems.length, filteredResults.length]);

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    // Reset pagination state when clearing search
    currentPageRef.current = 1;
    loadingRef.current = false;

    handleSearch('');
    // Don't manually set displayedItems - let useEffect handle it when filteredResults updates
  }, [handleSearch]);

  return (
    <>
      {/* Search Section */}
      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 pt-4 pb-6`}>
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

          {/* Quick Stats - Below Search Bar */}
          {stats && (
            <div
              className={`flex flex-wrap ${UI_CLASSES.JUSTIFY_CENTER} gap-4 lg:gap-6 text-xs lg:text-sm text-muted-foreground mt-6`}
            >
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <BookOpen className="h-4 w-4" />
                {stats.rules} Expert Rules
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Server className="h-4 w-4" />
                {stats.mcp} MCP Servers
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Sparkles className="h-4 w-4" />
                {stats.agents} AI Agents
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Sparkles className="h-4 w-4" />
                {stats.commands} Commands
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Sparkles className="h-4 w-4" />
                {stats.hooks} Automation Hooks
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Sparkles className="h-4 w-4" />
                {stats.statuslines} Statuslines
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <Layers className="h-4 w-4" />
                {stats.collections} Collections
              </div>
            </div>
          )}
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
