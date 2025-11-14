/**
 * Minimal database types for Edge Functions
 * Re-exports only what's needed to avoid duplicating the massive database.types.ts file
 *
 * For full types, see src/types/database.types.ts (generated via pnpm generate:types)
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
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
        Relationships: [];
      };
      search_queries: {
        Row: {
          created_at: string;
          filters: Json | null;
          id: string;
          normalized_query: string | null;
          query: string;
          result_count: number | null;
          session_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          filters?: Json | null;
          id?: string;
          normalized_query?: string | null;
          query: string;
          result_count?: number | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          filters?: Json | null;
          id?: string;
          normalized_query?: string | null;
          query?: string;
          result_count?: number | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
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
      get_search_suggestions_from_history: {
        Args: { p_limit?: number; p_query: string };
        Returns: {
          search_count: number;
          suggestion: string;
        }[];
      };
      get_search_facets: {
        Args: never;
        Returns: {
          all_tags: string[];
          author_count: number;
          authors: string[];
          category: string;
          content_count: number;
          tag_count: number;
        }[];
      };
      get_company_profile: {
        Args: { p_slug: string };
        Returns: Json;
      };
      get_weekly_digest: {
        Args: { p_week_start?: string };
        Returns: Json;
      };
      get_due_sequence_emails: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_personalized_feed: {
        Args: { p_user_id: string; p_category?: string; p_limit?: number };
        Returns: Json;
      };
      get_similar_content: {
        Args: { p_content_type: string; p_content_slug: string; p_limit?: number };
        Returns: Json;
      };
      get_trending_metrics: {
        Args: { p_category?: string; p_limit?: number };
        Returns: {
          bookmarks_total: number;
          category: string;
          copies_total: number;
          created_at: string;
          days_old: number;
          engagement_score: number;
          freshness_score: number;
          last_refreshed: string;
          slug: string;
          trending_score: number;
          views_7d: number;
          views_prev_7d: number;
          views_total: number;
        }[];
      };
      get_popular_content: {
        Args: { p_category?: string; p_limit?: number };
        Returns: {
          author: string;
          category: string;
          copy_count: number;
          description: string;
          popularity_score: number;
          slug: string;
          tags: string[];
          title: string;
          view_count: number;
        }[];
      };
      get_usage_recommendations: {
        Args: {
          p_user_id: string;
          p_trigger: string;
          p_content_type?: string;
          p_content_slug?: string;
          p_category?: string;
          p_limit?: number;
        };
        Returns: Json;
      };
      get_content_affinity: {
        Args: { p_user_id: string; p_content_type: string; p_content_slug: string };
        Returns: Json;
      };
      get_user_affinities: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      get_user_favorite_categories: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      generate_metadata_complete: {
        Args: { p_route: string; p_include?: string };
        Returns: Json;
      };
      get_user_recent_interactions: {
        Args: { p_user_id: string; p_limit?: number };
        Returns: Json;
      };
      get_user_interaction_summary: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      get_recommendations: {
        Args: { p_user_profile: Json; p_limit?: number };
        Returns: Json;
      };
      update_user_affinity_scores: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      // LLMs.txt generation functions
      generate_sitewide_llms_txt: {
        Args: never;
        Returns: string;
      };
      generate_category_llms_txt: {
        Args: { p_category: string };
        Returns: string;
      };
      generate_llms_txt_content: {
        Args: { p_category: string; p_slug: string };
        Returns: Json;
      };
      generate_changelog_llms_txt: {
        Args: never;
        Returns: string;
      };
      generate_changelog_entry_llms_txt: {
        Args: { p_slug: string };
        Returns: string;
      };
      generate_tool_llms_txt: {
        Args: { p_tool_name: string };
        Returns: string;
      };
      // Sitemap functions
      generate_sitemap_xml: {
        Args: { p_base_url?: string };
        Returns: string;
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
      // Content API functions
      get_api_content_full: {
        Args: { p_category: string; p_slug: string; p_base_url?: string };
        Returns: string; // Pre-stringified JSON
      };
      generate_markdown_export: {
        Args: {
          p_category: string;
          p_slug: string;
          p_include_metadata?: boolean;
          p_include_footer?: boolean;
        };
        Returns: Json;
      };
      generate_item_llms_txt: {
        Args: { p_category: string; p_slug: string };
        Returns: string;
      };
      generate_readme_data: {
        Args: never;
        Returns: Json;
      };
    };
    Tables: {
      content_submissions: {
        Row: {
          author: string;
          author_profile_url: string | null;
          auto_slug: string | null;
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
          status: string;
          submission_type: string;
          submitter_email: string | null;
          submitter_id: string | null;
          submitter_ip: unknown;
          tags: string[] | null;
          updated_at: string;
        };
        Insert: {
          author: string;
          author_profile_url?: string | null;
          auto_slug?: string | null;
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
          status?: string;
          submission_type: string;
          submitter_email?: string | null;
          submitter_id?: string | null;
          submitter_ip?: unknown;
          tags?: string[] | null;
          updated_at?: string;
        };
        Update: {
          author?: string;
          author_profile_url?: string | null;
          auto_slug?: string | null;
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
          status?: string;
          submission_type?: string;
          submitter_email?: string | null;
          submitter_id?: string | null;
          submitter_ip?: unknown;
          tags?: string[] | null;
          updated_at?: string;
        };
      };
      newsletter_subscriptions: {
        Row: {
          categories_visited: string[] | null;
          confirmation_token: string | null;
          confirmed: boolean | null;
          confirmed_at: string | null;
          consent_given: boolean | null;
          copy_category: string | null;
          copy_slug: string | null;
          copy_type: string | null;
          created_at: string | null;
          email: string;
          engagement_score: number | null;
          id: string;
          ip_address: unknown;
          last_active_at: string | null;
          last_email_sent_at: string | null;
          last_sync_at: string | null;
          preferred_email_frequency: string | null;
          primary_interest: string | null;
          referrer: string | null;
          resend_contact_id: string | null;
          resend_topics: string[] | null;
          source: Database['public']['Enums']['newsletter_source'] | null;
          status: string;
          subscribed_at: string | null;
          sync_error: string | null;
          sync_status: string | null;
          total_copies: number | null;
          unsubscribed_at: string | null;
          updated_at: string | null;
          user_agent: string | null;
        };
        Insert: {
          categories_visited?: string[] | null;
          confirmation_token?: string | null;
          confirmed?: boolean | null;
          confirmed_at?: string | null;
          consent_given?: boolean | null;
          copy_category?: string | null;
          copy_slug?: string | null;
          copy_type?: string | null;
          created_at?: string | null;
          email: string;
          engagement_score?: number | null;
          id?: string;
          ip_address?: unknown;
          last_active_at?: string | null;
          last_email_sent_at?: string | null;
          last_sync_at?: string | null;
          preferred_email_frequency?: string | null;
          primary_interest?: string | null;
          referrer?: string | null;
          resend_contact_id?: string | null;
          resend_topics?: string[] | null;
          source?: Database['public']['Enums']['newsletter_source'] | null;
          status?: string;
          subscribed_at?: string | null;
          sync_error?: string | null;
          sync_status?: string | null;
          total_copies?: number | null;
          unsubscribed_at?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
        };
        Update: {
          categories_visited?: string[] | null;
          confirmation_token?: string | null;
          confirmed?: boolean | null;
          confirmed_at?: string | null;
          consent_given?: boolean | null;
          copy_category?: string | null;
          copy_slug?: string | null;
          copy_type?: string | null;
          created_at?: string | null;
          email?: string;
          engagement_score?: number | null;
          id?: string;
          ip_address?: unknown;
          last_active_at?: string | null;
          last_email_sent_at?: string | null;
          last_sync_at?: string | null;
          preferred_email_frequency?: string | null;
          primary_interest?: string | null;
          referrer?: string | null;
          resend_contact_id?: string | null;
          resend_topics?: string[] | null;
          source?: Database['public']['Enums']['newsletter_source'] | null;
          status?: string;
          subscribed_at?: string | null;
          sync_error?: string | null;
          sync_status?: string | null;
          total_copies?: number | null;
          unsubscribed_at?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
        };
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
          metadata: Json | null;
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
          id?: string;
          message: string;
          metadata?: Json | null;
          priority?: Database['public']['Enums']['notification_priority'];
          title: string;
          type?: Database['public']['Enums']['notification_type'];
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
          metadata?: Json | null;
          priority?: Database['public']['Enums']['notification_priority'];
          title?: string;
          type?: Database['public']['Enums']['notification_type'];
          updated_at?: string;
        };
      };
      webhook_events: {
        Row: {
          created_at: string;
          data: Json;
          direction: Database['public']['Enums']['webhook_direction'];
          error: string | null;
          http_status_code: number | null;
          id: string;
          next_retry_at: string | null;
          processed: boolean | null;
          processed_at: string | null;
          received_at: string | null;
          related_id: string | null;
          response_payload: Json | null;
          retry_count: number | null;
          source: Database['public']['Enums']['webhook_source'];
          svix_id: string | null;
          type: string;
        };
        Insert: {
          created_at: string;
          data?: Json;
          direction?: Database['public']['Enums']['webhook_direction'];
          error?: string | null;
          http_status_code?: number | null;
          id?: string;
          next_retry_at?: string | null;
          processed?: boolean | null;
          processed_at?: string | null;
          received_at?: string | null;
          related_id?: string | null;
          response_payload?: Json | null;
          retry_count?: number | null;
          source?: Database['public']['Enums']['webhook_source'];
          svix_id?: string | null;
          type: string;
        };
        Update: {
          created_at?: string;
          data?: Json;
          direction?: Database['public']['Enums']['webhook_direction'];
          error?: string | null;
          http_status_code?: number | null;
          id?: string;
          next_retry_at?: string | null;
          processed?: boolean | null;
          processed_at?: string | null;
          received_at?: string | null;
          related_id?: string | null;
          response_payload?: Json | null;
          retry_count?: number | null;
          source?: Database['public']['Enums']['webhook_source'];
          svix_id?: string | null;
          type?: string;
        };
        Relationships: [];
      };
      content: {
        Row: {
          id: string;
          category: string;
          slug: string;
          title: string;
          display_title: string | null;
          seo_title: string | null;
          description: string;
          author: string;
          author_profile_url: string | null;
          date_added: string;
          tags: string[] | null;
          content: string | null;
          source: string | null;
          documentation_url: string | null;
          features: string[] | null;
          use_cases: string[] | null;
          examples: Json | null;
          discovery_metadata: Json | null;
          metadata: Json | null;
          git_hash: string | null;
          storage_url: string | null;
        };
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
      };
      changelog_entries: {
        Row: {
          canonical_url: string | null;
          changes: Json;
          commit_count: number | null;
          content: string;
          contributors: string[] | null;
          created_at: string;
          description: string | null;
          featured: boolean;
          git_commit_sha: string | null;
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
          source: string | null;
          title: string;
          tldr: string | null;
          twitter_card: string | null;
          updated_at: string;
        };
        Insert: {
          canonical_url?: string | null;
          changes?: Json;
          commit_count?: number | null;
          content: string;
          contributors?: string[] | null;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          git_commit_sha?: string | null;
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
          source?: string | null;
          title: string;
          tldr?: string | null;
          twitter_card?: string | null;
          updated_at?: string;
        };
        Update: {
          canonical_url?: string | null;
          changes?: Json;
          commit_count?: number | null;
          content?: string;
          contributors?: string[] | null;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          git_commit_sha?: string | null;
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
          source?: string | null;
          title?: string;
          tldr?: string | null;
          twitter_card?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
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
          updated_at: string | null;
          view_count: number | null;
        };
      };
    };
    Enums: {
      job_status: 'draft' | 'pending_review' | 'active' | 'expired' | 'rejected' | 'deleted';
      newsletter_source: 'homepage' | 'content_page' | 'api' | 'import';
      notification_priority: 'high' | 'medium' | 'low';
      notification_type: 'announcement' | 'feedback';
      webhook_direction: 'inbound' | 'outbound';
      webhook_source: 'resend' | 'vercel' | 'discord' | 'supabase_db' | 'custom' | 'polar';
    };
  };
}
