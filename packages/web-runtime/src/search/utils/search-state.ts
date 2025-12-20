/**
 * Search State Utilities - URL ↔ State Synchronization
 *
 * Handles conversion between URL search parameters and FilterState.
 * Provides type-safe URL state management for the search system.
 *
 * @module web-runtime/search/utils/search-state
 */

import type { FilterState } from '@heyclaude/web-runtime/types/component.types';
import type { ReadonlyURLSearchParams } from 'next/navigation';

/**
 * Sync search state from URL search params to FilterState
 *
 * @param searchParams - URL search parameters
 * @returns FilterState object parsed from URL
 */
export function syncSearchStateFromURL(searchParams: ReadonlyURLSearchParams): FilterState {
  const filters: FilterState = {};

  // Parse sort
  const sort = searchParams.get('sort');
  if (sort && ['relevance', 'popularity', 'newest', 'alphabetical'].includes(sort)) {
    // Type-safe assignment for exactOptionalPropertyTypes (use bracket notation for index signature)
    (filters as Record<string, unknown>)['sort'] = sort as FilterState['sort'];
  }

  // Parse category (single or comma-separated)
  const category = searchParams.get('category');
  if (category) {
    const categories = category.split(',').filter(Boolean);
    if (categories.length === 1) {
      // Type-safe assignment for exactOptionalPropertyTypes (use bracket notation for index signature)
      (filters as Record<string, unknown>)['category'] = categories[0] as FilterState['category'];
    }
  }

  // Parse tags (comma-separated)
  const tags = searchParams.get('tags');
  if (tags) {
    filters.tags = tags.split(',').filter(Boolean);
  }

  // Parse author
  const author = searchParams.get('author');
  if (author) {
    filters.author = author;
  }

  // Parse dateRange
  const dateRange = searchParams.get('dateRange');
  if (dateRange) {
    filters.dateRange = dateRange;
  }

  // Parse popularity (format: "min,max")
  const popularity = searchParams.get('popularity');
  if (popularity) {
    const [min, max] = popularity.split(',').map(Number);
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      filters.popularity = [min, max] as [number, number];
    }
  }

  return filters;
}

/**
 * Sync search state to URL search params
 *
 * @param query - Search query string
 * @param filters - FilterState object
 * @param currentParams - Current URL search params (to preserve other params)
 * @returns URLSearchParams with search state
 */
export function syncSearchStateToURL(
  query: string,
  filters: FilterState,
  currentParams: ReadonlyURLSearchParams | URLSearchParams
): URLSearchParams {
  const params = new URLSearchParams(currentParams.toString());

  // Set query
  if (query.trim()) {
    params.set('q', query.trim());
  } else {
    params.delete('q');
  }

  // Set sort
  if (filters.sort) {
    params.set('sort', filters.sort);
  } else {
    params.delete('sort');
  }

  // Set category
  if (filters.category) {
    params.set('category', filters.category);
  } else {
    params.delete('category');
  }

  // Set tags (comma-separated)
  if (filters.tags && filters.tags.length > 0) {
    params.set('tags', filters.tags.join(','));
  } else {
    params.delete('tags');
  }

  // Set author
  if (filters.author) {
    params.set('author', filters.author);
  } else {
    params.delete('author');
  }

  // Set dateRange
  if (filters.dateRange) {
    params.set('dateRange', filters.dateRange);
  } else {
    params.delete('dateRange');
  }

  // Set popularity (format: "min,max")
  if (filters.popularity && filters.popularity.length === 2) {
    params.set('popularity', `${filters.popularity[0]},${filters.popularity[1]}`);
  } else {
    params.delete('popularity');
  }

  return params;
}

/**
 * Create a shareable search URL
 *
 * @param query - Search query string
 * @param filters - FilterState object
 * @param basePath - Base path (default: '/search')
 * @returns Shareable URL string
 */
export function createSearchURL(query: string, filters: FilterState, basePath = '/search'): string {
  const params = syncSearchStateToURL(query, filters, new URLSearchParams());
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}
