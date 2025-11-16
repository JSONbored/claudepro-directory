/**
 * Database Type Overrides
 *
 * PostgreSQL marks ALL view columns as nullable, even when underlying table columns are NOT NULL.
 * This is a PostgreSQL limitation - it cannot determine nullability through complex queries (UNION ALL, JOINs).
 *
 * Solution: Manually override view Row types while preserving all other generated types.
 */

import type { DisplayableContent } from '@/src/lib/types/component.types';
import type { Database as DatabaseGenerated, Json } from './database.types';

/**
 * Override view nullability - preserve Tables, Enums, Functions
 */
type DatabaseWithViewOverrides = {
  public: {
    Tables: Omit<DatabaseGenerated['public']['Tables'], 'content' | 'jobs'> & {
      content: {
        Row: Omit<DatabaseGenerated['public']['Tables']['content']['Row'], 'category'> & {
          category: DatabaseGenerated['public']['Enums']['content_category'];
        };
        Insert: DatabaseGenerated['public']['Tables']['content']['Insert'];
        Update: DatabaseGenerated['public']['Tables']['content']['Update'];
        Relationships: DatabaseGenerated['public']['Tables']['content']['Relationships'];
      };
      jobs: {
        Row: Omit<
          DatabaseGenerated['public']['Tables']['jobs']['Row'],
          'tags' | 'benefits' | 'requirements'
        > & {
          tags: string[];
          benefits: string[];
          requirements: string[];
        };
        Insert: DatabaseGenerated['public']['Tables']['jobs']['Insert'];
        Update: DatabaseGenerated['public']['Tables']['jobs']['Update'];
        Relationships: DatabaseGenerated['public']['Tables']['jobs']['Relationships'];
      };
    };
    Enums: DatabaseGenerated['public']['Enums'];
    Functions: Omit<
      DatabaseGenerated['public']['Functions'],
      | 'submit_content_for_review'
      | 'track_user_interaction'
      | 'get_contact_commands'
      | 'get_navigation_menu'
      | 'get_jobs_list'
      | 'get_featured_jobs'
      | 'get_quiz_configuration'
      | 'get_active_subscribers'
      | 'get_sponsorship_analytics'
      | 'get_user_sponsorships'
      | 'get_company_admin_profile'
      | 'get_companies_list'
      | 'get_content_templates'
      | 'get_job_detail'
      | 'get_jobs_count'
      | 'filter_jobs'
      | 'get_user_collection_detail'
      | 'get_form_fields_for_content_type'
      | 'get_active_announcement'
      | 'get_recent_content'
      | 'get_account_dashboard'
      | 'get_user_dashboard'
      | 'get_user_library'
      | 'get_user_settings'
      | 'get_user_profile'
      | 'get_submission_dashboard'
      | 'get_similar_content'
      | 'get_company_profile'
      | 'get_collection_detail_with_items'
      | 'get_community_directory'
      | 'get_recommendations'
      | 'get_reviews_with_stats'
      | 'get_enriched_content_list'
      | 'get_content_paginated_slim'
      | 'get_changelog_overview'
      | 'get_changelog_detail'
      | 'get_user_activity_summary'
      | 'get_user_activity_timeline'
      | 'get_user_identities'
      | 'get_homepage_complete'
      | 'get_user_companies'
      | 'get_content_detail_complete'
      | 'get_content_paginated'
      | 'get_enriched_content'
      | 'get_my_submissions'
      | 'get_pending_submissions'
      | 'get_user_affinities'
      | 'get_user_interaction_summary'
      | 'get_user_recent_interactions'
      | 'get_collection_items_grouped'
      | 'get_changelog_with_category_stats'
      | 'get_submission_stats'
      | 'get_top_contributors'
      | 'get_recent_merged'
      | 'get_job_detail'
      | 'filter_jobs'
      | 'get_user_collection_detail'
    > & {
      submit_content_for_review: {
        Args: {
          p_author: string;
          p_author_profile_url?: string | null;
          p_category: DatabaseGenerated['public']['Enums']['content_category'];
          p_content_data: DatabaseGenerated['public']['Functions']['submit_content_for_review']['Args']['p_content_data'];
          p_description: string;
          p_github_url?: string | null;
          p_name: string;
          p_submission_type: DatabaseGenerated['public']['Enums']['submission_type'];
          p_tags?: string[] | null;
        };
        Returns: DatabaseGenerated['public']['Functions']['submit_content_for_review']['Returns'];
      };
      track_user_interaction: {
        Args: {
          p_content_type: string;
          p_content_slug: string;
          p_interaction_type: DatabaseGenerated['public']['Enums']['interaction_type'];
          p_session_id?: string | null;
          p_metadata?: Json | null;
        };
        Returns: DatabaseGenerated['public']['Functions']['track_user_interaction']['Returns'];
      };
      /**
       * RPCs with Args: never - override to accept empty object {}
       * This allows type-safe calls with {} instead of undefined as never
       */
      get_contact_commands: {
        Args: {};
        Returns: DatabaseGenerated['public']['Functions']['get_contact_commands']['Returns'];
      };
      get_navigation_menu: {
        Args: {};
        Returns: DatabaseGenerated['public']['Functions']['get_navigation_menu']['Returns'];
      };
      get_jobs_list: {
        Args: {};
        Returns: DatabaseGenerated['public']['Functions']['get_jobs_list']['Returns'];
      };
      get_featured_jobs: {
        Args: {};
        Returns: DatabaseGenerated['public']['Functions']['get_featured_jobs']['Returns'];
      };
      get_quiz_configuration: {
        Args: {};
        Returns: DatabaseGenerated['public']['Functions']['get_quiz_configuration']['Returns'];
      };
      get_active_subscribers: {
        Args: {};
        Returns: DatabaseGenerated['public']['Functions']['get_active_subscribers']['Returns'];
      };
      /**
       * RPCs returning Json - override to use specific return types for type safety
       */
      get_sponsorship_analytics: {
        Args: DatabaseGenerated['public']['Functions']['get_sponsorship_analytics']['Args'];
        Returns: GetSponsorshipAnalyticsReturn | null;
      };
      get_user_sponsorships: {
        Args: DatabaseGenerated['public']['Functions']['get_user_sponsorships']['Args'];
        Returns: GetUserSponsorshipsReturn | null;
      };
      get_company_admin_profile: {
        Args: DatabaseGenerated['public']['Functions']['get_company_admin_profile']['Args'];
        Returns: GetCompanyAdminProfileReturn[] | null;
      };
      get_companies_list: {
        Args: DatabaseGenerated['public']['Functions']['get_companies_list']['Args'];
        Returns: GetCompaniesListReturn;
      };
      get_content_templates: {
        Args: DatabaseGenerated['public']['Functions']['get_content_templates']['Args'];
        Returns: GetContentTemplatesReturn;
      };
      get_job_detail: {
        Args: DatabaseGenerated['public']['Functions']['get_job_detail']['Args'];
        Returns: GetJobDetailReturn;
      };
      get_jobs_count: {
        Args: {};
        Returns: number | null;
      };
      filter_jobs: {
        Args: DatabaseGenerated['public']['Functions']['filter_jobs']['Args'];
        Returns: FilterJobsReturn;
      };
      get_user_collection_detail: {
        Args: DatabaseGenerated['public']['Functions']['get_user_collection_detail']['Args'];
        Returns: GetUserCollectionDetailReturn;
      };
      get_form_fields_for_content_type: {
        Args: DatabaseGenerated['public']['Functions']['get_form_fields_for_content_type']['Args'];
        Returns: GetFormFieldsForContentTypeReturn | null;
      };
      get_active_announcement: {
        Args: DatabaseGenerated['public']['Functions']['get_active_announcement']['Args'];
        Returns: DatabaseGenerated['public']['Tables']['announcements']['Row'] | null;
      };
      get_recent_content: {
        Args: DatabaseGenerated['public']['Functions']['get_recent_content']['Args'];
        Returns: GetRecentContentReturn;
      };
      /**
       * High-priority RPCs used in main codebase - override Json returns with specific types
       */
      get_account_dashboard: {
        Args: DatabaseGenerated['public']['Functions']['get_account_dashboard']['Args'];
        Returns: GetAccountDashboardReturn | null;
      };
      get_user_dashboard: {
        Args: DatabaseGenerated['public']['Functions']['get_user_dashboard']['Args'];
        Returns: GetUserDashboardReturn | null;
      };
      get_user_library: {
        Args: DatabaseGenerated['public']['Functions']['get_user_library']['Args'];
        Returns: GetUserLibraryReturn | null;
      };
      get_user_settings: {
        Args: DatabaseGenerated['public']['Functions']['get_user_settings']['Args'];
        Returns: GetUserSettingsReturn | null;
      };
      get_user_profile: {
        Args: DatabaseGenerated['public']['Functions']['get_user_profile']['Args'];
        Returns: GetUserProfileReturn | null;
      };
      get_submission_dashboard: {
        Args: DatabaseGenerated['public']['Functions']['get_submission_dashboard']['Args'];
        Returns: GetSubmissionDashboardReturn | null;
      };
      // get_related_content returns TABLE (SETOF), not JSONB - already properly typed in database.types.ts
      get_similar_content: {
        Args: DatabaseGenerated['public']['Functions']['get_similar_content']['Args'];
        Returns: GetSimilarContentReturn | null;
      };
      get_company_profile: {
        Args: DatabaseGenerated['public']['Functions']['get_company_profile']['Args'];
        Returns: GetCompanyProfileReturn | null;
      };
      get_collection_detail_with_items: {
        Args: DatabaseGenerated['public']['Functions']['get_collection_detail_with_items']['Args'];
        Returns: GetCollectionDetailWithItemsReturn | null;
      };
      get_community_directory: {
        Args: DatabaseGenerated['public']['Functions']['get_community_directory']['Args'];
        Returns: GetCommunityDirectoryReturn | null;
      };
      get_recommendations: {
        Args: DatabaseGenerated['public']['Functions']['get_recommendations']['Args'];
        Returns: GetRecommendationsReturn | null;
      };
      get_reviews_with_stats: {
        Args: DatabaseGenerated['public']['Functions']['get_reviews_with_stats']['Args'];
        Returns: GetReviewsWithStatsReturn | null;
      };
      get_enriched_content_list: {
        Args: DatabaseGenerated['public']['Functions']['get_enriched_content_list']['Args'];
        Returns: GetEnrichedContentListReturn;
      };
      get_content_paginated_slim: {
        Args: DatabaseGenerated['public']['Functions']['get_content_paginated_slim']['Args'];
        Returns: GetPaginatedContentReturn | null;
      };
      get_changelog_overview: {
        Args: DatabaseGenerated['public']['Functions']['get_changelog_overview']['Args'];
        Returns: GetChangelogOverviewReturn;
      };
      get_changelog_detail: {
        Args: DatabaseGenerated['public']['Functions']['get_changelog_detail']['Args'];
        Returns: GetChangelogDetailReturn;
      };
      get_user_activity_summary: {
        Args: DatabaseGenerated['public']['Functions']['get_user_activity_summary']['Args'];
        Returns: GetUserActivitySummaryReturn;
      };
      get_user_activity_timeline: {
        Args: DatabaseGenerated['public']['Functions']['get_user_activity_timeline']['Args'];
        Returns: GetUserActivityTimelineReturn;
      };
      get_user_identities: {
        Args: DatabaseGenerated['public']['Functions']['get_user_identities']['Args'];
        Returns: GetUserIdentitiesReturn;
      };
      get_homepage_complete: {
        Args: DatabaseGenerated['public']['Functions']['get_homepage_complete']['Args'];
        Returns: GetHomepageCompleteReturn | null;
      };
      get_user_companies: {
        Args: DatabaseGenerated['public']['Functions']['get_user_companies']['Args'];
        Returns: GetUserCompaniesReturn | null;
      };
      get_content_detail_complete: {
        Args: DatabaseGenerated['public']['Functions']['get_content_detail_complete']['Args'];
        Returns: GetContentDetailCompleteReturn | null;
      };
      get_content_paginated: {
        Args: DatabaseGenerated['public']['Functions']['get_content_paginated']['Args'];
        Returns: GetEnrichedContentListReturn; // Uses same structure as enriched_content_list
      };
      get_enriched_content: {
        Args: DatabaseGenerated['public']['Functions']['get_enriched_content']['Args'];
        Returns: GetEnrichedContentListReturn; // Uses same structure as enriched_content_list
      };
      get_my_submissions: {
        Args: DatabaseGenerated['public']['Functions']['get_my_submissions']['Args'];
        Returns: GetMySubmissionsReturn;
      };
      get_pending_submissions: {
        Args: DatabaseGenerated['public']['Functions']['get_pending_submissions']['Args'];
        Returns: GetPendingSubmissionsReturn;
      };
      get_user_affinities: {
        Args: DatabaseGenerated['public']['Functions']['get_user_affinities']['Args'];
        Returns: GetUserAffinitiesReturn;
      };
      get_user_interaction_summary: {
        Args: DatabaseGenerated['public']['Functions']['get_user_interaction_summary']['Args'];
        Returns: GetUserInteractionSummaryReturn;
      };
      get_user_recent_interactions: {
        Args: DatabaseGenerated['public']['Functions']['get_user_recent_interactions']['Args'];
        Returns: GetUserRecentInteractionsReturn;
      };
      get_collection_items_grouped: {
        Args: DatabaseGenerated['public']['Functions']['get_collection_items_grouped']['Args'];
        Returns: GetCollectionItemsGroupedReturn;
      };
      get_changelog_with_category_stats: {
        Args: DatabaseGenerated['public']['Functions']['get_changelog_with_category_stats']['Args'];
        Returns: GetChangelogWithCategoryStatsReturn;
      };
      get_submission_stats: {
        Args: {}; // RPC has Args: never, override to accept empty object
        Returns: GetSubmissionStatsReturn;
      };
      get_top_contributors: {
        Args: DatabaseGenerated['public']['Functions']['get_top_contributors']['Args'];
        Returns: GetTopContributorsReturn;
      };
      get_recent_merged: {
        Args: DatabaseGenerated['public']['Functions']['get_recent_merged']['Args'];
        Returns: GetRecentMergedReturn;
      };
      get_job_detail: {
        Args: DatabaseGenerated['public']['Functions']['get_job_detail']['Args'];
        Returns: GetJobDetailReturn;
      };
      filter_jobs: {
        Args: DatabaseGenerated['public']['Functions']['filter_jobs']['Args'];
        Returns: FilterJobsReturn;
      };
      get_user_collection_detail: {
        Args: DatabaseGenerated['public']['Functions']['get_user_collection_detail']['Args'];
        Returns: GetUserCollectionDetailReturn;
      };
      // search_content_optimized and search_by_popularity return TABLE (SETOF), not JSONB
      // Already properly typed in database.types.ts - no override needed
    };
    Views: {
      /**
       * search_results view
       * Extends content table with popularity and trending metrics
       *
       * NOT NULL fields from content table
       * Computed metrics default to 0 via COALESCE, so never null
       */
      search_results: {
        Row: {
          // Content fields (NOT NULL from content table)
          id: string;
          slug: string;
          title: string;
          description: string;
          category: ContentCategory;
          author: string;
          date_added: string;
          tags: string[];
          source_table: string;

          // Metrics (COALESCE defaults to 0, never null)
          bookmark_count: number;
          popularity_score: number;
          trending_score: number;
          recent_bookmarks: number;

          // Timestamps (NOT NULL from content table)
          created_at: string;
          updated_at: string;

          // Nullable fields
          author_profile_url: string | null;
          features: string[] | null;
          use_cases: string[] | null;
        };
      };

      recommendation_results: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          category: ContentCategory;
          author: string;
          date_added: string;
          tags: string[];
          source_table: string;
          created_at: string;
          updated_at: string;
          recommendation_score: number;
          bookmark_count: number;
          popularity_score: number;
          user_id: string | null;
          author_profile_url: string | null;
          features: string[] | null;
          use_cases: string[] | null;
          examples: DatabaseGenerated['public']['Tables']['content']['Row']['examples'];
        };
      };
    };
  };
};

