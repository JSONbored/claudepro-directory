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
} from '@heyclaude/database-types/postgres-types/functions';
import type {
  SearchContentOptimizedResult,
  SearchUnifiedResult,
} from '@heyclaude/database-types/postgres-types/composites';
import { BasePrismaService } from './base-prisma-service.ts';

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

  async getTrendingSearches(
    args?: GetTrendingSearchesArgs
  ): Promise<GetTrendingSearchesReturns> {
    return this.callRpc<GetTrendingSearchesReturns>(
      'get_trending_searches',
      args ?? ({} as GetTrendingSearchesArgs),
      { methodName: 'getTrendingSearches' }
    );
  }
}
