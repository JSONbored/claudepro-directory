'use client';

/**
 * Unified Search Component - Database-First Architecture
 * Search UI with filters. Analytics tracked via server action.
 */

import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { UI_TIMEOUTS } from '@heyclaude/web-runtime/config/unified-config';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  Search,
  X,
} from '@heyclaude/web-runtime/icons';
import type { FilterState, UnifiedSearchProps } from '@heyclaude/web-runtime/types/component.types';
import { iconSize, absolute, radius, cluster, hoverBg, spaceY, marginBottom, muted, srOnly, weight, size, padding, gap, transition, zLayer, borderColor,
  flexWrap,
  tracking,
  opacityLevel,
  bgColor,
  justify,
  textColor,
  alignItems,
  backdrop,
  maxWidth,
  display,
  position,
  textAlign,
  width,
  height,
  paddingRight,
  paddingLeft,
  marginLeft,
  cursor,
  pointerEvents,
  focusRing,
  hoverText,
  transform,
} from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';
import { usePathname } from 'next/navigation';
import { memo, useCallback, useEffect, useId, useState } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { ErrorBoundary } from '@heyclaude/web-runtime/ui';
import { SearchFilterPanel } from '@/src/components/features/search/search-filter-panel';
import { Button } from '@heyclaude/web-runtime/ui';
import { Collapsible, CollapsibleContent } from '@heyclaude/web-runtime/ui';
import { Input } from '@heyclaude/web-runtime/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@heyclaude/web-runtime/ui';
import { useUnifiedSearch } from '@heyclaude/web-runtime/hooks';

// Use enum values directly from @heyclaude/database-types Constants
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

function isValidContentCategory(
  value: string | null | undefined
): value is Database['public']['Enums']['content_category'] {
  return (
    typeof value === 'string' &&
    CONTENT_CATEGORY_VALUES.includes(value as Database['public']['Enums']['content_category'])
  );
}

function getCategoryFromPathname(
  pathname: string | null | undefined
): Database['public']['Enums']['content_category'] | null {
  if (!pathname) return null;
  const category = pathname.split('/')[1];
  return isValidContentCategory(category) ? category : null;
}

export type { FilterState };

const SearchErrorFallback = () => (
  <div className={`${padding.default} ${textAlign.center} ${muted.default}`}>Error loading search</div>
);

