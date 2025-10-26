/**
 * User Interaction Types
 *
 * Type definitions and schemas for user interaction tracking.
 * Used for personalization, analytics, and recommendation systems.
 */

import { z } from 'zod';

/** Interaction type enum */
export const interactionTypeSchema = z.enum([
  'view',
  'click',
  'bookmark',
  'share',
  'download',
  'like',
  'upvote',
  'downvote',
]);

export type InteractionType = z.infer<typeof interactionTypeSchema>;

/** Interaction statistics */
export interface InteractionStats {
  total_interactions: number;
  unique_users: number;
  by_type: Record<string, number>;
  by_content_type: Record<string, number>;
}
