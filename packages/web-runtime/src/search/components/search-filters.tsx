'use client';

/**
 * SearchFilters Component - Unified Filter Panel
 *
 * Refactored from SearchFilterPanel to work with new search system.
 * URL-synchronized filters with Motion.dev animations.
 *
 * Features:
 * - Category, Author, Date Range filters
 * - Popularity range slider
 * - Tag selection with scroll area
 * - URL synchronization
 * - Motion.dev animations
 * - Accessibility support
 *
 * @module web-runtime/search/components/search-filters
 */

import type { content_category } from '@prisma/client';
import { SPRING, DURATION } from '@heyclaude/web-runtime/design-system';
import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';
import { getCategoryConfig } from '@heyclaude/web-runtime/data/config/category';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import {
  UnifiedBadge,
  Button,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  cn,
} from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { useId } from 'react';

import type { FilterState } from '@heyclaude/web-runtime/types/component.types';
import { useSearchContext } from '../context/search-provider';

export interface SearchFiltersProps {
  availableAuthors?: readonly string[];
  availableCategories?: readonly string[];
  availableTags?: readonly string[];
  showActions?: boolean;
  className?: string;
}

/**
 * SearchFilters - Unified filter panel component
 *
 * @example
 * ```tsx
 * <SearchProvider>
 *   <SearchFilters
 *     availableTags={tags}
 *     availableAuthors={authors}
 *     availableCategories={categories}
 *   />
 * </SearchProvider>
 * ```
 */
