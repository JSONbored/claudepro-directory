'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { type SearchableItem, type SearchFilters, searchCache } from '@/lib/search-cache';
import type { ContentItem } from '@/types/content';

export interface FilterState {
  category?: string;
  author?: string;
  dateRange?: string;
  popularity?: [number, number];
  tags?: string[];
  sort?: 'trending' | 'newest' | 'alphabetical';
}

export interface SearchOptions {
  threshold?: number;
  includeScore?: boolean;
  includeMatches?: boolean;
  minMatchCharLength?: number;
  debounceMs?: number;
}

export interface UseUnifiedSearchProps {
  data: ContentItem[];
  searchOptions?: SearchOptions;
  initialFilters?: FilterState;
  onSearchChange?: (query: string, results: ContentItem[]) => void;
  onFiltersChange?: (filters: FilterState, results: ContentItem[]) => void;
}

export interface SearchResult {
  query: string;
  filters: FilterState;
  results: ContentItem[];
  filteredResults: ContentItem[];
  isSearching: boolean;
  hasActiveFilters: boolean;
  stats: {
    totalResults: number;
    filteredCount: number;
    categories: string[];
    tags: string[];
    authors: string[];
  };
  handleSearch: (query: string, newFilters?: FilterState) => void;
  handleFiltersChange: (newFilters: FilterState) => void;
  updateFilter: (key: keyof FilterState, value: FilterState[keyof FilterState]) => void;
  resetSearch: () => void;
  resetFilters: () => void;
  resetAll: () => void;
}

// Convert ContentItem to SearchableItem for compatibility
function convertToSearchableItem(item: ContentItem): SearchableItem {
  return {
    ...item,
    title: item.name || item.title || '',
    slug: item.slug || item.id,
  };
}

// Convert FilterState to SearchFilters for the cache system
function convertFilters(filters: FilterState): SearchFilters {
  return {
    categories: filters.category ? [filters.category] : [],
    tags: filters.tags || [],
    authors: filters.author ? [filters.author] : [],
    sort: filters.sort as 'trending' | 'newest' | 'alphabetical',
    popularity: filters.popularity || [0, 100],
  };
}

// Check if filters are active
function hasActiveFilters(filters: FilterState): boolean {
  return !!(
    filters.category ||
    filters.author ||
    filters.dateRange ||
    (filters.tags && filters.tags.length > 0) ||
    (filters.popularity && (filters.popularity[0] > 0 || filters.popularity[1] < 100))
  );
}

// Apply client-side filtering (for non-cached scenarios)
function applyClientSideFiltering(data: ContentItem[], filters: FilterState): ContentItem[] {
  let filtered = [...data];

  // Category filter
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter((item) => item.category === filters.category);
  }

  // Author filter
  if (filters.author && filters.author !== 'all') {
    filtered = filtered.filter((item) => item.author === filters.author);
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((item) => filters.tags!.some((tag) => item.tags?.includes(tag)));
  }

  // Popularity filter
  if (filters.popularity) {
    const [min, max] = filters.popularity;
    if (min > 0 || max < 100) {
      filtered = filtered.filter((item) => {
        const popularity = item.popularity || 0;
        return popularity >= min && popularity <= max;
      });
    }
  }

  // Date range filter (if items have lastModified or dateAdded)
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    let threshold: Date;

    switch (filters.dateRange) {
      case 'week':
        threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        threshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        threshold = new Date(0);
    }

    filtered = filtered.filter((item) => {
      const dateToCheck = item.lastModified || item.dateAdded;
      if (!dateToCheck) return true;
      const itemDate = new Date(dateToCheck);
      return itemDate >= threshold;
    });
  }

  // Sort results
  if (filters.sort) {
    switch (filters.sort) {
      case 'trending':
        filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.lastModified || a.dateAdded;
          const dateB = b.lastModified || b.dateAdded;
          const timeA = dateA ? new Date(dateA).getTime() : 0;
          const timeB = dateB ? new Date(dateB).getTime() : 0;
          return timeB - timeA;
        });
        break;
      case 'alphabetical':
        filtered.sort((a, b) => {
          const nameA = (a.name || a.title || '').toLowerCase();
          const nameB = (b.name || b.title || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
    }
  }

  return filtered;
}

