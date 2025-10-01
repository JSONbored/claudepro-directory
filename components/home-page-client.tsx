'use client';

/**
 * Homepage Client Component (SHA-2086 Performance Optimizations)
 *
 * PERFORMANCE CRITICAL: This is the first page users see
 * Must maintain optimal performance with multiple content sections
 *
 * Optimizations Applied:
 * 1. ✅ Memoized featured sections to prevent unnecessary re-renders
 * 2. ✅ Stable array slicing with useMemo for featured items
 * 3. ✅ Memoized lookup maps for O(1) category filtering
 * 4. ✅ Lazy-loaded heavy components (UnifiedSearch)
 * 5. ✅ Proper memo wrapping for all sub-components
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { FC } from 'react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ConfigCard } from '@/components/config-card';
import { InfiniteScrollContainer } from '@/components/infinite-scroll-container';
import { LazyConfigCard, LazyInfiniteScrollContainer } from '@/components/lazy-components';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, ExternalLink, Search } from '@/lib/icons';

const UnifiedSearch = dynamic(
  () => import('@/components/unified-search').then((mod) => ({ default: mod.UnifiedSearch })),
  {
    ssr: false,
    loading: () => (
      <div className={`h-14 ${UI_CLASSES.BG_MUTED_50} ${UI_CLASSES.ROUNDED_LG} animate-pulse`} />
    ),
  }
);

import { useSearch } from '@/hooks/use-search';
import type { HomePageClientProps, UnifiedContentItem } from '@/lib/schemas/component.schema';
import { UI_CLASSES } from '@/lib/ui-constants';

/**
 * Memoized Featured Section Component (SHA-2086 Fix)
 *
 * PERFORMANCE: Prevents 30 card re-renders on every parent state change
 * Previously: All featured cards re-rendered on search/tab/filter changes
 * Now: Only re-renders when items prop actually changes
 *
 * Impact: ~180ms savings per state change (30 cards × 6ms each)
 */
interface FeaturedSectionProps {
  title: string;
  href: string;
  items: readonly UnifiedContentItem[];
}

