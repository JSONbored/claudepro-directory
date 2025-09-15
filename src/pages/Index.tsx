import { useState } from 'react';
import { ConfigCard } from '@/components/ConfigCard';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Server, Sparkles, Github, ExternalLink } from 'lucide-react';
import { rules, ClaudeRule } from '@/data/rules';
import { mcpServers, MCPServer } from '@/data/mcp';

const Index = () => {
  const [filteredRules, setFilteredRules] = useState<ClaudeRule[]>(rules);
  const [filteredMcps, setFilteredMcps] = useState<MCPServer[]>(mcpServers);
  const [activeTab, setActiveTab] = useState('all');

  const allConfigs = [...rules, ...mcpServers];
  const [filteredAll, setFilteredAll] = useState<(ClaudeRule | MCPServer)[]>(allConfigs);

  const getConfigType = (config: ClaudeRule | MCPServer): 'rule' | 'mcp' => {
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
                <Sparkles className="h-8 w-8 text-primary mr-3 animate-pulse" />
                <div className="absolute inset-0 h-8 w-8 text-primary mr-3 animate-ping opacity-20" />
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                Claude Pro Directory
              </h1>
            </div>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover and share the best Claude configurations. Enhance your AI workflow with expert rules and MCP servers.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              <Badge variant="outline" className="text-sm px-4 py-2 border-primary/20 bg-primary/5 text-primary">
                <BookOpen className="h-3 w-3 mr-2" />
                {rules.length} Claude Rules
              </Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 border-primary/20 bg-primary/5 text-primary">
                <Server className="h-3 w-3 mr-2" />
                {mcpServers.length} MCP Servers
              </Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 border-primary/20 bg-primary/5 text-primary">
                <Sparkles className="h-3 w-3 mr-2" />
                Community Driven
              </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button 
                variant="default" 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-orange transition-all duration-300"
                onClick={() => document.getElementById('configs')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Configs
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
                onClick={() => window.open('https://github.com/modelcontextprotocol/servers', '_blank')}
              >
                <Github className="h-4 w-4 mr-2" />
                View on GitHub
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
                className="hover:bg-primary/5 hover:text-primary transition-all duration-300"
                onClick={() => window.open('https://modelcontextprotocol.io', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Learn MCP
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section id="configs" className="container mx-auto px-4 py-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <TabsList className="grid w-full lg:w-auto grid-cols-3 lg:grid-cols-3 bg-card border border-border/50">
              <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Sparkles className="h-4 w-4" />
                All ({allConfigs.length})
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BookOpen className="h-4 w-4" />
                Rules ({rules.length})
              </TabsTrigger>
              <TabsTrigger value="mcp" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Server className="h-4 w-4" />
                MCP ({mcpServers.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-6">
            <SearchBar 
              data={allConfigs}
              onFilteredResults={setFilteredAll}
              placeholder="Search all configs..."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAll.map((config) => (
                <ConfigCard
                  key={config.id}
                  {...config}
                  type={getConfigType(config)}
                />
              ))}
            </div>
            {filteredAll.length === 0 && (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">No configs found matching your criteria.</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <SearchBar 
              data={rules}
              onFilteredResults={(results) => setFilteredRules(results as ClaudeRule[])}
              placeholder="Search Claude rules..."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRules.map((rule) => (
                <ConfigCard
                  key={rule.id}
                  {...rule}
                  type="rule"
                />
              ))}
            </div>
            {filteredRules.length === 0 && (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">No rules found matching your criteria.</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="mcp" className="space-y-6">
            <SearchBar 
              data={mcpServers}
              onFilteredResults={(results) => setFilteredMcps(results as MCPServer[])}
              placeholder="Search MCP servers..."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMcps.map((mcp) => (
                <ConfigCard
                  key={mcp.id}
                  {...mcp}
                  type="mcp"
                />
              ))}
            </div>
            {filteredMcps.length === 0 && (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">No MCP servers found matching your criteria.</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default Index;
