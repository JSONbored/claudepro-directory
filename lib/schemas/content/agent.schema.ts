/**
 * Agent Content Schema
 * Based on actual agent JSON files structure
 */

import { z } from 'zod';
import { optionalStringArray, requiredTagArray } from '@/lib/schemas/primitives/base-arrays';
import { aiTemperature, optionalPositiveInt } from '@/lib/schemas/primitives/base-numbers';
import {
  isoDateString,
  nonEmptyString,
  optionalNonEmptyString,
  optionalUrlString,
} from '@/lib/schemas/primitives/base-strings';

// Base configuration schema for agents
const agentConfigurationSchema = z.object({
  temperature: aiTemperature.optional(),
  maxTokens: optionalPositiveInt,
  systemPrompt: z.string().optional(),
});

/**
 * Agent content schema - matches actual production agent JSON structure
 */
export const agentContentSchema = z.object({
  // Required base properties (always present in agents)
  slug: nonEmptyString,
  description: nonEmptyString,
  category: z.literal('agents'),
  author: nonEmptyString,
  dateAdded: isoDateString,

  // Required agent-specific properties
  tags: requiredTagArray,
  content: nonEmptyString,

  // Auto-generated but present in actual files
  title: optionalNonEmptyString,

  // Optional properties
  features: optionalStringArray,
  useCases: optionalStringArray,

  // Optional properties (can be undefined)
  documentationUrl: optionalUrlString,
  configuration: agentConfigurationSchema.optional(),
  source: z.enum(['community', 'official', 'verified', 'claudepro']).optional(),
  installation: z.record(z.string(), z.any()).optional(), // Complex installation object
});

export type AgentContent = z.infer<typeof agentContentSchema>;
