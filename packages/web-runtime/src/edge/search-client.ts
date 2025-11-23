'use server';

import type { Database } from '@heyclaude/database-types';
import { SearchService } from '@heyclaude/data-layer';
import { fetchCached } from '../cache/fetch-cached.ts';
import { SupabaseClient } from '@supabase/supabase-js';

type ContentSearchResult =
  Database['public']['Functions']['search_content_optimized']['Returns'][number];
type UnifiedSearchResult = Database['public']['Functions']['search_unified']['Returns'][number];

export type SearchEntity = 'content' | 'company' | 'job' | 'user';

export interface UnifiedSearchFilters {
  categories?: string[];
  tags?: string[];
  authors?: string[];
  sort?: 'relevance' | 'popularity' | 'newest' | 'alphabetical';
  job_category?: string;
  job_employment?: string;
  job_experience?: string;
  job_remote?: boolean;
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
    job_category?: string;
    job_employment?: string;
    job_experience?: string;
    job_remote?: boolean;
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

export type SearchFilters = {
  sort?: 'relevance' | 'popularity' | 'newest' | 'alphabetical';
  p_categories?: string[];
  p_tags?: string[];
  p_authors?: string[];
  p_limit?: number;
  p_offset?: number;
};

export type SearchResult = ContentSearchResult;

async function executeSearch<T>(
  options: UnifiedSearchOptions,
  cacheTags: string[],
): Promise<UnifiedSearchResponse<T>> {
  
  return fetchCached(
    async (client: SupabaseClient<Database>) => {
        const start = performance.now();
        const service = new SearchService(client);
        
        const entities = options.entities?.map(e => e as string) ?? ['content'];
        const results = await service.searchUnified(options.query, entities, options.filters);
        
        const end = performance.now();
        const totalTime = end - start;
        
        // Explicitly construct response object without undefined properties where possible
        const response: UnifiedSearchResponse<T> = {
           results: results as unknown as T[],
           query: options.query,
           filters: {
              ...(options.filters?.categories ? { categories: options.filters.categories } : {}),
              ...(options.filters?.tags ? { tags: options.filters.tags } : {}),
              ...(options.filters?.authors ? { authors: options.filters.authors } : {}),
              ...(options.entities ? { entities: options.entities.map(e => e as string) } : {}),
              ...(options.filters?.sort ? { sort: options.filters.sort } : {}),
              ...(options.filters?.job_category ? { job_category: options.filters.job_category } : {}),
              ...(options.filters?.job_employment ? { job_employment: options.filters.job_employment } : {}),
              ...(options.filters?.job_experience ? { job_experience: options.filters.job_experience } : {}),
              ...(options.filters?.job_remote !== undefined ? { job_remote: options.filters.job_remote } : {})
           },
           pagination: {
              total: results.length, 
              limit: options.filters?.limit ?? 20,
              offset: options.filters?.offset ?? 0,
              hasMore: results.length >= (options.filters?.limit ?? 20)
           },
           performance: {
              dbTime: totalTime,
              totalTime: totalTime
           },
           searchType: entities.length === 1 && entities[0] === 'content' ? 'content' : 'unified'
        };
        return response;
    },
    {
       key: `unified-search-${JSON.stringify(options)}`,
       tags: cacheTags,
       ttlKey: 'cache.content_list.ttl_seconds',
       fallback: {
           results: [],
           query: options.query,
           filters: {},
           pagination: { total: 0, limit: 0, offset: 0, hasMore: false },
           performance: { dbTime: 0, totalTime: 0 },
           searchType: 'unified'
       }
    }
  );
}

export async function searchUnified<T = ContentSearchResult | UnifiedSearchResult>(
  options: UnifiedSearchOptions
): Promise<UnifiedSearchResponse<T>> {
  const { entities } = options;
  const cacheTags = ['search', ...(entities || ['content']).map((e) => `search-${e}`)];
  return executeSearch<T>(options, cacheTags);
}

export async function searchContent(query: string, filters: SearchFilters = {}) {
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

  return result.results;
}

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

export async function searchJobsUnified(query: string, limit = 20): Promise<UnifiedSearchResult[]> {
  const result = await searchUnified<UnifiedSearchResult>({
    query,
    entities: ['job'],
    filters: { limit },
  });
  return result.results;
}

export async function searchUsersUnified(query: string, limit = 20): Promise<UnifiedSearchResult[]> {
  const result = await searchUnified<UnifiedSearchResult>({
    query,
    entities: ['user'],
    filters: { limit },
  });
  return result.results;
}

export async function searchUnifiedClient<T = ContentSearchResult | UnifiedSearchResult>(
  options: UnifiedSearchOptions
): Promise<UnifiedSearchResponse<T>> {
  return searchUnified<T>(options);
}
