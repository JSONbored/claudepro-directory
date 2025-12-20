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
import type { Prisma, PrismaClient, content_category } from '@prisma/client';

type contentModel = Prisma.contentGetPayload<{}>;
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
  constructor(prismaClient?: PrismaClient) {
    super(prismaClient);
  }

  async getTrendingMetrics(
    args: GetTrendingMetricsWithContentArgs
  ): Promise<GetTrendingMetricsWithContentReturns> {
    return this.callRpc<GetTrendingMetricsWithContentReturns>(
      'get_trending_metrics_with_content',
      args,
      { methodName: 'getTrendingMetrics' }
    );
  }

  async getPopularContent(args: GetPopularContentArgs): Promise<GetPopularContentReturns> {
    return this.callRpc<GetPopularContentReturns>('get_popular_content', args, {
      methodName: 'getPopularContent',
    });
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
  async getRecentContent(args: GetRecentContentArgs = {}): Promise<contentModel[]> {
    const { p_category = null, p_limit = 20, p_days = 180 } = args;

    return withSmartCache<contentModel[]>(
      'getRecentContent',
      'getRecentContent',
      async () => {
        // OPTIMIZATION: Use Prisma query builder instead of raw SQL for better type safety
        // Calculate date threshold in JavaScript (safe within withSmartCache)
        const dateThreshold = p_days
          ? (() => {
              const date = new Date();
              date.setDate(date.getDate() - p_days);
              return date;
            })()
          : undefined;

        // Enforce limit bounds (1-100) to prevent excessive queries
        const boundedLimit = Math.max(1, Math.min(100, p_limit ?? 20));

        // OPTIMIZATION: Use select to fetch only needed fields (9 fields)
        // This reduces data transfer significantly (from 30+ fields to 9 fields per content item)
        // Fields match mapRecentContent and edge function requirements
        const results = await prisma.content.findMany({
          where: {
            ...(p_category && { category: p_category as content_category }),
            ...(dateThreshold && { date_added: { gte: dateThreshold } }),
          },
          select: {
            category: true,
            author: true,
            created_at: true,
            date_added: true,
            description: true,
            slug: true,
            tags: true,
            title: true,
            display_title: true,
          },
          orderBy: { date_added: 'desc' },
          take: boundedLimit,
        });

        return results as contentModel[];
      },
      args
    );
  }

  async getTrendingContent(args: GetTrendingContentArgs): Promise<GetTrendingContentReturns> {
    return this.callRpc<GetTrendingContentReturns>('get_trending_content', args, {
      methodName: 'getTrendingContent',
    });
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
    // get_popular_content_formatted returns RETURNS TABLE (SETOF), so it's an array return
    return this.callRpc<GetPopularContentFormattedReturns>('get_popular_content_formatted', args, {
      methodName: 'getPopularContentFormatted',
      returnType: 'array', // RETURNS TABLE functions return arrays
    });
  }

  async getRecentContentFormatted(
    args: GetRecentContentFormattedArgs
  ): Promise<GetRecentContentFormattedReturns> {
    // get_recent_content_formatted returns RETURNS TABLE (SETOF), so it's an array return
    return this.callRpc<GetRecentContentFormattedReturns>('get_recent_content_formatted', args, {
      methodName: 'getRecentContentFormatted',
      returnType: 'array', // RETURNS TABLE functions return arrays
    });
  }

  async getSidebarTrendingFormatted(
    args: GetSidebarTrendingFormattedArgs
  ): Promise<GetSidebarTrendingFormattedReturns> {
    // get_sidebar_trending_formatted returns RETURNS TABLE (SETOF), so it's an array return
    return this.callRpc<GetSidebarTrendingFormattedReturns>(
      'get_sidebar_trending_formatted',
      args,
      { methodName: 'getSidebarTrendingFormatted', returnType: 'array' } // RETURNS TABLE functions return arrays
    );
  }

  async getSidebarRecentFormatted(
    args: GetSidebarRecentFormattedArgs
  ): Promise<GetSidebarRecentFormattedReturns> {
    // get_sidebar_recent_formatted returns RETURNS TABLE (SETOF), so it's an array return
    return this.callRpc<GetSidebarRecentFormattedReturns>('get_sidebar_recent_formatted', args, {
      methodName: 'getSidebarRecentFormatted',
      returnType: 'array', // RETURNS TABLE functions return arrays
    });
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
