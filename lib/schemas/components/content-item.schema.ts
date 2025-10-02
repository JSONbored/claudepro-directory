/**
 * Master Component Content Schema
 * This creates a unified interface for components that includes ALL possible properties
 * from all content types, with proper optional handling for TypeScript strict mode
 */

import { z } from 'zod';
import { stringArray } from '../primitives/base-arrays';
import { optionalUrlString } from '../primitives/base-strings';

/**
 * Unified content item schema for components
 * This includes ALL properties that any content type might have
 * Components can access any property safely with proper typing
 */
export const unifiedContentItemSchema = z.object({
  // Base properties (common to all content types)
  slug: z.string(),
  description: z.string(),
  category: z.enum([
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
  ]),
  author: z.string(),
  dateAdded: z.string().optional(), // Optional for guides
  tags: stringArray.optional(), // Required in individual schemas, but optional here for flexibility

  // Optional properties that may exist on different content types
  title: z.string().optional(), // guides, auto-generated for others
  name: z.string().optional(), // auto-generated display name
  content: z.string().optional(), // long form content
  lastModified: z.string().optional(), // last modification date

  // Source and metadata
  source: z.enum(['community', 'official', 'verified', 'claudepro']).optional(),

  // Features and capabilities
  features: stringArray.optional(),
  useCases: stringArray.optional(),
  requirements: stringArray.optional(),

  // URLs and documentation
  documentationUrl: optionalUrlString,
  githubUrl: optionalUrlString,

  // Configuration (flexible for different types)
  configuration: z.record(z.string(), z.any()).optional(),

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
    .optional(),

  // Statusline-specific properties
  statuslineType: z.enum(['minimal', 'powerline', 'custom', 'rich', 'simple']).optional(),
  preview: z.string().optional(), // Example output or preview text

  // Installation information
  installation: z
    .union([
      z.string(), // simple string format
      z.record(z.string(), z.any()), // complex object format
    ])
    .optional(),

  // Security and troubleshooting
  security: stringArray.optional(),
  troubleshooting: z
    .array(
      z.union([
        z.string(),
        z.object({
          issue: z.string(),
          solution: z.string(),
        }),
      ])
    )
    .optional(),

  // Examples and related content (supports both string and object formats)
  examples: z
    .array(
      z.union([
        z.string(), // MCP uses string format
        z.object({
          // Rules use object format
          title: z.string(),
          description: z.string(),
          prompt: z.string(),
          expectedOutcome: z.string(),
        }),
      ])
    )
    .optional(),

  // MCP-specific properties
  package: z.string().nullable().optional(),
  requiresAuth: z.boolean().optional(),
  authType: z.enum(['api_key', 'oauth', 'connection_string', 'basic_auth']).optional(),
  permissions: stringArray.optional(),
  configLocation: z.string().optional(),
  mcpVersion: z.string().optional(),
  serverType: z.enum(['stdio', 'http', 'sse']).optional(),
  dataTypes: stringArray.optional(),
  toolsProvided: stringArray.optional(),
  resourcesProvided: stringArray.optional(),
  transport: z.record(z.string(), z.any()).optional(),
  capabilities: z
    .object({
      resources: z.boolean().optional(),
      tools: z.boolean().optional(),
      prompts: z.boolean().optional(),
      logging: z.boolean().optional(),
    })
    .optional(),
  serverInfo: z
    .object({
      name: z.string(),
      version: z.string(),
      protocol_version: z.string().optional(),
    })
    .optional(),

  // Rule-specific properties
  relatedRules: stringArray.optional(),
  expertiseAreas: stringArray.optional(),
  difficultyLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),

  // Command-specific properties
  argumentTypes: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        example: z.string().optional(), // Optional since some commands may not have examples for all args
      })
    )
    .optional(),
  frontmatterOptions: z.record(z.string(), z.string()).optional(),

  // Guide-specific properties
  keywords: stringArray.optional(),
  readingTime: z.string().optional(),
  difficulty: z
    .union([
      z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
      z.string(), // Some guides use dynamic difficulty strings
    ])
    .optional(),
  featured: z.boolean().optional(),
  lastReviewed: z.string().optional(),
  aiOptimized: z.boolean().optional(),
  citationReady: z.boolean().optional(),
  relatedGuides: stringArray.optional(),

  // Component-specific display properties
  type: z.string().optional(), // for component display logic
  githubUsername: z.string().optional(),
  stars: z.number().optional(),
  popularity: z.number().optional(),
  repository: z.string().optional(),
  documentation: z.string().optional(),
});

export type UnifiedContentItem = z.infer<typeof unifiedContentItemSchema>;
