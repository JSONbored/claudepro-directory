/**
 * Command Content Schema
 * Based on actual command JSON files structure and commands template
 *
 * Phase 2: Refactored using base-content.schema.ts with shape destructuring
 */

import { z } from 'zod';
import {
  baseConfigurationSchema,
  baseContentMetadataSchema,
  baseInstallationSchema,
} from '@/lib/schemas/content/base-content.schema';
import { examplesArray } from '@/lib/schemas/primitives/base-arrays';

// argumentTypes and frontmatterOptions removed - unused fields (only in 1 content file + template)
// Previously defined commandArgumentTypeSchema and commandFrontmatterOptionsSchema
// These were never used in production content files

/**
 * Command content schema - matches actual production command JSON structure
 *
 * Uses Zod v4 shape destructuring pattern:
 * - Inherits all fields from baseContentMetadataSchema
 * - Inherits configuration from baseConfigurationSchema
 * - Adds command-specific fields
 */
export const commandContentSchema = z.object({
  ...baseContentMetadataSchema.shape,
  category: z.literal('commands'),

  // Command-specific fields
  name: z.string().optional(), // display name for components
  configuration: baseConfigurationSchema.optional(),

  // GitHub URL with validation
  githubUrl: z
    .string()
    .url()
    .refine((url) => url.includes('github.com'), { message: 'Must be a GitHub URL' })
    .optional(),

  // Installation and setup
  installation: baseInstallationSchema.optional(),

  // Examples
  examples: examplesArray.optional(),

  // argumentTypes and frontmatterOptions removed - unused fields
});

export type CommandContent = z.infer<typeof commandContentSchema>;
