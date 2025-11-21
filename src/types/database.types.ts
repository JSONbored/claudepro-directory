export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcement_dismissals: {
        Row: {
          announcement_id: string
          created_at: string
          dismissed_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          dismissed_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          dismissed_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_dismissals_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          active: boolean
          created_at: string
          dismissible: boolean
          end_date: string | null
          href: string | null
          icon: string | null
          id: string
          priority: Database["public"]["Enums"]["announcement_priority"]
          start_date: string | null
          tag: string | null
          title: string
          updated_at: string
          variant: Database["public"]["Enums"]["announcement_variant"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          dismissible?: boolean
          end_date?: string | null
          href?: string | null
          icon?: string | null
          id: string
          priority?: Database["public"]["Enums"]["announcement_priority"]
          start_date?: string | null
          tag?: string | null
          title: string
          updated_at?: string
          variant?: Database["public"]["Enums"]["announcement_variant"]
        }
        Update: {
          active?: boolean
          created_at?: string
          dismissible?: boolean
          end_date?: string | null
          href?: string | null
          icon?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["announcement_priority"]
          start_date?: string | null
          tag?: string | null
          title?: string
          updated_at?: string
          variant?: Database["public"]["Enums"]["announcement_variant"]
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          category: string
          created_at: string
          description: string
          enabled: boolean
          environment: Database["public"]["Enums"]["environment"] | null
          previous_value: Json | null
          setting_key: string
          setting_type: Database["public"]["Enums"]["setting_type"]
          setting_value: Json
          updated_at: string
          version: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          enabled?: boolean
          environment?: Database["public"]["Enums"]["environment"] | null
          previous_value?: Json | null
          setting_key: string
          setting_type: Database["public"]["Enums"]["setting_type"]
          setting_value?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          enabled?: boolean
          environment?: Database["public"]["Enums"]["environment"] | null
          previous_value?: Json | null
          setting_key?: string
          setting_type?: Database["public"]["Enums"]["setting_type"]
          setting_value?: Json
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          content_slug: string
          content_type: Database["public"]["Enums"]["content_category"]
          created_at: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_slug: string
          content_type: Database["public"]["Enums"]["content_category"]
          created_at?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_slug?: string
          content_type?: Database["public"]["Enums"]["content_category"]
          created_at?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      category_configs: {
        Row: {
          api_schema: Json | null
          badges: Json | null
          category: Database["public"]["Enums"]["content_category"]
          color_scheme: string
          config_format: Database["public"]["Enums"]["config_format"] | null
          content_loader: string
          created_at: string
          description: string
          display_config: boolean
          empty_state_message: string | null
          generation_config: Json | null
          icon_name: string
          keywords: string
          meta_description: string
          metadata_fields: string[] | null
          plural_title: string
          primary_action_config: Json | null
          primary_action_label: string
          primary_action_type: Database["public"]["Enums"]["primary_action_type"]
          schema_name: string | null
          search_placeholder: string
          sections: Json
          show_on_homepage: boolean
          title: string
          updated_at: string
          url_slug: string
          validation_config: Json | null
        }
        Insert: {
          api_schema?: Json | null
          badges?: Json | null
          category: Database["public"]["Enums"]["content_category"]
          color_scheme: string
          config_format?: Database["public"]["Enums"]["config_format"] | null
          content_loader: string
          created_at?: string
          description: string
          display_config?: boolean
          empty_state_message?: string | null
          generation_config?: Json | null
          icon_name: string
          keywords: string
          meta_description: string
          metadata_fields?: string[] | null
          plural_title: string
          primary_action_config?: Json | null
          primary_action_label: string
          primary_action_type: Database["public"]["Enums"]["primary_action_type"]
          schema_name?: string | null
          search_placeholder: string
          sections?: Json
          show_on_homepage?: boolean
          title: string
          updated_at?: string
          url_slug: string
          validation_config?: Json | null
        }
        Update: {
          api_schema?: Json | null
          badges?: Json | null
          category?: Database["public"]["Enums"]["content_category"]
          color_scheme?: string
          config_format?: Database["public"]["Enums"]["config_format"] | null
          content_loader?: string
          created_at?: string
          description?: string
          display_config?: boolean
          empty_state_message?: string | null
          generation_config?: Json | null
          icon_name?: string
          keywords?: string
          meta_description?: string
          metadata_fields?: string[] | null
          plural_title?: string
          primary_action_config?: Json | null
          primary_action_label?: string
          primary_action_type?: Database["public"]["Enums"]["primary_action_type"]
          schema_name?: string | null
          search_placeholder?: string
          sections?: Json
          show_on_homepage?: boolean
          title?: string
          updated_at?: string
          url_slug?: string
          validation_config?: Json | null
        }
        Relationships: []
      }
      changelog: {
        Row: {
          canonical_url: string | null
          changes: Json
          commit_count: number | null
          content: string
          contributors: string[] | null
          created_at: string
          description: string | null
          featured: boolean
          git_commit_sha: string | null
          id: string
          json_ld: Json | null
          keywords: string[] | null
          metadata: Json | null
          og_image: string | null
          og_type: string | null
          published: boolean
          raw_content: string
          release_date: string
          robots_follow: boolean | null
          robots_index: boolean | null
          slug: string
          source: string | null
          title: string
          tldr: string | null
          twitter_card: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          changes?: Json
          commit_count?: number | null
          content: string
          contributors?: string[] | null
          created_at?: string
          description?: string | null
          featured?: boolean
          git_commit_sha?: string | null
          id?: string
          json_ld?: Json | null
          keywords?: string[] | null
          metadata?: Json | null
          og_image?: string | null
          og_type?: string | null
          published?: boolean
          raw_content: string
          release_date: string
          robots_follow?: boolean | null
          robots_index?: boolean | null
          slug: string
          source?: string | null
          title: string
          tldr?: string | null
          twitter_card?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          changes?: Json
          commit_count?: number | null
          content?: string
          contributors?: string[] | null
          created_at?: string
          description?: string | null
          featured?: boolean
          git_commit_sha?: string | null
          id?: string
          json_ld?: Json | null
          keywords?: string[] | null
          metadata?: Json | null
          og_image?: string | null
          og_type?: string | null
          published?: boolean
          raw_content?: string
          release_date?: string
          robots_follow?: boolean | null
          robots_index?: boolean | null
          slug?: string
          source?: string | null
          title?: string
          tldr?: string | null
          twitter_card?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      collection_items: {
        Row: {
          added_at: string
          collection_id: string
          content_slug: string
          content_type: Database["public"]["Enums"]["content_category"]
          created_at: string
          id: string
          notes: string | null
          order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          content_slug: string
          content_type: Database["public"]["Enums"]["content_category"]
          created_at?: string
          id?: string
          notes?: string | null
          order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          content_slug?: string
          content_type?: Database["public"]["Enums"]["content_category"]
          created_at?: string
          id?: string
          notes?: string | null
          order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "user_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          featured: boolean | null
          id: string
          industry: string | null
          json_ld: Json | null
          logo: string | null
          name: string
          owner_id: string | null
          size: Database["public"]["Enums"]["company_size"] | null
          slug: string
          updated_at: string
          using_cursor_since: string | null
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          industry?: string | null
          json_ld?: Json | null
          logo?: string | null
          name: string
          owner_id?: string | null
          size?: Database["public"]["Enums"]["company_size"] | null
          slug: string
          updated_at?: string
          using_cursor_since?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          industry?: string | null
          json_ld?: Json | null
          logo?: string | null
          name?: string
          owner_id?: string | null
          size?: Database["public"]["Enums"]["company_size"] | null
          slug?: string
          updated_at?: string
          using_cursor_since?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_commands: {
        Row: {
          action_type: Database["public"]["Enums"]["contact_action_type"]
          action_value: string | null
          aliases: string[] | null
          category: string
          command_id: string
          command_text: string
          confetti_variant:
            | Database["public"]["Enums"]["confetti_variant"]
            | null
          created_at: string | null
          description: string | null
          display_order: number
          icon_name: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          requires_auth: boolean | null
          updated_at: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["contact_action_type"]
          action_value?: string | null
          aliases?: string[] | null
          category?: string
          command_id: string
          command_text: string
          confetti_variant?:
            | Database["public"]["Enums"]["confetti_variant"]
            | null
          created_at?: string | null
          description?: string | null
          display_order: number
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          requires_auth?: boolean | null
          updated_at?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["contact_action_type"]
          action_value?: string | null
          aliases?: string[] | null
          category?: string
          command_id?: string
          command_text?: string
          confetti_variant?:
            | Database["public"]["Enums"]["confetti_variant"]
            | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          requires_auth?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          category: Database["public"]["Enums"]["contact_category"]
          created_at: string | null
          email: string
          id: string
          message: string
          metadata: Json | null
          name: string
          responded_by: string | null
          response_sent_at: string | null
          session_id: string | null
          status: Database["public"]["Enums"]["submission_status"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["contact_category"]
          created_at?: string | null
          email: string
          id?: string
          message: string
          metadata?: Json | null
          name: string
          responded_by?: string | null
          response_sent_at?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["contact_category"]
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          metadata?: Json | null
          name?: string
          responded_by?: string | null
          response_sent_at?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      content: {
        Row: {
          author: string
          author_profile_url: string | null
          avg_rating: number | null
          bookmark_count: number
          category: Database["public"]["Enums"]["content_category"] | null
          content: string | null
          copy_count: number
          created_at: string
          date_added: string
          description: string
          difficulty_score: number | null
          display_title: string | null
          documentation_url: string | null
          download_url: string | null
          examples: Json | null
          features: string[] | null
          git_hash: string | null
          has_breaking_changes: boolean | null
          has_prerequisites: boolean | null
          has_troubleshooting: boolean | null
          id: string
          json_ld: Json | null
          mcpb_build_hash: string | null
          mcpb_last_built_at: string | null
          mcpb_storage_url: string | null
          metadata: Json
          og_type: string | null
          popularity_score: number | null
          reading_time: number | null
          review_count: number
          robots_follow: boolean | null
          robots_index: boolean | null
          seo_title: string | null
          slug: string
          source: string | null
          storage_url: string | null
          synced_at: string | null
          tags: string[]
          title: string | null
          twitter_card: string | null
          updated_at: string
          use_cases: string[] | null
          view_count: number
        }
        Insert: {
          author: string
          author_profile_url?: string | null
          avg_rating?: number | null
          bookmark_count?: number
          category?: Database["public"]["Enums"]["content_category"] | null
          content?: string | null
          copy_count?: number
          created_at?: string
          date_added: string
          description: string
          difficulty_score?: number | null
          display_title?: string | null
          documentation_url?: string | null
          download_url?: string | null
          examples?: Json | null
          features?: string[] | null
          git_hash?: string | null
          has_breaking_changes?: boolean | null
          has_prerequisites?: boolean | null
          has_troubleshooting?: boolean | null
          id?: string
          json_ld?: Json | null
          mcpb_build_hash?: string | null
          mcpb_last_built_at?: string | null
          mcpb_storage_url?: string | null
          metadata?: Json
          og_type?: string | null
          popularity_score?: number | null
          reading_time?: number | null
          review_count?: number
          robots_follow?: boolean | null
          robots_index?: boolean | null
          seo_title?: string | null
          slug: string
          source?: string | null
          storage_url?: string | null
          synced_at?: string | null
          tags: string[]
          title?: string | null
          twitter_card?: string | null
          updated_at?: string
          use_cases?: string[] | null
          view_count?: number
        }
        Update: {
          author?: string
          author_profile_url?: string | null
          avg_rating?: number | null
          bookmark_count?: number
          category?: Database["public"]["Enums"]["content_category"] | null
          content?: string | null
          copy_count?: number
          created_at?: string
          date_added?: string
          description?: string
          difficulty_score?: number | null
          display_title?: string | null
          documentation_url?: string | null
          download_url?: string | null
          examples?: Json | null
          features?: string[] | null
          git_hash?: string | null
          has_breaking_changes?: boolean | null
          has_prerequisites?: boolean | null
          has_troubleshooting?: boolean | null
          id?: string
          json_ld?: Json | null
          mcpb_build_hash?: string | null
          mcpb_last_built_at?: string | null
          mcpb_storage_url?: string | null
          metadata?: Json
          og_type?: string | null
          popularity_score?: number | null
          reading_time?: number | null
          review_count?: number
          robots_follow?: boolean | null
          robots_index?: boolean | null
          seo_title?: string | null
          slug?: string
          source?: string | null
          storage_url?: string | null
          synced_at?: string | null
          tags?: string[]
          title?: string | null
          twitter_card?: string | null
          updated_at?: string
          use_cases?: string[] | null
          view_count?: number
        }
        Relationships: []
      }
      content_embeddings: {
        Row: {
          content_id: string
          content_text: string
          created_at: string
          embedding: string
          embedding_generated_at: string
          id: number
          updated_at: string
        }
        Insert: {
          content_id: string
          content_text: string
          created_at?: string
          embedding: string
          embedding_generated_at?: string
          id?: number
          updated_at?: string
        }
        Update: {
          content_id?: string
          content_text?: string
          created_at?: string
          embedding?: string
          embedding_generated_at?: string
          id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_embeddings_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: true
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_generation_tracking: {
        Row: {
          category: string
          discovery_metadata: Json | null
          generated_at: string
          generated_by: Database["public"]["Enums"]["generation_source"]
          generation_model: string | null
          generation_trigger: string | null
          github_pr_url: string | null
          id: string
          quality_score: number | null
          slug: string
          updated_at: string
          validation_errors: string[] | null
          validation_passed: boolean
        }
        Insert: {
          category: string
          discovery_metadata?: Json | null
          generated_at?: string
          generated_by: Database["public"]["Enums"]["generation_source"]
          generation_model?: string | null
          generation_trigger?: string | null
          github_pr_url?: string | null
          id?: string
          quality_score?: number | null
          slug: string
          updated_at?: string
          validation_errors?: string[] | null
          validation_passed?: boolean
        }
        Update: {
          category?: string
          discovery_metadata?: Json | null
          generated_at?: string
          generated_by?: Database["public"]["Enums"]["generation_source"]
          generation_model?: string | null
          generation_trigger?: string | null
          github_pr_url?: string | null
          id?: string
          quality_score?: number | null
          slug?: string
          updated_at?: string
          validation_errors?: string[] | null
          validation_passed?: boolean
        }
        Relationships: []
      }
      content_similarities: {
        Row: {
          calculated_at: string
          content_a_slug: string
          content_a_type: Database["public"]["Enums"]["content_category"] | null
          content_b_slug: string
          content_b_type: Database["public"]["Enums"]["content_category"] | null
          id: string
          similarity_factors: Json | null
          similarity_score: number
        }
        Insert: {
          calculated_at?: string
          content_a_slug: string
          content_a_type?:
            | Database["public"]["Enums"]["content_category"]
            | null
          content_b_slug: string
          content_b_type?:
            | Database["public"]["Enums"]["content_category"]
            | null
          id?: string
          similarity_factors?: Json | null
          similarity_score: number
        }
        Update: {
          calculated_at?: string
          content_a_slug?: string
          content_a_type?:
            | Database["public"]["Enums"]["content_category"]
            | null
          content_b_slug?: string
          content_b_type?:
            | Database["public"]["Enums"]["content_category"]
            | null
          id?: string
          similarity_factors?: Json | null
          similarity_score?: number
        }
        Relationships: []
      }
      content_submissions: {
        Row: {
          approved_slug: string | null
          author: string
          author_profile_url: string | null
          category: Database["public"]["Enums"]["content_category"]
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
          status: Database["public"]["Enums"]["submission_status"]
          submission_type: Database["public"]["Enums"]["submission_type"]
          submitter_email: string | null
          submitter_id: string | null
          submitter_ip: unknown
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          approved_slug?: string | null
          author: string
          author_profile_url?: string | null
          category: Database["public"]["Enums"]["content_category"]
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
          status?: Database["public"]["Enums"]["submission_status"]
          submission_type: Database["public"]["Enums"]["submission_type"]
          submitter_email?: string | null
          submitter_id?: string | null
          submitter_ip?: unknown
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          approved_slug?: string | null
          author?: string
          author_profile_url?: string | null
          category?: Database["public"]["Enums"]["content_category"]
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
          status?: Database["public"]["Enums"]["submission_status"]
          submission_type?: Database["public"]["Enums"]["submission_type"]
          submitter_email?: string | null
          submitter_id?: string | null
          submitter_ip?: unknown
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      content_templates: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["content_category"]
          created_at: string
          description: string
          display_order: number
          id: string
          is_featured: boolean
          name: string
          template_data: Json
          updated_at: string
          usage_count: number
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["content_category"]
          created_at?: string
          description: string
          display_order?: number
          id?: string
          is_featured?: boolean
          name: string
          template_data: Json
          updated_at?: string
          usage_count?: number
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["content_category"]
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_featured?: boolean
          name?: string
          template_data?: Json
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      email_blocklist: {
        Row: {
          created_at: string
          email: string
          notes: string | null
          reason: Database["public"]["Enums"]["email_blocklist_reason"]
        }
        Insert: {
          created_at?: string
          email: string
          notes?: string | null
          reason: Database["public"]["Enums"]["email_blocklist_reason"]
        }
        Update: {
          created_at?: string
          email?: string
          notes?: string | null
          reason?: Database["public"]["Enums"]["email_blocklist_reason"]
        }
        Relationships: []
      }
      email_engagement_summary: {
        Row: {
          clicks_last_30d: number | null
          created_at: string | null
          email: string
          emails_bounced: number | null
          emails_clicked: number | null
          emails_complained: number | null
          emails_delivered: number | null
          emails_failed: number | null
          emails_opened: number | null
          emails_sent: number | null
          engagement_score: number | null
          health_status: string | null
          id: string
          last_bounce_at: string | null
          last_clicked_at: string | null
          last_complaint_at: string | null
          last_delivered_at: string | null
          last_opened_at: string | null
          last_sent_at: string | null
          opens_last_30d: number | null
          resend_contact_id: string | null
          updated_at: string | null
        }
        Insert: {
          clicks_last_30d?: number | null
          created_at?: string | null
          email: string
          emails_bounced?: number | null
          emails_clicked?: number | null
          emails_complained?: number | null
          emails_delivered?: number | null
          emails_failed?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          engagement_score?: number | null
          health_status?: string | null
          id?: string
          last_bounce_at?: string | null
          last_clicked_at?: string | null
          last_complaint_at?: string | null
          last_delivered_at?: string | null
          last_opened_at?: string | null
          last_sent_at?: string | null
          opens_last_30d?: number | null
          resend_contact_id?: string | null
          updated_at?: string | null
        }
        Update: {
          clicks_last_30d?: number | null
          created_at?: string | null
          email?: string
          emails_bounced?: number | null
          emails_clicked?: number | null
          emails_complained?: number | null
          emails_delivered?: number | null
          emails_failed?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          engagement_score?: number | null
          health_status?: string | null
          id?: string
          last_bounce_at?: string | null
          last_clicked_at?: string | null
          last_complaint_at?: string | null
          last_delivered_at?: string | null
          last_opened_at?: string | null
          last_sent_at?: string | null
          opens_last_30d?: number | null
          resend_contact_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_resend_contact"
            columns: ["resend_contact_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscriptions"
            referencedColumns: ["resend_contact_id"]
          },
        ]
      }
      email_sequence_schedule: {
        Row: {
          created_at: string
          due_at: string
          email: string
          id: string
          processed: boolean
          processed_at: string | null
          sequence_id: string
          step: number
        }
        Insert: {
          created_at?: string
          due_at: string
          email: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          sequence_id: string
          step: number
        }
        Update: {
          created_at?: string
          due_at?: string
          email?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          sequence_id?: string
          step?: number
        }
        Relationships: []
      }
      email_sequences: {
        Row: {
          created_at: string
          current_step: number
          email: string
          id: string
          last_sent_at: string | null
          sequence_id: string
          started_at: string
          status: string
          total_steps: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_step: number
          email: string
          id?: string
          last_sent_at?: string | null
          sequence_id: string
          started_at?: string
          status?: string
          total_steps?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_step?: number
          email?: string
          id?: string
          last_sent_at?: string | null
          sequence_id?: string
          started_at?: string
          status?: string
          total_steps?: number
          updated_at?: string
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_field_configs: {
        Row: {
          config: Json | null
          created_at: string
          default_value: string | null
          display_order: number
          enabled: boolean
          field_group: string
          field_label: string
          field_name: string
          field_type: Database["public"]["Enums"]["form_field_type"]
          form_type: string
          grid_column: Database["public"]["Enums"]["form_grid_column"]
          help_text: string | null
          icon_name: string | null
          icon_position:
            | Database["public"]["Enums"]["form_icon_position"]
            | null
          id: string
          placeholder: string | null
          required: boolean
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          default_value?: string | null
          display_order?: number
          enabled?: boolean
          field_group?: string
          field_label: string
          field_name: string
          field_type: Database["public"]["Enums"]["form_field_type"]
          form_type: string
          grid_column?: Database["public"]["Enums"]["form_grid_column"]
          help_text?: string | null
          icon_name?: string | null
          icon_position?:
            | Database["public"]["Enums"]["form_icon_position"]
            | null
          id?: string
          placeholder?: string | null
          required?: boolean
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          default_value?: string | null
          display_order?: number
          enabled?: boolean
          field_group?: string
          field_label?: string
          field_name?: string
          field_type?: Database["public"]["Enums"]["form_field_type"]
          form_type?: string
          grid_column?: Database["public"]["Enums"]["form_grid_column"]
          help_text?: string | null
          icon_name?: string | null
          icon_position?:
            | Database["public"]["Enums"]["form_icon_position"]
            | null
          id?: string
          placeholder?: string | null
          required?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          active: boolean | null
          admin_notes: string | null
          benefits: string[]
          category: Database["public"]["Enums"]["job_category"]
          click_count: number | null
          company: string
          company_id: string | null
          company_logo: string | null
          contact_email: string | null
          created_at: string
          description: string
          discord_message_id: string | null
          experience: Database["public"]["Enums"]["experience_level"] | null
          expires_at: string | null
          featured: boolean | null
          id: string
          is_placeholder: boolean
          json_ld: Json | null
          link: string
          location: string | null
          locked_price: number | null
          order: number | null
          payment_amount: number | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          plan: Database["public"]["Enums"]["job_plan"]
          polar_customer_id: string | null
          polar_order_id: string | null
          polar_subscription_id: string | null
          posted_at: string | null
          remote: boolean | null
          requirements: string[]
          salary: string | null
          slug: string
          status: Database["public"]["Enums"]["job_status"]
          tags: string[]
          tier: Database["public"]["Enums"]["job_tier"]
          tier_price: number | null
          tier_upgraded_at: string | null
          title: string
          type: Database["public"]["Enums"]["job_type"]
          updated_at: string
          user_id: string | null
          view_count: number | null
          workplace: Database["public"]["Enums"]["workplace_type"] | null
        }
        Insert: {
          active?: boolean | null
          admin_notes?: string | null
          benefits?: string[]
          category: Database["public"]["Enums"]["job_category"]
          click_count?: number | null
          company: string
          company_id?: string | null
          company_logo?: string | null
          contact_email?: string | null
          created_at?: string
          description: string
          discord_message_id?: string | null
          experience?: Database["public"]["Enums"]["experience_level"] | null
          expires_at?: string | null
          featured?: boolean | null
          id?: string
          is_placeholder?: boolean
          json_ld?: Json | null
          link: string
          location?: string | null
          locked_price?: number | null
          order?: number | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          plan?: Database["public"]["Enums"]["job_plan"]
          polar_customer_id?: string | null
          polar_order_id?: string | null
          polar_subscription_id?: string | null
          posted_at?: string | null
          remote?: boolean | null
          requirements?: string[]
          salary?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[]
          tier?: Database["public"]["Enums"]["job_tier"]
          tier_price?: number | null
          tier_upgraded_at?: string | null
          title: string
          type: Database["public"]["Enums"]["job_type"]
          updated_at?: string
          user_id?: string | null
          view_count?: number | null
          workplace?: Database["public"]["Enums"]["workplace_type"] | null
        }
        Update: {
          active?: boolean | null
          admin_notes?: string | null
          benefits?: string[]
          category?: Database["public"]["Enums"]["job_category"]
          click_count?: number | null
          company?: string
          company_id?: string | null
          company_logo?: string | null
          contact_email?: string | null
          created_at?: string
          description?: string
          discord_message_id?: string | null
          experience?: Database["public"]["Enums"]["experience_level"] | null
          expires_at?: string | null
          featured?: boolean | null
          id?: string
          is_placeholder?: boolean
          json_ld?: Json | null
          link?: string
          location?: string | null
          locked_price?: number | null
          order?: number | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          plan?: Database["public"]["Enums"]["job_plan"]
          polar_customer_id?: string | null
          polar_order_id?: string | null
          polar_subscription_id?: string | null
          posted_at?: string | null
          remote?: boolean | null
          requirements?: string[]
          salary?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[]
          tier?: Database["public"]["Enums"]["job_tier"]
          tier_price?: number | null
          tier_upgraded_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["job_type"]
          updated_at?: string
          user_id?: string | null
          view_count?: number | null
          workplace?: Database["public"]["Enums"]["workplace_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      metadata_templates: {
        Row: {
          active: boolean | null
          created_at: string
          default_keywords: string[]
          description_template: string
          route_pattern: string
          title_formulas: string[]
          updated_at: string
          use_current_month_year: boolean | null
          use_current_year: boolean | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          default_keywords: string[]
          description_template: string
          route_pattern: string
          title_formulas: string[]
          updated_at?: string
          use_current_month_year?: boolean | null
          use_current_year?: boolean | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          default_keywords?: string[]
          description_template?: string
          route_pattern?: string
          title_formulas?: string[]
          updated_at?: string
          use_current_month_year?: boolean | null
          use_current_year?: boolean | null
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          categories_visited: string[] | null
          confirmation_token: string | null
          confirmed: boolean | null
          confirmed_at: string | null
          consent_given: boolean | null
          copy_category: string | null
          copy_slug: string | null
          copy_type: Database["public"]["Enums"]["copy_type"] | null
          created_at: string | null
          email: string
          engagement_score: number | null
          id: string
          ip_address: unknown
          last_active_at: string | null
          last_email_sent_at: string | null
          last_sync_at: string | null
          preferred_email_frequency: string | null
          primary_interest: string | null
          referrer: string | null
          resend_contact_id: string | null
          resend_topics: string[] | null
          source: Database["public"]["Enums"]["newsletter_source"] | null
          status: string
          subscribed_at: string | null
          sync_error: string | null
          sync_status: Database["public"]["Enums"]["newsletter_sync_status"]
          total_copies: number | null
          unsubscribed_at: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          categories_visited?: string[] | null
          confirmation_token?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          consent_given?: boolean | null
          copy_category?: string | null
          copy_slug?: string | null
          copy_type?: Database["public"]["Enums"]["copy_type"] | null
          created_at?: string | null
          email: string
          engagement_score?: number | null
          id?: string
          ip_address?: unknown
          last_active_at?: string | null
          last_email_sent_at?: string | null
          last_sync_at?: string | null
          preferred_email_frequency?: string | null
          primary_interest?: string | null
          referrer?: string | null
          resend_contact_id?: string | null
          resend_topics?: string[] | null
          source?: Database["public"]["Enums"]["newsletter_source"] | null
          status?: string
          subscribed_at?: string | null
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["newsletter_sync_status"]
          total_copies?: number | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          categories_visited?: string[] | null
          confirmation_token?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          consent_given?: boolean | null
          copy_category?: string | null
          copy_slug?: string | null
          copy_type?: Database["public"]["Enums"]["copy_type"] | null
          created_at?: string | null
          email?: string
          engagement_score?: number | null
          id?: string
          ip_address?: unknown
          last_active_at?: string | null
          last_email_sent_at?: string | null
          last_sync_at?: string | null
          preferred_email_frequency?: string | null
          primary_interest?: string | null
          referrer?: string | null
          resend_contact_id?: string | null
          resend_topics?: string[] | null
          source?: Database["public"]["Enums"]["newsletter_source"] | null
          status?: string
          subscribed_at?: string | null
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["newsletter_sync_status"]
          total_copies?: number | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      notification_dismissals: {
        Row: {
          created_at: string
          dismissed_at: string
          notification_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dismissed_at?: string
          notification_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dismissed_at?: string
          notification_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_dismissals_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_href: string | null
          action_label: string | null
          action_onclick: string | null
          active: boolean
          created_at: string
          expires_at: string | null
          icon: string | null
          id: string
          message: string
          priority: Database["public"]["Enums"]["notification_priority"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
        }
        Insert: {
          action_href?: string | null
          action_label?: string | null
          action_onclick?: string | null
          active?: boolean
          created_at?: string
          expires_at?: string | null
          icon?: string | null
          id: string
          message: string
          priority?: Database["public"]["Enums"]["notification_priority"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
        }
        Update: {
          action_href?: string | null
          action_label?: string | null
          action_onclick?: string | null
          active?: boolean
          created_at?: string
          expires_at?: string | null
          icon?: string | null
          id?: string
          message?: string
          priority?: Database["public"]["Enums"]["notification_priority"]
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          paid_at: string | null
          plan: string | null
          polar_checkout_id: string | null
          polar_customer_id: string | null
          polar_transaction_id: string
          product_id: string | null
          product_type: string
          status: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          plan?: string | null
          polar_checkout_id?: string | null
          polar_customer_id?: string | null
          polar_transaction_id: string
          product_id?: string | null
          product_type: string
          status: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          plan?: string | null
          polar_checkout_id?: string | null
          polar_customer_id?: string | null
          polar_transaction_id?: string
          product_id?: string | null
          product_type?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_options: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          icon_name: string | null
          id: string
          label: string
          question_id: string
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order: number
          icon_name?: string | null
          id?: string
          label: string
          question_id: string
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          label?: string
          question_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["question_id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          question_id: string
          question_text: string
          required: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order: number
          id?: string
          question_id: string
          question_text: string
          required?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          question_id?: string
          question_text?: string
          required?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limit_tracker: {
        Row: {
          counter: number | null
          identifier: string
          window_start: string | null
        }
        Insert: {
          counter?: number | null
          identifier: string
          window_start?: string | null
        }
        Update: {
          counter?: number | null
          identifier?: string
          window_start?: string | null
        }
        Relationships: []
      }
      review_helpful_votes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "review_ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpful_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      review_ratings: {
        Row: {
          content_slug: string
          content_type: Database["public"]["Enums"]["content_category"]
          created_at: string
          helpful_count: number
          id: string
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_slug: string
          content_type: Database["public"]["Enums"]["content_category"]
          created_at?: string
          helpful_count?: number
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_slug?: string
          content_type?: Database["public"]["Enums"]["content_category"]
          created_at?: string
          helpful_count?: number
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      search_queries: {
        Row: {
          created_at: string
          filters: Json | null
          id: string
          normalized_query: string | null
          query: string
          result_count: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          filters?: Json | null
          id?: string
          normalized_query?: string | null
          query: string
          result_count?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          filters?: Json | null
          id?: string
          normalized_query?: string | null
          query?: string
          result_count?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sponsored_content: {
        Row: {
          active: boolean | null
          click_count: number | null
          content_id: string
          content_type: Database["public"]["Enums"]["content_category"]
          created_at: string
          end_date: string
          id: string
          impression_count: number | null
          impression_limit: number | null
          start_date: string
          tier: Database["public"]["Enums"]["sponsorship_tier"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          click_count?: number | null
          content_id: string
          content_type: Database["public"]["Enums"]["content_category"]
          created_at?: string
          end_date: string
          id?: string
          impression_count?: number | null
          impression_limit?: number | null
          start_date: string
          tier: Database["public"]["Enums"]["sponsorship_tier"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          click_count?: number | null
          content_id?: string
          content_type?: Database["public"]["Enums"]["content_category"]
          created_at?: string
          end_date?: string
          id?: string
          impression_count?: number | null
          impression_limit?: number | null
          start_date?: string
          tier?: Database["public"]["Enums"]["sponsorship_tier"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      static_routes: {
        Row: {
          created_at: string
          description: string
          group_name: Database["public"]["Enums"]["route_group"]
          icon_name: string
          id: string
          is_active: boolean
          json_ld: Json | null
          og_type: string | null
          path: string
          robots_follow: boolean | null
          robots_index: boolean | null
          seo_description: string | null
          seo_title: string | null
          sort_order: number
          title: string
          twitter_card: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          group_name: Database["public"]["Enums"]["route_group"]
          icon_name: string
          id?: string
          is_active?: boolean
          json_ld?: Json | null
          og_type?: string | null
          path: string
          robots_follow?: boolean | null
          robots_index?: boolean | null
          seo_description?: string | null
          seo_title?: string | null
          sort_order?: number
          title: string
          twitter_card?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          group_name?: Database["public"]["Enums"]["route_group"]
          icon_name?: string
          id?: string
          is_active?: boolean
          json_ld?: Json | null
          og_type?: string | null
          path?: string
          robots_follow?: boolean | null
          robots_index?: boolean | null
          seo_description?: string | null
          seo_title?: string | null
          sort_order?: number
          title?: string
          twitter_card?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      structured_data_config: {
        Row: {
          active: boolean | null
          application_sub_category: string | null
          category: Database["public"]["Enums"]["content_category"]
          category_display_name: string
          created_at: string
          creative_work_description: string | null
          default_keywords: string[] | null
          default_requirements: string[] | null
          generate_aggregate_rating: boolean | null
          generate_application: boolean | null
          generate_breadcrumb: boolean | null
          generate_collection_page: boolean | null
          generate_course: boolean | null
          generate_creative_work: boolean | null
          generate_faq: boolean | null
          generate_how_to: boolean | null
          generate_item_list: boolean | null
          generate_job_posting: boolean | null
          generate_learning_resource: boolean | null
          generate_review: boolean | null
          generate_source_code: boolean | null
          generate_speakable: boolean | null
          generate_video_object: boolean | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          application_sub_category?: string | null
          category: Database["public"]["Enums"]["content_category"]
          category_display_name: string
          created_at?: string
          creative_work_description?: string | null
          default_keywords?: string[] | null
          default_requirements?: string[] | null
          generate_aggregate_rating?: boolean | null
          generate_application?: boolean | null
          generate_breadcrumb?: boolean | null
          generate_collection_page?: boolean | null
          generate_course?: boolean | null
          generate_creative_work?: boolean | null
          generate_faq?: boolean | null
          generate_how_to?: boolean | null
          generate_item_list?: boolean | null
          generate_job_posting?: boolean | null
          generate_learning_resource?: boolean | null
          generate_review?: boolean | null
          generate_source_code?: boolean | null
          generate_speakable?: boolean | null
          generate_video_object?: boolean | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          application_sub_category?: string | null
          category?: Database["public"]["Enums"]["content_category"]
          category_display_name?: string
          created_at?: string
          creative_work_description?: string | null
          default_keywords?: string[] | null
          default_requirements?: string[] | null
          generate_aggregate_rating?: boolean | null
          generate_application?: boolean | null
          generate_breadcrumb?: boolean | null
          generate_collection_page?: boolean | null
          generate_course?: boolean | null
          generate_creative_work?: boolean | null
          generate_faq?: boolean | null
          generate_how_to?: boolean | null
          generate_item_list?: boolean | null
          generate_job_posting?: boolean | null
          generate_learning_resource?: boolean | null
          generate_review?: boolean | null
          generate_source_code?: boolean | null
          generate_speakable?: boolean | null
          generate_video_object?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_name: string
          polar_customer_id: string | null
          polar_product_id: string | null
          polar_subscription_id: string
          product_id: string | null
          product_type: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          plan_name: string
          polar_customer_id?: string | null
          polar_product_id?: string | null
          polar_subscription_id: string
          product_id?: string | null
          product_type?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_name?: string
          polar_customer_id?: string | null
          polar_product_id?: string | null
          polar_subscription_id?: string
          product_id?: string | null
          product_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_display_config: {
        Row: {
          active: boolean | null
          created_at: string
          css_classes: string
          display_order: number
          label: string
          tier: Database["public"]["Enums"]["user_tier"]
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          css_classes: string
          display_order: number
          label: string
          tier: Database["public"]["Enums"]["user_tier"]
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          css_classes?: string
          display_order?: number
          label?: string
          tier?: Database["public"]["Enums"]["user_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      user_collections: {
        Row: {
          bookmark_count: number
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          item_count: number
          name: string
          slug: string
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          bookmark_count?: number
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          item_count?: number
          name: string
          slug: string
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          bookmark_count?: number
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          item_count?: number
          name?: string
          slug?: string
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_content: {
        Row: {
          active: boolean | null
          content: Json
          content_type: Database["public"]["Enums"]["content_category"]
          created_at: string
          description: string
          download_count: number | null
          featured: boolean | null
          id: string
          name: string
          plan: string
          slug: string
          tags: string[] | null
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          active?: boolean | null
          content: Json
          content_type: Database["public"]["Enums"]["content_category"]
          created_at?: string
          description: string
          download_count?: number | null
          featured?: boolean | null
          id?: string
          name: string
          plan?: string
          slug: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          active?: boolean | null
          content?: Json
          content_type?: Database["public"]["Enums"]["content_category"]
          created_at?: string
          description?: string
          download_count?: number | null
          featured?: boolean | null
          id?: string
          name?: string
          plan?: string
          slug?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interactions: {
        Row: {
          content_slug: string | null
          content_type: Database["public"]["Enums"]["content_category"] | null
          created_at: string
          id: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          metadata: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          content_slug?: string | null
          content_type?: Database["public"]["Enums"]["content_category"] | null
          created_at?: string
          id?: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          content_slug?: string | null
          content_type?: Database["public"]["Enums"]["content_category"] | null
          created_at?: string
          id?: string
          interaction_type?: Database["public"]["Enums"]["interaction_type"]
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mcps: {
        Row: {
          active: boolean | null
          click_count: number | null
          company_id: string | null
          created_at: string
          description: string
          id: string
          link: string
          logo: string | null
          mcp_link: string | null
          name: string
          order: number | null
          plan: string
          slug: string
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          active?: boolean | null
          click_count?: number | null
          company_id?: string | null
          created_at?: string
          description: string
          id?: string
          link: string
          logo?: string | null
          mcp_link?: string | null
          name: string
          order?: number | null
          plan?: string
          slug: string
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          active?: boolean | null
          click_count?: number | null
          company_id?: string | null
          created_at?: string
          description?: string
          id?: string
          link?: string
          logo?: string | null
          mcp_link?: string | null
          name?: string
          order?: number | null
          plan?: string
          slug?: string
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_mcps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_mcps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_similarities: {
        Row: {
          calculated_at: string
          common_items: number | null
          created_at: string
          id: string
          similarity_score: number
          updated_at: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          calculated_at?: string
          common_items?: number | null
          created_at?: string
          id?: string
          similarity_score: number
          updated_at?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          calculated_at?: string
          common_items?: number | null
          created_at?: string
          id?: string
          similarity_score?: number
          updated_at?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_similarities_user_a_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_similarities_user_b_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bio: string | null
          bookmark_count: number
          created_at: string
          display_name: string | null
          email: string | null
          follow_email: boolean | null
          follower_count: number
          following_count: number
          hero: string | null
          id: string
          image: string | null
          interests: string[] | null
          json_ld: Json | null
          name: string | null
          profile_public: boolean | null
          public: boolean | null
          slug: string | null
          social_x_link: string | null
          status: string | null
          submission_count: number
          tier: Database["public"]["Enums"]["user_tier"] | null
          updated_at: string
          website: string | null
          work: string | null
        }
        Insert: {
          bio?: string | null
          bookmark_count?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          follow_email?: boolean | null
          follower_count?: number
          following_count?: number
          hero?: string | null
          id: string
          image?: string | null
          interests?: string[] | null
          json_ld?: Json | null
          name?: string | null
          profile_public?: boolean | null
          public?: boolean | null
          slug?: string | null
          social_x_link?: string | null
          status?: string | null
          submission_count?: number
          tier?: Database["public"]["Enums"]["user_tier"] | null
          updated_at?: string
          website?: string | null
          work?: string | null
        }
        Update: {
          bio?: string | null
          bookmark_count?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          follow_email?: boolean | null
          follower_count?: number
          following_count?: number
          hero?: string | null
          id?: string
          image?: string | null
          interests?: string[] | null
          json_ld?: Json | null
          name?: string | null
          profile_public?: boolean | null
          public?: boolean | null
          slug?: string | null
          social_x_link?: string | null
          status?: string | null
          submission_count?: number
          tier?: Database["public"]["Enums"]["user_tier"] | null
          updated_at?: string
          website?: string | null
          work?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          data: Json
          direction: Database["public"]["Enums"]["webhook_direction"]
          error: string | null
          http_status_code: number | null
          id: string
          next_retry_at: string | null
          processed: boolean | null
          processed_at: string | null
          received_at: string | null
          related_id: string | null
          response_payload: Json | null
          retry_count: number | null
          source: Database["public"]["Enums"]["webhook_source"]
          svix_id: string | null
          type: string
        }
        Insert: {
          created_at: string
          data?: Json
          direction?: Database["public"]["Enums"]["webhook_direction"]
          error?: string | null
          http_status_code?: number | null
          id?: string
          next_retry_at?: string | null
          processed?: boolean | null
          processed_at?: string | null
          received_at?: string | null
          related_id?: string | null
          response_payload?: Json | null
          retry_count?: number | null
          source?: Database["public"]["Enums"]["webhook_source"]
          svix_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          data?: Json
          direction?: Database["public"]["Enums"]["webhook_direction"]
          error?: string | null
          http_status_code?: number | null
          id?: string
          next_retry_at?: string | null
          processed?: boolean | null
          processed_at?: string | null
          received_at?: string | null
          related_id?: string | null
          response_payload?: Json | null
          retry_count?: number | null
          source?: Database["public"]["Enums"]["webhook_source"]
          svix_id?: string | null
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      mv_analytics_summary: {
        Row: {
          bookmark_count: number | null
          category: Database["public"]["Enums"]["content_category"] | null
          copy_count: number | null
          last_interaction_at: string | null
          last_viewed_at: string | null
          slug: string | null
          total_time_spent_seconds: number | null
          view_count: number | null
        }
        Relationships: []
      }
      mv_timezone_names: {
        Row: {
          name: string | null
        }
        Relationships: []
      }
      trending_searches: {
        Row: {
          last_searched: string | null
          search_count: number | null
          search_query: string | null
          unique_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_bookmark: {
        Args: {
          p_content_slug: string
          p_content_type: Database["public"]["Enums"]["content_category"]
          p_notes?: string
          p_user_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["add_bookmark_result"]
        SetofOptions: {
          from: "*"
          to: "add_bookmark_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_submission: {
        Args: { p_moderator_notes?: string; p_submission_id: string }
        Returns: Database["public"]["CompositeTypes"]["approve_submission_result"]
        SetofOptions: {
          from: "*"
          to: "approve_submission_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      batch_add_bookmarks: {
        Args: {
          p_items: Database["public"]["CompositeTypes"]["bookmark_item_input"][]
          p_user_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["batch_add_bookmarks_result"]
        SetofOptions: {
          from: "*"
          to: "batch_add_bookmarks_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      batch_insert_user_interactions: {
        Args: {
          p_interactions: Database["public"]["CompositeTypes"]["user_interaction_input"][]
        }
        Returns: Database["public"]["CompositeTypes"]["batch_insert_user_interactions_result"]
        SetofOptions: {
          from: "*"
          to: "batch_insert_user_interactions_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      build_aggregate_rating_schema: {
        Args: {
          p_content_slug: string
          p_content_type: Database["public"]["Enums"]["content_category"]
        }
        Returns: Database["public"]["CompositeTypes"]["build_aggregate_rating_schema_result"]
        SetofOptions: {
          from: "*"
          to: "build_aggregate_rating_schema_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      build_breadcrumb_json_ld: {
        Args: {
          p_category: Database["public"]["Enums"]["content_category"]
          p_slug: string
        }
        Returns: Database["public"]["CompositeTypes"]["build_breadcrumb_json_ld_result"]
        SetofOptions: {
          from: "*"
          to: "build_breadcrumb_json_ld_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      build_changelog_json_ld: {
        Args: { p_slug: string }
        Returns: Database["public"]["CompositeTypes"]["build_changelog_json_ld_result"]
        SetofOptions: {
          from: "*"
          to: "build_changelog_json_ld_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      build_complete_content_schemas: {
        Args: {
          p_category: Database["public"]["Enums"]["content_category"]
          p_slug: string
        }
        Returns: Json
      }
      build_faq_schema: {
        Args: {
          p_category: Database["public"]["Enums"]["content_category"]
          p_slug: string
        }
        Returns: Json
      }
      build_how_to_schema: {
        Args: {
          p_category: Database["public"]["Enums"]["content_category"]
          p_slug: string
        }
        Returns: Json
      }
      build_item_list_schema: {
        Args: {
          p_category: Database["public"]["Enums"]["content_category"]
          p_slug: string
        }
        Returns: Json
      }
      build_job_discord_embed: { Args: { p_job_id: string }; Returns: Json }
      build_job_posting_schema: { Args: { p_job_id: string }; Returns: Json }
      build_learning_resource_schema: {
        Args: {
          p_category: Database["public"]["Enums"]["content_category"]
          p_slug: string
        }
        Returns: Json
      }
      build_organization_schema: {
        Args: { p_company_id: string }
        Returns: Json
      }
      build_person_schema: { Args: { p_slug: string }; Returns: Json }
      build_software_application_schema:
        | {
            Args: {
              p_category: Database["public"]["Enums"]["content_category"]
              p_slug: string
            }
            Returns: Json
          }
        | { Args: { p_config: Json; p_content_row: Json }; Returns: Json }
      build_source_code_schema: {
        Args: {
          p_category: Database["public"]["Enums"]["content_category"]
          p_slug: string
        }
        Returns: Json
      }
      build_static_route_json_ld: { Args: { p_path: string }; Returns: Json }
      calculate_content_popularity_score: {
        Args: {
          p_bookmark_count: number
          p_created_at: string
          p_review_count: number
          p_view_count: number
        }
        Returns: number
      }
      calculate_job_pricing: {
        Args: {
          p_plan: Database["public"]["Enums"]["job_plan"]
          p_tier: Database["public"]["Enums"]["job_tier"]
        }
        Returns: number
      }
      calculate_tag_similarity: {
        Args: { p_tags_a: string[]; p_tags_b: string[] }
        Returns: number
      }
      cancel_email_sequence: { Args: { p_email: string }; Returns: undefined }
      check_digest_cooldown: { Args: never; Returns: boolean }
      check_vacuum_needed: {
        Args: never
        Returns: {
          affected_tables: number
          alert_message: string
          max_bloat_ratio: number
          needs_vacuum: boolean
        }[]
      }
      create_job_with_payment: {
        Args: {
          p_job_data: Database["public"]["CompositeTypes"]["job_create_input"]
          p_plan: Database["public"]["Enums"]["job_plan"]
          p_tier: Database["public"]["Enums"]["job_tier"]
          p_user_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["create_job_with_payment_result"]
        SetofOptions: {
          from: "*"
          to: "create_job_with_payment_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_company: {
        Args: { p_company_id: string; p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["delete_company_result"]
        SetofOptions: {
          from: "*"
          to: "delete_company_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_job: {
        Args: { p_job_id: string; p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["delete_job_result"]
        SetofOptions: {
          from: "*"
          to: "delete_job_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      diagnose_failing_section: {
        Args: { p_section_index: number; p_slug: string }
        Returns: string
      }
      enroll_in_email_sequence: {
        Args: { p_email: string }
        Returns: undefined
      }
      ensure_user_record: {
        Args: {
          p_email?: string
          p_follow_email?: boolean
          p_id: string
          p_image?: string
          p_name?: string
          p_profile_public?: boolean
        }
        Returns: {
          bio: string | null
          bookmark_count: number
          created_at: string
          display_name: string | null
          email: string | null
          follow_email: boolean | null
          follower_count: number
          following_count: number
          hero: string | null
          id: string
          image: string | null
          interests: string[] | null
          json_ld: Json | null
          name: string | null
          profile_public: boolean | null
          public: boolean | null
          slug: string | null
          social_x_link: string | null
          status: string | null
          submission_count: number
          tier: Database["public"]["Enums"]["user_tier"] | null
          updated_at: string
          website: string | null
          work: string | null
        }
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      expire_jobs: {
        Args: never
        Returns: {
          expired_count: number
          expiring_soon_count: number
        }[]
      }
      extract_tags_for_search: { Args: { tags: Json }; Returns: string }
      filter_jobs: {
        Args: {
          p_category?: Database["public"]["Enums"]["job_category"]
          p_employment_type?: Database["public"]["Enums"]["job_type"]
          p_experience_level?: Database["public"]["Enums"]["experience_level"]
          p_limit?: number
          p_offset?: number
          p_remote_only?: boolean
          p_search_query?: string
        }
        Returns: Database["public"]["CompositeTypes"]["filter_jobs_result"]
        SetofOptions: {
          from: "*"
          to: "filter_jobs_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      format_date_iso: { Args: { input_date: string }; Returns: string }
      format_date_long: { Args: { input_date: string }; Returns: string }
      format_date_short: { Args: { input_date: string }; Returns: string }
      format_relative_date: {
        Args: { input_date: string; max_days?: number; style?: string }
        Returns: string
      }
      format_week_range: { Args: { week_start: string }; Returns: string }
      generate_category_llms_txt: {
        Args: { p_category: string }
        Returns: string
      }
      generate_changelog_atom_feed: {
        Args: { p_limit?: number }
        Returns: string
      }
      generate_changelog_entry_llms_txt: {
        Args: { p_slug: string }
        Returns: string
      }
      generate_changelog_llms_txt: { Args: never; Returns: string }
      generate_changelog_rss_feed: {
        Args: { p_limit?: number }
        Returns: string
      }
      generate_command_installation: {
        Args: { p_slug: string; p_title: string }
        Returns: Json
      }
      generate_company_slug: { Args: { p_name: string }; Returns: string }
      generate_content_atom_feed: {
        Args: { p_category?: string; p_limit?: number }
        Returns: string
      }
      generate_content_field: {
        Args: {
          p_category: Database["public"]["Enums"]["content_category"]
          p_field_type: Database["public"]["Enums"]["content_field_type"]
          p_slug: string
        }
        Returns: Json
      }
      generate_content_rss_feed: {
        Args: { p_category?: string; p_limit?: number }
        Returns: string
      }
      generate_item_llms_txt: {
        Args: { p_category: string; p_slug: string }
        Returns: string
      }
      generate_markdown_export: {
        Args: {
          p_category: Database["public"]["Enums"]["content_category"]
          p_include_footer?: boolean
          p_include_metadata?: boolean
          p_slug: string
        }
        Returns: Json
      }
      generate_metadata_complete: {
        Args: { p_include?: string; p_route: string }
        Returns: Json
      }
      generate_readme_data: { Args: never; Returns: Json }
      generate_sitemap_xml: { Args: { p_base_url?: string }; Returns: string }
      generate_sitewide_llms_txt: { Args: never; Returns: string }
      generate_slug: { Args: { p_name: string }; Returns: string }
      generate_slug_from_filename: {
        Args: { p_filename: string }
        Returns: string
      }
      generate_tool_llms_txt: { Args: { p_tool_name: string }; Returns: string }
      get_account_dashboard: {
        Args: { p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["account_dashboard_result"]
        SetofOptions: {
          from: "*"
          to: "account_dashboard_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_active_announcement: {
        Args: { p_now?: string }
        Returns: {
          active: boolean
          created_at: string
          dismissible: boolean
          end_date: string | null
          href: string | null
          icon: string | null
          id: string
          priority: Database["public"]["Enums"]["announcement_priority"]
          start_date: string | null
          tag: string | null
          title: string
          updated_at: string
          variant: Database["public"]["Enums"]["announcement_variant"]
        }
        SetofOptions: {
          from: "*"
          to: "announcements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_active_notifications: {
        Args: { p_dismissed_ids?: string[] }
        Returns: {
          action_href: string | null
          action_label: string | null
          action_onclick: string | null
          active: boolean
          created_at: string
          expires_at: string | null
          icon: string | null
          id: string
          message: string
          priority: Database["public"]["Enums"]["notification_priority"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_active_sponsored_content: {
        Args: {
          p_content_type?: Database["public"]["Enums"]["content_category"]
          p_limit?: number
        }
        Returns: {
          active: boolean
          click_count: number
          content_id: string
          content_type: Database["public"]["Enums"]["content_category"]
          created_at: string
          end_date: string
          id: string
          impression_count: number
          impression_limit: number
          start_date: string
          tier: Database["public"]["Enums"]["sponsorship_tier"]
          updated_at: string
          user_id: string
        }[]
      }
      get_active_subscribers: { Args: never; Returns: string[] }
      get_all_content_categories: {
        Args: never
        Returns: {
          category: string
        }[]
      }
      get_analytics_summary: {
        Args: { p_category?: string }
        Returns: {
          avg_popularity: number
          category: string
          total_bookmarks: number
          total_copies: number
          total_items: number
          total_views: number
        }[]
      }
      get_api_content_full: {
        Args: {
          p_base_url?: string
          p_category: Database["public"]["Enums"]["content_category"]
          p_slug: string
        }
        Returns: string
      }
      get_api_health: {
        Args: never
        Returns: Database["public"]["CompositeTypes"]["api_health_result"]
        SetofOptions: {
          from: "*"
          to: "api_health_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_bookmark_counts_by_category: {
        Args: { category_filter: string }
        Returns: {
          bookmark_count: number
          content_slug: string
        }[]
      }
      get_bulk_user_stats: {
        Args: { user_ids: string[] }
        Returns: {
          bookmarks_received: number
          comments: number
          followers: number
          posts: number
          reviews: number
          submissions: number
          user_id: string
          votes_received: number
        }[]
      }
      get_bulk_user_stats_realtime: {
        Args: { user_ids: string[] }
        Returns: {
          bookmarks_received: number
          comments: number
          followers: number
          posts: number
          reviews: number
          submissions: number
          user_id: string
          votes_received: number
        }[]
      }
      get_category_configs_with_features: {
        Args: never
        Returns: Database["public"]["CompositeTypes"]["category_config_with_features"][]
        SetofOptions: {
          from: "*"
          to: "category_config_with_features"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_category_description: {
        Args: { p_category: string }
        Returns: string
      }
      get_category_display_name: {
        Args: { p_category: string }
        Returns: string
      }
      get_changelog_detail: {
        Args: { p_slug: string }
        Returns: Database["public"]["CompositeTypes"]["changelog_detail_result"]
        SetofOptions: {
          from: "*"
          to: "changelog_detail_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_changelog_overview: {
        Args: {
          p_category?: string
          p_featured_only?: boolean
          p_limit?: number
          p_offset?: number
          p_published_only?: boolean
        }
        Returns: Database["public"]["CompositeTypes"]["changelog_overview_result"]
        SetofOptions: {
          from: "*"
          to: "changelog_overview_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_changelog_with_category_stats: {
        Args: { p_category?: string; p_limit?: number; p_offset?: number }
        Returns: Database["public"]["CompositeTypes"]["changelog_with_category_stats_result"]
        SetofOptions: {
          from: "*"
          to: "changelog_with_category_stats_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_collection_detail_with_items: {
        Args: { p_slug: string; p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["collection_detail_with_items_result"]
        SetofOptions: {
          from: "*"
          to: "collection_detail_with_items_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_collection_items_grouped: {
        Args: { p_collection_slug: string }
        Returns: Database["public"]["CompositeTypes"]["collection_items_grouped_result"]
        SetofOptions: {
          from: "*"
          to: "collection_items_grouped_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_community_directory: {
        Args: { p_limit?: number; p_search_query?: string }
        Returns: Database["public"]["CompositeTypes"]["community_directory_result"]
        SetofOptions: {
          from: "*"
          to: "community_directory_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_companies_list: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Database["public"]["CompositeTypes"]["company_list_result"]
        SetofOptions: {
          from: "*"
          to: "company_list_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_company_admin_profile: {
        Args: { p_company_id: string }
        Returns: {
          created_at: string
          description: string
          featured: boolean
          id: string
          industry: string
          logo: string
          name: string
          owner_id: string
          size: string
          slug: string
          updated_at: string
          using_cursor_since: string
          website: string
        }[]
      }
      get_company_profile: {
        Args: { p_slug: string }
        Returns: Database["public"]["CompositeTypes"]["company_profile_result"]
        SetofOptions: {
          from: "*"
          to: "company_profile_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_contact_commands: {
        Args: never
        Returns: {
          commands: Database["public"]["CompositeTypes"]["contact_command_result"][]
        }[]
      }
      get_content_detail_complete: {
        Args: {
          p_category: Database["public"]["Enums"]["content_category"]
          p_slug: string
          p_user_id?: string
        }
        Returns: Database["public"]["CompositeTypes"]["content_detail_complete_result"]
        SetofOptions: {
          from: "*"
          to: "content_detail_complete_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_content_paginated: {
        Args: {
          p_author?: string
          p_category?: Database["public"]["Enums"]["content_category"]
          p_limit?: number
          p_offset?: number
          p_order_by?: string
          p_order_direction?: string
          p_search?: string
          p_tags?: string[]
        }
        Returns: Database["public"]["CompositeTypes"]["content_paginated_result"]
        SetofOptions: {
          from: "*"
          to: "content_paginated_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_content_paginated_slim: {
        Args: {
          p_category?: string
          p_limit?: number
          p_offset?: number
          p_order_by?: string
          p_order_direction?: string
        }
        Returns: Database["public"]["CompositeTypes"]["content_paginated_slim_result"]
        SetofOptions: {
          from: "*"
          to: "content_paginated_slim_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_content_templates: {
        Args: { p_category: Database["public"]["Enums"]["content_category"] }
        Returns: Database["public"]["CompositeTypes"]["content_templates_result"]
        SetofOptions: {
          from: "*"
          to: "content_templates_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_content_with_analytics:
        | {
            Args: {
              p_category?: Database["public"]["Enums"]["content_category"]
              p_limit?: number
            }
            Returns: {
              bookmark_count: number
              category: string
              copy_count: number
              date_added: string
              description: string
              slug: string
              title: string
              view_count: number
            }[]
          }
        | {
            Args: {
              p_category: Database["public"]["Enums"]["content_category"]
              p_slug: string
            }
            Returns: {
              bookmark_count: number
              category: string
              copy_count: number
              description: string
              id: string
              slug: string
              title: string
              view_count: number
            }[]
          }
      get_current_week_start: { Args: never; Returns: string }
      get_database_fingerprint: {
        Args: never
        Returns: Database["public"]["CompositeTypes"]["database_fingerprint_item"][]
        SetofOptions: {
          from: "*"
          to: "database_fingerprint_item"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_days_ago: { Args: { input_date: string }; Returns: number }
      get_due_sequence_emails: {
        Args: never
        Returns: Database["public"]["CompositeTypes"]["due_sequence_email_item"][]
        SetofOptions: {
          from: "*"
          to: "due_sequence_email_item"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_dynamic_featured_content: {
        Args: {
          p_category: Database["public"]["Enums"]["content_category"]
          p_limit?: number
        }
        Returns: {
          bookmark_count: number
          content_slug: string
          content_type: string
          copy_count: number
          days_old: number
          engagement_score: number
          final_score: number
          freshness_score: number
          growth_rate_pct: number
          rank: number
          total_views: number
          trending_score: number
        }[]
      }
      get_enriched_content_list: {
        Args: {
          p_category?: Database["public"]["Enums"]["content_category"]
          p_limit?: number
          p_offset?: number
          p_slugs?: string[]
        }
        Returns: Database["public"]["CompositeTypes"]["enriched_content_item"][]
        SetofOptions: {
          from: "*"
          to: "enriched_content_item"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_featured_jobs: {
        Args: never
        Returns: {
          active: boolean | null
          admin_notes: string | null
          benefits: string[]
          category: Database["public"]["Enums"]["job_category"]
          click_count: number | null
          company: string
          company_id: string | null
          company_logo: string | null
          contact_email: string | null
          created_at: string
          description: string
          discord_message_id: string | null
          experience: Database["public"]["Enums"]["experience_level"] | null
          expires_at: string | null
          featured: boolean | null
          id: string
          is_placeholder: boolean
          json_ld: Json | null
          link: string
          location: string | null
          locked_price: number | null
          order: number | null
          payment_amount: number | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          plan: Database["public"]["Enums"]["job_plan"]
          polar_customer_id: string | null
          polar_order_id: string | null
          polar_subscription_id: string | null
          posted_at: string | null
          remote: boolean | null
          requirements: string[]
          salary: string | null
          slug: string
          status: Database["public"]["Enums"]["job_status"]
          tags: string[]
          tier: Database["public"]["Enums"]["job_tier"]
          tier_price: number | null
          tier_upgraded_at: string | null
          title: string
          type: Database["public"]["Enums"]["job_type"]
          updated_at: string
          user_id: string | null
          view_count: number | null
          workplace: Database["public"]["Enums"]["workplace_type"] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_form_field_config: {
        Args: { p_form_type: string }
        Returns: Database["public"]["CompositeTypes"]["form_field_config_result"]
        SetofOptions: {
          from: "*"
          to: "form_field_config_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_generation_config: {
        Args: { p_category?: string }
        Returns: Database["public"]["CompositeTypes"]["generation_config_item"][]
        SetofOptions: {
          from: "*"
          to: "generation_config_item"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_homepage_complete: {
        Args: { p_category_ids?: string[] }
        Returns: Database["public"]["CompositeTypes"]["homepage_complete_result"]
        SetofOptions: {
          from: "*"
          to: "homepage_complete_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_job_detail: {
        Args: { p_slug: string }
        Returns: Database["public"]["CompositeTypes"]["job_detail_result"]
        SetofOptions: {
          from: "*"
          to: "job_detail_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_jobs_by_category: {
        Args: { p_category: string }
        Returns: {
          active: boolean | null
          admin_notes: string | null
          benefits: string[]
          category: Database["public"]["Enums"]["job_category"]
          click_count: number | null
          company: string
          company_id: string | null
          company_logo: string | null
          contact_email: string | null
          created_at: string
          description: string
          discord_message_id: string | null
          experience: Database["public"]["Enums"]["experience_level"] | null
          expires_at: string | null
          featured: boolean | null
          id: string
          is_placeholder: boolean
          json_ld: Json | null
          link: string
          location: string | null
          locked_price: number | null
          order: number | null
          payment_amount: number | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          plan: Database["public"]["Enums"]["job_plan"]
          polar_customer_id: string | null
          polar_order_id: string | null
          polar_subscription_id: string | null
          posted_at: string | null
          remote: boolean | null
          requirements: string[]
          salary: string | null
          slug: string
          status: Database["public"]["Enums"]["job_status"]
          tags: string[]
          tier: Database["public"]["Enums"]["job_tier"]
          tier_price: number | null
          tier_upgraded_at: string | null
          title: string
          type: Database["public"]["Enums"]["job_type"]
          updated_at: string
          user_id: string | null
          view_count: number | null
          workplace: Database["public"]["Enums"]["workplace_type"] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_jobs_count: { Args: never; Returns: number }
      get_jobs_list: {
        Args: never
        Returns: Database["public"]["CompositeTypes"]["jobs_list_item"][]
        SetofOptions: {
          from: "*"
          to: "jobs_list_item"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_mcpb_storage_path: {
        Args: { p_slug: string }
        Returns: {
          bucket: string
          object_path: string
        }[]
      }
      get_my_submissions: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Database["public"]["CompositeTypes"]["my_submissions_item"][]
        SetofOptions: {
          from: "*"
          to: "my_submissions_item"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_navigation_menu: {
        Args: never
        Returns: Database["public"]["CompositeTypes"]["navigation_menu_result"]
        SetofOptions: {
          from: "*"
          to: "navigation_menu_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_new_content_for_week: {
        Args: { p_limit?: number; p_week_start: string }
        Returns: {
          category: Database["public"]["Enums"]["content_category"]
          date_added: string
          description: string
          slug: string
          title: string
          url: string
        }[]
      }
      get_or_create_company: {
        Args: { p_company_name: string; p_user_id: string }
        Returns: string
      }
      get_pending_resend_syncs: {
        Args: { p_limit?: number }
        Returns: {
          email: string
          id: string
          referrer: string
          source: string
          status: string
          subscribed_at: string
          unsubscribed_at: string
        }[]
      }
      get_pending_submissions: {
        Args: { p_filter_type?: string; p_limit?: number; p_offset?: number }
        Returns: Database["public"]["CompositeTypes"]["pending_submissions_item"][]
        SetofOptions: {
          from: "*"
          to: "pending_submissions_item"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_pgmq_queue_metrics: {
        Args: { p_queue_name: string }
        Returns: {
          newest_msg_age_sec: number
          oldest_msg_age_sec: number
          queue_length: number
        }[]
      }
      get_popular_content: {
        Args: { p_category?: string; p_limit?: number }
        Returns: {
          author: string
          category: string
          copy_count: number
          description: string
          popularity_score: number
          slug: string
          tags: string[]
          title: string
          view_count: number
        }[]
      }
      get_quiz_configuration: {
        Args: never
        Returns: Database["public"]["CompositeTypes"]["quiz_configuration_question"][]
        SetofOptions: {
          from: "*"
          to: "quiz_configuration_question"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_recent_content: {
        Args: { p_category?: string; p_days?: number; p_limit?: number }
        Returns: {
          author: string
          author_profile_url: string | null
          avg_rating: number | null
          bookmark_count: number
          category: Database["public"]["Enums"]["content_category"] | null
          content: string | null
          copy_count: number
          created_at: string
          date_added: string
          description: string
          difficulty_score: number | null
          display_title: string | null
          documentation_url: string | null
          download_url: string | null
          examples: Json | null
          features: string[] | null
          git_hash: string | null
          has_breaking_changes: boolean | null
          has_prerequisites: boolean | null
          has_troubleshooting: boolean | null
          id: string
          json_ld: Json | null
          mcpb_build_hash: string | null
          mcpb_last_built_at: string | null
          mcpb_storage_url: string | null
          metadata: Json
          og_type: string | null
          popularity_score: number | null
          reading_time: number | null
          review_count: number
          robots_follow: boolean | null
          robots_index: boolean | null
          seo_title: string | null
          slug: string
          source: string | null
          storage_url: string | null
          synced_at: string | null
          tags: string[]
          title: string | null
          twitter_card: string | null
          updated_at: string
          use_cases: string[] | null
          view_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "content"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_recommendations: {
        Args: {
          p_experience_level: string
          p_focus_areas?: string[]
          p_integrations?: string[]
          p_limit?: number
          p_tool_preferences: string[]
          p_use_case: string
        }
        Returns: Database["public"]["CompositeTypes"]["recommendation_result"]
        SetofOptions: {
          from: "*"
          to: "recommendation_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_related_content: {
        Args: {
          p_category: Database["public"]["Enums"]["content_category"]
          p_exclude_slugs?: string[]
          p_limit?: number
          p_slug: string
          p_tags?: string[]
        }
        Returns: Database["public"]["CompositeTypes"]["related_content_item"][]
        SetofOptions: {
          from: "*"
          to: "related_content_item"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_reviews_with_stats: {
        Args: {
          p_content_slug: string
          p_content_type: string
          p_limit?: number
          p_offset?: number
          p_sort_by?: string
          p_user_id?: string
        }
        Returns: Database["public"]["CompositeTypes"]["review_with_stats_result"]
        SetofOptions: {
          from: "*"
          to: "review_with_stats_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_search_count: {
        Args: {
          p_authors?: string[]
          p_categories?: string[]
          p_query?: string
          p_tags?: string[]
        }
        Returns: number
      }
      get_search_facets: {
        Args: never
        Returns: {
          all_tags: string[]
          author_count: number
          authors: string[]
          category: string
          content_count: number
          tag_count: number
        }[]
      }
      get_search_suggestions: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          suggestion: string
        }[]
      }
      get_search_suggestions_from_history: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          search_count: number
          suggestion: string
        }[]
      }
      get_similar_content: {
        Args: {
          p_content_slug: string
          p_content_type: string
          p_limit?: number
        }
        Returns: Database["public"]["CompositeTypes"]["similar_content_result"]
        SetofOptions: {
          from: "*"
          to: "similar_content_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_site_urls: {
        Args: never
        Returns: {
          changefreq: string
          lastmod: string
          path: string
          priority: number
        }[]
      }
      get_skill_storage_path: {
        Args: { p_slug: string }
        Returns: {
          bucket: string
          object_path: string
        }[]
      }
      get_sponsorship_analytics: {
        Args: { p_sponsorship_id: string; p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["sponsorship_analytics_result"]
        SetofOptions: {
          from: "*"
          to: "sponsorship_analytics_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_structured_data_config: {
        Args: { p_category: Database["public"]["Enums"]["content_category"] }
        Returns: Database["public"]["CompositeTypes"]["structured_data_config_result"]
        SetofOptions: {
          from: "*"
          to: "structured_data_config_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_submission_dashboard: {
        Args: { p_contributors_limit?: number; p_recent_limit?: number }
        Returns: Database["public"]["CompositeTypes"]["submission_dashboard_result"]
        SetofOptions: {
          from: "*"
          to: "submission_dashboard_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_top_tags_for_category: {
        Args: {
          p_category: Database["public"]["Enums"]["content_category"]
          p_limit?: number
        }
        Returns: {
          tag: string
          tag_count: number
        }[]
      }
      get_trending_content: {
        Args: {
          p_category?: Database["public"]["Enums"]["content_category"]
          p_limit?: number
        }
        Returns: {
          author: string
          author_profile_url: string | null
          avg_rating: number | null
          bookmark_count: number
          category: Database["public"]["Enums"]["content_category"] | null
          content: string | null
          copy_count: number
          created_at: string
          date_added: string
          description: string
          difficulty_score: number | null
          display_title: string | null
          documentation_url: string | null
          download_url: string | null
          examples: Json | null
          features: string[] | null
          git_hash: string | null
          has_breaking_changes: boolean | null
          has_prerequisites: boolean | null
          has_troubleshooting: boolean | null
          id: string
          json_ld: Json | null
          mcpb_build_hash: string | null
          mcpb_last_built_at: string | null
          mcpb_storage_url: string | null
          metadata: Json
          og_type: string | null
          popularity_score: number | null
          reading_time: number | null
          review_count: number
          robots_follow: boolean | null
          robots_index: boolean | null
          seo_title: string | null
          slug: string
          source: string | null
          storage_url: string | null
          synced_at: string | null
          tags: string[]
          title: string | null
          twitter_card: string | null
          updated_at: string
          use_cases: string[] | null
          view_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "content"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_trending_metrics: {
        Args: {
          p_category?: Database["public"]["Enums"]["content_category"]
          p_limit?: number
        }
        Returns: {
          bookmarks_total: number
          category: Database["public"]["Enums"]["content_category"]
          copies_total: number
          created_at: string
          days_old: number
          engagement_score: number
          freshness_score: number
          last_refreshed: string
          slug: string
          trending_score: number
          views_7d: number
          views_prev_7d: number
          views_total: number
        }[]
      }
      get_trending_metrics_with_content: {
        Args: { p_category?: string; p_limit?: number }
        Returns: {
          author: string
          bookmarks_total: number
          category: string
          copies_total: number
          description: string
          engagement_score: number
          freshness_score: number
          slug: string
          source: string
          tags: string[]
          title: string
          trending_score: number
          views_total: number
        }[]
      }
      get_trending_searches: {
        Args: { limit_count?: number }
        Returns: {
          count: number
          label: string
          query: string
        }[]
      }
      get_user_activity_summary: {
        Args: { p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["user_activity_summary"]
        SetofOptions: {
          from: "*"
          to: "user_activity_summary"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_activity_timeline: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_type?: string
          p_user_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["user_activity_timeline_result"]
        SetofOptions: {
          from: "*"
          to: "user_activity_timeline_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_collection_detail: {
        Args: {
          p_collection_slug: string
          p_user_slug: string
          p_viewer_id?: string
        }
        Returns: Database["public"]["CompositeTypes"]["user_collection_detail_result"]
        SetofOptions: {
          from: "*"
          to: "user_collection_detail_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_companies: {
        Args: { p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["user_companies_result"]
        SetofOptions: {
          from: "*"
          to: "user_companies_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_dashboard: {
        Args: { p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["user_dashboard_result"]
        SetofOptions: {
          from: "*"
          to: "user_dashboard_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_identities: {
        Args: { p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["user_identities_result"]
        SetofOptions: {
          from: "*"
          to: "user_identities_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_interaction_summary: {
        Args: { p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["user_interaction_summary"]
        SetofOptions: {
          from: "*"
          to: "user_interaction_summary"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_library: {
        Args: { p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["user_library_result"]
        SetofOptions: {
          from: "*"
          to: "user_library_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_profile: {
        Args: { p_user_slug: string; p_viewer_id?: string }
        Returns: Database["public"]["CompositeTypes"]["user_profile_result"]
        SetofOptions: {
          from: "*"
          to: "user_profile_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_settings: {
        Args: { p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["user_settings_result"]
        SetofOptions: {
          from: "*"
          to: "user_settings_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_sponsorships: {
        Args: { p_user_id: string }
        Returns: {
          active: boolean | null
          click_count: number | null
          content_id: string
          content_type: Database["public"]["Enums"]["content_category"]
          created_at: string
          end_date: string
          id: string
          impression_count: number | null
          impression_limit: number | null
          start_date: string
          tier: Database["public"]["Enums"]["sponsorship_tier"]
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "sponsored_content"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_week_end: { Args: { week_start: string }; Returns: string }
      get_weekly_digest: {
        Args: { p_week_start?: string }
        Returns: Database["public"]["CompositeTypes"]["weekly_digest_result"]
        SetofOptions: {
          from: "*"
          to: "weekly_digest_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      handle_polar_order_paid: {
        Args: { webhook_data: Json; webhook_id: string }
        Returns: undefined
      }
      handle_polar_order_refunded: {
        Args: { webhook_data: Json; webhook_id: string }
        Returns: undefined
      }
      handle_polar_subscription_canceled: {
        Args: { webhook_data: Json; webhook_id: string }
        Returns: undefined
      }
      handle_polar_subscription_renewal: {
        Args: { webhook_data: Json; webhook_id: string }
        Returns: undefined
      }
      handle_polar_subscription_revoked: {
        Args: { webhook_data: Json; webhook_id: string }
        Returns: undefined
      }
      handle_webhook_bounce: {
        Args: { p_event_data: Json; p_webhook_id: string }
        Returns: undefined
      }
      handle_webhook_complaint: {
        Args: { p_event_data: Json; p_webhook_id: string }
        Returns: undefined
      }
      handle_webhook_contact_created: {
        Args: { p_event_data: Json; p_webhook_id: string }
        Returns: undefined
      }
      handle_webhook_contact_deleted: {
        Args: { p_event_data: Json; p_webhook_id: string }
        Returns: undefined
      }
      handle_webhook_email_sent: {
        Args: { p_event_data: Json; p_webhook_id: string }
        Returns: undefined
      }
      handle_webhook_vercel_deployment: {
        Args: { p_event_data: Json; p_webhook_id: string }
        Returns: undefined
      }
      immutable_array_to_string: {
        Args: { arr: string[]; delimiter: string }
        Returns: string
      }
      import_redis_seed_data: {
        Args: { redis_data: Json }
        Returns: {
          items_processed: number
          total_copies_added: number
          total_processed: number
          total_views_added: number
        }[]
      }
      increment: {
        Args: {
          column_name: string
          increment_by?: number
          row_id: string
          table_name: string
        }
        Returns: undefined
      }
      insert_contact_submission: {
        Args: {
          p_category: Database["public"]["Enums"]["contact_category"]
          p_email: string
          p_message: string
          p_metadata?: Json
          p_name: string
        }
        Returns: {
          submission_id: string
          success: boolean
        }[]
      }
      invoke_edge_function: {
        Args: { action_header: string; function_name: string; payload?: Json }
        Returns: number
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_bookmarked: {
        Args: {
          p_content_slug: string
          p_content_type: Database["public"]["Enums"]["content_category"]
          p_user_id: string
        }
        Returns: boolean
      }
      is_bookmarked_batch: {
        Args: { p_items: Json; p_user_id: string }
        Returns: {
          content_slug: string
          content_type: Database["public"]["Enums"]["content_category"]
          is_bookmarked: boolean
        }[]
      }
      is_following: {
        Args: { follower_id: string; following_id: string }
        Returns: boolean
      }
      is_following_batch: {
        Args: { p_followed_user_ids: string[]; p_follower_id: string }
        Returns: {
          followed_user_id: string
          is_following: boolean
        }[]
      }
      is_in_future: { Args: { input_date: string }; Returns: boolean }
      is_in_past: { Args: { input_date: string }; Returns: boolean }
      job_slug: { Args: { p_title: string }; Returns: string }
      jsonb_array_to_text_array: { Args: { jb: Json }; Returns: string[] }
      manage_collection: {
        Args: {
          p_action: Database["public"]["Enums"]["crud_action"]
          p_add_item_data?: Database["public"]["CompositeTypes"]["collection_item_input"]
          p_create_data?: Database["public"]["CompositeTypes"]["collection_create_input"]
          p_delete_id?: string
          p_remove_item_id?: string
          p_update_data?: Database["public"]["CompositeTypes"]["collection_update_input"]
          p_user_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["manage_collection_result"]
        SetofOptions: {
          from: "*"
          to: "manage_collection_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      manage_company: {
        Args: {
          p_action: Database["public"]["Enums"]["crud_action"]
          p_create_data?: Database["public"]["CompositeTypes"]["company_create_input"]
          p_update_data?: Database["public"]["CompositeTypes"]["company_update_input"]
          p_user_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["manage_company_result"]
        SetofOptions: {
          from: "*"
          to: "manage_company_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      manage_review: {
        Args: {
          p_action: Database["public"]["Enums"]["crud_action"]
          p_create_data?: Database["public"]["CompositeTypes"]["review_create_input"]
          p_delete_id?: string
          p_update_data?: Database["public"]["CompositeTypes"]["review_update_input"]
          p_user_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["manage_review_result"]
        SetofOptions: {
          from: "*"
          to: "manage_review_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_resend_sync_complete: {
        Args: {
          p_error_message?: string
          p_resend_contact_id: string
          p_subscription_id: string
          p_success?: boolean
        }
        Returns: undefined
      }
      mark_sequence_email_processed: {
        Args: {
          p_email: string
          p_schedule_id: string
          p_step: number
          p_success?: boolean
        }
        Returns: undefined
      }
      populate_content_seo_data: {
        Args: never
        Returns: {
          category_name: string
          items_updated: number
          total_updated: number
        }[]
      }
      query_content_embeddings: {
        Args: {
          match_limit?: number
          match_threshold?: number
          p_authors?: string[]
          p_categories?: string[]
          p_offset?: number
          p_tags?: string[]
          query_embedding: string
        }
        Returns: {
          author: string
          author_profile_url: string
          bookmark_count: number
          category: string
          content_id: string
          copy_count: number
          created_at: string
          description: string
          similarity: number
          slug: string
          tags: string[]
          title: string
          updated_at: string
          view_count: number
        }[]
      }
      refresh_mv_site_urls: { Args: never; Returns: undefined }
      refresh_profile_from_oauth: {
        Args: { user_id: string }
        Returns: Database["public"]["CompositeTypes"]["refresh_profile_from_oauth_result"]
        SetofOptions: {
          from: "*"
          to: "refresh_profile_from_oauth_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refresh_user_stats: {
        Args: never
        Returns: {
          duration_ms: number
          message: string
          rows_refreshed: number
          success: boolean
        }[]
      }
      reject_submission: {
        Args: { p_moderator_notes: string; p_submission_id: string }
        Returns: Database["public"]["CompositeTypes"]["reject_submission_result"]
        SetofOptions: {
          from: "*"
          to: "reject_submission_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      remove_bookmark: {
        Args: {
          p_content_slug: string
          p_content_type: Database["public"]["Enums"]["content_category"]
          p_user_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["remove_bookmark_result"]
        SetofOptions: {
          from: "*"
          to: "remove_bookmark_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reorder_collection_items: {
        Args: {
          p_collection_id: string
          p_items: Database["public"]["CompositeTypes"]["collection_item_order_input"][]
          p_user_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["reorder_collection_items_result"]
        SetofOptions: {
          from: "*"
          to: "reorder_collection_items_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      replace_title_placeholder: {
        Args: { p_slug: string; p_text: string; p_title: string }
        Returns: string
      }
      schedule_next_sequence_step: {
        Args: { p_current_step: number; p_email: string }
        Returns: undefined
      }
      search_by_popularity: {
        Args: {
          p_authors?: string[]
          p_categories?: string[]
          p_limit?: number
          p_offset?: number
          p_query?: string
          p_tags?: string[]
        }
        Returns: {
          author: string
          author_profile_url: string
          bookmark_count: number
          category: string
          copy_count: number
          created_at: string
          date_added: string
          description: string
          examples: Json
          features: Json
          fts_vector: unknown
          id: string
          popularity_score: number
          slug: string
          tags: string[]
          title: string
          updated_at: string
          use_cases: Json
          view_count: number
        }[]
      }
      search_companies: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          created_at: string
          description: string | null
          featured: boolean | null
          id: string
          industry: string | null
          json_ld: Json | null
          logo: string | null
          name: string
          owner_id: string | null
          size: Database["public"]["Enums"]["company_size"] | null
          slug: string
          updated_at: string
          using_cursor_since: string | null
          website: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "companies"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_content_optimized: {
        Args: {
          p_authors?: string[]
          p_categories?: string[]
          p_limit?: number
          p_offset?: number
          p_query?: string
          p_sort?: string
          p_tags?: string[]
        }
        Returns: {
          _featured: Json
          author: string
          author_profile_url: string
          bookmark_count: number
          category: string
          combined_score: number
          copyCount: number
          created_at: string
          date_added: string
          description: string
          examples: Json
          features: Json
          id: string
          relevance_score: number
          slug: string
          source: string
          tags: string[]
          title: string
          updated_at: string
          use_cases: Json
          viewCount: number
        }[]
      }
      search_jobs: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          active: boolean | null
          admin_notes: string | null
          benefits: string[]
          category: Database["public"]["Enums"]["job_category"]
          click_count: number | null
          company: string
          company_id: string | null
          company_logo: string | null
          contact_email: string | null
          created_at: string
          description: string
          discord_message_id: string | null
          experience: Database["public"]["Enums"]["experience_level"] | null
          expires_at: string | null
          featured: boolean | null
          id: string
          is_placeholder: boolean
          json_ld: Json | null
          link: string
          location: string | null
          locked_price: number | null
          order: number | null
          payment_amount: number | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          plan: Database["public"]["Enums"]["job_plan"]
          polar_customer_id: string | null
          polar_order_id: string | null
          polar_subscription_id: string | null
          posted_at: string | null
          remote: boolean | null
          requirements: string[]
          salary: string | null
          slug: string
          status: Database["public"]["Enums"]["job_status"]
          tags: string[]
          tier: Database["public"]["Enums"]["job_tier"]
          tier_price: number | null
          tier_upgraded_at: string | null
          title: string
          type: Database["public"]["Enums"]["job_type"]
          updated_at: string
          user_id: string | null
          view_count: number | null
          workplace: Database["public"]["Enums"]["workplace_type"] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_mv: { Args: never; Returns: undefined }
      search_unified: {
        Args: {
          p_entities?: string[]
          p_limit?: number
          p_offset?: number
          p_query: string
        }
        Returns: {
          category: string
          created_at: string
          description: string
          engagement_score: number
          entity_type: string
          id: string
          relevance_score: number
          slug: string
          tags: string[]
          title: string
        }[]
      }
      search_users: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          bio: string | null
          bookmark_count: number
          created_at: string
          display_name: string | null
          email: string | null
          follow_email: boolean | null
          follower_count: number
          following_count: number
          hero: string | null
          id: string
          image: string | null
          interests: string[] | null
          json_ld: Json | null
          name: string | null
          profile_public: boolean | null
          public: boolean | null
          slug: string | null
          social_x_link: string | null
          status: string | null
          submission_count: number
          tier: Database["public"]["Enums"]["user_tier"] | null
          updated_at: string
          website: string | null
          work: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      should_generate_embedding: {
        Args: {
          content_author: string
          content_description: string
          content_tags: string[]
          content_title: string
        }
        Returns: boolean
      }
      should_generate_package: {
        Args: { category_name: string }
        Returns: boolean
      }
      slug_to_title: { Args: { p_slug: string }; Returns: string }
      submit_content_for_review: {
        Args: {
          p_author: string
          p_author_profile_url?: string
          p_category: Database["public"]["Enums"]["content_category"]
          p_content_data: Json
          p_description: string
          p_github_url?: string
          p_name: string
          p_submission_type: Database["public"]["Enums"]["submission_type"]
          p_tags?: string[]
        }
        Returns: Database["public"]["CompositeTypes"]["submit_content_for_review_result"]
        SetofOptions: {
          from: "*"
          to: "submit_content_for_review_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      subscribe_newsletter: {
        Args: {
          p_copy_category?: Database["public"]["Enums"]["content_category"]
          p_copy_slug?: string
          p_copy_type?: Database["public"]["Enums"]["copy_type"]
          p_email: string
          p_engagement_score?: number
          p_ip_address?: unknown
          p_last_active_at?: string
          p_primary_interest?: string
          p_referrer?: string
          p_resend_contact_id?: string
          p_resend_topics?: string[]
          p_source?: Database["public"]["Enums"]["newsletter_source"]
          p_sync_error?: string
          p_sync_status?: Database["public"]["Enums"]["newsletter_sync_status"]
          p_total_copies?: number
          p_user_agent?: string
        }
        Returns: Database["public"]["CompositeTypes"]["subscribe_newsletter_result"]
        SetofOptions: {
          from: "*"
          to: "subscribe_newsletter_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      suggest_vacuum_commands: {
        Args: { p_min_bloat_ratio?: number }
        Returns: {
          bloat_ratio: number
          dead_tuples: number
          tablename: string
          vacuum_command: string
        }[]
      }
      toggle_follow: {
        Args: {
          p_action: Database["public"]["Enums"]["follow_action"]
          p_follower_id: string
          p_following_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["toggle_follow_result"]
        SetofOptions: {
          from: "*"
          to: "toggle_follow_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      toggle_job_status: {
        Args: {
          p_job_id: string
          p_new_status: Database["public"]["Enums"]["job_status"]
          p_user_id: string
        }
        Returns: Database["public"]["CompositeTypes"]["toggle_job_status_result"]
        SetofOptions: {
          from: "*"
          to: "toggle_job_status_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      toggle_review_helpful: {
        Args: { p_helpful: boolean; p_review_id: string; p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["toggle_review_helpful_result"]
        SetofOptions: {
          from: "*"
          to: "toggle_review_helpful_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      track_user_interaction: {
        Args: {
          p_content_slug: string
          p_content_type: Database["public"]["Enums"]["content_category"]
          p_interaction_type: Database["public"]["Enums"]["interaction_type"]
          p_metadata?: Json
          p_session_id?: string
        }
        Returns: Database["public"]["CompositeTypes"]["track_user_interaction_result"]
        SetofOptions: {
          from: "*"
          to: "track_user_interaction_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      unlink_oauth_provider: {
        Args: { p_provider: Database["public"]["Enums"]["oauth_provider"] }
        Returns: Database["public"]["CompositeTypes"]["unlink_oauth_provider_result"]
        SetofOptions: {
          from: "*"
          to: "unlink_oauth_provider_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_job: {
        Args: { p_job_id: string; p_updates: Json; p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["update_job_result"]
        SetofOptions: {
          from: "*"
          to: "update_job_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_user_profile: {
        Args: {
          p_bio?: string
          p_display_name?: string
          p_follow_email?: boolean
          p_interests?: string[]
          p_profile_public?: boolean
          p_social_x_link?: string
          p_user_id: string
          p_website?: string
          p_work?: string
        }
        Returns: Database["public"]["CompositeTypes"]["update_user_profile_result"]
        SetofOptions: {
          from: "*"
          to: "update_user_profile_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_content_metadata: { Args: { metadata: Json }; Returns: boolean }
    }
    Enums: {
      announcement_priority: "high" | "medium" | "low"
      announcement_variant: "default" | "outline" | "secondary" | "destructive"
      changelog_category:
        | "Added"
        | "Changed"
        | "Deprecated"
        | "Removed"
        | "Fixed"
        | "Security"
      company_size: "just_me" | "2-10" | "11-50" | "51-200" | "201-500" | "500+"
      confetti_variant: "success" | "celebration" | "milestone" | "subtle"
      config_format: "json" | "multi" | "hook"
      contact_action_type:
        | "internal"
        | "external"
        | "route"
        | "sheet"
        | "easter-egg"
      contact_category: "bug" | "feature" | "partnership" | "general" | "other"
      content_category:
        | "agents"
        | "mcp"
        | "rules"
        | "commands"
        | "hooks"
        | "statuslines"
        | "skills"
        | "collections"
        | "guides"
        | "jobs"
        | "changelog"
      content_field_type:
        | "installation"
        | "use_cases"
        | "troubleshooting"
        | "requirements"
      copy_type: "llmstxt" | "markdown" | "code" | "link"
      crud_action: "create" | "update" | "delete" | "add_item" | "remove_item"
      email_blocklist_reason:
        | "spam_complaint"
        | "hard_bounce"
        | "repeated_soft_bounce"
        | "manual"
      environment: "development" | "preview" | "production"
      experience_level: "beginner" | "intermediate" | "advanced"
      field_scope: "common" | "type_specific" | "tags"
      field_type: "text" | "textarea" | "number" | "select"
      focus_area_type:
        | "security"
        | "performance"
        | "documentation"
        | "testing"
        | "code-quality"
        | "automation"
      follow_action: "follow" | "unfollow"
      form_field_type: "text" | "textarea" | "number" | "select"
      form_grid_column: "full" | "half" | "third" | "two-thirds"
      form_icon_position: "left" | "right"
      generation_source: "ai" | "manual" | "import" | "migration"
      grid_column: "full" | "half" | "third" | "two-thirds"
      guide_subcategory:
        | "tutorials"
        | "comparisons"
        | "workflows"
        | "use-cases"
        | "troubleshooting"
      icon_position: "left" | "right"
      integration_type:
        | "github"
        | "database"
        | "cloud-aws"
        | "cloud-gcp"
        | "cloud-azure"
        | "communication"
        | "none"
      interaction_type:
        | "view"
        | "copy"
        | "bookmark"
        | "click"
        | "time_spent"
        | "search"
        | "filter"
        | "screenshot"
        | "share"
        | "download"
        | "pwa_installed"
        | "pwa_launched"
        | "newsletter_subscribe"
        | "contact_interact"
        | "contact_submit"
        | "form_started"
        | "form_step_completed"
        | "form_field_focused"
        | "form_template_selected"
        | "form_abandoned"
        | "form_submitted"
        | "sponsored_impression"
        | "sponsored_click"
      job_category:
        | "engineering"
        | "design"
        | "product"
        | "marketing"
        | "sales"
        | "support"
        | "research"
        | "data"
        | "operations"
        | "leadership"
        | "consulting"
        | "education"
        | "other"
      job_plan: "one-time" | "subscription"
      job_status:
        | "draft"
        | "pending_payment"
        | "pending_review"
        | "active"
        | "expired"
        | "rejected"
        | "deleted"
      job_tier: "standard" | "featured"
      job_type:
        | "full-time"
        | "part-time"
        | "contract"
        | "freelance"
        | "internship"
      newsletter_source:
        | "footer"
        | "homepage"
        | "modal"
        | "content_page"
        | "inline"
        | "post_copy"
        | "resend_import"
        | "oauth_signup"
      newsletter_sync_status: "pending" | "synced" | "failed" | "skipped"
      notification_priority: "high" | "medium" | "low"
      notification_type: "announcement" | "feedback"
      oauth_provider: "discord" | "github" | "google"
      payment_method: "polar" | "mercury_invoice" | "manual"
      payment_status: "unpaid" | "paid" | "refunded"
      primary_action_type:
        | "notification"
        | "copy_command"
        | "copy_script"
        | "scroll"
        | "download"
        | "github_link"
      route_group: "primary" | "secondary" | "actions"
      setting_type: "boolean" | "string" | "number" | "json"
      sort_direction: "asc" | "desc"
      sort_option:
        | "relevance"
        | "date"
        | "popularity"
        | "name"
        | "updated"
        | "created"
        | "views"
        | "trending"
      sponsorship_tier: "featured" | "promoted" | "spotlight" | "sponsored"
      submission_status: "pending" | "approved" | "rejected" | "spam" | "merged"
      submission_type:
        | "agents"
        | "mcp"
        | "rules"
        | "commands"
        | "hooks"
        | "statuslines"
        | "skills"
      trending_metric: "views" | "likes" | "shares" | "downloads" | "all"
      trending_period: "today" | "week" | "month" | "year" | "all"
      use_case_type:
        | "code-review"
        | "api-development"
        | "frontend-development"
        | "data-science"
        | "content-creation"
        | "devops-infrastructure"
        | "general-development"
        | "testing-qa"
        | "security-audit"
      user_tier: "free" | "pro" | "enterprise"
      webhook_direction: "inbound" | "outbound"
      webhook_source:
        | "resend"
        | "vercel"
        | "discord"
        | "supabase_db"
        | "custom"
        | "polar"
      workplace_type: "Remote" | "On site" | "Hybrid"
    }
    CompositeTypes: {
      account_dashboard_profile: {
        name: string | null
        tier: Database["public"]["Enums"]["user_tier"] | null
        created_at: string | null
      }
      account_dashboard_result: {
        bookmark_count: number | null
        profile:
          | Database["public"]["CompositeTypes"]["account_dashboard_profile"]
          | null
      }
      add_bookmark_bookmark_item: {
        id: string | null
        user_id: string | null
        content_type: string | null
        content_slug: string | null
        notes: string | null
        created_at: string | null
      }
      add_bookmark_result: {
        success: boolean | null
        bookmark:
          | Database["public"]["CompositeTypes"]["add_bookmark_bookmark_item"]
          | null
      }
      api_health_category_configs_check: {
        status: string | null
        count: number | null
        error: string | null
      }
      api_health_checks: {
        database:
          | Database["public"]["CompositeTypes"]["api_health_database_check"]
          | null
        content_table:
          | Database["public"]["CompositeTypes"]["api_health_content_table_check"]
          | null
        category_configs:
          | Database["public"]["CompositeTypes"]["api_health_category_configs_check"]
          | null
      }
      api_health_content_table_check: {
        status: string | null
        count: number | null
        error: string | null
      }
      api_health_database_check: {
        status: string | null
        latency: number | null
        error: string | null
      }
      api_health_result: {
        status: string | null
        timestamp: string | null
        api_version: string | null
        checks: Database["public"]["CompositeTypes"]["api_health_checks"] | null
      }
      approve_submission_result: {
        success: boolean | null
        submission_id: string | null
        content_id: string | null
        slug: string | null
        category: string | null
        message: string | null
      }
      batch_add_bookmarks_result: {
        success: boolean | null
        saved_count: number | null
        total_requested: number | null
      }
      batch_insert_user_interactions_result: {
        inserted: number | null
        failed: number | null
        total: number | null
        errors: Json | null
      }
      blog_posting_schema: {
        context: string | null
        type: string | null
        id: string | null
        headline: string | null
        description: string | null
        url: string | null
        date_published: string | null
        date_modified: string | null
        author: Json | null
        publisher: Json | null
        main_entity_of_page: Json | null
        keywords: string[] | null
      }
      bookmark_item_input: {
        content_type: Database["public"]["Enums"]["content_category"] | null
        content_slug: string | null
      }
      build_aggregate_rating_schema_result: {
        context: string | null
        type: string | null
        rating_value: number | null
        rating_count: number | null
        review_count: number | null
        best_rating: number | null
        worst_rating: number | null
      }
      build_breadcrumb_json_ld_result: {
        context: string | null
        type: string | null
        item_list_element: Json | null
      }
      build_changelog_json_ld_result: {
        blog_posting:
          | Database["public"]["CompositeTypes"]["blog_posting_schema"]
          | null
        tech_article:
          | Database["public"]["CompositeTypes"]["tech_article_schema"]
          | null
      }
      category_config_features: {
        show_on_homepage: boolean | null
        display_config: boolean | null
        generate_full_content: boolean | null
        build_enable_cache: boolean | null
        api_generate_static: boolean | null
        api_include_trending: boolean | null
        section_features: boolean | null
        section_installation: boolean | null
        section_use_cases: boolean | null
        section_configuration: boolean | null
        section_security: boolean | null
        section_troubleshooting: boolean | null
        section_examples: boolean | null
        metadata_show_github_link: boolean | null
      }
      category_config_with_features: {
        title: string | null
        plural_title: string | null
        description: string | null
        icon_name: string | null
        color_scheme: string | null
        keywords: string | null
        meta_description: string | null
        search_placeholder: string | null
        empty_state_message: string | null
        url_slug: string | null
        content_loader: string | null
        config_format: Database["public"]["Enums"]["config_format"] | null
        primary_action_type:
          | Database["public"]["Enums"]["primary_action_type"]
          | null
        primary_action_label: string | null
        primary_action_config: Json | null
        validation_config: Json | null
        generation_config: Json | null
        schema_name: string | null
        api_schema: Json | null
        metadata_fields: string[] | null
        badges: Json | null
        features:
          | Database["public"]["CompositeTypes"]["category_config_features"]
          | null
      }
      changelog_category_counts: {
        all_count: number | null
        added_count: number | null
        changed_count: number | null
        fixed_count: number | null
        removed_count: number | null
        deprecated_count: number | null
        security_count: number | null
      }
      changelog_detail_entry: {
        id: string | null
        slug: string | null
        title: string | null
        tldr: string | null
        description: string | null
        content: string | null
        raw_content: string | null
        release_date: string | null
        date: string | null
        featured: boolean | null
        published: boolean | null
        keywords: string[] | null
        metadata: Json | null
        changes: Json | null
        created_at: string | null
        updated_at: string | null
        categories: Json | null
      }
      changelog_detail_result: {
        entry:
          | Database["public"]["CompositeTypes"]["changelog_detail_entry"]
          | null
      }
      changelog_metadata: {
        total_entries: number | null
        date_range:
          | Database["public"]["CompositeTypes"]["changelog_metadata_date_range"]
          | null
        category_counts: Json | null
      }
      changelog_metadata_date_range: {
        earliest: string | null
        latest: string | null
      }
      changelog_overview_entry: {
        id: string | null
        slug: string | null
        title: string | null
        tldr: string | null
        description: string | null
        content: string | null
        raw_content: string | null
        release_date: string | null
        date: string | null
        featured: boolean | null
        published: boolean | null
        keywords: string[] | null
        metadata: Json | null
        changes: Json | null
        created_at: string | null
        updated_at: string | null
      }
      changelog_overview_result: {
        entries:
          | Database["public"]["CompositeTypes"]["changelog_overview_entry"][]
          | null
        metadata:
          | Database["public"]["CompositeTypes"]["changelog_metadata"]
          | null
        featured:
          | Database["public"]["CompositeTypes"]["changelog_overview_entry"][]
          | null
        pagination:
          | Database["public"]["CompositeTypes"]["changelog_pagination"]
          | null
      }
      changelog_pagination: {
        total: number | null
        limit: number | null
        offset: number | null
        has_more: boolean | null
      }
      changelog_with_category_stats_entry: {
        id: string | null
        slug: string | null
        title: string | null
        description: string | null
        tldr: string | null
        content: string | null
        raw_content: string | null
        changes: Json | null
        metadata: Json | null
        release_date: string | null
        featured: boolean | null
        published: boolean | null
        keywords: string[] | null
        created_at: string | null
        updated_at: string | null
      }
      changelog_with_category_stats_result: {
        entries:
          | Database["public"]["CompositeTypes"]["changelog_with_category_stats_entry"][]
          | null
        category_counts:
          | Database["public"]["CompositeTypes"]["changelog_category_counts"]
          | null
        total: number | null
        filtered_count: number | null
      }
      collection_create_input: {
        name: string | null
        slug: string | null
        description: string | null
        is_public: boolean | null
      }
      collection_detail_with_items_result: {
        collection:
          | Database["public"]["Tables"]["user_collections"]["Row"]
          | null
        items: Database["public"]["Tables"]["collection_items"]["Row"][] | null
        bookmarks: Database["public"]["Tables"]["bookmarks"]["Row"][] | null
      }
      collection_item_input: {
        collection_id: string | null
        content_type: Database["public"]["Enums"]["content_category"] | null
        content_slug: string | null
        notes: string | null
        order: number | null
      }
      collection_item_order_input: {
        id: string | null
        order: number | null
      }
      collection_items_grouped_item: {
        id: string | null
        slug: string | null
        title: string | null
        description: string | null
        metadata: Json | null
        tags: string[] | null
        author: string | null
        date_added: string | null
        view_count: number | null
        copy_count: number | null
        bookmark_count: number | null
        review_count: number | null
        avg_rating: number | null
        popularity_score: number | null
      }
      collection_items_grouped_result: {
        success: boolean | null
        error: string | null
        grouped_items: Json | null
        total_items: number | null
      }
      collection_update_input: {
        id: string | null
        name: string | null
        slug: string | null
        description: string | null
        is_public: boolean | null
      }
      community_directory_result: {
        all_users:
          | Database["public"]["CompositeTypes"]["community_directory_user"][]
          | null
        top_contributors:
          | Database["public"]["CompositeTypes"]["community_directory_user"][]
          | null
        new_members:
          | Database["public"]["CompositeTypes"]["community_directory_user"][]
          | null
      }
      community_directory_user: {
        id: string | null
        slug: string | null
        name: string | null
        image: string | null
        bio: string | null
        work: string | null
        tier: Database["public"]["Enums"]["user_tier"] | null
        created_at: string | null
      }
      company_create_input: {
        name: string | null
        slug: string | null
        logo: string | null
        website: string | null
        description: string | null
        size: Database["public"]["Enums"]["company_size"] | null
        industry: string | null
        using_cursor_since: string | null
      }
      company_job_stats_item: {
        active_jobs: number | null
        total_jobs: number | null
        remote_jobs: number | null
        total_views: number | null
        total_clicks: number | null
        latest_job_posted_at: string | null
      }
      company_list_item: {
        id: string | null
        slug: string | null
        name: string | null
        logo: string | null
        website: string | null
        description: string | null
        size: string | null
        industry: string | null
        featured: boolean | null
        created_at: string | null
        stats:
          | Database["public"]["CompositeTypes"]["company_job_stats_item"]
          | null
      }
      company_list_result: {
        companies:
          | Database["public"]["CompositeTypes"]["company_list_item"][]
          | null
        total: number | null
      }
      company_profile_job_item: {
        id: string | null
        slug: string | null
        title: string | null
        company: string | null
        company_logo: string | null
        location: string | null
        description: string | null
        salary: string | null
        remote: boolean | null
        type: Database["public"]["Enums"]["job_type"] | null
        workplace: Database["public"]["Enums"]["workplace_type"] | null
        experience: Database["public"]["Enums"]["experience_level"] | null
        category: Database["public"]["Enums"]["job_category"] | null
        tags: string[] | null
        plan: Database["public"]["Enums"]["job_plan"] | null
        tier: Database["public"]["Enums"]["job_tier"] | null
        posted_at: string | null
        expires_at: string | null
        view_count: number | null
        click_count: number | null
        link: string | null
      }
      company_profile_result: {
        company: Database["public"]["Tables"]["companies"]["Row"] | null
        active_jobs:
          | Database["public"]["CompositeTypes"]["company_profile_job_item"][]
          | null
        stats:
          | Database["public"]["CompositeTypes"]["company_profile_stats"]
          | null
      }
      company_profile_stats: {
        total_jobs: number | null
        active_jobs: number | null
        featured_jobs: number | null
        remote_jobs: number | null
        avg_salary_min: number | null
        total_views: number | null
        total_clicks: number | null
        click_through_rate: number | null
        latest_job_posted_at: string | null
      }
      company_update_input: {
        id: string | null
        name: string | null
        slug: string | null
        logo: string | null
        website: string | null
        description: string | null
        size: Database["public"]["Enums"]["company_size"] | null
        industry: string | null
        using_cursor_since: string | null
      }
      contact_command_result: {
        id: string | null
        text: string | null
        description: string | null
        category: string | null
        icon_name: string | null
        action_type: Database["public"]["Enums"]["contact_action_type"] | null
        action_value: string | null
        confetti_variant: Database["public"]["Enums"]["confetti_variant"] | null
        requires_auth: boolean | null
        aliases: string[] | null
      }
      content_detail_analytics: {
        view_count: number | null
        copy_count: number | null
        bookmark_count: number | null
        is_bookmarked: boolean | null
      }
      content_detail_collection_item: {
        id: string | null
        collection_id: string | null
        content_type: string | null
        content_slug: string | null
        order: number | null
        added_at: string | null
        title: string | null
        description: string | null
        author: string | null
      }
      content_detail_complete_result: {
        content: Json | null
        analytics:
          | Database["public"]["CompositeTypes"]["content_detail_analytics"]
          | null
        related:
          | Database["public"]["CompositeTypes"]["content_detail_related_item"][]
          | null
        collection_items:
          | Database["public"]["CompositeTypes"]["content_detail_collection_item"][]
          | null
      }
      content_detail_related_item: {
        category: string | null
        slug: string | null
        title: string | null
        description: string | null
        author: string | null
        date_added: string | null
        tags: string[] | null
        score: number | null
        match_type: string | null
        views: number | null
        matched_tags: string[] | null
      }
      content_paginated_filters: {
        category: string | null
        author: string | null
        tags: string[] | null
        search: string | null
        order_by: string | null
        order_direction: string | null
      }
      content_paginated_item: {
        id: string | null
        slug: string | null
        title: string | null
        display_title: string | null
        seo_title: string | null
        description: string | null
        author: string | null
        author_profile_url: string | null
        category: string | null
        tags: string[] | null
        source_table: string | null
        created_at: string | null
        updated_at: string | null
        date_added: string | null
        features: string[] | null
        use_cases: string[] | null
        source: string | null
        documentation_url: string | null
        view_count: number | null
        copy_count: number | null
        bookmark_count: number | null
        popularity_score: number | null
        trending_score: number | null
        sponsored_content_id: string | null
        sponsorship_tier: string | null
        is_sponsored: boolean | null
      }
      content_paginated_pagination: {
        total_count: number | null
        limit: number | null
        offset: number | null
        has_more: boolean | null
        current_page: number | null
        total_pages: number | null
      }
      content_paginated_result: {
        items:
          | Database["public"]["CompositeTypes"]["content_paginated_item"][]
          | null
        pagination:
          | Database["public"]["CompositeTypes"]["content_paginated_pagination"]
          | null
        filters_applied:
          | Database["public"]["CompositeTypes"]["content_paginated_filters"]
          | null
      }
      content_paginated_slim_item: {
        id: string | null
        slug: string | null
        title: string | null
        display_title: string | null
        description: string | null
        author: string | null
        author_profile_url: string | null
        category: string | null
        tags: string[] | null
        source: string | null
        source_table: string | null
        created_at: string | null
        updated_at: string | null
        date_added: string | null
        view_count: number | null
        copy_count: number | null
        bookmark_count: number | null
        popularity_score: number | null
        trending_score: number | null
        sponsored_content_id: string | null
        sponsorship_tier: string | null
        is_sponsored: boolean | null
      }
      content_paginated_slim_result: {
        items:
          | Database["public"]["CompositeTypes"]["content_paginated_slim_item"][]
          | null
        pagination:
          | Database["public"]["CompositeTypes"]["content_paginated_pagination"]
          | null
      }
      content_templates_item: {
        id: string | null
        type: string | null
        name: string | null
        description: string | null
        category: string | null
        tags: string | null
        template_data: Json | null
      }
      content_templates_result: {
        templates:
          | Database["public"]["CompositeTypes"]["content_templates_item"][]
          | null
      }
      create_job_with_payment_result: {
        success: boolean | null
        job_id: string | null
        company_id: string | null
        payment_amount: number | null
        requires_payment: boolean | null
        tier: string | null
        plan: string | null
      }
      database_fingerprint_item: {
        table_name: string | null
        rows: number | null
        inserts: number | null
        updates: number | null
        deletes: number | null
        last_vacuum: string | null
      }
      delete_company_result: {
        success: boolean | null
        company_id: string | null
      }
      delete_job_result: {
        success: boolean | null
        job_id: string | null
        message: string | null
      }
      due_sequence_email_item: {
        id: string | null
        email: string | null
        step: number | null
      }
      enriched_content_item: {
        id: string | null
        slug: string | null
        title: string | null
        display_title: string | null
        seo_title: string | null
        description: string | null
        author: string | null
        author_profile_url: string | null
        category: string | null
        tags: string[] | null
        source_table: string | null
        created_at: string | null
        updated_at: string | null
        date_added: string | null
        features: string[] | null
        use_cases: string[] | null
        source: string | null
        documentation_url: string | null
        metadata: Json | null
        view_count: number | null
        copy_count: number | null
        bookmark_count: number | null
        popularity_score: number | null
        trending_score: number | null
        sponsored_content_id: string | null
        sponsorship_tier: string | null
        is_sponsored: boolean | null
      }
      filter_jobs_result: {
        jobs: Database["public"]["Tables"]["jobs"]["Row"][] | null
        total_count: number | null
      }
      form_field_config_item: {
        name: string | null
        label: string | null
        type: Database["public"]["Enums"]["form_field_type"] | null
        required: boolean | null
        placeholder: string | null
        help_text: string | null
        default_value: string | null
        grid_column: Database["public"]["Enums"]["form_grid_column"] | null
        icon_name: string | null
        icon_position: Database["public"]["Enums"]["form_icon_position"] | null
        rows: number | null
        monospace: boolean | null
        min_value: number | null
        max_value: number | null
        step_value: number | null
        select_options: Json | null
        field_group: string | null
        display_order: number | null
      }
      form_field_config_result: {
        form_type: string | null
        fields:
          | Database["public"]["CompositeTypes"]["form_field_config_item"][]
          | null
      }
      generation_config_item: {
        validation_config: Json | null
        generation_config: Json | null
      }
      homepage_complete_result: {
        content: Json | null
        member_count: number | null
        jobs_count: number | null
        featured_jobs: Json | null
        top_contributors:
          | Database["public"]["CompositeTypes"]["homepage_top_contributor"][]
          | null
      }
      homepage_top_contributor: {
        id: string | null
        slug: string | null
        name: string | null
        image: string | null
        bio: string | null
        work: string | null
        tier: Database["public"]["Enums"]["user_tier"] | null
      }
      job_create_input: {
        company: string | null
        company_id: string | null
        title: string | null
        description: string | null
        type: Database["public"]["Enums"]["job_type"] | null
        category: Database["public"]["Enums"]["job_category"] | null
        link: string | null
        location: string | null
        salary: string | null
        remote: boolean | null
        workplace: Database["public"]["Enums"]["workplace_type"] | null
        experience: Database["public"]["Enums"]["experience_level"] | null
        tags: string[] | null
        requirements: string[] | null
        benefits: string[] | null
        contact_email: string | null
        company_logo: string | null
      }
      job_detail_result: {
        id: string | null
        slug: string | null
        title: string | null
        company: string | null
        description: string | null
        location: string | null
        remote: boolean | null
        salary: string | null
        type: Database["public"]["Enums"]["job_type"] | null
        category: Database["public"]["Enums"]["job_category"] | null
        tags: string[] | null
        requirements: string[] | null
        benefits: string[] | null
        link: string | null
        contact_email: string | null
        posted_at: string | null
        expires_at: string | null
        active: boolean | null
        status: Database["public"]["Enums"]["job_status"] | null
        plan: Database["public"]["Enums"]["job_plan"] | null
        tier: Database["public"]["Enums"]["job_tier"] | null
        order: number | null
        created_at: string | null
        updated_at: string | null
      }
      jobs_list_item: {
        id: string | null
        slug: string | null
        title: string | null
        company: string | null
        description: string | null
        location: string | null
        remote: boolean | null
        salary: string | null
        type: Database["public"]["Enums"]["job_type"] | null
        category: Database["public"]["Enums"]["job_category"] | null
        tags: string[] | null
        requirements: string[] | null
        benefits: string[] | null
        link: string | null
        contact_email: string | null
        posted_at: string | null
        expires_at: string | null
        active: boolean | null
        status: Database["public"]["Enums"]["job_status"] | null
        plan: Database["public"]["Enums"]["job_plan"] | null
        tier: Database["public"]["Enums"]["job_tier"] | null
        order: number | null
        created_at: string | null
        updated_at: string | null
      }
      manage_collection_result: {
        success: boolean | null
        collection:
          | Database["public"]["Tables"]["user_collections"]["Row"]
          | null
        item: Database["public"]["Tables"]["collection_items"]["Row"] | null
      }
      manage_company_result: {
        success: boolean | null
        company: Database["public"]["Tables"]["companies"]["Row"] | null
      }
      manage_review_result: {
        success: boolean | null
        review: Database["public"]["Tables"]["review_ratings"]["Row"] | null
        content_type: string | null
        content_slug: string | null
      }
      my_submissions_item: {
        id: string | null
        submission_type: Database["public"]["Enums"]["submission_type"] | null
        status: Database["public"]["Enums"]["submission_status"] | null
        name: string | null
        description: string | null
        moderator_notes: string | null
        created_at: string | null
        moderated_at: string | null
      }
      navigation_menu_item: {
        path: string | null
        title: string | null
        description: string | null
        icon_name: string | null
        group: string | null
      }
      navigation_menu_result: {
        primary:
          | Database["public"]["CompositeTypes"]["navigation_menu_item"][]
          | null
        secondary:
          | Database["public"]["CompositeTypes"]["navigation_menu_item"][]
          | null
        actions:
          | Database["public"]["CompositeTypes"]["navigation_menu_item"][]
          | null
      }
      pending_submissions_item: {
        id: string | null
        submission_type: Database["public"]["Enums"]["submission_type"] | null
        status: Database["public"]["Enums"]["submission_status"] | null
        name: string | null
        description: string | null
        author: string | null
        author_profile_url: string | null
        github_url: string | null
        tags: string[] | null
        content_data: Json | null
        submitter_id: string | null
        submitter_email: string | null
        spam_score: number | null
        created_at: string | null
      }
      quiz_configuration_option: {
        value: string | null
        label: string | null
        description: string | null
        icon_name: string | null
      }
      quiz_configuration_question: {
        id: string | null
        question: string | null
        description: string | null
        required: boolean | null
        display_order: number | null
        options:
          | Database["public"]["CompositeTypes"]["quiz_configuration_option"][]
          | null
      }
      recommendation_item: {
        slug: string | null
        title: string | null
        description: string | null
        category: Database["public"]["Enums"]["content_category"] | null
        tags: string[] | null
        author: string | null
        match_score: number | null
        match_percentage: number | null
        primary_reason: string | null
        rank: number | null
        reasons:
          | Database["public"]["CompositeTypes"]["recommendation_reason"][]
          | null
      }
      recommendation_reason: {
        type: string | null
        message: string | null
      }
      recommendation_result: {
        results:
          | Database["public"]["CompositeTypes"]["recommendation_item"][]
          | null
        total_matches: number | null
        algorithm: string | null
        summary:
          | Database["public"]["CompositeTypes"]["recommendation_summary"]
          | null
      }
      recommendation_summary: {
        top_category: string | null
        avg_match_score: number | null
        diversity_score: number | null
      }
      refresh_profile_from_oauth_result: {
        user_profile: Database["public"]["Tables"]["users"]["Row"] | null
      }
      reject_submission_result: {
        success: boolean | null
        submission_id: string | null
        status: Database["public"]["Enums"]["submission_status"] | null
      }
      related_content_item: {
        category: Database["public"]["Enums"]["content_category"] | null
        slug: string | null
        title: string | null
        description: string | null
        author: string | null
        date_added: string | null
        tags: string[] | null
        score: number | null
        match_type: string | null
        views: number | null
        matched_tags: string[] | null
      }
      remove_bookmark_result: {
        success: boolean | null
      }
      reorder_collection_items_result: {
        success: boolean | null
        updated: number | null
        error: string | null
        errors: Json | null
      }
      review_aggregate_rating: {
        success: boolean | null
        average: number | null
        count: number | null
        distribution:
          | Database["public"]["CompositeTypes"]["review_rating_distribution"]
          | null
      }
      review_create_input: {
        content_type: Database["public"]["Enums"]["content_category"] | null
        content_slug: string | null
        rating: number | null
        review_text: string | null
      }
      review_rating_distribution: {
        rating_1: number | null
        rating_2: number | null
        rating_3: number | null
        rating_4: number | null
        rating_5: number | null
      }
      review_update_input: {
        review_id: string | null
        rating: number | null
        review_text: string | null
      }
      review_with_stats_item: {
        id: string | null
        rating: number | null
        review_text: string | null
        helpful_count: number | null
        created_at: string | null
        updated_at: string | null
        user:
          | Database["public"]["CompositeTypes"]["review_with_stats_user"]
          | null
        is_helpful: boolean | null
      }
      review_with_stats_result: {
        reviews:
          | Database["public"]["CompositeTypes"]["review_with_stats_item"][]
          | null
        has_more: boolean | null
        total_count: number | null
        aggregate_rating:
          | Database["public"]["CompositeTypes"]["review_aggregate_rating"]
          | null
      }
      review_with_stats_user: {
        id: string | null
        slug: string | null
        name: string | null
        image: string | null
        tier: Database["public"]["Enums"]["user_tier"] | null
      }
      similar_content_item: {
        slug: string | null
        title: string | null
        description: string | null
        category: Database["public"]["Enums"]["content_category"] | null
        score: number | null
        tags: string[] | null
        similarity_factors: Json | null
        calculated_at: string | null
      }
      similar_content_result: {
        similar_items:
          | Database["public"]["CompositeTypes"]["similar_content_item"][]
          | null
        algorithm_version: string | null
      }
      similar_content_source_item: {
        slug: string | null
        category: Database["public"]["Enums"]["content_category"] | null
      }
      sponsorship_analytics_computed_metrics: {
        ctr: number | null
        days_active: number | null
        avg_impressions_per_day: number | null
      }
      sponsorship_analytics_daily_stat: {
        date: string | null
        impressions: number | null
        clicks: number | null
      }
      sponsorship_analytics_result: {
        sponsorship:
          | Database["public"]["Tables"]["sponsored_content"]["Row"]
          | null
        daily_stats:
          | Database["public"]["CompositeTypes"]["sponsorship_analytics_daily_stat"][]
          | null
        computed_metrics:
          | Database["public"]["CompositeTypes"]["sponsorship_analytics_computed_metrics"]
          | null
      }
      structured_data_config_result: {
        schema_types:
          | Database["public"]["CompositeTypes"]["structured_data_schema_types"]
          | null
        category_display_name: string | null
        application_sub_category: string | null
        default_keywords: string[] | null
        default_requirements: string[] | null
        creative_work_description: string | null
      }
      structured_data_schema_types: {
        application: boolean | null
        source_code: boolean | null
        how_to: boolean | null
        creative_work: boolean | null
        faq: boolean | null
        breadcrumb: boolean | null
        speakable: boolean | null
        review: boolean | null
        aggregate_rating: boolean | null
        video_object: boolean | null
        course: boolean | null
        job_posting: boolean | null
        collection_page: boolean | null
        learning_resource: boolean | null
        item_list: boolean | null
      }
      submission_dashboard_contributor_item: {
        rank: number | null
        name: string | null
        slug: string | null
        merged_count: number | null
      }
      submission_dashboard_recent_item: {
        id: string | null
        content_name: string | null
        content_type: Database["public"]["Enums"]["submission_type"] | null
        merged_at: string | null
        user:
          | Database["public"]["CompositeTypes"]["submission_dashboard_recent_user"]
          | null
      }
      submission_dashboard_recent_user: {
        name: string | null
        slug: string | null
      }
      submission_dashboard_result: {
        stats:
          | Database["public"]["CompositeTypes"]["submission_dashboard_stats"]
          | null
        recent:
          | Database["public"]["CompositeTypes"]["submission_dashboard_recent_item"][]
          | null
        contributors:
          | Database["public"]["CompositeTypes"]["submission_dashboard_contributor_item"][]
          | null
      }
      submission_dashboard_stats: {
        total: number | null
        pending: number | null
        merged_this_week: number | null
      }
      submit_content_for_review_result: {
        success: boolean | null
        submission_id: string | null
        status: Database["public"]["Enums"]["submission_status"] | null
        message: string | null
      }
      subscribe_newsletter_result: {
        success: boolean | null
        subscription_id: string | null
        was_resubscribed: boolean | null
        email: string | null
        error: string | null
      }
      tech_article_schema: {
        context: string | null
        type: string | null
        headline: string | null
        description: string | null
        url: string | null
        date_published: string | null
        date_modified: string | null
        author: Json | null
        in_language: string | null
        article_section: string | null
      }
      toggle_follow_result: {
        success: boolean | null
        action: Database["public"]["Enums"]["follow_action"] | null
      }
      toggle_job_status_result: {
        success: boolean | null
        job_id: string | null
        old_status: Database["public"]["Enums"]["job_status"] | null
        new_status: Database["public"]["Enums"]["job_status"] | null
        message: string | null
      }
      toggle_review_helpful_result: {
        success: boolean | null
        helpful: boolean | null
        content_type: Database["public"]["Enums"]["content_category"] | null
        content_slug: string | null
      }
      track_user_interaction_result: {
        success: boolean | null
        error: string | null
      }
      unlink_oauth_provider_result: {
        success: boolean | null
        message: string | null
        provider: Database["public"]["Enums"]["oauth_provider"] | null
        remaining_providers: number | null
        error: string | null
      }
      update_job_result: {
        success: boolean | null
        job_id: string | null
        message: string | null
      }
      update_user_profile_result: {
        success: boolean | null
        profile:
          | Database["public"]["CompositeTypes"]["update_user_profile_result_profile"]
          | null
      }
      update_user_profile_result_profile: {
        slug: string | null
        display_name: string | null
        bio: string | null
        work: string | null
        website: string | null
        social_x_link: string | null
        interests: string[] | null
        profile_public: boolean | null
        follow_email: boolean | null
      }
      user_activity_summary: {
        total_posts: number | null
        total_comments: number | null
        total_votes: number | null
        total_submissions: number | null
        merged_submissions: number | null
        total_activity: number | null
      }
      user_activity_timeline_item: {
        id: string | null
        type: string | null
        title: string | null
        body: string | null
        vote_type: string | null
        content_type: string | null
        content_slug: string | null
        post_id: string | null
        parent_id: string | null
        submission_url: string | null
        description: string | null
        status: string | null
        user_id: string | null
        created_at: string | null
        updated_at: string | null
      }
      user_activity_timeline_result: {
        activities:
          | Database["public"]["CompositeTypes"]["user_activity_timeline_item"][]
          | null
        has_more: boolean | null
        total: number | null
      }
      user_collection_detail_collection: {
        id: string | null
        user_id: string | null
        slug: string | null
        name: string | null
        description: string | null
        is_public: boolean | null
        item_count: number | null
        view_count: number | null
        created_at: string | null
        updated_at: string | null
      }
      user_collection_detail_item: {
        id: string | null
        collection_id: string | null
        content_type: string | null
        content_slug: string | null
        notes: string | null
        order: number | null
        added_at: string | null
      }
      user_collection_detail_result: {
        user:
          | Database["public"]["CompositeTypes"]["user_collection_detail_user"]
          | null
        collection:
          | Database["public"]["CompositeTypes"]["user_collection_detail_collection"]
          | null
        items:
          | Database["public"]["CompositeTypes"]["user_collection_detail_item"][]
          | null
        is_owner: boolean | null
      }
      user_collection_detail_user: {
        id: string | null
        slug: string | null
        name: string | null
        image: string | null
        tier: Database["public"]["Enums"]["user_tier"] | null
      }
      user_companies_company: {
        id: string | null
        slug: string | null
        name: string | null
        logo: string | null
        website: string | null
        description: string | null
        size: string | null
        industry: string | null
        using_cursor_since: string | null
        featured: boolean | null
        created_at: string | null
        updated_at: string | null
        stats:
          | Database["public"]["CompositeTypes"]["user_companies_stats"]
          | null
      }
      user_companies_result: {
        companies:
          | Database["public"]["CompositeTypes"]["user_companies_company"][]
          | null
      }
      user_companies_stats: {
        total_jobs: number | null
        active_jobs: number | null
        total_views: number | null
        total_clicks: number | null
        latest_job_posted_at: string | null
      }
      user_dashboard_result: {
        submissions:
          | Database["public"]["CompositeTypes"]["user_dashboard_submission"][]
          | null
        companies: Json | null
        jobs: Json | null
      }
      user_dashboard_submission: {
        id: string | null
        user_id: string | null
        content_type: string | null
        content_slug: string | null
        content_name: string | null
        pr_number: string | null
        pr_url: string | null
        branch_name: string | null
        status: string | null
        submission_data: Json | null
        rejection_reason: string | null
        created_at: string | null
        updated_at: string | null
        merged_at: string | null
      }
      user_identities_identity: {
        provider: string | null
        email: string | null
        created_at: string | null
        last_sign_in_at: string | null
      }
      user_identities_result: {
        identities:
          | Database["public"]["CompositeTypes"]["user_identities_identity"][]
          | null
      }
      user_interaction_input: {
        user_id: string | null
        content_type: Database["public"]["Enums"]["content_category"] | null
        content_slug: string | null
        interaction_type: Database["public"]["Enums"]["interaction_type"] | null
        session_id: string | null
        metadata: Json | null
      }
      user_interaction_summary: {
        total_interactions: number | null
        views: number | null
        copies: number | null
        bookmarks: number | null
        unique_content_items: number | null
      }
      user_library_bookmark: {
        id: string | null
        user_id: string | null
        content_type: string | null
        content_slug: string | null
        notes: string | null
        created_at: string | null
        updated_at: string | null
      }
      user_library_collection: {
        id: string | null
        user_id: string | null
        slug: string | null
        name: string | null
        description: string | null
        is_public: boolean | null
        item_count: number | null
        view_count: number | null
        created_at: string | null
        updated_at: string | null
      }
      user_library_result: {
        bookmarks:
          | Database["public"]["CompositeTypes"]["user_library_bookmark"][]
          | null
        collections:
          | Database["public"]["CompositeTypes"]["user_library_collection"][]
          | null
        stats: Database["public"]["CompositeTypes"]["user_library_stats"] | null
      }
      user_library_stats: {
        bookmark_count: number | null
        collection_count: number | null
        total_collection_items: number | null
        total_collection_views: number | null
      }
      user_profile_collection: {
        id: string | null
        slug: string | null
        name: string | null
        description: string | null
        is_public: boolean | null
        item_count: number | null
        view_count: number | null
        created_at: string | null
      }
      user_profile_company: {
        name: string | null
        logo: string | null
      }
      user_profile_contribution: {
        id: string | null
        content_type: string | null
        slug: string | null
        name: string | null
        description: string | null
        featured: boolean | null
        view_count: number | null
        download_count: number | null
        created_at: string | null
      }
      user_profile_profile: {
        id: string | null
        slug: string | null
        name: string | null
        image: string | null
        bio: string | null
        website: string | null
        tier: Database["public"]["Enums"]["user_tier"] | null
        created_at: string | null
        company:
          | Database["public"]["CompositeTypes"]["user_profile_company"]
          | null
      }
      user_profile_result: {
        profile:
          | Database["public"]["CompositeTypes"]["user_profile_profile"]
          | null
        stats: Database["public"]["CompositeTypes"]["user_profile_stats"] | null
        collections:
          | Database["public"]["CompositeTypes"]["user_profile_collection"][]
          | null
        contributions:
          | Database["public"]["CompositeTypes"]["user_profile_contribution"][]
          | null
        is_following: boolean | null
        is_owner: boolean | null
      }
      user_profile_stats: {
        follower_count: number | null
        following_count: number | null
        collections_count: number | null
        contributions_count: number | null
      }
      user_settings_profile: {
        display_name: string | null
        bio: string | null
        work: string | null
        website: string | null
        social_x_link: string | null
        interests: string[] | null
        profile_public: boolean | null
        follow_email: boolean | null
        created_at: string | null
      }
      user_settings_result: {
        profile:
          | Database["public"]["CompositeTypes"]["user_settings_profile"]
          | null
        user_data:
          | Database["public"]["CompositeTypes"]["user_settings_user_data"]
          | null
      }
      user_settings_user_data: {
        slug: string | null
        name: string | null
        image: string | null
        tier: Database["public"]["Enums"]["user_tier"] | null
      }
      weekly_digest_new_content: {
        category: string | null
        slug: string | null
        title: string | null
        description: string | null
        date_added: string | null
        url: string | null
      }
      weekly_digest_result: {
        week_of: string | null
        week_start: string | null
        week_end: string | null
        new_content:
          | Database["public"]["CompositeTypes"]["weekly_digest_new_content"][]
          | null
        trending_content:
          | Database["public"]["CompositeTypes"]["weekly_digest_trending_content"][]
          | null
      }
      weekly_digest_trending_content: {
        category: string | null
        slug: string | null
        title: string | null
        description: string | null
        url: string | null
        view_count: number | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      announcement_priority: ["high", "medium", "low"],
      announcement_variant: ["default", "outline", "secondary", "destructive"],
      changelog_category: [
        "Added",
        "Changed",
        "Deprecated",
        "Removed",
        "Fixed",
        "Security",
      ],
      company_size: ["just_me", "2-10", "11-50", "51-200", "201-500", "500+"],
      confetti_variant: ["success", "celebration", "milestone", "subtle"],
      config_format: ["json", "multi", "hook"],
      contact_action_type: [
        "internal",
        "external",
        "route",
        "sheet",
        "easter-egg",
      ],
      contact_category: ["bug", "feature", "partnership", "general", "other"],
      content_category: [
        "agents",
        "mcp",
        "rules",
        "commands",
        "hooks",
        "statuslines",
        "skills",
        "collections",
        "guides",
        "jobs",
        "changelog",
      ],
      content_field_type: [
        "installation",
        "use_cases",
        "troubleshooting",
        "requirements",
      ],
      copy_type: ["llmstxt", "markdown", "code", "link"],
      crud_action: ["create", "update", "delete", "add_item", "remove_item"],
      email_blocklist_reason: [
        "spam_complaint",
        "hard_bounce",
        "repeated_soft_bounce",
        "manual",
      ],
      environment: ["development", "preview", "production"],
      experience_level: ["beginner", "intermediate", "advanced"],
      field_scope: ["common", "type_specific", "tags"],
      field_type: ["text", "textarea", "number", "select"],
      focus_area_type: [
        "security",
        "performance",
        "documentation",
        "testing",
        "code-quality",
        "automation",
      ],
      follow_action: ["follow", "unfollow"],
      form_field_type: ["text", "textarea", "number", "select"],
      form_grid_column: ["full", "half", "third", "two-thirds"],
      form_icon_position: ["left", "right"],
      generation_source: ["ai", "manual", "import", "migration"],
      grid_column: ["full", "half", "third", "two-thirds"],
      guide_subcategory: [
        "tutorials",
        "comparisons",
        "workflows",
        "use-cases",
        "troubleshooting",
      ],
      icon_position: ["left", "right"],
      integration_type: [
        "github",
        "database",
        "cloud-aws",
        "cloud-gcp",
        "cloud-azure",
        "communication",
        "none",
      ],
      interaction_type: [
        "view",
        "copy",
        "bookmark",
        "click",
        "time_spent",
        "search",
        "filter",
        "screenshot",
        "share",
        "download",
        "pwa_installed",
        "pwa_launched",
        "newsletter_subscribe",
        "contact_interact",
        "contact_submit",
        "form_started",
        "form_step_completed",
        "form_field_focused",
        "form_template_selected",
        "form_abandoned",
        "form_submitted",
        "sponsored_impression",
        "sponsored_click",
      ],
      job_category: [
        "engineering",
        "design",
        "product",
        "marketing",
        "sales",
        "support",
        "research",
        "data",
        "operations",
        "leadership",
        "consulting",
        "education",
        "other",
      ],
      job_plan: ["one-time", "subscription"],
      job_status: [
        "draft",
        "pending_payment",
        "pending_review",
        "active",
        "expired",
        "rejected",
        "deleted",
      ],
      job_tier: ["standard", "featured"],
      job_type: [
        "full-time",
        "part-time",
        "contract",
        "freelance",
        "internship",
      ],
      newsletter_source: [
        "footer",
        "homepage",
        "modal",
        "content_page",
        "inline",
        "post_copy",
        "resend_import",
        "oauth_signup",
      ],
      newsletter_sync_status: ["pending", "synced", "failed", "skipped"],
      notification_priority: ["high", "medium", "low"],
      notification_type: ["announcement", "feedback"],
      oauth_provider: ["discord", "github", "google"],
      payment_method: ["polar", "mercury_invoice", "manual"],
      payment_status: ["unpaid", "paid", "refunded"],
      primary_action_type: [
        "notification",
        "copy_command",
        "copy_script",
        "scroll",
        "download",
        "github_link",
      ],
      route_group: ["primary", "secondary", "actions"],
      setting_type: ["boolean", "string", "number", "json"],
      sort_direction: ["asc", "desc"],
      sort_option: [
        "relevance",
        "date",
        "popularity",
        "name",
        "updated",
        "created",
        "views",
        "trending",
      ],
      sponsorship_tier: ["featured", "promoted", "spotlight", "sponsored"],
      submission_status: ["pending", "approved", "rejected", "spam", "merged"],
      submission_type: [
        "agents",
        "mcp",
        "rules",
        "commands",
        "hooks",
        "statuslines",
        "skills",
      ],
      trending_metric: ["views", "likes", "shares", "downloads", "all"],
      trending_period: ["today", "week", "month", "year", "all"],
      use_case_type: [
        "code-review",
        "api-development",
        "frontend-development",
        "data-science",
        "content-creation",
        "devops-infrastructure",
        "general-development",
        "testing-qa",
        "security-audit",
      ],
      user_tier: ["free", "pro", "enterprise"],
      webhook_direction: ["inbound", "outbound"],
      webhook_source: [
        "resend",
        "vercel",
        "discord",
        "supabase_db",
        "custom",
        "polar",
      ],
      workplace_type: ["Remote", "On site", "Hybrid"],
    },
  },
} as const
