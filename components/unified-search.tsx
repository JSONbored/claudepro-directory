'use client';

import { ChevronDown, ChevronUp, Filter, Search } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export interface FilterState {
  category?: string;
  author?: string;
  dateRange?: string;
  popularity?: [number, number];
  tags?: string[];
  sort?: 'trending' | 'newest' | 'alphabetical';
}

interface UnifiedSearchProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onFiltersChange: (filters: FilterState) => void;
  filters: FilterState;
  availableTags?: string[];
  availableAuthors?: string[];
  availableCategories?: string[];
  resultCount?: number;
  className?: string;
}

export function UnifiedSearch({
  placeholder = 'Search...',
  onSearch,
  onFiltersChange,
  filters,
  availableTags = [],
  availableAuthors = [],
  availableCategories = [],
  resultCount = 0,
  className,
}: UnifiedSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Generate unique IDs
  const searchResultsId = useId();
  const filterPanelId = useId();
  const categorySelectId = useId();
  const authorSelectId = useId();
  const dateRangeSelectId = useId();

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localFilters.category) count++;
    if (localFilters.author) count++;
    if (localFilters.dateRange) count++;
    if (
      localFilters.popularity &&
      (localFilters.popularity[0] > 0 || localFilters.popularity[1] < 100)
    )
      count++;
    if (localFilters.tags && localFilters.tags.length > 0) count += localFilters.tags.length;
    return count;
  }, [localFilters]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
      setLocalFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Apply filters
  const applyFilters = useCallback(() => {
    onFiltersChange(localFilters);
    setIsFilterOpen(false);
  }, [localFilters, onFiltersChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters: FilterState = {
      sort: localFilters.sort || 'trending',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  }, [localFilters.sort, onFiltersChange]);

  // Toggle tag
  const toggleTag = useCallback((tag: string) => {
    setLocalFilters((prev) => {
      const currentTags = prev.tags || [];
      const newTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];
      return { ...prev, tags: newTags.length > 0 ? newTags : [] };
    });
  }, []);

  // Handle sort change directly
  const handleSortChange = useCallback(
    (value: FilterState['sort']) => {
      const newFilters = { ...localFilters, sort: value || 'trending' };
      setLocalFilters(newFilters);
      onFiltersChange(newFilters);
    },
    [localFilters, onFiltersChange]
  );

  return (
    <search className={cn('w-full space-y-4', className)}>
      {/* Search Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"
            aria-hidden="true"
          />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-4 h-12 text-base bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-card transition-smooth w-full"
            aria-label="Search configurations"
            aria-describedby={resultCount > 0 && searchQuery ? searchResultsId : undefined}
          />
        </div>

        {/* Sort and Filter Controls */}
        <div className="flex gap-2 justify-end">
          {/* Sort Dropdown styled as button */}
          <Select
            value={localFilters.sort || 'trending'}
            onValueChange={(value) => handleSortChange(value as FilterState['sort'])}
          >
            <SelectTrigger
              className="w-auto h-10 px-4 bg-background border-border hover:bg-accent/10 transition-smooth"
              aria-label="Sort configurations"
            >
              <span className="text-sm">Sort: </span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Button */}
          <Button
            variant="outline"
            size="default"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              'h-10 px-4 gap-2 transition-smooth',
              isFilterOpen && 'bg-accent/10 border-accent'
            )}
            aria-expanded={isFilterOpen}
            aria-controls={filterPanelId}
            aria-label={`${isFilterOpen ? 'Close' : 'Open'} filter panel${activeFilterCount > 0 ? ` (${activeFilterCount} active filters)` : ''}`}
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 px-1.5 py-0 h-5"
                aria-label={`${activeFilterCount} active filters`}
              >
                {activeFilterCount}
              </Badge>
            )}
            {isFilterOpen ? (
              <ChevronUp className="h-3 w-3 ml-1" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-1" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Result Count */}
      {resultCount > 0 && searchQuery && (
        <div className="text-sm text-muted-foreground" id={searchResultsId} aria-live="polite">
          {resultCount} {resultCount === 1 ? 'result' : 'results'} found
        </div>
      )}

      {/* Collapsible Filter Panel */}
      <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <CollapsibleContent>
          <section
            id={filterPanelId}
            className="bg-card/30 border border-border/50 rounded-lg p-4 md:p-6 space-y-4 md:space-y-6"
            aria-label="Filter options"
          >
            {/* Main Filters */}
            <fieldset className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <legend className="sr-only">Filter by category, author, and date range</legend>
              {/* Category Filter */}
              {availableCategories.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor={categorySelectId}>Category</Label>
                  <Select
                    value={localFilters.category || 'all'}
                    onValueChange={(value) =>
                      handleFilterChange('category', value === 'all' ? undefined : value)
                    }
                  >
                    <SelectTrigger
                      className="bg-background/50"
                      id={categorySelectId}
                      aria-label="Filter by category"
                    >
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Author Filter */}
              {availableAuthors.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor={authorSelectId}>Author</Label>
                  <Select
                    value={localFilters.author || 'all'}
                    onValueChange={(value) =>
                      handleFilterChange('author', value === 'all' ? undefined : value)
                    }
                  >
                    <SelectTrigger
                      className="bg-background/50"
                      id={authorSelectId}
                      aria-label="Filter by author"
                    >
                      <SelectValue placeholder="All Authors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Authors</SelectItem>
                      {availableAuthors.map((author) => (
                        <SelectItem key={author} value={author}>
                          {author}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date Range */}
              <div className="space-y-2">
                <Label htmlFor={dateRangeSelectId}>Date Range</Label>
                <Select
                  value={localFilters.dateRange || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange('dateRange', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger
                    className="bg-background/50"
                    id={dateRangeSelectId}
                    aria-label="Filter by date range"
                  >
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </fieldset>

            {/* Popularity Slider */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Popularity Range ({localFilters.popularity?.[0] || 0} -{' '}
                {localFilters.popularity?.[1] || 100})
              </legend>
              <div className="px-2 py-4">
                <Slider
                  value={localFilters.popularity || [0, 100]}
                  onValueChange={(value) =>
                    handleFilterChange('popularity', value as [number, number])
                  }
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                  aria-label="Set popularity range"
                  aria-valuetext={`Popularity range from ${localFilters.popularity?.[0] || 0} to ${localFilters.popularity?.[1] || 100}`}
                />
              </div>
            </fieldset>

            {/* Tags - Organized in Scrollable Area */}
            {availableTags.length > 0 && (
              <fieldset className="space-y-3">
                <div className="border-t border-border/50 pt-3" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Tags
                    </legend>
                    {localFilters.tags && localFilters.tags.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFilterChange('tags', undefined)}
                        aria-label={`Clear all selected tags (${localFilters.tags.length} selected)`}
                      >
                        Clear Tags ({localFilters.tags.length})
                      </Button>
                    )}
                  </div>
                  <ScrollArea
                    className="h-40 md:h-48 w-full rounded-md border border-border/50 p-4"
                    aria-label="Select tags to filter by"
                  >
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={localFilters.tags?.includes(tag) ? 'default' : 'outline'}
                          className="cursor-pointer transition-all duration-200 hover:bg-accent/10"
                          onClick={() => toggleTag(tag)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleTag(tag);
                            }
                          }}
                          aria-pressed={localFilters.tags?.includes(tag)}
                          aria-label={`${localFilters.tags?.includes(tag) ? 'Remove' : 'Add'} ${tag} tag filter`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </fieldset>
            )}

            {/* Action Buttons */}
            <fieldset className="flex justify-between items-center border-t border-border/50 pt-6">
              <legend className="sr-only">Filter actions</legend>
              <Button
                variant="ghost"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
                aria-label={`Clear all ${activeFilterCount} active filters`}
              >
                Clear All Filters
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsFilterOpen(false)}
                  aria-label="Cancel filter changes and close panel"
                >
                  Cancel
                </Button>
                <Button
                  onClick={applyFilters}
                  aria-label={`Apply ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''}`}
                >
                  Apply Filters
                </Button>
              </div>
            </fieldset>
          </section>
        </CollapsibleContent>
      </Collapsible>
    </search>
  );
}
