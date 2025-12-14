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
import { BasePrismaService } from './base-prisma-service.ts';

/**
 * Changelog Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions
 * - Request-scoped caching (via BasePrismaService)
 * - Same public API as Supabase-based service
 */
export class ChangelogService extends BasePrismaService {
  async getChangelogOverview(
    args: GetChangelogOverviewArgs
  ): Promise<GetChangelogOverviewReturns> {
    return this.callRpc<GetChangelogOverviewReturns>(
      'get_changelog_overview',
      args,
      { methodName: 'getChangelogOverview' }
    );
  }

  async getChangelogDetail(
    args: GetChangelogDetailArgs
  ): Promise<GetChangelogDetailReturns> {
    return this.callRpc<GetChangelogDetailReturns>(
      'get_changelog_detail',
      args,
      { methodName: 'getChangelogDetail' }
    );
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
    const result = await this.callRpc<UpsertChangelogEntryReturns>(
      'upsert_changelog_entry',
      args,
      { methodName: 'upsertChangelogEntry', useCache: false }
    );
    return Array.isArray(result) && result.length > 0 ? (result[0] ?? null) : null;
  }

  async syncChangelogEntry(
    args: SyncChangelogEntryArgs
  ): Promise<SyncChangelogEntryReturns[0] | null> {
    // Mutations don't use caching
    const result = await this.callRpc<SyncChangelogEntryReturns>(
      'sync_changelog_entry',
      args,
      { methodName: 'syncChangelogEntry', useCache: false }
    );
    return Array.isArray(result) && result.length > 0 ? (result[0] ?? null) : null;
  }
}
