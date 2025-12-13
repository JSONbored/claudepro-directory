'use client';

/**
 * SearchProvider - Unified Search Context
 *
 * Provides unified search state management with URL synchronization.
 * This is the foundation of the new search architecture.
 *
 * Features:
 * - Unified search state (query, filters, results)
 * - URL synchronization (shareable search URLs) - Debounced for performance
 * - Request management (cancellation, deduplication)
 * - Loading and error states
 * - Optimized to prevent blocking during typing
 *
 * Performance optimizations:
 * - Debounced search execution (300ms)
 * - Debounced URL updates (300ms, batched with search)
 * - startTransition for non-urgent updates
 * - Split context value to reduce re-renders
 *
 * @module web-runtime/search/context/search-provider
 */

import type { DisplayableContent, FilterState } from '@heyclaude/web-runtime/types/component.types';
import { useRouter, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef, startTransition } from 'react';
import { normalizeError } from '@heyclaude/shared-runtime';

import { syncSearchStateFromURL, syncSearchStateToURL } from '../utils/search-state';

export interface SearchContextValue {
  // State
  query: string;
  filters: FilterState;
  results: DisplayableContent[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: FilterState | ((prev: FilterState) => FilterState)) => void;
  clearSearch: () => void;

  // Internal setters (for useSearch hook)
  setResults: (results: DisplayableContent[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;

  // URL sync
  syncToURL: () => void;
  syncFromURL: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export interface SearchProviderProps {
  children: React.ReactNode;
  defaultQuery?: string;
  defaultFilters?: FilterState;
  debounceMs?: number;
  onSearch?: (query: string, filters: FilterState) => void;
}

/**
 * SearchProvider - Provides unified search state and URL synchronization
 *
 * @example
 * ```tsx
 * <SearchProvider>
 *   <SearchBar />
 *   <SearchResults />
 * </SearchProvider>
 * ```
 */
export function SearchProvider({
  children,
  defaultQuery = '',
  defaultFilters = {},
  debounceMs = 300,
  onSearch,
}: SearchProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL or defaults
  const [query, setQueryState] = useState<string>(() => {
    const urlQuery = searchParams.get('q') ?? '';
    return urlQuery || defaultQuery;
  });

  const [filters, setFiltersState] = useState<FilterState>(() => {
    const urlFilters = syncSearchStateFromURL(searchParams);
    return Object.keys(urlFilters).length > 0 ? urlFilters : defaultFilters;
  });

  const [results, setResults] = useState<DisplayableContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for debouncing and cancellation
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const urlTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<{ query: string; filters: FilterState } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Track update source to prevent circular updates
  const isUpdatingFromUserRef = useRef(false);
  const lastUrlQueryRef = useRef<string>('');
  const lastUrlFiltersRef = useRef<string>('');
  // Initialize with current URL
  const lastRouterUrlRef = useRef<string>(`?${searchParams.toString()}`);

  // Expose setters for useSearch hook to update results
  const setResultsState = useCallback((newResults: DisplayableContent[]) => {
    setResults(newResults);
  }, []);

  const setIsLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setErrorState = useCallback((err: Error | null) => {
    setError(err);
  }, []);

  // Sync from URL on mount and when URL changes (OPTIMIZED: no circular dependency)
  // CRITICAL FIX: Only sync from URL when input is NOT focused (browser navigation)
  useEffect(() => {
    const urlQuery = searchParams.get('q') ?? '';
    const urlFilters = syncSearchStateFromURL(searchParams);
    
    // Skip if we just updated from user input (prevents circular updates)
    if (isUpdatingFromUserRef.current) {
      return;
    }

    // Serialize filters for comparison
    const urlFiltersKey = JSON.stringify(urlFilters);
    
    // Only update if URL actually changed
    const urlQueryChanged = urlQuery !== lastUrlQueryRef.current;
    const urlFiltersChanged = urlFiltersKey !== lastUrlFiltersRef.current;
    
    if (!urlQueryChanged && !urlFiltersChanged) {
      return; // No change, skip update
    }

    // Update refs to track current URL state
    lastUrlQueryRef.current = urlQuery;
    lastUrlFiltersRef.current = urlFiltersKey;

    // CRITICAL: Only update query state if input is not focused
    // This prevents overwriting user input during typing
    const isInputFocused = document.activeElement?.tagName === 'INPUT' && 
                          (document.activeElement as HTMLInputElement).type === 'search';
    
    if (!isInputFocused) {
      // Safe to update - user is not typing
      setQueryState((currentQuery) => {
        if (urlQuery !== currentQuery) {
          return urlQuery;
        }
        return currentQuery;
      });
    }

    setFiltersState((currentFilters) => {
      const currentFiltersKey = JSON.stringify(currentFilters);
      if (urlFiltersKey !== currentFiltersKey) {
        return urlFilters;
      }
      return currentFilters;
    });
  }, [searchParams]); // CRITICAL: Only depend on searchParams, not query/filters (prevents infinite loop)

  // Update query and sync to URL (debounced, OPTIMIZED)
  // PERFORMANCE FIX: Removed excessive logging, simplified logic
  const setQuery = useCallback(
    (newQuery: string) => {
      // Skip if query hasn't actually changed
      setQueryState((currentQuery) => {
        if (newQuery === currentQuery) {
          return currentQuery;
        }
        return newQuery;
      });
      
      setError(null);

      // Mark as user update to prevent sync effect from running
      isUpdatingFromUserRef.current = true;
      
      // Reset flag after a brief delay
      setTimeout(() => {
        isUpdatingFromUserRef.current = false;
      }, 50);

      // Cancel pending URL update
      if (urlTimeoutRef.current) {
        clearTimeout(urlTimeoutRef.current);
      }

      // Check if URL would actually change before scheduling update
      const currentUrlQuery = searchParams.get('q') ?? '';
      const trimmedQuery = newQuery.trim();
      const urlWillChange = trimmedQuery !== currentUrlQuery;

      // Only update URL if it will actually change
      if (urlWillChange) {
        // Debounce URL sync (batched with search)
        urlTimeoutRef.current = setTimeout(() => {
          startTransition(() => {
            const newSearchParams = new URLSearchParams(searchParams.toString());
            if (trimmedQuery) {
              newSearchParams.set('q', trimmedQuery);
            } else {
              newSearchParams.delete('q');
            }
            const newUrl = `?${newSearchParams.toString()}`;
            
            // Only call router.replace if URL actually changed
            if (newUrl !== lastRouterUrlRef.current) {
              lastRouterUrlRef.current = newUrl;
              router.replace(newUrl, { scroll: false });
            }
          });
        }, debounceMs);
      }
    },
    [router, searchParams, debounceMs]
  );

  // Update filters and sync to URL (debounced, OPTIMIZED)
  const setFilters = useCallback(
    (newFilters: FilterState | ((prev: FilterState) => FilterState)) => {
      setFiltersState((prev) => {
        const updated =
          typeof newFilters === 'function' ? newFilters(prev) : newFilters;
        
        // Skip if filters haven't actually changed (prevent unnecessary updates)
        const prevKey = JSON.stringify(prev);
        const updatedKey = JSON.stringify(updated);
        if (prevKey === updatedKey) {
          return prev; // Return same reference to prevent re-render
        }
        
        setError(null);

        // Mark as user update to prevent sync effect from running
        isUpdatingFromUserRef.current = true;
        
        // Reset flag after a brief delay
        setTimeout(() => {
          isUpdatingFromUserRef.current = false;
        }, 50);

        // Cancel pending URL update
        if (urlTimeoutRef.current) {
          clearTimeout(urlTimeoutRef.current);
        }

        // Debounce URL sync
        urlTimeoutRef.current = setTimeout(() => {
          startTransition(() => {
            const newSearchParams = syncSearchStateToURL(
              query,
              updated,
              searchParams
            );
            const newUrl = `?${newSearchParams.toString()}`;
            // Only call router.replace if URL actually changed
            if (newUrl !== lastRouterUrlRef.current) {
              lastRouterUrlRef.current = newUrl;
              router.replace(newUrl, { scroll: false });
            }
          });
        }, debounceMs);

        return updated;
      });
    },
    [query, router, searchParams, debounceMs]
  );

  // Clear search (query and filters)
  const clearSearch = useCallback(() => {
    // Cancel pending operations
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (urlTimeoutRef.current) {
      clearTimeout(urlTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setQueryState('');
    setFiltersState({});
    setResults([]);
    setError(null);

    // Clear URL params immediately (no debounce for clear)
    lastRouterUrlRef.current = '?';
    startTransition(() => {
      router.replace('?', { scroll: false });
    });
  }, [router]);

  // Sync current state to URL (OPTIMIZED: only if changed)
  const syncToURL = useCallback(() => {
    const newSearchParams = syncSearchStateToURL(query, filters, searchParams);
    const newUrl = `?${newSearchParams.toString()}`;
    // Only call router.replace if URL actually changed
    if (newUrl !== lastRouterUrlRef.current) {
      lastRouterUrlRef.current = newUrl;
      startTransition(() => {
        router.replace(newUrl, { scroll: false });
      });
    }
  }, [query, filters, router, searchParams]);

  // Sync from URL to state
  const syncFromURL = useCallback(() => {
    const urlQuery = searchParams.get('q') ?? '';
    const urlFilters = syncSearchStateFromURL(searchParams);

    setQueryState(urlQuery);
    setFiltersState(urlFilters);
  }, [searchParams]);

  // Call onSearch callback when query or filters change (debounced, non-blocking, OPTIMIZED)
  // PERFORMANCE FIX: Removed excessive logging
  useEffect(() => {
    if (!onSearch) {
      return;
    }

    // Cancel previous search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check if this is a duplicate search
    const searchKey = JSON.stringify({ query, filters });
    const lastSearchKey = lastSearchRef.current ? JSON.stringify(lastSearchRef.current) : null;
    const isDuplicate = lastSearchKey === searchKey;
    
    if (isDuplicate) {
      return; // Skip duplicate search
    }

    const performSearch = async () => {
      // Early return for empty search
      if (!query.trim() && Object.keys(filters).length === 0) {
        setResults([]);
        setIsLoading(false);
        setError(null);
        lastSearchRef.current = { query, filters };
        return;
      }

      // Create new abort controller
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);
      // FIX: Don't clear results immediately - keep previous results visible while searching
      // This prevents flashing "no results" when user double-clicks and types new query
      // Results will be updated when new search completes

      try {
        const searchResults = await onSearch(query, filters);
        
        // Check if request was aborted
        if (controller.signal.aborted) {
          return;
        }

        // Only update if still the current search (prevent stale results)
        const currentSearchKey = JSON.stringify({ query, filters });
        if (currentSearchKey === searchKey) {
          // Update results (this will replace previous results)
          if (Array.isArray(searchResults)) {
            setResults(searchResults);
          } else {
            setResults([]);
          }
          setIsLoading(false);
          setError(null);
          lastSearchRef.current = { query, filters };
        }
      } catch (err) {
        const normalized = normalizeError(err, 'Search failed');
        
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        
        // Only set error if still the current search
        const currentSearchKey = JSON.stringify({ query, filters });
        if (currentSearchKey === searchKey) {
          setError(normalized);
          setIsLoading(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          abortControllerRef.current = null;
        }
      }
    };

    // Debounce search (non-blocking)
    searchTimeoutRef.current = setTimeout(() => {
      startTransition(() => {
        performSearch();
      });
    }, debounceMs);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, filters, onSearch, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (urlTimeoutRef.current) {
        clearTimeout(urlTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoize action callbacks (stable references)
  const actions = useMemo(
    () => ({
      setQuery,
      setFilters,
      clearSearch,
      setResults: setResultsState,
      setIsLoading: setIsLoadingState,
      setError: setErrorState,
      syncToURL,
      syncFromURL,
    }),
    [
      setQuery,
      setFilters,
      clearSearch,
      setResultsState,
      setIsLoadingState,
      setErrorState,
      syncToURL,
      syncFromURL,
    ]
  );

  // Split context value to reduce re-renders (state vs actions)
  const value: SearchContextValue = useMemo(
    () => ({
      // State (changes frequently)
      query,
      filters,
      results,
      isLoading,
      error,
      // Actions (stable references)
      ...actions,
    }),
    [query, filters, results, isLoading, error, actions]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

/**
 * Hook to access search context
 * @throws Error if used outside SearchProvider
 */
export function useSearchContext(): SearchContextValue {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within SearchProvider');
  }
  return context;
}
