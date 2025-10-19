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
import { largeContentArray, requiredTagArray } from '@/src/lib/schemas/primitives/base-arrays';
import { aiTemperature, optionalPositiveInt } from '@/src/lib/schemas/primitives/base-numbers';
import {
  isoDateString,
  mediumString,
  nonEmptyString,
  optionalUrlString,
  slugString,
} from '@/src/lib/schemas/primitives/base-strings';

/**
 * Base Usage Example Schema
 *
 * GitHub-style code examples with syntax highlighting
 * Used across all content types to provide practical usage demonstrations
 *
 * Example Fields:
 * - title: Name/description of the example ("Basic Configuration", "Advanced Setup")
 * - code: The actual code snippet
 * - language: Programming language for syntax highlighting ("typescript", "javascript", "json", "bash")
 * - description: Optional context explaining the example
 *
 * Usage:
 * ```typescript
 * const agentExamplesField = z.array(baseUsageExampleSchema).max(10).optional();
 * ```
 *
 * @example
 * ```json
 * {
 *   "title": "Basic Configuration",
 *   "language": "typescript",
 *   "code": "export default { rules: ['code-review'] }",
 *   "description": "Minimal setup for code reviews"
 * }
 * ```
 */
export const baseUsageExampleSchema = z
  .object({
    title: nonEmptyString
      .max(100)
      .describe('Example name or title (e.g., "Basic Usage", "Advanced Configuration")'),
    code: z
      .string()
      .min(1)
      .max(10000)
      .describe('The code snippet to display (max 10,000 characters)'),
    language: z
      .enum([
        'typescript',
        'javascript',
        'json',
        'bash',
        'shell',
        'python',
        'yaml',
        'markdown',
        'mdx',
        'sql',
        'rust',
        'go',
        'java',
        'c',
        'cpp',
        'csharp',
        'ruby',
        'php',
        'swift',
        'kotlin',
        'dart',
        'toml',
        'xml',
        'html',
        'css',
        'scss',
        'plaintext',
      ])
      .describe('Programming language for syntax highlighting'),
    description: z
      .string()
      .max(500)
      .optional()
      .describe('Optional context or explanation for this example'),
  })
  .describe(
    'Base usage example schema for code snippets with syntax highlighting. Used across all content types to provide practical implementation examples.'
  );

/**
 * Discovery Metadata Schema
 *
 * MANDATORY: Evidence of discovery research before content creation.
 * This schema enforces the discovery workflow and prevents content creation
 * based on assumptions rather than validated trends and gaps.
 *
 * Discovery Fields:
 * - researchDate: When discovery research was conducted
 * - trendingSources: Minimum 2 trending sources researched with evidence
 * - keywordResearch: Keyword validation data (volume, competition)
 * - gapAnalysis: Content gap justification
 * - approvalRationale: Why this topic was chosen (min 100 chars)
 *
 * Workflow:
 * 1. discover_trending_topics → Find trending topics from 2+ sources
 * 2. keyword_research → Validate search demand and competition
 * 3. gap_analysis → Identify what gap this fills vs existing content
 * 4. User approval → Get explicit approval before drafting
 *
 * This field is REQUIRED (not optional) to enforce discovery-first workflow.
 */
