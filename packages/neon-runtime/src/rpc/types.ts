/**
 * RPC Return Type Definitions
 * 
 * TypeScript types for PostgreSQL RPC function return types (composite types).
 * These types correspond to PostgreSQL composite types used by RPC functions.
 * 
 * Generated from database introspection - these match the actual database composite types.
 * 
 * @see packages/neon-runtime/src/services/* for RPC function implementations
 */

/**
 * Account Dashboard Result
 * 
 * Return type for: get_submission_dashboard, get_user_activity_timeline
 */
export interface AccountDashboardResult {
  bookmark_count: number;
  profile: AccountDashboardProfile;
}

export interface AccountDashboardProfile {
  id: string;
  email: string | null;
  name: string | null;
  slug: string | null;
  image: string | null;
  bio: string | null;
  created_at: Date;
  updated_at: Date;
  follower_count: number;
  following_count: number;
  submission_count: number;
  bookmark_count: number;
}

/**
 * Add Bookmark Result
 * 
 * Return type for: add_bookmark
 */
export interface AddBookmarkResult {
  success: boolean;
  bookmark: AddBookmarkBookmarkItem | null;
}

export interface AddBookmarkBookmarkItem {
  id: string;
  user_id: string;
  content_type: string;
  content_slug: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * API Health Result
 * 
 * Return type for: get_api_health
 */
export interface ApiHealthResult {
  status: string;
  timestamp: string;
  api_version: string;
  checks: ApiHealthChecks;
}

export interface ApiHealthChecks {
  database: boolean;
  cache?: boolean;
  external_apis?: Record<string, boolean>;
}

/**
 * Approve Submission Result
 * 
 * Return type for: approve_submission
 */
export interface ApproveSubmissionResult {
  success: boolean;
  submission_id: string | null;
  content_id: string | null;
  slug: string | null;
  category: string | null;
  message: string | null;
}

/**
 * Batch Add Bookmarks Result
 * 
 * Return type for: batch_add_bookmarks
 */
export interface BatchAddBookmarksResult {
  success: boolean;
  saved_count: number;
  total_requested: number;
}

/**
 * Batch Insert User Interactions Result
 * 
 * Return type for: batch_insert_user_interactions
 */
export interface BatchInsertUserInteractionsResult {
  inserted: number;
  failed: number;
  total: number;
  errors: Record<string, unknown> | null;
}

/**
 * Build Aggregate Rating Schema Result
 * 
 * Return type for: build_aggregate_rating_schema
 */
export interface BuildAggregateRatingSchemaResult {
  context: string;
  type: string;
  rating_value: number;
  rating_count: number;
  review_count: number;
  best_rating: number;
  worst_rating: number;
}

/**
 * Build Breadcrumb JSON-LD Result
 * 
 * Return type for: build_breadcrumb_json_ld
 */
export interface BuildBreadcrumbJsonLdResult {
  context: string;
  type: string;
  item_list_element: unknown[];
}

/**
 * Build Changelog JSON-LD Result
 * 
 * Return type for: build_changelog_json_ld
 */
export interface BuildChangelogJsonLdResult {
  blog_posting: Record<string, unknown>;
  tech_article: Record<string, unknown>;
}

/**
 * Changelog Detail Result
 * 
 * Return type for: get_changelog_detail
 */
export interface ChangelogDetailResult {
  entry: ChangelogDetailEntry;
}

export interface ChangelogDetailEntry {
  id: string;
  slug: string;
  title: string;
  tldr: string | null;
  description: string | null;
  content: string;
  raw_content: string;
  release_date: Date;
  date: Date;
  featured: boolean;
  published: boolean;
  keywords: string[];
  metadata: Record<string, unknown> | null;
  changes: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  categories: Record<string, unknown> | null;
}

/**
 * Changelog Overview Result
 * 
 * Return type for: get_changelog_overview
 */
export interface ChangelogOverviewResult {
  entries: ChangelogOverviewEntry[];
  metadata: ChangelogMetadata;
  featured: ChangelogOverviewEntry[];
  pagination: ChangelogPagination;
}

export interface ChangelogOverviewEntry {
  id: string;
  slug: string;
  title: string;
  tldr: string | null;
  description: string | null;
  content: string;
  raw_content: string;
  release_date: Date;
  date: Date;
  featured: boolean;
  published: boolean;
  keywords: string[];
  metadata: Record<string, unknown> | null;
  changes: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  seo_title: string | null;
  seo_description: string | null;
}

export interface ChangelogMetadata {
  total: number;
  featured_count: number;
  published_count: number;
}

export interface ChangelogPagination {
  limit: number;
  offset: number;
  total: number;
  has_more: boolean;
}

/**
 * Changelog With Category Stats Result
 * 
 * Return type for: get_changelog_with_category_stats
 */
export interface ChangelogWithCategoryStatsResult {
  entries: ChangelogWithCategoryStatsEntry[];
  category_counts: ChangelogCategoryCounts;
  total: number;
  filtered_count: number;
}

export interface ChangelogWithCategoryStatsEntry {
  id: string;
  slug: string;
  title: string;
  release_date: Date;
  changes: Record<string, unknown>;
  category_stats: Record<string, number>;
}

export interface ChangelogCategoryCounts {
  Added: number;
  Changed: number;
  Deprecated: number;
  Removed: number;
  Fixed: number;
  Security: number;
}

/**
 * Collection Detail With Items Result
 * 
 * Return type for: get_user_collection_detail
 */
export interface CollectionDetailWithItemsResult {
  collection: {
    id: string;
    user_id: string;
    name: string;
    slug: string;
    description: string | null;
    is_public: boolean;
    view_count: number;
    bookmark_count: number;
    item_count: number;
    created_at: Date;
    updated_at: Date;
  };
  items: Array<{
    id: string;
    collection_id: string;
    user_id: string;
    content_type: string;
    content_slug: string;
    order: number;
    notes: string | null;
    added_at: Date;
    created_at: Date;
    updated_at: Date;
  }>;
  bookmarks: Array<{
    id: string;
    user_id: string;
    content_type: string;
    content_slug: string;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
  }>;
}

/**
 * Collection Items Grouped Result
 * 
 * Return type for: get_collection_items_grouped
 */
export interface CollectionItemsGroupedResult {
  success: boolean;
  error: string | null;
  grouped_items: Record<string, unknown> | null;
  total_items: number;
}

/**
 * Command Installation Result
 * 
 * Return type for: generate_command_installation
 */
export interface CommandInstallationResult {
  claude_code: {
    command: string;
    description: string;
  };
  requirements: string[];
}

/**
 * Community Directory Result
 * 
 * Return type for: get_community_directory
 */
export interface CommunityDirectoryResult {
  all_users: CommunityDirectoryUser[];
  top_contributors: CommunityDirectoryUser[];
  new_members: CommunityDirectoryUser[];
}

export interface CommunityDirectoryUser {
  id: string;
  name: string | null;
  slug: string | null;
  image: string | null;
  bio: string | null;
  follower_count: number;
  following_count: number;
  submission_count: number;
  bookmark_count: number;
  created_at: Date;
}

/**
 * Company List Result
 * 
 * Return type for: get_companies_list
 */
export interface CompanyListResult {
  companies: CompanyListItem[];
  total: number;
}

export interface CompanyListItem {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  description: string | null;
  industry: string | null;
  featured: boolean | null;
  created_at: Date;
  updated_at: Date;
  active_jobs_count: number;
}

/**
 * Company Profile Result
 * 
 * Return type for: get_company_profile, get_company_admin_profile
 */
export interface CompanyProfileResult {
  company: {
    id: string;
    owner_id: string | null;
    slug: string;
    name: string;
    logo: string | null;
    website: string | null;
    description: string | null;
    size: string | null;
    industry: string | null;
    using_cursor_since: Date | null;
    featured: boolean | null;
    created_at: Date;
    updated_at: Date;
  };
  active_jobs: CompanyProfileJobItem[];
  stats: CompanyProfileStats;
}

export interface CompanyProfileJobItem {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  remote: boolean | null;
  type: string;
  category: string;
  posted_at: Date | null;
  expires_at: Date | null;
}

export interface CompanyProfileStats {
  total_jobs: number;
  active_jobs: number;
  expired_jobs: number;
}

/**
 * Contact Command Result
 * 
 * Return type for: get_contact_commands
 */
export interface ContactCommandResult {
  id: string;
  text: string;
  description: string | null;
  category: string;
  icon_name: string | null;
  action_type: string;
  action_value: string | null;
  confetti_variant: string | null;
  requires_auth: boolean | null;
  aliases: string[];
}

/**
 * Content Detail Analytics
 * 
 * Part of: get_content_analytics, get_content_detail_complete
 */
export interface ContentDetailAnalytics {
  view_count: number;
  copy_count: number;
  bookmark_count: number;
  is_bookmarked: boolean | null;
}

/**
 * Content Detail Complete Result
 * 
 * Return type for: get_content_detail_complete
 */
export interface ContentDetailCompleteResult {
  content: Record<string, unknown>;
  analytics: ContentDetailAnalytics;
  related: ContentDetailRelatedItem[];
  collection_items: ContentDetailCollectionItem[];
}

/**
 * Content Detail Core Result
 * 
 * Return type for: get_content_detail_core
 */
export interface ContentDetailCoreResult {
  content: Record<string, unknown>;
  collection_items: ContentDetailCollectionItem[];
}

export interface ContentDetailCollectionItem {
  id: string;
  collection_id: string;
  content_type: string;
  content_slug: string;
  order: number;
  added_at: Date;
  title: string | null;
  description: string | null;
  author: string | null;
}

export interface ContentDetailRelatedItem {
  category: string;
  slug: string;
  title: string | null;
  description: string | null;
  author: string | null;
  date_added: Date;
  tags: string[];
  score: number;
  match_type: string | null;
  views: number;
  matched_tags: string[];
}

/**
 * Content Paginated Result
 * 
 * Return type for: get_content_paginated
 */
export interface ContentPaginatedResult {
  items: ContentPaginatedItem[];
  pagination: ContentPaginatedPagination;
  filters_applied: ContentPaginatedFilters;
}

export interface ContentPaginatedItem {
  id: string;
  slug: string;
  category: string;
  title: string | null;
  description: string;
  author: string;
  date_added: Date;
  tags: string[];
  view_count: number;
  bookmark_count: number;
  copy_count: number;
  review_count: number;
  avg_rating: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ContentPaginatedPagination {
  limit: number;
  offset: number;
  total: number;
  has_more: boolean;
}

export interface ContentPaginatedFilters {
  category: string | null;
  author: string | null;
  tags: string[];
  search: string | null;
}

/**
 * Content Paginated Slim Result
 * 
 * Return type for: get_content_paginated_slim
 */
export interface ContentPaginatedSlimResult {
  items: ContentPaginatedSlimItem[];
  pagination: ContentPaginatedPagination;
}

export interface ContentPaginatedSlimItem {
  id: string;
  slug: string;
  category: string;
  title: string | null;
  description: string;
  author: string;
  date_added: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Content Templates Result
 * 
 * Return type for: get_content_templates
 */
export interface ContentTemplatesResult {
  templates: ContentTemplatesItem[];
}

export interface ContentTemplatesItem {
  id: string;
  category: string;
  name: string;
  description: string;
  template_data: Record<string, unknown>;
  display_order: number;
  is_featured: boolean;
  active: boolean;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create Job With Payment Result
 * 
 * Return type for: create_job_with_payment
 */
export interface CreateJobWithPaymentResult {
  success: boolean;
  job_id: string | null;
  company_id: string | null;
  payment_amount: number | null;
  requires_payment: boolean;
  tier: string;
  plan: string;
}

/**
 * Homepage Complete Result
 * 
 * Return type for: get_homepage_complete, get_homepage_optimized
 */
export interface HomepageCompleteResult {
  categories: HomepageCategorySection[];
  featured: HomepageFeaturedSection | null;
  trending: HomepageTrendingSection | null;
}

export interface HomepageCategorySection {
  category: string;
  title: string;
  items: HomepageContentItem[];
  total: number;
  has_more: boolean;
}

export interface HomepageContentItem {
  id: string;
  slug: string;
  category: string;
  title: string | null;
  description: string;
  author: string;
  date_added: Date;
  tags: string[];
  view_count: number;
  bookmark_count: number;
  copy_count: number;
}

export interface HomepageFeaturedSection {
  items: HomepageContentItem[];
  total: number;
}

export interface HomepageTrendingSection {
  items: HomepageContentItem[];
  period: string;
  metric: string;
}

/**
 * Job Detail Result
 * 
 * Return type for: get_job_detail
 */
export interface JobDetailResult {
  job: {
    id: string;
    user_id: string | null;
    company_id: string | null;
    title: string;
    company: string;
    location: string | null;
    description: string;
    salary: string | null;
    remote: boolean | null;
    type: string;
    workplace: string | null;
    experience: string | null;
    category: string;
    tags: string[];
    requirements: string[];
    benefits: string[];
    link: string;
    contact_email: string | null;
    company_logo: string | null;
    plan: string;
    active: boolean | null;
    posted_at: Date | null;
    expires_at: Date | null;
    featured: boolean | null;
    view_count: number | null;
    click_count: number | null;
    created_at: Date;
    updated_at: Date;
    slug: string;
    status: string;
    tier: string;
  };
  company: {
    id: string;
    name: string;
    logo: string | null;
    website: string | null;
    description: string | null;
  } | null;
}

/**
 * Jobs List Item
 * 
 * Return type for: get_jobs_list, get_featured_jobs, get_jobs_by_category
 */
export interface JobsListItem {
  id: string;
  title: string;
  company: string;
  company_id: string | null;
  company_logo: string | null;
  location: string | null;
  remote: boolean | null;
  type: string;
  category: string;
  tags: string[];
  requirements: string[];
  benefits: string[];
  link: string;
  active: boolean | null;
  posted_at: Date | null;
  expires_at: Date | null;
  featured: boolean | null;
  click_count: number | null;
  slug: string;
  status: string;
}

/**
 * Popular Content Result
 * 
 * Return type for: get_popular_content
 */
export interface PopularContentResult {
  id: string;
  slug: string;
  category: string;
  title: string | null;
  description: string;
  author: string;
  date_added: Date;
  bookmark_count: number;
  copy_count: number;
  view_count: number;
  review_count: number;
  avg_rating: number | null;
}

/**
 * Quiz Recommendations Result
 * 
 * Return type for: get_recommendations
 */
export interface QuizRecommendationsResult {
  recommendations: QuizRecommendationItem[];
  matched_criteria: Record<string, unknown>;
}

export interface QuizRecommendationItem {
  category: string;
  slug: string;
  title: string | null;
  description: string;
  author: string;
  match_score: number;
  match_reasons: string[];
}

/**
 * Search Content Optimized Result
 * 
 * Return type for: search_content_optimized
 */
export interface SearchContentOptimizedResult {
  id: string;
  slug: string;
  category: string;
  title: string | null;
  description: string;
  author: string;
  tags: string[];
  relevance_score: number;
  matched_terms: string[];
  snippet: string | null;
}

/**
 * Search Unified Result
 * 
 * Return type for: search_unified
 */
export interface SearchUnifiedResult {
  entity_type: string;
  id: string;
  slug: string | null;
  title: string | null;
  description: string | null;
  category: string | null;
  relevance_score: number;
  matched_terms: string[];
}

/**
 * Subscribe Newsletter Result
 * 
 * Return type for: subscribe_newsletter
 */
export interface SubscribeNewsletterResult {
  success: boolean | null;
  subscription_id: string | null;
  was_resubscribed: boolean | null;
  email: string | null;
  error: string | null;
}

/**
 * Trending Metrics With Content Result
 * 
 * Return type for: get_trending_metrics_with_content
 */
export interface TrendingMetricsWithContentResult {
  id: string;
  slug: string;
  category: string;
  title: string | null;
  description: string;
  author: string;
  date_added: Date;
  bookmarks_total: number;
  copies_total: number;
  views_total: number;
  trending_score: number;
  period: string;
  metric: string;
}

/**
 * User Profile Result
 * 
 * Return type for: get_user_profile
 */
export interface UserProfileResult {
  user: {
    id: string;
    name: string | null;
    slug: string | null;
    image: string | null;
    hero: string | null;
    bio: string | null;
    work: string | null;
    website: string | null;
    social_x_link: string | null;
    interests: string[];
    created_at: Date;
    updated_at: Date;
    follower_count: number;
    following_count: number;
    submission_count: number;
    bookmark_count: number;
    profile_public: boolean | null;
  };
  is_following: boolean | null;
  collections: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    is_public: boolean;
    item_count: number;
    bookmark_count: number;
    created_at: Date;
  }>;
  recent_activity: Array<{
    type: string;
    content_type: string | null;
    content_slug: string | null;
    created_at: Date;
  }>;
}
