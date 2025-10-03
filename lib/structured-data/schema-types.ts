/**
 * Schema Types
 * Type definitions for unified structured data generation
 */

import type { AgentContent } from '@/lib/schemas/content/agent.schema';
import type { CommandContent } from '@/lib/schemas/content/command.schema';
import type { HookContent } from '@/lib/schemas/content/hook.schema';
import type { McpContent } from '@/lib/schemas/content/mcp.schema';
import type { RuleContent } from '@/lib/schemas/content/rule.schema';
import type { StatuslineContent } from '@/lib/schemas/content/statusline.schema';

/**
 * Discriminated union for all content types
 */
export type UnifiedContent =
  | ({ category: 'agents' } & AgentContent)
  | ({ category: 'commands' } & CommandContent)
  | ({ category: 'hooks' } & HookContent)
  | ({ category: 'mcp' } & McpContent)
  | ({ category: 'rules' } & RuleContent)
  | ({ category: 'statuslines' } & StatuslineContent);

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
): item is AgentContent & { category: 'agents' } {
  return item.category === 'agents';
}

export function isCommandContent(
  item: UnifiedContent
): item is CommandContent & { category: 'commands' } {
  return item.category === 'commands';
}

export function isHookContent(item: UnifiedContent): item is HookContent & { category: 'hooks' } {
  return item.category === 'hooks';
}

export function isMcpContent(item: UnifiedContent): item is McpContent & { category: 'mcp' } {
  return item.category === 'mcp';
}

export function isRuleContent(item: UnifiedContent): item is RuleContent & { category: 'rules' } {
  return item.category === 'rules';
}

export function isStatuslineContent(
  item: UnifiedContent
): item is StatuslineContent & { category: 'statuslines' } {
  return item.category === 'statuslines';
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
  statuslines: {
    generateApplication: true,
    generateSourceCode: true,
    generateHowTo: true,
    generateCreativeWork: false,
    generateFAQ: false,
    generateBreadcrumb: true,
    generateSpeakable: false,
  },
};
