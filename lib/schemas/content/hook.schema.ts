/**
 * Hook Content Schema
 * Based on actual hook JSON files structure and hooks template
 */

import { z } from 'zod';

// Hook configuration schema - individual hook definition
const hookConfigSchema = z.object({
  script: z.string().max(500),
  matchers: z.array(z.string().max(100)).optional(),
  timeout: z.number().int().min(100).max(300000).optional(),
  description: z.string().max(500).optional(),
});

// Hook configuration array schema (for array-based hook configs)
const hookConfigArraySchema = z.array(
  z.object({
    matchers: z.array(z.string().max(100)).optional(),
    description: z.string().max(500).optional(),
    timeout: z.number().int().min(100).max(300000).optional(),
  })
);

// Full hook configuration object
const fullHookConfigSchema = z.object({
  hookConfig: z.object({
    hooks: z.record(z.string(), z.union([hookConfigSchema, hookConfigArraySchema])).optional(),
  }),
  scriptContent: z.string().max(1000000).optional(), // 1MB limit for script content
});

// Installation configuration for hooks
const hookInstallationSchema = z.object({
  claudeDesktop: z
    .object({
      steps: z.array(z.string().max(1000)),
      configPath: z.record(z.string(), z.string().max(500)).optional(),
    })
    .optional(),
  claudeCode: z
    .object({
      steps: z.array(z.string().max(1000)).optional(),
      configFormat: z.string().max(500).optional(),
      configPath: z
        .object({
          project: z.string().max(500).optional(),
          user: z.string().max(500).optional(),
        })
        .optional(),
    })
    .optional(),
  requirements: z.array(z.string().max(500)).optional(),
});

// Troubleshooting entry for hooks
const hookTroubleshootingSchema = z.object({
  issue: z.string().max(300),
  solution: z.string().max(500),
});

/**
 * Hook content schema - matches actual production hook JSON structure
 */
export const hookContentSchema = z.object({
  // Required base properties (always present in hooks)
  slug: z.string().min(1),
  description: z.string().min(1),
  category: z.literal('hooks'),
  author: z.string().min(1),
  dateAdded: z.string(), // ISO date string

  // Required hook-specific properties
  tags: z.array(z.string()).min(1),
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

  // Auto-generated but present in actual files
  title: z.string().optional(),

  // Hook configuration (complex hook setup)
  configuration: fullHookConfigSchema,

  // Optional properties (can be undefined)
  source: z.enum(['community', 'official', 'verified', 'claudepro']).optional(),

  // Hook features and capabilities
  features: z.array(z.string().max(500)).max(50).optional(),
  useCases: z.array(z.string().max(500)).max(50).optional(),
  requirements: z.array(z.string().max(500)).max(20).optional(),

  // Documentation
  documentationUrl: z.string().url().optional(),

  // Installation and setup
  installation: hookInstallationSchema.optional(),

  // Troubleshooting information
  troubleshooting: z.array(hookTroubleshootingSchema).max(20).optional(),
});

export type HookContent = z.infer<typeof hookContentSchema>;
