'use client';

/**
 * Unified Search Hook
 *
 * Consolidates search and filter logic shared across search interfaces.
 * Provides consistent search/filter state management with localStorage persistence.
 *
 * Features:
 * - Single source of truth for search/filter state management
 * - User sort preferences persisted via localStorage
 * - Cross-tab synchronization
 * - Active filter counting
 * - Tag toggle functionality
 *
 * @example
 * ```tsx
 * function SearchPage() {
 *   const {
 *     searchQuery,
 *     filters,
 *     handleSearch,
 *     handleFiltersChange,
 *     toggleTag,
 *     activeFilterCount,
 *   } = useUnifiedSearch({
 *     initialSort: 'trending',
 *     onSearchChange: (query) => console.log('Search:', query),
 *   });
 *
 *   return (
 *     <div>
 *       <input value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
 *       <span>Active filters: {activeFilterCount}</span>
 *     </div>
 *   );
 * }
 * ```
 *
 * @module web-runtime/hooks/use-unified-search
 */

import type { Database } from '@heyclaude/database-types';
import { useLocalStorage } from './use-local-storage.ts';
import type { FilterState } from '../types/component.types.ts';
import { useCallback, useState } from 'react';

/** Options for useUnifiedSearch hook */
export interface UseUnifiedSearchOptions {
  /** Initial sort option */
  initialSort?: FilterState['sort'];
  /** Callback when search query changes */
  onSearchChange?: (query: string) => void;
  /** Callback when filters change */
  onFiltersChange?: (filters: FilterState) => void;
}

/** Return type for useUnifiedSearch hook */
export interface UseUnifiedSearchReturn {
  /** Current search query */
  searchQuery: string;
  /** Current filter state */
  filters: FilterState;
  /** Whether filter panel is open */
  isFilterOpen: boolean;
  /** Number of active filters (excluding sort) */
  activeFilterCount: number;
  /** Handle search query change */
  handleSearch: (query: string) => void;
  /** Handle full filter state change */
  handleFiltersChange: (newFilters: FilterState) => void;
  /** Handle individual filter field change */
  handleFilterChange: (key: keyof FilterState, value: FilterState[keyof FilterState]) => void;
  /** Toggle a tag in the filters */
  toggleTag: (tag: string) => void;
  /** Clear all filters (keeps sort preference) */
  clearFilters: () => void;
  /** Set filter panel open state */
  setIsFilterOpen: (open: boolean) => void;
}

/**
 * Hook for managing unified search and filter state
 * @param options - Configuration options
 * @returns Object with search/filter state and handlers
 */
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

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      onSearchChange?.(query);
    },
    [onSearchChange]
  );

  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      if (newFilters.sort) {
        setSavedSort(newFilters.sort);
      }
      onFiltersChange?.(newFilters);
    },
    [onFiltersChange, setSavedSort]
  );

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      if (key === 'sort' && value) {
        setSavedSort(value as Database['public']['Enums']['sort_option']);
      }
      onFiltersChange?.(newFilters);
    },
    [filters, onFiltersChange, setSavedSort]
  );

  const toggleTag = useCallback(
    (tag: string) => {
      setFilters((prev: FilterState) => {
        const currentTags = prev.tags || [];
        const newTags = currentTags.includes(tag)
          ? currentTags.filter((t: string) => t !== tag)
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
