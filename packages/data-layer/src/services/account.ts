/**
 * Account Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Maintains the same public API for backward compatibility.
 */

import type {
  BatchInsertUserInteractionsArgs,
  BatchInsertUserInteractionsReturns,
  GetAccountDashboardArgs,
  GetAccountDashboardReturns,
  GetUserLibraryArgs,
  GetUserLibraryReturns,
  GetUserDashboardArgs,
  GetUserDashboardReturns,
  GetCollectionDetailWithItemsArgs,
  GetCollectionDetailWithItemsReturns,
  GetUserSettingsArgs,
  GetUserSettingsReturns,
  GetSponsorshipAnalyticsArgs,
  GetSponsorshipAnalyticsReturns,
  GetUserCompaniesArgs,
  GetUserCompaniesReturns,
  GetUserSponsorshipsArgs,
  GetUserSponsorshipsReturns,
  GetSubmissionDashboardArgs,
  GetSubmissionDashboardReturns,
  IsBookmarkedArgs,
  IsBookmarkedReturns,
  IsBookmarkedBatchArgs,
  IsBookmarkedBatchReturns,
  IsFollowingArgs,
  IsFollowingReturns,
  IsFollowingBatchArgs,
  IsFollowingBatchReturns,
  GetUserActivitySummaryArgs,
  GetUserActivitySummaryReturns,
  GetUserActivityTimelineArgs,
  GetUserActivityTimelineReturns,
  GetUserIdentitiesArgs,
  GetUserIdentitiesReturns,
  GetUserCompleteDataArgs,
  GetUserCompleteDataReturns,
} from '@heyclaude/database-types/postgres-types';
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
    args: GetAccountDashboardArgs
  ): Promise<GetAccountDashboardReturns> {
    return this.callRpc<GetAccountDashboardReturns>(
      'get_account_dashboard',
      args,
      { methodName: 'getAccountDashboard' }
    );
  }

  async getUserLibrary(
    args: GetUserLibraryArgs
  ): Promise<GetUserLibraryReturns> {
    return this.callRpc<GetUserLibraryReturns>(
      'get_user_library',
      args,
      { methodName: 'getUserLibrary' }
    );
  }

  async getUserDashboard(
    args: GetUserDashboardArgs
  ): Promise<GetUserDashboardReturns> {
    return this.callRpc<GetUserDashboardReturns>(
      'get_user_dashboard',
      args,
      { methodName: 'getUserDashboard' }
    );
  }

  async getCollectionDetailWithItems(
    args: GetCollectionDetailWithItemsArgs
  ): Promise<GetCollectionDetailWithItemsReturns> {
    return this.callRpc<GetCollectionDetailWithItemsReturns>(
      'get_collection_detail_with_items',
      args,
      { methodName: 'getCollectionDetailWithItems' }
    );
  }

  async getUserSettings(
    args: GetUserSettingsArgs
  ): Promise<GetUserSettingsReturns> {
    return this.callRpc<GetUserSettingsReturns>(
      'get_user_settings',
      args,
      { methodName: 'getUserSettings' }
    );
  }

  async getSponsorshipAnalytics(
    args: GetSponsorshipAnalyticsArgs
  ): Promise<GetSponsorshipAnalyticsReturns> {
    return this.callRpc<GetSponsorshipAnalyticsReturns>(
      'get_sponsorship_analytics',
      args,
      { methodName: 'getSponsorshipAnalytics' }
    );
  }

  async getUserCompanies(
    args: GetUserCompaniesArgs
  ): Promise<GetUserCompaniesReturns> {
    return this.callRpc<GetUserCompaniesReturns>(
      'get_user_companies',
      args,
      { methodName: 'getUserCompanies' }
    );
  }

  async getUserSponsorships(
    args: GetUserSponsorshipsArgs
  ): Promise<GetUserSponsorshipsReturns> {
    return this.callRpc<GetUserSponsorshipsReturns>(
      'get_user_sponsorships',
      args,
      { methodName: 'getUserSponsorships' }
    );
  }

  async getSubmissionDashboard(
    args: GetSubmissionDashboardArgs
  ): Promise<GetSubmissionDashboardReturns> {
    return this.callRpc<GetSubmissionDashboardReturns>(
      'get_submission_dashboard',
      args,
      { methodName: 'getSubmissionDashboard' }
    );
  }

  async isBookmarked(
    args: IsBookmarkedArgs
  ): Promise<IsBookmarkedReturns> {
    return this.callRpc<IsBookmarkedReturns>(
      'is_bookmarked',
      args,
      { methodName: 'isBookmarked' }
    );
  }

  async isBookmarkedBatch(
    args: IsBookmarkedBatchArgs
  ): Promise<IsBookmarkedBatchReturns> {
    return this.callRpc<IsBookmarkedBatchReturns>(
      'is_bookmarked_batch',
      args,
      { methodName: 'isBookmarkedBatch' }
    );
  }

  async isFollowing(
    args: IsFollowingArgs
  ): Promise<IsFollowingReturns> {
    return this.callRpc<IsFollowingReturns>(
      'is_following',
      args,
      { methodName: 'isFollowing' }
    );
  }

  async isFollowingBatch(
    args: IsFollowingBatchArgs
  ): Promise<IsFollowingBatchReturns> {
    return this.callRpc<IsFollowingBatchReturns>(
      'is_following_batch',
      args,
      { methodName: 'isFollowingBatch' }
    );
  }

  async getUserActivitySummary(
    args: GetUserActivitySummaryArgs
  ): Promise<GetUserActivitySummaryReturns> {
    return this.callRpc<GetUserActivitySummaryReturns>(
      'get_user_activity_summary',
      args,
      { methodName: 'getUserActivitySummary' }
    );
  }

  async getUserActivityTimeline(
    args: GetUserActivityTimelineArgs
  ): Promise<GetUserActivityTimelineReturns> {
    return this.callRpc<GetUserActivityTimelineReturns>(
      'get_user_activity_timeline',
      args,
      { methodName: 'getUserActivityTimeline' }
    );
  }

  async getUserIdentities(
    args: GetUserIdentitiesArgs
  ): Promise<GetUserIdentitiesReturns> {
    return this.callRpc<GetUserIdentitiesReturns>(
      'get_user_identities',
      args,
      { methodName: 'getUserIdentities' }
    );
  }

  async getUserCompleteData(
    args: GetUserCompleteDataArgs
  ): Promise<GetUserCompleteDataReturns> {
    return this.callRpc<GetUserCompleteDataReturns>(
      'get_user_complete_data',
      args,
      { methodName: 'getUserCompleteData' }
    );
  }

  async batchInsertUserInteractions(
    args: BatchInsertUserInteractionsArgs
  ): Promise<BatchInsertUserInteractionsReturns> {
    // Mutations don't use caching
    return this.callRpc<BatchInsertUserInteractionsReturns>(
      'batch_insert_user_interactions',
      args,
      { methodName: 'batchInsertUserInteractions', useCache: false }
    );
  }
}