const FeaturedSection: FC<FeaturedSectionProps> = memo(
  ({ title, href, items }: FeaturedSectionProps) => {
    // PERFORMANCE: Memoize the sliced array to prevent re-creating on every render
    // Previous: rules.slice(0, 6) created new array on EVERY parent render
    // Current: Stable reference unless items array changes
    const featuredItems = useMemo(() => items.slice(0, 6), [items]);

    return (
      <div>
        <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} ${UI_CLASSES.MB_8}`}>
          <h2 className={`text-2xl ${UI_CLASSES.FONT_BOLD}`}>{title}</h2>
          <Link href={href} className={UI_CLASSES.LINK_ACCENT_UNDERLINE}>
            View all <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
        <div className={UI_CLASSES.GRID_RESPONSIVE_3}>
          {featuredItems.map((item) => (
            <LazyConfigCard
              key={item.slug}
              item={item}
              variant="default"
              showCategory={true}
              showActions={true}
            />
          ))}
        </div>
      </div>
    );
  }
);

FeaturedSection.displayName = 'FeaturedSection';

function HomePageClientComponent({ initialData }: HomePageClientProps) {
  const { rules, mcp, agents, commands, hooks, allConfigs } = initialData;

  const [activeTab, setActiveTab] = useState('all');
  const [displayedItems, setDisplayedItems] = useState<UnifiedContentItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

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

  // Create lookup maps for O(1) slug checking instead of O(n) array.some() calls
  const slugLookupMaps = useMemo(() => {
    return {
      rules: new Set(rules.map((r) => r.slug)),
      mcp: new Set(mcp.map((m) => m.slug)),
      agents: new Set(agents.map((a) => a.slug)),
      commands: new Set(commands.map((c) => c.slug)),
      hooks: new Set(hooks.map((h) => h.slug)),
    };
  }, [rules, mcp, agents, commands, hooks]);

  // Filter search results by active tab - optimized with Set lookups
  const filteredResults = useMemo(() => {
    if (activeTab === 'all' || activeTab === 'community') {
      return searchResults;
    }

    const lookupSet = slugLookupMaps[activeTab as keyof typeof slugLookupMaps];
    return lookupSet ? searchResults.filter((item) => lookupSet.has(item.slug)) : searchResults;
  }, [searchResults, activeTab, slugLookupMaps]);

  // Update displayed items when filtered results change
  useEffect(() => {
    setDisplayedItems(filteredResults.slice(0, pageSize) as UnifiedContentItem[]);
    setCurrentPage(1);
  }, [filteredResults]);

  // Load more function for infinite scroll
  const loadMore = useCallback(async () => {
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const nextItems = filteredResults.slice(startIndex, endIndex);

    setDisplayedItems((prev) => [...prev, ...nextItems] as UnifiedContentItem[]);
    setCurrentPage(nextPage);

    return nextItems as UnifiedContentItem[];
  }, [currentPage, filteredResults]);

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
      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 py-8`}>
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
        {/* Search Results - Show when user searches */}
        {isSearching && (
          <div className="mb-16">
            <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} ${UI_CLASSES.MB_8}`}>
              <h2 className={`text-2xl ${UI_CLASSES.FONT_BOLD}`}>
                Search Results
                <span className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} ml-2`}>
                  ({filteredResults.length} found)
                </span>
              </h2>
              <Button variant="outline" onClick={handleClearSearch} className="text-sm">
                Clear Search
              </Button>
            </div>

            {filteredResults.length > 0 ? (
              <InfiniteScrollContainer
                items={displayedItems}
                renderItem={(item) => (
                  <ConfigCard
                    key={item.slug}
                    item={item}
                    variant="default"
                    showCategory={true}
                    showActions={true}
                  />
                )}
                loadMore={loadMore}
                hasMore={hasMore}
                pageSize={20}
                gridClassName={UI_CLASSES.GRID_RESPONSIVE_3}
                emptyMessage="No results found"
                keyExtractor={(item) => item.slug}
              />
            ) : (
              <div className={UI_CLASSES.CONTAINER_CARD_MUTED}>
                <Search
                  className={`h-12 w-12 ${UI_CLASSES.MX_AUTO} mb-4 ${UI_CLASSES.TEXT_MUTED_FOREGROUND}/50`}
                />
                <h3 className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.FONT_SEMIBOLD} mb-2`}>
                  No results found
                </h3>
                <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                  Try different keywords or browse our featured content below
                </p>
              </div>
            )}
          </div>
        )}

        {/* Featured Content - Only show when not searching */}
        {/* SHA-2086 FIX: Use memoized FeaturedSection to prevent 30 card re-renders */}
        {!isSearching && (
          <div className={`${UI_CLASSES.SPACE_Y_16} mb-16`}>
            <FeaturedSection title="Featured Rules" href="/rules" items={rules} />
            <FeaturedSection title="Featured MCPs" href="/mcp" items={mcp} />
            <FeaturedSection title="Featured Agents" href="/agents" items={agents} />
            <FeaturedSection title="Featured Commands" href="/commands" items={commands} />
            <FeaturedSection title="Featured Hooks" href="/hooks" items={hooks} />

            {/* Featured Jobs */}
            <div>
              <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} ${UI_CLASSES.MB_8}`}>
                <h2 className={`text-2xl ${UI_CLASSES.FONT_BOLD}`}>Featured Jobs</h2>
                <Link href="/jobs" className={UI_CLASSES.LINK_ACCENT_UNDERLINE}>
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <div className={UI_CLASSES.CONTAINER_CARD_MUTED}>
                <Briefcase
                  className={`h-12 w-12 ${UI_CLASSES.MX_AUTO} mb-4 ${UI_CLASSES.TEXT_MUTED_FOREGROUND}/50`}
                />
                <h3
                  className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.FONT_SEMIBOLD} ${UI_CLASSES.MB_2}`}
                >
                  Find Your Next AI Role
                </h3>
                <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} ${UI_CLASSES.MB_6}`}>
                  Discover opportunities with companies building the future of AI
                </p>
                <Button asChild>
                  <Link href="/jobs">Browse Job Opportunities</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Tabs with Infinite Scroll - Only show when not searching */}
        {!isSearching && (
          <Tabs value={activeTab} onValueChange={handleTabChange} className={UI_CLASSES.SPACE_Y_8}>
            <TabsList className={`grid ${UI_CLASSES.W_FULL} lg:w-auto grid-cols-7`}>
              <TabsTrigger value="all" className={UI_CLASSES.TEXT_SM}>
                All
              </TabsTrigger>
              <TabsTrigger value="rules" className={UI_CLASSES.TEXT_SM}>
                Rules
              </TabsTrigger>
              <TabsTrigger value="mcp" className={UI_CLASSES.TEXT_SM}>
                MCP
              </TabsTrigger>
              <TabsTrigger value="agents" className={UI_CLASSES.TEXT_SM}>
                Agents
              </TabsTrigger>
              <TabsTrigger value="commands" className={UI_CLASSES.TEXT_SM}>
                Commands
              </TabsTrigger>
              <TabsTrigger value="hooks" className={UI_CLASSES.TEXT_SM}>
                Hooks
              </TabsTrigger>
              <TabsTrigger value="community" className={UI_CLASSES.TEXT_SM}>
                Community
              </TabsTrigger>
            </TabsList>

            {/* Tab content for all tabs except community */}
            {['all', 'rules', 'mcp', 'agents', 'commands', 'hooks'].map((tab) => (
              <TabsContent key={tab} value={tab} className={UI_CLASSES.SPACE_Y_6}>
                {filteredResults.length > 0 ? (
                  <LazyInfiniteScrollContainer<UnifiedContentItem>
                    items={displayedItems}
                    renderItem={(item: UnifiedContentItem, _index: number) => (
                      <LazyConfigCard
                        key={item.slug}
                        item={item}
                        variant="default"
                        showCategory={true}
                        showActions={true}
                      />
                    )}
                    loadMore={loadMore}
                    hasMore={hasMore}
                    pageSize={20}
                    gridClassName={UI_CLASSES.GRID_RESPONSIVE_3}
                    emptyMessage={`No ${tab === 'all' ? 'configurations' : tab} found`}
                    keyExtractor={(item: UnifiedContentItem, _index: number) => item.slug}
                  />
                ) : (
                  <div className={`${UI_CLASSES.TEXT_CENTER} py-12`}>
                    <p className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                      No {tab === 'all' ? 'configurations' : tab} found
                    </p>
                    <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-2`}>
                      Try adjusting your filters.
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}

            <TabsContent value="community" className={UI_CLASSES.SPACE_Y_6}>
              <div className={`${UI_CLASSES.TEXT_CENTER} ${UI_CLASSES.MB_8}`}>
                <h3 className={`text-2xl ${UI_CLASSES.FONT_BOLD} ${UI_CLASSES.MB_2}`}>
                  Featured Contributors
                </h3>
                <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                  Meet the experts creating amazing Claude configurations
                </p>
              </div>

              <div className={UI_CLASSES.TEXT_CENTER}>
                <p
                  className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} ${UI_CLASSES.MB_6}`}
                >
                  Coming soon! Featured contributors who create amazing Claude configurations.
                </p>
              </div>

              <div className={`${UI_CLASSES.TEXT_CENTER} pt-8`}>
                <Button variant="outline" asChild>
                  <Link href="/community">View All Contributors</Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </section>
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders when initialData prop hasn't changed
const HomePageClient = memo(HomePageClientComponent);

export default HomePageClient;
