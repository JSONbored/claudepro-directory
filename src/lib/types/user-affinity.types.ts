/**
 * User Affinity Types
 *
 * Centralized type definitions for user affinity entities.
 * Single source of truth for all user affinity type imports.
 *
 * @module types/user-affinity
 */

import type { Database } from '@/src/types/database.types';

/** User Affinity entity from database */
export type UserAffinity = Database['public']['Tables']['user_affinities']['Row'];

/** User Affinity insert payload */
export type UserAffinityInsert = Database['public']['Tables']['user_affinities']['Insert'];

/** User Affinity update payload */
export type UserAffinityUpdate = Database['public']['Tables']['user_affinities']['Update'];

/** Affinity statistics */
export interface AffinityStats {
  total_affinities: number;
  avg_score: number;
  max_score: number;
  by_category: Record<string, { count: number; avg_score: number }>;
  top_content: Array<{
    content_type: string;
    content_slug: string;
    affinity_score: number;
  }>;
}
