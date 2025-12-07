'use client';

/**
 * Unified Search Component - Database-First Architecture
 * Search UI with filters. Analytics tracked via server action.
 */

import { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { usePulse, useUnifiedSearch } from '@heyclaude/web-runtime/hooks';
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  Search,
  X,
} from '@heyclaude/web-runtime/icons';
import {
  type FilterState,
  type UnifiedSearchProps,
} from '@heyclaude/web-runtime/types/component.types';
import {
  cn,
  POSITION_PATTERNS,
  UI_CLASSES,
  UnifiedBadge,
  ErrorBoundary,
  Button,
  Collapsible,
  CollapsibleContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@heyclaude/web-runtime/ui';
import { usePathname } from 'next/navigation';
import { memo, useCallback, useEffect, useId, useState } from 'react';

import { SearchFilterPanel } from '@/src/components/features/search/search-filter-panel';

// Use enum values directly from @heyclaude/database-types Constants
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

function isValidContentCategory(
  value: null | string | undefined
): value is Database['public']['Enums']['content_category'] {
  return (
    typeof value === 'string' &&
    CONTENT_CATEGORY_VALUES.includes(value as Database['public']['Enums']['content_category'])
  );
}

function getCategoryFromPathname(
  pathname: null | string | undefined
): Database['public']['Enums']['content_category'] | null {
  if (!pathname) return null;
  const category = pathname.split('/')[1];
  return isValidContentCategory(category) ? category : null;
}

const SearchErrorFallback = () => (
  <div className="text-muted-foreground p-4 text-center">Error loading search</div>
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
  savedSearches = [],
  onSelectSavedSearch,
  onRemoveSavedSearch,
  onSavePresetRequest,
  isPresetSaveDisabled = false,
}: UnifiedSearchProps & { showFilters?: boolean }) {
  const pulse = usePulse();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Wait for client-side mount to prevent Radix UI ID hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    filters,
    isFilterOpen,
    activeFilterCount,
    handleFiltersChange,
    handleFilterChange,
    toggleTag,
    clearFilters: originalClearFilters,
    setIsFilterOpen,
  } = useUnifiedSearch({
    initialSort: initialFilters?.sort || 'trending',
    ...(onFiltersChange && { onFiltersChange }),
  });

  // Wrap clearFilters to track filter clearing
  const clearFilters = useCallback(() => {
    originalClearFilters();

    // Track filter clearing
    const category = getCategoryFromPathname(pathname);
    pulse
      .filter({
        category,
        filters: {},
        metadata: {
          filterType: 'clear',
          filterCount: 0,
        },
      })
      .catch((error) => {
        logUnhandledPromise('UnifiedSearchComponent: filter clear tracking failed', error, {
          category: category ?? 'null',
        });
      });
  }, [originalClearFilters, pathname, pulse]);

  const searchInputId = useId();
  const searchResultsId = useId();
  const filterPanelId = useId();
  const sortSelectId = useId();
  const presetSectionLabelId = useId();

  const [debounceMs, setDebounceMs] = useState(150);

  const presetsDefined = Array.isArray(savedSearches);
  const savedSearchPresets = presetsDefined ? savedSearches : [];
  const presetsLoading = !presetsDefined;
  const hasSavedSearches = savedSearchPresets.length > 0;
  const showPresetRail = hasSavedSearches || Boolean(onSavePresetRequest);
  const canSelectSavedSearches = typeof onSelectSavedSearch === 'function';
  const canRemoveSavedSearches = typeof onRemoveSavedSearch === 'function';
  const savePresetButtonDisabled = Boolean(isPresetSaveDisabled);

  const handlePresetSelect = useCallback(
    (presetId: string) => {
      if (!canSelectSavedSearches) return;
      const target = savedSearchPresets.find((preset) => preset.id === presetId);
      if (target) {
        setLocalSearchQuery(target.query);
        const trimmed = target.query?.trim();
        if (trimmed && trimmed.length > 0) {
          setAnnouncement(`Saved search "${target.label}" applied.`);
        } else {
          setAnnouncement(`Saved filters "${target.label}" applied.`);
        }
      }
      onSelectSavedSearch?.(presetId);
    },
    [canSelectSavedSearches, onSelectSavedSearch, savedSearchPresets]
  );

  const handlePresetRemove = useCallback(
    (presetId: string) => {
      if (!canRemoveSavedSearches) return;
      onRemoveSavedSearch?.(presetId);
    },
    [canRemoveSavedSearches, onRemoveSavedSearch]
  );

  useEffect(() => {
    // Increase debounce from 150ms to 400ms for better performance
    // This reduces API calls while still feeling responsive
    setDebounceMs(400); // Override config with optimized value
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
        const category = getCategoryFromPathname(pathname);

        pulse
          .click({
            category,
            slug: `search:${sanitized}`,
            metadata: {
              resultsCount: resultCount,
              filtersApplied: activeFilterCount > 0,
            },
          })
          .catch((error) => {
            logUnhandledPromise('UnifiedSearchComponent: search tracking failed', error, {
              query: sanitized,
              category: category ?? 'null',
              resultCount,
              activeFilterCount,
            });
          });
      }
    }, 500);

    return () => clearTimeout(analyticsTimer);
  }, [localSearchQuery, resultCount, pathname, activeFilterCount, pulse]);

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

    // Track filter application
    if (activeFilterCount > 0) {
      const category = getCategoryFromPathname(pathname);
      pulse
        .filter({
          category,
          filters: {
            ...(filters.category && { category: filters.category }),
            ...(filters.tags && filters.tags.length > 0 && { tags: filters.tags }),
            ...(filters.author && { author: filters.author }),
            ...(filters.sort && { sort: filters.sort }),
            ...(filters.dateRange && { dateRange: filters.dateRange }),
            ...(filters.popularity && { popularity: filters.popularity }),
          },
          metadata: {
            filterCount: activeFilterCount,
          },
        })
        .catch((error) => {
          logUnhandledPromise('UnifiedSearchComponent: filter tracking failed', error, {
            category: category ?? 'null',
            filterCount: activeFilterCount,
          });
        });
    }
  }, [filters, handleFiltersChange, setIsFilterOpen, activeFilterCount, pathname, pulse]);

  const handleSortChange = useCallback(
    (value: FilterState['sort']) => {
      const newFilters = {
        ...filters,
        sort: value || ('trending' as Database['public']['Enums']['sort_option']),
      };
      handleFiltersChange(newFilters);

      // Track sort filter change
      const category = getCategoryFromPathname(pathname);
      pulse
        .filter({
          category,
          filters: {
            sort: value || ('trending' as Database['public']['Enums']['sort_option']),
          },
          metadata: {
            filterType: 'sort',
          },
        })
        .catch((error) => {
          logUnhandledPromise('UnifiedSearchComponent: sort filter tracking failed', error, {
            category: category ?? 'null',
            sort: value,
          });
        });
    },
    [filters, handleFiltersChange, pathname, pulse]
  );

  // Don't render Radix UI components until mounted to prevent ID hydration mismatch
  if (!isMounted) {
    return (
      <ErrorBoundary fallback={SearchErrorFallback}>
        <search className={cn('w-full space-y-4', className)}>
          <div className="space-y-3">
            <div className="relative">
              <div
                className={`pointer-events-none -translate-y-1/2 ${POSITION_PATTERNS.ABSOLUTE_TOP_HALF} left-4 z-10`}
              >
                <Search className={`${UI_CLASSES.ICON_MD} text-accent`} aria-hidden="true" />
              </div>
              <input
                type="search"
                name="search"
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="border-border/50 bg-card/50 transition-smooth focus:border-accent/50 focus:bg-card h-14 w-full rounded-md border px-3 py-2 pr-4 pl-12 text-base backdrop-blur-sm"
                aria-label="Search configurations"
                autoComplete="off"
                disabled
              />
            </div>
          </div>
        </search>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary fallback={SearchErrorFallback}>
      <search className={cn('w-full space-y-4', className)}>
        <div className="space-y-3">
          <div className="relative">
            <div
              className={`pointer-events-none -translate-y-1/2 ${POSITION_PATTERNS.ABSOLUTE_TOP_HALF} left-4 z-10`}
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
              className="border-border/50 bg-card/50 transition-smooth focus:border-accent/50 focus:bg-card h-14 w-full pr-4 pl-12 text-base backdrop-blur-sm"
              aria-label="Search configurations"
              aria-describedby={resultCount > 0 && localSearchQuery ? searchResultsId : undefined}
              autoComplete="off"
            />
          </div>

          {showPresetRail ? (
            <section
              aria-labelledby={presetSectionLabelId}
              className="border-border/60 bg-card/40 rounded-lg border p-3"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p
                  id={presetSectionLabelId}
                  className="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
                >
                  Saved searches
                </p>
                {onSavePresetRequest ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={onSavePresetRequest}
                    disabled={savePresetButtonDisabled}
                    className="gap-2 text-xs sm:text-sm"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Save current filters</span>
                  </Button>
                ) : null}
              </div>
              {hasSavedSearches ? (
                <ul className="flex flex-wrap gap-2" aria-live="polite">
                  {savedSearchPresets.map((preset) => (
                    <li
                      key={preset.id}
                      className="border-border/60 bg-background/80 flex items-center gap-1 rounded-full border px-2 py-1"
                    >
                      <button
                        type="button"
                        onClick={() => handlePresetSelect(preset.id)}
                        disabled={!canSelectSavedSearches}
                        className={cn(
                          'transition-smooth focus-visible:ring-accent/60 flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none sm:text-sm',
                          canSelectSavedSearches
                            ? 'text-foreground hover:bg-accent/10'
                            : 'text-muted-foreground cursor-not-allowed opacity-70'
                        )}
                        title={
                          preset.query
                            ? `${preset.label} • ${preset.query.slice(0, 80)}`
                            : preset.label
                        }
                        aria-label={`Apply preset ${preset.label}`}
                      >
                        <Bookmark className="text-accent h-3.5 w-3.5" aria-hidden="true" />
                        <span className="max-w-32 truncate">{preset.label}</span>
                      </button>
                      {canRemoveSavedSearches ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handlePresetRemove(preset.id);
                          }}
                          className="text-muted-foreground hover:text-foreground focus-visible:ring-accent/60 rounded-full p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                          aria-label={`Remove preset ${preset.label}`}
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : presetsLoading ? (
                <p className="text-muted-foreground text-sm">Loading saved searches…</p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No saved searches yet. Use “Save current filters” to store your favorite combos.
                </p>
              )}
            </section>
          ) : null}

          {showFilters ? (
            <div className="flex justify-end gap-2">
              <Select
                value={filters.sort || 'trending'}
                onValueChange={(value) => handleSortChange(value as FilterState['sort'])}
                name="sort"
              >
                <SelectTrigger
                  id={sortSelectId}
                  className="border-border bg-background transition-smooth hover:bg-accent/10 h-10 w-auto px-4"
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
                  'transition-smooth h-10 gap-2 px-4',
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
          ) : null}
        </div>

        <div
          className="text-muted-foreground text-sm"
          id={searchResultsId}
          aria-live="polite"
          aria-atomic="true"
        >
          {announcement ? <span className="sr-only">{announcement}</span> : null}
          {localSearchQuery && resultCount > 0 ? (
            <span aria-hidden="true">
              {resultCount} {resultCount === 1 ? 'result' : 'results'} found
            </span>
          ) : null}
          {localSearchQuery && resultCount === 0 ? (
            <span aria-hidden="true">No results found</span>
          ) : null}
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
                showActions
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
    JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters) &&
    JSON.stringify(prevProps.savedSearches) === JSON.stringify(nextProps.savedSearches) &&
    prevProps.isPresetSaveDisabled === nextProps.isPresetSaveDisabled &&
    prevProps.onSavePresetRequest === nextProps.onSavePresetRequest &&
    prevProps.onSelectSavedSearch === nextProps.onSelectSavedSearch &&
    prevProps.onRemoveSavedSearch === nextProps.onRemoveSavedSearch
  );
});

UnifiedSearch.displayName = 'UnifiedSearch';

export { type FilterState } from '@heyclaude/web-runtime/types/component.types';
