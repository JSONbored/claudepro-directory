/**
 * Schema Types
 * Type definitions for unified structured data generation
 */

import type {
  AgentContent,
  CommandContent,
  HookContent,
  McpContent,
  RuleContent,
} from '@/lib/schemas/content';

/**
 * Discriminated union for all content types
 */
export type UnifiedContent =
  | ({ category: 'agents' } & AgentContent)
  | ({ category: 'commands' } & CommandContent)
  | ({ category: 'hooks' } & HookContent)
  | ({ category: 'mcp' } & McpContent)
  | ({ category: 'rules' } & RuleContent);

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
