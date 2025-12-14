/**
 * Trending Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Maintains the same public API for backward compatibility.
 */

import { type Database } from '@heyclaude/database-types';
import { BasePrismaService } from './base-prisma-service.ts';

/**
 * Trending Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions
 * - Request-scoped caching (via BasePrismaService)
 * - Same public API as Supabase-based service
 */
export class TrendingService extends BasePrismaService {
  async getTrendingMetrics(
    args: Database['public']['Functions']['get_trending_metrics_with_content']['Args']
  ): Promise<Database['public']['Functions']['get_trending_metrics_with_content']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_trending_metrics_with_content']['Returns']>(
      'get_trending_metrics_with_content',
      args,
      { methodName: 'getTrendingMetrics' }
    );
  }

  async getPopularContent(
    args: Database['public']['Functions']['get_popular_content']['Args']
  ): Promise<Database['public']['Functions']['get_popular_content']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_popular_content']['Returns']>(
      'get_popular_content',
      args,
      { methodName: 'getPopularContent' }
    );
  }

  async getRecentContent(
    args: Database['public']['Functions']['get_recent_content']['Args']
  ): Promise<Database['public']['Functions']['get_recent_content']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_recent_content']['Returns']>(
      'get_recent_content',
      args,
      { methodName: 'getRecentContent' }
    );
  }

  async getTrendingContent(
    args: Database['public']['Functions']['get_trending_content']['Args']
  ): Promise<Database['public']['Functions']['get_trending_content']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_trending_content']['Returns']>(
      'get_trending_content',
      args,
      { methodName: 'getTrendingContent' }
    );
  }

  async getTrendingMetricsFormatted(
    args: Database['public']['Functions']['get_trending_metrics_formatted']['Args']
  ): Promise<Database['public']['Functions']['get_trending_metrics_formatted']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_trending_metrics_formatted']['Returns']>(
      'get_trending_metrics_formatted',
      args,
      { methodName: 'getTrendingMetricsFormatted' }
    );
  }

  async getPopularContentFormatted(
    args: Database['public']['Functions']['get_popular_content_formatted']['Args']
  ): Promise<Database['public']['Functions']['get_popular_content_formatted']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_popular_content_formatted']['Returns']>(
      'get_popular_content_formatted',
      args,
      { methodName: 'getPopularContentFormatted' }
    );
  }

  async getRecentContentFormatted(
    args: Database['public']['Functions']['get_recent_content_formatted']['Args']
  ): Promise<Database['public']['Functions']['get_recent_content_formatted']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_recent_content_formatted']['Returns']>(
      'get_recent_content_formatted',
      args,
      { methodName: 'getRecentContentFormatted' }
    );
  }

  async getSidebarTrendingFormatted(
    args: Database['public']['Functions']['get_sidebar_trending_formatted']['Args']
  ): Promise<Database['public']['Functions']['get_sidebar_trending_formatted']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_sidebar_trending_formatted']['Returns']>(
      'get_sidebar_trending_formatted',
      args,
      { methodName: 'getSidebarTrendingFormatted' }
    );
  }

  async getSidebarRecentFormatted(
    args: Database['public']['Functions']['get_sidebar_recent_formatted']['Args']
  ): Promise<Database['public']['Functions']['get_sidebar_recent_formatted']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_sidebar_recent_formatted']['Returns']>(
      'get_sidebar_recent_formatted',
      args,
      { methodName: 'getSidebarRecentFormatted' }
    );
  }

  async calculateContentTimeMetrics(): Promise<
    Database['public']['Functions']['calculate_content_time_metrics']['Returns']
  > {
    // Mutations don't use caching
    return this.callRpc<Database['public']['Functions']['calculate_content_time_metrics']['Returns']>(
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
