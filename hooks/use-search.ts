'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FilterState } from '@/components/unified-search';
import { extractFilterOptions } from '@/lib/schemas/content-filter.schema';
import { type SearchableItem, type SearchFilters, searchCache } from '@/lib/search-cache';
import { getDisplayTitle } from '@/lib/utils';
import type { ContentItem } from '@/types/content';

interface SearchOptions {
  threshold?: number;
  includeScore?: boolean;
  includeMatches?: boolean;
  minMatchCharLength?: number;
}

interface UseSearchProps {
  data: readonly ContentItem[] | ContentItem[];
  searchOptions?: SearchOptions;
}

// Convert ContentItem to SearchableItem for compatibility
function convertToSearchableItem(item: ContentItem): SearchableItem {
  return {
    id: item.slug, // Use slug as id since SearchableItem requires id
    title: getDisplayTitle(item),
    name: item.name || '', // Ensure name is always a string
    description: item.description,
    tags: [...(item.tags || [])], // Convert readonly array to mutable array
    category: item.category,
    popularity: item.popularity || 0,
    slug: item.slug,
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
    const original = [...data].find((d) => d.slug === item.slug);
    return (
      original ||
      ({
        ...item,
        author: '',
        dateAdded: new Date().toISOString(),
      } as ContentItem)
    );
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
  const [searchResults, setSearchResults] = useState<ContentItem[]>([...data]);

  // Memoize search options to prevent unnecessary re-renders
  const memoizedSearchOptions = useMemo(() => searchOptions || {}, [searchOptions]);

  // Memoize filter options with safe extraction
  const filterOptions = useMemo(() => {
    const compatibleData = [...data].map((item) => ({
      category: item.category,
      author: item.author,
      tags: [...(item.tags || [])] as unknown[],
    }));
    return extractFilterOptions(compatibleData);
  }, [data]);

  // Update search results when data, query, or filters change
  useEffect(() => {
    const updateResults = async () => {
      try {
        const results = await performCachedSearch(
          [...data],
          searchQuery,
          filters,
          memoizedSearchOptions
        );
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed, falling back to original data:', error);
        setSearchResults([...data]);
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
