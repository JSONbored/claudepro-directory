import { useState } from 'react';
import { ConfigCard } from '@/components/ConfigCard';
import { SearchBar } from '@/components/SearchBar';
import { Badge } from '@/components/ui/badge';
import { Server, Filter } from 'lucide-react';
import { mcpServers, MCPServer, getMcpsByCategory } from '@/data/mcp';

const categories = [
  { id: 'all', name: 'All Servers', count: mcpServers.length },
  { id: 'database', name: 'Database', count: getMcpsByCategory('database').length },
  { id: 'development', name: 'Development', count: getMcpsByCategory('development').length },
  { id: 'productivity', name: 'Productivity', count: getMcpsByCategory('productivity').length },
  { id: 'automation', name: 'Automation', count: getMcpsByCategory('automation').length },
  { id: 'file-system', name: 'File System', count: getMcpsByCategory('file-system').length },
  { id: 'other', name: 'Other', count: getMcpsByCategory('other').length },
];

const McpServers = () => {
  const [filteredServers, setFilteredServers] = useState<MCPServer[]>(mcpServers);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      setFilteredServers(mcpServers);
    } else {
      setFilteredServers(getMcpsByCategory(categoryId));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-primary/10 rounded-full">
                <Server className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-foreground">
              MCP Servers
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Model Context Protocol servers that extend Claude's capabilities with external integrations, 
              APIs, and specialized tools for enhanced functionality.
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary">
                <Server className="h-3 w-3 mr-1" />
                {mcpServers.length} Servers Available
              </Badge>
              <Badge variant="outline">
                Production Ready
              </Badge>
              <Badge variant="outline">
                Easy Integration
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter by category:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`cursor-pointer transition-smooth hover:scale-105 ${
                  selectedCategory === category.id
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary'
                    : 'border-border/50 hover:border-primary/30 hover:bg-primary/5 hover:text-primary'
                }`}
                onClick={() => handleCategoryFilter(category.id)}
              >
                {category.name} ({category.count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <SearchBar 
            data={selectedCategory === 'all' ? mcpServers : getMcpsByCategory(selectedCategory)}
            onFilteredResults={(results) => setFilteredServers(results as MCPServer[])}
            placeholder="Search MCP servers..."
          />
        </div>

        {/* Servers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServers.map((server) => (
            <ConfigCard
              key={server.id}
              {...server}
              type="mcp"
            />
          ))}
        </div>

        {filteredServers.length === 0 && (
          <div className="text-center py-16">
            <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No MCP servers found matching your criteria.</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or selecting a different category.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default McpServers;