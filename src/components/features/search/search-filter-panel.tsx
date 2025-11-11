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

import { memo, useId } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/unified-badge';
import { Button } from '@/src/components/primitives/button';
import { Label } from '@/src/components/primitives/label';
import { ScrollArea } from '@/src/components/primitives/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/primitives/select';
import { Slider } from '@/src/components/primitives/slider';
import type { FilterState } from '@/src/lib/types/component.types';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
      className={'space-y-4 rounded-lg border border-border/50 bg-card/30 p-4 md:space-y-6 md:p-6'}
    >
      {/* Main Filters */}
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
        <legend className="sr-only">Filter by category, author, and date range</legend>

        {/* Category Filter */}
        {availableCategories.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor={categorySelectId}>Category</Label>
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) =>
                onFilterChange('category', value === 'all' ? undefined : value)
              }
              name="category"
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
              value={filters.author || 'all'}
              onValueChange={(value) =>
                onFilterChange('author', value === 'all' ? undefined : value)
              }
              name="author"
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
            value={filters.dateRange || 'all'}
            onValueChange={(value) =>
              onFilterChange('dateRange', value === 'all' ? undefined : value)
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
        <legend className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Popularity Range ({filters.popularity?.[0] || 0} - {filters.popularity?.[1] || 100})
        </legend>
        <div className="px-2 py-4">
          <Slider
            value={filters.popularity || [0, 100]}
            onValueChange={(value) => onFilterChange('popularity', value as [number, number])}
            min={0}
            max={100}
            step={1}
            className="w-full"
            name="popularity-range"
            aria-label="Set popularity range"
            aria-valuetext={`Popularity range from ${filters.popularity?.[0] || 0} to ${filters.popularity?.[1] || 100}`}
          />
        </div>
      </fieldset>

      {/* Tags - Organized in Scrollable Area */}
      {availableTags.length > 0 && (
        <fieldset className="space-y-3">
          <div className={'border-border/50 border-t pt-3'} />
          <div>
            <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} mb-3`}>
              <legend className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
              className={'h-40 w-full rounded-md border border-border/50 p-4 md:h-48'}
              aria-label="Select tags to filter by"
            >
              <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
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
                    className="cursor-pointer transition-all duration-200"
                  >
                    <UnifiedBadge
                      variant="base"
                      style={filters.tags?.includes(tag) ? 'default' : 'outline'}
                      className="hover:bg-accent/10"
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
        <fieldset className={'flex items-center justify-between border-border/50 border-t pt-6'}>
          <legend className="sr-only">Filter actions</legend>
          <Button
            variant="ghost"
            onClick={onClearFilters}
            disabled={activeFilterCount === 0}
            aria-label={`Clear all ${activeFilterCount} active filters`}
          >
            Clear All Filters
          </Button>
          <div className={UI_CLASSES.FLEX_GAP_2}>
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
