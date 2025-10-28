/**
 * Personalization Engine - Type Definitions
 * Shared types for personalization features
 */

import type { ContentItem } from '@/src/lib/content/supabase-content-loader';

/**
 * Content item with personalization metadata
 */
export interface PersonalizedContentItem extends ContentItem {
  affinity_score?: number;
  similarity_score?: number;
  recommendation_source?:
    | 'affinity'
    | 'collaborative'
    | 'trending'
    | 'interest'
    | 'similar'
    | 'usage';
  recommendation_reason?: string;
}

/**
 * User interaction summary for affinity calculation
 */
export interface InteractionSummary {
  views: number;
  bookmarks: number;
  copies: number;
  time_spent_seconds: number;
  last_interaction: Date;
  first_interaction: Date;
}

/**
 * Affinity calculation result
 */
export interface AffinityCalculation {
  content_type: string;
  content_slug: string;
  affinity_score: number;
  breakdown: {
    views: number;
    bookmarks: number;
    copies: number;
    time_spent: number;
    recency_boost: number;
  };
}

/**
 * User preference profile
 */
export interface UserPreferences {
  favorite_categories: string[];
  interests: string[];
  average_session_duration: number;
  interaction_count: number;
}

/**
 * Recommendation weight configuration
 */
export interface RecommendationWeights {
  affinity: number;
  collaborative: number;
  trending: number;
  interest: number;
  diversity: number;
}
