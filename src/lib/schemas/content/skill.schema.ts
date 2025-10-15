/**
 * Skill Content Schema
 * Content-first capability guides (e.g., PDF/DOCX/PPTX/XLSX skills).
 *
 * Uses base content primitives; no special config blocks like MCP/Commands/Hooks.
 */

import { z } from 'zod';
import {
  baseContentMetadataSchema,
  baseInstallationSchema,
  baseTroubleshootingSchema,
  baseUsageExampleSchema,
} from '@/src/lib/schemas/content/base-content.schema';
import { limitedMediumStringArray } from '@/src/lib/schemas/primitives/base-arrays';

/**
 * Skill content schema
 * - category literal 'skills'
 * - content-first guide with requirements/examples/installation/troubleshooting
 */
export const skillContentSchema = z
  .object({
    // Base metadata (slug, description, author, dateAdded, tags, content, title, seoTitle, etc.)
    ...baseContentMetadataSchema.shape,

    // Category discriminator
    category: z.literal('skills').describe('Content category literal identifier: "skills"'),

    // Optional fields to document the capability
    requirements: limitedMediumStringArray
      .optional()
      .describe('Optional list of dependencies/tools required for this skill'),
    examples: z
      .array(baseUsageExampleSchema)
      .max(10)
      .optional()
      .describe('Optional code examples (max 10) for this skill'),
    installation: baseInstallationSchema
      .optional()
      .describe('Optional installation/environment setup steps'),
    troubleshooting: z
      .array(baseTroubleshootingSchema)
      .max(20)
      .optional()
      .describe('Optional common issues and solutions (max 20)'),
  })
  .describe(
    'Skill content schema for task-focused capability guides (e.g., PDF, DOCX). Content-first with requirements, examples, and troubleshooting.'
  );

export type SkillContent = z.infer<typeof skillContentSchema>;
