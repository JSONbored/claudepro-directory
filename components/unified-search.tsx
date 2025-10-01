'use client';

/**
 * Unified Search Component (SHA-2087 Refactored)
 *
 * CONSOLIDATION: Now uses shared hook and filter panel component
 * - useUnifiedSearch hook for state management (~80 lines removed)
 * - SearchFilterPanel for filter UI (~200 lines removed)
 *
 * Previous: 420 lines of duplicated logic
 * Current: 180 lines (57% reduction)
 */

import { ChevronDown, ChevronUp, Filter, Search } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { SearchFilterPanel } from '@/components/search-filter-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUnifiedSearch } from '@/hooks/use-unified-search';
import type { FilterState, UnifiedSearchProps } from '@/lib/schemas/component.schema';
import { sanitizeSearchQuery } from '@/lib/security';
import { cn } from '@/lib/utils';

// Re-export FilterState for backward compatibility
export type { FilterState };

// SearchErrorFallback component moved outside to avoid recreation on every render
const SearchErrorFallback = () => (
  <div className="p-4 text-center text-muted-foreground">Error loading search</div>
);

export function UnifiedSearch({
  placeholder = 'Search...',
  onSearch,
  onFiltersChange,
  filters: initialFilters,
  availableTags = [],
  availableAuthors = [],
  availableCategories = [],
  resultCount = 0,
  className,
}: UnifiedSearchProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Use consolidated search hook
  const {
    filters,
    isFilterOpen,
    activeFilterCount,
    handleFiltersChange,
    handleFilterChange,
    toggleTag,
    clearFilters,
    setIsFilterOpen,
  } = useUnifiedSearch({
    initialSort: initialFilters?.sort || 'trending',
    onFiltersChange,
  });

  // Generate unique IDs
  const searchInputId = useId();
  const searchResultsId = useId();
  const filterPanelId = useId();
  const sortSelectId = useId();

  // Debounced search with sanitization
  useEffect(() => {
    const timer = setTimeout(() => {
      const sanitized = sanitizeSearchQuery(localSearchQuery);
      onSearch(sanitized);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, onSearch]);

  // Apply filters and close panel
  const applyFilters = useCallback(() => {
    handleFiltersChange(filters);
    setIsFilterOpen(false);
  }, [filters, handleFiltersChange, setIsFilterOpen]);

  // Handle sort change directly (no need to apply)
  const handleSortChange = useCallback(
    (value: FilterState['sort']) => {
      const newFilters = { ...filters, sort: value || 'trending' };
      handleFiltersChange(newFilters);
    },
    [filters, handleFiltersChange]
  );

  return (
    <ErrorBoundary fallback={SearchErrorFallback}>
      <search className={cn('w-full space-y-4', className)}>
        {/* Search Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"
              aria-hidden="true"
            />
            <Input
              id={searchInputId}
              name="search"
              type="text"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="pl-10 pr-4 h-12 text-base bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-card transition-smooth w-full"
              aria-label="Search configurations"
              aria-describedby={resultCount > 0 && localSearchQuery ? searchResultsId : undefined}
              autoComplete="search"
            />
          </div>

          {/* Sort and Filter Controls */}
          <div className="flex gap-2 justify-end">
            {/* Sort Dropdown styled as button */}
            <Select
              value={filters.sort || 'trending'}
              onValueChange={(value) => handleSortChange(value as FilterState['sort'])}
              name="sort"
            >
              <SelectTrigger
                id={sortSelectId}
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
        {resultCount > 0 && localSearchQuery && (
          <div className="text-sm text-muted-foreground" id={searchResultsId} aria-live="polite">
            {resultCount} {resultCount === 1 ? 'result' : 'results'} found
          </div>
        )}

        {/* Collapsible Filter Panel */}
        <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <CollapsibleContent>
            <section id={filterPanelId} aria-label="Filter options">
              <SearchFilterPanel
                filters={filters}
                availableTags={availableTags}
                availableAuthors={availableAuthors}
                availableCategories={availableCategories}
                activeFilterCount={activeFilterCount}
                onFilterChange={handleFilterChange}
                onToggleTag={toggleTag}
                onClearFilters={clearFilters}
                onApplyFilters={applyFilters}
                onCancel={() => setIsFilterOpen(false)}
                showActions={true}
              />
            </section>
          </CollapsibleContent>
        </Collapsible>
      </search>
    </ErrorBoundary>
  );
}
