'use client';

/**
 * useSearchAPI Hook - API Integration for useSearch
 *
 * Provides a ready-to-use search function that integrates with the search API route.
 * Can be passed directly to useSearch's onSearch option.
 *
 * @module web-runtime/search/hooks/use-search-api
 */

import { createApiClient } from '@heyclaude/database-types/api-client';
import type { DisplayableContent, FilterState } from '@heyclaude/web-runtime/types/component.types';
import { logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';

export interface UseSearchAPIOptions {
  /** Base URL for search API (default: '/api/v1') */
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
  const { apiPath = '/api/v1', limit = 50, offset = 0 } = options;

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

      // Create API client instance
      const client = createApiClient(apiPath, {
        axiosConfig: {
          ...(signal ? { signal } : {}), // Support abort signals (only include if defined)
        },
      });

      // Map FilterState sort to API route sort
      let sort: 'relevance' | 'popularity' | 'newest' | 'alphabetical' | undefined;
      if (filters.sort) {
        const sortMap: Record<string, 'relevance' | 'popularity' | 'newest' | 'alphabetical'> = {
          relevance: 'relevance',
          popularity: 'popularity',
          newest: 'newest',
          alphabetical: 'alphabetical',
          trending: 'relevance', // Map trending to relevance
        };
        sort = sortMap[filters.sort];
      }

      // Build query parameters for the generated client
      // Only include properties that are in the generated client's expected type
      // (dateRange and popularity are not in the API schema, so we skip them)
      const searchParams: {
        q?: string;
        limit?: number;
        offset?: number;
        sort?: 'relevance' | 'popularity' | 'newest' | 'alphabetical';
        categories?: string;
        tags?: string;
        authors?: string;
        entities?: string;
        job_category?:
          | 'engineering'
          | 'design'
          | 'product'
          | 'marketing'
          | 'sales'
          | 'support'
          | 'research'
          | 'data'
          | 'operations'
          | 'leadership'
          | 'consulting'
          | 'education'
          | 'other';
        job_employment?: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
        job_experience?: string;
        job_remote?: 'true' | 'false';
      } = {};

      // Only add properties that have values (exactOptionalPropertyTypes requirement)
      if (query.trim()) {
        searchParams.q = query.trim();
      }
      searchParams.entities = 'content'; // Use unified search
      searchParams.limit = limit;
      searchParams.offset = offset;
      if (sort) {
        searchParams.sort = sort;
      }
      if (filters.category) {
        searchParams.categories = filters.category;
      }
      if (filters.tags && filters.tags.length > 0) {
        searchParams.tags = filters.tags.join(',');
      }
      if (filters.author) {
        searchParams.authors = filters.author;
      }
      // Note: dateRange and popularity filters are not in the API schema, so we skip them

      // Check if request was aborted before API call
      if (signal?.aborted) {
        return [];
      }

      // Call API using generated client
      // Zodios expects query parameters in a 'queries' object for GET requests
      const result = await client.search({ queries: searchParams });

      // Check again after API call
      if (signal?.aborted) {
        return [];
      }

      // Extract results from API response
      // Response schema is now properly extracted and typed
      if (
        result &&
        typeof result === 'object' &&
        'results' in result &&
        Array.isArray(result.results)
      ) {
        return result.results as DisplayableContent[];
      }

      return [];
    } catch (error) {
      // Ignore AbortError
      if (error instanceof Error && error.name === 'AbortError') {
        return [];
      }

      // Log other errors
      const normalized = normalizeError(error, 'Search API call failed');
      logClientError('[useSearchAPI] Search failed', normalized, 'useSearchAPI.search', {
        component: 'useSearchAPI',
        action: 'search-error',
        query: query.trim().slice(0, 100),
      });

      throw normalized;
    }
  };
}
