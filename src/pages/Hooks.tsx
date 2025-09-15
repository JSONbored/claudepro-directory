import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfigCard } from '@/components/ConfigCard';
import { SearchBar } from '@/components/SearchBar';
import { FilterBar } from '@/components/FilterBar';
import { SortDropdown } from '@/components/SortDropdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Webhook, ExternalLink, Sparkles } from 'lucide-react';
import { hooks, Hook } from '@/data/hooks';
import { useFilters } from '@/hooks/useFilters';
import { useSorting } from '@/hooks/useSorting';

const Hooks = () => {
  const [searchResults, setSearchResults] = useState<Hook[]>(hooks);
  const { filters, updateFilter, resetFilters, applyFilters } = useFilters();
  const { sortBy, sortDirection, updateSort, sortItems } = useSorting();

  const handleSearchResults = (results: Hook[]) => {
    setSearchResults(results);
  };

  const processedHooks = sortItems(applyFilters(searchResults));

  const categories = [...new Set(hooks.map(hook => hook.category))];
  const tags = [...new Set(hooks.flatMap(hook => hook.tags))];
  const authors = [...new Set(hooks.map(hook => hook.author))];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-primary/10 rounded-full">
                <Webhook className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-foreground">
              Claude Hooks
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Automate your workflows with powerful hooks. Connect Claude to your tools and systems 
              for seamless integration and automated responses.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Badge variant="secondary">
                <Sparkles className="h-3 w-3 mr-1" />
                {hooks.length} Hooks Available
              </Badge>
              <Badge variant="outline">
                Event-Driven
              </Badge>
              <Badge variant="outline">
                Multi-Platform
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Search */}
          <SearchBar
            data={hooks}
            onFilteredResults={handleSearchResults}
            placeholder="Search hooks by name, category, or trigger event..."
          />

          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {processedHooks.length} hook{processedHooks.length !== 1 ? 's' : ''} found
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link to="/submit" className="flex items-center gap-2">
                  <ExternalLink className="h-3 w-3" />
                  Submit Hook
                </Link>
              </Button>
            </div>
            
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
            availableCategories={categories}
            availableTags={tags}
            availableAuthors={authors}
          />

          {/* Results */}
          {processedHooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedHooks.map((hook) => (
                <ConfigCard
                  key={hook.id}
                  {...hook}
                  type="hook"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Webhook className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No hooks found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or filters.
              </p>
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Hooks;