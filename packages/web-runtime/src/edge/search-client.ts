'use server';

import type { Database } from '@heyclaude/database-types';
import { SearchService } from '@heyclaude/data-layer';
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
  searchType: 'content' | 'unified' | 'jobs';
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

async function executeSearchDirect<T>(
  options: UnifiedSearchOptions,
): Promise<UnifiedSearchResponse<T>> {
  const { trackPerformance } = await import('../utils/performance-metrics.ts');
  const { createSupabaseAnonClient } = await import('../supabase/server-anon.ts');
  const { logger } = await import('../logger.ts');
  const { generateRequestId } = await import('../utils/request-id.ts');
  
  // Create request-scoped child logger to avoid race conditions
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'executeSearchDirect',
    module: 'edge/search-client',
  });
  
  const { result } = await trackPerformance(
    async () => {
      const client = createSupabaseAnonClient();
      // Type compatibility: SupabaseAnonClient is compatible with SupabaseClient<Database>
      // Both are created from the same underlying Supabase client factory with Database type
      const typedClient: SupabaseClient<Database> = client as SupabaseClient<Database>;
      const service = new SearchService(typedClient);
      
      // Type guard: Ensure entities are strings
      const entities = options.entities?.map((e): string => {
        if (typeof e === 'string') {
          return e;
        }
        return String(e);
      }) ?? ['content'];
      
      // search_unified only accepts: p_query, p_entities, p_limit, p_offset
      // Categories, tags, and authors filtering must be done client-side after search
      const serviceResponse = await service.searchUnified({
        p_query: options.query,
        p_entities: entities,
        p_limit: options.filters?.limit ?? 20,
        p_offset: options.filters?.offset ?? 0
      });
      
      // Type guard: Validate service response structure
      // SearchService.searchUnified returns { data: UnifiedSearchResult[] | null, total_count: number }
      if (!serviceResponse || typeof serviceResponse !== 'object') {
        return { results: [], totalCount: 0 };
      }
      
      const hasData = 'data' in serviceResponse;
      const hasTotalCount = 'total_count' in serviceResponse;
      
      if (!hasData || !hasTotalCount) {
        return { results: [], totalCount: 0 };
      }
      
      const data = serviceResponse.data;
      
      // Type guard: Ensure results is an array
      let results: UnifiedSearchResult[] = Array.isArray(data) 
        ? data.filter((item): item is UnifiedSearchResult => 
            item !== null && typeof item === 'object' && 'id' in item
          )
        : [];
      
      // Client-side filtering for categories, tags, and authors (since search_unified doesn't support these)
      if (options.filters?.categories && options.filters.categories.length > 0) {
        results = results.filter((item) => 
          item.category && options.filters?.categories?.includes(item.category)
        );
      }
      
      if (options.filters?.tags && options.filters.tags.length > 0) {
        results = results.filter((item) => {
          if (!item.tags || !Array.isArray(item.tags)) return false;
          return options.filters?.tags?.some((tag) => item.tags?.includes(tag));
        });
      }
      
      // Note: UnifiedSearchResult doesn't have an 'author' field
      // Author filtering would need to be done at the database level or removed
      // For now, skip author filtering on client side
      // if (options.filters?.authors && options.filters.authors.length > 0) {
      //   results = results.filter((item) => 
      //     'author' in item && item.author && options.filters?.authors?.includes(item.author)
      //   );
      // }
      
      // Update totalCount to reflect filtered results
      const filteredTotalCount = results.length;
      
      return { results, totalCount: filteredTotalCount };
    },
    {
      operation: 'executeSearchDirect',
      logger: reqLogger, // Use child logger to avoid passing requestId/operation repeatedly
      requestId, // Pass requestId for return value
      logMeta: {
        query: options.query,
        entities: options.entities,
        limit: options.filters?.limit ?? 20,
        offset: options.filters?.offset ?? 0,
      },
      logLevel: 'info', // Log all operations for observability
    }
  );
  
  const { results, totalCount } = result;
  // Duration tracking would need to be added to executeSearchDirect if needed
  const totalTime = 0;
  
  // Explicitly construct response object without undefined properties where possible
  // Type guard: results is already validated as UnifiedSearchResult[], safe to cast to T[]
  // This is safe because T extends UnifiedSearchResult in practice
  const response: UnifiedSearchResponse<T> = {
    results: results as T[],
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
      total: totalCount, 
      limit: options.filters?.limit ?? 20,
      offset: options.filters?.offset ?? 0,
      hasMore: totalCount > ((options.filters?.offset ?? 0) + results.length)
    },
    performance: {
      dbTime: totalTime,
      totalTime: totalTime
    },
    searchType:
      options.filters?.job_category ||
      options.filters?.job_employment ||
      options.filters?.job_experience ||
      options.filters?.job_remote !== undefined
        ? 'jobs'
        : options.entities && options.entities.length === 1 && options.entities[0] === 'content'
          ? 'content'
          : 'unified',
  };
  return response;
}

async function executeSearch<T>(
  options: UnifiedSearchOptions,
  _cacheTags: string[],
  noCache = false,
): Promise<UnifiedSearchResponse<T>> {
  // For search queries with filters, bypass cache (cache: 'no-store' equivalent)
  if (noCache) {
    return executeSearchDirect<T>(options);
  }
  
  // Direct execution - no caching wrapper needed
  // Cache Components should be used in data functions, not here
  return executeSearchDirect<T>(options);
}

export async function searchUnified<T = ContentSearchResult | UnifiedSearchResult>(
  options: UnifiedSearchOptions,
  noCache = false
): Promise<UnifiedSearchResponse<T>> {
  const { entities } = options;
  const cacheTags = ['search', ...(entities || ['content']).map((e) => `search-${e}`)];
  return executeSearch<T>(options, cacheTags, noCache);
}

export async function searchContent(query: string, filters: SearchFilters = {}, noCache = false) {
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
  }, noCache);

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
