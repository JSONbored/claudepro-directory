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

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { SearchFilterPanel } from '@/src/components/features/search/search-filter-panel';
import { ErrorBoundary } from '@/src/components/infra/error-boundary';
import { Button } from '@/src/components/primitives/button';
import { Collapsible, CollapsibleContent } from '@/src/components/primitives/collapsible';
import { Input } from '@/src/components/primitives/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/primitives/select';
import { useUnifiedSearch } from '@/src/hooks/use-unified-search';
import { ChevronDown, ChevronUp, Filter, Search } from '@/src/lib/icons';
import type { FilterState, UnifiedSearchProps } from '@/src/lib/schemas/component.schema';
import { sanitizers } from '@/src/lib/security/validators-sync';

import { cn } from '@/src/lib/utils';

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
  showFilters = true,
}: UnifiedSearchProps & { showFilters?: boolean }) {
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const pathname = usePathname();

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

  // Debounced search with sanitization and analytics tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      // Use sync version for client-side sanitization
      const sanitized = sanitizers.sanitizeSearchQuerySync(localSearchQuery);
      onSearch(sanitized);

      // Track search event with context-specific analytics (only for non-empty queries)
      if (sanitized && sanitized.length > 0) {
        const category = pathname?.split('/')[1] || 'global';

        // Dynamic imports to avoid server-only module issues in Storybook
        Promise.all([import('#lib/analytics/event-mapper'), import('#lib/analytics/tracker')])
          .then(([{ getSearchEvent }, { trackEvent }]) => {
            const eventName = getSearchEvent(category);
            trackEvent(eventName, {
              query: sanitized.substring(0, 100), // Truncate for privacy
              results_count: resultCount,
              filters_applied: activeFilterCount > 0,
              time_to_results: 0, // Could add performance timing if needed
            });
          })
          .catch(() => {
            // Silent fail in Storybook - analytics not critical for component rendering
          });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, onSearch, resultCount, pathname, activeFilterCount]);

  // Update ARIA live announcement for all search result scenarios
  useEffect(() => {
    if (!localSearchQuery) {
      // Search cleared
      setAnnouncement('Search cleared. Showing all results.');
    } else if (resultCount === 0) {
      // No results found
      setAnnouncement(`No results found for "${localSearchQuery}".`);
    } else if (resultCount === 1) {
      // Single result
      setAnnouncement(`1 result found for "${localSearchQuery}".`);
    } else {
      // Multiple results
      setAnnouncement(`${resultCount} results found for "${localSearchQuery}".`);
    }
  }, [localSearchQuery, resultCount]);

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
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <Search className="h-5 w-5 text-accent" aria-hidden="true" />
            </div>
            <Input
              id={searchInputId}
              name="search"
              type="search"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder={placeholder}
              className={
                'pl-12 pr-4 h-14 text-base bg-card/50 backdrop-blur-sm border-border/50 focus:border-accent/50 focus:bg-card transition-smooth w-full'
              }
              aria-label="Search configurations"
              aria-describedby={resultCount > 0 && localSearchQuery ? searchResultsId : undefined}
              autoComplete="off"
            />
          </div>

          {/* Sort and Filter Controls */}
          {showFilters && (
            <div className={'flex gap-2 justify-end'}>
              {/* Sort Dropdown styled as button */}
              <Select
                value={filters.sort || 'trending'}
                onValueChange={(value) => handleSortChange(value as FilterState['sort'])}
                name="sort"
              >
                <SelectTrigger
                  id={sortSelectId}
                  className={
                    'w-auto h-10 px-4 bg-background border-border hover:bg-accent/10 transition-smooth'
                  }
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
                  <UnifiedBadge
                    variant="base"
                    style="secondary"
                    className="ml-1 px-1.5 py-0 h-5"
                    aria-label={`${activeFilterCount} active filters`}
                  >
                    {activeFilterCount}
                  </UnifiedBadge>
                )}
                {isFilterOpen ? (
                  <ChevronUp className="h-3 w-3 ml-1" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" aria-hidden="true" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Comprehensive ARIA live announcements for all search scenarios */}
        <div
          className={'text-sm text-muted-foreground'}
          id={searchResultsId}
          aria-live="polite"
          aria-atomic="true"
        >
          {announcement && <span className="sr-only">{announcement}</span>}
          {/* Visual display (different from screen reader announcement) */}
          {localSearchQuery && resultCount > 0 && (
            <span aria-hidden="true">
              {resultCount} {resultCount === 1 ? 'result' : 'results'} found
            </span>
          )}
          {localSearchQuery && resultCount === 0 && (
            <span aria-hidden="true">No results found</span>
          )}
        </div>

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
