/**
 * Search Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Maintains the same public API for backward compatibility.
 */

import type {
  SearchUnifiedArgs,
  SearchUnifiedReturns,
  SearchContentOptimizedArgs,
  SearchContentOptimizedReturns,
  FilterJobsArgs,
  FilterJobsReturns,
  GetSearchFacetsArgs,
  GetSearchFacetsReturns,
  GetSearchFacetsFormattedArgs,
  GetSearchFacetsFormattedReturns,
  GetSearchSuggestionsFromHistoryArgs,
  GetSearchSuggestionsFromHistoryReturns,
  GetSearchSuggestionsFormattedArgs,
  GetSearchSuggestionsFormattedReturns,
  BatchInsertSearchQueriesArgs,
  BatchInsertSearchQueriesReturns,
  GetTrendingSearchesArgs,
  GetTrendingSearchesReturns,
  SearchContentOptimizedResult,
  SearchUnifiedResult,
  SearchContentOptimizedRow,
  SearchUnifiedRow,
} from '@heyclaude/database-types/postgres-types';
import {
  type experience_level,
  type job_category,
  type job_type,
} from '@heyclaude/data-layer/prisma';
import { type jobsModel } from '@heyclaude/database-types/prisma/models';
import { BasePrismaService } from './base-prisma-service.ts';
import { prisma } from '../prisma/client.ts';
import { withSmartCache } from '../utils/request-cache.ts';

type SearchResultRow = jobsModel | SearchContentOptimizedRow | SearchUnifiedRow;
type SearchType = 'content' | 'jobs' | 'unified';
type SortType = 'alphabetical' | 'newest' | 'popularity' | 'relevance';

export const DEFAULT_ENTITIES = ['content', 'company', 'job', 'user'] as const;

/**
 * Search Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions
 * - Request-scoped caching (via BasePrismaService)
 * - Same public API as Supabase-based service
 */
export class SearchService extends BasePrismaService {
  /**
   * Calls the database RPC: search_unified
   * The database function returns a composite type with results array and total_count
   */
  async searchUnified(
    args: SearchUnifiedArgs
  ): Promise<{ data: SearchUnifiedResult['results']; total_count: number }> {
    const result = await this.callRpc<SearchUnifiedReturns | null>(
      'search_unified',
      args,
      { methodName: 'searchUnified' }
    );
    const rows = result?.results ?? [];
    const totalCount = result?.total_count ? Number(result.total_count) : rows.length;
    return { data: rows, total_count: totalCount };
  }

  /**
   * Calls the database RPC: search_content_optimized
   * The database function returns a composite type with results array and total_count
   */
  async searchContent(
    args: SearchContentOptimizedArgs
  ): Promise<{ data: SearchContentOptimizedResult['results']; total_count: number }> {
    const result = await this.callRpc<SearchContentOptimizedReturns | null>(
      'search_content_optimized',
      args,
      { methodName: 'searchContent' }
    );
    const rows = result?.results ?? [];
    const totalCount = result?.total_count ? Number(result.total_count) : rows.length;
    return { data: rows, total_count: totalCount };
  }

  async filterJobs(
    args: FilterJobsArgs
  ): Promise<FilterJobsReturns> {
    return this.callRpc<FilterJobsReturns>(
      'filter_jobs',
      args,
      { methodName: 'filterJobs' }
    );
  }

  async getSearchFacets(): Promise<GetSearchFacetsReturns> {
    return this.callRpc<GetSearchFacetsReturns>(
      'get_search_facets',
      {} as GetSearchFacetsArgs,
      { methodName: 'getSearchFacets' }
    );
  }

  async getSearchFacetsFormatted(): Promise<GetSearchFacetsFormattedReturns> {
    return this.callRpc<GetSearchFacetsFormattedReturns>(
      'get_search_facets_formatted',
      {} as GetSearchFacetsFormattedArgs,
      { methodName: 'getSearchFacetsFormatted' }
    );
  }

  async getSearchSuggestions(
    args: GetSearchSuggestionsFromHistoryArgs
  ): Promise<GetSearchSuggestionsFromHistoryReturns> {
    return this.callRpc<GetSearchSuggestionsFromHistoryReturns>(
      'get_search_suggestions_from_history',
      args,
      { methodName: 'getSearchSuggestions' }
    );
  }

  async getSearchSuggestionsFormatted(
    args: GetSearchSuggestionsFormattedArgs
  ): Promise<GetSearchSuggestionsFormattedReturns> {
    return this.callRpc<GetSearchSuggestionsFormattedReturns>(
      'get_search_suggestions_formatted',
      args,
      { methodName: 'getSearchSuggestionsFormatted' }
    );
  }

  async batchInsertSearchQueries(
    args: BatchInsertSearchQueriesArgs
  ): Promise<BatchInsertSearchQueriesReturns> {
    // Mutations don't use caching
    return this.callRpc<BatchInsertSearchQueriesReturns>(
      'batch_insert_search_queries',
      args,
      { methodName: 'batchInsertSearchQueries', useCache: false }
    );
  }

