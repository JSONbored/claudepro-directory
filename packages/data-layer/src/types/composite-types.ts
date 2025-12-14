/**
 * Composite Type Definitions
 * 
 * These types replace PostgreSQL composite types that Prisma doesn't generate.
 * Used for RPC return types and complex query results.
 * 
 * These types match the ACTUAL PostgreSQL composite type definitions from the database schema.
 * Note: Fields are non-nullable where the SQL CREATE TYPE statement defines them as such.
 * 
 * IMPORTANT: Dates are typed as strings because:
 * - RPCs return JSON which serializes dates as ISO strings
 * - Prisma raw queries return Date objects, but we're still using RPCs in many places
 * - When fully migrated to Prisma queries, we can update these to Date
 * 
 * Total: 18 composite types used in codebase (out of 194 total in database)
 */

import type { Json } from '@heyclaude/database-types';
import type {
  content_category,
  user_tier,
  job_tier,
  job_plan,
  form_field_type,
  form_grid_column,
  form_icon_position,
} from '../prisma';
import type {
  content_source,
  form_field_icon,
} from '../../../generators/dist/prisma/index.js';
import type { Database } from '@heyclaude/database-types';

// ============================================================================
// CONTENT TYPES (4 types)
// ============================================================================

/**
 * Enriched Content Item
 * SQL: CREATE TYPE public.enriched_content_item AS (...)
 * 
 * Note: Dates are strings because RPCs return JSON (dates serialize as strings).
 * When using Prisma raw queries, dates will be Date objects and may need conversion.
 */
export interface EnrichedContentItem {
  id: string;
  slug: string;
  title: string | null;
  display_title: string | null;
  seo_title: string | null;
  description: string;
  author: string;
  author_profile_url: string | null;
  category: content_category;
  tags: string[];
  source_table: string;
  created_at: string; // RPCs return strings, Prisma raw queries return Date - may need conversion
  updated_at: string; // RPCs return strings, Prisma raw queries return Date - may need conversion
  date_added: string; // RPCs return strings, Prisma raw queries return Date - may need conversion
  features: string[];
  use_cases: string[];
  source: content_source | null;
  documentation_url: string | null;
  metadata: Record<string, unknown>;
  view_count: number;
  copy_count: number;
  bookmark_count: number;
  popularity_score: number;
  trending_score: number;
  sponsored_content_id: string | null;
  sponsorship_tier: string | null;
  is_sponsored: boolean;
}

/**
 * Content Paginated Slim Item
 * SQL: CREATE TYPE public.content_paginated_slim_item AS (...)
 */
export interface ContentPaginatedSlimItem {
  id: string;
  slug: string;
  title: string | null;
  display_title: string | null;
  description: string;
  author: string;
  author_profile_url: string | null;
  category: string;
  tags: string[];
  source: string | null;
  source_table: string;
  created_at: string; // RPCs return strings, Prisma raw queries return Date - may need conversion
  updated_at: string; // RPCs return strings, Prisma raw queries return Date - may need conversion
  date_added: string; // RPCs return strings, Prisma raw queries return Date - may need conversion
  view_count: number;
  copy_count: number;
  bookmark_count: number;
  popularity_score: number;
  trending_score: number;
  sponsored_content_id: string | null;
  sponsorship_tier: string | null;
  is_sponsored: boolean;
}

/**
 * Content Paginated Pagination
 * SQL: CREATE TYPE public.content_paginated_pagination AS (...)
 */
export interface ContentPaginatedPagination {
  total_count: number;
  limit: number;
  offset: number;
  has_more: boolean;
  current_page: number;
  total_pages: number;
}

/**
 * Content Paginated Slim Result
 * SQL: CREATE TYPE public.content_paginated_slim_result AS (...)
 */
export interface ContentPaginatedSlimResult {
  items: ContentPaginatedSlimItem[];
  pagination: ContentPaginatedPagination;
}

// ============================================================================
// SEARCH TYPES (4 types)
// ============================================================================

/**
 * Search Content Optimized Row
 * SQL: CREATE TYPE public.search_content_optimized_row AS (...)
 */
export interface SearchContentOptimizedRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: content_category;
  author: string;
  author_profile_url: string;
  date_added: string; // RPCs return strings, Prisma raw queries return Date
  tags: string[];
  source: string;
  created_at: string; // RPCs return strings, Prisma raw queries return Date
  updated_at: string; // RPCs return strings, Prisma raw queries return Date
  features: string[];
  use_cases: string[];
  examples: Record<string, unknown>;
  relevance_score: number;
  viewCount: number;
  copyCount: number;
  bookmark_count: number;
  combined_score: number;
  _featured: Record<string, unknown>;
  title_highlighted: string | null;
  description_highlighted: string | null;
  author_highlighted: string | null;
  tags_highlighted: string[] | null;
}

