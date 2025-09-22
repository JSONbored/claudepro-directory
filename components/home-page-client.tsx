'use client';

import { Briefcase, ExternalLink, Search } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ConfigCard } from '@/components/config-card';
import { InfiniteScrollContainer } from '@/components/infinite-scroll-container';
import { LazyConfigCard, LazyInfiniteScrollContainer } from '@/components/lazy-components';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedSearch } from '@/components/unified-search';
import { useSearch } from '@/hooks/use-search';
import type { ContentItem } from '@/types/content';

interface HomePageClientProps {
  initialData: {
    rules: ContentItem[];
    mcp: ContentItem[];
    agents: ContentItem[];
    commands: ContentItem[];
    hooks: ContentItem[];
    allConfigs: ContentItem[];
  };
}

export default function HomePageClient({ initialData }: HomePageClientProps) {
  const { rules, mcp, agents, commands, hooks, allConfigs } = initialData;

  const [activeTab, setActiveTab] = useState('all');
  const [displayedItems, setDisplayedItems] = useState<ContentItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Use React 19 optimized search hook
  const { filters, searchResults, filterOptions, handleSearch, handleFiltersChange, isSearching } =
    useSearch({
      data: allConfigs,
      searchOptions: {
        threshold: 0.3,
        minMatchCharLength: 2,
      },
    });

  // Filter search results by active tab
  const filteredResults = useMemo(() => {
    if (activeTab === 'all' || activeTab === 'community') {
      return searchResults;
    }

    switch (activeTab) {
      case 'rules':
        return searchResults.filter((item) => rules.some((r) => r.id === item.id));
      case 'mcp':
        return searchResults.filter((item) => mcp.some((m) => m.id === item.id));
      case 'agents':
        return searchResults.filter((item) => agents.some((a) => a.id === item.id));
      case 'commands':
        return searchResults.filter((item) => commands.some((c) => c.id === item.id));
      case 'hooks':
        return searchResults.filter((item) => hooks.some((h) => h.id === item.id));
      default:
        return searchResults;
    }
  }, [searchResults, activeTab, agents, commands, hooks, mcp, rules]);

  // Update displayed items when filtered results change
  useEffect(() => {
    setDisplayedItems(filteredResults.slice(0, pageSize));
    setCurrentPage(1);
  }, [filteredResults]);

  // Load more function for infinite scroll
  const loadMore = useCallback(async () => {
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const nextItems = filteredResults.slice(startIndex, endIndex);

    // Simulate async load with small delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    setDisplayedItems((prev) => [...prev, ...nextItems]);
    setCurrentPage(nextPage);

    return nextItems;
  }, [currentPage, filteredResults]);

  const hasMore = displayedItems.length < filteredResults.length;

  const getConfigType = (
    config: ContentItem
  ): 'rules' | 'mcp' | 'agents' | 'commands' | 'hooks' => {
    // Determine type based on which array the config came from
    if (agents.some((a) => a.id === config.id)) return 'agents';
    if (commands.some((c) => c.id === config.id)) return 'commands';
    if (hooks.some((h) => h.id === config.id)) return 'hooks';
    if (mcp.some((m) => m.id === config.id)) return 'mcp';
    if (rules.some((r) => r.id === config.id)) return 'rules';

    // Fallback: check for content field
    return 'content' in config ? 'rules' : 'mcp';
  };

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  return (
    <>
      {/* Search Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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

      <section className="container mx-auto px-4 pb-16">
        {/* Search Results - Show when user searches */}
        {isSearching && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                Search Results
                <span className="text-muted-foreground ml-2">({filteredResults.length} found)</span>
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  handleSearch('');
                  setDisplayedItems([]);
                }}
                className="text-sm"
              >
                Clear Search
              </Button>
            </div>

            {filteredResults.length > 0 ? (
              <InfiniteScrollContainer
                items={displayedItems}
                renderItem={(item) => (
                  <ConfigCard key={item.id} {...item} type={getConfigType(item)} />
                )}
                loadMore={loadMore}
                hasMore={hasMore}
                pageSize={20}
                gridClassName="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                emptyMessage="No results found"
                keyExtractor={(item) => item.id}
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
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured Rules</h2>
                <Link href="/rules" className="text-accent hover:underline flex items-center gap-2">
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rules.slice(0, 6).map((rule) => (
                  <LazyConfigCard key={rule.id} {...rule} type="rules" />
                ))}
              </div>
            </div>

            {/* Featured MCPs */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured MCPs</h2>
                <Link href="/mcp" className="text-accent hover:underline flex items-center gap-2">
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {mcp.slice(0, 6).map((mcpItem) => (
                  <LazyConfigCard key={mcpItem.id} {...mcpItem} type="mcp" />
                ))}
              </div>
            </div>

            {/* Featured Agents */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured Agents</h2>
                <Link
                  href="/agents"
                  className="text-accent hover:underline flex items-center gap-2"
                >
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {agents.slice(0, 6).map((agent) => (
                  <LazyConfigCard key={agent.id} {...agent} type="agents" />
                ))}
              </div>
            </div>

            {/* Featured Commands */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured Commands</h2>
                <Link
                  href="/commands"
                  className="text-accent hover:underline flex items-center gap-2"
                >
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {commands.slice(0, 6).map((command) => (
                  <LazyConfigCard key={command.id} {...command} type="commands" />
                ))}
              </div>
            </div>

            {/* Featured Hooks */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured Hooks</h2>
                <Link href="/hooks" className="text-accent hover:underline flex items-center gap-2">
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {hooks.slice(0, 6).map((hook) => (
                  <LazyConfigCard key={hook.id} {...hook} type="hooks" />
                ))}
              </div>
            </div>

            {/* Featured Jobs */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured Jobs</h2>
                <Link href="/jobs" className="text-accent hover:underline flex items-center gap-2">
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
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
            </div>
          </div>
        )}

        {/* Advanced Tabs with Infinite Scroll - Only show when not searching */}
        {!isSearching && (
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
                  <LazyInfiniteScrollContainer
                    items={displayedItems}
                    renderItem={(item: any, _index: number) => (
                      <LazyConfigCard
                        key={(item as ContentItem).id}
                        {...(item as ContentItem)}
                        type={getConfigType(item as ContentItem)}
                      />
                    )}
                    loadMore={loadMore}
                    hasMore={hasMore}
                    pageSize={20}
                    gridClassName="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    emptyMessage={`No ${tab === 'all' ? 'configurations' : tab} found`}
                    keyExtractor={(item: any, _index: number) => (item as ContentItem).id}
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
        )}
      </section>
    </>
  );
}
