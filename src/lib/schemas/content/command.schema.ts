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
} from '@/src/lib/schemas/content/base-content.schema';
import { optionalGithubUrl } from '@/src/lib/schemas/primitives/base-strings';

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
export const commandContentSchema = z
  .object({
    ...baseContentMetadataSchema.shape,
    category: z.literal('commands').describe('Content category literal identifier: "commands"'),

    // Command-specific fields
    name: z
      .string()
      .optional()
      .describe('Optional display name for the command (used in UI components)'), // display name for components
    configuration: baseConfigurationSchema
      .optional()
      .describe('Optional AI model configuration settings (temperature, maxTokens, systemPrompt)'),

    // GitHub URL with strict hostname validation (uses shared primitive)
    githubUrl: optionalGithubUrl,

    // Installation and setup
    installation: baseInstallationSchema
      .optional()
      .describe('Optional platform-specific installation instructions'),

    // argumentTypes and frontmatterOptions removed - unused fields
  })
  .describe(
    'Command content schema for Claude Code slash commands. Inherits base content metadata and adds command-specific fields including configuration, installation, and examples.'
  );

export type CommandContent = z.infer<typeof commandContentSchema>;
