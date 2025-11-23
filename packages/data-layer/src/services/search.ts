import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ContentSearchResult = Database['public']['Functions']['search_content_optimized']['Returns'][number];
export type UnifiedSearchResult = Database['public']['Functions']['search_unified']['Returns'][number];
export type FilteredJobsResult = Database['public']['Functions']['filter_jobs']['Returns'];
type FilteredJobsArray = NonNullable<FilteredJobsResult['jobs']>;
export type JobSearchResult = FilteredJobsArray[number];

export interface UnifiedSearchFilters {
  categories?: string[] | undefined;
  tags?: string[] | undefined;
  authors?: string[] | undefined;
  sort?: 'relevance' | 'popularity' | 'newest' | 'alphabetical';
  limit?: number;
  offset?: number;
}

export interface JobSearchFilters {
  query?: string;
  categories?: Database['public']['Enums']['job_category'][] | undefined;
  employmentTypes?: Database['public']['Enums']['job_type'][] | undefined;
  experienceLevels?: Database['public']['Enums']['experience_level'][] | undefined;
  remoteOnly?: boolean;
  limit?: number;
  offset?: number;
}

export class SearchService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Search across multiple entities (content, companies, jobs, users)
   * Maps to `search_unified` RPC
   */
  async searchUnified(
    query: string,
    entities: string[] = ['content'],
    filters: UnifiedSearchFilters = {}
  ) {
    const rpcArgs: Database['public']['Functions']['search_unified']['Args'] = {
      p_query: query,
      p_entities: entities,
      ...(filters.categories ? { p_categories: filters.categories } : {}),
      ...(filters.tags ? { p_tags: filters.tags } : {}),
      ...(filters.authors ? { p_authors: filters.authors } : {}),
      p_limit: filters.limit ?? 20,
      p_offset: filters.offset ?? 0,
    };

    const { data, error } = await this.supabase.rpc('search_unified', rpcArgs);
    if (error) throw error;
    return (data as UnifiedSearchResult[]) ?? [];
  }

  /**
   * Advanced content search with filters (optional semantic search if query provided)
   * Maps to `search_content_optimized` RPC
   */
  async searchContent(
    query?: string,
    filters: UnifiedSearchFilters = {}
  ) {
    const rpcArgs: Database['public']['Functions']['search_content_optimized']['Args'] = {
      ...(query ? { p_query: query } : {}),
      ...(filters.categories ? { p_categories: filters.categories } : {}),
      ...(filters.tags ? { p_tags: filters.tags } : {}),
      ...(filters.authors ? { p_authors: filters.authors } : {}),
      p_sort: filters.sort ?? 'relevance',
      p_limit: filters.limit ?? 20,
      p_offset: filters.offset ?? 0,
    };

    const { data, error } = await this.supabase.rpc('search_content_optimized', rpcArgs);
    if (error) throw error;
    return (data as ContentSearchResult[]) ?? [];
  }

  /**
   * Filter jobs with specific criteria
   * Maps to `filter_jobs` RPC
   */
  async filterJobs(filters: JobSearchFilters) {
    // Handle empty array logic: RPC usually expects NULL for "all", but let's follow RPC signature
    const categoryArg = filters.categories?.[0];
    const employmentArg = filters.employmentTypes?.[0];
    const experienceArg = filters.experienceLevels?.[0];

    const rpcArgs: Database['public']['Functions']['filter_jobs']['Args'] = {
      ...(filters.query ? { p_search_query: filters.query } : {}),
      ...(categoryArg ? { p_category: categoryArg } : {}),
      ...(employmentArg ? { p_employment_type: employmentArg } : {}),
      ...(experienceArg ? { p_experience_level: experienceArg } : {}),
      ...(filters.remoteOnly !== undefined ? { p_remote_only: filters.remoteOnly } : {}),
      p_limit: filters.limit ?? 20,
      p_offset: filters.offset ?? 0,
    };

    const { data, error } = await this.supabase.rpc('filter_jobs', rpcArgs);
    if (error) throw error;
    
    return (data as FilteredJobsResult) ?? { jobs: [], total_count: 0 };
  }
}
