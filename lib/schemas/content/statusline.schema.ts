/**
 * Statusline Content Schema
 *
 * Schema for statusline configurations that customize the Claude Code CLI status bar.
 * Statuslines provide real-time session information and customizable visual themes.
 *
 * Phase 4: Dynamic routes migration - new category addition
 */

import { z } from 'zod';
import {
  baseContentMetadataSchema,
  baseInstallationSchema,
  baseTroubleshootingSchema,
} from '@/lib/schemas/content/base-content.schema';
import { limitedMediumStringArray } from '@/lib/schemas/primitives/base-arrays';
import { mediumString } from '@/lib/schemas/primitives/base-strings';

/**
 * Statusline Configuration Schema
 *
 * Configuration object for statusline metadata settings.
 * Script content is stored in the top-level 'content' field (inherited from baseContentMetadataSchema).
 */
const statuslineConfigSchema = z.object({
  format: z.enum(['bash', 'python', 'javascript']).optional(),
  refreshInterval: z.number().min(100).max(60000).optional(), // 100ms to 60s
  position: z.enum(['left', 'center', 'right']).optional(),
  colorScheme: mediumString.optional(),
});

/**
 * Statusline Content Schema
 *
 * Matches statusline JSON structure for CLI customization.
 * Uses Zod v4 shape destructuring pattern for composition with base content schema.
 *
 * Inherited Fields from baseContentMetadataSchema:
 * - slug: URL-safe identifier
 * - description: Statusline description
 * - author: Content creator
 * - dateAdded: ISO date when statusline was added
 * - tags: Required array of tags
 * - content: THE STATUSLINE SCRIPT (bash/python/javascript)
 * - title: Optional display title
 * - source: Content source type
 * - documentationUrl: Optional external documentation link
 * - features: Optional list of features
 * - useCases: Optional list of use cases
 *
 * Statusline-Specific Required Fields:
 * - category: Literal 'statuslines' for type discrimination
 * - statuslineType: Type of statusline (minimal, powerline, custom, etc.)
 * - configuration: Statusline metadata settings (format, refresh rate, position, colors)
 *
 * Statusline-Specific Optional Fields:
 * - installation: Installation steps using baseInstallationSchema
 * - troubleshooting: Array of common issues and solutions (max 20)
 * - requirements: List of requirements for the statusline
 * - preview: Optional preview text/example output
 *
 * Statusline Types:
 * - minimal: Simple text-based statusline
 * - powerline: Powerline-style with segments and symbols
 * - custom: Fully customized statusline script
 */
export const statuslineContentSchema = z.object({
  // Inherit all base content metadata fields using shape destructuring (Zod v4 best practice)
  ...baseContentMetadataSchema.shape,

  // Statusline-specific required fields
  category: z.literal('statuslines'),
  statuslineType: z.enum(['minimal', 'powerline', 'custom', 'rich', 'simple']),

  // Statusline configuration (script content and settings)
  configuration: statuslineConfigSchema,

  // Statusline-specific optional fields
  installation: baseInstallationSchema.optional(),
  troubleshooting: z.array(baseTroubleshootingSchema).max(20).optional(),
  requirements: limitedMediumStringArray.optional(),
  preview: mediumString.optional(), // Example output or preview text
});

export type StatuslineContent = z.infer<typeof statuslineContentSchema>;
