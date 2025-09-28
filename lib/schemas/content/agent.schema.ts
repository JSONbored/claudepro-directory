/**
 * Agent Content Schema
 * Based on actual agent JSON files structure
 */

import { z } from 'zod';

// Base configuration schema for agents
const agentConfigurationSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  systemPrompt: z.string().optional(),
});

/**
 * Agent content schema - matches actual production agent JSON structure
 */
export const agentContentSchema = z.object({
  // Required base properties (always present in agents)
  slug: z.string().min(1),
  description: z.string().min(1),
  category: z.literal('agents'),
  author: z.string().min(1),
  dateAdded: z.string(), // ISO date string

  // Required agent-specific properties
  tags: z.array(z.string()).min(1),
  content: z.string().min(1),

  // Auto-generated but present in actual files
  title: z.string().optional(),

  // Optional properties
  features: z.array(z.string()).optional(),
  useCases: z.array(z.string()).optional(), // Long agent prompt content

  // Optional properties (can be undefined)
  documentationUrl: z.string().url().optional(),
  configuration: agentConfigurationSchema.optional(),
  source: z.enum(['community', 'official', 'verified', 'claudepro']).optional(),
  installation: z.record(z.string(), z.any()).optional(), // Complex installation object
});

export type AgentContent = z.infer<typeof agentContentSchema>;
