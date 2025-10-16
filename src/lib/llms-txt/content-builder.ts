/**
 * Rich Content Builder for LLMs.txt
 * Extracts ALL structured fields from content items and formats for AI consumption
 *
 * @module llms-txt/content-builder
 * @security Type-safe extraction based on actual content schemas
 * @performance Optimized for production with minimal overhead
 *
 * CRITICAL: Uses content-type-configs generators to provide missing fields (features, useCases, requirements)
 * This ensures llms.txt content matches UnifiedDetailPage rendering EXACTLY for optimal LLM citation accuracy
 */

import { getContentTypeConfig } from '@/src/lib/config/content-type-configs';
import type { AgentContent } from '@/src/lib/schemas/content/agent.schema';
import type { CommandContent } from '@/src/lib/schemas/content/command.schema';
import type { HookContent } from '@/src/lib/schemas/content/hook.schema';
import type { McpContent } from '@/src/lib/schemas/content/mcp.schema';
import type { RuleContent } from '@/src/lib/schemas/content/rule.schema';
import type { StatuslineContent } from '@/src/lib/schemas/content/statusline.schema';

/**
 * Union type for all content items
 */
export type ContentItem =
  | McpContent
  | AgentContent
  | HookContent
  | CommandContent
  | RuleContent
  | StatuslineContent;

/**
 * Type-safe installation configuration types
 */
interface InstallationSteps {
  steps: string[];
  configPath?: Record<string, string>;
}

interface Installation {
  claudeDesktop?: InstallationSteps;
  claudeCode?: string | InstallationSteps;
  requirements?: string[];
}

/**
 * Type-safe MCP configuration types
 * Internal structure uses 'mcp' for consistency with schema
 */
interface MCPServerConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  transport?: string;
}

interface MCPConfiguration {
  claudeDesktop?: {
    mcp: Record<string, MCPServerConfig>;
  };
  claudeCode?: {
    mcp: Record<string, MCPServerConfig>;
  };
  http?: {
    url: string;
    headers?: Record<string, string>;
  };
  sse?: {
    url: string;
    headers?: Record<string, string>;
  };
}

/**
 * Type-safe hook configuration types
 */
interface HookConfig {
  script?: string;
  matchers?: string[];
  timeout?: number;
  description?: string;
}

interface HookConfiguration {
  hookConfig?: {
    hooks: Record<string, HookConfig | HookConfig[]>;
  };
  scriptContent?: string;
}

/**
 * Type-safe statusline configuration type
 */
interface StatuslineConfiguration {
  format?: string;
  refreshInterval?: number;
  position?: string;
  colorScheme?: string;
}

/**
 * Type-safe AI configuration type
 */
