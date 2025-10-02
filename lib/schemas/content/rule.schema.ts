/**
 * Rule Content Schema
 * Based on actual rule JSON files structure and rules template
 *
 * Uses Zod v4 shape destructuring pattern for composition with base content schema.
 * This approach is more tsc-efficient than .extend() and follows Zod best practices.
 *
 * Phase 2: Content Schema Consolidation
 * - Eliminates duplication by inheriting from base-content.schema.ts
 * - Uses shape destructuring for optimal TypeScript performance
 * - Maintains all rule-specific validation logic
 */

import { z } from 'zod';
import {
  baseConfigurationSchema,
  baseContentMetadataSchema,
  baseTroubleshootingSchema,
} from '@/lib/schemas/content/base-content.schema';
import { limitedMediumStringArray } from '@/lib/schemas/primitives/base-arrays';
import { codeString, mediumString } from '@/lib/schemas/primitives/base-strings';

/**
 * Rule Example Schema
 *
 * Structured example showing how to use a rule effectively.
 * Includes prompt and expected outcome for demonstration purposes.
 */
const ruleExampleSchema = z
  .object({
    title: z.string().max(200).describe('Example title or name'),
    description: mediumString.describe('Description of what the example demonstrates'),
    prompt: codeString.describe('Example prompt or input that uses the rule'),
    expectedOutcome: codeString.describe('Expected result or outcome from using the rule'),
  })
  .describe(
    'Structured example demonstrating how to use a rule effectively with prompt and expected outcome.'
  );

// Rule troubleshooting now uses baseTroubleshootingSchema from base-content.schema.ts
// Removed local ruleTroubleshootingSchema definition to reduce duplication
// Note: Previously supported union[string, object] but now standardized to object only

/**
 * Rule content schema - matches actual production rule JSON structure
 *
 * Inherits common fields from baseContentMetadataSchema via shape destructuring:
 * - slug: URL-safe identifier for the rule
 * - description: Clear explanation of what the rule does
 * - author: Rule creator or maintainer
 * - dateAdded: ISO date when rule was added
 * - tags: Required array of tags for categorization and search
 * - content: Main rule content body (markdown supported)
 * - title: Optional display title (often auto-generated from slug)
 * - source: Content source type (community, official, verified, claudepro)
 * - documentationUrl: Optional link to external documentation
 * - features: Optional list of key features this rule provides
 * - useCases: Optional list of scenarios where this rule is useful
 *
 * Rule-specific additions:
 * - category: 'rules' literal for type discrimination
 * - configuration: AI model settings (temperature, maxTokens, systemPrompt)
 * - githubUrl: Optional GitHub repository link for rule source
 * - requirements: List of prerequisites or dependencies
 * - examples: Usage examples (simple strings or structured objects)
 * - troubleshooting: Common issues and solutions
 * - relatedRules: Links to related rules for cross-reference
 * - expertiseAreas: Domains or topics this rule applies to
 * - difficultyLevel: Skill level required to use this rule effectively
 */
export const ruleContentSchema = z
  .object({
    // Inherit all base content metadata fields using shape destructuring (Zod v4 best practice)
    ...baseContentMetadataSchema.shape,

    // Rule-specific required fields
    category: z.literal('rules').describe('Content category literal identifier: "rules"'),

    // Rule-specific optional fields
    configuration: baseConfigurationSchema
      .optional()
      .describe('Optional AI model configuration settings (temperature, maxTokens, systemPrompt)'),

    // GitHub URL with validation
    githubUrl: z
      .string()
      .url()
      .refine((url) => url.includes('github.com'), { message: 'Must be a GitHub URL' })
      .optional()
      .describe('Optional GitHub repository URL for rule source code or additional documentation'),

    // Prerequisites and dependencies
    requirements: limitedMediumStringArray
      .optional()
      .describe('Optional list of prerequisites or dependencies required to use this rule'),

    // Examples and troubleshooting guidance
    examples: z
      .array(z.union([codeString, ruleExampleSchema]))
      .max(10)
      .optional()
      .describe(
        'Optional array of usage examples (simple strings or structured example objects, max 10)'
      ),
    troubleshooting: z
      .array(baseTroubleshootingSchema)
      .max(20)
      .optional()
      .describe('Optional array of common issues and solutions (max 20)'),

    // Rule metadata for organization and discovery
    relatedRules: z
      .array(z.string())
      .max(20)
      .optional()
      .describe('Optional list of related rule slugs for cross-reference (max 20)'),
    expertiseAreas: z
      .array(z.string().max(200))
      .max(10)
      .optional()
      .describe('Optional list of domains or topics this rule applies to (max 10)'),
    // difficultyLevel removed - unused field (only in 1 content file + template)
  })
  .describe(
    'Rule content schema for Claude Code rules and conventions. Inherits base content metadata and adds rule-specific fields including AI configuration, examples, troubleshooting, and related rules.'
  );

export type RuleContent = z.infer<typeof ruleContentSchema>;
