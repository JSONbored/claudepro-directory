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
import type { content_category } from '@heyclaude/data-layer/prisma';
import { prisma } from '../prisma/client.ts';
import { BasePrismaService } from './base-prisma-service.ts';
import { withSmartCache } from '../utils/request-cache.ts';

// Local types for converted RPCs (RPC removed, using Prisma directly)
type GetRecentContentArgs = {
  p_category?: string | null;
  p_limit?: number | null;
  p_days?: number | null;
};

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
        // Calculate date threshold (p_days ago)
        const daysAgo = p_days ? new Date(Date.now() - p_days * 24 * 60 * 60 * 1000) : null;
        
        // Build where clause
        const where: {
          category?: content_category;
          date_added?: { gte: Date };
        } = {};
        
        // Category filter (if provided)
        if (p_category) {
          where.category = p_category as content_category;
        }
        
        // Date filter (if p_days provided)
        if (daysAgo) {
          where.date_added = { gte: daysAgo };
        }

        // Calculate limit with bounds (1-100, default 20)
        const limit = Math.min(Math.max(p_limit ?? 20, 1), 100);

        // Prisma doesn't support nulls: 'last' directly, so we use simple desc
        // The database will handle null ordering based on its default behavior
        const content = await prisma.content.findMany({
          where,
          orderBy: [
            { date_added: 'desc' },
            { created_at: 'desc' },
          ],
          take: limit,
        });

        return content;
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