/**
 * Final Database type - just view overrides (no custom function extensions needed)
 */
export type Database = DatabaseWithViewOverrides;

/**
 * Re-export convenience types from generated database types
 */
export type { Json } from './database.types';

/**
 * Table row helper type
 * @example
 * type User = Tables<'users'>
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/**
 * Table insert helper type
 * @example
 * type UserInsert = TablesInsert<'users'>
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/**
 * Table update helper type
 * @example
 * type UserUpdate = TablesUpdate<'users'>
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

/**
 * View row helper type
 * @example
 * type SearchResults = Views<'search_results'>
 */
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];

/**
 * Enum helper type
 * @example
 * type UserRole = Enums<'user_role'>
 */
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

/**
 * Common enum type aliases (for convenience)
 * Extracted from database enums for easier usage throughout the codebase
 */
export type SubmissionStatus = Enums<'submission_status'>;
export type SubmissionType = Enums<'submission_type'>;
export type ContentCategory = Enums<'content_category'>;

/**
 * Type guard for ContentCategory enum
 * Validates that a string value is a valid content category
 */
export function isContentCategory(value: string): value is ContentCategory {
  return CONTENT_CATEGORY_VALUES.includes(value as ContentCategory);
}
export type JobStatus = Enums<'job_status'>;
/**
 * Job listing categories (from jobs.category CHECK constraint)
 * These are different from ContentCategory - they categorize individual job postings
 * (engineering, design, product, etc.) not content types (agents, mcp, rules, etc.)
 */