export function SearchFilters({
  availableTags = [],
  availableAuthors = [],
  availableCategories = [],
  showActions = true,
  className,
}: SearchFiltersProps) {
  const { filters, setFilters } = useSearchContext();
  const shouldReduceMotion = useReducedMotion();

  // Generate unique IDs for accessibility
  const categorySelectId = useId();
  const authorSelectId = useId();
  const dateRangeSelectId = useId();

  // Calculate active filter count
  const activeFilterCount = (() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.author) count++;
    if (filters.dateRange) count++;
    if (filters.popularity && (filters.popularity[0] > 0 || filters.popularity[1] < 100)) count++;
    if (filters.tags && filters.tags.length > 0) count += filters.tags.length;
    return count;
  })();

  // Handle filter change
  const handleFilterChange = (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
    setFilters((prev) => {
      const updated: FilterState = { ...prev };
      if (value === undefined) {
        delete updated[key];
      } else {
        // Type-safe assignment for exactOptionalPropertyTypes
        (updated as Record<string, unknown>)[key] = value;
      }
      return updated;
    });
  };

  // Handle tag toggle
  const handleToggleTag = (tag: string) => {
    setFilters((prev) => {
      const currentTags = prev.tags || [];
      const newTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];
      const updated: FilterState = { ...prev };
      if (newTags.length > 0) {
        updated.tags = newTags;
      } else {
        delete updated.tags;
      }
      return updated;
    });
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <motion.section
      className={cn(
        'border-border/50 space-y-4 rounded-lg border bg-[rgba(0,0,0,0.6)] p-4 shadow-xl backdrop-blur-xl md:space-y-6 md:p-6',
        className
      )}
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.smooth}
      layout
      layoutDependency={JSON.stringify(filters)}
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)',
        contain: 'layout style paint',
      }}
    >
      {/* Main Filters */}
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
        <legend className="sr-only">Filter by category, author, and date range</legend>

        {/* Category Filter */}
        {availableCategories.length > 0 && (
          <motion.div
            className="space-y-2"
            layout
            layoutDependency={filters.category}
            initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...SPRING.smooth, delay: 0.1 }}
          >
            <Label htmlFor={categorySelectId}>Category</Label>
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) =>
                handleFilterChange('category', value === 'all' ? undefined : value)
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
                {availableCategories.map((cat) => {
                  const displayName = isValidCategory(cat)
                    ? (getCategoryConfig(cat as content_category)?.typeName ?? cat)
                    : cat;
                  return (
                    <SelectItem key={cat} value={cat}>
                      {displayName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </motion.div>
        )}

        {/* Author Filter */}
        {availableAuthors.length > 0 && (
          <motion.div
            className="space-y-2"
            layout
            initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...SPRING.smooth, delay: 0.15 }}
          >
            <Label htmlFor={authorSelectId}>Author</Label>
            <Select
              value={filters.author || 'all'}
              onValueChange={(value) =>
                handleFilterChange('author', value === 'all' ? undefined : value)
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
          </motion.div>
        )}

        {/* Date Range */}
        <motion.div
          className="space-y-2"
          layout
          layoutDependency={filters.author}
          initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING.smooth, delay: 0.2 }}
        >
          <Label htmlFor={dateRangeSelectId}>Date Range</Label>
          <Select
            value={filters.dateRange || 'all'}
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
        </motion.div>
      </fieldset>

      {/* Popularity Slider */}
      <motion.fieldset
        className="space-y-2"
        layout
        layoutDependency={JSON.stringify(filters.popularity)}
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.smooth, delay: 0.25 }}
      >
        <legend className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Popularity Range ({filters.popularity?.[0] || 0} - {filters.popularity?.[1] || 100})
        </legend>
        <div className="px-2 py-4">
          <Slider
            value={filters.popularity || [0, 100]}
            onValueChange={(value) => handleFilterChange('popularity', value as [number, number])}
            min={0}
            max={100}
            step={1}
            className="w-full"
            name="popularity-range"
            aria-label="Set popularity range"
            aria-valuetext={`Popularity range from ${filters.popularity?.[0] || 0} to ${filters.popularity?.[1] || 100}`}
          />
        </div>
      </motion.fieldset>

      {/* Tags - Organized in Scrollable Area */}
      {availableTags.length > 0 && (
        <motion.fieldset
          className="space-y-3"
          layout
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.smooth, delay: 0.3 }}
        >
          <div className="border-border/50 border-t pt-3" />
          <div>
            <div className="mb-3 flex items-center justify-between">
              <legend className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Tags
              </legend>
              {filters.tags && filters.tags.length > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange('tags', undefined)}
                  aria-label={`Clear all selected tags (${filters.tags.length} selected)`}
                >
                  Clear Tags ({filters.tags.length})
                </Button>
              ) : null}
            </div>
            <ScrollArea
              className="border-border/50 h-40 w-full rounded-md border p-4 md:h-48"
              aria-label="Select tags to filter by"
            >
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag, index) => (
                  <motion.button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleTag(tag);
                      }
                    }}
                    aria-pressed={filters.tags?.includes(tag)}
                    aria-label={`${filters.tags?.includes(tag) ? 'Remove' : 'Add'} ${tag} tag filter`}
                    type="button"
                    className="cursor-pointer transition-all"
                    initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...SPRING.smooth, delay: index * 0.02 }}
                    whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                    style={{
                      transitionDuration: `${DURATION.quick}s`,
                      willChange: 'transform',
                      transform: 'translateZ(0)',
                    }}
                  >
                    <UnifiedBadge
                      variant="base"
                      style={filters.tags?.includes(tag) ? 'default' : 'outline'}
                      className="hover:bg-accent/10"
                    >
                      {tag}
                    </UnifiedBadge>
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </motion.fieldset>
      )}

      {/* Action Buttons */}
      {showActions && (
        <motion.fieldset
          className="border-border/50 flex items-center justify-between border-t pt-6"
          layout
          layoutDependency={activeFilterCount}
          initial={shouldReduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...SPRING.smooth, delay: 0.35 }}
        >
          <legend className="sr-only">Filter actions</legend>
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            disabled={activeFilterCount === 0}
            aria-label={`Clear all ${activeFilterCount} active filters`}
          >
            Clear All Filters
          </Button>
        </motion.fieldset>
      )}
    </motion.section>
  );
}
