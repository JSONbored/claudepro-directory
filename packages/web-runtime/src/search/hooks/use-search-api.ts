'use client';

/**
 * useSearchAPI Hook - API Integration for useSearch
 *
 * Provides a ready-to-use search function that integrates with the search API route.
 * Can be passed directly to useSearch's onSearch option.
 *
 * @module web-runtime/search/hooks/use-search-api
 */

import type { DisplayableContent, FilterState } from '@heyclaude/web-runtime/types/component.types';
import { logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';

export interface UseSearchAPIOptions {
  /** Base URL for search API (default: '/api/search') */
  apiPath?: string;
  /** Default limit for results (default: 50) */
  limit?: number;
  /** Default offset for pagination (default: 0) */
  offset?: number;
}

/**
 * Creates a search function that can be passed to useSearch hook
 *
 * @example
 * ```tsx
 * const { search, results, isLoading } = useSearch({
 *   onSearch: useSearchAPI(),
 * });
 * ```
 */
export function useSearchAPI(options: UseSearchAPIOptions = {}) {
  const { apiPath = '/api/search', limit = 50, offset = 0 } = options;

  return async (
    query: string,
    filters: FilterState,
    signal?: AbortSignal
  ): Promise<DisplayableContent[]> => {
    try {
      // Check if request was aborted before starting
      if (signal?.aborted) {
        return [];
      }
      
      // Build query parameters
      const searchParams = new URLSearchParams({
        q: query.trim(),
        entities: 'content', // Use unified search
        limit: limit.toString(),
        offset: offset.toString(),
      });

      // Map FilterState sort to API route sort
      if (filters.sort) {
        const sortMap: Record<string, 'relevance' | 'popularity' | 'newest' | 'alphabetical'> = {
          relevance: 'relevance',
          popularity: 'popularity',
          newest: 'newest',
          alphabetical: 'alphabetical',
          trending: 'relevance', // Map trending to relevance
        };
        const mappedSort = sortMap[filters.sort];
        if (mappedSort) {
          searchParams.set('sort', mappedSort);
        }
      }

      // Add category filter
      if (filters.category) {
        searchParams.set('categories', filters.category);
      }

      // Add tag filters
      if (filters.tags && filters.tags.length > 0) {
        searchParams.set('tags', filters.tags.join(','));
      }

      // Add author filter
      if (filters.author) {
        searchParams.set('authors', filters.author);
      }

      // Add date range filter
      if (filters.dateRange) {
        searchParams.set('dateRange', filters.dateRange);
      }

      // Add popularity filter
      if (filters.popularity && filters.popularity.length === 2) {
        searchParams.set('popularity', `${filters.popularity[0]},${filters.popularity[1]}`);
      }

      // Check if request was aborted
      if (signal?.aborted) {
        return [];
      }

      const fetchUrl = `${apiPath}?${searchParams.toString()}`;

      // Call API route
      const response = await fetch(fetchUrl, {
        method: 'GET',
        ...(signal ? { signal } : {}),
      });

      if (!response.ok) {
        const error = new Error(`Search API returned ${response.status}: ${response.statusText}`);
        logClientError(
          '[useSearchAPI] Search API error response',
          normalizeError(error, 'Search API error'),
          'useSearchAPI.error',
          {
            component: 'useSearchAPI',
            action: 'api-call-error',
            url: fetchUrl,
            status: response.status,
            statusText: response.statusText,
          }
        );
        throw error;
      }

      const result = await response.json();

      // Check again after API call
      if (signal?.aborted) {
        return [];
      }

      // Extract results from API response
      const results = (Array.isArray(result.results) ? result.results : []) as DisplayableContent[];
      
      return results;
    } catch (error) {
      // Ignore AbortError
      if (error instanceof Error && error.name === 'AbortError') {
        return [];
      }

      // Log other errors
      const normalized = normalizeError(error, 'Search API call failed');
      logClientError(
        '[useSearchAPI] Search failed',
        normalized,
        'useSearchAPI.search',
        {
          component: 'useSearchAPI',
          action: 'search-error',
          query: query.trim().slice(0, 100),
        }
      );

      throw normalized;
    }
  };
}
