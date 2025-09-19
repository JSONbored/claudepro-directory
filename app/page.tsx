'use client';

import { BookOpen, Briefcase, ExternalLink, Search, Server, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { ConfigCard } from '@/components/config-card';
import { InfiniteScrollContainer } from '@/components/infinite-scroll-container';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type FilterState, UnifiedSearch } from '@/components/unified-search';
import { agents, commands, hooks, mcp, rules } from '@/generated/content';
import type { ContentItem } from '@/types/content';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({ sort: 'trending' });
  const [filteredItems, setFilteredItems] = useState<ContentItem[]>([]);
  const [displayedItems, setDisplayedItems] = useState<ContentItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const allConfigs = useMemo(() => [...rules, ...mcp, ...agents, ...commands, ...hooks], []);

  // Get unique values for filter options
  const availableCategories = useMemo(
    () => [...new Set(allConfigs.map((item) => item.category))].filter(Boolean) as string[],
    [allConfigs]
  );
  const availableTags = useMemo(
    () => [...new Set(allConfigs.flatMap((item) => item.tags || []))].filter(Boolean),
    [allConfigs]
  );
  const availableAuthors = useMemo(
    () => [...new Set(allConfigs.map((item) => item.author))].filter(Boolean) as string[],
    [allConfigs]
  );

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      const searchLower = query.toLowerCase();

      if (!query.trim()) {
        setFilteredItems([]);
        setDisplayedItems([]);
        setCurrentPage(1);
        return;
      }

      const filtered = allConfigs.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
          item.category?.toLowerCase().includes(searchLower) ||
          item.author?.toLowerCase().includes(searchLower)
      );

      setFilteredItems(filtered);
      setDisplayedItems(filtered.slice(0, pageSize));
      setCurrentPage(1);
    },
    [allConfigs]
  );

  // Handle filters change
  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);

      let baseItems = searchQuery.trim() ? filteredItems : allConfigs;

      // Apply tab filter
      if (activeTab !== 'all' && activeTab !== 'community') {
        switch (activeTab) {
          case 'rules':
            baseItems = baseItems.filter((item) => rules.some((r) => r.id === item.id));
            break;
          case 'mcp':
            baseItems = baseItems.filter((item) => mcp.some((m) => m.id === item.id));
            break;
          case 'agents':
            baseItems = baseItems.filter((item) => agents.some((a) => a.id === item.id));
            break;
          case 'commands':
            baseItems = baseItems.filter((item) => commands.some((c) => c.id === item.id));
            break;
          case 'hooks':
            baseItems = baseItems.filter((item) => hooks.some((h) => h.id === item.id));
            break;
        }
      }

      let processed = [...baseItems];

      // Apply category filter
      if (newFilters.category) {
        processed = processed.filter((item) => item.category === newFilters.category);
      }

      // Apply author filter
      if (newFilters.author) {
        processed = processed.filter((item) => item.author === newFilters.author);
      }

      // Apply tags filter
      if (newFilters.tags && newFilters.tags.length > 0) {
        processed = processed.filter((item) =>
          newFilters.tags?.some((tag) => item.tags?.includes(tag))
        );
      }

      // Apply sorting
      switch (newFilters.sort) {
        case 'alphabetical':
          processed.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          break;
        case 'newest':
          // Most items don't have dates, so keep original order
          break;
        default:
          // Keep original order which should be trending
          break;
      }

      setFilteredItems(processed);
      setDisplayedItems(processed.slice(0, pageSize));
      setCurrentPage(1);
    },
    [searchQuery, filteredItems, allConfigs, activeTab]
  );

  // Load more function for infinite scroll
  const loadMore = useCallback(async () => {
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const nextItems = filteredItems.slice(startIndex, endIndex);

    // Simulate async load with small delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    setDisplayedItems((prev) => [...prev, ...nextItems]);
    setCurrentPage(nextPage);

    return nextItems;
  }, [currentPage, filteredItems]);

  const hasMore = displayedItems.length < filteredItems.length;
  const isSearching = searchQuery.trim().length > 0;

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
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      // Re-apply filters when tab changes
      handleFiltersChange(filters);
    },
    [filters, handleFiltersChange]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden border-b border-border/50"
        aria-label="Homepage hero"
      >
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-foreground tracking-tight">
              The home for Claude enthusiasts
            </h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
              Discover and share the best Claude configurations. Explore expert rules, browse
              powerful MCP servers, find specialized agents and commands, discover automation hooks,
              and connect with the community building the future of AI.
            </p>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto mb-8">
              <UnifiedSearch
                placeholder="Search for rules, MCP servers, agents, commands, and more..."
                onSearch={handleSearch}
                onFiltersChange={handleFiltersChange}
                filters={filters}
                availableTags={availableTags}
                availableAuthors={availableAuthors}
                availableCategories={availableCategories}
                resultCount={filteredItems.length}
              />
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {rules.length} Expert Rules
              </div>
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                {mcp.length} MCP Servers
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {agents.length} AI Agents
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {commands.length} Commands
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {hooks.length} Automation Hooks
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        {/* Search Results - Show when user searches */}
        {isSearching && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                Search Results
                <span className="text-muted-foreground ml-2">({filteredItems.length} found)</span>
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilteredItems([]);
                  setDisplayedItems([]);
                }}
                className="text-sm"
              >
                Clear Search
              </Button>
            </div>

            {filteredItems.length > 0 ? (
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
                  <ConfigCard key={rule.id} {...rule} type="rules" />
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
                  <ConfigCard key={mcpItem.id} {...mcpItem} type="mcp" />
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
                  <ConfigCard key={agent.id} {...agent} type="agents" />
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
                  <ConfigCard key={command.id} {...command} type="commands" />
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
                  <ConfigCard key={hook.id} {...hook} type="hooks" />
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
                {filteredItems.length > 0 ? (
                  <InfiniteScrollContainer
                    items={displayedItems}
                    renderItem={(item) => (
                      <ConfigCard key={item.id} {...item} type={getConfigType(item)} />
                    )}
                    loadMore={loadMore}
                    hasMore={hasMore}
                    pageSize={20}
                    gridClassName="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    emptyMessage={`No ${tab === 'all' ? 'configurations' : tab} found`}
                    keyExtractor={(item) => item.id}
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
    </div>
  );
}