interface AIConfiguration {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Type-safe troubleshooting item types
 */
interface TroubleshootingItem {
  issue: string;
  solution: string;
}

type TroubleshootingEntry = TroubleshootingItem | string;

/**
 * Type-safe example types
 */

// Code example from baseUsageExampleSchema (used by MCP, hooks, etc.)
interface CodeExample {
  title: string;
  code: string;
  language:
    | 'typescript'
    | 'javascript'
    | 'json'
    | 'bash'
    | 'shell'
    | 'python'
    | 'yaml'
    | 'markdown'
    | 'plaintext';
  description?: string;
}

// Rule-specific example with prompt/outcome fields
interface RuleExample {
  title: string;
  description?: string;
  prompt?: string;
  expectedOutcome?: string;
}

type Example = CodeExample | RuleExample | string;

/**
 * Build complete rich content string from any content item
 * Extracts ALL available fields based on content type
 *
 * CRITICAL: Section order MUST match UnifiedDetailPage rendering exactly for consistency
 * @see src/components/unified-detail-page/index.tsx lines 146-235
 *
 * @param item - Content item (mcp, agent, hook, command, rule, statusline)
 * @returns Complete formatted content string for llms.txt
 *
 * @remarks
 * Each content type has different fields - this function handles all types safely
 * Section order mirrors the page rendering for optimal LLM citation accuracy
 * Uses generators from content-type-configs to fill missing fields (matches UnifiedDetailPage exactly)
 */
export function buildRichContent(item: ContentItem): string {
  const sections: string[] = [];

  // Get content type config for generators (matches UnifiedDetailPage line 49)
  const config = getContentTypeConfig(item.category);

  // Generate dynamic fields using config generators (matches UnifiedDetailPage lines 54-96)
  // Extract generator functions first to avoid conditional calls
  const genFeatures = config?.generators.features;
  const genRequirements = config?.generators.requirements;
  const genUseCases = config?.generators.useCases;
  const genTroubleshooting = config?.generators.troubleshooting;

  const features =
    'features' in item && Array.isArray(item.features) && item.features.length > 0
      ? item.features
      : genFeatures?.(item) || [];

  const requirements =
    'requirements' in item && Array.isArray(item.requirements) && item.requirements.length > 0
      ? item.requirements
      : genRequirements?.(item) || [];

  const useCases =
    'useCases' in item && Array.isArray(item.useCases) && item.useCases.length > 0
      ? item.useCases
      : genUseCases?.(item) || [];

  const troubleshooting =
    'troubleshooting' in item &&
    Array.isArray(item.troubleshooting) &&
    item.troubleshooting.length > 0
      ? item.troubleshooting
      : genTroubleshooting?.(item) || [];

  // Handle installation: prefer schema field, fallback to generator
  const installation = (() => {
    if ('installation' in item && item.installation) {
      return item.installation;
    }
    return config?.generators.installation?.(item);
  })();

  // 1. MAIN CONTENT SECTION (matches UnifiedDetailPage lines 148-155)
  // The primary content field - agents, commands, rules have markdown content
  // NOTE: Do NOT add "CONTENT" header here - generator.ts adds it when converting to plain text
  // We pass the raw content and buildRichContent() output to generator as the 'content' field
  // Generator will add: "CONTENT\n-------\n" + markdownToPlainText(content)
  if ('content' in item && typeof item.content === 'string' && item.content.trim().length > 0) {
    sections.push(item.content.trim());
  }

  // 2. FEATURES SECTION (matches UnifiedDetailPage lines 157-166)
  // Uses generated features if not in schema
  if (config?.sections.features && features.length > 0) {
    sections.push(formatBulletList('KEY FEATURES', features));
  }

  // 3. REQUIREMENTS SECTION (matches UnifiedDetailPage lines 168-177)
  // Uses generated requirements if not in schema
  if (requirements.length > 0) {
    sections.push(formatBulletList('REQUIREMENTS', requirements));
  }

  // 4. INSTALLATION SECTION (matches UnifiedDetailPage lines 179-182)
  // Uses generated installation if not in schema
  if (config?.sections.installation && installation) {
    sections.push(formatInstallation(installation));
  }

  // 5. CONFIGURATION SECTION (matches UnifiedDetailPage lines 184-193)
  if (config?.sections.configuration && 'configuration' in item && item.configuration) {
    sections.push(formatConfiguration(item.configuration, item.category));
  }

  // 6. USE CASES SECTION (matches UnifiedDetailPage lines 195-204)
  // Uses generated useCases if not in schema
  if (config?.sections.useCases && useCases.length > 0) {
    sections.push(formatBulletList('USE CASES', useCases));
  }

  // 7. SECURITY SECTION (MCP-specific, matches UnifiedDetailPage lines 206-215)
  if (
    config?.sections.security &&
    'security' in item &&
    Array.isArray(item.security) &&
    item.security.length > 0
  ) {
    sections.push(formatBulletList('SECURITY BEST PRACTICES', item.security));
  }

  // 8. TROUBLESHOOTING SECTION (matches UnifiedDetailPage lines 217-223)
  // Uses generated troubleshooting if not in schema
  if (config?.sections.troubleshooting && troubleshooting.length > 0) {
    sections.push(formatTroubleshooting(troubleshooting));
  }

  // 9. EXAMPLES SECTION (MCP-specific, matches UnifiedDetailPage lines 225-235)
  if (
    config?.sections.examples &&
    'examples' in item &&
    Array.isArray(item.examples) &&
    item.examples.length > 0
  ) {
    // Type assertion: item.examples from baseUsageExampleSchema matches our Example type
    // Safe because Example = CodeExample | RuleExample | string, and baseUsageExampleSchema = CodeExample
    sections.push(formatExamples(item.examples as Example[], item.category));
  }

  // 10. TECHNICAL DETAILS SECTION (sidebar content - metadata, links, etc.)
  sections.push(buildTechnicalDetails(item));

  // 11. PREVIEW SECTION (statuslines only - rendered above content in actual page)
  if (item.category === 'statuslines' && 'preview' in item && item.preview) {
    sections.push(`PREVIEW\n-------\n\n${item.preview}`);
  }

  // Join all sections with double newlines
  return sections.filter((s) => s.length > 0).join('\n\n');
}

/**
 * Format array as bullet list with title
 */
function formatBulletList(title: string, items: string[]): string {
  const lines = [title, '-'.repeat(title.length), ''];
  for (const item of items) {
    lines.push(`• ${item}`);
  }
  return lines.join('\n');
}

/**
 * Type guard for Installation type
 * Validates that value is a plain object (not null, array, Date, or RegExp)
 */
function isInstallation(value: unknown): value is Installation {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp)
  );
}

