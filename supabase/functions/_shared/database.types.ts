/**
 * AUTO-GENERATED FILE.
 * Do not edit directly. Instead, update edge-types.manifest.json and run:
 *
 *    pnpm edge:types
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
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
        Relationships: [];
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
        };
        Relationships: [];
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

      changelog: {
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
          metadata: Json | null;
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
          metadata?: Json | null;
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
          metadata?: Json | null;
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
          discord_message_id: string | null;
          experience: string | null;
          expires_at: string | null;
          featured: boolean | null;
          id: string;
          is_placeholder: boolean;
          json_ld: Json | null;
          link: string;
          location: string | null;
          locked_price: number | null;
          order: number | null;
          payment_amount: number | null;
          payment_date: string | null;
          payment_method: string | null;
          payment_reference: string | null;
          payment_status: string;
          plan: string;
          polar_customer_id: string | null;
          polar_order_id: string | null;
          polar_subscription_id: string | null;
          posted_at: string | null;
          remote: boolean | null;
          requirements: Json;
          salary: string | null;
          slug: string;
          status: Database['public']['Enums']['job_status'];
          tags: Json;
          tier: string;
          tier_price: number | null;
          tier_upgraded_at: string | null;
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
          discord_message_id?: string | null;
          experience?: string | null;
          expires_at?: string | null;
          featured?: boolean | null;
          id?: string;
          is_placeholder?: boolean;
          json_ld?: Json | null;
          link: string;
          location?: string | null;
          locked_price?: number | null;
          order?: number | null;
          payment_amount?: number | null;
          payment_date?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_status?: string;
          plan?: string;
          polar_customer_id?: string | null;
          polar_order_id?: string | null;
          polar_subscription_id?: string | null;
          posted_at?: string | null;
          remote?: boolean | null;
          requirements?: Json;
          salary?: string | null;
          slug?: string;
          status?: Database['public']['Enums']['job_status'];
          tags?: Json;
          tier?: string;
          tier_price?: number | null;
          tier_upgraded_at?: string | null;
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
          discord_message_id?: string | null;
          experience?: string | null;
          expires_at?: string | null;
          featured?: boolean | null;
          id?: string;
          is_placeholder?: boolean;
          json_ld?: Json | null;
          link?: string;
          location?: string | null;
          locked_price?: number | null;
          order?: number | null;
          payment_amount?: number | null;
          payment_date?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_status?: string;
          plan?: string;
          polar_customer_id?: string | null;
          polar_order_id?: string | null;
          polar_subscription_id?: string | null;
          posted_at?: string | null;
          remote?: boolean | null;
          requirements?: Json;
          salary?: string | null;
          slug?: string;
          status?: Database['public']['Enums']['job_status'];
          tags?: Json;
          tier?: string;
          tier_price?: number | null;
          tier_upgraded_at?: string | null;
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

      search_unified: {
        Args: {
          p_entities?: string[];
          p_limit?: number;
          p_offset?: number;
          p_query: string;
        };
        Returns: {
          category: string;
          created_at: string;
          description: string;
          engagement_score: number;
          entity_type: string;
          id: string;
          relevance_score: number;
          slug: string;
          tags: string[];
          title: string;
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

      get_weekly_digest: { Args: { p_week_start?: string }; Returns: Json };

      get_due_sequence_emails: { Args: never; Returns: Json };
    };
    Enums: {
      newsletter_source:
        | 'footer'
        | 'homepage'
        | 'modal'
        | 'content_page'
        | 'inline'
        | 'post_copy'
        | 'resend_import'
        | 'oauth_signup';

      notification_priority: 'high' | 'medium' | 'low';

      notification_type: 'announcement' | 'feedback';

      submission_status: 'pending' | 'approved' | 'rejected' | 'spam' | 'merged';

      submission_type: 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'statuslines' | 'skills';

      job_status:
        | 'draft'
        | 'pending_payment'
        | 'pending_review'
        | 'active'
        | 'expired'
        | 'rejected'
        | 'deleted';

      webhook_direction: 'inbound' | 'outbound';

      webhook_source: 'resend' | 'vercel' | 'discord' | 'supabase_db' | 'custom' | 'polar';
    };
  };
}
