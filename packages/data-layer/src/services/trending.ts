/**
 * Trending Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Uses generated Prisma postgres-types for RPC function types and Zod schemas.
 */

import type {
  GetPopularContentArgs,
  GetPopularContentReturns,
  GetPopularContentFormattedArgs,
  GetPopularContentFormattedReturns,
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
import type { contentModel } from '@heyclaude/database-types/prisma/models';
import { prisma } from '../prisma/client.ts';
import { BasePrismaService } from './base-prisma-service.ts';
import { withSmartCache } from '../utils/request-cache.ts';

// Local types for converted RPCs (RPC removed, using Prisma directly)
// Exported for use in web-runtime
export type GetRecentContentArgs = {
  p_category?: string | null;
  p_limit?: number | null;
  p_days?: number | null;
};

// getRecentContent returns contentModel[], but we export a type alias for backward compatibility
export type GetRecentContentReturns = contentModel[];

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

  /**
   * Get recent content
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple SELECT with WHERE/ORDER BY/LIMIT, which Prisma handles perfectly.
   *
   * @param args - Arguments with optional p_category, p_limit, p_days
   * @returns Array of recent content items
   */
  async getRecentContent(
    args: GetRecentContentArgs = {}
  ): Promise<contentModel[]> {
    const { p_category = null, p_limit = 20, p_days = 180 } = args;

    return withSmartCache<contentModel[]>(
      'getRecentContent',
      'getRecentContent',
      async () => {
        // Use database SQL INTERVAL for date calculation (eliminates Date.now() call)
        // More efficient: database handles date arithmetic natively
        // OPTIMIZATION: Replace SELECT * with explicit field list (9 fields)
        // This reduces data transfer significantly (from 30+ fields to 9 fields per content item)
        // Fields match mapRecentContent and edge function requirements
        let query = `
          SELECT 
            category,
            author,
            created_at,
            date_added,
            description,
            slug,
            tags,
            title,
            display_title
          FROM public.content
          WHERE 1=1
        `;
        const params: unknown[] = [];
        let paramIndex = 1;
        
        // Category filter (if provided)
        if (p_category) {
          query += ` AND category = $${paramIndex}::public.content_category`;
          params.push(p_category);
          paramIndex++;
        }
        
        // Date filter (if p_days provided) - using SQL INTERVAL
        if (p_days) {
          query += ` AND date_added >= NOW() - INTERVAL '${p_days} days'`;
        }
        
        query += ` ORDER BY date_added DESC LIMIT $${paramIndex}::integer`;
        params.push(p_limit);
        
        // Execute raw SQL query
        const results = await prisma.$queryRawUnsafe<contentModel[]>(query, ...params);
        
        // Return results (already filtered and ordered by database)
        return results;
      },
      args
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

  // Removed: calculate_content_time_metrics RPC function was removed in migration 20251217000229
  // async calculateContentTimeMetrics(): Promise<CalculateContentTimeMetricsReturns> {
  //   // Mutations don't use caching
  //   return this.callRpc<CalculateContentTimeMetricsReturns>(
  //     'calculate_content_time_metrics',
  //     {},
  //     { methodName: 'calculateContentTimeMetrics', useCache: false }
  //   );
  // }

  async refreshTrendingMetricsView(): Promise<void> {
    // Mutations don't use caching
    await this.callRpc<void>(
      'refresh_trending_metrics_view',
      {},
      { methodName: 'refreshTrendingMetricsView', useCache: false }
    );
  }
}
