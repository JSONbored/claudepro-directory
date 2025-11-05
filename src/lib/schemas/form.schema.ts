/**
 * Form Validation Schemas - Database-First Architecture
 * Direct mapping to content_submissions table schema.
 * All validation rules from database CHECK constraints.
 */

import type { z } from 'zod';
import { publicContentSubmissionsInsertSchema } from '@/src/lib/schemas/generated/db-schemas';

/**
 * Content submission schema - picks only client-provided fields
 * All other validation rules come from content_submissions CHECK constraints
 * Omits content_data to avoid recursive jsonSchema type complexity
 */
export const configSubmissionSchema = publicContentSubmissionsInsertSchema.pick({
  name: true,
  description: true,
  category: true,
  author: true,
  author_profile_url: true,
  github_url: true,
  tags: true,
  submission_type: true,
});

export type ConfigSubmissionData = z.infer<typeof configSubmissionSchema>;
