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
import { codeString, mediumString, shortString } from '@/lib/schemas/primitives/base-strings';

// Argument type definition for commands
const commandArgumentTypeSchema = z.object({
  name: shortString,
  description: mediumString,
  example: codeString,
});

// Frontmatter options for command definition
const commandFrontmatterOptionsSchema = z.record(z.string(), z.string());

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

  // Command-specific metadata
  argumentTypes: z.array(commandArgumentTypeSchema).max(20).optional(),
  frontmatterOptions: commandFrontmatterOptionsSchema.optional(),

  // Examples
  examples: examplesArray.optional(),
});

export type CommandContent = z.infer<typeof commandContentSchema>;