export type JobCategory =
  | 'engineering'
  | 'design'
  | 'product'
  | 'marketing'
  | 'sales'
  | 'support'
  | 'research'
  | 'data'
  | 'operations'
  | 'leadership'
  | 'consulting'
  | 'education'
  | 'other';
export type SortOption = Enums<'sort_option'>;

/**
 * Sort option values array for runtime use (validation, etc.)
 * Must match database enum: sort_option
 * Database values: relevance, date, popularity, name, updated, created, views, trending
 */
export const SORT_OPTION_VALUES = [
  'relevance',
  'date',
  'popularity',
  'name',
  'updated',
  'created',
  'views',
  'trending',
] as const satisfies readonly SortOption[];

/**
 * Type guard for sort_option enum values
 */
export function isSortOption(value: string): value is SortOption {
  return SORT_OPTION_VALUES.includes(value as SortOption);
}

export type SortDirection = Enums<'sort_direction'>;

/**
 * Sort direction values array for runtime use (validation, etc.)
 * Must match database enum: sort_direction
 * Database values: asc, desc
 */
export const SORT_DIRECTION_VALUES = ['asc', 'desc'] as const satisfies readonly SortDirection[];

/**
 * Type guard for sort_direction enum values
 */
export function isSortDirection(value: string): value is SortDirection {
  return SORT_DIRECTION_VALUES.includes(value as SortDirection);
}
export type InteractionType = Enums<'interaction_type'>;
export type NewsletterSource = Enums<'newsletter_source'>;

/**
 * Newsletter source values array for runtime use (validation, etc.)
 * Must match database enum: newsletter_source
 * Database values: footer, homepage, modal, content_page, inline, post_copy, resend_import, oauth_signup
 */
export const NEWSLETTER_SOURCE_VALUES = [
  'footer',
  'homepage',
  'modal',
  'content_page',
  'inline',
  'post_copy',
  'resend_import',
  'oauth_signup',
] as const satisfies readonly NewsletterSource[];

/**
 * Type guard for newsletter_source enum values
 */
export function isNewsletterSource(value: string): value is NewsletterSource {
  return NEWSLETTER_SOURCE_VALUES.includes(value as NewsletterSource);
}

export type NotificationPriority = Enums<'notification_priority'>;

/**
 * Valid values for notification_priority enum
 * Source: Database enum definition
 */
export const NOTIFICATION_PRIORITY_VALUES = [
  'high',
  'medium',
  'low',
] as const satisfies readonly NotificationPriority[];

/**
 * Type guard for notification_priority enum values
 */
export function isNotificationPriority(value: string): value is NotificationPriority {
  return NOTIFICATION_PRIORITY_VALUES.includes(value as NotificationPriority);
}
export type NotificationType = Enums<'notification_type'>;

/**
 * Valid values for notification_type enum
 * Source: Database enum definition
 */
export const NOTIFICATION_TYPE_VALUES = [
  'announcement',
  'feedback',
] as const satisfies readonly NotificationType[];

/**
 * Type guard for notification_type enum values
 */
export function isNotificationType(value: string): value is NotificationType {
  return NOTIFICATION_TYPE_VALUES.includes(value as NotificationType);
}

export type ContactCategory = Enums<'contact_category'>;

/**
 * Contact category values array for runtime use (validation, etc.)
 * Must match database enum: contact_category
 * Database values: bug, feature, partnership, general, other
 */
export const CONTACT_CATEGORY_VALUES = [
  'bug',
  'feature',
  'partnership',
  'general',
  'other',
] as const satisfies readonly ContactCategory[];

/**
 * Type guard for contact_category enum values
 */
export function isContactCategory(value: string): value is ContactCategory {
  return CONTACT_CATEGORY_VALUES.includes(value as ContactCategory);
}

export type ContactActionType = Enums<'contact_action_type'>;

/**
 * Valid values for contact_action_type enum
 * Source: Database enum definition
 */
export const CONTACT_ACTION_TYPE_VALUES = [
  'internal',
  'external',
  'route',
  'sheet',
  'easter-egg',
] as const satisfies readonly ContactActionType[];

/**
 * Type guard for contact_action_type enum values
 */
export function isContactActionType(value: string): value is ContactActionType {
  return CONTACT_ACTION_TYPE_VALUES.includes(value as ContactActionType);
}
export type TrendingMetric = Enums<'trending_metric'>;

/**
 * Valid values for trending_metric enum
 * Source: Database enum definition
 */
export const TRENDING_METRIC_VALUES = [
  'views',
  'likes',
  'shares',
  'downloads',
  'all',
] as const satisfies readonly TrendingMetric[];

/**
 * Type guard for trending_metric enum values
 */
export function isTrendingMetric(value: string): value is TrendingMetric {
  return TRENDING_METRIC_VALUES.includes(value as TrendingMetric);
}

export type TrendingPeriod = Enums<'trending_period'>;

/**
 * Valid values for trending_period enum
 * Source: Database enum definition
 */
export const TRENDING_PERIOD_VALUES = [
  'today',
  'week',
  'month',
  'year',
  'all',
] as const satisfies readonly TrendingPeriod[];

/**
 * Type guard for trending_period enum values
 */
export function isTrendingPeriod(value: string): value is TrendingPeriod {
  return TRENDING_PERIOD_VALUES.includes(value as TrendingPeriod);
}

export type AnnouncementPriority = Enums<'announcement_priority'>;

/**
 * Valid values for announcement_priority enum
 * Source: Database enum definition
 */
export const ANNOUNCEMENT_PRIORITY_VALUES = [
  'high',
  'medium',
  'low',
] as const satisfies readonly AnnouncementPriority[];

/**
 * Type guard for announcement_priority enum values
 */
export function isAnnouncementPriority(value: string): value is AnnouncementPriority {
  return ANNOUNCEMENT_PRIORITY_VALUES.includes(value as AnnouncementPriority);
}

export type AnnouncementVariant = Enums<'announcement_variant'>;

/**
 * Valid values for announcement_variant enum
 * Source: Database enum definition
 */
export const ANNOUNCEMENT_VARIANT_VALUES = [
  'default',
  'outline',
  'secondary',
  'destructive',
] as const satisfies readonly AnnouncementVariant[];

/**
 * Type guard for announcement_variant enum values
 */
export function isAnnouncementVariant(value: string): value is AnnouncementVariant {
  return ANNOUNCEMENT_VARIANT_VALUES.includes(value as AnnouncementVariant);
}

export type ChangelogCategory = Enums<'changelog_category'>;
export type ConfettiVariant = Enums<'confetti_variant'>;

/**
 * Valid values for confetti_variant enum
 * Source: Database enum definition
 */
export const CONFETTI_VARIANT_VALUES = [
  'success',
  'celebration',
  'milestone',
  'subtle',
] as const satisfies readonly ConfettiVariant[];

/**
 * Type guard for confetti_variant enum values
 */
export function isConfettiVariant(value: string): value is ConfettiVariant {
  return CONFETTI_VARIANT_VALUES.includes(value as ConfettiVariant);
}

export type ExperienceLevel = Enums<'experience_level'>;

/**
 * Valid values for experience_level enum
 * Source: Database enum definition
 */
export const EXPERIENCE_LEVEL_VALUES = [
  'beginner',
  'intermediate',
  'advanced',
] as const satisfies readonly ExperienceLevel[];

/**
 * Type guard for experience_level enum values
 */
export function isExperienceLevel(value: string): value is ExperienceLevel {
  return EXPERIENCE_LEVEL_VALUES.includes(value as ExperienceLevel);
}

export type FocusAreaType = Enums<'focus_area_type'>;

/**
 * Valid values for focus_area_type enum
 * Source: Database enum definition
 */
export const FOCUS_AREA_TYPE_VALUES = [
  'security',
  'performance',
  'documentation',
  'testing',
  'code-quality',
  'automation',
] as const satisfies readonly FocusAreaType[];

/**
 * Type guard for focus_area_type enum values
 */
export function isFocusAreaType(value: string): value is FocusAreaType {
  return FOCUS_AREA_TYPE_VALUES.includes(value as FocusAreaType);
}

/**
 * Valid values for changelog_category enum
 * Source: Database enum definition
 */
export const CHANGELOG_CATEGORY_VALUES = [
  'Added',
  'Changed',
  'Deprecated',
  'Removed',
  'Fixed',
  'Security',
] as const satisfies readonly ChangelogCategory[];

/**
 * Type guard for changelog_category enum values
 */
export function isChangelogCategory(value: string): value is ChangelogCategory {
  return CHANGELOG_CATEGORY_VALUES.includes(value as ChangelogCategory);
}
export type FieldScope = Enums<'field_scope'>;

/**
 * Valid values for field_scope enum
 * Source: Database enum definition
 */
