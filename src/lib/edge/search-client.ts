/**
 * Search Edge Function Client
 * Type-safe wrapper for unified-search edge function
 */

import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';
import type { Database } from '@/src/types/database.types';

const EDGE_BASE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;

// Type definitions matching edge function responses
type SearchResult = Database['public']['Functions']['search_content_optimized']['Returns'][number];

export interface SearchFilters {
  categories?: string[];
  tags?: string[];
  authors?: string[];
  sort?: 'relevance' | 'popularity' | 'newest' | 'alphabetical';
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  filters: {
    categories?: string[];
    tags?: string[];
    authors?: string[];
    sort?: string;
  };
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  performance: {
    dbTime: number;
    totalTime: number;
  };
}

export interface AutocompleteSuggestion {
  text: string;
  searchCount: number;
  isPopular: boolean;
}

export interface AutocompleteResponse {
  suggestions: AutocompleteSuggestion[];
  query: string;
}

export interface SearchFacet {
  category: string;
  contentCount: number;
  tags: string[];
  authors: string[];
}

export interface FacetsResponse {
  facets: SearchFacet[];
}

/**
 * Search content via unified-search edge function
 * Includes edge caching (5min) and analytics tracking
 *
 * @param query - Search query string
 * @param filters - Optional filters (categories, tags, authors, sort, pagination)
 * @returns Search results with metadata
 *
 * @example
 * ```ts
 * const results = await searchContent('next.js', {
 *   categories: ['guides'],
 *   sort: 'relevance',
 *   limit: 20
 * });
 * ```
 */
export async function searchContent(
  query: string,
  filters: SearchFilters = {}
): Promise<SearchResponse> {
  try {
    // Build query params
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.categories?.length) params.set('categories', filters.categories.join(','));
    if (filters.tags?.length) params.set('tags', filters.tags.join(','));
    if (filters.authors?.length) params.set('authors', filters.authors.join(','));
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.limit) params.set('limit', filters.limit.toString());
    if (filters.offset) params.set('offset', filters.offset.toString());

    // Get auth token if available (for analytics tracking)
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch(`${EDGE_BASE_URL}/unified-search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Search edge function error', errorText, {
        query,
        status: response.status,
      });

      try {
        const error = JSON.parse(errorText);
        throw new Error(error.message || 'Search failed');
      } catch {
        throw new Error(`Search failed: ${response.status}`);
      }
    }

    return response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error : String(error);
    logger.error('Search client error', errorMessage, { query });
    throw error;
  }
}

/**
 * Get autocomplete suggestions via unified-search edge function
 * Returns smart suggestions from search history + content titles
 * Cached for 1 hour at edge
 *
 * @param query - Partial search query (min 2 characters)
 * @param limit - Max suggestions to return (default 10, max 20)
 * @returns Autocomplete suggestions with popularity indicators
 *
 * @example
 * ```ts
 * const suggestions = await getSearchAutocomplete('nex', 10);
 * // Returns: [{ text: 'next.js', searchCount: 42, isPopular: true }, ...]
 * ```
 */
export async function getSearchAutocomplete(
  query: string,
  limit = 10
): Promise<AutocompleteResponse> {
  try {
    // Validate query length
    if (query.length < 2) {
      return { suggestions: [], query };
    }

    const params = new URLSearchParams();
    params.set('q', query);
    params.set('limit', Math.min(limit, 20).toString());

    const response = await fetch(
      `${EDGE_BASE_URL}/unified-search/autocomplete?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Autocomplete edge function error', errorText, {
        query,
        limit,
        status: response.status,
      });

      // Graceful fallback: return empty suggestions
      return { suggestions: [], query };
    }

    return response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error : String(error);
    logger.error('Autocomplete client error', errorMessage, { query, limit });
    // Graceful fallback: return empty suggestions
    return { suggestions: [], query };
  }
}

/**
 * Get available search facets (filters) via unified-search edge function
 * Returns categories with their available tags and authors
 * Cached for 1 hour at edge
 *
 * @returns Available search facets grouped by category
 *
 * @example
 * ```ts
 * const facets = await getSearchFacets();
 * // Returns: { facets: [{ category: 'guides', contentCount: 42, tags: [...], authors: [...] }] }
 * ```
 */
export async function getSearchFacets(): Promise<FacetsResponse> {
  try {
    const response = await fetch(`${EDGE_BASE_URL}/unified-search/facets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Facets edge function error', errorText, {
        status: response.status,
      });

      // Graceful fallback: return empty facets
      return { facets: [] };
    }

    return response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error : String(error);
    logger.error('Facets client error', errorMessage);
    // Graceful fallback: return empty facets
    return { facets: [] };
  }
}
