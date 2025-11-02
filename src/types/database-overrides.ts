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
    Tables: DatabaseGenerated['public']['Tables'];
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

      /**
       * personalized_feed view
       * Extends content table with user affinity scores
       *
       * user_id is nullable (not all content has affinity for all users)
       */
      personalized_feed: {
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
          created_at: string;
          updated_at: string;

          // Metrics (COALESCE defaults to 0)
          affinity_score: number;
          bookmark_count: number;
          popularity_score: number;
          trending_score: number;

          // Nullable fields
          user_id: string | null; // Nullable - not all content has user affinity
          affinity_calculated_at: string | null;
          author_profile_url: string | null;
          features: string[] | null;
          use_cases: string[] | null;
          examples: DatabaseGenerated['public']['Tables']['content']['Row']['examples'];
        };
      };

      /**
       * recommendation_results view
       * Extends content table with recommendation scores
       *
       * user_id is nullable (recommendations are user-specific)
       */
      recommendation_results: {
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
          created_at: string;
          updated_at: string;

          // Metrics (COALESCE defaults to 0)
          recommendation_score: number;
          user_affinity: number;
          bookmark_count: number;
          popularity_score: number;

          // Nullable fields
          user_id: string | null; // Nullable - recommendations are user-specific
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
