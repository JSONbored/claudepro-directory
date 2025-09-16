import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ConfigCard } from '@/components/config-card';
import { FilterBar } from '@/components/filter-bar';
import { SortDropdown } from '@/components/sort-dropdown';
import { SearchBar } from '@/components/search-bar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Server, Sparkles, Github, ExternalLink, Briefcase, Search } from 'lucide-react';
import { rules, mcp, agents, commands, hooks } from '@/generated/content';
import { useFilters } from '@/hooks/useFilters';
import { useSorting } from '@/hooks/useSorting';

const Index = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { filters, updateFilter, resetFilters, applyFilters } = useFilters();
  const { sortBy, sortDirection, updateSort, sortItems } = useSorting();

  const allConfigs = [...rules, ...mcp, ...agents, ...commands, ...hooks];
  
  // Get unique values for filter options
  const availableCategories = useMemo(() => 
    [...new Set(allConfigs.map(item => item.category))], [allConfigs]
  );
  const availableTags = useMemo(() => 
    [...new Set(allConfigs.flatMap(item => item.tags))], [allConfigs]
  );
  const availableAuthors = useMemo(() => 
    [...new Set(allConfigs.map(item => item.author))], [allConfigs]
  );
  
  // Handle search results
  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
  };

  // Handle search query changes
  const handleSearchQuery = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.trim().length > 0);
  };

  // Apply filters and sorting based on active tab
  const processedConfigs = useMemo(() => {
    let configs: any[] = [];
    
    // Use search results when searching, otherwise use all configs
    const baseConfigs = isSearching ? searchResults : allConfigs;
    
    switch (activeTab) {
      case 'rules':
        configs = baseConfigs.filter(config => rules.some(r => r.id === config.id));
        break;
      case 'mcp':
        configs = baseConfigs.filter(config => mcp.some(m => m.id === config.id));
        break;
      case 'agents':
        configs = baseConfigs.filter(config => agents.some(a => a.id === config.id));
        break;
      case 'commands':
        configs = baseConfigs.filter(config => commands.some(c => c.id === config.id));
        break;
      case 'hooks':
        configs = baseConfigs.filter(config => hooks.some(h => h.id === config.id));
        break;
      case 'community':
        return []; // Community tab shows authors, not configs
      default:
        configs = baseConfigs;
    }
    
    const filtered = applyFilters(configs);
    return sortItems(filtered);
  }, [activeTab, filters, sortBy, sortDirection, searchResults, isSearching, allConfigs, applyFilters, sortItems]);

  const getConfigType = (config: any): 'rule' | 'mcp' | 'agent' | 'command' | 'hook' => {
    // Determine type based on which array the config came from
    if (agents.some(a => a.id === config.id)) return 'agent';
    if (commands.some(c => c.id === config.id)) return 'command';
    if (hooks.some(h => h.id === config.id)) return 'hook';
    if (mcp.some(m => m.id === config.id)) return 'mcp';
    if (rules.some(r => r.id === config.id)) return 'rule';
    
    // Fallback: check for content field
    return 'content' in config ? 'rule' : 'mcp';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-foreground tracking-tight">
              The home for Claude enthusiasts
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
              Discover and share the best Claude configurations. Explore expert rules, browse powerful MCP servers, 
              find specialized agents and commands, discover automation hooks, and connect with the community building the future of AI.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <SearchBar
                data={allConfigs}
                onFilteredResults={handleSearchResults}
                onSearchQueryChange={handleSearchQuery}
                placeholder="Search for rules, MCP servers, agents, commands, and more..."
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
        {/* Search Results - Show immediately when user searches */}
        {isSearching && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                Search Results 
                <span className="text-muted-foreground ml-2">({searchResults.length} found)</span>
              </h2>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-sm"
              >
                Clear Search
              </Button>
            </div>
            
            {searchResults.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((config) => (
                  <ConfigCard
                    key={config.id}
                    {...config}
                    type={getConfigType(config)}
                  />
                ))}
              </div>
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
                <Link to="/rules" className="text-primary hover:underline flex items-center gap-2">
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rules.slice(0, 6).map((rule) => (
                  <ConfigCard
                    key={rule.id}
                    {...rule}
                    type="rule"
                  />
                ))}
              </div>
            </div>

            {/* Featured MCPs */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured MCPs</h2>
                <Link to="/mcp" className="text-primary hover:underline flex items-center gap-2">
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {mcp.slice(0, 6).map((mcpItem) => (
                  <ConfigCard
                    key={mcpItem.id}
                    {...mcpItem}
                    type="mcp"
                  />
                ))}
              </div>
            </div>

            {/* Featured Agents */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured Agents</h2>
                <Link to="/agents" className="text-primary hover:underline flex items-center gap-2">
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {agents.slice(0, 6).map((agent) => (
                  <ConfigCard
                    key={agent.id}
                    {...agent}
                    type="agent"
                  />
                ))}
              </div>
            </div>

            {/* Featured Commands */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured Commands</h2>
                <Link to="/commands" className="text-primary hover:underline flex items-center gap-2">
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {commands.slice(0, 6).map((command) => (
                  <ConfigCard
                    key={command.id}
                    {...command}
                    type="command"
                  />
                ))}
              </div>
            </div>

            {/* Featured Hooks */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured Hooks</h2>
                <Link to="/hooks" className="text-primary hover:underline flex items-center gap-2">
                  View all <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {hooks.slice(0, 6).map((hook) => (
                  <ConfigCard
                    key={hook.id}
                    {...hook}
                    type="hook"
                  />
                ))}
              </div>
            </div>

            {/* Featured Jobs */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured Jobs</h2>
                <Link to="/jobs" className="text-primary hover:underline flex items-center gap-2">
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
                  <Link to="/jobs">Browse Job Opportunities</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Tabs - Only show when not searching */}
        {!isSearching && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <TabsList className="grid w-full lg:w-auto grid-cols-7">
                <TabsTrigger value="all" className="text-sm">All</TabsTrigger>
                <TabsTrigger value="rules" className="text-sm">Rules</TabsTrigger>
                <TabsTrigger value="mcp" className="text-sm">MCP</TabsTrigger>
                <TabsTrigger value="agents" className="text-sm">Agents</TabsTrigger>
                <TabsTrigger value="commands" className="text-sm">Commands</TabsTrigger>
                <TabsTrigger value="hooks" className="text-sm">Hooks</TabsTrigger>
                <TabsTrigger value="community" className="text-sm">Community</TabsTrigger>
              </TabsList>
              
              <SortDropdown
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={updateSort}
              />
            </div>

            {/* Filters */}
            <FilterBar
              filters={filters}
              onFilterChange={updateFilter}
              onResetFilters={resetFilters}
              availableCategories={availableCategories}
              availableTags={availableTags}
              availableAuthors={availableAuthors}
            />

            {/* Results */}
            <TabsContent value="all" className="space-y-6">
              {processedConfigs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedConfigs.map((config) => (
                    <ConfigCard
                      key={config.id}
                      {...config}
                      type={getConfigType(config)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">No configurations found</p>
                  <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="rules" className="space-y-6">
              {processedConfigs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedConfigs.map((config) => (
                    <ConfigCard
                      key={config.id}
                      {...config}
                      type={getConfigType(config)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">No Claude rules found</p>
                  <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="mcp" className="space-y-6">
              {processedConfigs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedConfigs.map((config) => (
                    <ConfigCard
                      key={config.id}
                      {...config}
                      type={getConfigType(config)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">No MCP servers found</p>
                  <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="agents" className="space-y-6">
              {processedConfigs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedConfigs.map((config) => (
                    <ConfigCard
                      key={config.id}
                      {...config}
                      type={getConfigType(config)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">No AI agents found</p>
                  <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="commands" className="space-y-6">
              {processedConfigs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedConfigs.map((config) => (
                    <ConfigCard
                      key={config.id}
                      {...config}
                      type={getConfigType(config)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">No commands found</p>
                  <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="hooks" className="space-y-6">
              {processedConfigs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedConfigs.map((config) => (
                    <ConfigCard
                      key={config.id}
                      {...config}
                      type={getConfigType(config)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">No automation hooks found</p>
                  <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
                </div>
              )}
            </TabsContent>

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
                  <Link to="/community">
                    View All Contributors
                  </Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </section>
    </div>
  );
};

export default Index;