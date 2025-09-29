/**
 * Hook Content Schema
 * Based on actual hook JSON files structure and hooks template
 */

import { z } from 'zod';
import {
  largeContentArray,
  limitedMediumStringArray,
  mediumStringArray,
  requiredTagArray,
} from '@/lib/schemas/primitives/base-arrays';
import { timeoutMs } from '@/lib/schemas/primitives/base-numbers';
import {
  codeString,
  isoDateString,
  massiveString,
  mediumString,
  nonEmptyString,
  optionalUrlString,
  shortString,
} from '@/lib/schemas/primitives/base-strings';

// Hook configuration schema - individual hook definition
const hookConfigSchema = z.object({
  script: mediumString,
  matchers: z.array(shortString).optional(),
  timeout: timeoutMs.optional(),
  description: mediumString.optional(),
});

// Hook configuration array schema (for array-based hook configs)
const hookConfigArraySchema = z.array(
  z.object({
    matchers: z.array(shortString).optional(),
    description: mediumString.optional(),
    timeout: timeoutMs.optional(),
  })
);

// Full hook configuration object
const fullHookConfigSchema = z.object({
  hookConfig: z.object({
    hooks: z.record(z.string(), z.union([hookConfigSchema, hookConfigArraySchema])).optional(),
  }),
  scriptContent: massiveString.optional(), // 1MB limit for script content
});

// Installation configuration for hooks
const hookInstallationSchema = z.object({
  claudeDesktop: z
    .object({
      steps: z.array(codeString),
      configPath: z.record(z.string(), mediumString).optional(),
    })
    .optional(),
  claudeCode: z
    .object({
      steps: z.array(codeString).optional(),
      configFormat: mediumString.optional(),
      configPath: z
        .object({
          project: mediumString.optional(),
          user: mediumString.optional(),
        })
        .optional(),
    })
    .optional(),
  requirements: mediumStringArray.optional(),
});

// Troubleshooting entry for hooks
const hookTroubleshootingSchema = z.object({
  issue: z.string().max(300),
  solution: mediumString,
});

/**
 * Hook content schema - matches actual production hook JSON structure
 */
export const hookContentSchema = z.object({
  // Required base properties (always present in hooks)
  slug: nonEmptyString,
  description: nonEmptyString,
  category: z.literal('hooks'),
  author: nonEmptyString,
  dateAdded: isoDateString,

  // Required hook-specific properties
  tags: requiredTagArray,
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
  features: largeContentArray.optional(),
  useCases: largeContentArray.optional(),
  requirements: limitedMediumStringArray.optional(),

  // Documentation
  documentationUrl: optionalUrlString,

  // Installation and setup
  installation: hookInstallationSchema.optional(),

  // Troubleshooting information
  troubleshooting: z.array(hookTroubleshootingSchema).max(20).optional(),
});

export type HookContent = z.infer<typeof hookContentSchema>;
