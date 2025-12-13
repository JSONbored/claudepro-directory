'use client';

/**
 * useSearchStandalone Hook - Standalone Search Logic (No Context)
 *
 * Provides unified search functionality without requiring SearchProvider.
 * Can be used independently or alongside SearchProvider.
 *
 * @module web-runtime/search/hooks/use-search-standalone
 */

import type { DisplayableContent, FilterState } from '@heyclaude/web-runtime/types/component.types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { enhancedSearchCache } from '../utils/search-cache';
import { syncSearchStateFromURL, syncSearchStateToURL } from '../utils/search-state';
import type { UseSearchOptions, UseSearchReturn } from './use-search';

/**
 * Standalone version of useSearch that doesn't require SearchProvider
 */
export function useSearchStandalone({
  debounceMs = 300,
  minQueryLength = 0,
  onSearch,
  cache = true,
}: UseSearchOptions = {}): UseSearchReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL
  const [query, setQueryState] = useState<string>(() => {
    return searchParams.get('q') ?? '';
  });

  const [filters, setFiltersState] = useState<FilterState>(() => {
    return syncSearchStateFromURL(searchParams);
  });

  const [results, setResults] = useState<DisplayableContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for cancellation and debouncing
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<{ query: string; filters: FilterState } | null>(null);

  // Cancel current search
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Perform search with caching and deduplication
  const performSearch = useCallback(
    async (searchQuery: string, searchFilters: FilterState) => {
      // Check cache first
      if (cache) {
        const cached = enhancedSearchCache.get(searchQuery, searchFilters);
        if (cached) {
          setResults(cached);
          setIsLoading(false);
          setError(null);
          // Still fetch fresh in background (fire and forget)
        }
      }

      // Check if we need to search
      const shouldSearch =
        searchQuery.trim().length >= minQueryLength ||
        Object.keys(searchFilters).length > 0;

      if (!shouldSearch) {
        setResults([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      if (!onSearch) {
        return;
      }

      setIsLoading(true);
      setError(null);

      // Use cache deduplication
      try {
        const results = await enhancedSearchCache.deduplicateRequest(
          searchQuery,
          searchFilters,
          async () => {
            const controller = new AbortController();
            abortControllerRef.current = controller;

            try {
              const searchResults = await onSearch(searchQuery, searchFilters);

              // Check if request was aborted
              if (controller.signal.aborted) {
                throw new Error('Request aborted');
              }

              // Store in cache
              if (cache) {
                enhancedSearchCache.set(searchQuery, searchFilters, searchResults);
              }

              return searchResults;
            } catch (err) {
              // Ignore AbortError
              if (err instanceof Error && err.name === 'AbortError') {
                throw err;
              }
              throw err;
            }
          }
        );

        // Only update if request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setResults(results);
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        // Ignore AbortError
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        setError(err instanceof Error ? err : new Error('Search failed'));
        setIsLoading(false);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [cache, minQueryLength, onSearch]
  );

  // Debounced search function
  const search = useCallback(
    (newQuery: string) => {
      cancel();

      setQueryState(newQuery);

      // Update URL immediately
      const newSearchParams = syncSearchStateToURL(newQuery, filters, searchParams);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });

      // Debounce the actual search
      timeoutRef.current = setTimeout(() => {
        lastSearchRef.current = { query: newQuery, filters };
        performSearch(newQuery, filters);
      }, debounceMs);
    },
    [cancel, debounceMs, filters, performSearch, router, searchParams]
  );

  // Update filters
  const updateFilters = useCallback(
    (newFilters: Partial<FilterState>) => {
      cancel();

      const updatedFilters = { ...filters, ...newFilters };
      setFiltersState(updatedFilters);

      // Update URL immediately
      const newSearchParams = syncSearchStateToURL(query, updatedFilters, searchParams);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });

      // Execute search immediately (no debounce for filter changes)
      lastSearchRef.current = { query, filters: updatedFilters };
      performSearch(query, updatedFilters);
    },
    [cancel, filters, performSearch, query, router, searchParams]
  );

  // Clear search
  const clear = useCallback(() => {
    cancel();
    setQueryState('');
    setFiltersState({});
    setResults([]);
    setError(null);
    lastSearchRef.current = null;

    // Clear URL
    router.replace('?', { scroll: false });
  }, [cancel, router]);

  // Update URL with current state
  const updateURL = useCallback(() => {
    const newSearchParams = syncSearchStateToURL(query, filters, searchParams);
    router.replace(`?${newSearchParams.toString()}`, { scroll: false });
  }, [query, filters, router, searchParams]);

  // Sync from URL on mount and when URL changes
  useEffect(() => {
    const urlQuery = searchParams.get('q') ?? '';
    const urlFilters = syncSearchStateFromURL(searchParams);

    // Only sync if URL changed (avoid infinite loops)
    if (urlQuery !== query) {
      setQueryState(urlQuery);
    }

    const filtersChanged =
      JSON.stringify(urlFilters) !== JSON.stringify(filters);
    if (filtersChanged) {
      setFiltersState(urlFilters);
    }

    // Perform search if URL changed
    if (
      (urlQuery !== lastSearchRef.current?.query ||
        JSON.stringify(urlFilters) !== JSON.stringify(lastSearchRef.current?.filters)) &&
      (urlQuery.trim() || Object.keys(urlFilters).length > 0)
    ) {
      lastSearchRef.current = { query: urlQuery, filters: urlFilters };
      performSearch(urlQuery, urlFilters);
    }
  }, [searchParams, query, filters, performSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    query,
    filters,
    results,
    isLoading,
    error,
    search,
    updateFilters,
    clear,
    cancel,
    updateURL,
  };
}
