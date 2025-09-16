import Fuse from 'fuse.js';
import { Filter, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchableItem {
  title?: string;
  name?: string;
  description: string;
  tags: string[];
  category: string;
  popularity: number;
}

interface SearchBarProps<T extends SearchableItem = SearchableItem> {
  data: T[];
  onFilteredResults: (results: T[]) => void;
  onSearchQueryChange?: (query: string) => void;
  placeholder?: string;
}

const categories = [
  'development',
  'writing',
  'analysis',
  'creative',
  'business',
  'database',
  'api',
  'file-system',
  'ai',
  'productivity',
  'automation',
  'other',
];

const fuseOptions = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'name', weight: 0.4 },
    { name: 'description', weight: 0.3 },
    { name: 'tags', weight: 0.2 },
    { name: 'category', weight: 0.1 },
  ],
  threshold: 0.3,
  includeScore: true,
};

export const SearchBar = <T extends SearchableItem = SearchableItem>({
  data,
  onFilteredResults,
  onSearchQueryChange,
  placeholder = 'Search...',
}: SearchBarProps<T>) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const fuse = useMemo(() => new Fuse(data, fuseOptions), [data]);

  const filteredResults = useMemo(() => {
    let results = data;

    // Apply search query
    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery);
      results = searchResults.map((result) => result.item);
    }

    // Apply category filters
    if (selectedCategories.length > 0) {
      results = results.filter((item) => selectedCategories.includes(item.category));
    }

    return results.sort((a, b) => b.popularity - a.popularity);
  }, [data, fuse, searchQuery, selectedCategories]);

  useEffect(() => {
    onFilteredResults(filteredResults);
  }, [filteredResults, onFilteredResults]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setShowFilters(false);
    onSearchQueryChange?.('');
  };

  const hasActiveFilters = searchQuery.trim() || selectedCategories.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"
          aria-hidden="true"
        />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onSearchQueryChange?.(e.target.value);
          }}
          className="pl-10 pr-20 h-12 text-base bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-card transition-smooth"
          aria-label="Search configurations"
          role="searchbox"
          aria-describedby="search-results-count"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-8 px-2 transition-smooth hover:bg-primary/10 hover:text-primary ${selectedCategories.length > 0 ? 'text-primary bg-primary/10' : ''}`}
            aria-label={`${showFilters ? 'Hide' : 'Show'} category filters`}
            aria-expanded={showFilters}
            aria-controls="category-filters"
          >
            <Filter className="h-3 w-3 mr-1" aria-hidden="true" />
            Filter
            {selectedCategories.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-4 w-4 p-0 text-xs"
                aria-label={`${selectedCategories.length} filters active`}
              >
                {selectedCategories.length}
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 w-8 p-0"
              aria-label="Clear all filters"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* Category Filters */}
      {showFilters && (
        <div
          id="category-filters"
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 animate-slide-up"
          role="group"
          aria-label="Category filters"
        >
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                className={`cursor-pointer transition-smooth hover:scale-105 ${
                  selectedCategories.includes(category)
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary'
                    : 'border-border/50 hover:border-primary/30 hover:bg-primary/5 hover:text-primary'
                }`}
                onClick={() => handleCategoryToggle(category)}
                role="button"
                tabIndex={0}
                aria-pressed={selectedCategories.includes(category)}
                aria-label={`${selectedCategories.includes(category) ? 'Remove' : 'Add'} ${category.replace('-', ' ')} filter`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCategoryToggle(category);
                  }
                }}
              >
                {category.replace('-', ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Results Count */}
      <div id="search-results-count" className="text-sm text-muted-foreground" aria-live="polite">
        {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} found
        {hasActiveFilters && (
          <span className="ml-2">
            •{' '}
            <button
              onClick={clearFilters}
              className="text-primary hover:underline"
              aria-label="Clear all active filters"
            >
              Clear filters
            </button>
          </span>
        )}
      </div>
    </div>
  );
};
