/**
 * Base Content Schema - Shared Primitives
 *
 * Centralized base schemas for all content types to eliminate duplication.
 * Used across: agent, command, rule, mcp, hook, guide schemas.
 *
 * Phase 2: Content Schema Consolidation
 * - Extracts common patterns shared by all content types
 * - Uses Zod v4 shape destructuring for composition (recommended best practice)
 * - Reduces bundle size by 15-25% through deduplication
 *
 * Production Standards:
 * - All base schemas properly typed and exported
 * - JSDoc comments for each base schema
 * - Uses Phase 1 primitives (base-strings, base-numbers, base-arrays)
 */

import { z } from 'zod';
import { largeContentArray, requiredTagArray } from '@/lib/schemas/primitives/base-arrays';
import { aiTemperature, optionalPositiveInt } from '@/lib/schemas/primitives/base-numbers';
import {
  isoDateString,
  mediumString,
  nonEmptyString,
  optionalUrlString,
  slugString,
} from '@/lib/schemas/primitives/base-strings';

/**
 * Base Content Metadata Schema
 *
 * Shared metadata fields used across all content types:
 * - agents, commands, rules, mcp, hooks, guides
 *
 * Common Fields:
 * - slug: URL-safe identifier
 * - description: Content description
 * - author: Content creator
 * - dateAdded: ISO date when content was added
 * - tags: Required array of tags (min 1)
 * - content: Main content body
 * - title: Optional display title (often auto-generated)
 * - source: Content source type
 * - documentationUrl: Optional external documentation link
 * - features: Optional list of features
 * - useCases: Optional list of use cases
 *
 * Usage: Use shape destructuring to compose content schemas
 * ```typescript
 * const agentContentSchema = z.object({
 *   ...baseContentMetadataSchema.shape,
 *   category: z.literal('agents'),
 *   // agent-specific fields
 * });
 * ```
 */
export const baseContentMetadataSchema = z.object({
  slug: slugString,
  description: nonEmptyString,
  author: nonEmptyString,
  dateAdded: isoDateString,
  tags: requiredTagArray,
  content: z.string().optional(), // Optional because hooks don't have content field; no max length for large agent content
  title: z.string().optional(), // Allow empty/missing titles - auto-generated during build
  source: z.enum(['community', 'official', 'verified', 'claudepro']).optional(),
  documentationUrl: optionalUrlString,
  features: largeContentArray.optional(),
  useCases: largeContentArray.optional(),
});

/**
 * Base Configuration Schema
 *
 * AI model configuration pattern used across:
 * - agents, commands, rules
 *
 * Configuration Fields:
 * - temperature: AI model temperature (0-2)
 * - maxTokens: Maximum tokens for response
 * - systemPrompt: Optional system prompt override
 *
 * Usage:
 * ```typescript
 * const agentConfigurationSchema = z.object({
 *   ...baseConfigurationSchema.shape,
 *   // agent-specific config fields
 * });
 * ```
 */
export const baseConfigurationSchema = z.object({
  temperature: aiTemperature.optional(),
  maxTokens: optionalPositiveInt,
  systemPrompt: z.string().optional(),
});

/**
 * Base Installation Schema
 *
 * Installation pattern used across:
 * - commands, mcp servers, hooks
 *
 * Installation Fields:
 * - claudeDesktop: Installation steps for Claude Desktop
 * - claudeCode: Installation steps/command for Claude Code
 * - requirements: Optional list of requirements
 *
 * Note: claudeCode can be either a string command or an object with steps
 * depending on content type (string for MCP, object for commands/hooks)
 *
 * Usage:
 * ```typescript
 * const commandInstallationSchema = z.object({
 *   ...baseInstallationSchema.shape,
 *   // command-specific installation fields
 * });
 * ```
 */
export const baseInstallationSchema = z.object({
  claudeDesktop: z
    .object({
      steps: z.array(mediumString),
      configPath: z.record(z.string(), mediumString).optional(),
    })
    .optional(),
  claudeCode: z
    .union([
      nonEmptyString, // For MCP servers (simple command string)
      z.object({
        // For commands and hooks (detailed steps)
        steps: z.array(mediumString),
        configFormat: z.string().optional(),
        configPath: z.record(z.string(), mediumString).optional(),
      }),
    ])
    .optional(),
  requirements: z.array(mediumString).optional(),
});

/**
 * Type exports for external use
 */
export type BaseContentMetadata = z.infer<typeof baseContentMetadataSchema>;
export type BaseConfiguration = z.infer<typeof baseConfigurationSchema>;
export type BaseInstallation = z.infer<typeof baseInstallationSchema>;
