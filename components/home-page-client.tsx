'use client';

import { Briefcase, ExternalLink, Search } from 'lucide-react';
import Link from 'next/link';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ConfigCard } from '@/components/config-card';
import {
  LazyConfigCard,
  LazyInfiniteScrollContainer,
  LazyTabsComponents,
  LazyUnifiedSearch,
} from '@/components/lazy-components';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/hooks/use-search';
import type { HomePageClientProps, UnifiedContentItem } from '@/lib/schemas/component.schema';

function HomePageClientComponent({ initialData }: HomePageClientProps) {
  const { rules, mcp, agents, commands, hooks, allConfigs } = initialData;

  // Destructure lazy tabs components
  const { Tabs, TabsContent, TabsList, TabsTrigger } = LazyTabsComponents;

  const [activeTab, setActiveTab] = useState('all');
  const [displayedItems, setDisplayedItems] = useState<UnifiedContentItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Intersection observer state for lazy loading sections
  const [visibleSections, setVisibleSections] = useState<{
    featuredRules: boolean;
    featuredMcp: boolean;
    featuredAgents: boolean;
    featuredCommands: boolean;
    featuredHooks: boolean;
    jobs: boolean;
    allItems: boolean;
  }>({
    featuredRules: false,
    featuredMcp: false,
    featuredAgents: false,
    featuredCommands: false,
    featuredHooks: false,
    jobs: false,
    allItems: false,
  });

  // Refs for intersection observer
  const featuredRulesRef = useRef<HTMLDivElement>(null);
  const featuredMcpRef = useRef<HTMLDivElement>(null);
  const featuredAgentsRef = useRef<HTMLDivElement>(null);
  const featuredCommandsRef = useRef<HTMLDivElement>(null);
  const featuredHooksRef = useRef<HTMLDivElement>(null);
  const jobsRef = useRef<HTMLDivElement>(null);
  const allItemsRef = useRef<HTMLDivElement>(null);

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

  // Intersection observer for lazy loading sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionName = entry.target.getAttribute('data-section');
            if (sectionName) {
              setVisibleSections((prev) => ({
                ...prev,
                [sectionName]: true,
              }));
            }
          }
        });
      },
      {
        rootMargin: '200px', // Load content 200px before it comes into view
        threshold: 0.1,
      }
    );

    const refs = [
      { ref: featuredRulesRef, name: 'featuredRules' },
      { ref: featuredMcpRef, name: 'featuredMcp' },
      { ref: featuredAgentsRef, name: 'featuredAgents' },
      { ref: featuredCommandsRef, name: 'featuredCommands' },
      { ref: featuredHooksRef, name: 'featuredHooks' },
      { ref: jobsRef, name: 'jobs' },
      { ref: allItemsRef, name: 'allItems' },
    ];

    refs.forEach(({ ref, name }) => {
      if (ref.current) {
        ref.current.setAttribute('data-section', name);
        observer.observe(ref.current);
      }
    });

    return () => {
      refs.forEach(({ ref }) => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, []);

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
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <LazyUnifiedSearch
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

      <section className="container mx-auto px-4 pb-16">
        {/* Search Results - Show when user searches */}
        {isSearching && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                Search Results
                <span className="text-muted-foreground ml-2">({filteredResults.length} found)</span>
              </h2>
              <Button variant="outline" onClick={handleClearSearch} className="text-sm">
                Clear Search
              </Button>
            </div>

            {filteredResults.length > 0 ? (
              <LazyInfiniteScrollContainer
                items={displayedItems}
                renderItem={(item: UnifiedContentItem) => (
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
                gridClassName="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                emptyMessage="No results found"
                keyExtractor={(item: UnifiedContentItem) => item.slug}
              />
            ) : (
              <div className="text-center py-12 bg-card/50 rounded-xl border border-border/50">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try different keywords or browse our featured content below
                </p>
              </div>
            )}
          </div>
        )}

        {/* Featured Content - Only show when not searching */}
        {!isSearching && (
          <div className="space-y-16 mb-16">
            {/* Featured Rules */}
            <div ref={featuredRulesRef}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured Rules</h2>
                <Link href="/rules" className="text-accent hover:underline flex items-center gap-2">
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              {visibleSections.featuredRules ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {rules.slice(0, 6).map((rule) => (
                    <LazyConfigCard
                      key={rule.slug}
                      item={rule}
                      variant="default"
                      showCategory={true}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={`rules-skeleton-${i + 1}`}
                      className="h-48 bg-card/50 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Featured MCPs */}
            <div ref={featuredMcpRef}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured MCPs</h2>
                <Link href="/mcp" className="text-accent hover:underline flex items-center gap-2">
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              {visibleSections.featuredMcp ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {mcp.slice(0, 6).map((mcpItem) => (
                    <LazyConfigCard
                      key={mcpItem.slug}
                      item={mcpItem}
                      variant="default"
                      showCategory={true}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={`skeleton-${i + 1}`}
                      className="h-48 bg-card/50 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Featured Agents */}
            <div ref={featuredAgentsRef}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured Agents</h2>
                <Link
                  href="/agents"
                  className="text-accent hover:underline flex items-center gap-2"
                >
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              {visibleSections.featuredAgents ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {agents.slice(0, 6).map((agent) => (
                    <LazyConfigCard
                      key={agent.slug}
                      item={agent}
                      variant="default"
                      showCategory={true}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={`skeleton-${i + 1}`}
                      className="h-48 bg-card/50 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Featured Commands */}
            <div ref={featuredCommandsRef}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured Commands</h2>
                <Link
                  href="/commands"
                  className="text-accent hover:underline flex items-center gap-2"
                >
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              {visibleSections.featuredCommands ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {commands.slice(0, 6).map((command) => (
                    <LazyConfigCard
                      key={command.slug}
                      item={command}
                      variant="default"
                      showCategory={true}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={`skeleton-${i + 1}`}
                      className="h-48 bg-card/50 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Featured Hooks */}
            <div ref={featuredHooksRef}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured Hooks</h2>
                <Link href="/hooks" className="text-accent hover:underline flex items-center gap-2">
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              {visibleSections.featuredHooks ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {hooks.slice(0, 6).map((hook) => (
                    <LazyConfigCard
                      key={hook.slug}
                      item={hook}
                      variant="default"
                      showCategory={true}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={`skeleton-${i + 1}`}
                      className="h-48 bg-card/50 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Featured Jobs */}
            <div ref={jobsRef}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured Jobs</h2>
                <Link href="/jobs" className="text-accent hover:underline flex items-center gap-2">
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              {visibleSections.jobs ? (
                <div className="text-center py-12 bg-card/50 rounded-xl border border-border/50">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">Find Your Next AI Role</h3>
                  <p className="text-muted-foreground mb-6">
                    Discover opportunities with companies building the future of AI
                  </p>
                  <Button asChild>
                    <Link href="/jobs">Browse Job Opportunities</Link>
                  </Button>
                </div>
              ) : (
                <div className="h-48 bg-card/50 rounded-xl animate-pulse" />
              )}
            </div>
          </div>
        )}

        {/* Advanced Tabs with Infinite Scroll - Only show when not searching */}
        {!isSearching && (
          <div ref={allItemsRef}>
            {visibleSections.allItems ? (
              <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
                <TabsList className="grid w-full lg:w-auto grid-cols-7">
                  <TabsTrigger value="all" className="text-sm">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="rules" className="text-sm">
                    Rules
                  </TabsTrigger>
                  <TabsTrigger value="mcp" className="text-sm">
                    MCP
                  </TabsTrigger>
                  <TabsTrigger value="agents" className="text-sm">
                    Agents
                  </TabsTrigger>
                  <TabsTrigger value="commands" className="text-sm">
                    Commands
                  </TabsTrigger>
                  <TabsTrigger value="hooks" className="text-sm">
                    Hooks
                  </TabsTrigger>
                  <TabsTrigger value="community" className="text-sm">
                    Community
                  </TabsTrigger>
                </TabsList>

                {/* Tab content for all tabs except community */}
                {['all', 'rules', 'mcp', 'agents', 'commands', 'hooks'].map((tab) => (
                  <TabsContent key={tab} value={tab} className="space-y-6">
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
                        showLoadMoreButton={false}
                        gridClassName="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                        emptyMessage={`No ${tab === 'all' ? 'configurations' : tab} found`}
                        keyExtractor={(item: UnifiedContentItem, _index: number) => item.slug}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-lg text-muted-foreground">
                          No {tab === 'all' ? 'configurations' : tab} found
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Try adjusting your filters.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                ))}

                <TabsContent value="community" className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">Featured Contributors</h3>
                    <p className="text-muted-foreground">
                      Meet the experts creating amazing Claude configurations
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-lg text-muted-foreground mb-6">
                      Coming soon! Featured contributors who create amazing Claude configurations.
                    </p>
                  </div>

                  <div className="text-center pt-8">
                    <Button variant="outline" asChild>
                      <Link href="/community">View All Contributors</Link>
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-8">
                <div className="h-10 bg-card/50 rounded-lg animate-pulse" />
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={`skeleton-${i + 1}`}
                      className="h-48 bg-card/50 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders when initialData prop hasn't changed
const HomePageClient = memo(HomePageClientComponent);

export default HomePageClient;
