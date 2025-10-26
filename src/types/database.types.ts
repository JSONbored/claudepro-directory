export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      badges: {
        Row: {
          active: boolean | null;
          category: string;
          created_at: string;
          criteria: Json;
          description: string;
          icon: string | null;
          id: string;
          name: string;
          order: number | null;
          slug: string;
          tier_required: string | null;
        };
        Insert: {
          active?: boolean | null;
          category: string;
          created_at?: string;
          criteria: Json;
          description: string;
          icon?: string | null;
          id?: string;
          name: string;
          order?: number | null;
          slug: string;
          tier_required?: string | null;
        };
        Update: {
          active?: boolean | null;
          category?: string;
          created_at?: string;
          criteria?: Json;
          description?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          order?: number | null;
          slug?: string;
          tier_required?: string | null;
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
          user_id: string;
        };
        Insert: {
          content_slug: string;
          content_type: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          user_id: string;
        };
        Update: {
          content_slug?: string;
          content_type?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookmarks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'bookmarks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      collection_items: {
        Row: {
          added_at: string;
          collection_id: string;
          content_slug: string;
          content_type: string;
          id: string;
          notes: string | null;
          order: number;
          user_id: string;
        };
        Insert: {
          added_at?: string;
          collection_id: string;
          content_slug: string;
          content_type: string;
          id?: string;
          notes?: string | null;
          order?: number;
          user_id: string;
        };
        Update: {
          added_at?: string;
          collection_id?: string;
          content_slug?: string;
          content_type?: string;
          id?: string;
          notes?: string | null;
          order?: number;
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
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
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
      comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          post_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          post_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          post_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'comments_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'comments_user_id_fkey';
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
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'companies_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
      featured_configs: {
        Row: {
          calculated_at: string;
          calculation_metadata: Json | null;
          content_slug: string;
          content_type: string;
          engagement_score: number | null;
          final_score: number;
          freshness_score: number | null;
          id: string;
          rank: number;
          rating_score: number | null;
          trending_score: number | null;
          week_end: string;
          week_start: string;
        };
        Insert: {
          calculated_at?: string;
          calculation_metadata?: Json | null;
          content_slug: string;
          content_type: string;
          engagement_score?: number | null;
          final_score: number;
          freshness_score?: number | null;
          id?: string;
          rank: number;
          rating_score?: number | null;
          trending_score?: number | null;
          week_end: string;
          week_start: string;
        };
        Update: {
          calculated_at?: string;
          calculation_metadata?: Json | null;
          content_slug?: string;
          content_type?: string;
          engagement_score?: number | null;
          final_score?: number;
          freshness_score?: number | null;
          id?: string;
          rank?: number;
          rating_score?: number | null;
          trending_score?: number | null;
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
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'followers_follower_id_fkey';
            columns: ['follower_id'];
            isOneToOne: false;
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
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
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
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
          slug: string;
          status: string | null;
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
          slug: string;
          status?: string | null;
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
          slug?: string;
          status?: string | null;
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
            foreignKeyName: 'jobs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
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
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'payments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      posts: {
        Row: {
          comment_count: number | null;
          content: string | null;
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          url: string | null;
          user_id: string;
          vote_count: number | null;
        };
        Insert: {
          comment_count?: number | null;
          content?: string | null;
          created_at?: string;
          id?: string;
          title: string;
          updated_at?: string;
          url?: string | null;
          user_id: string;
          vote_count?: number | null;
        };
        Update: {
          comment_count?: number | null;
          content?: string | null;
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          url?: string | null;
          user_id?: string;
          vote_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'posts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
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
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
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
            referencedRelation: 'sponsored_content';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sponsored_clicks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
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
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
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
            referencedRelation: 'sponsored_content';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sponsored_impressions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
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
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
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
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_affinities: {
        Row: {
          affinity_score: number;
          based_on: Json | null;
          calculated_at: string;
          content_slug: string;
          content_type: string;
          id: string;
          user_id: string;
        };
        Insert: {
          affinity_score: number;
          based_on?: Json | null;
          calculated_at?: string;
          content_slug: string;
          content_type: string;
          id?: string;
          user_id: string;
        };
        Update: {
          affinity_score?: number;
          based_on?: Json | null;
          calculated_at?: string;
          content_slug?: string;
          content_type?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_affinities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_affinities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_badges: {
        Row: {
          badge_id: string;
          earned_at: string;
          featured: boolean | null;
          id: string;
          metadata: Json | null;
          user_id: string;
        };
        Insert: {
          badge_id: string;
          earned_at?: string;
          featured?: boolean | null;
          id?: string;
          metadata?: Json | null;
          user_id: string;
        };
        Update: {
          badge_id?: string;
          earned_at?: string;
          featured?: boolean | null;
          id?: string;
          metadata?: Json | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_badges_badge_id_fkey';
            columns: ['badge_id'];
            isOneToOne: false;
            referencedRelation: 'badges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_badges_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_badges_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
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
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
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
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
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
            foreignKeyName: 'user_mcps_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
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
          id: string;
          similarity_score: number;
          user_a_id: string;
          user_b_id: string;
        };
        Insert: {
          calculated_at?: string;
          common_items?: number | null;
          id?: string;
          similarity_score: number;
          user_a_id: string;
          user_b_id: string;
        };
        Update: {
          calculated_at?: string;
          common_items?: number | null;
          id?: string;
          similarity_score?: number;
          user_a_id?: string;
          user_b_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_similarities_user_a_id_fkey';
            columns: ['user_a_id'];
            isOneToOne: false;
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
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
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
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
          created_at: string;
          email: string | null;
          follow_email: boolean | null;
          hero: string | null;
          id: string;
          image: string | null;
          interests: Json | null;
          name: string | null;
          public: boolean | null;
          reputation_score: number | null;
          slug: string | null;
          social_x_link: string | null;
          status: string | null;
          tier: string | null;
          updated_at: string;
          website: string | null;
          work: string | null;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          follow_email?: boolean | null;
          hero?: string | null;
          id: string;
          image?: string | null;
          interests?: Json | null;
          name?: string | null;
          public?: boolean | null;
          reputation_score?: number | null;
          slug?: string | null;
          social_x_link?: string | null;
          status?: string | null;
          tier?: string | null;
          updated_at?: string;
          website?: string | null;
          work?: string | null;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          follow_email?: boolean | null;
          hero?: string | null;
          id?: string;
          image?: string | null;
          interests?: Json | null;
          name?: string | null;
          public?: boolean | null;
          reputation_score?: number | null;
          slug?: string | null;
          social_x_link?: string | null;
          status?: string | null;
          tier?: string | null;
          updated_at?: string;
          website?: string | null;
          work?: string | null;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'votes_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'votes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_stats';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'votes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      user_stats: {
        Row: {
          account_age_days: number | null;
          approved_submissions: number | null;
          avg_rating_given: number | null;
          created_at: string | null;
          featured_badges: number | null;
          public_collections: number | null;
          refreshed_at: string | null;
          reputation_score: number | null;
          total_badges: number | null;
          total_bookmarks: number | null;
          total_collections: number | null;
          total_comments: number | null;
          total_posts: number | null;
          total_reviews: number | null;
          total_submissions: number | null;
          total_upvotes_received: number | null;
          total_votes_given: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      calculate_user_reputation: {
        Args: { target_user_id: string };
        Returns: number;
      };
      check_all_badges: { Args: { target_user_id: string }; Returns: number };
      check_and_award_badge: {
        Args: { badge_slug: string; target_user_id: string };
        Returns: boolean;
      };
      cleanup_old_interactions: { Args: never; Returns: number };
      get_bookmark_counts_by_category: {
        Args: { category_filter: string };
        Returns: {
          bookmark_count: number;
          content_slug: string;
        }[];
      };
      get_popular_posts: {
        Args: { limit_count?: number };
        Returns: {
          body: string;
          comment_count: number;
          content_slug: string;
          content_type: string;
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
          vote_count: number;
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
      is_following: {
        Args: { follower_id: string; following_id: string };
        Returns: boolean;
      };
      refresh_profile_from_oauth: {
        Args: { user_id: string };
        Returns: undefined;
      };
      refresh_user_stat: {
        Args: { p_user_id: string };
        Returns: {
          message: string;
          success: boolean;
          user_id: string;
        }[];
      };
      refresh_user_stats: {
        Args: never;
        Returns: {
          duration_ms: number;
          message: string;
          rows_refreshed: number;
          success: boolean;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
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
    Enums: {},
  },
} as const;
