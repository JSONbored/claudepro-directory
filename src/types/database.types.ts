export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      analytics_event_categories: {
        Row: {
          active: boolean;
          created_at: string;
          description: string;
          display_order: number;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description: string;
          display_order: number;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string;
          display_order?: number;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          category: string;
          created_at: string;
          debug_only: boolean;
          description: string;
          enabled: boolean;
          event_name: string;
          id: string;
          payload_schema: Json | null;
          sample_rate: number | null;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          debug_only?: boolean;
          description: string;
          enabled?: boolean;
          event_name: string;
          id?: string;
          payload_schema?: Json | null;
          sample_rate?: number | null;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          debug_only?: boolean;
          description?: string;
          enabled?: boolean;
          event_name?: string;
          id?: string;
          payload_schema?: Json | null;
          sample_rate?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_events_category_fkey';
            columns: ['category'];
            isOneToOne: false;
            referencedRelation: 'analytics_event_categories';
            referencedColumns: ['name'];
          },
        ];
      };
      announcement_dismissals: {
        Row: {
          announcement_id: string;
          created_at: string;
          dismissed_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          announcement_id: string;
          created_at?: string;
          dismissed_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          announcement_id?: string;
          created_at?: string;
          dismissed_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'announcement_dismissals_announcement_id_fkey';
            columns: ['announcement_id'];
            isOneToOne: false;
            referencedRelation: 'announcements';
            referencedColumns: ['id'];
          },
        ];
      };
      announcements: {
        Row: {
          active: boolean;
          created_at: string;
          dismissible: boolean;
          end_date: string | null;
          href: string | null;
          icon: string | null;
          id: string;
          priority: Database['public']['Enums']['announcement_priority'];
          start_date: string | null;
          tag: string | null;
          title: string;
          updated_at: string;
          variant: Database['public']['Enums']['announcement_variant'];
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          dismissible?: boolean;
          end_date?: string | null;
          href?: string | null;
          icon?: string | null;
          id: string;
          priority?: Database['public']['Enums']['announcement_priority'];
          start_date?: string | null;
          tag?: string | null;
          title: string;
          updated_at?: string;
          variant?: Database['public']['Enums']['announcement_variant'];
        };
        Update: {
          active?: boolean;
          created_at?: string;
          dismissible?: boolean;
          end_date?: string | null;
          href?: string | null;
          icon?: string | null;
          id?: string;
          priority?: Database['public']['Enums']['announcement_priority'];
          start_date?: string | null;
          tag?: string | null;
          title?: string;
          updated_at?: string;
          variant?: Database['public']['Enums']['announcement_variant'];
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          category: string;
          created_at: string;
          description: string;
          enabled: boolean;
          environment: string;
          previous_value: Json | null;
          setting_key: string;
          setting_type: string;
          setting_value: Json;
          updated_at: string;
          version: number;
        };
        Insert: {
          category: string;
          created_at?: string;
          description: string;
          enabled?: boolean;
          environment: string;
          previous_value?: Json | null;
          setting_key: string;
          setting_type: string;
          setting_value?: Json;
          updated_at?: string;
          version?: number;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string;
          enabled?: boolean;
          environment?: string;
          previous_value?: Json | null;
          setting_key?: string;
          setting_type?: string;
          setting_value?: Json;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      bookmarks: {
        Row: {
          content_slug: string;
          content_type: string;
          created_at: string;
          id: string;
          notes: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content_slug: string;
          content_type: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content_slug?: string;
          content_type?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookmarks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      category_configs: {
        Row: {
          api_schema: Json | null;
          badges: Json | null;
          category: Database['public']['Enums']['content_category'];
          color_scheme: string;
          config_format: string | null;
          content_loader: string;
          created_at: string;
          description: string;
          display_config: boolean;
          empty_state_message: string | null;
          generation_config: Json | null;
          icon_name: string;
          keywords: string;
          meta_description: string;
          metadata_fields: string[] | null;
          plural_title: string;
          primary_action_config: Json | null;
          primary_action_label: string;
          primary_action_type: string;
          schema_name: string | null;
          search_placeholder: string;
          sections: Json;
          show_on_homepage: boolean;
          title: string;
          updated_at: string;
          url_slug: string;
          validation_config: Json | null;
        };
        Insert: {
          api_schema?: Json | null;
          badges?: Json | null;
          category: Database['public']['Enums']['content_category'];
          color_scheme: string;
          config_format?: string | null;
          content_loader: string;
          created_at?: string;
          description: string;
          display_config?: boolean;
          empty_state_message?: string | null;
          generation_config?: Json | null;
          icon_name: string;
          keywords: string;
          meta_description: string;
          metadata_fields?: string[] | null;
          plural_title: string;
          primary_action_config?: Json | null;
          primary_action_label: string;
          primary_action_type: string;
          schema_name?: string | null;
          search_placeholder: string;
          sections?: Json;
          show_on_homepage?: boolean;
          title: string;
          updated_at?: string;
          url_slug: string;
          validation_config?: Json | null;
        };
        Update: {
          api_schema?: Json | null;
          badges?: Json | null;
          category?: Database['public']['Enums']['content_category'];
          color_scheme?: string;
          config_format?: string | null;
          content_loader?: string;
          created_at?: string;
          description?: string;
          display_config?: boolean;
          empty_state_message?: string | null;
          generation_config?: Json | null;
          icon_name?: string;
          keywords?: string;
          meta_description?: string;
          metadata_fields?: string[] | null;
          plural_title?: string;
          primary_action_config?: Json | null;
          primary_action_label?: string;
          primary_action_type?: string;
          schema_name?: string | null;
          search_placeholder?: string;
          sections?: Json;
          show_on_homepage?: boolean;
          title?: string;
          updated_at?: string;
          url_slug?: string;
          validation_config?: Json | null;
        };
        Relationships: [];
      };
      changelog: {
        Row: {
          category: string;
          commit_count: number | null;
          contributors: string[] | null;
          created_at: string;
          date_added: string;
          date_published: string | null;
          date_updated: string | null;
          description: string;
          featured: boolean | null;
          git_commit_sha: string | null;
          git_hash: string | null;
          git_tag: string | null;
          id: string;
          sections: Json;
          slug: string;
          source: string | null;
          synced_at: string | null;
          tags: string[];
          title: string;
          updated_at: string;
          version: string | null;
        };
        Insert: {
          category?: string;
          commit_count?: number | null;
          contributors?: string[] | null;
          created_at?: string;
          date_added: string;
          date_published?: string | null;
          date_updated?: string | null;
          description: string;
          featured?: boolean | null;
          git_commit_sha?: string | null;
          git_hash?: string | null;
          git_tag?: string | null;
          id?: string;
          sections: Json;
          slug: string;
          source?: string | null;
          synced_at?: string | null;
          tags: string[];
          title: string;
          updated_at?: string;
          version?: string | null;
        };
        Update: {
          category?: string;
          commit_count?: number | null;
          contributors?: string[] | null;
          created_at?: string;
          date_added?: string;
          date_published?: string | null;
          date_updated?: string | null;
          description?: string;
          featured?: boolean | null;
          git_commit_sha?: string | null;
          git_hash?: string | null;
          git_tag?: string | null;
          id?: string;
          sections?: Json;
          slug?: string;
          source?: string | null;
          synced_at?: string | null;
          tags?: string[];
          title?: string;
          updated_at?: string;
          version?: string | null;
        };
        Relationships: [];
      };
      changelog_changes: {
        Row: {
          category: string;
          change_text: string;
          changelog_entry_id: string;
          created_at: string | null;
          display_order: number;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          change_text: string;
          changelog_entry_id: string;
          created_at?: string | null;
          display_order?: number;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          change_text?: string;
          changelog_entry_id?: string;
          created_at?: string | null;
          display_order?: number;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'changelog_changes_changelog_entry_id_fkey';
            columns: ['changelog_entry_id'];
            isOneToOne: false;
            referencedRelation: 'changelog_entries';
            referencedColumns: ['id'];
          },
        ];
      };
      changelog_entries: {
        Row: {
          canonical_url: string | null;
          changes: Json;
          content: string;
          created_at: string;
          description: string | null;
          featured: boolean;
          id: string;
          json_ld: Json | null;
          keywords: string[] | null;
          og_image: string | null;
          og_type: string | null;
          published: boolean;
          raw_content: string;
          release_date: string;
          robots_follow: boolean | null;
          robots_index: boolean | null;
          slug: string;
          title: string;
          tldr: string | null;
          twitter_card: string | null;
          updated_at: string;
        };
        Insert: {
          canonical_url?: string | null;
          changes?: Json;
          content: string;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          id?: string;
          json_ld?: Json | null;
          keywords?: string[] | null;
          og_image?: string | null;
          og_type?: string | null;
          published?: boolean;
          raw_content: string;
          release_date: string;
          robots_follow?: boolean | null;
          robots_index?: boolean | null;
          slug: string;
          title: string;
          tldr?: string | null;
          twitter_card?: string | null;
          updated_at?: string;
        };
        Update: {
          canonical_url?: string | null;
          changes?: Json;
          content?: string;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          id?: string;
          json_ld?: Json | null;
          keywords?: string[] | null;
          og_image?: string | null;
          og_type?: string | null;
          published?: boolean;
          raw_content?: string;
          release_date?: string;
          robots_follow?: boolean | null;
          robots_index?: boolean | null;
          slug?: string;
          title?: string;
          tldr?: string | null;
          twitter_card?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      collection_items: {
        Row: {
          added_at: string;
          collection_id: string;
          content_slug: string;
          content_type: string;
          created_at: string;
          id: string;
          notes: string | null;
          order: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          added_at?: string;
          collection_id: string;
          content_slug: string;
          content_type: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          order?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          added_at?: string;
          collection_id?: string;
          content_slug?: string;
          content_type?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          order?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_items_collection_id_fkey';
            columns: ['collection_id'];
            isOneToOne: false;
            referencedRelation: 'user_collections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'collection_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      companies: {
        Row: {
          created_at: string;
          description: string | null;
          featured: boolean | null;
          id: string;
          industry: string | null;
          logo: string | null;
          name: string;
          owner_id: string | null;
          search_vector: unknown;
          size: string | null;
          slug: string;
          updated_at: string;
          using_cursor_since: string | null;
          website: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          featured?: boolean | null;
          id?: string;
          industry?: string | null;
          logo?: string | null;
          name: string;
          owner_id?: string | null;
          search_vector?: unknown;
          size?: string | null;
          slug: string;
          updated_at?: string;
          using_cursor_since?: string | null;
          website?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          featured?: boolean | null;
          id?: string;
          industry?: string | null;
          logo?: string | null;
          name?: string;
          owner_id?: string | null;
          search_vector?: unknown;
          size?: string | null;
          slug?: string;
          updated_at?: string;
          using_cursor_since?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'companies_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      content: {
        Row: {
          author: string;
          author_profile_url: string | null;
          avg_rating: number | null;
          bookmark_count: number;
          category: string;
          content: string | null;
          copy_count: number;
          created_at: string;
          date_added: string;
          description: string;
          difficulty_score: number | null;
          display_title: string | null;
          documentation_url: string | null;
          download_url: string | null;
          examples: Json | null;
          features: string[] | null;
          fts_vector: unknown;
          git_hash: string | null;
          has_breaking_changes: boolean | null;
          has_prerequisites: boolean | null;
          has_troubleshooting: boolean | null;
          id: string;
          json_ld: Json | null;
          metadata: Json;
          og_type: string | null;
          popularity_score: number | null;
          reading_time: number | null;
          review_count: number;
          robots_follow: boolean | null;
          robots_index: boolean | null;
          seo_title: string | null;
          slug: string;
          source: string | null;
          storage_url: string | null;
          synced_at: string | null;
          tags: string[];
          title: string | null;
          twitter_card: string | null;
          updated_at: string;
          use_cases: string[] | null;
          view_count: number;
        };
        Insert: {
          author: string;
          author_profile_url?: string | null;
          avg_rating?: number | null;
          bookmark_count?: number;
          category: string;
          content?: string | null;
          copy_count?: number;
          created_at?: string;
          date_added: string;
          description: string;
          difficulty_score?: number | null;
          display_title?: string | null;
          documentation_url?: string | null;
          download_url?: string | null;
          examples?: Json | null;
          features?: string[] | null;
          fts_vector?: unknown;
          git_hash?: string | null;
          has_breaking_changes?: boolean | null;
          has_prerequisites?: boolean | null;
          has_troubleshooting?: boolean | null;
          id?: string;
          json_ld?: Json | null;
          metadata?: Json;
          og_type?: string | null;
          popularity_score?: number | null;
          reading_time?: number | null;
          review_count?: number;
          robots_follow?: boolean | null;
          robots_index?: boolean | null;
          seo_title?: string | null;
          slug: string;
          source?: string | null;
          storage_url?: string | null;
          synced_at?: string | null;
          tags: string[];
          title?: string | null;
          twitter_card?: string | null;
          updated_at?: string;
          use_cases?: string[] | null;
          view_count?: number;
        };
        Update: {
          author?: string;
          author_profile_url?: string | null;
          avg_rating?: number | null;
          bookmark_count?: number;
          category?: string;
          content?: string | null;
          copy_count?: number;
          created_at?: string;
          date_added?: string;
          description?: string;
          difficulty_score?: number | null;
          display_title?: string | null;
          documentation_url?: string | null;
          download_url?: string | null;
          examples?: Json | null;
          features?: string[] | null;
          fts_vector?: unknown;
          git_hash?: string | null;
          has_breaking_changes?: boolean | null;
          has_prerequisites?: boolean | null;
          has_troubleshooting?: boolean | null;
          id?: string;
          json_ld?: Json | null;
          metadata?: Json;
          og_type?: string | null;
          popularity_score?: number | null;
          reading_time?: number | null;
          review_count?: number;
          robots_follow?: boolean | null;
          robots_index?: boolean | null;
          seo_title?: string | null;
          slug?: string;
          source?: string | null;
          storage_url?: string | null;
          synced_at?: string | null;
          tags?: string[];
          title?: string | null;
          twitter_card?: string | null;
          updated_at?: string;
          use_cases?: string[] | null;
          view_count?: number;
        };
        Relationships: [];
      };
      content_generation_tracking: {
        Row: {
          category: string;
          discovery_metadata: Json | null;
          generated_at: string;
          generated_by: string;
          generation_model: string | null;
          generation_trigger: string | null;
          github_pr_url: string | null;
          id: string;
          quality_score: number | null;
          slug: string;
          updated_at: string;
          validation_errors: string[] | null;
          validation_passed: boolean;
        };
        Insert: {
          category: string;
          discovery_metadata?: Json | null;
          generated_at?: string;
          generated_by: string;
          generation_model?: string | null;
          generation_trigger?: string | null;
          github_pr_url?: string | null;
          id?: string;
          quality_score?: number | null;
          slug: string;
          updated_at?: string;
          validation_errors?: string[] | null;
          validation_passed?: boolean;
        };
        Update: {
          category?: string;
          discovery_metadata?: Json | null;
          generated_at?: string;
          generated_by?: string;
          generation_model?: string | null;
          generation_trigger?: string | null;
          github_pr_url?: string | null;
          id?: string;
          quality_score?: number | null;
          slug?: string;
          updated_at?: string;
          validation_errors?: string[] | null;
          validation_passed?: boolean;
        };
        Relationships: [];
      };
      content_similarities: {
        Row: {
          calculated_at: string;
          content_a_slug: string;
          content_a_type: string;
          content_b_slug: string;
          content_b_type: string;
          id: string;
          similarity_factors: Json | null;
          similarity_score: number;
        };
        Insert: {
          calculated_at?: string;
          content_a_slug: string;
          content_a_type: string;
          content_b_slug: string;
          content_b_type: string;
          id?: string;
          similarity_factors?: Json | null;
          similarity_score: number;
        };
        Update: {
          calculated_at?: string;
          content_a_slug?: string;
          content_a_type?: string;
          content_b_slug?: string;
          content_b_type?: string;
          id?: string;
          similarity_factors?: Json | null;
          similarity_score?: number;
        };
        Relationships: [];
      };
      content_submissions: {
        Row: {
          approved_slug: string | null;
          author: string;
          author_profile_url: string | null;
          category: string;
          content_data: Json;
          created_at: string;
          description: string;
          github_pr_url: string | null;
          github_url: string | null;
          id: string;
          merged_at: string | null;
          moderated_at: string | null;
          moderated_by: string | null;
          moderator_notes: string | null;
          name: string;
          spam_reasons: string[] | null;
          spam_score: number | null;
          status: Database['public']['Enums']['submission_status'];
          submission_type: Database['public']['Enums']['submission_type'];
          submitter_email: string | null;
          submitter_id: string | null;
          submitter_ip: unknown;
          tags: string[] | null;
          updated_at: string;
          webhook_announcement_sent_at: string | null;
          webhook_notification_sent_at: string | null;
        };
        Insert: {
          approved_slug?: string | null;
          author: string;
          author_profile_url?: string | null;
          category: string;
          content_data?: Json;
          created_at?: string;
          description: string;
          github_pr_url?: string | null;
          github_url?: string | null;
          id?: string;
          merged_at?: string | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderator_notes?: string | null;
          name: string;
          spam_reasons?: string[] | null;
          spam_score?: number | null;
          status?: Database['public']['Enums']['submission_status'];
          submission_type: Database['public']['Enums']['submission_type'];
          submitter_email?: string | null;
          submitter_id?: string | null;
          submitter_ip?: unknown;
          tags?: string[] | null;
          updated_at?: string;
          webhook_announcement_sent_at?: string | null;
          webhook_notification_sent_at?: string | null;
        };
        Update: {
          approved_slug?: string | null;
          author?: string;
          author_profile_url?: string | null;
          category?: string;
          content_data?: Json;
          created_at?: string;
          description?: string;
          github_pr_url?: string | null;
          github_url?: string | null;
          id?: string;
          merged_at?: string | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderator_notes?: string | null;
          name?: string;
          spam_reasons?: string[] | null;
          spam_score?: number | null;
          status?: Database['public']['Enums']['submission_status'];
          submission_type?: Database['public']['Enums']['submission_type'];
          submitter_email?: string | null;
          submitter_id?: string | null;
          submitter_ip?: unknown;
          tags?: string[] | null;
          updated_at?: string;
          webhook_announcement_sent_at?: string | null;
          webhook_notification_sent_at?: string | null;
        };
        Relationships: [];
      };
      content_templates: {
        Row: {
          active: boolean;
          category: Database['public']['Enums']['content_category'];
          created_at: string;
          description: string;
          display_order: number;
          id: string;
          is_featured: boolean;
          name: string;
          template_data: Json;
          updated_at: string;
          usage_count: number;
        };
        Insert: {
          active?: boolean;
          category: Database['public']['Enums']['content_category'];
          created_at?: string;
          description: string;
          display_order?: number;
          id?: string;
          is_featured?: boolean;
          name: string;
          template_data: Json;
          updated_at?: string;
          usage_count?: number;
        };
        Update: {
          active?: boolean;
          category?: Database['public']['Enums']['content_category'];
          created_at?: string;
          description?: string;
          display_order?: number;
          id?: string;
          is_featured?: boolean;
          name?: string;
          template_data?: Json;
          updated_at?: string;
          usage_count?: number;
        };
        Relationships: [];
      };
      email_blocklist: {
        Row: {
          created_at: string;
          email: string;
          notes: string | null;
          reason: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          notes?: string | null;
          reason: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          notes?: string | null;
          reason?: string;
        };
        Relationships: [];
      };
      email_sequence_schedule: {
        Row: {
          created_at: string;
          due_at: string;
          email: string;
          id: string;
          processed: boolean;
          processed_at: string | null;
          sequence_id: string;
          step: number;
        };
        Insert: {
          created_at?: string;
          due_at: string;
          email: string;
          id?: string;
          processed?: boolean;
          processed_at?: string | null;
          sequence_id: string;
          step: number;
        };
        Update: {
          created_at?: string;
          due_at?: string;
          email?: string;
          id?: string;
          processed?: boolean;
          processed_at?: string | null;
          sequence_id?: string;
          step?: number;
        };
        Relationships: [];
      };
      email_sequences: {
        Row: {
          created_at: string;
          current_step: number;
          email: string;
          id: string;
          last_sent_at: string | null;
          sequence_id: string;
          started_at: string;
          status: string;
          total_steps: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          current_step: number;
          email: string;
          id?: string;
          last_sent_at?: string | null;
          sequence_id: string;
          started_at?: string;
          status?: string;
          total_steps?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          current_step?: number;
          email?: string;
          id?: string;
          last_sent_at?: string | null;
          sequence_id?: string;
          started_at?: string;
          status?: string;
          total_steps?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      featured_configs: {
        Row: {
          calculated_at: string;
          calculation_metadata: Json | null;
          content_slug: string;
          content_type: string;
          created_at: string;
          engagement_score: number | null;
          final_score: number;
          freshness_score: number | null;
          id: string;
          rank: number;
          rating_score: number | null;
          trending_score: number | null;
          updated_at: string;
          week_end: string;
          week_start: string;
        };
        Insert: {
          calculated_at?: string;
          calculation_metadata?: Json | null;
          content_slug: string;
          content_type: string;
          created_at?: string;
          engagement_score?: number | null;
          final_score: number;
          freshness_score?: number | null;
          id?: string;
          rank: number;
          rating_score?: number | null;
          trending_score?: number | null;
          updated_at?: string;
          week_end: string;
          week_start: string;
        };
        Update: {
          calculated_at?: string;
          calculation_metadata?: Json | null;
          content_slug?: string;
          content_type?: string;
          created_at?: string;
          engagement_score?: number | null;
          final_score?: number;
          freshness_score?: number | null;
          id?: string;
          rank?: number;
          rating_score?: number | null;
          trending_score?: number | null;
          updated_at?: string;
          week_end?: string;
          week_start?: string;
        };
        Relationships: [];
      };
      followers: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
          id?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'followers_follower_id_fkey';
            columns: ['follower_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'followers_following_id_fkey';
            columns: ['following_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      form_field_configs: {
        Row: {
          config: Json | null;
          created_at: string;
          default_value: string | null;
          display_order: number;
          enabled: boolean;
          field_group: string;
          field_label: string;
          field_name: string;
          field_type: Database['public']['Enums']['form_field_type'];
          form_type: string;
          grid_column: Database['public']['Enums']['form_grid_column'];
          help_text: string | null;
          icon_name: string | null;
          icon_position: Database['public']['Enums']['form_icon_position'] | null;
          id: string;
          placeholder: string | null;
          required: boolean;
          updated_at: string;
        };
        Insert: {
          config?: Json | null;
          created_at?: string;
          default_value?: string | null;
          display_order?: number;
          enabled?: boolean;
          field_group?: string;
          field_label: string;
          field_name: string;
          field_type: Database['public']['Enums']['form_field_type'];
          form_type: string;
          grid_column?: Database['public']['Enums']['form_grid_column'];
          help_text?: string | null;
          icon_name?: string | null;
          icon_position?: Database['public']['Enums']['form_icon_position'] | null;
          id?: string;
          placeholder?: string | null;
          required?: boolean;
          updated_at?: string;
        };
        Update: {
          config?: Json | null;
          created_at?: string;
          default_value?: string | null;
          display_order?: number;
          enabled?: boolean;
          field_group?: string;
          field_label?: string;
          field_name?: string;
          field_type?: Database['public']['Enums']['form_field_type'];
          form_type?: string;
          grid_column?: Database['public']['Enums']['form_grid_column'];
          help_text?: string | null;
          icon_name?: string | null;
          icon_position?: Database['public']['Enums']['form_icon_position'] | null;
          id?: string;
          placeholder?: string | null;
          required?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      form_field_definitions: {
        Row: {
          active: boolean | null;
          content_type: Database['public']['Enums']['content_category'] | null;
          created_at: string;
          created_by: string | null;
          field_name: string;
          field_order: number;
          field_properties: Json | null;
          field_scope: Database['public']['Enums']['field_scope'];
          field_type: Database['public']['Enums']['field_type'];
          grid_column: Database['public']['Enums']['grid_column'] | null;
          help_text: string | null;
          icon: string | null;
          icon_position: Database['public']['Enums']['icon_position'] | null;
          id: string;
          label: string;
          placeholder: string | null;
          required: boolean | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean | null;
          content_type?: Database['public']['Enums']['content_category'] | null;
          created_at?: string;
          created_by?: string | null;
          field_name: string;
          field_order: number;
          field_properties?: Json | null;
          field_scope?: Database['public']['Enums']['field_scope'];
          field_type: Database['public']['Enums']['field_type'];
          grid_column?: Database['public']['Enums']['grid_column'] | null;
          help_text?: string | null;
          icon?: string | null;
          icon_position?: Database['public']['Enums']['icon_position'] | null;
          id?: string;
          label: string;
          placeholder?: string | null;
          required?: boolean | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean | null;
          content_type?: Database['public']['Enums']['content_category'] | null;
          created_at?: string;
          created_by?: string | null;
          field_name?: string;
          field_order?: number;
          field_properties?: Json | null;
          field_scope?: Database['public']['Enums']['field_scope'];
          field_type?: Database['public']['Enums']['field_type'];
          grid_column?: Database['public']['Enums']['grid_column'] | null;
          help_text?: string | null;
          icon?: string | null;
          icon_position?: Database['public']['Enums']['icon_position'] | null;
          id?: string;
          label?: string;
          placeholder?: string | null;
          required?: boolean | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      form_field_versions: {
        Row: {
          change_summary: string | null;
          changed_at: string;
          changed_by: string | null;
          field_data: Json;
          field_id: string;
          id: string;
          version_number: number;
        };
        Insert: {
          change_summary?: string | null;
          changed_at?: string;
          changed_by?: string | null;
          field_data: Json;
          field_id: string;
          id?: string;
          version_number: number;
        };
        Update: {
          change_summary?: string | null;
          changed_at?: string;
          changed_by?: string | null;
          field_data?: Json;
          field_id?: string;
          id?: string;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'form_field_versions_field_id_fkey';
            columns: ['field_id'];
            isOneToOne: false;
            referencedRelation: 'form_field_definitions';
            referencedColumns: ['id'];
          },
        ];
      };
      form_select_options: {
        Row: {
          active: boolean | null;
          created_at: string;
          field_id: string;
          id: string;
          option_label: string;
          option_order: number;
          option_value: string;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string;
          field_id: string;
          id?: string;
          option_label: string;
          option_order: number;
          option_value: string;
        };
        Update: {
          active?: boolean | null;
          created_at?: string;
          field_id?: string;
          id?: string;
          option_label?: string;
          option_order?: number;
          option_value?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'form_select_options_field_id_fkey';
            columns: ['field_id'];
            isOneToOne: false;
            referencedRelation: 'form_field_definitions';
            referencedColumns: ['id'];
          },
        ];
      };
      jobs: {
        Row: {
          active: boolean | null;
          admin_notes: string | null;
          benefits: Json;
          category: string;
          click_count: number | null;
          company: string;
          company_id: string | null;
          company_logo: string | null;
          contact_email: string | null;
          created_at: string;
          description: string;
          experience: string | null;
          expires_at: string | null;
          featured: boolean | null;
          id: string;
          link: string;
          location: string | null;
          order: number | null;
          payment_amount: number | null;
          payment_date: string | null;
          payment_method: string | null;
          payment_reference: string | null;
          payment_status: string;
          plan: string;
          posted_at: string | null;
          remote: boolean | null;
          requirements: Json;
          salary: string | null;
          search_vector: unknown;
          slug: string;
          status: Database['public']['Enums']['job_status'];
          tags: Json;
          title: string;
          type: string;
          updated_at: string;
          user_id: string | null;
          view_count: number | null;
          workplace: string | null;
        };
        Insert: {
          active?: boolean | null;
          admin_notes?: string | null;
          benefits?: Json;
          category: string;
          click_count?: number | null;
          company: string;
          company_id?: string | null;
          company_logo?: string | null;
          contact_email?: string | null;
          created_at?: string;
          description: string;
          experience?: string | null;
          expires_at?: string | null;
          featured?: boolean | null;
          id?: string;
          link: string;
          location?: string | null;
          order?: number | null;
          payment_amount?: number | null;
          payment_date?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_status?: string;
          plan?: string;
          posted_at?: string | null;
          remote?: boolean | null;
          requirements?: Json;
          salary?: string | null;
          search_vector?: unknown;
          slug?: string;
          status?: Database['public']['Enums']['job_status'];
          tags?: Json;
          title: string;
          type: string;
          updated_at?: string;
          user_id?: string | null;
          view_count?: number | null;
          workplace?: string | null;
        };
        Update: {
          active?: boolean | null;
          admin_notes?: string | null;
          benefits?: Json;
          category?: string;
          click_count?: number | null;
          company?: string;
          company_id?: string | null;
          company_logo?: string | null;
          contact_email?: string | null;
          created_at?: string;
          description?: string;
          experience?: string | null;
          expires_at?: string | null;
          featured?: boolean | null;
          id?: string;
          link?: string;
          location?: string | null;
          order?: number | null;
          payment_amount?: number | null;
          payment_date?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_status?: string;
          plan?: string;
          posted_at?: string | null;
          remote?: boolean | null;
          requirements?: Json;
          salary?: string | null;
          search_vector?: unknown;
          slug?: string;
          status?: Database['public']['Enums']['job_status'];
          tags?: Json;
          title?: string;
          type?: string;
          updated_at?: string;
          user_id?: string | null;
          view_count?: number | null;
          workplace?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'jobs_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_job_stats';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'jobs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      metadata_templates: {
        Row: {
          active: boolean | null;
          created_at: string;
          default_keywords: string[];
          description_template: string;
          route_pattern: string;
          title_formulas: string[];
          updated_at: string;
          use_current_month_year: boolean | null;
          use_current_year: boolean | null;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string;
          default_keywords: string[];
          description_template: string;
          route_pattern: string;
          title_formulas: string[];
          updated_at?: string;
          use_current_month_year?: boolean | null;
          use_current_year?: boolean | null;
        };
        Update: {
          active?: boolean | null;
          created_at?: string;
          default_keywords?: string[];
          description_template?: string;
          route_pattern?: string;
          title_formulas?: string[];
          updated_at?: string;
          use_current_month_year?: boolean | null;
          use_current_year?: boolean | null;
        };
        Relationships: [];
      };
      newsletter_subscriptions: {
        Row: {
          confirmation_token: string | null;
          confirmed: boolean | null;
          confirmed_at: string | null;
          consent_given: boolean | null;
          copy_category: string | null;
          copy_slug: string | null;
          copy_type: string | null;
          created_at: string | null;
          email: string;
          id: string;
          ip_address: unknown;
          last_email_sent_at: string | null;
          last_sync_at: string | null;
          referrer: string | null;
          resend_contact_id: string | null;
          source: Database['public']['Enums']['newsletter_source'] | null;
          status: string;
          subscribed_at: string | null;
          sync_error: string | null;
          sync_status: string | null;
          unsubscribed_at: string | null;
          updated_at: string | null;
          user_agent: string | null;
        };
        Insert: {
          confirmation_token?: string | null;
          confirmed?: boolean | null;
          confirmed_at?: string | null;
          consent_given?: boolean | null;
          copy_category?: string | null;
          copy_slug?: string | null;
          copy_type?: string | null;
          created_at?: string | null;
          email: string;
          id?: string;
          ip_address?: unknown;
          last_email_sent_at?: string | null;
          last_sync_at?: string | null;
          referrer?: string | null;
          resend_contact_id?: string | null;
          source?: Database['public']['Enums']['newsletter_source'] | null;
          status?: string;
          subscribed_at?: string | null;
          sync_error?: string | null;
          sync_status?: string | null;
          unsubscribed_at?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
        };
        Update: {
          confirmation_token?: string | null;
          confirmed?: boolean | null;
          confirmed_at?: string | null;
          consent_given?: boolean | null;
          copy_category?: string | null;
          copy_slug?: string | null;
          copy_type?: string | null;
          created_at?: string | null;
          email?: string;
          id?: string;
          ip_address?: unknown;
          last_email_sent_at?: string | null;
          last_sync_at?: string | null;
          referrer?: string | null;
          resend_contact_id?: string | null;
          source?: Database['public']['Enums']['newsletter_source'] | null;
          status?: string;
          subscribed_at?: string | null;
          sync_error?: string | null;
          sync_status?: string | null;
          unsubscribed_at?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      notification_dismissals: {
        Row: {
          created_at: string;
          dismissed_at: string;
          notification_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          dismissed_at?: string;
          notification_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          dismissed_at?: string;
          notification_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_dismissals_notification_id_fkey';
            columns: ['notification_id'];
            isOneToOne: false;
            referencedRelation: 'notifications';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          action_href: string | null;
          action_label: string | null;
          action_onclick: string | null;
          active: boolean;
          created_at: string;
          expires_at: string | null;
          icon: string | null;
          id: string;
          message: string;
          priority: Database['public']['Enums']['notification_priority'];
          title: string;
          type: Database['public']['Enums']['notification_type'];
          updated_at: string;
        };
        Insert: {
          action_href?: string | null;
          action_label?: string | null;
          action_onclick?: string | null;
          active?: boolean;
          created_at?: string;
          expires_at?: string | null;
          icon?: string | null;
          id: string;
          message: string;
          priority?: Database['public']['Enums']['notification_priority'];
          title: string;
          type: Database['public']['Enums']['notification_type'];
          updated_at?: string;
        };
        Update: {
          action_href?: string | null;
          action_label?: string | null;
          action_onclick?: string | null;
          active?: boolean;
          created_at?: string;
          expires_at?: string | null;
          icon?: string | null;
          id?: string;
          message?: string;
          priority?: Database['public']['Enums']['notification_priority'];
          title?: string;
          type?: Database['public']['Enums']['notification_type'];
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          id: string;
          metadata: Json | null;
          paid_at: string | null;
          plan: string | null;
          polar_checkout_id: string | null;
          polar_customer_id: string | null;
          polar_transaction_id: string;
          product_id: string | null;
          product_type: string;
          status: string;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          id?: string;
          metadata?: Json | null;
          paid_at?: string | null;
          plan?: string | null;
          polar_checkout_id?: string | null;
          polar_customer_id?: string | null;
          polar_transaction_id: string;
          product_id?: string | null;
          product_type: string;
          status: string;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          metadata?: Json | null;
          paid_at?: string | null;
          plan?: string | null;
          polar_checkout_id?: string | null;
          polar_customer_id?: string | null;
          polar_transaction_id?: string;
          product_id?: string | null;
          product_type?: string;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      quiz_options: {
        Row: {
          created_at: string | null;
          description: string | null;
          display_order: number;
          icon_name: string | null;
          id: string;
          label: string;
          question_id: string;
          value: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          display_order: number;
          icon_name?: string | null;
          id?: string;
          label: string;
          question_id: string;
          value: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number;
          icon_name?: string | null;
          id?: string;
          label?: string;
          question_id?: string;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quiz_options_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'quiz_questions';
            referencedColumns: ['question_id'];
          },
        ];
      };
      quiz_questions: {
        Row: {
          created_at: string | null;
          description: string | null;
          display_order: number;
          id: string;
          question_id: string;
          question_text: string;
          required: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          display_order: number;
          id?: string;
          question_id: string;
          question_text: string;
          required?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number;
          id?: string;
          question_id?: string;
          question_text?: string;
          required?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      rate_limit_tracker: {
        Row: {
          counter: number | null;
          identifier: string;
          window_start: string | null;
        };
        Insert: {
          counter?: number | null;
          identifier: string;
          window_start?: string | null;
        };
        Update: {
          counter?: number | null;
          identifier?: string;
          window_start?: string | null;
        };
        Relationships: [];
      };
      review_helpful_votes: {
        Row: {
          created_at: string;
          id: string;
          review_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          review_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          review_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'review_helpful_votes_review_id_fkey';
            columns: ['review_id'];
            isOneToOne: false;
            referencedRelation: 'review_ratings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'review_helpful_votes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      review_ratings: {
        Row: {
          content_slug: string;
          content_type: string;
          created_at: string;
          helpful_count: number;
          id: string;
          rating: number;
          review_text: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content_slug: string;
          content_type: string;
          created_at?: string;
          helpful_count?: number;
          id?: string;
          rating: number;
          review_text?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content_slug?: string;
          content_type?: string;
          created_at?: string;
          helpful_count?: number;
          id?: string;
          rating?: number;
          review_text?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'review_ratings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      sponsored_clicks: {
        Row: {
          created_at: string;
          id: string;
          sponsored_id: string;
          target_url: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          sponsored_id: string;
          target_url?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          sponsored_id?: string;
          target_url?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sponsored_clicks_sponsored_id_fkey';
            columns: ['sponsored_id'];
            isOneToOne: false;
            referencedRelation: 'mv_content_list_slim';
            referencedColumns: ['sponsored_content_id'];
          },
          {
            foreignKeyName: 'sponsored_clicks_sponsored_id_fkey';
            columns: ['sponsored_id'];
            isOneToOne: false;
            referencedRelation: 'sponsored_content';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sponsored_clicks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      sponsored_content: {
        Row: {
          active: boolean | null;
          click_count: number | null;
          content_id: string;
          content_type: string;
          created_at: string;
          end_date: string;
          id: string;
          impression_count: number | null;
          impression_limit: number | null;
          start_date: string;
          tier: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          active?: boolean | null;
          click_count?: number | null;
          content_id: string;
          content_type: string;
          created_at?: string;
          end_date: string;
          id?: string;
          impression_count?: number | null;
          impression_limit?: number | null;
          start_date: string;
          tier: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          active?: boolean | null;
          click_count?: number | null;
          content_id?: string;
          content_type?: string;
          created_at?: string;
          end_date?: string;
          id?: string;
          impression_count?: number | null;
          impression_limit?: number | null;
          start_date?: string;
          tier?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sponsored_content_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      sponsored_impressions: {
        Row: {
          created_at: string;
          id: string;
          page_url: string | null;
          position: number | null;
          sponsored_id: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          page_url?: string | null;
          position?: number | null;
          sponsored_id: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          page_url?: string | null;
          position?: number | null;
          sponsored_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sponsored_impressions_sponsored_id_fkey';
            columns: ['sponsored_id'];
            isOneToOne: false;
            referencedRelation: 'mv_content_list_slim';
            referencedColumns: ['sponsored_content_id'];
          },
          {
            foreignKeyName: 'sponsored_impressions_sponsored_id_fkey';
            columns: ['sponsored_id'];
            isOneToOne: false;
            referencedRelation: 'sponsored_content';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sponsored_impressions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      static_routes: {
        Row: {
          created_at: string;
          description: string;
          group_name: string;
          icon_name: string;
          id: string;
          is_active: boolean;
          json_ld: Json | null;
          og_type: string | null;
          path: string;
          robots_follow: boolean | null;
          robots_index: boolean | null;
          seo_description: string | null;
          seo_title: string | null;
          sort_order: number;
          title: string;
          twitter_card: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          group_name: string;
          icon_name: string;
          id?: string;
          is_active?: boolean;
          json_ld?: Json | null;
          og_type?: string | null;
          path: string;
          robots_follow?: boolean | null;
          robots_index?: boolean | null;
          seo_description?: string | null;
          seo_title?: string | null;
          sort_order?: number;
          title: string;
          twitter_card?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          group_name?: string;
          icon_name?: string;
          id?: string;
          is_active?: boolean;
          json_ld?: Json | null;
          og_type?: string | null;
          path?: string;
          robots_follow?: boolean | null;
          robots_index?: boolean | null;
          seo_description?: string | null;
          seo_title?: string | null;
          sort_order?: number;
          title?: string;
          twitter_card?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      structured_data_config: {
        Row: {
          active: boolean | null;
          application_sub_category: string | null;
          category: string;
          category_display_name: string;
          created_at: string;
          creative_work_description: string | null;
          default_keywords: string[] | null;
          default_requirements: string[] | null;
          generate_aggregate_rating: boolean | null;
          generate_application: boolean | null;
          generate_breadcrumb: boolean | null;
          generate_collection_page: boolean | null;
          generate_course: boolean | null;
          generate_creative_work: boolean | null;
          generate_faq: boolean | null;
          generate_how_to: boolean | null;
          generate_item_list: boolean | null;
          generate_job_posting: boolean | null;
          generate_learning_resource: boolean | null;
          generate_review: boolean | null;
          generate_source_code: boolean | null;
          generate_speakable: boolean | null;
          generate_video_object: boolean | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean | null;
          application_sub_category?: string | null;
          category: string;
          category_display_name: string;
          created_at?: string;
          creative_work_description?: string | null;
          default_keywords?: string[] | null;
          default_requirements?: string[] | null;
          generate_aggregate_rating?: boolean | null;
          generate_application?: boolean | null;
          generate_breadcrumb?: boolean | null;
          generate_collection_page?: boolean | null;
          generate_course?: boolean | null;
          generate_creative_work?: boolean | null;
          generate_faq?: boolean | null;
          generate_how_to?: boolean | null;
          generate_item_list?: boolean | null;
          generate_job_posting?: boolean | null;
          generate_learning_resource?: boolean | null;
          generate_review?: boolean | null;
          generate_source_code?: boolean | null;
          generate_speakable?: boolean | null;
          generate_video_object?: boolean | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean | null;
          application_sub_category?: string | null;
          category?: string;
          category_display_name?: string;
          created_at?: string;
          creative_work_description?: string | null;
          default_keywords?: string[] | null;
          default_requirements?: string[] | null;
          generate_aggregate_rating?: boolean | null;
          generate_application?: boolean | null;
          generate_breadcrumb?: boolean | null;
          generate_collection_page?: boolean | null;
          generate_course?: boolean | null;
          generate_creative_work?: boolean | null;
          generate_faq?: boolean | null;
          generate_how_to?: boolean | null;
          generate_item_list?: boolean | null;
          generate_job_posting?: boolean | null;
          generate_learning_resource?: boolean | null;
          generate_review?: boolean | null;
          generate_source_code?: boolean | null;
          generate_speakable?: boolean | null;
          generate_video_object?: boolean | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          branch_name: string | null;
          content_name: string;
          content_slug: string;
          content_type: string;
          created_at: string;
          id: string;
          merged_at: string | null;
          pr_number: number | null;
          pr_url: string | null;
          rejection_reason: string | null;
          status: string;
          submission_data: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          branch_name?: string | null;
          content_name: string;
          content_slug: string;
          content_type: string;
          created_at?: string;
          id?: string;
          merged_at?: string | null;
          pr_number?: number | null;
          pr_url?: string | null;
          rejection_reason?: string | null;
          status?: string;
          submission_data: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          branch_name?: string | null;
          content_name?: string;
          content_slug?: string;
          content_type?: string;
          created_at?: string;
          id?: string;
          merged_at?: string | null;
          pr_number?: number | null;
          pr_url?: string | null;
          rejection_reason?: string | null;
          status?: string;
          submission_data?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'submissions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null;
          cancelled_at: string | null;
          created_at: string;
          current_period_end: string;
          current_period_start: string;
          id: string;
          plan_name: string;
          polar_customer_id: string | null;
          polar_product_id: string | null;
          polar_subscription_id: string;
          product_id: string | null;
          product_type: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          cancelled_at?: string | null;
          created_at?: string;
          current_period_end: string;
          current_period_start: string;
          id?: string;
          plan_name: string;
          polar_customer_id?: string | null;
          polar_product_id?: string | null;
          polar_subscription_id: string;
          product_id?: string | null;
          product_type?: string | null;
          status: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          cancelled_at?: string | null;
          created_at?: string;
          current_period_end?: string;
          current_period_start?: string;
          id?: string;
          plan_name?: string;
          polar_customer_id?: string | null;
          polar_product_id?: string | null;
          polar_subscription_id?: string;
          product_id?: string | null;
          product_type?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      tier_display_config: {
        Row: {
          active: boolean | null;
          created_at: string;
          css_classes: string;
          display_order: number;
          label: string;
          tier: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string;
          css_classes: string;
          display_order: number;
          label: string;
          tier: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean | null;
          created_at?: string;
          css_classes?: string;
          display_order?: number;
          label?: string;
          tier?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_collections: {
        Row: {
          bookmark_count: number;
          created_at: string;
          description: string | null;
          id: string;
          is_public: boolean;
          item_count: number;
          name: string;
          slug: string;
          updated_at: string;
          user_id: string;
          view_count: number;
        };
        Insert: {
          bookmark_count?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_public?: boolean;
          item_count?: number;
          name: string;
          slug: string;
          updated_at?: string;
          user_id: string;
          view_count?: number;
        };
        Update: {
          bookmark_count?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_public?: boolean;
          item_count?: number;
          name?: string;
          slug?: string;
          updated_at?: string;
          user_id?: string;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'user_collections_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_content: {
        Row: {
          active: boolean | null;
          content: Json;
          content_type: string;
          created_at: string;
          description: string;
          download_count: number | null;
          featured: boolean | null;
          id: string;
          name: string;
          plan: string;
          slug: string;
          tags: Json | null;
          updated_at: string;
          user_id: string;
          view_count: number | null;
        };
        Insert: {
          active?: boolean | null;
          content: Json;
          content_type: string;
          created_at?: string;
          description: string;
          download_count?: number | null;
          featured?: boolean | null;
          id?: string;
          name: string;
          plan?: string;
          slug: string;
          tags?: Json | null;
          updated_at?: string;
          user_id: string;
          view_count?: number | null;
        };
        Update: {
          active?: boolean | null;
          content?: Json;
          content_type?: string;
          created_at?: string;
          description?: string;
          download_count?: number | null;
          featured?: boolean | null;
          id?: string;
          name?: string;
          plan?: string;
          slug?: string;
          tags?: Json | null;
          updated_at?: string;
          user_id?: string;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_content_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_interactions: {
        Row: {
          content_slug: string;
          content_type: string;
          created_at: string;
          id: string;
          interaction_type: string;
          metadata: Json | null;
          session_id: string | null;
          user_id: string | null;
        };
        Insert: {
          content_slug: string;
          content_type: string;
          created_at?: string;
          id?: string;
          interaction_type: string;
          metadata?: Json | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          content_slug?: string;
          content_type?: string;
          created_at?: string;
          id?: string;
          interaction_type?: string;
          metadata?: Json | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_interactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_mcps: {
        Row: {
          active: boolean | null;
          click_count: number | null;
          company_id: string | null;
          created_at: string;
          description: string;
          id: string;
          link: string;
          logo: string | null;
          mcp_link: string | null;
          name: string;
          order: number | null;
          plan: string;
          slug: string;
          updated_at: string;
          user_id: string;
          view_count: number | null;
        };
        Insert: {
          active?: boolean | null;
          click_count?: number | null;
          company_id?: string | null;
          created_at?: string;
          description: string;
          id?: string;
          link: string;
          logo?: string | null;
          mcp_link?: string | null;
          name: string;
          order?: number | null;
          plan?: string;
          slug: string;
          updated_at?: string;
          user_id: string;
          view_count?: number | null;
        };
        Update: {
          active?: boolean | null;
          click_count?: number | null;
          company_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          link?: string;
          logo?: string | null;
          mcp_link?: string | null;
          name?: string;
          order?: number | null;
          plan?: string;
          slug?: string;
          updated_at?: string;
          user_id?: string;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_mcps_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_mcps_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'company_job_stats';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'user_mcps_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_similarities: {
        Row: {
          calculated_at: string;
          common_items: number | null;
          created_at: string;
          id: string;
          similarity_score: number;
          updated_at: string;
          user_a_id: string;
          user_b_id: string;
        };
        Insert: {
          calculated_at?: string;
          common_items?: number | null;
          created_at?: string;
          id?: string;
          similarity_score: number;
          updated_at?: string;
          user_a_id: string;
          user_b_id: string;
        };
        Update: {
          calculated_at?: string;
          common_items?: number | null;
          created_at?: string;
          id?: string;
          similarity_score?: number;
          updated_at?: string;
          user_a_id?: string;
          user_b_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_similarities_user_a_id_fkey';
            columns: ['user_a_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_similarities_user_b_id_fkey';
            columns: ['user_b_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          bio: string | null;
          bookmark_count: number;
          created_at: string;
          display_name: string | null;
          email: string | null;
          follow_email: boolean | null;
          follower_count: number;
          following_count: number;
          hero: string | null;
          id: string;
          image: string | null;
          interests: Json | null;
          name: string | null;
          profile_public: boolean | null;
          public: boolean | null;
          search_vector: unknown;
          slug: string | null;
          social_x_link: string | null;
          status: string | null;
          submission_count: number;
          tier: string | null;
          updated_at: string;
          website: string | null;
          work: string | null;
        };
        Insert: {
          bio?: string | null;
          bookmark_count?: number;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          follow_email?: boolean | null;
          follower_count?: number;
          following_count?: number;
          hero?: string | null;
          id: string;
          image?: string | null;
          interests?: Json | null;
          name?: string | null;
          profile_public?: boolean | null;
          public?: boolean | null;
          search_vector?: unknown;
          slug?: string | null;
          social_x_link?: string | null;
          status?: string | null;
          submission_count?: number;
          tier?: string | null;
          updated_at?: string;
          website?: string | null;
          work?: string | null;
        };
        Update: {
          bio?: string | null;
          bookmark_count?: number;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          follow_email?: boolean | null;
          follower_count?: number;
          following_count?: number;
          hero?: string | null;
          id?: string;
          image?: string | null;
          interests?: Json | null;
          name?: string | null;
          profile_public?: boolean | null;
          public?: boolean | null;
          search_vector?: unknown;
          slug?: string | null;
          social_x_link?: string | null;
          status?: string | null;
          submission_count?: number;
          tier?: string | null;
          updated_at?: string;
          website?: string | null;
          work?: string | null;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          created_at: string;
          data: Json;
          error: string | null;
          id: string;
          next_retry_at: string | null;
          processed: boolean | null;
          processed_at: string | null;
          received_at: string | null;
          retry_count: number | null;
          svix_id: string | null;
          type: string;
        };
        Insert: {
          created_at: string;
          data?: Json;
          error?: string | null;
          id?: string;
          next_retry_at?: string | null;
          processed?: boolean | null;
          processed_at?: string | null;
          received_at?: string | null;
          retry_count?: number | null;
          svix_id?: string | null;
          type: string;
        };
        Update: {
          created_at?: string;
          data?: Json;
          error?: string | null;
          id?: string;
          next_retry_at?: string | null;
          processed?: boolean | null;
          processed_at?: string | null;
          received_at?: string | null;
          retry_count?: number | null;
          svix_id?: string | null;
          type?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      company_job_stats: {
        Row: {
          active_jobs: number | null;
          avg_salary_min: number | null;
          click_through_rate: number | null;
          company_id: string | null;
          company_name: string | null;
          company_slug: string | null;
          contract_jobs: number | null;
          featured_jobs: number | null;
          first_job_posted_at: string | null;
          full_time_jobs: number | null;
          internship_jobs: number | null;
          last_refreshed_at: string | null;
          latest_job_posted_at: string | null;
          part_time_jobs: number | null;
          remote_jobs: number | null;
          total_clicks: number | null;
          total_jobs: number | null;
          total_views: number | null;
          workplace_hybrid: number | null;
          workplace_onsite: number | null;
          workplace_remote: number | null;
        };
        Relationships: [];
      };
      mv_analytics_summary: {
        Row: {
          bookmark_count: number | null;
          category: string | null;
          copy_count: number | null;
          last_interaction_at: string | null;
          last_viewed_at: string | null;
          slug: string | null;
          total_time_spent_seconds: number | null;
          view_count: number | null;
        };
        Relationships: [];
      };
      mv_content_list_slim: {
        Row: {
          author: string | null;
          author_profile_url: string | null;
          bookmark_count: number | null;
          category: string | null;
          copy_count: number | null;
          created_at: string | null;
          date_added: string | null;
          description: string | null;
          display_title: string | null;
          id: string | null;
          is_sponsored: boolean | null;
          popularity_score: number | null;
          slug: string | null;
          source: string | null;
          sponsored_content_id: string | null;
          sponsorship_tier: string | null;
          tags: string[] | null;
          title: string | null;
          updated_at: string | null;
          view_count: number | null;
        };
        Relationships: [];
      };
      mv_content_stats: {
        Row: {
          author: string | null;
          bookmark_count: number | null;
          category: string | null;
          copy_count: number | null;
          created_at: string | null;
          description: string | null;
          difficulty_score: number | null;
          display_title: string | null;
          last_interaction_at: string | null;
          last_viewed_at: string | null;
          popularity_score: number | null;
          reading_time: number | null;
          slug: string | null;
          tags: string[] | null;
          title: string | null;
          total_time_spent_seconds: number | null;
          updated_at: string | null;
          view_count: number | null;
        };
        Relationships: [];
      };
      mv_content_tag_index: {
        Row: {
          category: string | null;
          featured: boolean | null;
          priority: number | null;
          slug: string | null;
          tags: string[] | null;
          title: string | null;
        };
        Relationships: [];
      };
      mv_content_trending_metrics: {
        Row: {
          bookmarks_total: number | null;
          category: string | null;
          copies_total: number | null;
          created_at: string | null;
          days_old: number | null;
          engagement_score: number | null;
          freshness_score: number | null;
          last_refreshed: string | null;
          slug: string | null;
          trending_score: number | null;
          views_7d: number | null;
          views_prev_7d: number | null;
          views_total: number | null;
        };
        Relationships: [];
      };
      mv_featured_content_rankings: {
        Row: {
          bookmarks_total: number | null;
          category: string | null;
          copies_total: number | null;
          days_old: number | null;
          engagement_score: number | null;
          final_score: number | null;
          freshness_score: number | null;
          growth_rate_pct: number | null;
          last_refreshed: string | null;
          rank: number | null;
          slug: string | null;
          trending_score: number | null;
          views_7d: number | null;
          views_prev_7d: number | null;
          views_total: number | null;
        };
        Relationships: [];
      };
      mv_search_facets: {
        Row: {
          all_tags: string[] | null;
          author_count: number | null;
          authors: string[] | null;
          category: string | null;
          content_count: number | null;
          tag_count: number | null;
        };
        Relationships: [];
      };
      mv_site_urls: {
        Row: {
          changefreq: string | null;
          lastmod: string | null;
          path: string | null;
          priority: number | null;
        };
        Relationships: [];
      };
      mv_timezone_names: {
        Row: {
          name: string | null;
        };
        Relationships: [];
      };
      mv_trending_content: {
        Row: {
          bookmark_count: number | null;
          category: string | null;
          copy_count: number | null;
          description: string | null;
          last_refreshed: string | null;
          latest_activity: string | null;
          slug: string | null;
          title: string | null;
          view_count: number | null;
        };
        Relationships: [];
      };
      mv_weekly_new_content: {
        Row: {
          category: string | null;
          date_added: string | null;
          description: string | null;
          slug: string | null;
          title: string | null;
          week_rank: number | null;
          week_start: string | null;
        };
        Relationships: [];
      };
      submission_stats_summary: {
        Row: {
          last_refreshed_at: string | null;
          merged_this_week: number | null;
          pending: number | null;
          total: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      add_bookmark: {
        Args: {
          p_content_slug: string;
          p_content_type: string;
          p_notes?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      approve_submission: {
        Args: { p_moderator_notes?: string; p_submission_id: string };
        Returns: Json;
      };
      batch_add_bookmarks: {
        Args: { p_items: Json; p_user_id: string };
        Returns: Json;
      };
      build_breadcrumb_json_ld: {
        Args: { p_category: string; p_slug: string };
        Returns: Json;
      };
      build_changelog_json_ld: { Args: { p_slug: string }; Returns: Json };
      build_complete_content_schemas: {
        Args: { p_category: string; p_slug: string };
        Returns: Json;
      };
      build_enriched_content_base:
        | {
            Args: {
              p_author: string;
              p_author_profile_url: string;
              p_bookmark_count: number;
              p_category: string;
              p_content: string;
              p_copy_count: number;
              p_created_at: string;
              p_date_added: string;
              p_description: string;
              p_display_title: string;
              p_documentation_url: string;
              p_examples: Json;
              p_features: string[];
              p_id: string;
              p_popularity_score: number;
              p_seo_title: string;
              p_slug: string;
              p_source: string;
              p_source_table: string;
              p_sponsor_tier: string;
              p_sponsored_active: boolean;
              p_sponsored_id: string;
              p_tags: string[];
              p_title: string;
              p_troubleshooting: Json[];
              p_updated_at: string;
              p_use_cases: string[];
              p_view_count: number;
            };
            Returns: Json;
          }
        | {
            Args: {
              p_author: string;
              p_author_profile_url: string;
              p_bookmark_count: number;
              p_category: string;
              p_content: string;
              p_copy_count: number;
              p_created_at: string;
              p_date_added: string;
              p_description: string;
              p_display_title: string;
              p_documentation_url: string;
              p_examples: Json;
              p_features: string[];
              p_id: string;
              p_popularity_score: number;
              p_seo_title: string;
              p_slug: string;
              p_source: string;
              p_source_table: string;
              p_sponsor_tier: string;
              p_sponsored_active: boolean;
              p_sponsored_id: string;
              p_tags: string[];
              p_title: string;
              p_troubleshooting: Json[];
              p_updated_at: string;
              p_use_cases: string[];
              p_view_count: number;
            };
            Returns: Json;
          };
      build_faq_schema: {
        Args: { p_category: string; p_slug: string };
        Returns: Json;
      };
      build_how_to_schema: {
        Args: { p_category: string; p_slug: string };
        Returns: Json;
      };
      build_item_list_schema: {
        Args: { p_category: string; p_slug: string };
        Returns: Json;
      };
      build_learning_resource_schema: {
        Args: { p_category: string; p_slug: string };
        Returns: Json;
      };
      build_organization_json_ld: { Args: never; Returns: Json };
      build_person_schema: { Args: { p_slug: string }; Returns: Json };
      build_software_application_schema:
        | { Args: { p_category: string; p_slug: string }; Returns: Json }
        | { Args: { p_config: Json; p_content_row: Json }; Returns: Json };
      build_source_code_schema: {
        Args: { p_category: string; p_slug: string };
        Returns: Json;
      };
      build_static_route_json_ld: { Args: { p_path: string }; Returns: Json };
      calculate_content_popularity_score: {
        Args: {
          p_bookmark_count: number;
          p_created_at: string;
          p_review_count: number;
          p_view_count: number;
        };
        Returns: number;
      };
      calculate_tag_similarity: {
        Args: { p_tags_a: string[]; p_tags_b: string[] };
        Returns: number;
      };
      cancel_email_sequence: { Args: { p_email: string }; Returns: undefined };
      check_vacuum_needed: {
        Args: never;
        Returns: {
          affected_tables: number;
          alert_message: string;
          max_bloat_ratio: number;
          needs_vacuum: boolean;
        }[];
      };
      cleanup_old_interactions: { Args: never; Returns: number };
      diagnose_failing_section: {
        Args: { p_section_index: number; p_slug: string };
        Returns: string;
      };
      enroll_in_email_sequence: {
        Args: { p_email: string };
        Returns: undefined;
      };
      extract_tags_for_search: { Args: { tags: Json }; Returns: string };
      filter_jobs: {
        Args: {
          p_category?: string;
          p_employment_type?: string;
          p_experience_level?: string;
          p_limit?: number;
          p_offset?: number;
          p_remote_only?: boolean;
          p_search_query?: string;
        };
        Returns: Json;
      };
      format_date_iso: { Args: { input_date: string }; Returns: string };
      format_date_long: { Args: { input_date: string }; Returns: string };
      format_date_short: { Args: { input_date: string }; Returns: string };
      format_relative_date: {
        Args: { input_date: string; max_days?: number; style?: string };
        Returns: string;
      };
      format_week_range: { Args: { week_start: string }; Returns: string };
      generate_category_llms_txt: {
        Args: { p_category: string };
        Returns: string;
      };
      generate_changelog_atom_feed: {
        Args: { p_limit?: number };
        Returns: string;
      };
      generate_changelog_entry_llms_txt: {
        Args: { p_slug: string };
        Returns: string;
      };
      generate_changelog_llms_txt: { Args: never; Returns: string };
      generate_changelog_rss_feed: {
        Args: { p_limit?: number };
        Returns: string;
      };
      generate_command_installation: {
        Args: { p_slug: string; p_title: string };
        Returns: Json;
      };
      generate_content_atom_feed: {
        Args: { p_category?: string; p_limit?: number };
        Returns: string;
      };
      generate_content_field: {
        Args: { p_category: string; p_field_type: string; p_slug: string };
        Returns: Json;
      };
      generate_content_rss_feed: {
        Args: { p_category?: string; p_limit?: number };
        Returns: string;
      };
      generate_hook_installation: { Args: { p_slug: string }; Returns: Json };
      generate_item_llms_txt: {
        Args: { p_category: string; p_slug: string };
        Returns: string;
      };
      generate_llms_txt_content: {
        Args: { p_category: string; p_slug: string };
        Returns: Json;
      };
      generate_markdown_export: {
        Args: {
          p_category: string;
          p_include_footer?: boolean;
          p_include_metadata?: boolean;
          p_slug: string;
        };
        Returns: Json;
      };
      generate_metadata_complete: {
        Args: { p_include?: string; p_route: string };
        Returns: Json;
      };
      generate_sitemap_xml: { Args: { p_base_url?: string }; Returns: string };
      generate_sitewide_llms_txt: { Args: never; Returns: string };
      generate_slug: { Args: { p_name: string }; Returns: string };
      generate_slug_from_filename: {
        Args: { p_filename: string };
        Returns: string;
      };
      generate_tool_llms_txt: { Args: { p_tool_name: string }; Returns: string };
      get_account_dashboard: { Args: { p_user_id: string }; Returns: Json };
      get_active_notifications: {
        Args: { p_dismissed_ids?: string[] };
        Returns: {
          action_href: string | null;
          action_label: string | null;
          action_onclick: string | null;
          active: boolean;
          created_at: string;
          expires_at: string | null;
          icon: string | null;
          id: string;
          message: string;
          priority: Database['public']['Enums']['notification_priority'];
          title: string;
          type: Database['public']['Enums']['notification_type'];
          updated_at: string;
        }[];
        SetofOptions: {
          from: '*';
          to: 'notifications';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_active_sponsored_content: {
        Args: { p_content_type?: string; p_limit?: number };
        Returns: {
          active: boolean;
          click_count: number;
          content_id: string;
          content_type: string;
          created_at: string;
          end_date: string;
          id: string;
          impression_count: number;
          impression_limit: number;
          start_date: string;
          tier: string;
          updated_at: string;
          user_id: string;
        }[];
      };
      get_active_subscribers: { Args: never; Returns: string[] };
      get_all_content_categories: {
        Args: never;
        Returns: {
          category: string;
        }[];
      };
      get_all_structured_data_configs: { Args: never; Returns: Json };
      get_analytics_summary:
        | {
            Args: { p_category?: string; p_slug?: string };
            Returns: {
              bookmark_count: number | null;
              category: string | null;
              copy_count: number | null;
              last_interaction_at: string | null;
              last_viewed_at: string | null;
              slug: string | null;
              total_time_spent_seconds: number | null;
              view_count: number | null;
            }[];
            SetofOptions: {
              from: '*';
              to: 'mv_analytics_summary';
              isOneToOne: false;
              isSetofReturn: true;
            };
          }
        | {
            Args: { p_category?: string };
            Returns: {
              avg_popularity: number;
              category: string;
              total_bookmarks: number;
              total_copies: number;
              total_items: number;
              total_views: number;
            }[];
          };
      get_api_content_full: {
        Args: { p_base_url?: string; p_category: string; p_slug: string };
        Returns: string;
      };
      get_api_health: { Args: never; Returns: Json };
      get_app_settings: {
        Args: { p_category?: string; p_environment?: string };
        Returns: Json;
      };
      get_bookmark_counts_by_category: {
        Args: { category_filter: string };
        Returns: {
          bookmark_count: number;
          content_slug: string;
        }[];
      };
      get_bulk_user_stats: {
        Args: { user_ids: string[] };
        Returns: {
          bookmarks_received: number;
          comments: number;
          followers: number;
          posts: number;
          reviews: number;
          submissions: number;
          user_id: string;
          votes_received: number;
        }[];
      };
      get_bulk_user_stats_realtime: {
        Args: { user_ids: string[] };
        Returns: {
          bookmarks_received: number;
          comments: number;
          followers: number;
          posts: number;
          reviews: number;
          submissions: number;
          user_id: string;
          votes_received: number;
        }[];
      };
      get_category_config: { Args: { p_category?: string }; Returns: Json };
      get_category_configs_with_features: { Args: never; Returns: Json };
      get_category_description: {
        Args: { p_category: string };
        Returns: string;
      };
      get_category_display_name: {
        Args: { p_category: string };
        Returns: string;
      };
      get_changelog_entries: {
        Args: {
          p_category?: string;
          p_featured_only?: boolean;
          p_limit?: number;
          p_offset?: number;
          p_published_only?: boolean;
        };
        Returns: Json;
      };
      get_changelog_entry_by_slug: { Args: { p_slug: string }; Returns: Json };
      get_changelog_metadata: { Args: never; Returns: Json };
      get_changelog_with_category_stats: {
        Args: { p_category?: string; p_limit?: number; p_offset?: number };
        Returns: Json;
      };
      get_collection_detail_with_items: {
        Args: { p_slug: string; p_user_id: string };
        Returns: Json;
      };
      get_collection_items_grouped: {
        Args: { p_collection_slug: string };
        Returns: Json;
      };
      get_community_directory: {
        Args: { p_limit?: number; p_search_query?: string };
        Returns: Json;
      };
      get_company_job_stats: {
        Args: { p_company_slug?: string };
        Returns: {
          active_jobs: number | null;
          avg_salary_min: number | null;
          click_through_rate: number | null;
          company_id: string | null;
          company_name: string | null;
          company_slug: string | null;
          contract_jobs: number | null;
          featured_jobs: number | null;
          first_job_posted_at: string | null;
          full_time_jobs: number | null;
          internship_jobs: number | null;
          last_refreshed_at: string | null;
          latest_job_posted_at: string | null;
          part_time_jobs: number | null;
          remote_jobs: number | null;
          total_clicks: number | null;
          total_jobs: number | null;
          total_views: number | null;
          workplace_hybrid: number | null;
          workplace_onsite: number | null;
          workplace_remote: number | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'company_job_stats';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_content_detail_complete: {
        Args: { p_category: string; p_slug: string; p_user_id?: string };
        Returns: Json;
      };
      get_content_paginated: {
        Args: {
          p_author?: string;
          p_category?: string;
          p_limit?: number;
          p_offset?: number;
          p_order_by?: string;
          p_order_direction?: string;
          p_search?: string;
          p_tags?: string[];
        };
        Returns: Json;
      };
      get_content_paginated_slim: {
        Args: {
          p_category?: string;
          p_limit?: number;
          p_offset?: number;
          p_order_by?: string;
          p_order_direction?: string;
        };
        Returns: Json;
      };
      get_content_templates: { Args: { p_category: string }; Returns: Json };
      get_content_with_analytics:
        | {
            Args: { p_category?: string; p_limit?: number };
            Returns: {
              bookmark_count: number;
              category: string;
              copy_count: number;
              date_added: string;
              description: string;
              slug: string;
              title: string;
              view_count: number;
            }[];
          }
        | {
            Args: { p_category: string; p_slug: string };
            Returns: {
              bookmark_count: number;
              category: string;
              copy_count: number;
              description: string;
              id: string;
              slug: string;
              title: string;
              view_count: number;
            }[];
          };
      get_current_week_start: { Args: never; Returns: string };
      get_database_fingerprint: { Args: never; Returns: Json };
      get_days_ago: { Args: { input_date: string }; Returns: number };
      get_due_sequence_emails: { Args: never; Returns: Json };
      get_dynamic_featured_content: {
        Args: { p_category: string; p_limit?: number };
        Returns: {
          bookmark_count: number;
          content_slug: string;
          content_type: string;
          copy_count: number;
          days_old: number;
          engagement_score: number;
          final_score: number;
          freshness_score: number;
          growth_rate_pct: number;
          rank: number;
          total_views: number;
          trending_score: number;
        }[];
      };
      get_enriched_content: {
        Args: {
          p_category?: string;
          p_limit?: number;
          p_offset?: number;
          p_slug?: string;
          p_slugs?: string[];
        };
        Returns: Json;
      };
      get_enriched_content_list: {
        Args: {
          p_category?: string;
          p_limit?: number;
          p_offset?: number;
          p_slugs?: string[];
        };
        Returns: Json;
      };
      get_featured_jobs: {
        Args: never;
        Returns: {
          active: boolean | null;
          admin_notes: string | null;
          benefits: Json;
          category: string;
          click_count: number | null;
          company: string;
          company_id: string | null;
          company_logo: string | null;
          contact_email: string | null;
          created_at: string;
          description: string;
          experience: string | null;
          expires_at: string | null;
          featured: boolean | null;
          id: string;
          link: string;
          location: string | null;
          order: number | null;
          payment_amount: number | null;
          payment_date: string | null;
          payment_method: string | null;
          payment_reference: string | null;
          payment_status: string;
          plan: string;
          posted_at: string | null;
          remote: boolean | null;
          requirements: Json;
          salary: string | null;
          search_vector: unknown;
          slug: string;
          status: Database['public']['Enums']['job_status'];
          tags: Json;
          title: string;
          type: string;
          updated_at: string;
          user_id: string | null;
          view_count: number | null;
          workplace: string | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'jobs';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_form_field_config: { Args: { p_form_type: string }; Returns: Json };
      get_form_fields_for_content_type: {
        Args: {
          p_content_type: Database['public']['Enums']['content_category'];
        };
        Returns: {
          field_name: string;
          field_order: number;
          field_properties: Json;
          field_scope: Database['public']['Enums']['field_scope'];
          field_type: Database['public']['Enums']['field_type'];
          grid_column: Database['public']['Enums']['grid_column'];
          help_text: string;
          icon: string;
          icon_position: Database['public']['Enums']['icon_position'];
          id: string;
          label: string;
          placeholder: string;
          required: boolean;
          select_options: Json;
        }[];
      };
      get_form_fields_grouped: { Args: { p_form_type: string }; Returns: Json };
      get_gallery_trending: {
        Args: {
          p_category?: string;
          p_days_back?: number;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          author: string;
          category: string;
          copy_count: number;
          created_at: string;
          description: string;
          last_interaction_at: string;
          last_screenshot_at: string;
          screenshot_count: number;
          share_count: number;
          slug: string;
          tags: string[];
          title: string;
          trending_score: number;
          view_count: number;
        }[];
      };
      get_generation_config: { Args: { p_category?: string }; Returns: Json };
      get_homepage_complete: {
        Args: { p_category_ids?: string[] };
        Returns: Json;
      };
      get_homepage_content_enriched: {
        Args: { p_category_ids: string[]; p_week_start?: string };
        Returns: Json;
      };
      get_homepage_featured_only:
        | {
            Args: { p_all_configs_limit?: number; p_category_ids: string[] };
            Returns: Json;
          }
        | { Args: { p_category_ids: string[] }; Returns: Json };
      get_job_detail: { Args: { p_slug: string }; Returns: Json };
      get_jobs_by_category: {
        Args: { p_category: string };
        Returns: {
          active: boolean | null;
          admin_notes: string | null;
          benefits: Json;
          category: string;
          click_count: number | null;
          company: string;
          company_id: string | null;
          company_logo: string | null;
          contact_email: string | null;
          created_at: string;
          description: string;
          experience: string | null;
          expires_at: string | null;
          featured: boolean | null;
          id: string;
          link: string;
          location: string | null;
          order: number | null;
          payment_amount: number | null;
          payment_date: string | null;
          payment_method: string | null;
          payment_reference: string | null;
          payment_status: string;
          plan: string;
          posted_at: string | null;
          remote: boolean | null;
          requirements: Json;
          salary: string | null;
          search_vector: unknown;
          slug: string;
          status: Database['public']['Enums']['job_status'];
          tags: Json;
          title: string;
          type: string;
          updated_at: string;
          user_id: string | null;
          view_count: number | null;
          workplace: string | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'jobs';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_jobs_count: { Args: never; Returns: number };
      get_jobs_list: { Args: never; Returns: Json };
      get_my_submissions: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: Json;
      };
      get_navigation_menu: { Args: never; Returns: Json };
      get_new_content_for_week: {
        Args: { p_limit?: number; p_week_start: string };
        Returns: {
          category: string;
          date_added: string;
          description: string;
          slug: string;
          title: string;
          url: string;
        }[];
      };
      get_pending_resend_syncs: {
        Args: { p_limit?: number };
        Returns: {
          email: string;
          id: string;
          referrer: string;
          source: string;
          status: string;
          subscribed_at: string;
          unsubscribed_at: string;
        }[];
      };
      get_pending_submissions: {
        Args: { p_filter_type?: string; p_limit?: number; p_offset?: number };
        Returns: Json;
      };
      get_performance_baseline: { Args: never; Returns: Json };
      get_quiz_configuration: { Args: never; Returns: Json };
      get_recent_merged: { Args: { p_limit?: number }; Returns: Json };
      get_recommendations: {
        Args: {
          p_experience_level: string;
          p_focus_areas?: string[];
          p_integrations?: string[];
          p_limit?: number;
          p_tool_preferences: string[];
          p_use_case: string;
        };
        Returns: Json;
      };
      get_related_content: {
        Args: {
          p_category: string;
          p_exclude_slugs?: string[];
          p_limit?: number;
          p_slug: string;
          p_tags?: string[];
        };
        Returns: {
          author: string;
          category: string;
          date_added: string;
          description: string;
          match_type: string;
          matched_tags: string[];
          score: number;
          slug: string;
          tags: string[];
          title: string;
          views: number;
        }[];
      };
      get_reviews_with_stats: {
        Args: {
          p_content_slug: string;
          p_content_type: string;
          p_limit?: number;
          p_offset?: number;
          p_sort_by?: string;
          p_user_id?: string;
        };
        Returns: Json;
      };
      get_search_count: {
        Args: {
          p_authors?: string[];
          p_categories?: string[];
          p_query?: string;
          p_tags?: string[];
        };
        Returns: number;
      };
      get_search_suggestions: {
        Args: { p_limit?: number; p_query: string };
        Returns: {
          suggestion: string;
        }[];
      };
      get_sidebar_guides_data: { Args: { p_limit?: number }; Returns: Json };
      get_similar_content: {
        Args: {
          p_content_slug: string;
          p_content_type: string;
          p_limit?: number;
        };
        Returns: Json;
      };
      get_site_urls: {
        Args: never;
        Returns: {
          changefreq: string;
          lastmod: string;
          path: string;
          priority: number;
        }[];
      };
      get_sponsorship_analytics: {
        Args: { p_sponsorship_id: string; p_user_id: string };
        Returns: Json;
      };
      get_structured_data_config: {
        Args: { p_category: string };
        Returns: Json;
      };
      get_submission_dashboard: {
        Args: { p_contributors_limit?: number; p_recent_limit?: number };
        Returns: Json;
      };
      get_submission_stats: { Args: never; Returns: Json };
      get_submission_stats_summary: {
        Args: never;
        Returns: {
          last_refreshed_at: string | null;
          merged_this_week: number | null;
          pending: number | null;
          total: number | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'submission_stats_summary';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_top_contributors: { Args: { p_limit?: number }; Returns: Json };
      get_top_tags_for_category: {
        Args: { p_category: string; p_limit?: number };
        Returns: {
          tag: string;
          tag_count: number;
        }[];
      };
      get_trending_content: {
        Args: { p_limit?: number };
        Returns: {
          category: string;
          description: string;
          slug: string;
          title: string;
          url: string;
          view_count: number;
        }[];
      };
      get_trending_page: {
        Args: {
          p_category?: string;
          p_limit?: number;
          p_metric?: Database['public']['Enums']['trending_metric'];
          p_page?: number;
          p_period?: Database['public']['Enums']['trending_period'];
        };
        Returns: Json;
      };
      get_user_activity_summary: { Args: { p_user_id: string }; Returns: Json };
      get_user_activity_timeline: {
        Args: {
          p_limit?: number;
          p_offset?: number;
          p_type?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      get_user_affinities: {
        Args: { p_limit?: number; p_min_score?: number; p_user_id: string };
        Returns: Json;
      };
      get_user_collection_detail: {
        Args: {
          p_collection_slug: string;
          p_user_slug: string;
          p_viewer_id?: string;
        };
        Returns: Json;
      };
      get_user_dashboard: { Args: { p_user_id: string }; Returns: Json };
      get_user_favorite_categories: {
        Args: { p_limit?: number; p_user_id: string };
        Returns: string[];
      };
      get_user_identities: { Args: { p_user_id: string }; Returns: Json };
      get_user_interaction_summary: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      get_user_library: { Args: { p_user_id: string }; Returns: Json };
      get_user_profile: {
        Args: { p_user_slug: string; p_viewer_id?: string };
        Returns: Json;
      };
      get_user_recent_interactions: {
        Args: { p_limit?: number; p_user_id: string };
        Returns: Json;
      };
      get_user_settings: { Args: { p_user_id: string }; Returns: Json };
      get_week_end: { Args: { week_start: string }; Returns: string };
      get_weekly_digest: { Args: { p_week_start?: string }; Returns: Json };
      get_weekly_new_content: {
        Args: { p_category?: string };
        Returns: {
          category: string | null;
          date_added: string | null;
          description: string | null;
          slug: string | null;
          title: string | null;
          week_rank: number | null;
          week_start: string | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'mv_weekly_new_content';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      handle_webhook_bounce: {
        Args: { p_event_data: Json; p_webhook_id: string };
        Returns: undefined;
      };
      handle_webhook_complaint: {
        Args: { p_event_data: Json; p_webhook_id: string };
        Returns: undefined;
      };
      handle_webhook_contact_created: {
        Args: { p_event_data: Json; p_webhook_id: string };
        Returns: undefined;
      };
      handle_webhook_contact_deleted: {
        Args: { p_event_data: Json; p_webhook_id: string };
        Returns: undefined;
      };
      handle_webhook_email_sent: {
        Args: { p_event_data: Json; p_webhook_id: string };
        Returns: undefined;
      };
      import_redis_seed_data: {
        Args: { redis_data: Json };
        Returns: {
          items_processed: number;
          total_copies_added: number;
          total_processed: number;
          total_views_added: number;
        }[];
      };
      increment: {
        Args: {
          column_name: string;
          increment_by?: number;
          row_id: string;
          table_name: string;
        };
        Returns: undefined;
      };
      invoke_edge_function: {
        Args: { action_header: string; function_name: string; payload?: Json };
        Returns: string;
      };
      is_admin: { Args: { p_user_id: string }; Returns: boolean };
      is_bookmarked: {
        Args: {
          p_content_slug: string;
          p_content_type: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      is_bookmarked_batch: {
        Args: { p_items: Json; p_user_id: string };
        Returns: {
          content_slug: string;
          content_type: string;
          is_bookmarked: boolean;
        }[];
      };
      is_following: {
        Args: { follower_id: string; following_id: string };
        Returns: boolean;
      };
      is_following_batch: {
        Args: { p_followed_user_ids: string[]; p_follower_id: string };
        Returns: {
          followed_user_id: string;
          is_following: boolean;
        }[];
      };
      is_in_future: { Args: { input_date: string }; Returns: boolean };
      is_in_past: { Args: { input_date: string }; Returns: boolean };
      job_slug: { Args: { p_title: string }; Returns: string };
      manage_collection: {
        Args: { p_action: string; p_data: Json; p_user_id: string };
        Returns: Json;
      };
      manage_company: {
        Args: { p_action: string; p_data: Json; p_user_id: string };
        Returns: Json;
      };
      manage_job: {
        Args: { p_action: string; p_data: Json; p_user_id: string };
        Returns: Json;
      };
      manage_review: {
        Args: { p_action: string; p_data: Json; p_user_id: string };
        Returns: Json;
      };
      mark_resend_sync_complete: {
        Args: {
          p_error_message?: string;
          p_resend_contact_id: string;
          p_subscription_id: string;
          p_success?: boolean;
        };
        Returns: undefined;
      };
      mark_sequence_email_processed: {
        Args: {
          p_email: string;
          p_schedule_id: string;
          p_step: number;
          p_success?: boolean;
        };
        Returns: undefined;
      };
      populate_content_seo_data: {
        Args: never;
        Returns: {
          category_name: string;
          items_updated: number;
          total_updated: number;
        }[];
      };
      process_pending_webhooks: { Args: never; Returns: Json };
      refresh_mv_site_urls: { Args: never; Returns: undefined };
      refresh_profile_from_oauth: { Args: { user_id: string }; Returns: Json };
      refresh_user_stats: {
        Args: never;
        Returns: {
          duration_ms: number;
          message: string;
          rows_refreshed: number;
          success: boolean;
        }[];
      };
      reject_submission: {
        Args: { p_moderator_notes: string; p_submission_id: string };
        Returns: Json;
      };
      remove_bookmark: {
        Args: {
          p_content_slug: string;
          p_content_type: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      reorder_collection_items: {
        Args: { p_collection_id: string; p_items: Json; p_user_id: string };
        Returns: Json;
      };
      replace_title_placeholder: {
        Args: { p_slug: string; p_text: string; p_title: string };
        Returns: string;
      };
      schedule_next_sequence_step: {
        Args: { p_current_step: number; p_email: string };
        Returns: undefined;
      };
      search_by_popularity: {
        Args: {
          p_authors?: string[];
          p_categories?: string[];
          p_limit?: number;
          p_offset?: number;
          p_query?: string;
          p_tags?: string[];
        };
        Returns: {
          author: string;
          author_profile_url: string;
          bookmark_count: number;
          category: string;
          copy_count: number;
          created_at: string;
          date_added: string;
          description: string;
          examples: Json;
          features: Json;
          fts_vector: unknown;
          id: string;
          popularity_score: number;
          slug: string;
          tags: string[];
          title: string;
          updated_at: string;
          use_cases: Json;
          view_count: number;
        }[];
      };
      search_companies: {
        Args: { result_limit?: number; search_query: string };
        Returns: {
          created_at: string;
          description: string | null;
          featured: boolean | null;
          id: string;
          industry: string | null;
          logo: string | null;
          name: string;
          owner_id: string | null;
          search_vector: unknown;
          size: string | null;
          slug: string;
          updated_at: string;
          using_cursor_since: string | null;
          website: string | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'companies';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      search_content_optimized: {
        Args: {
          p_authors?: string[];
          p_categories?: string[];
          p_limit?: number;
          p_offset?: number;
          p_query?: string;
          p_sort?: string;
          p_tags?: string[];
        };
        Returns: {
          _featured: Json;
          author: string;
          author_profile_url: string;
          bookmark_count: number;
          category: string;
          combined_score: number;
          copyCount: number;
          created_at: string;
          date_added: string;
          description: string;
          examples: Json;
          features: Json;
          id: string;
          relevance_score: number;
          slug: string;
          source: string;
          tags: string[];
          title: string;
          updated_at: string;
          use_cases: Json;
          viewCount: number;
        }[];
      };
      search_jobs: {
        Args: { result_limit?: number; search_query: string };
        Returns: {
          active: boolean | null;
          admin_notes: string | null;
          benefits: Json;
          category: string;
          click_count: number | null;
          company: string;
          company_id: string | null;
          company_logo: string | null;
          contact_email: string | null;
          created_at: string;
          description: string;
          experience: string | null;
          expires_at: string | null;
          featured: boolean | null;
          id: string;
          link: string;
          location: string | null;
          order: number | null;
          payment_amount: number | null;
          payment_date: string | null;
          payment_method: string | null;
          payment_reference: string | null;
          payment_status: string;
          plan: string;
          posted_at: string | null;
          remote: boolean | null;
          requirements: Json;
          salary: string | null;
          search_vector: unknown;
          slug: string;
          status: Database['public']['Enums']['job_status'];
          tags: Json;
          title: string;
          type: string;
          updated_at: string;
          user_id: string | null;
          view_count: number | null;
          workplace: string | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'jobs';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      search_users: {
        Args: { result_limit?: number; search_query: string };
        Returns: {
          bio: string | null;
          bookmark_count: number;
          created_at: string;
          display_name: string | null;
          email: string | null;
          follow_email: boolean | null;
          follower_count: number;
          following_count: number;
          hero: string | null;
          id: string;
          image: string | null;
          interests: Json | null;
          name: string | null;
          profile_public: boolean | null;
          public: boolean | null;
          search_vector: unknown;
          slug: string | null;
          social_x_link: string | null;
          status: string | null;
          submission_count: number;
          tier: string | null;
          updated_at: string;
          website: string | null;
          work: string | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'users';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
      slug_to_title: { Args: { p_slug: string }; Returns: string };
      submit_content_for_review: {
        Args: {
          p_author: string;
          p_author_profile_url?: string;
          p_category: string;
          p_content_data: Json;
          p_description: string;
          p_github_url?: string;
          p_name: string;
          p_submission_type: string;
          p_tags?: string[];
        };
        Returns: Json;
      };
      subscribe_newsletter: {
        Args: {
          p_copy_category?: string;
          p_copy_slug?: string;
          p_copy_type?: string;
          p_email: string;
          p_ip_address?: unknown;
          p_referrer?: string;
          p_source?: string;
          p_user_agent?: string;
        };
        Returns: Json;
      };
      suggest_vacuum_commands: {
        Args: { p_min_bloat_ratio?: number };
        Returns: {
          bloat_ratio: number;
          dead_tuples: number;
          tablename: string;
          vacuum_command: string;
        }[];
      };
      toggle_follow: {
        Args: {
          p_action: string;
          p_follower_id: string;
          p_following_id: string;
        };
        Returns: Json;
      };
      toggle_review_helpful: {
        Args: { p_helpful: boolean; p_review_id: string; p_user_id: string };
        Returns: Json;
      };
      track_content_usage: {
        Args: {
          p_action_type: string;
          p_content_slug: string;
          p_content_type: string;
          p_user_id?: string;
        };
        Returns: undefined;
      };
      track_sponsored_event: {
        Args: { p_data: Json; p_event_type: string; p_user_id: string };
        Returns: Json;
      };
      unaccent: { Args: { '': string }; Returns: string };
      update_user_profile: {
        Args: {
          p_bio?: string;
          p_display_name?: string;
          p_follow_email?: boolean;
          p_interests?: Json;
          p_profile_public?: boolean;
          p_social_x_link?: string;
          p_user_id: string;
          p_website?: string;
          p_work?: string;
        };
        Returns: Json;
      };
      validate_content_metadata: { Args: { metadata: Json }; Returns: boolean };
    };
    Enums: {
      announcement_priority: 'high' | 'medium' | 'low';
      announcement_variant: 'default' | 'outline' | 'secondary' | 'destructive';
      changelog_category: 'Added' | 'Changed' | 'Deprecated' | 'Removed' | 'Fixed' | 'Security';
      content_category:
        | 'agents'
        | 'mcp'
        | 'rules'
        | 'commands'
        | 'hooks'
        | 'statuslines'
        | 'skills'
        | 'collections'
        | 'guides'
        | 'jobs'
        | 'changelog';
      experience_level: 'beginner' | 'intermediate' | 'advanced';
      field_scope: 'common' | 'type_specific' | 'tags';
      field_type: 'text' | 'textarea' | 'number' | 'select';
      focus_area_type:
        | 'security'
        | 'performance'
        | 'documentation'
        | 'testing'
        | 'code-quality'
        | 'automation';
      form_field_type: 'text' | 'textarea' | 'number' | 'select';
      form_grid_column: 'full' | 'half' | 'third' | 'two-thirds';
      form_icon_position: 'left' | 'right';
      grid_column: 'full' | 'half' | 'third' | 'two-thirds';
      guide_subcategory:
        | 'tutorials'
        | 'comparisons'
        | 'workflows'
        | 'use-cases'
        | 'troubleshooting';
      icon_position: 'left' | 'right';
      integration_type:
        | 'github'
        | 'database'
        | 'cloud-aws'
        | 'cloud-gcp'
        | 'cloud-azure'
        | 'communication'
        | 'none';
      interaction_type:
        | 'view'
        | 'copy'
        | 'bookmark'
        | 'click'
        | 'time_spent'
        | 'search'
        | 'filter'
        | 'screenshot'
        | 'share'
        | 'embed_generated'
        | 'download';
      job_status: 'draft' | 'pending_review' | 'active' | 'expired' | 'rejected';
      newsletter_source:
        | 'footer'
        | 'homepage'
        | 'modal'
        | 'content_page'
        | 'inline'
        | 'post_copy'
        | 'resend_import';
      notification_priority: 'high' | 'medium' | 'low';
      notification_type: 'announcement' | 'feedback';
      sort_direction: 'asc' | 'desc';
      sort_option:
        | 'relevance'
        | 'date'
        | 'popularity'
        | 'name'
        | 'updated'
        | 'created'
        | 'views'
        | 'trending';
      submission_status: 'pending' | 'approved' | 'rejected' | 'spam' | 'merged';
      submission_type: 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'statuslines' | 'skills';
      trending_metric: 'views' | 'likes' | 'shares' | 'downloads' | 'all';
      trending_period: 'today' | 'week' | 'month' | 'year' | 'all';
      use_case_type:
        | 'code-review'
        | 'api-development'
        | 'frontend-development'
        | 'data-science'
        | 'content-creation'
        | 'devops-infrastructure'
        | 'general-development'
        | 'testing-qa'
        | 'security-audit';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      announcement_priority: ['high', 'medium', 'low'],
      announcement_variant: ['default', 'outline', 'secondary', 'destructive'],
      changelog_category: ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'],
      content_category: [
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
      ],
      experience_level: ['beginner', 'intermediate', 'advanced'],
      field_scope: ['common', 'type_specific', 'tags'],
      field_type: ['text', 'textarea', 'number', 'select'],
      focus_area_type: [
        'security',
        'performance',
        'documentation',
        'testing',
        'code-quality',
        'automation',
      ],
      form_field_type: ['text', 'textarea', 'number', 'select'],
      form_grid_column: ['full', 'half', 'third', 'two-thirds'],
      form_icon_position: ['left', 'right'],
      grid_column: ['full', 'half', 'third', 'two-thirds'],
      guide_subcategory: ['tutorials', 'comparisons', 'workflows', 'use-cases', 'troubleshooting'],
      icon_position: ['left', 'right'],
      integration_type: [
        'github',
        'database',
        'cloud-aws',
        'cloud-gcp',
        'cloud-azure',
        'communication',
        'none',
      ],
      interaction_type: [
        'view',
        'copy',
        'bookmark',
        'click',
        'time_spent',
        'search',
        'filter',
        'screenshot',
        'share',
        'embed_generated',
        'download',
      ],
      job_status: ['draft', 'pending_review', 'active', 'expired', 'rejected'],
      newsletter_source: [
        'footer',
        'homepage',
        'modal',
        'content_page',
        'inline',
        'post_copy',
        'resend_import',
      ],
      notification_priority: ['high', 'medium', 'low'],
      notification_type: ['announcement', 'feedback'],
      sort_direction: ['asc', 'desc'],
      sort_option: [
        'relevance',
        'date',
        'popularity',
        'name',
        'updated',
        'created',
        'views',
        'trending',
      ],
      submission_status: ['pending', 'approved', 'rejected', 'spam', 'merged'],
      submission_type: ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'skills'],
      trending_metric: ['views', 'likes', 'shares', 'downloads', 'all'],
      trending_period: ['today', 'week', 'month', 'year', 'all'],
      use_case_type: [
        'code-review',
        'api-development',
        'frontend-development',
        'data-science',
        'content-creation',
        'devops-infrastructure',
        'general-development',
        'testing-qa',
        'security-audit',
      ],
    },
  },
} as const;
