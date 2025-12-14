/**
 * Changelog Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Maintains the same public API for backward compatibility.
 */

import { type Database } from '@heyclaude/database-types';
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
    args: Database['public']['Functions']['get_changelog_overview']['Args']
  ): Promise<Database['public']['Functions']['get_changelog_overview']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_changelog_overview']['Returns']>(
      'get_changelog_overview',
      args,
      { methodName: 'getChangelogOverview' }
    );
  }

  async getChangelogDetail(
    args: Database['public']['Functions']['get_changelog_detail']['Args']
  ): Promise<Database['public']['Functions']['get_changelog_detail']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_changelog_detail']['Returns']>(
      'get_changelog_detail',
      args,
      { methodName: 'getChangelogDetail' }
    );
  }

  async getChangelogWithCategoryStats(
    args: Database['public']['Functions']['get_changelog_with_category_stats']['Args']
  ): Promise<Database['public']['Functions']['get_changelog_with_category_stats']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_changelog_with_category_stats']['Returns']>(
      'get_changelog_with_category_stats',
      args,
      { methodName: 'getChangelogWithCategoryStats' }
    );
  }

  async upsertChangelogEntry(
    args: Database['public']['Functions']['upsert_changelog_entry']['Args']
  ): Promise<Database['public']['Functions']['upsert_changelog_entry']['Returns'][0] | null> {
    // Mutations don't use caching
    const result = await this.callRpc<Database['public']['Functions']['upsert_changelog_entry']['Returns']>(
      'upsert_changelog_entry',
      args,
      { methodName: 'upsertChangelogEntry', useCache: false }
    );
    return Array.isArray(result) && result.length > 0 ? (result[0] ?? null) : null;
  }

  async syncChangelogEntry(
    args: Database['public']['Functions']['sync_changelog_entry']['Args']
  ): Promise<Database['public']['Functions']['sync_changelog_entry']['Returns'][0] | null> {
    // Mutations don't use caching
    const result = await this.callRpc<Database['public']['Functions']['sync_changelog_entry']['Returns']>(
      'sync_changelog_entry',
      args,
      { methodName: 'syncChangelogEntry', useCache: false }
    );
    return Array.isArray(result) && result.length > 0 ? (result[0] ?? null) : null;
  }
}
