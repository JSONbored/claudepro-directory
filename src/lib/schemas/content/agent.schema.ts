/**
 * Agent Content Schema
 * Based on actual agent JSON files structure
 *
 * Uses Zod v4 shape destructuring pattern for composition with base content schema.
 * This approach is more tsc-efficient than .extend() and follows Zod best practices.
 */

import { z } from "zod";
import {
  baseConfigurationSchema,
  baseContentMetadataSchema,
} from "@/src/lib/schemas/content/base-content.schema";

/**
 * Agent content schema - matches actual production agent JSON structure
 *
 * Inherits common fields from baseContentMetadataSchema via shape destructuring:
 * - slug, description, author, dateAdded, tags, content
 * - title, source, documentationUrl, features, useCases
 *
 * Agent-specific additions:
 * - category: 'agents' literal
 * - configuration: AI model settings (temperature, maxTokens, systemPrompt)
 * - installation: Optional complex installation object
 */
export const agentContentSchema = z
  .object({
    // Inherit all base content metadata fields using shape destructuring (Zod v4 best practice)
    ...baseContentMetadataSchema.shape,

    // Agent-specific required fields
    category: z
      .literal("agents")
      .describe('Content category literal identifier: "agents"'),

    // Agent-specific optional fields
    configuration: baseConfigurationSchema
      .optional()
      .describe(
        "Optional AI model configuration settings (temperature, maxTokens, systemPrompt)",
      ),
    installation: z
      .object({})
      .passthrough()
      .optional()
      .describe(
        "Optional complex installation object with platform-specific setup instructions",
      ), // Complex installation object - allows any properties while maintaining type safety
  })
  .describe(
    "Agent content schema for AI assistant configurations. Inherits base content metadata and adds agent-specific fields including AI model settings and installation instructions.",
  );

export type AgentContent = z.infer<typeof agentContentSchema>;
