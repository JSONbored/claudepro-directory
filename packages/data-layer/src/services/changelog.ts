/**
 * Changelog Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Maintains the same public API for backward compatibility.
 */

import type {
  GetChangelogOverviewArgs,
  GetChangelogOverviewReturns,
  GetChangelogDetailArgs,
  GetChangelogDetailReturns,
  GetChangelogWithCategoryStatsArgs,
  GetChangelogWithCategoryStatsReturns,
  UpsertChangelogEntryArgs,
  UpsertChangelogEntryReturns,
  SyncChangelogEntryArgs,
  SyncChangelogEntryReturns,
} from '@heyclaude/database-types/postgres-types';
import { prisma } from '../prisma/client';
import { BasePrismaService } from './base-prisma-service';
import { withSmartCache } from '../utils/request-cache';

/**
 * Changelog Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions
 * - Request-scoped caching (via BasePrismaService)
 * - Same public API as Supabase-based service
 */
export class ChangelogService extends BasePrismaService {
  async getChangelogOverview(args: GetChangelogOverviewArgs): Promise<GetChangelogOverviewReturns> {
    return this.callRpc<GetChangelogOverviewReturns>('get_changelog_overview', args, {
      methodName: 'getChangelogOverview',
    });
  }

  async getChangelogDetail(args: GetChangelogDetailArgs): Promise<GetChangelogDetailReturns> {
    return this.callRpc<GetChangelogDetailReturns>('get_changelog_detail', args, {
      methodName: 'getChangelogDetail',
    });
  }

  async getChangelogWithCategoryStats(
    args: GetChangelogWithCategoryStatsArgs
  ): Promise<GetChangelogWithCategoryStatsReturns> {
    return this.callRpc<GetChangelogWithCategoryStatsReturns>(
      'get_changelog_with_category_stats',
      args,
      { methodName: 'getChangelogWithCategoryStats' }
    );
  }

  async upsertChangelogEntry(
    args: UpsertChangelogEntryArgs
  ): Promise<UpsertChangelogEntryReturns[0] | null> {
    // Mutations don't use caching
    // RPC returns TABLE(...) which is an array, so specify returnType: 'array'
    const result = await this.callRpc<UpsertChangelogEntryReturns>('upsert_changelog_entry', args, {
      methodName: 'upsertChangelogEntry',
      useCache: false,
      returnType: 'array',
    });
    return Array.isArray(result) && result.length > 0 ? (result[0] ?? null) : null;
  }

  async syncChangelogEntry(
    args: SyncChangelogEntryArgs
  ): Promise<SyncChangelogEntryReturns[0] | null> {
    // Mutations don't use caching
    // RPC returns TABLE(...) which is an array, so specify returnType: 'array'
    const result = await this.callRpc<SyncChangelogEntryReturns>('sync_changelog_entry', args, {
      methodName: 'syncChangelogEntry',
      useCache: false,
      returnType: 'array',
    });
    return Array.isArray(result) && result.length > 0 ? (result[0] ?? null) : null;
  }

  /**
   * Get published changelog slugs for static generation
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better performance.
   * Only fetches slugs needed for generateStaticParams, avoiding unnecessary data processing.
   *
   * @param limit - Maximum number of slugs to return
   * @returns Array of changelog slugs
   */
  async getPublishedChangelogSlugs(limit: number): Promise<string[]> {
    return withSmartCache(
      'getPublishedChangelogSlugs',
      'getPublishedChangelogSlugs',
      async () => {
        const entries = await prisma.changelog.findMany({
          where: {
            published: true,
          },
          select: {
            slug: true,
          },
          orderBy: {
            release_date: 'desc',
          },
          take: limit,
        });
        return entries.map((entry) => entry.slug);
      },
      { limit }
    );
  }
}
