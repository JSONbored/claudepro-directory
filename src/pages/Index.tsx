import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ConfigCard } from '@/components/ConfigCard';
import { AuthorCard } from '@/components/AuthorCard';
import { FilterBar } from '@/components/FilterBar';
import { SortDropdown } from '@/components/SortDropdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Server, Sparkles, Github, ExternalLink, Briefcase } from 'lucide-react';
import { rules, Rule } from '@/data/rules';
import { mcpServers, MCPServer } from '@/data/mcp';
import { authors, getFeaturedAuthors } from '@/data/authors';
import { useFilters } from '@/hooks/useFilters';
import { useSorting } from '@/hooks/useSorting';

const Index = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { filters, updateFilter, resetFilters, applyFilters } = useFilters();
  const { sortBy, sortDirection, updateSort, sortItems } = useSorting();
  const featuredAuthors = getFeaturedAuthors();

  const allConfigs = [...rules, ...mcpServers];
  
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
  
  // Apply filters and sorting based on active tab
  const processedConfigs = useMemo(() => {
    let configs: (Rule | MCPServer)[] = [];
    
    switch (activeTab) {
      case 'rules':
        configs = rules;
        break;
      case 'mcp':
        configs = mcpServers;
        break;
      case 'community':
        return []; // Community tab shows authors, not configs
      default:
        configs = allConfigs;
    }
    
    const filtered = applyFilters(configs);
    return sortItems(filtered);
  }, [activeTab, filters, sortBy, sortDirection, rules, mcpServers, allConfigs, applyFilters, sortItems]);

  const getConfigType = (config: Rule | MCPServer): 'rule' | 'mcp' => {
    return 'content' in config ? 'rule' : 'mcp';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Sparkles className="h-12 w-12 text-primary" />
                <div className="absolute inset-0 h-12 w-12 text-primary animate-ping opacity-20" />
              </div>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Claude Pro Directory
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Discover powerful Claude configurations, MCP servers, and career opportunities to supercharge your AI workflows.
              From expert prompts to seamless integrations.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link to="/rules">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Browse Claude Rules
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                <Link to="/mcp">
                  <Server className="h-5 w-5 mr-2" />
                  Explore MCP Servers
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                <Link to="/jobs">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Find Jobs
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <Card 
                className="p-4 text-center cursor-pointer transition-all duration-300 hover:scale-105 border-border/50 hover:border-primary/30 hover:bg-primary/5"
                onClick={() => setActiveTab('all')}
              >
                <div className="text-2xl font-bold text-primary">{allConfigs.length}</div>
                <div className="text-sm text-muted-foreground">Total Configs</div>
              </Card>
              <Card 
                className="p-4 text-center cursor-pointer transition-all duration-300 hover:scale-105 border-border/50 hover:border-primary/30 hover:bg-primary/5"
                onClick={() => setActiveTab('rules')}
              >
                <div className="text-2xl font-bold text-primary">{rules.length}</div>
                <div className="text-sm text-muted-foreground">Claude Rules</div>
              </Card>
              <Card 
                className="p-4 text-center cursor-pointer transition-all duration-300 hover:scale-105 border-border/50 hover:border-primary/30 hover:bg-primary/5"
                onClick={() => setActiveTab('mcp')}
              >
                <div className="text-2xl font-bold text-primary">{mcpServers.length}</div>
                <div className="text-sm text-muted-foreground">MCP Servers</div>
              </Card>
              <Card 
                className="p-4 text-center cursor-pointer transition-all duration-300 hover:scale-105"
                onClick={() => window.open('https://github.com/JSONbored/claudepro-directory', '_blank')}
              >
                <Github className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-sm text-muted-foreground">Open Source</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <TabsList className="grid w-full lg:w-auto grid-cols-4">
              <TabsTrigger value="all" className="text-sm">All Configs</TabsTrigger>
              <TabsTrigger value="rules" className="text-sm">Rules</TabsTrigger>
              <TabsTrigger value="mcp" className="text-sm">MCP</TabsTrigger>
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

          <TabsContent value="community" className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Featured Contributors</h3>
              <p className="text-muted-foreground">
                Meet the experts creating amazing Claude configurations
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredAuthors.map((author) => (
                <AuthorCard key={author.id} author={author} />
              ))}
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
      </section>
    </div>
  );
};

export default Index;