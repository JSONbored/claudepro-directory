/**
 * Profile Schema
 * Validation schemas for user profile updates
 */

import { z } from 'zod';

/**
 * Profile update schema
 * Used for updating user profile information
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional().nullable(),
  work: z.string().max(100, 'Work must be less than 100 characters').optional().nullable(),
  website: z.string().url('Website must be a valid URL').or(z.literal('')).optional().nullable(),
  social_x_link: z
    .string()
    .url('X/Twitter link must be a valid URL')
    .or(z.literal(''))
    .optional()
    .nullable(),
  interests: z.array(z.string().min(1).max(30)).max(10, 'Maximum 10 interests allowed').optional(),
  public: z.boolean().optional(),
  follow_email: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Profile data type from database
 */
export type ProfileData = {
  id: string;
  email: string | null;
  name: string | null;
  slug: string | null;
  image: string | null;
  hero: string | null;
  bio: string | null;
  work: string | null;
  website: string | null;
  social_x_link: string | null;
  interests: string[];
  reputation_score: number;
  tier: 'free' | 'pro' | 'enterprise';
  status: string;
  public: boolean;
  follow_email: boolean;
  created_at: string;
  updated_at: string;
};
