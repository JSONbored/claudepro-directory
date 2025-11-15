/**
 * Database Type Overrides
 *
 * PostgreSQL marks ALL view columns as nullable, even when underlying table columns are NOT NULL.
 * This is a PostgreSQL limitation - it cannot determine nullability through complex queries (UNION ALL, JOINs).
 *
 * Solution: Manually override view Row types while preserving all other generated types.
 */

import type { Database as DatabaseGenerated } from './database.types';

/**
 * Override view nullability - preserve Tables, Enums, Functions
 */
type DatabaseWithViewOverrides = {
  public: {
    Tables: Omit<DatabaseGenerated['public']['Tables'], 'jobs'> & {
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
    Functions: Omit<DatabaseGenerated['public']['Functions'], 'submit_content_for_review'> & {
      submit_content_for_review: {
        Args: {
          p_author: string;
          p_author_profile_url?: string | null;
          p_category: string;
          p_content_data: DatabaseGenerated['public']['Functions']['submit_content_for_review']['Args']['p_content_data'];
          p_description: string;
          p_github_url?: string | null;
          p_name: string;
          p_submission_type: string;
          p_tags?: string[] | null;
        };
        Returns: DatabaseGenerated['public']['Functions']['submit_content_for_review']['Returns'];
      };
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
          category: string;
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
          category: string;
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
 */
export type GetUserDashboardReturn = {
  submissions: Array<Tables<'submissions'>>;
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
    content_type: string;
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
  category: string;
  viewCount: number;
  copyCount: number;
  _featured: {
    rank: number;
    score: number;
  } | null;
};

export type GetHomepageCompleteReturn = {
  content: {
    categoryData: Record<string, Array<HomepageContentItem>>;
    stats: Record<string, number>;
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
 * get_changelog_entries RPC return type
 * Returns paginated changelog entries with metadata
 */
export type GetChangelogEntriesReturn = {
  entries: Array<Tables<'changelog'>>;
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

/**
 * get_changelog_entry_by_slug RPC return type
 * Returns single changelog entry by slug
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
    | 'category'
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
  >;
  analytics: {
    view_count: number;
    copy_count: number;
    bookmark_count: number;
    is_bookmarked: boolean;
  };
  related: Array<{
    category: string;
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
    content_type: string;
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
  category: string;
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
  content_type: string;
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
 */
export type SearchContentOptimizedReturn = Array<{
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  author_profile_url: string | null;
  date_added: string;
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
  features: DatabaseGenerated['public']['Tables']['content']['Row']['features'];
  use_cases: DatabaseGenerated['public']['Tables']['content']['Row']['use_cases'];
  examples: DatabaseGenerated['public']['Tables']['content']['Row']['examples'];
  relevance_score: number;
  viewCount: number;
  copyCount: number;
  bookmark_count: number;
  combined_score: number;
  _featured: DatabaseGenerated['public']['Tables']['content']['Row']['metadata'];
}>;

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
  content_type: string;
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
export type GetUserActivitySummaryReturn = {
  total_bookmarks: number;
  total_contributions: number;
  total_collections: number;
  recent_activity: Array<{
    type: string;
    title: string;
    date: string;
  }>;
};
export type GetUserActivityTimelineReturn = Array<{
  id: string;
  type: string;
  action: string;
  content_type: string | null;
  content_slug: string | null;
  created_at: string;
  metadata: DatabaseGenerated['public']['Tables']['content']['Row']['metadata'];
}>;
export type GetUserIdentitiesReturn = Array<{
  provider: string;
  email: string | null;
  last_sign_in: string | null;
}>;
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
export type GetJobDetailReturn = Tables<'jobs'> & {
  company: Pick<Tables<'companies'>, 'id' | 'name' | 'logo' | 'website'> | null;
};
export type GetJobsByCategoryReturn = Array<Tables<'jobs'>>;
export type GetJobsCountReturn = number;
export type GetFeaturedJobsReturn = Array<Tables<'jobs'>>;
export type FilterJobsReturn = {
  jobs: Array<Tables<'jobs'>>;
  total: number;
  filters: {
    categories: string[];
    employment_types: string[];
    experience_levels: string[];
  };
};

/**
 * Miscellaneous RPC return types
 */
export type GetRelatedContentReturn = Array<{
  category: string;
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
    category: string;
  }>;
};

export type GetRecommendationsReturn = Array<{
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  score: number;
  reason: string;
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
    content_type: string;
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
    tier: string | null;
    created_at: string;
  };
};

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
    content_type: string;
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
 * get_active_notifications RPC return type
 * NOTE: This function already has a proper return type in database.types.ts
 * Returns array of notification objects (not Json)
 * See database.types.ts line 3091-3106 for the full type definition
 */
// No type override needed - already properly typed in generated file
