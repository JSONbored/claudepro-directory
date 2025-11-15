'use client';

/**
 * Unified Search Component - Database-First Architecture
 * Search UI with filters. Analytics tracked via server action.
 */

import { usePathname } from 'next/navigation';
import { memo, useCallback, useEffect, useId, useState } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { ErrorBoundary } from '@/src/components/core/infra/error-boundary';
import { SearchFilterPanel } from '@/src/components/features/search/search-filter-panel';
import { Button } from '@/src/components/primitives/ui/button';
import { Collapsible, CollapsibleContent } from '@/src/components/primitives/ui/collapsible';
import { Input } from '@/src/components/primitives/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/primitives/ui/select';
import { useUnifiedSearch } from '@/src/hooks/use-unified-search';
import { getTimeoutConfig } from '@/src/lib/actions/feature-flags.actions';
import { ChevronDown, ChevronUp, Filter, Search } from '@/src/lib/icons';
import type { FilterState, UnifiedSearchProps } from '@/src/lib/types/component.types';
import { POSITION_PATTERNS, UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { logClientWarning, logUnhandledPromise } from '@/src/lib/utils/error.utils';

export type { FilterState };

const SearchErrorFallback = () => (
  <div className="p-4 text-center text-muted-foreground">Error loading search</div>
);

function UnifiedSearchComponent({
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
    ...(onFiltersChange && { onFiltersChange }),
  });

  const searchInputId = useId();
  const searchResultsId = useId();
  const filterPanelId = useId();
  const sortSelectId = useId();

  const [debounceMs, setDebounceMs] = useState(150);

  useEffect(() => {
    getTimeoutConfig()
      .then((config) => {
        setDebounceMs((config['timeout.ui.debounce_ms'] as number) ?? 150);
      })
      .catch((error) => {
        logClientWarning('UnifiedSearchComponent: failed to load debounce config', error);
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const sanitized = localSearchQuery.trim().slice(0, 100);
      onSearch?.(sanitized);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localSearchQuery, onSearch, debounceMs]);

  useEffect(() => {
    if (!localSearchQuery || localSearchQuery.length === 0) {
      return;
    }

    const analyticsTimer = setTimeout(() => {
      const sanitized = localSearchQuery.trim().slice(0, 100);
      if (sanitized && sanitized.length > 0) {
        const category = pathname?.split('/')[1] || 'global';

        import('@/src/lib/edge/client')
          .then((module) =>
            module.trackInteraction({
              interaction_type: 'click',
              content_type: category,
              content_slug: `search:${sanitized}`,
              metadata: {
                resultsCount: resultCount,
                filtersApplied: activeFilterCount > 0,
              },
            })
          )
          .catch((error) => {
            logUnhandledPromise('UnifiedSearchComponent: search tracking failed', error, {
              query: sanitized,
              category,
              resultCount,
              activeFilterCount,
            });
          });
      }
    }, 500);

    return () => clearTimeout(analyticsTimer);
  }, [localSearchQuery, resultCount, pathname, activeFilterCount]);

  useEffect(() => {
    if (!localSearchQuery) {
      setAnnouncement('Search cleared. Showing all results.');
    } else if (resultCount === 0) {
      setAnnouncement(`No results found for "${localSearchQuery}".`);
    } else if (resultCount === 1) {
      setAnnouncement(`1 result found for "${localSearchQuery}".`);
    } else {
      setAnnouncement(`${resultCount} results found for "${localSearchQuery}".`);
    }
  }, [localSearchQuery, resultCount]);

  const applyFilters = useCallback(() => {
    handleFiltersChange(filters);
    setIsFilterOpen(false);
  }, [filters, handleFiltersChange, setIsFilterOpen]);

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
        <div className="space-y-3">
          <div className="relative">
            <div
              className={`-translate-y-1/2 pointer-events-none ${POSITION_PATTERNS.ABSOLUTE_TOP_HALF} left-4 z-10`}
            >
              <Search className={`${UI_CLASSES.ICON_MD} text-accent`} aria-hidden="true" />
            </div>
            <Input
              id={searchInputId}
              name="search"
              type="search"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder={placeholder}
              className={
                'h-14 w-full border-border/50 bg-card/50 pr-4 pl-12 text-base backdrop-blur-sm transition-smooth focus:border-accent/50 focus:bg-card'
              }
              aria-label="Search configurations"
              aria-describedby={resultCount > 0 && localSearchQuery ? searchResultsId : undefined}
              autoComplete="off"
            />
          </div>

          {showFilters && (
            <div className={'flex justify-end gap-2'}>
              <Select
                value={filters.sort || 'trending'}
                onValueChange={(value) => handleSortChange(value as FilterState['sort'])}
                name="sort"
              >
                <SelectTrigger
                  id={sortSelectId}
                  className={
                    'h-10 w-auto border-border bg-background px-4 transition-smooth hover:bg-accent/10'
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

              <Button
                variant="outline"
                size="default"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  'h-10 gap-2 px-4 transition-smooth',
                  isFilterOpen && 'border-accent bg-accent/10'
                )}
                aria-expanded={isFilterOpen}
                aria-controls={filterPanelId}
                aria-label={`${isFilterOpen ? 'Close' : 'Open'} filter panel${activeFilterCount > 0 ? ` (${activeFilterCount} active filters)` : ''}`}
              >
                <Filter className={UI_CLASSES.ICON_SM} aria-hidden="true" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <UnifiedBadge
                    variant="base"
                    style="secondary"
                    className="ml-1 h-5 px-1.5 py-0"
                    aria-label={`${activeFilterCount} active filters`}
                  >
                    {activeFilterCount}
                  </UnifiedBadge>
                )}
                {isFilterOpen ? (
                  <ChevronUp className="ml-1 h-3 w-3" aria-hidden="true" />
                ) : (
                  <ChevronDown className="ml-1 h-3 w-3" aria-hidden="true" />
                )}
              </Button>
            </div>
          )}
        </div>

        <div
          className={'text-muted-foreground text-sm'}
          id={searchResultsId}
          aria-live="polite"
          aria-atomic="true"
        >
          {announcement && <span className="sr-only">{announcement}</span>}
          {localSearchQuery && resultCount > 0 && (
            <span aria-hidden="true">
              {resultCount} {resultCount === 1 ? 'result' : 'results'} found
            </span>
          )}
          {localSearchQuery && resultCount === 0 && (
            <span aria-hidden="true">No results found</span>
          )}
        </div>

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

export const UnifiedSearch = memo(UnifiedSearchComponent, (prevProps, nextProps) => {
  return (
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.resultCount === nextProps.resultCount &&
    prevProps.className === nextProps.className &&
    prevProps.showFilters === nextProps.showFilters &&
    JSON.stringify(prevProps.availableTags) === JSON.stringify(nextProps.availableTags) &&
    JSON.stringify(prevProps.availableAuthors) === JSON.stringify(nextProps.availableAuthors) &&
    JSON.stringify(prevProps.availableCategories) ===
      JSON.stringify(nextProps.availableCategories) &&
    JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters)
  );
});

UnifiedSearch.displayName = 'UnifiedSearch';
