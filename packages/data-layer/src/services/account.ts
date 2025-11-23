import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AccountDashboardResult = Database['public']['Functions']['get_account_dashboard']['Returns'];
export type UserLibraryResult = Database['public']['Functions']['get_user_library']['Returns'];
export type UserDashboardResult = Database['public']['Functions']['get_user_dashboard']['Returns'];
export type CollectionDetailResult = Database['public']['Functions']['get_collection_detail_with_items']['Returns'];
export type UserSettingsResult = Database['public']['Functions']['get_user_settings']['Returns'];
export type SponsorshipAnalyticsResult = Database['public']['Functions']['get_sponsorship_analytics']['Returns'];
export type UserCompaniesResult = Database['public']['Functions']['get_user_companies']['Returns'];
export type UserSponsorshipsResult = Database['public']['Functions']['get_user_sponsorships']['Returns'];
export type SubmissionDashboardResult = Database['public']['Functions']['get_submission_dashboard']['Returns'];
export type UserActivitySummaryResult = Database['public']['Functions']['get_user_activity_summary']['Returns'];
export type UserActivityTimelineResult = Database['public']['Functions']['get_user_activity_timeline']['Returns'];
export type UserIdentitiesResult = Database['public']['Functions']['get_user_identities']['Returns'];
export type IsBookmarkedBatchResult = Database['public']['Functions']['is_bookmarked_batch']['Returns'];

export type BookmarkItem = {
  content_type: Database['public']['Enums']['content_category'];
  content_slug: string;
};

export class AccountService {
  constructor(private supabase: SupabaseClient<Database>) {}

  // ... existing methods ...
  async getAccountDashboard(userId: string) {
    const { data, error } = await this.supabase.rpc('get_account_dashboard', { p_user_id: userId });
    if (error) throw error;
    return data as AccountDashboardResult;
  }

  async getUserLibrary(userId: string) {
    const { data, error } = await this.supabase.rpc('get_user_library', { p_user_id: userId });
    if (error) throw error;
    return data as UserLibraryResult;
  }

  async getUserDashboard(userId: string) {
    const { data, error } = await this.supabase.rpc('get_user_dashboard', { p_user_id: userId });
    if (error) throw error;
    return data as UserDashboardResult;
  }

  async getCollectionDetailWithItems(userId: string, slug: string) {
    const { data, error } = await this.supabase.rpc('get_collection_detail_with_items', { 
        p_user_id: userId,
        p_slug: slug
    });
    if (error) throw error;
    return data as CollectionDetailResult;
  }

  async getUserSettings(userId: string) {
    const { data, error } = await this.supabase.rpc('get_user_settings', { p_user_id: userId });
    if (error) throw error;
    return data as UserSettingsResult;
  }

  async getSponsorshipAnalytics(userId: string, sponsorshipId: string) {
    const { data, error } = await this.supabase.rpc('get_sponsorship_analytics', {
        p_user_id: userId,
        p_sponsorship_id: sponsorshipId
    });
    if (error) throw error;
    return data as SponsorshipAnalyticsResult;
  }

  async getUserCompanies(userId: string) {
    const { data, error } = await this.supabase.rpc('get_user_companies', { p_user_id: userId });
    if (error) throw error;
    return data as UserCompaniesResult;
  }

  async getUserSponsorships(userId: string) {
    const { data, error } = await this.supabase.rpc('get_user_sponsorships', { p_user_id: userId });
    if (error) throw error;
    return data as UserSponsorshipsResult;
  }

  async getSubmissionDashboard(recentLimit = 5, contributorsLimit = 5) {
    const { data, error } = await this.supabase.rpc('get_submission_dashboard', {
        p_recent_limit: recentLimit,
        p_contributors_limit: contributorsLimit
    });
    if (error) throw error;
    return data as SubmissionDashboardResult;
  }

  // NEW METHODS for user actions

  async isBookmarked(userId: string, contentType: Database['public']['Enums']['content_category'], contentSlug: string) {
    const { data, error } = await this.supabase.rpc('is_bookmarked', {
        p_user_id: userId,
        p_content_type: contentType,
        p_content_slug: contentSlug
    });
    if (error) throw error;
    return data as boolean;
  }

  async isBookmarkedBatch(userId: string, items: BookmarkItem[]) {
    const { data, error } = await this.supabase.rpc('is_bookmarked_batch', {
        p_user_id: userId,
        p_items: items
    });
    if (error) throw error;
    return data as IsBookmarkedBatchResult;
  }

  async isFollowing(followerId: string, followingId: string) {
    const { data, error } = await this.supabase.rpc('is_following', {
        follower_id: followerId,
        following_id: followingId
    });
    if (error) throw error;
    return data as boolean;
  }

  async isFollowingBatch(followerId: string, followedUserIds: string[]) {
    const { data, error } = await this.supabase.rpc('is_following_batch', {
        p_follower_id: followerId,
        p_followed_user_ids: followedUserIds
    });
    if (error) throw error;
    return data as { followed_user_id: string; is_following: boolean }[];
  }

  async getUserActivitySummary(userId: string) {
    const { data, error } = await this.supabase.rpc('get_user_activity_summary', {
        p_user_id: userId
    });
    if (error) throw error;
    return data as UserActivitySummaryResult;
  }

  async getUserActivityTimeline(userId: string, type?: string, limit = 20, offset = 0) {
    const { data, error } = await this.supabase.rpc('get_user_activity_timeline', {
        p_user_id: userId,
        ...(type !== undefined ? { p_type: type } : {}),
        p_limit: limit,
        p_offset: offset
    });
    if (error) throw error;
    return data as UserActivityTimelineResult;
  }

  async getUserIdentities(userId: string) {
    const { data, error } = await this.supabase.rpc('get_user_identities', {
        p_user_id: userId
    });
    if (error) throw error;
    return data as UserIdentitiesResult;
  }
}
