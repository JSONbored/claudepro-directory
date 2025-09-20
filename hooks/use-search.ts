'use client';

import Fuse from 'fuse.js';
import { use, useCallback, useMemo, useState } from 'react';
import type { FilterState } from '@/components/unified-search';
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

// Create a promise-based search function that can be used with React 19's use() hook
function createSearchPromise(
  data: ContentItem[],
  query: string,
  filters: FilterState,
  options: SearchOptions = {}
): Promise<ContentItem[]> {
  return new Promise((resolve) => {
    // Use setTimeout to make search async and allow for React 19 optimizations
    setTimeout(() => {
      if (!query.trim() && !hasActiveFilters(filters)) {
        resolve(data);
        return;
      }

      let result = data;

      // Apply text search if query exists
      if (query.trim()) {
        const fuse = new Fuse(data, {
          keys: [
            { name: 'name', weight: 2 },
            { name: 'description', weight: 1.5 },
            { name: 'category', weight: 1 },
            { name: 'author', weight: 0.8 },
            { name: 'tags', weight: 0.6 },
          ],
          threshold: options.threshold || 0.3,
          includeScore: options.includeScore || false,
          includeMatches: options.includeMatches || false,
          minMatchCharLength: options.minMatchCharLength || 2,
        });

        const searchResults = fuse.search(query);
        result = searchResults.map((item) => item.item);
      }

      // Apply filters
      result = applyFilters(result, filters);

      resolve(result);
    }, 0);
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

function applyFilters(items: ContentItem[], filters: FilterState): ContentItem[] {
  let result = [...items];

  // Apply category filter
  if (filters.category) {
    result = result.filter((item) => item.category === filters.category);
  }

  // Apply author filter
  if (filters.author) {
    result = result.filter((item) => item.author === filters.author);
  }

  // Apply tags filter
  if (filters.tags && filters.tags.length > 0) {
    result = result.filter((item) => filters.tags?.some((tag) => item.tags?.includes(tag)));
  }

  // Apply date range filter (if applicable)
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    const dateThreshold = getDateThreshold(now, filters.dateRange);

    result = result.filter((item) => {
      if (!item.dateAdded) return true; // Include items without dates
      const itemDate = new Date(item.dateAdded);
      return itemDate >= dateThreshold;
    });
  }

  // Apply popularity filter (if applicable)
  if (filters.popularity && (filters.popularity[0] > 0 || filters.popularity[1] < 100)) {
    // Since we don't have popularity scores, we'll use a placeholder implementation
    // In a real app, you'd filter based on actual popularity metrics
  }

  // Apply sorting
  switch (filters.sort) {
    case 'alphabetical':
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    case 'newest':
      result.sort((a, b) => {
        if (!a.dateAdded || !b.dateAdded) return 0;
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      });
      break;
    default:
      // Keep original order for 'trending'
      break;
  }

  return result;
}

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

export function useSearch({ data, searchOptions }: UseSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({ sort: 'trending' });
  const [searchPromise, setSearchPromise] = useState<Promise<ContentItem[]> | null>(null);

  // Memoize filter options
  const filterOptions = useMemo(() => {
    const categories = [...new Set(data.map((item) => item.category))].filter(Boolean) as string[];
    const tags = [...new Set(data.flatMap((item) => item.tags || []))].filter(Boolean);
    const authors = [...new Set(data.map((item) => item.author))].filter(Boolean) as string[];

    return { categories, tags, authors };
  }, [data]);

  // Create search promise when query or filters change
  const handleSearch = useCallback(
    (query: string, newFilters?: FilterState) => {
      const currentFilters = newFilters || filters;
      const promise = createSearchPromise(data, query, currentFilters, searchOptions);
      setSearchPromise(promise);
      setSearchQuery(query);
      if (newFilters) {
        setFilters(newFilters);
      }
    },
    [data, filters, searchOptions]
  );

  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      handleSearch(searchQuery, newFilters);
    },
    [searchQuery, handleSearch]
  );

  // Use React 19's use() hook to get search results
  const searchResults = searchPromise ? use(searchPromise) : data;

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