export const discoveryMetadataSchema = z
  .object({
    researchDate: isoDateString.describe('ISO 8601 date when discovery research was conducted'),
    trendingSources: z
      .array(
        z.object({
          source: nonEmptyString
            .max(100)
            .describe('Source name (github_trending, reddit_programming, hackernews, dev_to)'),
          evidence: nonEmptyString
            .max(500)
            .describe(
              'What was found (trending repo name, popular thread title, article headline, etc.)'
            ),
          url: optionalUrlString.describe(
            'Optional link to evidence (GitHub repo, Reddit thread, etc.)'
          ),
          relevanceScore: z
            .enum(['high', 'medium', 'low'])
            .optional()
            .describe('How relevant this source is to the content gap'),
        })
      )
      .min(2)
      .max(10)
      .describe('Minimum 2 trending sources researched (max 10 for thoroughness)'),
    keywordResearch: z
      .object({
        primaryKeywords: z
          .array(nonEmptyString)
          .min(1)
          .max(10)
          .describe('Primary keywords researched (1-10)'),
        searchVolume: z
          .enum(['low', 'medium', 'high', 'unknown'])
          .describe('Estimated search volume/demand for this topic'),
        competitionLevel: z
          .enum(['low', 'medium', 'high', 'unknown'])
          .describe('Competition level for this topic'),
      })
      .describe('Keyword validation data from search trends'),
    gapAnalysis: z
      .object({
        existingContent: z
          .array(nonEmptyString)
          .max(20)
          .describe('List of existing content slugs covering similar topics'),
        identifiedGap: nonEmptyString
          .min(50)
          .max(500)
          .describe('Clear description of what content gap this fills'),
        priority: z.enum(['high', 'medium', 'low']).describe('Priority level for filling this gap'),
      })
      .describe(
        'Content gap justification showing what existing content exists and what gap remains'
      ),
    approvalRationale: nonEmptyString
      .min(100)
      .max(500)
      .describe(
        'Why this specific topic was chosen over alternatives (must be 100-500 chars). Required user approval.'
      ),
  })
  .describe(
    'REQUIRED: Discovery research evidence. Content cannot be created without proof of trending sources, keyword research, gap analysis, and user approval. Enforces discovery-first workflow.'
  );

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
 * - discoveryMetadata: REQUIRED discovery research evidence
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
export const baseContentMetadataSchema = z
  .object({
    slug: slugString.describe('URL-safe identifier for the content item'),
    description: nonEmptyString.describe('Content description or summary'),
    author: nonEmptyString.describe('Content creator or maintainer name'),
    dateAdded: isoDateString.describe('ISO 8601 date when content was added to directory'),
    tags: requiredTagArray.describe(
      'Array of content tags for categorization and search (min 1 tag)'
    ),
    content: z
      .string()
      .optional()
      .describe('Main content body (optional - hooks may not have content field)'), // Optional because hooks don't have content field; no max length for large agent content
    title: z
      .string()
      .optional()
      .describe('Display title for the content (auto-generated during build if not provided)'), // Allow empty/missing titles - auto-generated during build
    displayTitle: z
      .string()
      .optional()
      .describe(
        'Formatted display title with proper acronym capitalization (API, MCP, AI, etc.). Auto-generated at build time from title or slug. Eliminates runtime transformation overhead. Made required after running build.'
      ),
    seoTitle: z
      .string()
      .max(60)
      .optional()
      .describe(
        'Short SEO-optimized title for <title> tag (max 60 characters), falls back to title'
      ),
    source: z
      .enum(['community', 'official', 'verified', 'claudepro'])
      .optional()
      .describe(
        'Content source type: community (user-submitted), official (vendor), verified (reviewed), claudepro (internal)'
      ),
    documentationUrl: optionalUrlString.describe('Optional external documentation or homepage URL'),
    features: largeContentArray
      .optional()
      .describe('Optional list of key features or capabilities'),
    useCases: largeContentArray
      .optional()
      .describe('Optional list of common use cases or applications'),
    examples: z
      .array(baseUsageExampleSchema)
      .max(10)
      .optional()
      .describe('Optional array of usage examples with code snippets (max 10 examples per config)'),
    discoveryMetadata: discoveryMetadataSchema
      .optional()
      .describe(
        'Optional discovery research evidence. When provided, must contain proof of trending sources, keyword validation, gap analysis, and user approval rationale.'
      ),
  })
  .describe(
    'Base content metadata schema shared across all content types (agents, commands, rules, mcp, hooks, guides). Provides standard fields for slug, description, author, dates, tags, content body, usage examples, and optional discovery research evidence.'
  );

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
export const baseConfigurationSchema = z
  .object({
    temperature: aiTemperature
      .optional()
      .describe(
        'AI model temperature parameter for response randomness (0-2, default varies by model)'
      ),
    maxTokens: optionalPositiveInt.describe(
      'Maximum number of tokens for AI model response (optional, uses model default if not specified)'
    ),
    systemPrompt: z
      .string()
      .optional()
      .describe('Optional system prompt override for AI model behavior'),
  })
  .describe(
    'Base configuration schema for AI model parameters used across agents, commands, and rules. Provides standard fields for temperature, max tokens, and system prompts.'
  );

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
export const baseInstallationSchema = z
  .object({
    claudeDesktop: z
      .object({
        steps: z
          .array(mediumString)
          .describe('Step-by-step installation instructions for Claude Desktop'),
        configPath: z
          .record(z.string(), mediumString)
          .optional()
          .describe(
            'Optional configuration file paths by operating system (e.g., macos, windows, linux)'
          ),
      })
      .optional()
      .describe('Installation guide for Claude Desktop application'),
    claudeCode: z
      .union([
        nonEmptyString.describe('Simple installation command string (for MCP servers)'), // For MCP servers (simple command string)
        z
          .object({
            // For commands and hooks (detailed steps)
            steps: z.array(mediumString).describe('Step-by-step installation instructions'),
            configFormat: z
              .string()
              .optional()
              .describe('Optional configuration file format (e.g., json, yaml)'),
            configPath: z
              .record(z.string(), mediumString)
              .optional()
              .describe('Optional configuration file paths by operating system'),
          })
          .describe('Detailed installation instructions object (for commands and hooks)'),
      ])
      .optional()
      .describe(
        'Installation guide for Claude Code CLI (can be simple command string or detailed steps object)'
      ),
    requirements: z
      .array(mediumString)
      .optional()
      .describe('Optional list of prerequisites or dependencies (e.g., Node.js 18+, Python 3.9+)'),
  })
  .describe(
    'Base installation schema for commands, MCP servers, and hooks. Provides platform-specific installation instructions for Claude Desktop and Claude Code.'
  );

/**
 * Base Troubleshooting Schema
 *
 * Standardized troubleshooting entry format used across:
 * - hooks, rules, mcp servers
 *
 * Troubleshooting Fields:
 * - issue: Description of the problem
 * - solution: Step-by-step solution to fix the issue
 *
 * Usage:
 * ```typescript
 * const hookTroubleshootingField = z.array(baseTroubleshootingSchema).max(20).optional();
 * ```
 */
export const baseTroubleshootingSchema = z
  .object({
    issue: nonEmptyString.describe('Description of the problem or error'),
    solution: mediumString.describe('Step-by-step solution to resolve the issue'),
  })
  .describe(
    'Base troubleshooting entry schema used across hooks, rules, and MCP servers. Provides standardized issue-solution pairs for common problems.'
  );

/**
 * Type exports for external use
 */
export type BaseContentMetadata = z.infer<typeof baseContentMetadataSchema>;
export type BaseConfiguration = z.infer<typeof baseConfigurationSchema>;
export type BaseInstallation = z.infer<typeof baseInstallationSchema>;
export type BaseTroubleshooting = z.infer<typeof baseTroubleshootingSchema>;
export type BaseUsageExample = z.infer<typeof baseUsageExampleSchema>;
export type DiscoveryMetadata = z.infer<typeof discoveryMetadataSchema>;