/**
 * Search Content Optimized Result
 * SQL: CREATE TYPE public.search_content_optimized_result AS (...)
 */
export interface SearchContentOptimizedResult {
  results: SearchContentOptimizedRow[];
  total_count: number;
}

/**
 * Search Unified Row
 * SQL: CREATE TYPE public.search_unified_row AS (...)
 */
export interface SearchUnifiedRow {
  entity_type: string;
  id: string;
  title: string;
  description: string;
  slug: string;
  category: string;
  tags: string[];
  created_at: string; // RPCs return strings, Prisma raw queries return Date
  relevance_score: number;
  engagement_score: number;
  title_highlighted: string | null;
  description_highlighted: string | null;
  author_highlighted: string | null;
  tags_highlighted: string[] | null;
}

/**
 * Search Unified Result
 * SQL: CREATE TYPE public.search_unified_result AS (...)
 */
export interface SearchUnifiedResult {
  results: SearchUnifiedRow[];
  total_count: number;
}

// ============================================================================
// USER & ACCOUNT TYPES (8 types)
// ============================================================================

/**
 * Bookmark Item Input
 * SQL: CREATE TYPE public.bookmark_item_input AS (...)
 */
export interface BookmarkItemInput {
  content_type: content_category;
  content_slug: string;
}

/**
 * Account Dashboard Profile
 * SQL: CREATE TYPE public.account_dashboard_profile AS (...)
 */
export interface AccountDashboardProfile {
  name: string | null;
  tier: user_tier | null;
  created_at: string | null; // RPCs return strings, Prisma raw queries return Date
}

/**
 * Account Dashboard Result
 * SQL: CREATE TYPE public.account_dashboard_result AS (...)
 */
export interface AccountDashboardResult {
  bookmark_count: number | null; // RPCs can return null
  profile: AccountDashboardProfile | null;
}

/**
 * Update User Profile Result Profile
 * SQL: CREATE TYPE public.update_user_profile_result_profile AS (...)
 */
export interface UpdateUserProfileResultProfile {
  slug: string;
  display_name: string;
  bio: string;
  work: string;
  website: string;
  social_x_link: string;
  interests: string[];
  profile_public: boolean;
  follow_email: boolean;
}

/**
 * Update User Profile Result V2
 * SQL: CREATE TYPE public.update_user_profile_result_v2 AS (...)
 */
export interface UpdateUserProfileResultV2 {
  success: boolean;
  profile: UpdateUserProfileResultProfile;
}

/**
 * User Activity Timeline Item
 * SQL: CREATE TYPE public.user_activity_timeline_item AS (...)
 */
export interface UserActivityTimelineItem {
  id: string | null; // RPCs can return null
  type: string | null;
  title: string | null;
  body: string | null;
  vote_type: string | null;
  content_type: string | null;
  content_slug: string | null;
  post_id: string | null;
  parent_id: string | null;
  submission_url: string | null;
  description: string | null;
  status: string | null;
  user_id: string | null;
  created_at: string | null; // RPCs return strings, Prisma raw queries return Date
  updated_at: string | null; // RPCs return strings, Prisma raw queries return Date
}

/**
 * User Companies Stats
 * SQL: CREATE TYPE public.user_companies_stats AS (...)
 */
export interface UserCompaniesStats {
  total_jobs: number | null; // RPCs can return null
  active_jobs: number | null;
  total_views: number | null;
  total_clicks: number | null;
  latest_job_posted_at: string | null; // RPCs return strings, Prisma raw queries return Date
}

/**
 * User Companies Company
 * SQL: CREATE TYPE public.user_companies_company AS (...)
 */
export interface UserCompaniesCompany {
  id: string | null; // RPCs can return null even if SQL says NOT NULL
  slug: string | null;
  name: string | null;
  logo: string | null;
  website: string | null;
  description: string | null;
  size: string | null;
  industry: string | null;
  using_cursor_since: string | null; // RPCs return strings, Prisma raw queries return Date
  featured: boolean | null;
  created_at: string | null; // RPCs return strings, Prisma raw queries return Date
  updated_at: string | null; // RPCs return strings, Prisma raw queries return Date
  stats: UserCompaniesStats | null;
}

