/**
 * Content Type Validation Schemas
 *
 * CLEANED UP VERSION - Re-exports from individual content schemas
 * All actual schemas have been moved to /content/ directory
 */

// Re-export ContentCategory from components for compatibility
export type { ContentCategory as ComponentContentCategory } from './components/content-item.schema';

// Import for local use and re-export
import {
  type ContentCategory,
  type ContentItem,
  contentCategorySchema,
  contentItemSchema,
} from './content';
import { type AgentContent, agentContentSchema } from './content/agent.schema';
import { type CommandContent, commandContentSchema } from './content/command.schema';
import { type GuideContent, guideContentSchema } from './content/guide.schema';
import { type HookContent, hookContentSchema } from './content/hook.schema';
import { type McpContent, mcpContentSchema } from './content/mcp.schema';
import { type RuleContent, ruleContentSchema } from './content/rule.schema';

// Re-export all the imported types and schemas
export {
  type ContentCategory,
  type ContentItem,
  contentCategorySchema,
  contentItemSchema,
  type AgentContent,
  agentContentSchema,
  type CommandContent,
  commandContentSchema,
  type GuideContent,
  guideContentSchema,
  type HookContent,
  hookContentSchema,
  type McpContent,
  mcpContentSchema,
  type RuleContent,
  ruleContentSchema,
};

// Legacy exports for backward compatibility
export type MCPServerContent = McpContent;
export type AgentConfiguration = AgentContent;
export type RuleConfiguration = RuleContent;
export type CommandConfiguration = CommandContent;
export type HookConfiguration = HookContent;

// Additional legacy exports
export const mcpServerContentSchema = mcpContentSchema;
export type ContentMetadata = ContentItem;

// Placeholder job type (jobs feature not implemented yet)
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

// Export-specific schema for content transformers
import { z } from 'zod';
import { nonEmptyString, optionalUrlString, stringArray } from '@/lib/schemas/primitives';

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
  configuration: z.any().optional(),
});

export type ExportableItem = z.infer<typeof exportableItemSchema>;

// Content stats type for tracking content counts
export interface ContentStats {
  agents: number;
  mcp: number;
  rules: number;
  commands: number;
  hooks: number;
  guides: number;
  jobs?: number;
}
