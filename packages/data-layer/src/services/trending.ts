/**
 * Trending Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Uses generated Prisma postgres-types for RPC function types and Zod schemas.
 */

import type {
  CalculateContentTimeMetricsReturns,
  GetPopularContentArgs,
  GetPopularContentReturns,
  GetPopularContentFormattedArgs,
  GetPopularContentFormattedReturns,
  GetRecentContentArgs,
  GetRecentContentReturns,
  GetRecentContentFormattedArgs,
  GetRecentContentFormattedReturns,
  GetSidebarRecentFormattedArgs,
  GetSidebarRecentFormattedReturns,
  GetSidebarTrendingFormattedArgs,
  GetSidebarTrendingFormattedReturns,
  GetTrendingContentArgs,
  GetTrendingContentReturns,
  GetTrendingMetricsFormattedArgs,
  GetTrendingMetricsFormattedReturns,
  GetTrendingMetricsWithContentArgs,
  GetTrendingMetricsWithContentReturns,
} from '@heyclaude/database-types/postgres-types';
import { BasePrismaService } from './base-prisma-service.ts';

/**
 * Trending Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions (returns composite types)
 * - Request-scoped caching (via BasePrismaService)
 * - Same public API as Supabase-based service
 */
export class TrendingService extends BasePrismaService {
  async getTrendingMetrics(
    args: GetTrendingMetricsWithContentArgs
  ): Promise<GetTrendingMetricsWithContentReturns> {
    return this.callRpc<GetTrendingMetricsWithContentReturns>(
      'get_trending_metrics_with_content',
      args,
      { methodName: 'getTrendingMetrics' }
    );
  }

  async getPopularContent(
    args: GetPopularContentArgs
  ): Promise<GetPopularContentReturns> {
    return this.callRpc<GetPopularContentReturns>(
      'get_popular_content',
      args,
      { methodName: 'getPopularContent' }
    );
  }

  async getRecentContent(
    args: GetRecentContentArgs
  ): Promise<GetRecentContentReturns> {
    return this.callRpc<GetRecentContentReturns>(
      'get_recent_content',
      args,
      { methodName: 'getRecentContent' }
    );
  }

  async getTrendingContent(
    args: GetTrendingContentArgs
  ): Promise<GetTrendingContentReturns> {
    return this.callRpc<GetTrendingContentReturns>(
      'get_trending_content',
      args,
      { methodName: 'getTrendingContent' }
    );
  }

  async getTrendingMetricsFormatted(
    args: GetTrendingMetricsFormattedArgs
  ): Promise<GetTrendingMetricsFormattedReturns> {
    return this.callRpc<GetTrendingMetricsFormattedReturns>(
      'get_trending_metrics_formatted',
      args,
      { methodName: 'getTrendingMetricsFormatted' }
    );
  }

  async getPopularContentFormatted(
    args: GetPopularContentFormattedArgs
  ): Promise<GetPopularContentFormattedReturns> {
    return this.callRpc<GetPopularContentFormattedReturns>(
      'get_popular_content_formatted',
      args,
      { methodName: 'getPopularContentFormatted' }
    );
  }

  async getRecentContentFormatted(
    args: GetRecentContentFormattedArgs
  ): Promise<GetRecentContentFormattedReturns> {
    return this.callRpc<GetRecentContentFormattedReturns>(
      'get_recent_content_formatted',
      args,
      { methodName: 'getRecentContentFormatted' }
    );
  }

  async getSidebarTrendingFormatted(
    args: GetSidebarTrendingFormattedArgs
  ): Promise<GetSidebarTrendingFormattedReturns> {
    return this.callRpc<GetSidebarTrendingFormattedReturns>(
      'get_sidebar_trending_formatted',
      args,
      { methodName: 'getSidebarTrendingFormatted' }
    );
  }

  async getSidebarRecentFormatted(
    args: GetSidebarRecentFormattedArgs
  ): Promise<GetSidebarRecentFormattedReturns> {
    return this.callRpc<GetSidebarRecentFormattedReturns>(
      'get_sidebar_recent_formatted',
      args,
      { methodName: 'getSidebarRecentFormatted' }
    );
  }

  async calculateContentTimeMetrics(): Promise<CalculateContentTimeMetricsReturns> {
    // Mutations don't use caching
    return this.callRpc<CalculateContentTimeMetricsReturns>(
      'calculate_content_time_metrics',
      {},
      { methodName: 'calculateContentTimeMetrics', useCache: false }
    );
  }

  async refreshTrendingMetricsView(): Promise<void> {
    // Mutations don't use caching
    await this.callRpc<void>(
      'refresh_trending_metrics_view',
      {},
      { methodName: 'refreshTrendingMetricsView', useCache: false }
    );
  }
}
