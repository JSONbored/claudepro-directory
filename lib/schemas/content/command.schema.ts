/**
 * Command Content Schema
 * Based on actual command JSON files structure and commands template
 */

import { z } from 'zod';
import {
  examplesArray,
  limitedMediumStringArray,
  mediumStringArray,
  requiredTagArray,
} from '@/lib/schemas/primitives/base-arrays';
import { aiTemperature, optionalPositiveInt } from '@/lib/schemas/primitives/base-numbers';
import {
  codeString,
  isoDateString,
  mediumString,
  nonEmptyString,
  optionalNonEmptyString,
  optionalUrlString,
  shortString,
} from '@/lib/schemas/primitives/base-strings';

// Base configuration schema for commands
const commandConfigurationSchema = z.object({
  temperature: aiTemperature.optional(),
  maxTokens: optionalPositiveInt,
  systemPrompt: z.string().optional(),
});

// Installation configuration for commands
const commandInstallationSchema = z.object({
  claudeCode: z
    .object({
      steps: mediumStringArray,
      configFormat: z.string().optional(),
      configPath: z.record(z.string(), mediumString).optional(),
    })
    .optional(),
  claudeDesktop: z
    .object({
      steps: mediumStringArray,
      configPath: z.record(z.string(), mediumString).optional(),
      note: z.string().optional(),
    })
    .optional(),
  requirements: limitedMediumStringArray.optional(),
});

// Argument type definition for commands
const commandArgumentTypeSchema = z.object({
  name: shortString,
  description: mediumString,
  example: codeString,
});

// Frontmatter options for command definition
const commandFrontmatterOptionsSchema = z.record(z.string(), z.string());

/**
 * Command content schema - matches actual production command JSON structure
 */
export const commandContentSchema = z.object({
  // Required base properties (always present in commands)
  slug: nonEmptyString,
  description: nonEmptyString,
  category: z.literal('commands'),
  author: nonEmptyString,
  dateAdded: isoDateString,

  // Required command-specific properties
  tags: requiredTagArray,
  content: nonEmptyString, // Long command content with frontmatter and markdown

  // Auto-generated but present in actual files
  title: optionalNonEmptyString,
  name: optionalNonEmptyString, // display name for components

  // Optional properties (can be undefined)
  source: z.enum(['community', 'official', 'verified', 'claudepro']).optional(),

  // Configuration settings
  configuration: commandConfigurationSchema.optional(),

  // URLs and documentation
  documentationUrl: optionalUrlString,
  githubUrl: z
    .string()
    .url()
    .refine((url) => url.includes('github.com'), { message: 'Must be a GitHub URL' })
    .optional(),

  // Command features and capabilities
  features: z.array(mediumString).max(50).optional(),
  useCases: z.array(mediumString).max(50).optional(),

  // Installation and setup
  installation: commandInstallationSchema.optional(),

  // Command-specific metadata
  argumentTypes: z.array(commandArgumentTypeSchema).max(20).optional(),
  frontmatterOptions: commandFrontmatterOptionsSchema.optional(),

  // Examples
  examples: examplesArray.optional(),
});

export type CommandContent = z.infer<typeof commandContentSchema>;
