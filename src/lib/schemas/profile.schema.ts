/**
 * Profile Schema
 * Validation schemas for user profile updates
 */

import { z } from 'zod';
import type { Tables } from '@/src/types/database.types';

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
 * Uses generated Supabase types as the source of truth
 *
 * The database schema allows nulls and uses Json for interests.
 * This type accurately reflects what comes from the database.
 */
export type ProfileData = Tables<'users'>;