export const FIELD_SCOPE_VALUES = [
  'common',
  'type_specific',
  'tags',
] as const satisfies readonly FieldScope[];

/**
 * Type guard for field_scope enum values
 */
export function isFieldScope(value: string): value is FieldScope {
  return FIELD_SCOPE_VALUES.includes(value as FieldScope);
}

export type FieldType = Enums<'field_type'>;

/**
 * Valid values for field_type enum
 * Source: Database enum definition
 */
export const FIELD_TYPE_VALUES = [
  'text',
  'textarea',
  'number',
  'select',
] as const satisfies readonly FieldType[];

/**
 * Type guard for field_type enum values
 */
export function isFieldType(value: string): value is FieldType {
  return FIELD_TYPE_VALUES.includes(value as FieldType);
}

export type FormFieldType = Enums<'form_field_type'>;

/**
 * Valid values for form_field_type enum
 * Source: Database enum definition
 * Note: This enum has the same values as field_type, but they are separate database enums
 */
export const FORM_FIELD_TYPE_VALUES = [
  'text',
  'textarea',
  'number',
  'select',
] as const satisfies readonly FormFieldType[];

/**
 * Type guard for form_field_type enum values
 */
export function isFormFieldType(value: string): value is FormFieldType {
  return FORM_FIELD_TYPE_VALUES.includes(value as FormFieldType);
}

export type FormGridColumn = Enums<'form_grid_column'>;

/**
 * Valid values for form_grid_column enum
 * Source: Database enum definition
 * Note: This enum has the same values as grid_column, but they are separate database enums
 */
export const FORM_GRID_COLUMN_VALUES = [
  'full',
  'half',
  'third',
  'two-thirds',
] as const satisfies readonly FormGridColumn[];

/**
 * Type guard for form_grid_column enum values
 */
export function isFormGridColumn(value: string): value is FormGridColumn {
  return FORM_GRID_COLUMN_VALUES.includes(value as FormGridColumn);
}

export type FormIconPosition = Enums<'form_icon_position'>;
export type GridColumn = Enums<'grid_column'>;
export type GuideSubcategory = Enums<'guide_subcategory'>;
export type IconPosition = Enums<'icon_position'>;
export type IntegrationType = Enums<'integration_type'>;

/**
 * Valid values for guide_subcategory enum
 * Source: Database enum definition
 */
export const GUIDE_SUBCATEGORY_VALUES = [
  'tutorials',
  'comparisons',
  'workflows',
  'use-cases',
  'troubleshooting',
] as const satisfies readonly GuideSubcategory[];

/**
 * Type guard for guide_subcategory enum values
 */
export function isGuideSubcategory(value: string): value is GuideSubcategory {
  return GUIDE_SUBCATEGORY_VALUES.includes(value as GuideSubcategory);
}

/**
 * Valid values for integration_type enum
 * Source: Database enum definition
 */
export const INTEGRATION_TYPE_VALUES = [
  'github',
  'database',
  'cloud-aws',
  'cloud-gcp',
  'cloud-azure',
  'communication',
  'none',
] as const satisfies readonly IntegrationType[];

/**
 * Type guard for integration_type enum values
 */
export function isIntegrationType(value: string): value is IntegrationType {
  return INTEGRATION_TYPE_VALUES.includes(value as IntegrationType);
}

export type UseCaseType = Enums<'use_case_type'>;

/**
 * Valid values for use_case_type enum
 * Source: Database enum definition
 */
export const USE_CASE_TYPE_VALUES = [
  'code-review',
  'api-development',
  'frontend-development',
  'data-science',
  'content-creation',
  'devops-infrastructure',
  'general-development',
  'testing-qa',
  'security-audit',
] as const satisfies readonly UseCaseType[];

/**
 * Type guard for use_case_type enum values
 */
export function isUseCaseType(value: string): value is UseCaseType {
  return USE_CASE_TYPE_VALUES.includes(value as UseCaseType);
}

export type WebhookDirection = Enums<'webhook_direction'>;

/**
 * Valid values for webhook_direction enum
 * Source: Database enum definition
 */
export const WEBHOOK_DIRECTION_VALUES = [
  'inbound',
  'outbound',
] as const satisfies readonly WebhookDirection[];

/**
 * Type guard for webhook_direction enum values
 */
export function isWebhookDirection(value: string): value is WebhookDirection {
  return WEBHOOK_DIRECTION_VALUES.includes(value as WebhookDirection);
}

export type WebhookSource = Enums<'webhook_source'>;
export type SettingType = Enums<'setting_type'>;

/**
 * Setting type values array for runtime use (validation, dropdowns, etc.)
 */
export const SETTING_TYPE_VALUES = [
  'boolean',
  'string',
  'number',
  'json',
] as const satisfies readonly SettingType[];

/**
 * Type guard for setting_type enum values
 */
export function isSettingType(value: string): value is SettingType {
  return SETTING_TYPE_VALUES.includes(value as SettingType);
}

export type WorkplaceType = Enums<'workplace_type'>;

/**
 * Workplace type values array for runtime use (validation, dropdowns, etc.)
 */
export const WORKPLACE_TYPE_VALUES = [
  'Remote',
  'On site',
  'Hybrid',
] as const satisfies readonly WorkplaceType[];

/**
 * Type guard for workplace_type enum values
 */
export function isWorkplaceType(value: string): value is WorkplaceType {
  return WORKPLACE_TYPE_VALUES.includes(value as WorkplaceType);
}

export type UserTier = Enums<'user_tier'>;

/**
 * User tier values array for runtime use (validation, dropdowns, etc.)
 */
export const USER_TIER_VALUES = [
  'free',
  'pro',
  'enterprise',
] as const satisfies readonly UserTier[];

/**
 * Type guard for user_tier enum values
 */
export function isUserTier(value: string): value is UserTier {
  return USER_TIER_VALUES.includes(value as UserTier);
}

export type PaymentStatus = Enums<'payment_status'>;

/**
 * Payment status values array for runtime use (validation, dropdowns, etc.)
 */
export const PAYMENT_STATUS_VALUES = [
  'unpaid',
  'paid',
  'refunded',
] as const satisfies readonly PaymentStatus[];

/**
 * Type guard for payment_status enum values
 */
export function isPaymentStatus(value: string): value is PaymentStatus {
  return PAYMENT_STATUS_VALUES.includes(value as PaymentStatus);
}

export type Environment = Enums<'environment'>;

/**
 * Environment values array for runtime use (validation, dropdowns, etc.)
 */
export const ENVIRONMENT_VALUES = [
  'development',
  'preview',
  'production',
] as const satisfies readonly Environment[];

/**
 * Type guard for environment enum values
 */
export function isEnvironment(value: string): value is Environment {
  return ENVIRONMENT_VALUES.includes(value as Environment);
}

/**
 * Enum value arrays (for runtime use, e.g., Zod schemas)
 * These arrays are extracted from database enums and validated by TypeScript
 *
 * Note: Zod's z.enum() requires a tuple with at least one element [T, ...T[]]
 * These arrays satisfy that requirement and are type-checked against the enum
 */
export const CONTENT_CATEGORY_VALUES = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
  'jobs',
  'changelog',
] as const satisfies readonly ContentCategory[];

/**
 * Job listing category values (from jobs.category CHECK constraint)
 * These are different from ContentCategory - they categorize individual job postings
 */
export const JOB_CATEGORY_VALUES = [
  'engineering',
  'design',
  'product',
  'marketing',
  'sales',
  'support',
  'research',
  'data',
  'operations',
  'leadership',
  'consulting',
  'education',
  'other',
] as const satisfies readonly JobCategory[];

export const SUBMISSION_TYPE_VALUES = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
] as const satisfies readonly SubmissionType[];

/**
 * Type guard for submission_type enum values
 */
export function isSubmissionType(value: string): value is SubmissionType {
  return SUBMISSION_TYPE_VALUES.includes(value as SubmissionType);
}

export const JOB_STATUS_VALUES = [
  'draft',
  'pending_payment',
  'pending_review',
  'active',
  'expired',
  'rejected',
  'deleted',
] as const satisfies readonly JobStatus[];

/**
 * Type guard for job_status enum values
 */
export function isJobStatus(value: string): value is JobStatus {
  return JOB_STATUS_VALUES.includes(value as JobStatus);
}

export const SUBMISSION_STATUS_VALUES = [
  'pending',
  'approved',
  'rejected',
  'spam',
  'merged',
] as const satisfies readonly SubmissionStatus[];

/**
 * Type guard for submission_status enum values
 */
export function isSubmissionStatus(value: string): value is SubmissionStatus {
  return SUBMISSION_STATUS_VALUES.includes(value as SubmissionStatus);
}

