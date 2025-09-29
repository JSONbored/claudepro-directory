/**
 * Rule Content Schema
 * Based on actual rule JSON files structure and rules template
 */

import { z } from 'zod';
import { limitedMediumStringArray, requiredTagArray } from '@/lib/schemas/primitives/base-arrays';
import { aiTemperature, optionalPositiveInt } from '@/lib/schemas/primitives/base-numbers';
import {
  codeString,
  isoDateString,
  mediumString,
  nonEmptyString,
  optionalNonEmptyString,
  optionalUrlString,
} from '@/lib/schemas/primitives/base-strings';

// Base configuration schema for rules
const ruleConfigurationSchema = z.object({
  temperature: aiTemperature.optional(),
  maxTokens: optionalPositiveInt,
  systemPrompt: z.string().optional(),
});

// Rule example schema
const ruleExampleSchema = z.object({
  title: z.string().max(200),
  description: mediumString,
  prompt: codeString,
  expectedOutcome: codeString,
});

// Troubleshooting entry for rules
const ruleTroubleshootingSchema = z.union([
  mediumString,
  z.object({
    issue: z.string().max(300),
    solution: mediumString,
  }),
]);

/**
 * Rule content schema - matches actual production rule JSON structure
 */
export const ruleContentSchema = z.object({
  // Required base properties (always present in rules)
  slug: nonEmptyString,
  description: nonEmptyString,
  category: z.literal('rules'),
  author: nonEmptyString,
  dateAdded: isoDateString,

  // Required rule-specific properties
  tags: requiredTagArray,
  content: nonEmptyString, // Long rule content/prompt

  // Auto-generated but present in actual files
  title: optionalNonEmptyString,

  // Optional properties (can be undefined)
  source: z.enum(['community', 'official', 'verified', 'claudepro']).optional(),

  // Configuration settings
  configuration: ruleConfigurationSchema.optional(),

  // URLs and documentation
  documentationUrl: optionalUrlString,
  githubUrl: z
    .string()
    .url()
    .refine((url) => url.includes('github.com'), { message: 'Must be a GitHub URL' })
    .optional(),

  // Rule features and capabilities
  features: z.array(mediumString).max(50).optional(),
  useCases: z.array(mediumString).max(50).optional(),
  requirements: limitedMediumStringArray.optional(),

  // Examples and troubleshooting
  examples: z
    .array(z.union([codeString, ruleExampleSchema]))
    .max(10)
    .optional(),
  troubleshooting: z.array(ruleTroubleshootingSchema).max(20).optional(),

  // Rule metadata
  relatedRules: z.array(z.string()).max(20).optional(),
  expertiseAreas: z.array(z.string().max(200)).max(10).optional(),
  difficultyLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),
});

export type RuleContent = z.infer<typeof ruleContentSchema>;
