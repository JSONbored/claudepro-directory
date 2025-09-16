import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfigCard } from '@/components/config-card';
import { SearchBar } from '@/components/search-bar';
import { FilterBar } from '@/components/filter-bar';
import { SortDropdown } from '@/components/sort-dropdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Sparkles, LucideIcon } from 'lucide-react';
import { useFilters } from '@/hooks/useFilters';
import { useSorting } from '@/hooks/useSorting';
import type { ContentMetadata, ContentCategory } from '@/types/content';

interface ContentListPageProps<T extends ContentMetadata> {
  title: string;
  description: string;
  icon: LucideIcon;
  items: T[];
  type: ContentCategory;
  searchPlaceholder?: string;
  badges?: Array<{
    icon?: LucideIcon;
    text: string;
  }>;
}

export function ContentListPage<T extends ContentMetadata>({
  title,
  description,
  icon: Icon,
  items,
  type,
  searchPlaceholder = `Search ${title.toLowerCase()}...`,
  badges = []
}: ContentListPageProps<T>) {
  const [searchResults, setSearchResults] = useState<T[]>(items);
  const { filters, updateFilter, resetFilters, applyFilters } = useFilters();
  const { sortBy, sortDirection, updateSort, sortItems } = useSorting();

  const handleSearchResults = (results: T[]) => {
    setSearchResults(results);
  };

  const processedItems = sortItems(applyFilters(searchResults));

  // Extract unique values for filters
  const categories = [...new Set(items.map(item => item.category))].filter(Boolean);
  const tags = [...new Set(items.flatMap(item => item.tags || []))].filter(Boolean);
  const authors = [...new Set(items.map(item => item.author))].filter(Boolean);

  // Default badges if none provided
  const displayBadges = badges.length > 0 ? badges : [
    { icon: Sparkles, text: `${items.length} ${title} Available` },
    { text: 'Community Driven' },
    { text: 'Production Ready' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-primary/10 rounded-full">
                <Icon className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-foreground">
              {title}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {description}
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {displayBadges.map((badge, idx) => (
                <Badge key={idx} variant={idx === 0 ? "secondary" : "outline"}>
                  {badge.icon && <badge.icon className="h-3 w-3 mr-1" />}
                  {badge.text}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Search */}
          <SearchBar
            data={items}
            onFilteredResults={handleSearchResults}
            placeholder={searchPlaceholder}
          />

          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {processedItems.length} {processedItems.length === 1 ? 'item' : 'items'} found
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link to="/submit" className="flex items-center gap-2">
                  <ExternalLink className="h-3 w-3" />
                  Submit {title.slice(0, -1)}
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
          {processedItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedItems.map((item) => (
                <ConfigCard
                  key={item.id}
                  {...item}
                  type={type}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No {title.toLowerCase()} found</h3>
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
}