export const INTERACTION_TYPE_VALUES = [
  'view',
  'copy',
  'bookmark',
  'click',
  'time_spent',
  'search',
  'filter',
  'screenshot',
  'share',
  'download',
  'pwa_installed',
  'pwa_launched',
  'newsletter_subscribe',
  'contact_interact',
  'contact_submit',
] as const satisfies readonly InteractionType[];

/**
 * Application-specific types (not from database)
 */

/**
 * Copy type for newsletter capture tracking
 * Used in copy-to-clipboard actions and email capture modals
 */
export type CopyType = 'llmstxt' | 'markdown' | 'code' | 'link';

/**
 * RPC Function Return Types
 *
 * PostgreSQL functions that return JSONB are typed as Json by default.
 * These manual type definitions provide proper TypeScript types for RPC returns.
 */

/**
 * get_user_settings RPC return type
 * Returns user profile settings and basic user data
 */
export type GetUserSettingsReturn = {
  user_data?: Pick<Tables<'users'>, 'slug' | 'name' | 'image' | 'tier'>;
  profile?: Pick<
    Tables<'users'>,
    | 'display_name'
    | 'bio'
    | 'work'
    | 'website'
    | 'social_x_link'
    | 'interests'
    | 'profile_public'
    | 'follow_email'
    | 'created_at'
  >;
};

/**
 * get_user_dashboard RPC return type
 * Returns user's submissions, companies, and job listings
 *
 * Note: submissions are from content_submissions table, mapped to match legacy structure
 */
export type GetUserDashboardReturn = {
  submissions: Array<{
    id: string;
    user_id: string;
    content_type: string; // Mapped from submission_type
    content_slug: string; // Mapped from approved_slug
    content_name: string; // Mapped from name
    pr_number: number | null;
    pr_url: string | null; // Mapped from github_pr_url
    branch_name: string | null;
    status: SubmissionStatus; // Mapped from submission_status enum
    submission_data: Json; // Mapped from content_data
    rejection_reason: string | null; // Mapped from moderator_notes
    created_at: string;
    updated_at: string;
    merged_at: string | null;
  }>;
  companies: Array<Tables<'companies'>>;
  jobs: Array<Tables<'jobs'>>;
};

/**
 * get_user_profile RPC return type
 * Returns complete public profile with stats, collections, and contributions
 */
export type GetUserProfileReturn = {
  profile: {
    id: string;
    slug: string;
    name: string;
    image: string | null;
    bio: string | null;
    website: string | null;
    tier: string | null;
    created_at: string;
    company: {
      name: string;
      logo: string | null;
    } | null;
  };
  stats: {
    followerCount: number;
    followingCount: number;
    collectionsCount: number;
    contributionsCount: number;
  };
  collections: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    is_public: boolean;
    item_count: number;
    view_count: number;
    created_at: string;
  }>;
  contributions: Array<{
    id: string;
    content_type: ContentCategory;
    slug: string;
    name: string;
    description: string | null;
    featured: boolean;
    view_count: number;
    download_count: number;
    created_at: string;
  }>;
  isFollowing: boolean;
  isOwner: boolean;
};

/**
 * get_homepage_complete RPC return type
 * Returns homepage content with member count and top contributors
 *
 * Structure from get_homepage_content_enriched():
 * - Returns only featured items (6 per category)
 * - Each item includes: id, slug, title, description, author, tags, source,
 *   created_at, date_added, category, viewCount, copyCount, _featured
 */
export type HomepageContentItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  author: string;
  tags: string[];
  source: string;
  created_at: string;
  date_added: string;
  category: ContentCategory;
  viewCount: number;
  copyCount: number;
  _featured: {
    rank: number;
    score: number;
  } | null;
};

export type GetHomepageCompleteReturn = {
  content: {
    categoryData: Record<ContentCategory, Array<HomepageContentItem>>;
    stats: Record<ContentCategory, number>;
    weekStart: string;
  };
  member_count: number;
  jobs_count: number;
  featured_jobs: Array<Tables<'jobs'>>;
  top_contributors: Array<
    Pick<Tables<'users'>, 'id' | 'slug' | 'name' | 'image' | 'bio' | 'work' | 'tier'>
  >;
};

/**
 * get_changelog_overview RPC return type
 * Returns paginated changelog entries with metadata, featured entries, and category counts
 * Replaces: get_changelog_entries + get_changelog_metadata
 */
