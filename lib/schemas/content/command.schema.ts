/**
 * Command Content Schema
 * Based on actual command JSON files structure and commands template
 */

import { z } from 'zod';

// Base configuration schema for commands
const commandConfigurationSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  systemPrompt: z.string().optional(),
});

// Installation configuration for commands
const commandInstallationSchema = z.object({
  claudeCode: z
    .object({
      steps: z.array(z.string().max(500)),
      configFormat: z.string().optional(),
      configPath: z.record(z.string(), z.string().max(500)).optional(),
    })
    .optional(),
  claudeDesktop: z
    .object({
      steps: z.array(z.string().max(500)),
      configPath: z.record(z.string(), z.string().max(500)).optional(),
      note: z.string().optional(),
    })
    .optional(),
  requirements: z.array(z.string().max(500)).optional(),
});

// Argument type definition for commands
const commandArgumentTypeSchema = z.object({
  name: z.string().max(100),
  description: z.string().max(500),
  example: z.string().max(1000),
});

// Frontmatter options for command definition
const commandFrontmatterOptionsSchema = z.record(z.string(), z.string());

/**
 * Command content schema - matches actual production command JSON structure
 */
export const commandContentSchema = z.object({
  // Required base properties (always present in commands)
  slug: z.string().min(1),
  description: z.string().min(1),
  category: z.literal('commands'),
  author: z.string().min(1),
  dateAdded: z.string(), // ISO date string

  // Required command-specific properties
  tags: z.array(z.string()).min(1),
  content: z.string().min(1), // Long command content with frontmatter and markdown

  // Auto-generated but present in actual files
  title: z.string().optional(),
  name: z.string().optional(), // display name for components

  // Optional properties (can be undefined)
  source: z.enum(['community', 'official', 'verified', 'claudepro']).optional(),

  // Configuration settings
  configuration: commandConfigurationSchema.optional(),

  // URLs and documentation
  documentationUrl: z.string().url().optional(),
  githubUrl: z
    .string()
    .url()
    .refine((url) => url.includes('github.com'), { message: 'Must be a GitHub URL' })
    .optional(),

  // Command features and capabilities
  features: z.array(z.string().max(500)).max(50).optional(),
  useCases: z.array(z.string().max(500)).max(50).optional(),

  // Installation and setup
  installation: commandInstallationSchema.optional(),

  // Command-specific metadata
  argumentTypes: z.array(commandArgumentTypeSchema).max(20).optional(),
  frontmatterOptions: commandFrontmatterOptionsSchema.optional(),

  // Examples
  examples: z.array(z.string().max(1000)).max(10).optional(),
});

export type CommandContent = z.infer<typeof commandContentSchema>;
