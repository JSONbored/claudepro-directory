/**
 * Master Component Content Schema
 * This creates a unified interface for components that includes ALL possible properties
 * from all content types, with proper optional handling for TypeScript strict mode
 */

import { z } from 'zod';

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
  tags: z.array(z.string()),

  // Optional properties that may exist on different content types
  title: z.string().optional(), // guides, auto-generated for others
  name: z.string().optional(), // auto-generated display name
  content: z.string().optional(), // long form content
  lastModified: z.string().optional(), // last modification date

  // Source and metadata
  source: z.enum(['community', 'official', 'verified', 'claudepro']).optional(),

  // Features and capabilities
  features: z.array(z.string()).optional(),
  useCases: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),

  // URLs and documentation
  documentationUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),

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

  // Installation information
  installation: z
    .union([
      z.string(), // simple string format
      z.record(z.string(), z.any()), // complex object format
    ])
    .optional(),

  // Security and troubleshooting
  security: z.array(z.string()).optional(),
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
  permissions: z.array(z.string()).optional(),
  configLocation: z.string().optional(),
  mcpVersion: z.string().optional(),
  serverType: z.enum(['stdio', 'http', 'sse']).optional(),
  dataTypes: z.array(z.string()).optional(),
  toolsProvided: z.array(z.string()).optional(),
  resourcesProvided: z.array(z.string()).optional(),
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
  relatedRules: z.array(z.string()).optional(),
  expertiseAreas: z.array(z.string()).optional(),
  difficultyLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),

  // Command-specific properties
  argumentTypes: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        example: z.string(),
      })
    )
    .optional(),
  frontmatterOptions: z.record(z.string(), z.string()).optional(),

  // Guide-specific properties
  keywords: z.array(z.string()).optional(),
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
  relatedGuides: z.array(z.string()).optional(),

  // Component-specific display properties
  type: z.string().optional(), // for component display logic
  githubUsername: z.string().optional(),
  stars: z.number().optional(),
  popularity: z.number().optional(),
  repository: z.string().optional(),
  documentation: z.string().optional(),
});

export type UnifiedContentItem = z.infer<typeof unifiedContentItemSchema>;

/**
 * Content category enum for type safety
 */
// Import the single source of truth for content categories
import type { contentCategorySchema } from '../shared.schema';
export type ContentCategory = z.infer<typeof contentCategorySchema>;