export type GetChangelogOverviewReturn = {
  entries: Array<Tables<'changelog'>>;
  metadata: {
    totalEntries: number;
    dateRange: {
      earliest: string;
      latest: string;
    };
    categoryCounts: Partial<Record<ChangelogCategory, number>>;
  };
  featured: Array<Tables<'changelog'>>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

/**
 * get_changelog_detail RPC return type
 * Returns single changelog entry by slug with categories built from JSONB
 * Replaces: get_changelog_entry_by_slug
 */
export type GetChangelogDetailReturn = {
  entry:
    | (Tables<'changelog'> & {
        categories: Record<string, string[]>;
      })
    | null;
};

/**
 * @deprecated Use GetChangelogOverviewReturn instead
 * get_changelog_entries RPC return type (legacy)
 */
export type GetChangelogEntriesReturn = {
  entries: Array<Tables<'changelog'>>;
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

/**
 * @deprecated Use GetChangelogDetailReturn instead
 * get_changelog_entry_by_slug RPC return type (legacy)
 */
export type GetChangelogEntryBySlugReturn = Tables<'changelog'> | null;

/**
 * get_content_detail_complete RPC return type
 * Returns complete content details with analytics and related items
 */
export type GetContentDetailCompleteReturn = {
  content: Pick<
    Tables<'content'>,
    | 'id'
    | 'slug'
    | 'title'
    | 'display_title'
    | 'seo_title'
    | 'description'
    | 'author'
    | 'author_profile_url'
    | 'date_added'
    | 'tags'
    | 'content'
    | 'source'
    | 'documentation_url'
    | 'features'
    | 'use_cases'
    | 'examples'
    | 'metadata'
    | 'popularity_score'
    | 'created_at'
    | 'updated_at'
  > & {
    category: ContentCategory;
  };
  analytics: {
    view_count: number;
    copy_count: number;
    bookmark_count: number;
    is_bookmarked: boolean;
  };
  related: Array<{
    category: ContentCategory;
    slug: string;
    title: string;
    description: string;
    author: string;
    date_added: string;
    tags: string[];
    score: number;
    match_type: string;
    views: number;
    matched_tags: string[];
  }>;
  collection_items: Array<{
    id: string;
    collection_id: string;
    content_type: ContentCategory;
    content_slug: string;
    order: number;
    added_at: string;
    title: string;
    description: string;
    author: string;
  }> | null;
};

/**
 * get_enriched_content_list RPC return type
 * Returns list of enriched content items (no content/examples for bandwidth)
 */
export type GetEnrichedContentListReturn = Array<{
  id: string;
  slug: string;
  title: string;
  display_title: string | null;
  seo_title: string | null;
  description: string;
  author: string;
  author_profile_url: string | null;
  category: ContentCategory;
  tags: string[];
  source_table: string;
  created_at: string;
  updated_at: string;
  date_added: string;
  features: DatabaseGenerated['public']['Tables']['content']['Row']['features'];
  use_cases: DatabaseGenerated['public']['Tables']['content']['Row']['use_cases'];
  source: string | null;
  documentation_url: string | null;
  metadata: DatabaseGenerated['public']['Tables']['content']['Row']['metadata'];
  viewCount: number;
  copyCount: number;
  bookmarkCount: number;
  popularityScore: number;
  trendingScore: number;
  sponsoredContentId: string | null;
  sponsorshipTier: string | null;
  isSponsored: boolean;
}>;

/**
 * get_jobs_list RPC return type
 * Returns list of all active jobs
 */
export type GetJobsListReturn = Array<Tables<'jobs'>>;

/**
 * get_collection_detail_with_items RPC return type
 * Returns collection details with items + available bookmarks
 */
export type GetCollectionDetailWithItemsReturn = {
  collection: Tables<'user_collections'>;
  items: Array<
    Tables<'collection_items'> & {
      title: string;
      description: string;
    }
  >;
  bookmarks: Array<Tables<'bookmarks'>>;
};

/**
 * Reviews RPC return types
 */
export type ReviewItem = {
  id: string;
  user_id: string;
  content_type: ContentCategory;
  content_slug: string;
  rating: number;
  review_text: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user_profile?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};

export type ReviewsAggregateRating = {
  count: number;
  average: number;
  distribution: Record<string, number>;
};

export type GetReviewsWithStatsReturn = {
  reviews: ReviewItem[];
  hasMore: boolean;
  aggregateRating: ReviewsAggregateRating | null;
};

/**
 * Search RPC return types
 * Note: search_content_optimized and search_by_popularity return TABLE (SETOF), not JSONB
 * They are already properly typed in database.types.ts - no manual type definition needed
 */

export type GetSearchSuggestionsReturn = Array<{ suggestion: string }>;
export type GetSearchCountReturn = number;
export type GetSearchFacetsReturn = Array<{
  category: string;
  content_count: number;
  authors: string[];
  all_tags: string[];
  author_count: number;
  tag_count: number;
}>;

/**
 * Bookmark RPC return types
 */
export type AddBookmarkReturn = { success: boolean; bookmark_id?: string; error?: string };
export type RemoveBookmarkReturn = { success: boolean; error?: string };
export type IsBookmarkedReturn = boolean;
export type IsBookmarkedBatchReturn = Array<{
  content_type: ContentCategory;
  content_slug: string;
  is_bookmarked: boolean;
}>;
export type BatchAddBookmarksReturn = { success: boolean; added: number; errors?: unknown[] };

/**
 * Follow RPC return types
 */
export type ToggleFollowReturn = { success: boolean; is_following: boolean; error?: string };
export type IsFollowingReturn = boolean;
export type IsFollowingBatchReturn = Array<{
  followed_user_id: string;
  is_following: boolean;
}>;

/**
 * User action RPC return types
 */
export type UpdateUserProfileReturn = { success: boolean; error?: string };
export type RefreshProfileFromOauthReturn = { success: boolean; updated: boolean; error?: string };
/**
 * get_user_activity_summary RPC return type
 * Returns user activity statistics from denormalized columns and counts
 */
export type GetUserActivitySummaryReturn = {
  total_posts: number;
  total_comments: number;
  total_votes: number;
  total_submissions: number;
  merged_submissions: number;
  total_activity: number;
};
export type GetUserActivityTimelineReturn = {
  activities: Array<{
    id: string;
    type: string;
    action?: string;
    content_type?: ContentCategory | null;
    content_slug?: string | null;
    created_at: string;
    metadata?: DatabaseGenerated['public']['Tables']['content']['Row']['metadata'];
    // Activity-specific fields (discriminated union based on type)
    title?: string;
    body?: string;
    updated_at?: string;
    post_id?: string;
    parent_id?: string | null;
    vote_type?: 'upvote' | 'downvote';
    description?: string | null;
    submission_url?: string | null;
    status?: string;
    user_id: string;
  }>;
  hasMore: boolean;
  total: number;
};
export type GetUserIdentitiesReturn = {
  identities: Array<{
    provider: string;
    email: string | null;
    created_at: string;
    last_sign_in_at: string;
  }>;
};
export type GetUserLibraryReturn = {
  bookmarks: Array<Tables<'bookmarks'>>;
  collections: Array<Tables<'user_collections'>>;
  stats: {
    bookmarkCount: number;
    collectionCount: number;
    totalCollectionItems: number;
    totalCollectionViews: number;
  };
};

/**
 * Jobs RPC return types
 */
export type GetJobsByCategoryReturn = Array<Tables<'jobs'>>;
export type GetJobsCountReturn = number;
export type GetFeaturedJobsReturn = Array<Tables<'jobs'>>;

/**
 * Miscellaneous RPC return types
 */
/**
 * get_related_content RPC return type
 * Returns array of related content items with similarity scores
 * Note: RPC returns TABLE (SETOF), not JSONB, so this matches the actual database return structure
 */
export type GetRelatedContentReturn = Array<{
  category: string; // Database returns string, cast to ContentCategory in data layer if needed
  slug: string;
  title: string;
  description: string;
  author: string;
  date_added: string;
  tags: string[];
  score: number;
  match_type: string;
  views: number;
  matched_tags: string[];
}>;

export type ManageCollectionReturn = {
  success: boolean;
  collection_id?: string;
  action?: string;
  error?: string;
};

export type ManageReviewReturn = {
  success: boolean;
  review_id?: string;
  error?: string;
};

export type GetQuizConfigurationReturn = {
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    category: ContentCategory;
  }>;
};

/**
 * get_recommendations RPC return type
 * Returns personalized configuration recommendations with match scores and reasons
 *
 * Structure from usage: /src/lib/data/tools/recommendations.ts:20-30
 */
export type GetRecommendationsReturn = {
  results: Array<{
    slug: string;
    title: string;
    description: string;
    category: ContentCategory;
    tags?: string[] | null;
    author?: string | null;
    match_score?: number | null;
    match_percentage?: number | null;
    primary_reason?: string | null;
    rank?: number | null;
    reasons?: Json | null;
  }>;
  totalMatches: number;
  algorithm: string;
  summary: {
    topCategory?: string;
    avgMatchScore?: number;
    diversityScore?: number;
    topTags?: string[];
  };
};

/**
 * get_contact_commands RPC return type
 * Returns available terminal commands for contact page
 *
 * Structure from usage: /src/components/features/contact/contact-terminal.tsx:113-120
 */
export type GetContactCommandsReturn = {
  commands: Array<{
    id: string;
    text: string;
    description: string | null;
    category: ContentCategory;
    iconName: string | null;
    actionType: ContactActionType;
    actionValue: string | null;
    confettiVariant: ConfettiVariant | null;
    requiresAuth: boolean;
    aliases: string[];
  }>;
};

/**
 * get_form_fields_for_content_type RPC return type
 * Returns form field definitions for content submission forms
 *
 * Structure from database.types.ts - already has specific return type (not Json)
 */
export type GetFormFieldsForContentTypeReturn = Array<{
  field_name: string;
  field_order: number;
  field_properties: Json;
  field_scope: DatabaseGenerated['public']['Enums']['field_scope'];
  field_type: DatabaseGenerated['public']['Enums']['field_type'];
  grid_column: DatabaseGenerated['public']['Enums']['grid_column'];
  help_text: string;
  icon: string;
  icon_position: DatabaseGenerated['public']['Enums']['icon_position'];
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  select_options: Json;
}>;

/**
 * get_content_paginated_slim RPC return type
 * Returns paginated content items for infinite scroll
 *
 * Structure from usage: /src/lib/data/content/paginated.ts:12-15
 */
export type GetPaginatedContentReturn = {
  items?: DisplayableContent[];
  total_count?: number;
};

/**
 * get_company_profile RPC return type
 * Returns company profile with active jobs and statistics
 *
 * Structure:
 * - company: Full company row from companies table
 * - active_jobs: Array of active job listings (subset of job fields)
 * - stats: Company job statistics from company_job_stats view
 *
 * Returns NULL if company not found (slug doesn't exist or owner_id IS NULL)
 */
export type GetCompanyProfileReturn = {
  company: Tables<'companies'>;
  active_jobs: Array<{
    id: string;
    slug: string;
    title: string;
    company: string;
    company_logo: string | null;
    location: string | null;
    description: string | null;
    salary: string | null;
    remote: boolean;
    type: string | null;
    workplace: string | null;
    experience: string | null;
    category: string | null;
    tags: string[];
    tier: string | null;
    posted_at: string;
    expires_at: string | null;
    view_count: number;
    click_count: number;
    link: string;
  }>;
  stats: {
    total_jobs: number | null;
    active_jobs: number | null;
    featured_jobs: number | null;
    remote_jobs: number | null;
    avg_salary_min: number | null;
    total_views: number | null;
    total_clicks: number | null;
    click_through_rate: number | null;
    latest_job_posted_at: string | null;
  };
} | null;

/**
 * get_companies_list RPC return type
 * Returns paginated list of companies with stats
 */
export type GetCompaniesListReturn = {
  companies: Array<{
    id: string;
    slug: string;
    name: string;
    logo: string | null;
    website: string | null;
    description: string | null;
    size: string | null;
    industry: string | null;
    featured: boolean;
    created_at: string;
    stats: {
      active_jobs: number;
      total_jobs: number;
      remote_jobs: number;
      total_views: number;
      total_clicks: number;
      latest_job_posted_at: string | null;
    } | null;
  }>;
  total: number;
};

/**
 * reorder_collection_items RPC return type
 * Returns result of reordering collection items with batch update status
 *
 * Structure:
 * - Success case: { success: true, updated: number, errors: Array<{ itemId, error }> }
 * - Failure case: { success: false, error: string, updated: 0 }
 *
 * The errors array contains items that failed during batch update.
 * Empty array [] if all items updated successfully.
 */
export type ReorderCollectionItemsReturn =
  | {
      success: true;
      updated: number;
      errors: Array<{
        itemId: string;
        error: string;
      }>;
    }
  | {
      success: false;
      error: string;
      updated: 0;
    };

/**
 * get_company_admin_profile RPC return type
 * Returns company profile for admin/editing purposes
 *
 * Structure from database.types.ts - returns array, but helper normalizes to single object
 */
export type GetCompanyAdminProfileReturn = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo: string;
  website: string;
  description: string;
  size: string;
  industry: string;
  using_cursor_since: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * generate_metadata_complete RPC return type
 * Returns SEO metadata and optional JSON-LD schemas based on route pattern
 *
 * Structure:
 * - When p_include = 'metadata': Returns metadata object only
 * - When p_include includes 'schemas': Returns { metadata: {...}, schemas: [...] }
 *
 * Function never returns NULL (always returns a JSONB object)
 */
export type GenerateMetadataCompleteReturn =
  | {
      title: string;
      description: string;
      keywords: string[];
      openGraphType: 'profile' | 'website';
      twitterCard: 'summary_large_image';
      robots: {
        index: boolean;
        follow: boolean;
      };
      _debug?: {
        pattern: string;
        route: string;
        category?: string;
        slug?: string;
        error?: string;
      };
    }
  | {
      metadata: {
        title: string;
        description: string;
        keywords: string[];
        openGraphType: 'profile' | 'website';
        twitterCard: 'summary_large_image';
        robots: {
          index: boolean;
          follow: boolean;
        };
        _debug?: {
          pattern: string;
          route: string;
          category?: string;
          slug?: string;
          error?: string;
        };
      };
      schemas: Json[];
    };

/**
 * get_api_health RPC return type
 * Returns API health status with database connectivity and table checks
 *
 * Structure:
 * - status: Overall health status (healthy/degraded/unhealthy)
 * - timestamp: ISO timestamp of health check
 * - apiVersion: API version string (currently '1.0.0')
 * - checks: Individual health check results for database, content table, and category configs
 *
 * Status determination:
 * - healthy: All checks pass
 * - degraded: Some checks fail (contentTable or categoryConfigs)
 * - unhealthy: Database connectivity fails
 *
 * Note: Function always returns a result (never NULL)
 */
export type GetApiHealthReturn = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  apiVersion: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      latency: number;
      error?: string;
    };
    contentTable: {
      status: 'ok' | 'error';
      count: number;
      error?: string;
    };
    categoryConfigs: {
      status: 'ok' | 'error';
      count: number;
      error?: string;
    };
  };
};

