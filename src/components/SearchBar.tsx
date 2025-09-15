import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';
import Fuse from 'fuse.js';
import { ClaudeRule } from '@/data/rules';
import { MCPServer } from '@/data/mcp';

interface SearchBarProps {
  data: (ClaudeRule | MCPServer)[];
  onFilteredResults: (results: (ClaudeRule | MCPServer)[]) => void;
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
  'other'
];

const fuseOptions = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'description', weight: 0.3 },
    { name: 'tags', weight: 0.2 },
    { name: 'category', weight: 0.1 }
  ],
  threshold: 0.3,
  includeScore: true,
};

export const SearchBar = ({ data, onFilteredResults, placeholder = "Search configs..." }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const fuse = useMemo(() => new Fuse(data, fuseOptions), [data]);

  const filteredResults = useMemo(() => {
    let results = data;

    // Apply search query
    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery);
      results = searchResults.map(result => result.item);
    }

    // Apply category filters
    if (selectedCategories.length > 0) {
      results = results.filter(item => selectedCategories.includes(item.category));
    }

    return results.sort((a, b) => b.popularity - a.popularity);
  }, [data, fuse, searchQuery, selectedCategories]);

  useEffect(() => {
    onFilteredResults(filteredResults);
  }, [filteredResults, onFilteredResults]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setShowFilters(false);
  };

  const hasActiveFilters = searchQuery.trim() || selectedCategories.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-20 h-12 text-base bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-smooth"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-8 px-2 ${selectedCategories.length > 0 ? 'text-primary' : ''}`}
          >
            <Filter className="h-3 w-3 mr-1" />
            Filter
            {selectedCategories.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
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
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Category Filters */}
      {showFilters && (
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 animate-slide-up">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategories.includes(category) ? "default" : "outline"}
                className="cursor-pointer transition-smooth hover:scale-105"
                onClick={() => handleCategoryToggle(category)}
              >
                {category.replace('-', ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredResults.length} config{filteredResults.length !== 1 ? 's' : ''} found
        {hasActiveFilters && (
          <span className="ml-2">
            • <button onClick={clearFilters} className="text-primary hover:underline">Clear filters</button>
          </span>
        )}
      </div>
    </div>
  );
};