"use client";

/**
 * Search Hook Primitives
 * SHA-2101: Extracted common search logic to reduce duplication
 *
 * Shared primitives used by both useSearch and useLocalSearch:
 * - Filter state management
 * - Search query state
 * - Filter options computation
 *
 * Reduces ~40-50 lines of duplication between hooks
 */

import { useCallback, useMemo, useState } from "react";
import type { FilterState } from "@/src/lib/schemas/component.schema";
import { extractFilterOptions } from "@/src/lib/schemas/content-filter.schema";

/**
 * Filter state management primitive
 * Provides stable filter state and change handler
 */
export function useFilterState(initialSort: FilterState["sort"] = "trending") {
  const [filters, setFilters] = useState<FilterState>({
    sort: initialSort,
  });

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  return { filters, handleFiltersChange, setFilters };
}

/**
 * Search query state primitive
 * Provides stable query state and handlers
 */
export function useSearchQuery() {
  const [query, setQuery] = useState("");

  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
  }, []);

  return { query, handleSearch, clearSearch, setQuery };
}

/**
 * Filter options computation primitive
 * Memoizes extracted filter options from data
 */
export function useFilterOptions<
  T extends {
    category?: string;
    author?: string;
    tags?: readonly string[] | string[];
  },
>(items: readonly T[] | T[]) {
  return useMemo(() => {
    const compatibleData = [...items].map((item) => ({
      category: item.category || "",
      author: item.author || "",
      tags: [...(item.tags || [])] as string[],
    }));
    return extractFilterOptions(compatibleData);
  }, [items]);
}

/**
 * Active filters check primitive
 * Determines if any filters are currently active
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return !!(
    filters.category ||
    filters.author ||
    filters.dateRange ||
    (filters.tags && filters.tags.length > 0) ||
    (filters.popularity &&
      (filters.popularity[0] > 0 || filters.popularity[1] < 100))
  );
}

/**
 * Combined search state primitive
 * Combines filter and query state for convenience
 */
export function useCombinedSearchState(
  initialSort: FilterState["sort"] = "trending",
) {
  const { filters, handleFiltersChange, setFilters } =
    useFilterState(initialSort);
  const { query, handleSearch, clearSearch } = useSearchQuery();

  const clearAll = useCallback(() => {
    clearSearch();
    setFilters({ sort: initialSort });
  }, [clearSearch, setFilters, initialSort]);

  const isSearching = query.trim().length > 0 || hasActiveFilters(filters);

  return {
    query,
    filters,
    handleSearch,
    handleFiltersChange,
    clearSearch,
    clearAll,
    isSearching,
  };
}
