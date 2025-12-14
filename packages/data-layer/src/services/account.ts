/**
 * Account Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Maintains the same public API for backward compatibility.
 */

import { type Database } from '@heyclaude/database-types';
import { BasePrismaService } from './base-prisma-service.ts';

/**
 * Account Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions
 * - Request-scoped caching (via BasePrismaService)
 * - Same public API as Supabase-based service
 */
export class AccountService extends BasePrismaService {
  async getAccountDashboard(
    args: Database['public']['Functions']['get_account_dashboard']['Args']
  ): Promise<Database['public']['Functions']['get_account_dashboard']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_account_dashboard']['Returns']>(
      'get_account_dashboard',
      args,
      { methodName: 'getAccountDashboard' }
    );
  }

  async getUserLibrary(
    args: Database['public']['Functions']['get_user_library']['Args']
  ): Promise<Database['public']['Functions']['get_user_library']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_user_library']['Returns']>(
      'get_user_library',
      args,
      { methodName: 'getUserLibrary' }
    );
  }

  async getUserDashboard(
    args: Database['public']['Functions']['get_user_dashboard']['Args']
  ): Promise<Database['public']['Functions']['get_user_dashboard']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_user_dashboard']['Returns']>(
      'get_user_dashboard',
      args,
      { methodName: 'getUserDashboard' }
    );
  }

  async getCollectionDetailWithItems(
    args: Database['public']['Functions']['get_collection_detail_with_items']['Args']
  ): Promise<Database['public']['Functions']['get_collection_detail_with_items']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_collection_detail_with_items']['Returns']>(
      'get_collection_detail_with_items',
      args,
      { methodName: 'getCollectionDetailWithItems' }
    );
  }

  async getUserSettings(
    args: Database['public']['Functions']['get_user_settings']['Args']
  ): Promise<Database['public']['Functions']['get_user_settings']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_user_settings']['Returns']>(
      'get_user_settings',
      args,
      { methodName: 'getUserSettings' }
    );
  }

  async getSponsorshipAnalytics(
    args: Database['public']['Functions']['get_sponsorship_analytics']['Args']
  ): Promise<Database['public']['Functions']['get_sponsorship_analytics']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_sponsorship_analytics']['Returns']>(
      'get_sponsorship_analytics',
      args,
      { methodName: 'getSponsorshipAnalytics' }
    );
  }

  async getUserCompanies(
    args: Database['public']['Functions']['get_user_companies']['Args']
  ): Promise<Database['public']['Functions']['get_user_companies']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_user_companies']['Returns']>(
      'get_user_companies',
      args,
      { methodName: 'getUserCompanies' }
    );
  }

  async getUserSponsorships(
    args: Database['public']['Functions']['get_user_sponsorships']['Args']
  ): Promise<Database['public']['Functions']['get_user_sponsorships']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_user_sponsorships']['Returns']>(
      'get_user_sponsorships',
      args,
      { methodName: 'getUserSponsorships' }
    );
  }

  async getSubmissionDashboard(
    args: Database['public']['Functions']['get_submission_dashboard']['Args']
  ): Promise<Database['public']['Functions']['get_submission_dashboard']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_submission_dashboard']['Returns']>(
      'get_submission_dashboard',
      args,
      { methodName: 'getSubmissionDashboard' }
    );
  }

  async isBookmarked(
    args: Database['public']['Functions']['is_bookmarked']['Args']
  ): Promise<Database['public']['Functions']['is_bookmarked']['Returns']> {
    return this.callRpc<Database['public']['Functions']['is_bookmarked']['Returns']>(
      'is_bookmarked',
      args,
      { methodName: 'isBookmarked' }
    );
  }

  async isBookmarkedBatch(
    args: Database['public']['Functions']['is_bookmarked_batch']['Args']
  ): Promise<Database['public']['Functions']['is_bookmarked_batch']['Returns']> {
    return this.callRpc<Database['public']['Functions']['is_bookmarked_batch']['Returns']>(
      'is_bookmarked_batch',
      args,
      { methodName: 'isBookmarkedBatch' }
    );
  }

  async isFollowing(
    args: Database['public']['Functions']['is_following']['Args']
  ): Promise<Database['public']['Functions']['is_following']['Returns']> {
    return this.callRpc<Database['public']['Functions']['is_following']['Returns']>(
      'is_following',
      args,
      { methodName: 'isFollowing' }
    );
  }

  async isFollowingBatch(
    args: Database['public']['Functions']['is_following_batch']['Args']
  ): Promise<Database['public']['Functions']['is_following_batch']['Returns']> {
    return this.callRpc<Database['public']['Functions']['is_following_batch']['Returns']>(
      'is_following_batch',
      args,
      { methodName: 'isFollowingBatch' }
    );
  }

  async getUserActivitySummary(
    args: Database['public']['Functions']['get_user_activity_summary']['Args']
  ): Promise<Database['public']['Functions']['get_user_activity_summary']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_user_activity_summary']['Returns']>(
      'get_user_activity_summary',
      args,
      { methodName: 'getUserActivitySummary' }
    );
  }

  async getUserActivityTimeline(
    args: Database['public']['Functions']['get_user_activity_timeline']['Args']
  ): Promise<Database['public']['Functions']['get_user_activity_timeline']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_user_activity_timeline']['Returns']>(
      'get_user_activity_timeline',
      args,
      { methodName: 'getUserActivityTimeline' }
    );
  }

  async getUserIdentities(
    args: Database['public']['Functions']['get_user_identities']['Args']
  ): Promise<Database['public']['Functions']['get_user_identities']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_user_identities']['Returns']>(
      'get_user_identities',
      args,
      { methodName: 'getUserIdentities' }
    );
  }

  async getUserCompleteData(
    args: Database['public']['Functions']['get_user_complete_data']['Args']
  ): Promise<Database['public']['Functions']['get_user_complete_data']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_user_complete_data']['Returns']>(
      'get_user_complete_data',
      args,
      { methodName: 'getUserCompleteData' }
    );
  }

  async batchInsertUserInteractions(
    args: Database['public']['Functions']['batch_insert_user_interactions']['Args']
  ): Promise<Database['public']['Functions']['batch_insert_user_interactions']['Returns']> {
    // Mutations don't use caching
    return this.callRpc<Database['public']['Functions']['batch_insert_user_interactions']['Returns']>(
      'batch_insert_user_interactions',
      args,
      { methodName: 'batchInsertUserInteractions', useCache: false }
    );
  }
}
