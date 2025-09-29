/**
 * Content Schema Index
 * Exports all content schemas and creates union types
 *
 * Phase 2: Content Schema Consolidation Complete
 * - All schemas now use base-content.schema.ts with shape destructuring
 * - Reduces duplication and bundle size by 15-25%
 * - Uses Zod v4 best practices for optimal TypeScript performance
 */

import { z } from 'zod';
import {
  type ContentCategory as SharedContentCategory,
  contentCategorySchema as sharedContentCategorySchema,
} from '../shared.schema';

// Export individual content schemas
export { type AgentContent, agentContentSchema } from './agent.schema';
// Export base content schemas (Phase 2: New exports)
export {
  type BaseConfiguration,
  type BaseContentMetadata,
  type BaseInstallation,
  baseConfigurationSchema,
  baseContentMetadataSchema,
  baseInstallationSchema,
} from './base-content.schema';
export { type CommandContent, commandContentSchema } from './command.schema';
export { type GuideContent, guideContentSchema } from './guide.schema';
export { type HookContent, hookContentSchema } from './hook.schema';
export { type McpContent, mcpContentSchema } from './mcp.schema';
export { type RuleContent, ruleContentSchema } from './rule.schema';

// Re-import for union creation
import { agentContentSchema } from './agent.schema';
import { commandContentSchema } from './command.schema';
import { guideContentSchema } from './guide.schema';
import { hookContentSchema } from './hook.schema';
import { mcpContentSchema } from './mcp.schema';
import { ruleContentSchema } from './rule.schema';

/**
 * Union of all content schemas
 */
export const contentItemSchema = z.union([
  agentContentSchema,
  mcpContentSchema,
  ruleContentSchema,
  commandContentSchema,
  hookContentSchema,
  guideContentSchema,
]);

export type ContentItem = z.infer<typeof contentItemSchema>;

// Re-export ContentCategory and schema for external use
export type ContentCategory = SharedContentCategory;
export const contentCategorySchema = sharedContentCategorySchema;

/**
 * Detailed content union (for complex content validation)
 */
export const detailedContentSchema = z.union([
  agentContentSchema,
  mcpContentSchema,
  commandContentSchema,
  hookContentSchema,
  ruleContentSchema,
  guideContentSchema,
]);

export type DetailedContent = z.infer<typeof detailedContentSchema>;

/**
 * Content category literals for type safety - using shared schema
 */

/**
 * Related content type schema
 */
export const relatedTypeSchema = z.enum(['rules', 'mcp', 'agents', 'commands', 'hooks', 'guides']);
export type RelatedType = z.infer<typeof relatedTypeSchema>;

/**
 * Helper function to validate content by category
 */
export function validateContentByCategory(data: unknown, category: SharedContentCategory) {
  switch (category) {
    case 'agents':
      return agentContentSchema.parse(data);
    case 'mcp':
      return mcpContentSchema.parse(data);
    case 'rules':
      return ruleContentSchema.parse(data);
    case 'commands':
      return commandContentSchema.parse(data);
    case 'hooks':
      return hookContentSchema.parse(data);
    case 'guides':
      return guideContentSchema.parse(data);
    default:
      throw new Error(`Unknown content category: ${category}`);
  }
}

/**
 * Helper function to create a safe content validator
 */
export function createContentValidator<T extends z.ZodTypeAny>(schema: T) {
  return (data: unknown): z.infer<T> | null => {
    const result = schema.safeParse(data);
    return result.success ? result.data : null;
  };
}