/**
 * Unified search UI with a debounced search input, optional filter panel, saved-search presets, and analytics tracking.
 *
 * Renders a searchable interface that supports sorting, tag/author/category filters, applying/clearing filters, a saved-presets rail, and sends analytics pulses for searches and filter actions.
 *
 * @param placeholder - Placeholder text for the search input.
 * @param onSearch - Callback invoked with the sanitized search query when the input debounces.
 * @param onFiltersChange - Optional callback invoked when filters change.
 * @param filters - Initial filter state to populate the filter panel and sort selector.
 * @param availableTags - List of available tag values to show in the filter panel.
 * @param availableAuthors - List of available author values to show in the filter panel.
 * @param availableCategories - List of available category values to show in the filter panel.
 * @param resultCount - Number of search results to surface in announcements and summaries.
 * @param className - Optional additional container CSS classes.
 * @param showFilters - Whether to render the sort control and collapsible filter panel.
 * @param savedSearches - Optional array of saved search/preset objects to render in the presets rail.
 * @param onSelectSavedSearch - Callback invoked when a saved preset is applied (receives preset id).
 * @param onRemoveSavedSearch - Callback invoked when a saved preset is requested to be removed (receives preset id).
 * @param onSavePresetRequest - Callback invoked when the "Save current filters" action is requested.
 * @param isPresetSaveDisabled - Disables the save-preset button when true.
 *
 * @returns The React element for the unified search component.
 *
 * @see useUnifiedSearch
 * @see SearchFilterPanel
 */
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
  const pathname = usePathname();

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
    setDebounceMs(UI_TIMEOUTS.debounce_ms);
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

  return (
    <ErrorBoundary fallback={SearchErrorFallback}>
      <search className={cn(
  `${width.full} ${spaceY.comfortable}`, className)}>
        <div className={spaceY.default}>
          <div className={position.relative}>
            <div
              className={`-translate-y-1/2 ${pointerEvents.none} ${absolute.topHalf} left-4 ${zLayer.raised}`}
            >
              <Search className={`${iconSize.md} ${textColor.accent}`} aria-hidden="true" />
            </div>
            <Input
              id={searchInputId}
              name="search"
              type="search"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder={placeholder}
              className={
                `${height.inputLg} ${width.full} ${borderColor['border/50']} ${bgColor['card/50']} ${paddingRight.comfortable} ${paddingLeft.section} ${size.base} ${backdrop.sm} ${transition.smooth} focus:${borderColor['accent/50']} focus:${bgColor.card}`
              }
              aria-label="Search configurations"
              aria-describedby={resultCount > 0 && localSearchQuery ? searchResultsId : undefined}
              autoComplete="off"
            />
          </div>

          {showPresetRail && (
            <section
              aria-labelledby={presetSectionLabelId}
              className={`${radius.lg} border ${borderColor['border/60']} ${bgColor['card/40']} ${padding.compact}`}
            >
              <div className={`${marginBottom.compact} ${display.flex} ${flexWrap.wrap} ${alignItems.center} ${justify.between} ${gap.default}`}>
                <p
                  id={presetSectionLabelId}
                  className={`${weight.semibold} ${muted.default} ${size.xs} ${transform.uppercase} ${tracking.wide}`}
                >
                  Saved searches
                </p>
                {onSavePresetRequest && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={onSavePresetRequest}
                    disabled={savePresetButtonDisabled}
                    className={`${gap.compact} ${size.xs} sm:${size.sm}`}
                  >
                    <Plus className={iconSize.xsPlus} aria-hidden="true" />
                    <span>Save current filters</span>
                  </Button>
                )}
              </div>
              {hasSavedSearches ? (
                <ul className={`${display.flex} ${flexWrap.wrap} ${gap.compact}`} aria-live="polite">
                  {savedSearchPresets.map((preset) => (
                    <li
                      key={preset.id}
                      className={`${cluster.tight} ${radius.full} border ${borderColor['border/60']} ${bgColor['background/80']} ${padding.xTight} ${padding.yMicro}`}
                    >
                      <button
                        type="button"
                        onClick={() => handlePresetSelect(preset.id)}
                        disabled={!canSelectSavedSearches}
                        className={cn(
                          `${cluster.compact} ${radius.full} ${padding.xTight} ${padding.yMicro} ${weight.medium} ${size.xs} ${transition.smooth} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:${size.sm}`,
                          canSelectSavedSearches
                            ? `${textColor.foreground} ${hoverBg.default}`
                            : `${cursor.notAllowed} ${muted.default} ${opacityLevel[70]}`
                        )}
                        title={
                          preset.query
                            ? `${preset.label} • ${preset.query.slice(0, 80)}`
                            : preset.label
                        }
                        aria-label={`Apply preset ${preset.label}`}
                      >
                        <Bookmark className={`${iconSize.xsPlus} ${textColor.accent}`} aria-hidden="true" />
                        <span className={`${maxWidth[32]} truncate`}>{preset.label}</span>
                      </button>
                      {canRemoveSavedSearches && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handlePresetRemove(preset.id);
                          }}
                          className={`${radius.full} ${padding.micro} ${muted.default} ${transition.colors} ${hoverText.foreground} ${focusRing.accent60}`}
                          aria-label={`Remove preset ${preset.label}`}
                        >
                          <X className={iconSize.xs} aria-hidden="true" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : presetsLoading ? (
                <p className={muted.sm}>Loading saved searches…</p>
              ) : (
                <p className={muted.sm}>
                  No saved searches yet. Use “Save current filters” to store your favorite combos.
                </p>
              )}
            </section>
          )}

          {showFilters && (
            <div className={`${display.flex} ${justify.end} ${gap.compact}`}>
              <Select
                value={filters.sort || 'trending'}
                onValueChange={(value) => handleSortChange(value as FilterState['sort'])}
                name="sort"
              >
                <SelectTrigger
                  id={sortSelectId}
                  className={
                    `${height.input} ${width.auto} ${borderColor.border} ${bgColor.background} ${padding.xDefault} ${transition.smooth} ${hoverBg.default}`
                  }
                  aria-label="Sort configurations"
                >
                  <span className={size.sm}>Sort: </span>
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
                  `${height.input} ${gap.compact} ${padding.xDefault} ${transition.smooth}`,
                  isFilterOpen && `border-accent ${bgColor['accent/10']}`
                )}
                aria-expanded={isFilterOpen}
                aria-controls={filterPanelId}
                aria-label={`${isFilterOpen ? 'Close' : 'Open'} filter panel${activeFilterCount > 0 ? ` (${activeFilterCount} active filters)` : ''}`}
              >
                <Filter className={iconSize.sm} aria-hidden="true" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <UnifiedBadge
                    variant="base"
                    style="secondary"
                    className={`${marginLeft.tight} ${height.buttonSm} ${padding.xSnug} ${padding.yNone}`}
                    aria-label={`${activeFilterCount} active filters`}
                  >
                    {activeFilterCount}
                  </UnifiedBadge>
                )}
                {isFilterOpen ? (
                  <ChevronUp className={`${marginLeft.tight} ${iconSize.xs}`} aria-hidden="true" />
                ) : (
                  <ChevronDown className={`${marginLeft.tight} ${iconSize.xs}`} aria-hidden="true" />
                )}
              </Button>
            </div>
          )}
        </div>

        <div
          className={muted.sm}
          id={searchResultsId}
          aria-live="polite"
          aria-atomic="true"
        >
          {announcement && <span className={srOnly.default}>{announcement}</span>}
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
    JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters) &&
    JSON.stringify(prevProps.savedSearches) === JSON.stringify(nextProps.savedSearches) &&
    prevProps.isPresetSaveDisabled === nextProps.isPresetSaveDisabled &&
    prevProps.onSavePresetRequest === nextProps.onSavePresetRequest &&
    prevProps.onSelectSavedSearch === nextProps.onSelectSavedSearch &&
    prevProps.onRemoveSavedSearch === nextProps.onRemoveSavedSearch
  );
});

UnifiedSearch.displayName = 'UnifiedSearch';