/**
 * generate_markdown_export RPC return type
 * Returns markdown export for a content item with optional metadata and footer
 *
 * Structure:
 * - Success case: { success: true, markdown: string, filename: string, length: number, content_id: string }
 * - Failure case: { success: false, error: string }
 *
 * Function always returns a result (never NULL)
 * Markdown field is always a string (text type in PostgreSQL)
 * Filename format: "{slug}.md"
 * Length is the character count of the generated markdown
 */
export type GenerateMarkdownExportReturn =
  | {
      success: true;
      markdown: string;
      filename: string;
      length: number;
      content_id: string;
    }
  | {
      success: false;
      error: string;
    };

/**
 * generate_readme_data RPC return type
 * Returns structured data for README.md generation
 *
 * Structure:
 * - categories: Array of category configurations with items
 * - totalCount: Total number of content items across all categories
 * - categoryBreakdown: Record mapping category names to item counts
 *
 * Categories filtered to: agents, mcp, hooks, commands, rules, skills, statuslines, collections
 * Items are sorted by title within each category.
 *
 * Note: Function always returns a result (never NULL)
 */
export type GenerateReadmeDataReturn = {
  categories: Array<{
    category: string;
    title: string;
    description: string;
    icon_name: string;
    url_slug: string;
    items: Array<{
      slug: string;
      title: string;
      description: string;
    }>;
  }>;
  totalCount: number;
  categoryBreakdown: Record<string, number>;
};

/**
 * get_trending_metrics_with_content RPC return type
 * Returns trending content with engagement metrics
 *
 * Structure from database.types.ts
 */
export type GetTrendingMetricsReturn = Array<{
  author: string;
  bookmarks_total: number;
  category: ContentCategory;
  copies_total: number;
  description: string;
  engagement_score: number;
  freshness_score: number;
  slug: string;
  source: string;
  tags: string[];
  title: string;
  trending_score: number;
  views_total: number;
}>;

/**
 * get_popular_content RPC return type
 * Returns popular content sorted by view/copy counts
 *
 * Structure from database.types.ts
 */
export type GetPopularContentReturn = Array<{
  author: string;
  category: ContentCategory;
  copy_count: number;
  description: string;
  popularity_score: number;
  slug: string;
  tags: string[];
  title: string;
  view_count: number;
}>;

/**
 * get_recent_content RPC return type
 * Returns recently added content (simplified - only fields used in trending page)
 *
 * Structure from usage: /src/lib/data/content/trending.ts:46-54
 * Full RPC returns many more fields, but trending page only uses these
 */
export type GetRecentContentReturn = Array<{
  category: ContentCategory | null;
  slug: string;
  title: string | null;
  description: string | null;
  author: string | null;
  tags: string[] | null;
  created_at: string | null;
}>;

export type TrackSponsoredEventReturn = { success: boolean };
export type ToggleReviewHelpfulReturn = { success: boolean; helpful_count: number };

/**
 * ============================================================================
 * PRIORITY 1: USER-FACING DASHBOARD RPC RETURN TYPES
 * ============================================================================
 * High-impact functions used in app routes - critical for type safety
 */

/**
 * get_community_directory RPC return type
 * Returns user directory with segmented lists for community page
 *
 * Structure from usage: /src/app/community/directory/page.tsx:17-33
 */
export type GetCommunityDirectoryReturn = {
  all_users: Array<Tables<'users'>>;
  top_contributors: Array<Tables<'users'>>;
  new_members: Array<Tables<'users'>>;
};

/**
 * get_navigation_menu RPC return type
 * Returns navigation menu structure for command palette
 *
 * Structure from usage: /src/components/core/layout/navigation-command-menu.tsx:22-34
 */
export type GetNavigationMenuReturn = {
  primary: Array<{
    path: string;
    title: string;
    description: string;
    iconName: string;
    group: 'primary' | 'secondary' | 'actions';
  }>;
  secondary: Array<{
    path: string;
    title: string;
    description: string;
    iconName: string;
    group: 'primary' | 'secondary' | 'actions';
  }>;
  actions: Array<{
    path: string;
    title: string;
    description: string;
    iconName: string;
    group: 'primary' | 'secondary' | 'actions';
  }>;
};

/**
 * get_submission_dashboard RPC return type
 * Returns submission statistics and recent activity for /submit page
 *
 * Structure from usage: /src/app/submit/page.tsx:33-48
 */
export type GetSubmissionDashboardReturn = {
  stats: {
    total: number;
    pending: number;
    merged_this_week: number;
  };
  recent: Array<{
    id: string | number;
    content_name: string;
    content_type: DatabaseGenerated['public']['Enums']['submission_type'];
    merged_at: string;
    user?: { name: string; slug: string } | null;
  }>;
  contributors: Array<{
    name: string;
    slug: string;
    rank: number;
    mergedCount: number;
  }>;
};

/**
 * get_account_dashboard RPC return type
 * Returns user account dashboard with profile and bookmark count
 *
 * Structure from usage: /src/app/account/page.tsx:36-44
 */
export type GetAccountDashboardReturn = {
  bookmark_count: number;
  profile: {
    name: string | null;
    tier: UserTier | null;
    created_at: string;
  };
};

/**
 * get_my_submissions RPC return type
 * Returns user's own submissions from content_submissions table
 */
export type GetMySubmissionsReturn = Array<{
  id: string;
  submission_type: DatabaseGenerated['public']['Enums']['submission_type'];
  status: DatabaseGenerated['public']['Enums']['submission_status'];
  name: string;
  description: string | null;
  category: ContentCategory;
  moderator_notes: string | null;
  created_at: string;
  moderated_at: string | null;
}>;

/**
 * get_pending_submissions RPC return type
 * Returns pending submissions for admin review
 */
export type GetPendingSubmissionsReturn = Array<{
  id: string;
  submission_type: DatabaseGenerated['public']['Enums']['submission_type'];
  status: DatabaseGenerated['public']['Enums']['submission_status'];
  name: string;
  description: string | null;
  category: ContentCategory;
  author: string;
  author_profile_url: string | null;
  github_url: string | null;
  tags: string[] | null;
  content_data: Json;
  submitter_id: string;
  submitter_email: string | null;
  spam_score: number | null;
  created_at: string;
}>;

/**
 * get_user_affinities RPC return type
 * Returns user content affinities with scores
 */
export type GetUserAffinitiesReturn = {
  affinities: Array<{
    id: string;
    user_id: string;
    content_type: ContentCategory;
    content_slug: string;
    affinity_score: number;
    based_on: string | null;
    calculated_at: string;
  }>;
  total_count: number;
  last_calculated: string;
};

/**
 * get_user_interaction_summary RPC return type
 * Returns summary of user interactions
 */
export type GetUserInteractionSummaryReturn = {
  total_interactions: number;
  views: number;
  copies: number;
  bookmarks: number;
  unique_content_items: number;
};

/**
 * get_user_recent_interactions RPC return type
 * Returns recent user interactions
 */
