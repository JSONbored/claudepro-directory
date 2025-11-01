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
