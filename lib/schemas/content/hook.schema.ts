/**
 * Hook Content Schema
 * Based on actual hook JSON files structure and hooks template
 *
 * Phase 2: Refactored using base-content.schema.ts with shape destructuring
 */

import { z } from 'zod';
import {
  baseContentMetadataSchema,
  baseInstallationSchema,
} from '@/lib/schemas/content/base-content.schema';
import { limitedMediumStringArray } from '@/lib/schemas/primitives/base-arrays';
import { timeoutMs } from '@/lib/schemas/primitives/base-numbers';
import { massiveString, mediumString, shortString } from '@/lib/schemas/primitives/base-strings';

/**
 * Hook Configuration Schema
 *
 * Individual hook definition with script, matchers, and timeout settings.
 * Used for single hook configurations within the hookConfig object.
 *
 * Fields:
 * - script: Hook script content (medium string)
 * - matchers: Optional array of matcher patterns to filter hook execution
 * - timeout: Optional timeout in milliseconds for hook execution
 * - description: Optional description of the hook's purpose
 */
const hookConfigSchema = z.object({
  script: mediumString,
  matchers: z.array(shortString).optional(),
  timeout: timeoutMs.optional(),
  description: mediumString.optional(),
});

/**
 * Hook Configuration Array Schema
 *
 * Array-based hook configuration for multiple hook definitions.
 * Used when a hook type has multiple configurations that should execute sequentially.
 *
 * Each entry contains:
 * - matchers: Optional array of matcher patterns
 * - description: Optional description
 * - timeout: Optional timeout in milliseconds
 */
const hookConfigArraySchema = z.array(
  z.object({
    matchers: z.array(shortString).optional(),
    description: mediumString.optional(),
    timeout: timeoutMs.optional(),
  })
);

/**
 * Full Hook Configuration Schema
 *
 * Complete hook configuration object containing:
 * - hookConfig: Record of hook types to their configurations (single or array)
 * - scriptContent: Optional external script content (1MB limit)
 *
 * Supports both single and array-based hook configurations for flexibility.
 * Used in the main hook content schema as the configuration field.
 */
const fullHookConfigSchema = z.object({
  hookConfig: z.object({
    hooks: z.record(z.string(), z.union([hookConfigSchema, hookConfigArraySchema])).optional(),
  }),
  scriptContent: massiveString.optional(), // 1MB limit for script content
});

/**
 * Hook Troubleshooting Schema
 *
 * Individual troubleshooting entry for common hook issues.
 * Used in troubleshooting array to provide solutions for known problems.
 *
 * Fields:
 * - issue: Short description of the issue (max 300 characters)
 * - solution: Detailed solution or workaround (medium string)
 */
const hookTroubleshootingSchema = z.object({
  issue: z.string().max(300),
  solution: mediumString,
});

/**
 * Hook Content Schema
 *
 * Matches actual production hook JSON structure.
 * Uses Zod v4 shape destructuring pattern for composition with base content schema.
 *
 * Inherited Fields from baseContentMetadataSchema:
 * - slug: URL-safe identifier
 * - description: Hook description
 * - author: Content creator
 * - dateAdded: ISO date when hook was added
 * - tags: Required array of tags
 * - content: Main content/documentation
 * - title: Optional display title
 * - source: Content source type
 * - documentationUrl: Optional external documentation link
 * - features: Optional list of features
 * - useCases: Optional list of use cases
 *
 * Hook-Specific Required Fields:
 * - category: Literal 'hooks' for type discrimination
 * - hookType: Type of hook (PostToolUse, PreToolUse, SessionStart, etc.)
 * - configuration: Hook configuration with scripts and settings
 *
 * Hook-Specific Optional Fields:
 * - installation: Installation steps using baseInstallationSchema
 * - troubleshooting: Array of common issues and solutions (max 20)
 * - requirements: List of requirements for the hook
 *
 * Hook Types:
 * - PostToolUse: Runs after a tool is used
 * - PreToolUse: Runs before a tool is used
 * - SessionStart: Runs at the start of a session
 * - SessionEnd: Runs at the end of a session
 * - UserPromptSubmit: Runs when user submits a prompt
 * - Notification: Runs for notification events
 * - PreCompact: Runs before context compaction
 * - Stop: Runs when execution stops
 * - SubagentStop: Runs when a subagent stops
 */
export const hookContentSchema = z.object({
  // Inherit all base content metadata fields using shape destructuring (Zod v4 best practice)
  ...baseContentMetadataSchema.shape,

  // Hook-specific required fields
  category: z.literal('hooks'),
  hookType: z.enum([
    'PostToolUse',
    'PreToolUse',
    'SessionStart',
    'SessionEnd',
    'UserPromptSubmit',
    'Notification',
    'PreCompact',
    'Stop',
    'SubagentStop',
  ]),

  // Hook configuration (complex hook setup)
  configuration: fullHookConfigSchema,

  // Hook-specific optional fields
  installation: baseInstallationSchema.optional(),
  troubleshooting: z.array(hookTroubleshootingSchema).max(20).optional(),
  requirements: limitedMediumStringArray.optional(),
});

export type HookContent = z.infer<typeof hookContentSchema>;
