/**
 * Minimal database types for Edge Functions
 * Re-exports only what's needed to avoid duplicating the massive database.types.ts file
 *
 * For full types, see src/types/database.types.ts (generated via pnpm generate:types)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Functions: {
      get_weekly_digest: {
        Args: { p_week_start?: string }
        Returns: Json
      }
      get_due_sequence_emails: {
        Args: Record<string, never>
        Returns: Json
      }
      get_personalized_feed: {
        Args: { p_user_id: string; p_category?: string; p_limit?: number }
        Returns: Json
      }
      get_similar_content: {
        Args: { p_content_type: string; p_content_slug: string; p_limit?: number }
        Returns: Json
      }
      get_usage_recommendations: {
        Args: { p_user_id: string; p_trigger: string; p_content_type?: string; p_content_slug?: string; p_category?: string; p_limit?: number }
        Returns: Json
      }
      get_content_affinity: {
        Args: { p_user_id: string; p_content_type: string; p_content_slug: string }
        Returns: Json
      }
      get_user_affinities: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_favorite_categories: {
        Args: { p_user_id: string }
        Returns: Json
      }
      generate_metadata_complete: {
        Args: { p_route: string; p_include?: string }
        Returns: Json
      }
      get_user_recent_interactions: {
        Args: { p_user_id: string; p_limit?: number }
        Returns: Json
      }
      get_user_interaction_summary: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_recommendations: {
        Args: { p_user_profile: Json; p_limit?: number }
        Returns: Json
      }
      update_user_affinity_scores: {
        Args: { p_user_id: string }
        Returns: Json
      }
      // LLMs.txt generation functions
      generate_sitewide_llms_txt: {
        Args: never
        Returns: string
      }
      generate_category_llms_txt: {
        Args: { p_category: string }
        Returns: string
      }
      generate_llms_txt_content: {
        Args: { p_category: string; p_slug: string }
        Returns: Json
      }
      generate_changelog_llms_txt: {
        Args: never
        Returns: string
      }
      generate_changelog_entry_llms_txt: {
        Args: { p_slug: string }
        Returns: string
      }
      generate_tool_llms_txt: {
        Args: { p_tool_name: string }
        Returns: string
      }
    }
    Tables: {
      content_submissions: {
        Row: {
          author: string
          author_profile_url: string | null
          auto_slug: string | null
          category: string
          content_data: Json
          created_at: string
          description: string
          github_pr_url: string | null
          github_url: string | null
          id: string
          merged_at: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderator_notes: string | null
          name: string
          spam_reasons: string[] | null
          spam_score: number | null
          status: string
          submission_type: string
          submitter_email: string | null
          submitter_id: string | null
          submitter_ip: unknown
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          author: string
          author_profile_url?: string | null
          auto_slug?: string | null
          category: string
          content_data?: Json
          created_at?: string
          description: string
          github_pr_url?: string | null
          github_url?: string | null
          id?: string
          merged_at?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderator_notes?: string | null
          name: string
          spam_reasons?: string[] | null
          spam_score?: number | null
          status?: string
          submission_type: string
          submitter_email?: string | null
          submitter_id?: string | null
          submitter_ip?: unknown
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          author?: string
          author_profile_url?: string | null
          auto_slug?: string | null
          category?: string
          content_data?: Json
          created_at?: string
          description?: string
          github_pr_url?: string | null
          github_url?: string | null
          id?: string
          merged_at?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderator_notes?: string | null
          name?: string
          spam_reasons?: string[] | null
          spam_score?: number | null
          status?: string
          submission_type?: string
          submitter_email?: string | null
          submitter_id?: string | null
          submitter_ip?: unknown
          tags?: string[] | null
          updated_at?: string
        }
      }
      webhook_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          http_status_code: number | null
          id: string
          request_payload: Json | null
          response_payload: Json | null
          retry_count: number | null
          status: string
          submission_id: string
          webhook_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          http_status_code?: number | null
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          retry_count?: number | null
          status: string
          submission_id: string
          webhook_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          http_status_code?: number | null
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          retry_count?: number | null
          status?: string
          submission_id?: string
          webhook_type?: string
        }
      }
      content: {
        Row: {
          id: string
          category: string
          slug: string
          title: string
          display_title: string | null
          seo_title: string | null
          description: string
          author: string
          author_profile_url: string | null
          date_added: string
          tags: string[] | null
          content: string | null
          source: string | null
          documentation_url: string | null
          features: string[] | null
          use_cases: string[] | null
          examples: Json | null
          discovery_metadata: Json | null
          metadata: Json | null
          git_hash: string | null
        }
      }
    }
  }
}