/**
 * User Complete Data Result
 * SQL: CREATE TYPE public.user_complete_data_result AS (...)
 * 
 * Note: This has many nested types. We'll define the structure but some nested
 * types may need to be defined separately if used elsewhere.
 */
export interface UserCompleteDataResult {
  account_dashboard: {
    bookmark_count: number | null; // RPCs can return null
    profile: AccountDashboardProfile | null;
  } | null;
  user_dashboard: {
    submissions: Array<{
      id: string | null; // RPCs can return null even if SQL says NOT NULL
      user_id: string | null;
      content_type: string | null;
      content_slug: string | null;
      content_name: string | null;
      pr_number: string | null;
      pr_url: string | null;
      branch_name: string | null;
      status: string | null;
      submission_data: Record<string, unknown> | null;
      rejection_reason: string | null;
      created_at: string | null; // RPCs return strings, Prisma raw queries return Date
      updated_at: string | null; // RPCs return strings, Prisma raw queries return Date
      merged_at: string | null; // RPCs return strings, Prisma raw queries return Date
    }> | null;
    companies: Json | null; // Json type from Database
    jobs: Json | null; // Json type from Database
  } | null;
  user_settings: {
    profile: {
      display_name: string | null; // RPCs can return null even if SQL says NOT NULL
      bio: string | null;
      work: string | null;
      website: string | null;
      social_x_link: string | null;
      interests: string[] | null;
      profile_public: boolean | null;
      follow_email: boolean | null;
      created_at: string | null; // RPCs return strings, Prisma raw queries return Date
    } | null;
    user_data: {
      slug: string | null;
      name: string | null;
      image: string | null;
      tier: user_tier | null;
    } | null;
    username: string | null;
  } | null;
  activity_summary: {
    total_posts: number;
    total_comments: number;
    total_votes: number;
    total_submissions: number;
    merged_submissions: number;
    total_activity: number;
  } | null;
  activity_timeline: {
    activities: UserActivityTimelineItem[];
    has_more: boolean;
    total: number;
  } | null;
  user_library: {
    bookmarks: Array<{
      id: string | null; // RPCs can return null even if SQL says NOT NULL
      user_id: string | null;
      content_type: string | null;
      content_slug: string | null;
      notes: string | null;
      created_at: string | null; // RPCs return strings, Prisma raw queries return Date
      updated_at: string | null; // RPCs return strings, Prisma raw queries return Date
    }> | null;
    collections: Array<{
      id: string | null;
      user_id: string | null;
      slug: string | null;
      name: string | null;
      description: string | null;
      is_public: boolean | null;
      item_count: number | null;
      view_count: number | null;
      created_at: string | null; // RPCs return strings, Prisma raw queries return Date
      updated_at: string | null; // RPCs return strings, Prisma raw queries return Date
    }> | null;
    stats: {
      bookmark_count: number | null;
      collection_count: number | null;
      total_collection_items: number | null;
      total_collection_views: number | null;
    } | null;
  } | null;
  user_identities: {
    identities: Array<{
      provider: string;
      email: string | null;
      created_at: string; // RPCs return strings, Prisma raw queries return Date
      last_sign_in_at: string | null; // RPCs return strings, Prisma raw queries return Date
    }>;
  } | null;
  sponsorships: Database['public']['Tables']['sponsored_content']['Row'][] | null; // Use Database type for now (complex structure)
}

// ============================================================================
// COMMUNITY & CHANGELOG TYPES (2 types)
// ============================================================================

/**
 * Community Directory User
 * SQL: CREATE TYPE public.community_directory_user AS (...)
 */
export interface CommunityDirectoryUser {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  bio: string | null;
  work: string | null;
  tier: user_tier;
  created_at: string; // RPCs return strings, Prisma raw queries return Date
}

/**
 * Changelog Overview Entry
 * SQL: CREATE TYPE public.changelog_overview_entry AS (...)
 * 
 * Note: Fields are nullable to match what RPCs actually return (even if SQL says NOT NULL)
 */
export interface ChangelogOverviewEntry {
  id: string | null; // RPCs can return null even if SQL says NOT NULL
  slug: string | null;
  title: string | null;
  tldr: string | null;
  description: string | null;
  content: string | null;
  raw_content: string | null;
  release_date: string | null; // RPCs return strings, Prisma raw queries return Date
  date: string | null; // RPCs return strings, Prisma raw queries return Date
  featured: boolean | null;
  published: boolean | null;
  keywords: string[] | null;
  metadata: Json | null; // RPCs return Json (can be string, number, boolean, null, object, array)
  changes: Json | null; // RPCs return Json (can be string, number, boolean, null, object, array)
  created_at: string | null; // RPCs return strings, Prisma raw queries return Date
  updated_at: string | null; // RPCs return strings, Prisma raw queries return Date
  seo_title: string | null;
  seo_description: string | null;
}