// Optimized cached search function
async function performCachedSearch(
  data: ContentItem[],
  query: string,
  filters: FilterState,
  options: SearchOptions = {}
): Promise<ContentItem[]> {
  if (!query.trim() && !hasActiveFilters(filters)) {
    return data;
  }

  try {
    // If query is empty but filters are active, use client-side filtering
    if (!query.trim() && hasActiveFilters(filters)) {
      return applyClientSideFiltering(data, filters);
    }

    // Convert data to searchable format
    const searchableData = data.map(convertToSearchableItem);
    const searchFilters = convertFilters(filters);

    // Use cached search for text queries
    const results = await searchCache.search(searchableData, query, searchFilters, {
      threshold: options.threshold || 0.3,
      includeScore: options.includeScore || false,
      keys: [
        { name: 'name', weight: 2 },
        { name: 'title', weight: 2 },
        { name: 'description', weight: 1.5 },
        { name: 'category', weight: 1 },
        { name: 'author', weight: 0.8 },
        { name: 'tags', weight: 0.6 },
      ],
    });

    // Convert back to ContentItem format
    return results.map((item) => {
      const original = data.find((d) => d.id === item.id);
      return original || (item as ContentItem);
    });
  } catch (error) {
    console.error('Search failed, falling back to client-side filtering:', error);
    return applyClientSideFiltering(data, filters);
  }
}

export function useUnifiedSearch({
  data,
  searchOptions = {},
  initialFilters = { sort: 'trending' },
  onSearchChange,
  onFiltersChange,
}: UseUnifiedSearchProps): SearchResult {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [results, setResults] = useState<ContentItem[]>(data);
  const [isSearching, setIsSearching] = useState(false);

  // Memoize search options to prevent unnecessary re-renders
  const memoizedSearchOptions = useMemo(
    () => ({
      threshold: 0.3,
      debounceMs: 150,
      ...searchOptions,
    }),
    [searchOptions]
  );

  // Calculate available filter options
  const stats = useMemo(() => {
    const categories = [...new Set(data.map((item) => item.category))].filter(Boolean) as string[];
    const tags = [...new Set(data.flatMap((item) => item.tags || []))].filter(Boolean);
    const authors = [...new Set(data.map((item) => item.author))].filter(Boolean) as string[];

    return {
      totalResults: data.length,
      filteredCount: results.length,
      categories,
      tags,
      authors,
    };
  }, [data, results]);

  // Check if filters are active
  const hasFilters = useMemo(() => hasActiveFilters(filters), [filters]);

  // Update search results when data, query, or filters change
  useEffect(() => {
    const updateResults = async () => {
      setIsSearching(true);
      try {
        const searchResults = await performCachedSearch(
          data,
          query,
          filters,
          memoizedSearchOptions
        );
        setResults(searchResults);

        // Call callback if provided
        if (onSearchChange && query !== '') {
          onSearchChange(query, searchResults);
        }
      } catch (error) {
        console.error('Search update failed:', error);
        setResults(data);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search for better UX
    const timeoutId = setTimeout(updateResults, query ? memoizedSearchOptions.debounceMs : 0);

    return () => clearTimeout(timeoutId);
  }, [data, query, filters, memoizedSearchOptions, onSearchChange]);

  // Call filters callback when filters change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters, results);
    }
  }, [filters, results, onFiltersChange]);

  // Stable search handler
  const handleSearch = useCallback((newQuery: string, newFilters?: FilterState) => {
    setQuery(newQuery);
    if (newFilters) {
      setFilters(newFilters);
    }
  }, []);

  // Stable filter handler
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  // Stable filter update handler
  const updateFilter = useCallback(
    (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Reset handlers
  const resetSearch = useCallback(() => {
    setQuery('');
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ sort: filters.sort || 'trending' });
  }, [filters.sort]);

  const resetAll = useCallback(() => {
    setQuery('');
    setFilters({ sort: 'trending' });
  }, []);

  return {
    query,
    filters,
    results,
    filteredResults: results,
    isSearching: isSearching || query.trim().length > 0 || hasFilters,
    hasActiveFilters: hasFilters,
    stats,
    handleSearch,
    handleFiltersChange,
    updateFilter,
    resetSearch,
    resetFilters,
    resetAll,
  };
}

// Export additional utilities
export {
  hasActiveFilters,
  applyClientSideFiltering,
  performCachedSearch,
  convertFilters,
  convertToSearchableItem,
};