  /**
   * Get trending searches
   * 
   * OPTIMIZATION: Uses Prisma raw query instead of RPC for better type safety and performance.
   * The RPC queries a materialized view (trending_searches), which we access via $queryRawUnsafe.
   * 
   * @param args - Optional arguments with limit_count (defaults to 5)
   * @returns Array of trending search results
   */
  async getTrendingSearches(
    args?: GetTrendingSearchesArgs
  ): Promise<GetTrendingSearchesReturns> {
    return withSmartCache(
      'get_trending_searches',
      'getTrendingSearches',
      async () => {
        const limit = args?.limit_count ?? 5;

        // Query materialized view directly (not in Prisma schema, so use raw query)
        const results = await prisma.$queryRawUnsafe<Array<{
          query: string;
          count: bigint;
          label: string;
        }>>(
          `SELECT
            search_query as query,
            search_count as count,
            '🔥 ' || search_query || ' (' || search_count || ' searches)' as label
          FROM public.trending_searches
          ORDER BY search_count DESC
          LIMIT $1`,
          limit
        );

        // Transform to match RPC return structure (table row format)
        return results.map((row: (typeof results)[number]) => ({
          query: row.query,
          count: Number(row.count), // Convert bigint to number
          label: row.label,
        })) as GetTrendingSearchesReturns;
      },
      args ?? {}
    );
  }

  /**
   * Highlight search results
   * Database RPCs provide highlighting when p_highlight_query is passed.
   * This function simply passes through the database-provided highlighted fields.
   */
  static highlightResults(
    results: SearchResultRow[],
    query: string
  ): SearchResultRow[] {
    if (!query.trim()) {
      return results.map((result) => ({ ...result }));
    }
    // Database RPCs always provide highlighting when p_highlight_query is passed
    return results;
  }

  /**
   * Execute search query based on search type
   * Dispatches the search to the appropriate backend ('jobs', 'unified', or 'content')
   * and returns matching rows with a total count.
   */
  async executeSearch(params: {
    authors?: string[];
    categories?: SearchContentOptimizedArgs['p_categories'];
    entities?: string[];
    jobCategory?: job_category;
    jobEmployment?: job_type;
    jobExperience?: experience_level;
    jobRemote?: boolean;
    limit: number;
    offset: number;
    query: string;
    searchType: SearchType;
    sort: SortType;
    tags?: string[];
  }): Promise<{ results: SearchResultRow[]; totalCount: number }> {
    const {
      authors,
      categories,
      entities,
      jobCategory,
      jobEmployment,
      jobExperience,
      jobRemote,
      limit,
      offset,
      query,
      searchType,
      sort,
      tags,
    } = params;

    if (searchType === 'jobs') {
      const jobArgs: FilterJobsArgs = {
        p_limit: limit,
        p_offset: offset,
      };

      if (query) {
        jobArgs.p_search_query = query;
      }
      if (jobCategory) {
        jobArgs.p_category = jobCategory;
      }
      if (jobEmployment) {
        jobArgs.p_employment_type = jobEmployment;
      }
      if (jobExperience) {
        jobArgs.p_experience_level = jobExperience;
      }
      if (jobRemote !== undefined) {
        jobArgs.p_remote_only = jobRemote;
      }

      const result = await this.filterJobs(jobArgs);
      const jobs = result.jobs ?? [];
      const totalCount = typeof result.total_count === 'number' ? result.total_count : jobs.length;

      return {
        results: jobs as SearchResultRow[],
        totalCount,
      };
    }

    if (searchType === 'unified') {
      const unifiedArgs: SearchUnifiedArgs = {
        p_entities: entities && entities.length > 0 ? entities : [...DEFAULT_ENTITIES],
        p_limit: limit,
        p_offset: offset,
        p_query: query,
        ...(query && query.trim() ? { p_highlight_query: query } : {}),
      };

      const unifiedResult = await this.searchUnified(unifiedArgs);
      const rows = Array.isArray(unifiedResult.data) ? unifiedResult.data : [];
      const totalCount =
        typeof unifiedResult.total_count === 'number' ? unifiedResult.total_count : rows.length;

      return {
        results: rows as SearchResultRow[],
        totalCount,
      };
    }

    // searchType === 'content'
    const args: SearchContentOptimizedArgs = {
      p_limit: limit,
      p_offset: offset,
    };

    if (query) {
      args.p_query = query;
    }
    if (sort) {
      args.p_sort = sort;
    }
    if (categories && categories.length > 0) {
      args.p_categories = categories;
    }
    if (tags?.length) {
      args.p_tags = tags;
    }
    if (authors?.length) {
      args.p_authors = authors;
    }
    if (query && query.trim()) {
      args.p_highlight_query = query;
    }

    const result = await this.searchContent(args);
    const rows = Array.isArray(result.data) ? result.data : [];
    const totalCount = typeof result.total_count === 'number' ? result.total_count : rows.length;

    return {
      results: rows as SearchResultRow[],
      totalCount,
    };
  }
}
