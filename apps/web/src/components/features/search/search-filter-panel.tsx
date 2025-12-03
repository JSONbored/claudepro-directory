'use client';

/**
 * Search Filter Panel (SHA-2087)
 *
 * Shared filter UI component extracted from UnifiedSearch and FloatingSearchSidebar
 * Eliminates ~232 lines of duplicated filter panel code
 *
 * Features:
 * - Category, Author, Date Range filters
 * - Popularity range slider
 * - Tag selection with scroll area
 * - Apply/Clear actions
 */

import {
  alignItems,
  between,
  border,
  borderTop,
  bgColor,
  cluster,
  display,
  flexWrap,
  gap,
  grid,
  height,
  hoverBg,
  justify,
  leading,
  marginBottom,
  padding,
  paddingLeft,
  paddingTop,
  radius,
  size,
  spaceY,
  srOnly,
  transition,
  weight,
  width,
  cursor,
  opacityLevel,
} from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';
import type { FilterState } from '@heyclaude/web-runtime/types/component.types';
import { memo, useId } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import { Label } from '@heyclaude/web-runtime/ui';
import { ScrollArea } from '@heyclaude/web-runtime/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@heyclaude/web-runtime/ui';
import { Slider } from '@heyclaude/web-runtime/ui';

export interface SearchFilterPanelProps {
  filters: FilterState;
  availableTags?: readonly string[];
  availableAuthors?: readonly string[];
  availableCategories?: readonly string[];
  activeFilterCount: number;
  onFilterChange: (key: keyof FilterState, value: FilterState[keyof FilterState]) => void;
  onToggleTag: (tag: string) => void;
  onClearFilters: () => void;
  onApplyFilters?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

/**
 * Render a configurable search filter panel with category, author, date range, popularity, tag selection, and action controls.
 *
 * The component delegates all state changes to the provided callbacks and conditionally renders controls
 * based on the available options and provided handlers. Accessibility attributes and unique IDs are applied
 * to interactive controls.
 *
 * @param props.filters - Current filter state (category, author, dateRange, popularity, tags).
 * @param props.availableTags - Optional list of tag options shown in the tag selector.
 * @param props.availableAuthors - Optional list of author options shown in the author select.
 * @param props.availableCategories - Optional list of category options shown in the category select.
 * @param props.activeFilterCount - Number of currently active filters; used to enable/disable actions.
 * @param props.onFilterChange - Callback invoked with (key, value) when a single filter field changes.
 * @param props.onToggleTag - Callback invoked with (tag) to add or remove a tag from the tag filter.
 * @param props.onClearFilters - Callback invoked to clear all filters.
 * @param props.onApplyFilters - Optional callback invoked when the user applies filters.
 * @param props.onCancel - Optional callback invoked when the user cancels filter changes.
 * @param props.showActions - Whether to render action buttons (defaults to true).
 *
 * @returns A React element representing the search filter panel UI.
 *
 * @see SearchFilterPanel — memoized export wrapping this component
 */
function SearchFilterPanelComponent({
  filters,
  availableTags = [],
  availableAuthors = [],
  availableCategories = [],
  activeFilterCount,
  onFilterChange,
  onToggleTag,
  onClearFilters,
  onApplyFilters,
  onCancel,
  showActions = true,
}: SearchFilterPanelProps) {
  // Generate unique IDs for accessibility
  const categorySelectId = useId();
  const authorSelectId = useId();
  const dateRangeSelectId = useId();

  return (
    <section
      className={`${spaceY.comfortable} ${radius.lg} ${border.light} ${bgColor['card/30']} ${padding.default} md:${spaceY.relaxed} md:${padding.comfortable}`}
    >
      {/* Main Filters */}
      <fieldset className={grid.responsive123Filters}>
        <legend className={srOnly.default}>Filter by category, author, and date range</legend>

        {/* Category Filter */}
        {availableCategories.length > 0 && (
          <div className={spaceY.compact}>
            <Label htmlFor={categorySelectId}>Category</Label>
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) =>
                onFilterChange('category', value === 'all' ? undefined : value)
              }
              name="category"
            >
              <SelectTrigger
                className={bgColor['background/50']}
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
          <div className={spaceY.compact}>
            <Label htmlFor={authorSelectId}>Author</Label>
            <Select
              value={filters.author || 'all'}
              onValueChange={(value) =>
                onFilterChange('author', value === 'all' ? undefined : value)
              }
              name="author"
            >
              <SelectTrigger
                className={bgColor['background/50']}
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
        <div className={spaceY.compact}>
          <Label htmlFor={dateRangeSelectId}>Date Range</Label>
          <Select
            value={filters.dateRange || 'all'}
            onValueChange={(value) =>
              onFilterChange('dateRange', value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger
              className={bgColor['background/50']}
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
      <fieldset className={spaceY.compact}>
        <legend className={`${weight.medium} ${size.sm} ${leading.none} peer-disabled:${cursor.notAllowed} peer-disabled:${opacityLevel[70]}`}>
          Popularity Range ({filters.popularity?.[0] || 0} - {filters.popularity?.[1] || 100})
        </legend>
        <div className={`${paddingLeft.compact} ${padding.yDefault}`}>
          <Slider
            value={filters.popularity || [0, 100]}
            onValueChange={(value) => onFilterChange('popularity', value as [number, number])}
            min={0}
            max={100}
            step={1}
            className={width.full}
            name="popularity-range"
            aria-label="Set popularity range"
            aria-valuetext={`Popularity range from ${filters.popularity?.[0] || 0} to ${filters.popularity?.[1] || 100}`}
          />
        </div>
      </fieldset>

      {/* Tags - Organized in Scrollable Area */}
      {availableTags.length > 0 && (
        <fieldset className={spaceY.default}>
          <div className={`${borderTop.light} ${paddingTop.default}`} />
          <div>
            <div className={`${between.center} ${marginBottom.compact}`}>
              <legend className={`${weight.medium} ${size.sm} ${leading.none} peer-disabled:${cursor.notAllowed} peer-disabled:${opacityLevel[70]}`}>
                Tags
              </legend>
              {filters.tags && filters.tags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFilterChange('tags', undefined)}
                  aria-label={`Clear all selected tags (${filters.tags.length} selected)`}
                >
                  Clear Tags ({filters.tags.length})
                </Button>
              )}
            </div>
            <ScrollArea
              className={`${height.scrollArea} ${width.full} ${radius.md} ${border.light} ${padding.default} md:${height.scrollAreaLg}`}
              aria-label="Select tags to filter by"
            >
              <div className={`${display.flex} ${flexWrap.wrap} ${gap.compact}`}>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onToggleTag(tag)}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleTag(tag);
                      }
                    }}
                    aria-pressed={filters.tags?.includes(tag)}
                    aria-label={`${filters.tags?.includes(tag) ? 'Remove' : 'Add'} ${tag} tag filter`}
                    type="button"
                    className={`${cursor.pointer} ${transition.default}`}
                  >
                    <UnifiedBadge
                      variant="base"
                      style={filters.tags?.includes(tag) ? 'default' : 'outline'}
                      className={hoverBg.default}
                    >
                      {tag}
                    </UnifiedBadge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </fieldset>
      )}

      {/* Action Buttons */}
      {showActions && (
        <fieldset className={cn(display.flex, paddingTop.relaxed, borderTop.light, alignItems.center, justify.between)}>
          <legend className={srOnly.default}>Filter actions</legend>
          <Button
            variant="ghost"
            onClick={onClearFilters}
            disabled={activeFilterCount === 0}
            aria-label={`Clear all ${activeFilterCount} active filters`}
          >
            Clear All Filters
          </Button>
          <div className={cluster.compact}>
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                aria-label="Cancel filter changes and close panel"
              >
                Cancel
              </Button>
            )}
            {onApplyFilters && (
              <Button
                onClick={onApplyFilters}
                aria-label={`Apply ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''}`}
              >
                Apply Filters
              </Button>
            )}
          </div>
        </fieldset>
      )}
    </section>
  );
}

/**
 * Memoized export with custom comparison function
 * Optimizes complex filter state re-renders
 *
 * Custom comparison skips function references since they change identity
 * but not behavior between renders
 */
export const SearchFilterPanel = memo(SearchFilterPanelComponent, (prevProps, nextProps) => {
  // Compare all props except function callbacks
  return (
    prevProps.activeFilterCount === nextProps.activeFilterCount &&
    prevProps.showActions === nextProps.showActions &&
    // Deep compare arrays
    JSON.stringify(prevProps.availableTags) === JSON.stringify(nextProps.availableTags) &&
    JSON.stringify(prevProps.availableAuthors) === JSON.stringify(nextProps.availableAuthors) &&
    JSON.stringify(prevProps.availableCategories) ===
      JSON.stringify(nextProps.availableCategories) &&
    // Deep compare filters object (complex state)
    JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters)
  );
});

SearchFilterPanel.displayName = 'SearchFilterPanel';