// ============================================================================
// FORMS & JOBS TYPES (2 types)
// ============================================================================

/**
 * Form Field Config Item
 * SQL: CREATE TYPE public.form_field_config_item AS (...)
 * 
 * Note: Fields are nullable to match what RPCs actually return (even if SQL says NOT NULL)
 */
export interface FormFieldConfigItem {
  name: string | null; // RPCs can return null even if SQL says NOT NULL
  label: string | null;
  type: form_field_type | null;
  required: boolean | null;
  placeholder: string | null;
  help_text: string | null;
  default_value: string | null;
  grid_column: form_grid_column | null;
  icon_name: form_field_icon | null;
  icon_position: form_icon_position | null;
  rows: number | null;
  monospace: boolean | null;
  min_value: number | null;
  max_value: number | null;
  step_value: number | null;
  select_options: Json | null; // RPCs return Json (can be string, number, boolean, null, object, array)
  field_group: string | null;
  display_order: number | null;
}

/**
 * Create Job With Payment Result
 * SQL: CREATE TYPE public.create_job_with_payment_result AS (...)
 */
export interface CreateJobWithPaymentResult {
  success: boolean;
  job_id: string | null;
  company_id: string | null;
  payment_amount: number | null;
  requires_payment: boolean;
  tier: job_tier;
  plan: job_plan;
}

// ============================================================================
// RECOMMENDATIONS & RELATED CONTENT (2 types)
// ============================================================================

/**
 * Recommendation Reason
 * SQL: CREATE TYPE public.recommendation_reason AS (...)
 */
export interface RecommendationReason {
  type: string;
  message: string;
}

/**
 * Recommendation Item
 * SQL: CREATE TYPE public.recommendation_item AS (...)
 */
export interface RecommendationItem {
  slug: string | null; // RPCs can return null
  title: string | null;
  description: string | null;
  category: content_category | null;
  tags: string[] | null;
  author: string | null;
  match_score: number | null;
  match_percentage: number | null;
  primary_reason: string | null;
  rank: number | null;
  reasons: RecommendationReason[] | null;
}

/**
 * Related Content Item
 * SQL: CREATE TYPE public.related_content_item AS (...)
 */
export interface RelatedContentItem {
  category: content_category | null; // RPCs can return null
  slug: string | null;
  title: string | null;
  description: string | null;
  author: string | null;
  date_added: string | null; // RPCs return strings, Prisma raw queries return Date
  tags: string[] | null;
  score: number | null;
  match_type: string | null;
  views: number | null; // RPCs can return null
  matched_tags: string[] | null; // RPCs can return null
}

// ============================================================================
// REVIEWS TYPES (3 types)
// ============================================================================

/**
 * Review Rating Distribution
 * SQL: CREATE TYPE public.review_rating_distribution AS (...)
 */
export interface ReviewRatingDistribution {
  rating_1: number | null; // RPCs can return null
  rating_2: number | null;
  rating_3: number | null;
  rating_4: number | null;
  rating_5: number | null;
}

/**
 * Review Aggregate Rating
 * SQL: CREATE TYPE public.review_aggregate_rating AS (...)
 */
export interface ReviewAggregateRating {
  success: boolean | null; // RPCs can return null
  average: number | null;
  count: number | null;
  distribution: ReviewRatingDistribution | null;
}

/**
 * Review With Stats User
 * SQL: CREATE TYPE public.review_with_stats_user AS (...)
 */
export interface ReviewWithStatsUser {
  id: string | null; // RPCs can return null
  slug: string | null;
  name: string | null;
  image: string | null;
  tier: user_tier | null;
}

/**
 * Review With Stats Item
 * SQL: CREATE TYPE public.review_with_stats_item AS (...)
 */
export interface ReviewWithStatsItem {
  id: string | null; // RPCs can return null
  rating: number | null;
  review_text: string | null;
  helpful_count: number | null;
  created_at: string | null; // RPCs return strings, Prisma raw queries return Date
  updated_at: string | null; // RPCs return strings, Prisma raw queries return Date
  user: ReviewWithStatsUser | null;
  is_helpful: boolean | null;
}
