/**
 * Rule Content Schema
 * Based on actual rule JSON files structure and rules template
 */

import { z } from 'zod';

// Base configuration schema for rules
const ruleConfigurationSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  systemPrompt: z.string().optional(),
});

// Rule example schema
const ruleExampleSchema = z.object({
  title: z.string().max(200),
  description: z.string().max(500),
  prompt: z.string().max(1000),
  expectedOutcome: z.string().max(1000),
});

// Troubleshooting entry for rules
const ruleTroubleshootingSchema = z.union([
  z.string().max(500),
  z.object({
    issue: z.string().max(300),
    solution: z.string().max(500),
  }),
]);

/**
 * Rule content schema - matches actual production rule JSON structure
 */
export const ruleContentSchema = z.object({
  // Required base properties (always present in rules)
  slug: z.string().min(1),
  description: z.string().min(1),
  category: z.literal('rules'),
  author: z.string().min(1),
  dateAdded: z.string(), // ISO date string

  // Required rule-specific properties
  tags: z.array(z.string()).min(1),
  content: z.string().min(1), // Long rule content/prompt

  // Auto-generated but present in actual files
  title: z.string().optional(),

  // Optional properties (can be undefined)
  source: z.enum(['community', 'official', 'verified', 'claudepro']).optional(),

  // Configuration settings
  configuration: ruleConfigurationSchema.optional(),

  // URLs and documentation
  documentationUrl: z.string().url().optional(),
  githubUrl: z
    .string()
    .url()
    .refine((url) => url.includes('github.com'), { message: 'Must be a GitHub URL' })
    .optional(),

  // Rule features and capabilities
  features: z.array(z.string().max(500)).max(50).optional(),
  useCases: z.array(z.string().max(500)).max(50).optional(),
  requirements: z.array(z.string().max(500)).max(20).optional(),

  // Examples and troubleshooting
  examples: z
    .array(z.union([z.string().max(1000), ruleExampleSchema]))
    .max(10)
    .optional(),
  troubleshooting: z.array(ruleTroubleshootingSchema).max(20).optional(),

  // Rule metadata
  relatedRules: z.array(z.string()).max(20).optional(),
  expertiseAreas: z.array(z.string().max(200)).max(10).optional(),
  difficultyLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),
});

export type RuleContent = z.infer<typeof ruleContentSchema>;
