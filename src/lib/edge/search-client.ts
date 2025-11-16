/**
 * Unified Search Edge Client - Hyper-optimized, future-proof
 * Wraps the /functions/v1/unified-search endpoint with full entity support
 *
 * Supports all entity types (content, company, job, user) with consistent
 * caching, error handling, and analytics tracking.
 */

import { getCacheTtl } from '@/src/lib/data/config/cache-config';
import { logger } from '@/src/lib/logger';
import type { Database } from '@/src/types/database.types';

const EDGE_SEARCH_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/unified-search`;

// Type definitions
type ContentSearchResult =
  Database['public']['Functions']['search_content_optimized']['Returns'][number];
type UnifiedSearchResult = Database['public']['Functions']['search_unified']['Returns'][number];

export type SearchEntity = 'content' | 'company' | 'job' | 'user';

export interface UnifiedSearchFilters {
  // Content filters
  categories?: string[];
  tags?: string[];
  authors?: string[];
  sort?: 'relevance' | 'popularity' | 'newest' | 'alphabetical';

  // Pagination
  limit?: number;
  offset?: number;
}

export interface UnifiedSearchOptions {
  query: string;
  entities?: SearchEntity[];
  filters?: UnifiedSearchFilters;
}

export interface UnifiedSearchResponse<T> {
  results: T[];
  query: string;
  filters: {
    categories?: string[];
    tags?: string[];
    authors?: string[];
    entities?: string[];
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
  searchType: 'content' | 'unified';
}

// Legacy types (backward compatibility)
export type SearchFilters = {
  sort?: 'relevance' | 'popularity' | 'newest' | 'alphabetical';
  p_categories?: string[];
  p_tags?: string[];
  p_authors?: string[];
  p_limit?: number;
  p_offset?: number;
};

export type SearchResult = ContentSearchResult;

/**
 * Unified search - supports all entity types
 * Hyper-optimized with edge caching and proper error handling
 */
export async function searchUnified<T = ContentSearchResult | UnifiedSearchResult>(
  options: UnifiedSearchOptions
): Promise<UnifiedSearchResponse<T>> {
  const { query, entities, filters = {} } = options;

  // Build URL params
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());

  // Add entities if provided (triggers multi-entity search)
  if (entities && entities.length > 0) {
    params.set('entities', entities.join(','));
  }

  // Add content filters (only used when no entities or entities includes 'content')
  if (filters.categories?.length) {
    params.set('categories', filters.categories.join(','));
  }
  if (filters.tags?.length) {
    params.set('tags', filters.tags.join(','));
  }
  if (filters.authors?.length) {
    params.set('authors', filters.authors.join(','));
  }
  if (filters.sort) {
    params.set('sort', filters.sort);
  }

  // Pagination
  params.set('limit', String(filters.limit ?? 50));
  if (filters.offset) {
    params.set('offset', String(filters.offset));
  }

  // Get cache TTL from Statsig (dynamic configuration)
  const ttl = await getCacheTtl('cache.search.ttl_seconds');

  // Build cache tags
  const cacheTags = ['search', ...(entities || ['content']).map((e) => `search-${e}`)];

  // Call edge function with proper caching
  const response = await fetch(`${EDGE_SEARCH_URL}?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
    next: {
      revalidate: ttl,
      tags: cacheTags,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Unified search failed', new Error(errorText), {
      status: response.status,
      url: EDGE_SEARCH_URL,
      query: query || '',
      entities: entities?.join(',') || '',
      filters: JSON.stringify(filters),
    });
    throw new Error(`Unified search failed: ${response.statusText}`);
  }

  const data = (await response.json()) as UnifiedSearchResponse<T>;
  return data;
}

/**
 * Content-only search (backward compatibility)
 * @deprecated Use searchUnified with entities: ['content'] instead
 */
export async function searchContent(query: string, filters: SearchFilters = {}) {
  // Build filters object without undefined values (for exactOptionalPropertyTypes)
  const cleanFilters: UnifiedSearchFilters = {};
  if (filters.p_categories) cleanFilters.categories = filters.p_categories;
  if (filters.p_tags) cleanFilters.tags = filters.p_tags;
  if (filters.p_authors) cleanFilters.authors = filters.p_authors;
  if (filters.sort) cleanFilters.sort = filters.sort;
  if (filters.p_limit !== undefined) cleanFilters.limit = filters.p_limit;
  if (filters.p_offset !== undefined) cleanFilters.offset = filters.p_offset;

  const result = await searchUnified<ContentSearchResult>({
    query,
    entities: ['content'],
    filters: cleanFilters,
  });

  // Return just results for backward compatibility
  return result.results;
}

/**
 * Company search (new helper)
 */
export async function searchCompaniesUnified(
  query: string,
  limit = 10
): Promise<UnifiedSearchResult[]> {
  const result = await searchUnified<UnifiedSearchResult>({
    query,
    entities: ['company'],
    filters: { limit },
  });
  return result.results;
}

/**
 * Job search (simple - no filters)
 * For filtered jobs, use getFilteredJobs() which calls filter_jobs RPC
 */
export async function searchJobsUnified(query: string, limit = 20): Promise<UnifiedSearchResult[]> {
  const result = await searchUnified<UnifiedSearchResult>({
    query,
    entities: ['job'],
    filters: { limit },
  });
  return result.results;
}

/**
 * User search (new helper)
 */
export async function searchUsersUnified(
  query: string,
  limit = 20
): Promise<UnifiedSearchResult[]> {
  const result = await searchUnified<UnifiedSearchResult>({
    query,
    entities: ['user'],
    filters: { limit },
  });
  return result.results;
}

/**
 * Client-side unified search (for use in 'use client' components)
 * Uses default TTL instead of dynamic Statsig config
 */
export async function searchUnifiedClient<T = ContentSearchResult | UnifiedSearchResult>(
  options: UnifiedSearchOptions
): Promise<UnifiedSearchResponse<T>> {
  const { query, entities, filters = {} } = options;

  // Build URL params
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());

  // Add entities if provided
  if (entities && entities.length > 0) {
    params.set('entities', entities.join(','));
  }

  // Add content filters
  if (filters.categories?.length) {
    params.set('categories', filters.categories.join(','));
  }
  if (filters.tags?.length) {
    params.set('tags', filters.tags.join(','));
  }
  if (filters.authors?.length) {
    params.set('authors', filters.authors.join(','));
  }
  if (filters.sort) {
    params.set('sort', filters.sort);
  }

  // Pagination
  params.set('limit', String(filters.limit ?? 50));
  if (filters.offset) {
    params.set('offset', String(filters.offset));
  }

  // Client-side: Use default TTL (3600s = 1 hour)
  // Edge function has its own 5min cache, so this is fine
  const DEFAULT_TTL = 3600;

  // Build cache tags
  const cacheTags = ['search', ...(entities || ['content']).map((e) => `search-${e}`)];

  // Call edge function
  const response = await fetch(`${EDGE_SEARCH_URL}?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
    next: {
      revalidate: DEFAULT_TTL,
      tags: cacheTags,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Unified search failed (client)', new Error(errorText), {
      status: response.status,
      url: EDGE_SEARCH_URL,
      query: query || '',
      entities: entities?.join(',') || '',
      filters: JSON.stringify(filters),
    });
    throw new Error(`Unified search failed: ${response.statusText}`);
  }

  const data = (await response.json()) as UnifiedSearchResponse<T>;
  return data;
}
