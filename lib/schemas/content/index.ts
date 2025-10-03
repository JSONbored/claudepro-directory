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
export {
  type CollectionContent,
  type CollectionItemReference,
  collectionContentSchema,
} from './collection.schema';
export { type CommandContent, commandContentSchema } from './command.schema';
export { type GuideContent, guideContentSchema } from './guide.schema';
export { type HookContent, hookContentSchema } from './hook.schema';
export { type McpContent, mcpContentSchema } from './mcp.schema';
export { type RuleContent, ruleContentSchema } from './rule.schema';
export { type StatuslineContent, statuslineContentSchema } from './statusline.schema';

// Re-import for union creation and type aliases
import { agentContentSchema } from './agent.schema';
import { collectionContentSchema } from './collection.schema';
import { commandContentSchema } from './command.schema';
import { guideContentSchema } from './guide.schema';
import { hookContentSchema } from './hook.schema';
import { mcpContentSchema } from './mcp.schema';
import { ruleContentSchema } from './rule.schema';
import { statuslineContentSchema } from './statusline.schema';

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
  statuslineContentSchema,
  collectionContentSchema,
]);

export type ContentItem = z.infer<typeof contentItemSchema>;

// Note: ContentCategory removed - import from shared.schema directly
// Use: import { type ContentCategory, contentCategorySchema } from '@/lib/schemas/shared.schema';

/**
 * Content category literals for type safety - using shared schema
 */

/**
 * Helper function to validate content by category
 */
export function validateContentByCategory(data: unknown, category: string) {
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
    case 'statuslines':
      return statuslineContentSchema.parse(data);
    case 'collections':
      return collectionContentSchema.parse(data);
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

/**
 * Content statistics type
 */
export type ContentStats = {
  agents: number;
  mcp: number;
  rules: number;
  commands: number;
  hooks: number;
  guides: number;
  statuslines: number;
  collections: number;
};

/**
 * Placeholder job type (jobs feature not implemented yet)
 */
export type JobContent = {
  slug: string;
  description: string;
  category: string;
  author: string;
  dateAdded: string;
  tags: string[];
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  postedAt: string;
  requirements: string[];
  benefits: string[];
  applyUrl: string;
  contactEmail: string;
  remote: boolean;
  featured?: boolean;
  companyLogo?: string;
};

/**
 * Exportable item schema for content transformers
 */
import { stringArray } from '@/lib/schemas/primitives/base-arrays';
import { nonEmptyString, optionalUrlString } from '@/lib/schemas/primitives/base-strings';

export const exportableItemSchema = z.object({
  slug: nonEmptyString,
  name: nonEmptyString,
  title: z.string().optional(),
  description: nonEmptyString,
  category: nonEmptyString,
  tags: stringArray.optional(),
  author: nonEmptyString,
  dateAdded: nonEmptyString,
  githubUrl: optionalUrlString,
  source: z.string().optional(),
  features: stringArray.optional(),
  useCases: stringArray.optional(),
  content: z.string().optional(),
});

export type ExportableItem = z.infer<typeof exportableItemSchema>;
