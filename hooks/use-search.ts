'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FilterState } from '@/components/unified-search';
import { type SearchableItem, type SearchFilters, searchCache } from '@/lib/search-cache';
import type { ContentItem } from '@/types/content';

interface SearchOptions {
  threshold?: number;
  includeScore?: boolean;
  includeMatches?: boolean;
  minMatchCharLength?: number;
}

interface UseSearchProps {
  data: ContentItem[];
  searchOptions?: SearchOptions;
}

// Convert ContentItem to SearchableItem for compatibility
function convertToSearchableItem(item: ContentItem): SearchableItem {
  return {
    ...item,
    title: item.name || item.title || '',
    slug: item.slug || item.id,
  };
}

// Convert FilterState to SearchFilters for the new cache system
function convertFilters(filters: FilterState): SearchFilters {
  return {
    categories: filters.category ? [filters.category] : [],
    tags: filters.tags || [],
    authors: filters.author ? [filters.author] : [],
    sort: filters.sort as 'trending' | 'newest' | 'alphabetical',
    popularity: filters.popularity || [0, 100],
  };
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

  // Convert data to searchable format
  const searchableData = data.map(convertToSearchableItem);
  const searchFilters = convertFilters(filters);

  // Use cached search
  const results = await searchCache.search(searchableData, query, searchFilters, {
    threshold: options.threshold || 0.3,
    includeScore: options.includeScore || false,
    keys: [
      { name: 'name', weight: 2 },
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
}

function hasActiveFilters(filters: FilterState): boolean {
  return !!(
    filters.category ||
    filters.author ||
    filters.dateRange ||
    (filters.tags && filters.tags.length > 0) ||
    (filters.popularity && (filters.popularity[0] > 0 || filters.popularity[1] < 100))
  );
}

// Date threshold helper for future date filtering features
function getDateThreshold(now: Date, dateRange: string): Date {
  switch (dateRange) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week': {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return weekAgo;
    }
    case 'month': {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      return monthAgo;
    }
    case 'year': {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      return yearAgo;
    }
    default:
      return new Date(0); // Beginning of time
  }
}

// Export getDateThreshold for future date filtering features
export { getDateThreshold };

export function useSearch({ data, searchOptions }: UseSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({ sort: 'trending' });
  const [searchResults, setSearchResults] = useState<ContentItem[]>(data);

  // Memoize search options to prevent unnecessary re-renders
  const memoizedSearchOptions = useMemo(() => searchOptions || {}, [searchOptions]);

  // Memoize filter options
  const filterOptions = useMemo(() => {
    const categories = [...new Set(data.map((item) => item.category))].filter(Boolean) as string[];
    const tags = [...new Set(data.flatMap((item) => item.tags || []))].filter(Boolean);
    const authors = [...new Set(data.map((item) => item.author))].filter(Boolean) as string[];

    return { categories, tags, authors };
  }, [data]);

  // Update search results when data, query, or filters change
  useEffect(() => {
    const updateResults = async () => {
      try {
        const results = await performCachedSearch(
          data,
          searchQuery,
          filters,
          memoizedSearchOptions
        );
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed, falling back to original data:', error);
        setSearchResults(data);
      }
    };

    // Debounce search for better UX
    const timeoutId = setTimeout(updateResults, searchQuery ? 150 : 0);
    return () => clearTimeout(timeoutId);
  }, [data, searchQuery, filters, memoizedSearchOptions]);

  // Stable callbacks that don't cause re-renders
  const handleSearch = useCallback((query: string, newFilters?: FilterState) => {
    setSearchQuery(query);
    if (newFilters) {
      setFilters(newFilters);
    }
  }, []);

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  return {
    searchQuery,
    filters,
    searchResults,
    filterOptions,
    handleSearch,
    handleFiltersChange,
    isSearching: searchQuery.trim().length > 0 || hasActiveFilters(filters),
  };
}
