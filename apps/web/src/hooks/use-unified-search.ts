'use client';

/**
 * Unified Search Hook (SHA-2087)
 *
 * Consolidates search and filter logic shared across:
 * - UnifiedSearch component
 * - FloatingSearchSidebar component
 * - ContentSearchClient component
 *
 * Benefits:
 * - Single source of truth for search/filter state management
 * - ~120 lines of duplicated code eliminated
 * - Consistent behavior across all search interfaces
 * - Easier to maintain and test
 * - User preferences persisted via localStorage
 */

import type { Database } from '@heyclaude/database-types';
import { useLocalStorage } from '@heyclaude/web-runtime';
import { useCallback, useState } from 'react';
import type { FilterState } from '@/src/lib/types/component.types';

export interface UseUnifiedSearchOptions {
  initialSort?: FilterState['sort'];
  onSearchChange?: (query: string) => void;
  onFiltersChange?: (filters: FilterState) => void;
}

export interface UseUnifiedSearchReturn {
  // Search state
  searchQuery: string;
  filters: FilterState;
  isFilterOpen: boolean;

  // Filter state helpers
  activeFilterCount: number;

  // Handlers
  handleSearch: (query: string) => void;
  handleFiltersChange: (newFilters: FilterState) => void;
  handleFilterChange: (key: keyof FilterState, value: FilterState[keyof FilterState]) => void;
  toggleTag: (tag: string) => void;
  clearFilters: () => void;
  setIsFilterOpen: (open: boolean) => void;
}

export function useUnifiedSearch({
  initialSort = 'trending' as Database['public']['Enums']['sort_option'],
  onSearchChange,
  onFiltersChange,
}: UseUnifiedSearchOptions = {}): UseUnifiedSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Persist sort preference in localStorage
  const { value: savedSort, setValue: setSavedSort } = useLocalStorage<
    Database['public']['Enums']['sort_option']
  >('user-pref-sort', {
    defaultValue:
      (initialSort as Database['public']['Enums']['sort_option']) ||
      ('trending' as Database['public']['Enums']['sort_option']),
    syncAcrossTabs: true,
  });

  const [filters, setFilters] = useState<FilterState>(() => ({
    sort: savedSort || initialSort,
  }));

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

  // Handle search query change
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      onSearchChange?.(query);
    },
    [onSearchChange]
  );

  // Handle full filter state change
  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      // Persist sort preference
      if (newFilters.sort) {
        setSavedSort(newFilters.sort);
      }
      onFiltersChange?.(newFilters);
    },
    [onFiltersChange, setSavedSort]
  );

  // Handle individual filter field change
  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      // Persist sort preference
      if (key === 'sort' && value) {
        setSavedSort(value as Database['public']['Enums']['sort_option']);
      }
      onFiltersChange?.(newFilters);
    },
    [filters, onFiltersChange, setSavedSort]
  );

  // Toggle tag selection
  const toggleTag = useCallback(
    (tag: string) => {
      setFilters((prev) => {
        const currentTags = prev.tags || [];
        const newTags = currentTags.includes(tag)
          ? currentTags.filter((t) => t !== tag)
          : [...currentTags, tag];
        const newFilters: FilterState = {
          ...prev,
          ...(newTags.length > 0 ? { tags: newTags } : {}),
        };
        onFiltersChange?.(newFilters);
        return newFilters;
      });
    },
    [onFiltersChange]
  );

  // Clear all filters (keep sort)
  const clearFilters = useCallback(() => {
    const clearedFilters: FilterState = {
      sort: filters.sort || ('trending' as Database['public']['Enums']['sort_option']),
    };
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  }, [filters.sort, onFiltersChange]);

  return {
    searchQuery,
    filters,
    isFilterOpen,
    activeFilterCount,
    handleSearch,
    handleFiltersChange,
    handleFilterChange,
    toggleTag,
    clearFilters,
    setIsFilterOpen,
  };
}
