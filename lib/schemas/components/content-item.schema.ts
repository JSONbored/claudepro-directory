/**
 * Master Component Content Schema
 * This creates a unified interface for components that includes ALL possible properties
 * from all content types, with proper optional handling for TypeScript strict mode
 */

import { z } from 'zod';
import { stringArray } from '@/lib/schemas/primitives/base-arrays';
import { optionalUrlString } from '@/lib/schemas/primitives/base-strings';

/**
 * Unified content item schema for components
 * This includes ALL properties that any content type might have
 * Components can access any property safely with proper typing
 */
export const unifiedContentItemSchema = z
  .object({
    // Base properties (common to all content types)
    slug: z.string().describe('Unique URL-friendly identifier for the content item'),
    description: z.string().describe('Brief summary or overview of the content item'),
    category: z
      .enum([
        'agents',
        'mcp',
        'rules',
        'commands',
        'hooks',
        'guides',
        'jobs',
        'statuslines',
        // Guide subcategories from guide.schema.ts
        'tutorials',
        'comparisons',
        'troubleshooting',
        'use-cases',
        'workflows',
        'categories',
        'collections',
      ])
      .describe('Content type category or subcategory for classification and filtering'),
    author: z.string().describe('Name or identifier of the content creator or contributor'),
    dateAdded: z
      .string()
      .optional()
      .describe('ISO date string when content was added to the directory'), // Optional for guides
    tags: stringArray
      .optional()
      .describe('List of keywords or topics for categorization and search'), // Required in individual schemas, but optional here for flexibility

    // Optional properties that may exist on different content types
    title: z
      .string()
      .optional()
      .describe('Display title for the content item, auto-generated for some types'), // guides, auto-generated for others
    name: z.string().optional().describe('Auto-generated display name derived from slug or title'), // auto-generated display name
    content: z
      .string()
      .optional()
      .describe('Full markdown or text content for long-form content types'), // long form content
    lastModified: z.string().optional().describe('ISO date string when content was last updated'), // last modification date

    // Source and metadata
    source: z
      .enum(['community', 'official', 'verified', 'claudepro'])
      .optional()
      .describe('Origin or verification status of the content'),

    // Features and capabilities
    features: stringArray.optional().describe('List of key features or capabilities provided'),
    useCases: stringArray.optional().describe('Common use cases or application scenarios'),
    requirements: stringArray.optional().describe('Prerequisites or dependencies needed for usage'),

    // URLs and documentation
    documentationUrl: optionalUrlString.describe(
      'External URL to official documentation or resources'
    ),
    githubUrl: optionalUrlString.describe('GitHub repository URL for source code or project'),

    // Configuration (flexible for different types)
    configuration: z
      .record(z.string().describe('Configuration key'), z.any())
      .optional()
      .describe('Flexible configuration object with type-specific settings'),

    // Hook-specific properties
    hookType: z
      .enum([
        'PostToolUse',
        'PreToolUse',
        'SessionStart',
        'SessionEnd',
        'UserPromptSubmit',
        'Notification',
        'PreCompact',
        'Stop',
        'SubagentStop',
      ])
      .optional()
      .describe('Type of hook lifecycle event for Claude Code extensions'),

    // Statusline-specific properties
    statuslineType: z
      .enum(['minimal', 'powerline', 'custom', 'rich', 'simple'])
      .optional()
      .describe('Visual style or complexity level of the statusline display'),
    preview: z
      .string()
      .optional()
      .describe('Example output, visual preview, or demonstration text'), // Example output or preview text

    // Installation information
    installation: z
      .union([
        z
          .string()
          .describe('Simple installation instructions as plain text'), // simple string format
        z
          .record(z.string().describe('Installation step key'), z.any())
          .describe('Structured installation steps with metadata'), // complex object format
      ])
      .optional()
      .describe('Installation instructions in string or structured format'),

    // Security and troubleshooting
    security: stringArray
      .optional()
      .describe('Security considerations, warnings, or best practices'),
    troubleshooting: z
      .array(
        z.union([
          z.string().describe('Simple troubleshooting tip or common issue'),
          z
            .object({
              issue: z.string().describe('Description of the problem or error'),
              solution: z.string().describe('Step-by-step solution or workaround'),
            })
            .describe('Structured troubleshooting entry with issue and solution'),
        ])
      )
      .optional()
      .describe('List of common issues and their solutions'),

    // Examples and related content (supports both string and object formats)
    examples: z
      .array(
        z.union([
          z
            .string()
            .describe('Simple example usage as plain text'), // MCP uses string format
          z
            .object({
              // Rules use object format
              title: z.string().describe('Short title or name for the example'),
              description: z.string().describe('Explanation of what the example demonstrates'),
              prompt: z.string().describe('Example input, prompt, or code snippet'),
              expectedOutcome: z.string().describe('Expected result or output from the example'),
            })
            .describe('Detailed example with title, description, prompt, and outcome'),
        ])
      )
      .optional()
      .describe('Usage examples in simple or structured format'),

    // MCP-specific properties
    package: z
      .string()
      .nullable()
      .optional()
      .describe('NPM package name or identifier for MCP servers'),
    requiresAuth: z
      .boolean()
      .optional()
      .describe('Whether authentication is required for the MCP server'),
    authType: z
      .enum(['api_key', 'oauth', 'connection_string', 'basic_auth'])
      .optional()
      .describe('Authentication method required for MCP server access'),
    permissions: stringArray
      .optional()
      .describe('List of permissions or scopes required for MCP server'),
    configLocation: z
      .string()
      .optional()
      .describe('File path or location where MCP configuration should be placed'),
    mcpVersion: z.string().optional().describe('MCP protocol version supported by the server'),
    serverType: z
      .enum(['stdio', 'http', 'sse'])
      .optional()
      .describe('Transport protocol used by the MCP server'),
    dataTypes: stringArray
      .optional()
      .describe('Types of data or content handled by the MCP server'),
    toolsProvided: stringArray
      .optional()
      .describe('List of tools or functions exposed by the MCP server'),
    resourcesProvided: stringArray
      .optional()
      .describe('List of resources or data sources accessible via MCP server'),
    transport: z
      .record(z.string().describe('Transport configuration key'), z.any())
      .optional()
      .describe('Transport-specific configuration for MCP server connection'),
    capabilities: z
      .object({
        resources: z.boolean().optional().describe('Whether server supports resource endpoints'),
        tools: z.boolean().optional().describe('Whether server provides tool functions'),
        prompts: z.boolean().optional().describe('Whether server offers prompt templates'),
        logging: z.boolean().optional().describe('Whether server supports logging functionality'),
      })
      .optional()
      .describe('MCP server capability flags indicating supported features'),
    serverInfo: z
      .object({
        name: z.string().describe('Display name of the MCP server'),
        version: z.string().describe('Semantic version of the MCP server implementation'),
        protocol_version: z.string().optional().describe('MCP protocol version string'),
      })
      .optional()
      .describe('Server metadata including name, version, and protocol information'),

    // Rule-specific properties
    relatedRules: stringArray.optional().describe('Slugs of related or complementary rules'),
    expertiseAreas: stringArray.optional().describe('Domains or topics where the rule applies'),
    difficultyLevel: z
      .enum(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
      .optional()
      .describe('Skill level required to understand and apply the rule'),

    // Command-specific properties
    argumentTypes: z
      .array(
        z
          .object({
            name: z.string().describe('Argument name or identifier'),
            description: z.string().describe('Explanation of the argument purpose and usage'),
            example: z.string().optional().describe('Example value or usage of the argument'), // Optional since some commands may not have examples for all args
          })
          .describe('Command argument definition with name, description, and optional example')
      )
      .optional()
      .describe('List of arguments accepted by the command'),
    frontmatterOptions: z
      .record(
        z.string().describe('Frontmatter option key'),
        z.string().describe('Frontmatter option value')
      )
      .optional()
      .describe('Key-value pairs for command frontmatter configuration'),

    // Guide-specific properties
    keywords: stringArray.optional().describe('SEO and search keywords for guide discoverability'),
    readingTime: z.string().optional().describe('Estimated time to read the guide (e.g., "5 min")'),
    difficulty: z
      .union([
        z
          .enum(['beginner', 'intermediate', 'advanced', 'expert'])
          .describe('Standard difficulty level'),
        z
          .string()
          .describe('Custom difficulty description'), // Some guides use dynamic difficulty strings
      ])
      .optional()
      .describe('Skill level required for the guide'),
    featured: z.boolean().optional().describe('Whether guide should be highlighted or promoted'),
    lastReviewed: z
      .string()
      .optional()
      .describe('ISO date string when guide was last reviewed for accuracy'),
    aiOptimized: z
      .boolean()
      .optional()
      .describe('Whether guide content is optimized for AI consumption'),
    citationReady: z
      .boolean()
      .optional()
      .describe('Whether guide includes proper citations and references'),
    relatedGuides: stringArray.optional().describe('Slugs of related or complementary guides'),

    // Component-specific display properties
    type: z
      .string()
      .optional()
      .describe('Component type identifier for display logic and rendering'), // for component display logic
    githubUsername: z.string().optional().describe('GitHub username of the content creator'),
    stars: z.number().optional().describe('GitHub repository star count for popularity metrics'),
    popularity: z.number().optional().describe('Calculated popularity score or ranking'),
    repository: z.string().optional().describe('Repository URL or identifier'),
    documentation: z.string().optional().describe('Documentation URL or markdown content'),
  })
  .describe('Unified schema for all content types with optional type-specific properties');

export type UnifiedContentItem = z.infer<typeof unifiedContentItemSchema>;
