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
  Filter,
  Plus,
  Search,
  X,
} from '@heyclaude/web-runtime/icons';
import {
  type UnifiedSearchProps,
} from '@heyclaude/web-runtime/types/component.types';
import {
  cn,
  POSITION_PATTERNS,
  UI_CLASSES,
  ErrorBoundary,
  Button,
  Collapsible,
  CollapsibleContent,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';

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

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

      const timer = setTimeout(() => {
        const sanitized = localSearchQuery.trim().slice(0, 100);
        // Only call onSearch if query has content - prevents clearing results on empty input
        // Note: onSearch doesn't accept AbortSignal, but AbortController still cancels
        // the promise chain in the parent component
        if (sanitized && sanitized.length > 0) {
          onSearch?.(sanitized);
        }
      }, debounceMs);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
            {/* Search icon on left */}
            <div
              className={`pointer-events-none -translate-y-1/2 ${POSITION_PATTERNS.ABSOLUTE_TOP_HALF} left-4 z-10`}
            >
              <Search className={`${UI_CLASSES.ICON_MD} text-accent`} aria-hidden="true" />
            </div>

            {/* Sort and Filter controls on right (inside search bar) - Icon-only with tooltips */}
            {showFilters ? (
              <TooltipProvider>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 pointer-events-auto">
                  {/* Filter Control - Premium design with state variants */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        className="h-8 w-8 rounded-md flex items-center justify-center relative group"
                        variants={{
                          inactive: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                          },
                          active: {
                            backgroundColor: 'rgba(249, 115, 22, 0.15)',
                            borderColor: 'rgba(249, 115, 22, 0.4)',
                            boxShadow: '0 0 0 1px rgba(249, 115, 22, 0.2)',
                          },
                        }}
                        animate={isFilterOpen || activeFilterCount > 0 ? 'active' : 'inactive'}
                        whileHover={{
                          scale: 1.05,
                          backgroundColor: isFilterOpen || activeFilterCount > 0
                            ? 'rgba(249, 115, 22, 0.2)'
                            : 'rgba(255, 255, 255, 0.08)',
                        }}
                        whileTap={{ scale: 0.95 }}
                        whileFocus={{
                          boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.3)',
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFilterOpen(!isFilterOpen);
                        }}
                        aria-expanded={isFilterOpen}
                        aria-controls={filterPanelId}
                        aria-label={`${isFilterOpen ? 'Close' : 'Open'} filter panel${activeFilterCount > 0 ? ` (${activeFilterCount} active filters)` : ''}`}
                      >
                        <Filter
                          className={cn(
                            'h-4 w-4 transition-colors',
                            isFilterOpen || activeFilterCount > 0
                              ? 'text-[rgb(249,115,22)]'
                              : 'text-muted-foreground group-hover:text-foreground'
                          )}
                          aria-hidden="true"
                        />
                        {activeFilterCount > 0 && (
                          <motion.span
                            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[rgb(249,115,22)] text-[10px] font-semibold flex items-center justify-center text-white shadow-lg"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            aria-label={`${activeFilterCount} active filters`}
                          >
                            {activeFilterCount}
                          </motion.span>
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <div className="flex items-center gap-2">
                        <span>Filter</span>
                        {activeFilterCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({activeFilterCount} active)
                          </span>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            ) : null}

            <Input
              id={searchInputId}
              name="search"
              type="search"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "border-0 bg-transparent transition-smooth focus:ring-0 focus:ring-offset-0 h-14 w-full pl-12 text-base",
                showFilters ? "pr-12" : "pr-4" // Padding for filter button
              )}
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
        </div>

        {localSearchQuery && (
          <div
            className="mt-3 flex items-center justify-center rounded-lg border border-border/30 bg-card/30 backdrop-blur-sm px-4 py-2.5"
            id={searchResultsId}
            aria-live="polite"
            aria-atomic="true"
          >
            {announcement ? <span className="sr-only">{announcement}</span> : null}
            {resultCount > 0 ? (
              <span className="text-sm font-medium text-foreground">
                {resultCount} {resultCount === 1 ? 'result' : 'results'} found
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                No results found for &quot;{localSearchQuery}&quot;
              </span>
            )}
          </div>
        )}

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
