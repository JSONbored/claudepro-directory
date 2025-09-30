/**
 * Schema Types
 * Type definitions for unified structured data generation
 */

import type { AgentContent } from '@/lib/schemas/content/agent.schema';
import type { CommandContent } from '@/lib/schemas/content/command.schema';
import type { HookContent } from '@/lib/schemas/content/hook.schema';
import type { McpContent } from '@/lib/schemas/content/mcp.schema';
import type { RuleContent } from '@/lib/schemas/content/rule.schema';

/**
 * Extended content types - direct aliases without additional fields
 * All required fields come from the base schemas
 */
export type ExtendedAgentContent = AgentContent;
export type ExtendedCommandContent = CommandContent;
export type ExtendedHookContent = HookContent;
export type ExtendedMcpContent = McpContent;
export type ExtendedRuleContent = RuleContent;

/**
 * Discriminated union for all content types
 */
export type UnifiedContent =
  | ({ category: 'agents' } & ExtendedAgentContent)
  | ({ category: 'commands' } & ExtendedCommandContent)
  | ({ category: 'hooks' } & ExtendedHookContent)
  | ({ category: 'mcp' } & ExtendedMcpContent)
  | ({ category: 'rules' } & ExtendedRuleContent);

/**
 * Props for unified structured data component
 */
export interface UnifiedStructuredDataProps {
  item: UnifiedContent;
}

/**
 * Type guards for content discrimination
 */
export function isAgentContent(
  item: UnifiedContent
): item is ExtendedAgentContent & { category: 'agents' } {
  return item.category === 'agents';
}

export function isCommandContent(
  item: UnifiedContent
): item is ExtendedCommandContent & { category: 'commands' } {
  return item.category === 'commands';
}

export function isHookContent(
  item: UnifiedContent
): item is ExtendedHookContent & { category: 'hooks' } {
  return item.category === 'hooks';
}

export function isMcpContent(
  item: UnifiedContent
): item is ExtendedMcpContent & { category: 'mcp' } {
  return item.category === 'mcp';
}

export function isRuleContent(
  item: UnifiedContent
): item is ExtendedRuleContent & { category: 'rules' } {
  return item.category === 'rules';
}

/**
 * Configuration for schema generation per content type
 */
export interface SchemaGenerationConfig {
  generateApplication: boolean;
  generateSourceCode: boolean;
  generateHowTo: boolean;
  generateCreativeWork: boolean;
  generateFAQ: boolean;
  generateBreadcrumb: boolean;
  generateSpeakable: boolean;
}

export const SCHEMA_CONFIGS: Record<UnifiedContent['category'], SchemaGenerationConfig> = {
  agents: {
    generateApplication: true,
    generateSourceCode: true,
    generateHowTo: true,
    generateCreativeWork: true,
    generateFAQ: false,
    generateBreadcrumb: true,
    generateSpeakable: true,
  },
  commands: {
    generateApplication: false,
    generateSourceCode: true,
    generateHowTo: true,
    generateCreativeWork: false,
    generateFAQ: false,
    generateBreadcrumb: true,
    generateSpeakable: false,
  },
  hooks: {
    generateApplication: true,
    generateSourceCode: true,
    generateHowTo: true,
    generateCreativeWork: false,
    generateFAQ: false,
    generateBreadcrumb: true,
    generateSpeakable: false,
  },
  mcp: {
    generateApplication: true,
    generateSourceCode: true,
    generateHowTo: true,
    generateCreativeWork: false,
    generateFAQ: true,
    generateBreadcrumb: true,
    generateSpeakable: false,
  },
  rules: {
    generateApplication: true,
    generateSourceCode: false,
    generateHowTo: true,
    generateCreativeWork: true,
    generateFAQ: false,
    generateBreadcrumb: true,
    generateSpeakable: true,
  },
};
