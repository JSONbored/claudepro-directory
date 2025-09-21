'use client';

import Fuse from 'fuse.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

// Cache for Fuse instances to improve performance
const fuseCache = new Map<string, Fuse<ContentItem>>();

// Generate cache key from data and options
function generateCacheKey(data: ContentItem[], options: SearchOptions): string {
  // Create a more robust data fingerprint
  const dataFingerprint =
    data.length > 0
      ? `${data.length}-${data[0]?.id || 'no-id'}-${data[data.length - 1]?.id || 'no-id'}`
      : 'empty';

  // Sort options keys to ensure consistent cache keys
  const optionsEntries = Object.entries(options).sort(([a], [b]) => a.localeCompare(b));
  const optionsKey = JSON.stringify(Object.fromEntries(optionsEntries));
  return `${dataFingerprint}-${optionsKey}`;
}

// Get or create Fuse instance with caching
function getFuseInstance(data: ContentItem[], options: SearchOptions): Fuse<ContentItem> {
  const cacheKey = generateCacheKey(data, options);

  const cachedFuse = fuseCache.get(cacheKey);
  if (cachedFuse) {
    return cachedFuse;
  }

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

  // Prevent cache from growing too large (LRU-like behavior)
  if (fuseCache.size >= 10) {
    const firstKey = fuseCache.keys().next().value as string;
    if (firstKey) {
      fuseCache.delete(firstKey);
    }
  }

  fuseCache.set(cacheKey, fuse);
  return fuse;
}

// Optimized synchronous search function for better performance and React 19 compatibility
function performSearch(
  data: ContentItem[],
  query: string,
  filters: FilterState,
  options: SearchOptions = {}
): ContentItem[] {
  if (!query.trim() && !hasActiveFilters(filters)) {
    return data;
  }

  let result = data;

  // Apply text search if query exists
  if (query.trim()) {
    const fuse = getFuseInstance(data, options);
    const searchResults = fuse.search(query);
    result = searchResults.map((item) => item.item);
  }

  // Apply filters
  result = applyFilters(result, filters);

  return result;
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
    const updateResults = () => {
      const results = performSearch(data, searchQuery, filters, memoizedSearchOptions);
      setSearchResults(results);
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