/**
 * Format installation instructions with type-safe handling
 */
function formatInstallation(installation: unknown): string {
  if (!isInstallation(installation)) {
    return '';
  }

  const inst = installation as Installation;
  const lines = ['INSTALLATION', '------------', ''];

  // Claude Desktop installation
  if (inst.claudeDesktop) {
    lines.push('CLAUDE DESKTOP:', '');

    if (inst.claudeDesktop.steps) {
      inst.claudeDesktop.steps.forEach((step, idx) => {
        lines.push(`${idx + 1}. ${step}`);
      });
    }

    if (inst.claudeDesktop.configPath) {
      lines.push('', 'Configuration file locations:');
      for (const [os, pathValue] of Object.entries(inst.claudeDesktop.configPath)) {
        lines.push(`  ${os}: ${pathValue}`);
      }
    }

    lines.push('');
  }

  // Claude Code installation
  if (inst.claudeCode) {
    lines.push('CLAUDE CODE:', '');

    // For MCP servers, claudeCode is a string (simple command)
    if (typeof inst.claudeCode === 'string') {
      lines.push(inst.claudeCode);
    }
    // For hooks/commands, claudeCode has steps
    else if (inst.claudeCode.steps) {
      inst.claudeCode.steps.forEach((step, idx) => {
        lines.push(`${idx + 1}. ${step}`);
      });
    }

    lines.push('');
  }

  // Requirements
  if (inst.requirements) {
    lines.push('Requirements:');
    for (const req of inst.requirements) {
      lines.push(`• ${req}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Configuration formatter function type
 * Takes raw config object and returns formatted text output
 */
type ConfigFormatter = (config: Record<string, unknown>) => string;

/**
 * Configuration formatter registry - eliminates switch/case pattern
 *
 * Registry-driven approach for mapping categories to formatters.
 * Replaces 14-line switch statement with type-safe lookup.
 *
 * Architecture:
 * - Partial mapping allows categories without configuration sections
 * - Type-safe with explicit formatter signatures
 * - Shared formatter for agents/commands/rules (formatAiConfiguration)
 * - Zero updates needed when adding non-config categories
 *
 * @see formatMcpConfiguration - MCP server config formatter
 * @see formatHookConfiguration - Hook script config formatter
 * @see formatStatuslineConfiguration - Statusline display config formatter
 * @see formatAiConfiguration - AI model config formatter (agents/commands/rules)
 */
const CONFIG_FORMATTERS: Partial<Record<string, ConfigFormatter>> = {
  mcp: (config) => formatMcpConfiguration(config as MCPConfiguration),
  hooks: (config) => formatHookConfiguration(config as HookConfiguration),
  statuslines: (config) => formatStatuslineConfiguration(config as StatuslineConfiguration),
  // Shared AI configuration formatter for content types with temperature/maxTokens
  agents: (config) => formatAiConfiguration(config as AIConfiguration),
  commands: (config) => formatAiConfiguration(config as AIConfiguration),
  rules: (config) => formatAiConfiguration(config as AIConfiguration),
};

/**
 * Format configuration based on content type using registry-driven approach
 *
 * Modern 2025 Architecture:
 * - Configuration-driven: Uses CONFIG_FORMATTERS registry
 * - Type-safe: Explicit formatter mapping
 * - Zero duplication: Eliminated 14-line switch statement
 * - Extensible: Add new formatters without modifying this function
 *
 * @param config - Configuration object to format
 * @param category - Content category identifier
 * @returns Formatted configuration text or empty string if no formatter
 *
 * @example
 * ```typescript
 * // MCP configuration
 * formatConfiguration({ claudeDesktop: {...} }, 'mcp')
 * // Returns: "CONFIGURATION\n-------------\n..."
 *
 * // Category without configuration
 * formatConfiguration({}, 'collections')
 * // Returns: ""
 * ```
 */
function formatConfiguration(config: Record<string, unknown>, category: string): string {
  const formatter = CONFIG_FORMATTERS[category];
  return formatter ? formatter(config) : '';
}

/**
 * Format MCP server configuration with type safety
 * Internal: reads from 'mcp' field (consistent with schema)
 */
function formatMcpConfiguration(config: MCPConfiguration): string {
  const lines = ['CONFIGURATION', '-------------', ''];

  // Claude Desktop MCP Servers
  if (config.claudeDesktop?.mcp) {
    lines.push('Claude Desktop MCP Servers:', '');

    for (const [serverName, serverConfig] of Object.entries(config.claudeDesktop.mcp)) {
      lines.push(`Server: ${serverName}`);

      if (serverConfig.command) lines.push(`  Command: ${serverConfig.command}`);
      if (serverConfig.args) {
        lines.push(`  Arguments: ${serverConfig.args.join(' ')}`);
      }
      if (serverConfig.env) {
        lines.push('  Environment:');
        for (const [key, value] of Object.entries(serverConfig.env)) {
          lines.push(`    ${key}=${value}`);
        }
      }
      if (serverConfig.url) lines.push(`  URL: ${serverConfig.url}`);
      if (serverConfig.transport) lines.push(`  Transport: ${serverConfig.transport}`);

      lines.push('');
    }
  }

  // Claude Code MCP Servers
  if (config.claudeCode?.mcp) {
    lines.push('Claude Code MCP Servers:', '');

    for (const [serverName, serverConfig] of Object.entries(config.claudeCode.mcp)) {
      lines.push(`Server: ${serverName}`);

      if (serverConfig.command) lines.push(`  Command: ${serverConfig.command}`);
      if (serverConfig.args) {
        lines.push(`  Arguments: ${serverConfig.args.join(' ')}`);
      }
      if (serverConfig.env) {
        lines.push('  Environment:');
        for (const [key, value] of Object.entries(serverConfig.env)) {
          lines.push(`    ${key}=${value}`);
        }
      }

      lines.push('');
    }
  }

  // HTTP transport config
  if (config.http) {
    lines.push('HTTP Transport:', '');
    lines.push(`  URL: ${config.http.url}`);
    if (config.http.headers) {
      lines.push('  Headers:');
      for (const [key, value] of Object.entries(config.http.headers)) {
        lines.push(`    ${key}: ${value}`);
      }
    }
    lines.push('');
  }

  // SSE transport config
  if (config.sse) {
    lines.push('SSE Transport:', '');
    lines.push(`  URL: ${config.sse.url}`);
    if (config.sse.headers) {
      lines.push('  Headers:');
      for (const [key, value] of Object.entries(config.sse.headers)) {
        lines.push(`    ${key}: ${value}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format hook configuration with script content and type safety
 */
function formatHookConfiguration(config: HookConfiguration): string {
  const lines = ['CONFIGURATION', '-------------', ''];

  // Hook Config
  if (config.hookConfig?.hooks) {
    lines.push('Hook Configuration:', '');

    for (const [hookType, hookConfigValue] of Object.entries(config.hookConfig.hooks)) {
      lines.push(`Hook Type: ${hookType}`);

      // Handle both single config and array of configs
      const configs = Array.isArray(hookConfigValue) ? hookConfigValue : [hookConfigValue];

      for (const [idx, hook] of configs.entries()) {
        if (configs.length > 1) {
          lines.push(`  Config ${idx + 1}:`);
        }

        if (hook.script) lines.push(`  Script: ${hook.script}`);
        if (hook.matchers) {
          lines.push(`  Matchers: ${hook.matchers.join(', ')}`);
        }
        if (hook.timeout) lines.push(`  Timeout: ${hook.timeout}ms`);
        if (hook.description) lines.push(`  Description: ${hook.description}`);
      }

      lines.push('');
    }
  }

  // Script Content (THE ACTUAL HOOK SCRIPT - CRITICAL!)
  if (config.scriptContent) {
    lines.push('HOOK SCRIPT', '-----------', '', config.scriptContent);
  }

  return lines.join('\n');
}

/**
 * Format statusline configuration with type safety
 */
function formatStatuslineConfiguration(config: StatuslineConfiguration): string {
  const lines = ['CONFIGURATION', '-------------', ''];

  if (config.format) lines.push(`Format: ${config.format}`);
  if (config.refreshInterval) lines.push(`Refresh Interval: ${config.refreshInterval}ms`);
  if (config.position) lines.push(`Position: ${config.position}`);
  if (config.colorScheme) lines.push(`Color Scheme: ${config.colorScheme}`);

  return lines.join('\n');
}

/**
 * Format AI configuration (agents, commands, rules) with type safety
 */
function formatAiConfiguration(config: AIConfiguration): string {
  const lines = ['CONFIGURATION', '-------------', ''];

  if (config.temperature !== undefined) {
    lines.push(`Temperature: ${config.temperature}`);
  }
  if (config.maxTokens !== undefined) {
    lines.push(`Max Tokens: ${config.maxTokens}`);
  }
  if (config.systemPrompt) {
    lines.push('', 'System Prompt:', config.systemPrompt);
  }

  return lines.join('\n');
}

/**
 * Type guard for TroubleshootingItem
 */
function isTroubleshootingItem(value: unknown): value is TroubleshootingItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'issue' in value &&
    'solution' in value &&
    typeof (value as TroubleshootingItem).issue === 'string' &&
    typeof (value as TroubleshootingItem).solution === 'string'
  );
}

/**
 * Format troubleshooting section with type safety
 */
function formatTroubleshooting(items: TroubleshootingEntry[]): string {
  const lines = ['TROUBLESHOOTING', '---------------', ''];

  for (const [idx, item] of items.entries()) {
    if (isTroubleshootingItem(item)) {
      lines.push(`${idx + 1}. ${item.issue}`);
      lines.push(`   Solution: ${item.solution}`);
      lines.push('');
    } else if (typeof item === 'string') {
      lines.push(`• ${item}`);
    }
  }

  return lines.join('\n');
}

/**
 * Type guard for CodeExample (baseUsageExampleSchema)
 */
function isCodeExample(value: unknown): value is CodeExample {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'language' in value &&
    typeof (value as CodeExample).code === 'string' &&
    typeof (value as CodeExample).language === 'string'
  );
}

/**
 * Type guard for RuleExample
 */
function isRuleExample(value: unknown): value is RuleExample {
  return (
    typeof value === 'object' &&
    value !== null &&
    'title' in value &&
    !('code' in value) && // Distinguish from CodeExample
    ('prompt' in value || 'expectedOutcome' in value) // Must have at least one rule-specific field
  );
}

/**
 * Format examples section based on content type with type safety
 */
function formatExamples(examples: Example[], category: string): string {
  const lines = ['USAGE EXAMPLES', '--------------', ''];

  for (const [idx, example] of examples.entries()) {
    // Code examples (MCP, hooks, etc.) - from baseUsageExampleSchema
    if (isCodeExample(example)) {
      lines.push(`${idx + 1}. ${example.title}`);
      if (example.description) lines.push(`   ${example.description}`);
      lines.push(`   Language: ${example.language}`);
      lines.push('   Code:');
      lines.push(`   \`\`\`${example.language}`);
      lines.push(`   ${example.code}`);
      lines.push('   ```');
      lines.push('');
    }
    // Rule-specific examples with prompt/outcome
    else if (category === 'rules' && isRuleExample(example)) {
      lines.push(`${idx + 1}. ${example.title}`);
      if (example.description) lines.push(`   ${example.description}`);
      if (example.prompt) lines.push(`   Prompt: ${example.prompt}`);
      if (example.expectedOutcome) lines.push(`   Expected: ${example.expectedOutcome}`);
      lines.push('');
    }
    // Simple string examples (fallback)
    else if (typeof example === 'string') {
      lines.push(`• ${example}`);
    }
  }

  return lines.join('\n');
}

/**
 * Build technical details section
 */
function buildTechnicalDetails(item: ContentItem): string {
  const lines = ['TECHNICAL DETAILS', '-----------------', ''];

  // Package info (MCP servers)
  if (item.category === 'mcp' && 'package' in item && item.package) {
    lines.push(`Package: ${item.package}`);
  }

  // Hook type
  if (item.category === 'hooks' && 'hookType' in item) {
    lines.push(`Hook Type: ${item.hookType}`);
  }

  // Statusline type
  if (item.category === 'statuslines' && 'statuslineType' in item) {
    lines.push(`Statusline Type: ${item.statuslineType}`);
  }

  // Authentication (MCP)
  if (item.category === 'mcp') {
    if ('requiresAuth' in item && item.requiresAuth) {
      lines.push('Authentication Required: Yes');
      if ('authType' in item && item.authType) {
        lines.push(`Authentication Type: ${item.authType}`);
      }
    }

    // Permissions
    if ('permissions' in item && item.permissions && item.permissions.length > 0) {
      lines.push(`Permissions: ${item.permissions.join(', ')}`);
    }

    // Tools/Resources provided
    if ('toolsProvided' in item && item.toolsProvided && item.toolsProvided.length > 0) {
      lines.push(`Tools Provided: ${item.toolsProvided.join(', ')}`);
    }
    if (
      'resourcesProvided' in item &&
      item.resourcesProvided &&
      item.resourcesProvided.length > 0
    ) {
      lines.push(`Resources Provided: ${item.resourcesProvided.join(', ')}`);
    }
    if ('dataTypes' in item && item.dataTypes && item.dataTypes.length > 0) {
      lines.push(`Data Types: ${item.dataTypes.join(', ')}`);
    }

    // MCP protocol version
    if ('mcpVersion' in item && item.mcpVersion) {
      lines.push(`MCP Version: ${item.mcpVersion}`);
    }
    if ('serverType' in item && item.serverType) {
      lines.push(`Server Type: ${item.serverType}`);
    }

    // Config location
    if ('configLocation' in item && item.configLocation) {
      lines.push(`Config Location: ${item.configLocation}`);
    }
  }

  // Related rules (rules only)
  if (
    item.category === 'rules' &&
    'relatedRules' in item &&
    item.relatedRules &&
    item.relatedRules.length > 0
  ) {
    lines.push(`Related Rules: ${item.relatedRules.join(', ')}`);
  }

  // Expertise areas (rules only)
  if (
    item.category === 'rules' &&
    'expertiseAreas' in item &&
    item.expertiseAreas &&
    item.expertiseAreas.length > 0
  ) {
    lines.push(`Expertise Areas: ${item.expertiseAreas.join(', ')}`);
  }

  // Documentation URL
  if ('documentationUrl' in item && item.documentationUrl) {
    lines.push(`Documentation: ${item.documentationUrl}`);
  }

  // GitHub URL (commands, rules)
  if ('githubUrl' in item && item.githubUrl) {
    lines.push(`GitHub: ${item.githubUrl}`);
  }

  return lines.join('\n');
}
