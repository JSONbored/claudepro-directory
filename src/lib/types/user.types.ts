/**
 * User Types
 *
 * Centralized type definitions for user-related entities.
 * Single source of truth for all user type imports.
 *
 * @module types/user
 */

import type { Database } from '@/src/types/database.types';

/** User entity from database */
export type User = Database['public']['Tables']['users']['Row'];

/** User insert payload */
export type UserInsert = Database['public']['Tables']['users']['Insert'];

/** User update payload */
export type UserUpdate = Database['public']['Tables']['users']['Update'];

/** User search result from search_users RPC */
export type UserSearchResult = Database['public']['Functions']['search_users']['Returns'];

/** User profile statistics */
export interface UserStats {
  total_posts: number;
  total_followers: number;
  total_following: number;
  reputation_score: number;
  total_bookmarks: number;
  total_collections: number;
  total_reviews: number;
}