export type GetUserRecentInteractionsReturn = Array<{
  content_type: ContentCategory;
  content_slug: string;
  interaction_type: DatabaseGenerated['public']['Enums']['interaction_type'];
  session_id: string | null;
  metadata: Json;
  created_at: string;
}>;

/**
 * get_collection_items_grouped RPC return type
 * Returns collection items grouped by category
 */
export type GetCollectionItemsGroupedReturn = {
  success: boolean;
  error?: string;
  grouped_items: Record<
    ContentCategory,
    Array<{
      id: string;
      slug: string;
      title: string;
      description: string | null;
      category: ContentCategory;
      metadata: Json;
      tags: string[];
      author: string;
      date_added: string;
      view_count: number;
      copy_count: number;
      bookmark_count: number;
      review_count: number;
      avg_rating: number | null;
      popularity_score: number | null;
    }>
  >;
  total_items: number;
};

/**
 * get_changelog_with_category_stats RPC return type
 * Returns changelog entries with category statistics
 */
export type GetChangelogWithCategoryStatsReturn = {
  entries: Array<Tables<'changelog'>>;
  category_counts: {
    All: number;
    Added: number;
    Changed: number;
    Fixed: number;
    Removed: number;
    Deprecated: number;
    Security: number;
  };
  total: number;
  filtered_count: number;
};

/**
 * get_submission_stats RPC return type
 * Returns submission statistics
 */
export type GetSubmissionStatsReturn = {
  total: number;
  pending: number;
  merged_this_week: number;
};

/**
 * get_top_contributors RPC return type
 * Returns top contributors by merged submissions
 */
export type GetTopContributorsReturn = Array<{
  rank: number;
  name: string;
  slug: string;
  mergedCount: number;
}>;

/**
 * get_recent_merged RPC return type
 * Returns recently merged submissions
 */
export type GetRecentMergedReturn = Array<{
  id: string;
  content_name: string;
  content_type: string;
  merged_at: string;
  user: {
    name: string;
    slug: string;
  } | null;
}>;

/**
 * get_job_detail RPC return type
 * Returns complete job details from jobs table
 */
export type GetJobDetailReturn = Tables<'jobs'> | null;

/**
 * filter_jobs RPC return type
 * Returns filtered jobs with total count
 */
export type FilterJobsReturn = {
  jobs: Array<Tables<'jobs'>>;
  total_count: number;
};

/**
 * get_user_collection_detail RPC return type
 * Returns collection detail with user info, collection data, and items
 */
export type GetUserCollectionDetailReturn = {
  user: {
    id: string;
    slug: string;
    name: string;
    image: string | null;
    tier: string;
  };
  collection: {
    id: string;
    user_id: string;
    slug: string;
    name: string;
    description: string | null;
    is_public: boolean;
    item_count: number;
    view_count: number;
    created_at: string;
    updated_at: string;
  };
  items: Array<{
    id: string;
    collection_id: string;
    content_type: string;
    content_slug: string;
    notes: string | null;
    order: number;
    added_at: string;
  }>;
  isOwner: boolean;
} | null;

/**
 * get_user_companies RPC return type
 * Returns list of companies owned by user
 *
 * Structure from usage: /src/app/account/companies/page.tsx:67
 */
export type GetUserCompaniesReturn = {
  companies: Array<
    Tables<'companies'> & {
      stats?: {
        total_jobs?: number;
        active_jobs?: number;
        total_views?: number;
        total_clicks?: number;
        latest_job_posted_at?: string | null;
      };
    }
  >;
};

/**
 * get_user_collection_detail RPC return type
 * Returns full collection details with user info, collection metadata, and items
 *
 * Structure from usage: /src/app/u/[slug]/collections/[collectionSlug]/page.tsx:35-65
 */
export type GetUserCollectionDetailReturn = {
  user: {
    id: string;
    slug: string;
    name: string;
    image: string | null;
    tier: string;
  };
  collection: {
    id: string;
    user_id: string;
    slug: string;
    name: string;
    description: string | null;
    is_public: boolean;
    item_count: number;
    view_count: number;
    created_at: string;
    updated_at: string;
  };
  items: Array<{
    id: string;
    collection_id: string;
    content_type: ContentCategory;
    content_slug: string;
    notes: string | null;
    order: number;
    added_at: string;
  }>;
  isOwner: boolean;
};

/**
 * get_sponsorship_analytics RPC return type
 * Returns sponsorship analytics with daily stats and computed metrics
 *
 * Structure from usage: /src/app/account/sponsorships/[id]/analytics/page.tsx:45-57
 */
export type GetSponsorshipAnalyticsReturn = {
  sponsorship: Tables<'sponsored_content'>;
  daily_stats: Array<{
    date: string;
    impressions: number;
    clicks: number;
  }>;
  computed_metrics: {
    ctr: number;
    days_active: number;
    avg_impressions_per_day: number;
  };
};

/**
 * get_content_templates RPC return type
 * Returns curated starter templates for a given content type
 *
 * Structure from usage: /src/components/core/forms/template-selector.tsx:20-28
 */
export type GetContentTemplatesReturn = Array<{
  id: string;
  type: string;
  name: string;
  description: string;
  category?: string;
  tags?: string;
  [key: string]: unknown; // Allow additional dynamic fields
}>;

/**
 * get_user_sponsorships RPC return type
 * Returns array of sponsored content items owned by user
 */
export type GetUserSponsorshipsReturn = Array<Tables<'sponsored_content'>>;

/**
 * get_similar_content RPC return type
 * Returns similar content items with similarity scores and metadata
 */
export type GetSimilarContentReturn = {
  similar_items: Array<{
    slug: string;
    title: string;
    description?: string;
    category: ContentCategory;
    score?: number;
    tags?: string[];
    similarity_factors?: DatabaseGenerated['public']['Tables']['content']['Row']['metadata'];
    calculated_at?: string;
    url?: string;
  }>;
  source_item: {
    slug: string;
    category: ContentCategory;
  };
  algorithm_version?: string;
};

/**
 * get_active_notifications RPC return type
 * NOTE: This function already has a proper return type in database.types.ts
 * Returns array of notification objects (not Json)
 * See database.types.ts line 3091-3106 for the full type definition
 */
// No type override needed - already properly typed in generated file

/**
 * get_weekly_digest RPC return type
 * Returns weekly digest data including new content and trending items for email campaigns.
 *
 * @see {@link https://claudepro.directory} Weekly digest emails sent every Monday
 */
export type GetWeeklyDigestReturn = {
  /** Formatted week range string (e.g., "December 2-8, 2025") */
  weekOf: string;
  /** ISO date string for week start (YYYY-MM-DD) */
  weekStart: string;
  /** ISO date string for week end (YYYY-MM-DD) */
  weekEnd: string;
  /** Array of new content items added during the week (top 5) */
  newContent: Array<{
    category: string;
    slug: string;
    title: string;
    description: string;
    date_added: string; // ISO timestamp
    url: string; // Full URL: https://claudepro.directory/{category}/{slug}
  }>;
  /** Array of trending content items (top 3) */
  trendingContent: Array<{
    category: string;
    slug: string;
    title: string;
    description: string;
    url: string; // Full URL: https://claudepro.directory/{category}/{slug}
    viewCount: number; // Total views from get_trending_metrics
  }>;
};

/**
 * get_due_sequence_emails RPC return type
 * Returns array of due email sequence items that need to be processed.
 *
 * Used for onboarding email sequence automation - fetches emails that are due
 * to receive their next sequence step.
 *
 * @see {@link https://claudepro.directory} Email sequence automation
 */
export type GetDueSequenceEmailsReturn = Array<{
  /** UUID of the email sequence schedule record */
  id: string;
  /** Email address of the recipient */
  email: string;
  /** Step number in the sequence (2-5 for onboarding sequence) */
  step: number;
}>;

/**
 * get_app_settings RPC return type
 * Returns a key-value map of app settings with metadata.
 *
 * Keys are setting_key values, values contain setting metadata including
 * the actual setting value, type, description, category, environment, etc.
 *
 * Note: This RPC is not currently used by the application codebase.
 * The application uses Statsig Dynamic Configs instead. This type definition
 * is provided for completeness and potential future use.
 *
 * @see {@link https://claudepro.directory} App settings configuration
 */
export type GetAppSettingsReturn = Record<
  string,
  {
    /** The actual setting value (can be any JSON-serializable value) */
    value: Json;
    /** The type of the setting value */
    type: SettingType;
    /** Human-readable description of the setting */
    description: string | null;
    /** Category grouping for the setting */
    category: string | null;
    /** Environment where this setting applies (null = all environments) */
    environment: Environment | null;
    /** Whether this setting is currently enabled (always true in return) */
    enabled: boolean;
    /** Version number for the setting */
    version: number;
  }
>;
