/**
 * Badge Schema
 * Types and schemas for the badge/achievement system
 */

import { z } from 'zod';

/**
 * Badge category enum
 */
export const badgeCategorySchema = z.enum([
  'engagement',
  'contribution',
  'milestone',
  'special',
]);

export type BadgeCategory = z.infer<typeof badgeCategorySchema>;

/**
 * Badge criteria types
 */
export type BadgeCriteria =
  | { type: 'post_count'; threshold: number }
  | { type: 'post_votes'; threshold: number }
  | { type: 'submission_merged'; threshold: number }
  | { type: 'reputation'; threshold: number }
  | { type: 'manual' };

/**
 * Badge from database
 */
export type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  category: BadgeCategory;
  criteria: BadgeCriteria;
  tier_required: 'free' | 'pro' | 'enterprise';
  order: number;
  active: boolean;
  created_at: string;
};

/**
 * User badge (earned badge)
 */
export type UserBadge = {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  metadata: Record<string, any> | null;
  featured: boolean;
};

/**
 * User badge with badge details (joined query)
 */
export type UserBadgeWithDetails = UserBadge & {
  badge: Badge;
};
