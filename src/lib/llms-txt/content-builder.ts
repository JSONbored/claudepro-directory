/**
 * Rich Content Builder for LLMs.txt
 * Extracts ALL structured fields from content items and formats for AI consumption
 *
 * @module llms-txt/content-builder
 * @security Type-safe extraction based on actual content schemas
 * @performance Optimized for production with minimal overhead
 */

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
 * Build complete rich content string from any content item
 * Extracts ALL available fields based on content type
 *
 * @param item - Content item (mcp, agent, hook, command, rule, statusline)
 * @returns Complete formatted content string for llms.txt
 *
 * @remarks
 * Each content type has different fields - this function handles all types safely
 */
export function buildRichContent(item: ContentItem): string {
  const sections: string[] = [];

  // 1. FEATURES SECTION
  if ('features' in item && item.features && item.features.length > 0) {
    sections.push(formatBulletList('KEY FEATURES', item.features));
  }

  // 2. USE CASES SECTION
  if ('useCases' in item && item.useCases && item.useCases.length > 0) {
    sections.push(formatBulletList('USE CASES', item.useCases));
  }

  // 3. INSTALLATION SECTION
  if ('installation' in item && item.installation) {
    sections.push(formatInstallation(item.installation));
  }

  // 4. REQUIREMENTS SECTION (hooks, rules, statuslines)
  if ('requirements' in item && item.requirements && item.requirements.length > 0) {
    sections.push(formatBulletList('REQUIREMENTS', item.requirements));
  }

  // 5. CONFIGURATION SECTION
  if ('configuration' in item && item.configuration) {
    sections.push(formatConfiguration(item.configuration, item.category));
  }

  // 6. SECURITY SECTION (MCP-specific)
  if (item.category === 'mcp' && 'security' in item && item.security && item.security.length > 0) {
    sections.push(formatBulletList('SECURITY BEST PRACTICES', item.security));
  }

  // 7. TROUBLESHOOTING SECTION (mcp, hooks, rules, statuslines)
  if ('troubleshooting' in item && item.troubleshooting && item.troubleshooting.length > 0) {
    sections.push(formatTroubleshooting(item.troubleshooting));
  }

  // 8. EXAMPLES SECTION (mcp, commands, rules)
  if ('examples' in item && item.examples && item.examples.length > 0) {
    sections.push(formatExamples(item.examples, item.category));
  }

  // 9. TECHNICAL DETAILS SECTION
  sections.push(buildTechnicalDetails(item));

  // 10. PREVIEW SECTION (statuslines only)
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
 * Format installation instructions
 */
function formatInstallation(installation: Record<string, unknown>): string {
  const lines = ['INSTALLATION', '------------', ''];

  // Claude Desktop installation
  const inst: Record<string, unknown> = installation;
  const claudeDesktop = inst.claudeDesktop as Record<string, unknown> | undefined;
  if (claudeDesktop) {
    lines.push('CLAUDE DESKTOP:', '');

    if (claudeDesktop.steps && Array.isArray(claudeDesktop.steps)) {
      claudeDesktop.steps.forEach((step: string, idx: number) => {
        lines.push(`${idx + 1}. ${step}`);
      });
    }

    if (claudeDesktop.configPath && typeof claudeDesktop.configPath === 'object') {
      lines.push('', 'Configuration file locations:');
      for (const [os, pathValue] of Object.entries(claudeDesktop.configPath)) {
        lines.push(`  ${os}: ${pathValue}`);
      }
    }

    lines.push('');
  }

  // Claude Code installation
  const claudeCode = inst.claudeCode;
  if (claudeCode) {
    lines.push('CLAUDE CODE:', '');

    // For MCP servers, claudeCode is a string (simple command)
    if (typeof claudeCode === 'string') {
      lines.push(claudeCode);
    }
    // For hooks/commands, claudeCode might have steps
    else if (
      typeof claudeCode === 'object' &&
      'steps' in claudeCode &&
      Array.isArray(claudeCode.steps)
    ) {
      claudeCode.steps.forEach((step: string, idx: number) => {
        lines.push(`${idx + 1}. ${step}`);
      });
    }

    lines.push('');
  }

  // Requirements
  if (inst.requirements && Array.isArray(inst.requirements)) {
    lines.push('Requirements:');
    for (const req of inst.requirements) {
      lines.push(`• ${req}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format configuration based on content type
 */
function formatConfiguration(config: Record<string, unknown>, category: string): string {
  switch (category) {
    case 'mcp':
      return formatMcpConfiguration(config);
    case 'hooks':
      return formatHookConfiguration(config);
    case 'statuslines':
      return formatStatuslineConfiguration(config);
    case 'agents':
    case 'commands':
    case 'rules':
      return formatAiConfiguration(config);
    default:
      return '';
  }
}

/**
 * Format MCP server configuration
 */
function formatMcpConfiguration(config: Record<string, unknown>): string {
  const lines = ['CONFIGURATION', '-------------', ''];

  // Claude Desktop MCP Servers
  const claudeDesktop = config.claudeDesktop as Record<string, unknown> | undefined;
  if (claudeDesktop?.mcpServers && typeof claudeDesktop.mcpServers === 'object') {
    lines.push('Claude Desktop MCP Servers:', '');

    for (const [serverName, serverConfig] of Object.entries(claudeDesktop.mcpServers)) {
      const sc = serverConfig as Record<string, unknown>;
      lines.push(`Server: ${serverName}`);

      if (sc.command) lines.push(`  Command: ${sc.command}`);
      if (sc.args && Array.isArray(sc.args)) {
        lines.push(`  Arguments: ${sc.args.join(' ')}`);
      }
      if (sc.env && typeof sc.env === 'object' && sc.env !== null) {
        lines.push('  Environment:');
        for (const [key, value] of Object.entries(sc.env)) {
          lines.push(`    ${key}=${value}`);
        }
      }
      if (sc.url) lines.push(`  URL: ${sc.url}`);
      if (sc.transport) lines.push(`  Transport: ${sc.transport}`);

      lines.push('');
    }
  }

  // Claude Code MCP Servers
  const claudeCode = config.claudeCode as Record<string, unknown> | undefined;
  if (claudeCode?.mcpServers && typeof claudeCode.mcpServers === 'object') {
    lines.push('Claude Code MCP Servers:', '');

    for (const [serverName, serverConfig] of Object.entries(claudeCode.mcpServers)) {
      const sc = serverConfig as Record<string, unknown>;
      lines.push(`Server: ${serverName}`);

      if (sc.command) lines.push(`  Command: ${sc.command}`);
      if (sc.args && Array.isArray(sc.args)) {
        lines.push(`  Arguments: ${sc.args.join(' ')}`);
      }
      if (sc.env && typeof sc.env === 'object' && sc.env !== null) {
        lines.push('  Environment:');
        for (const [key, value] of Object.entries(sc.env)) {
          lines.push(`    ${key}=${value}`);
        }
      }

      lines.push('');
    }
  }

  // HTTP/SSE transport configs
  const http = config.http as Record<string, unknown> | undefined;
  if (http) {
    lines.push('HTTP Transport:', '');
    lines.push(`  URL: ${http.url}`);
    if (http.headers && typeof http.headers === 'object') {
      lines.push('  Headers:');
      for (const [key, value] of Object.entries(http.headers)) {
        lines.push(`    ${key}: ${value}`);
      }
    }
    lines.push('');
  }

  const sse = config.sse as Record<string, unknown> | undefined;
  if (sse) {
    lines.push('SSE Transport:', '');
    lines.push(`  URL: ${sse.url}`);
    if (sse.headers && typeof sse.headers === 'object') {
      lines.push('  Headers:');
      for (const [key, value] of Object.entries(sse.headers)) {
        lines.push(`    ${key}: ${value}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format hook configuration with script content
 */
function formatHookConfiguration(config: Record<string, unknown>): string {
  const lines = ['CONFIGURATION', '-------------', ''];

  // Hook Config
  const hookConfig = config.hookConfig as Record<string, unknown> | undefined;
  if (hookConfig?.hooks && typeof hookConfig.hooks === 'object') {
    lines.push('Hook Configuration:', '');

    for (const [hookType, hookConfigValue] of Object.entries(hookConfig.hooks)) {
      lines.push(`Hook Type: ${hookType}`);

      // Handle both single config and array of configs
      const configs = Array.isArray(hookConfigValue) ? hookConfigValue : [hookConfigValue];

      for (const [idx, hc] of configs.entries()) {
        const hook = hc as Record<string, unknown>;
        if (configs.length > 1) {
          lines.push(`  Config ${idx + 1}:`);
        }

        if (hook.script) lines.push(`  Script: ${hook.script}`);
        if (hook.matchers && Array.isArray(hook.matchers)) {
          lines.push(`  Matchers: ${hook.matchers.join(', ')}`);
        }
        if (hook.timeout) lines.push(`  Timeout: ${hook.timeout}ms`);
        if (hook.description) lines.push(`  Description: ${hook.description}`);
      }

      lines.push('');
    }
  }

  // Script Content (THE ACTUAL HOOK SCRIPT - CRITICAL!)
  if (typeof config.scriptContent === 'string') {
    lines.push('HOOK SCRIPT', '-----------', '', config.scriptContent);
  }

  return lines.join('\n');
}

/**
 * Format statusline configuration
 */
function formatStatuslineConfiguration(config: Record<string, unknown>): string {
  const lines = ['CONFIGURATION', '-------------', ''];

  if (config.format) lines.push(`Format: ${config.format}`);
  if (config.refreshInterval) lines.push(`Refresh Interval: ${config.refreshInterval}ms`);
  if (config.position) lines.push(`Position: ${config.position}`);
  if (config.colorScheme) lines.push(`Color Scheme: ${config.colorScheme}`);

  return lines.join('\n');
}

/**
 * Format AI configuration (agents, commands, rules)
 */
function formatAiConfiguration(config: Record<string, unknown>): string {
  const lines = ['CONFIGURATION', '-------------', ''];

  if (config.temperature !== undefined) {
    lines.push(`Temperature: ${config.temperature}`);
  }
  if (config.maxTokens !== undefined) {
    lines.push(`Max Tokens: ${config.maxTokens}`);
  }
  if (typeof config.systemPrompt === 'string') {
    lines.push('', 'System Prompt:', config.systemPrompt);
  }

  return lines.join('\n');
}

/**
 * Format troubleshooting section
 */
function formatTroubleshooting(items: unknown[]): string {
  const lines = ['TROUBLESHOOTING', '---------------', ''];

  for (const [idx, item] of items.entries()) {
    if (typeof item === 'object' && item !== null && 'issue' in item && 'solution' in item) {
      const troubleItem = item as Record<string, unknown>;
      lines.push(`${idx + 1}. ${troubleItem.issue}`);
      lines.push(`   Solution: ${troubleItem.solution}`);
      lines.push('');
    } else if (typeof item === 'string') {
      lines.push(`• ${item}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format examples section based on content type
 */
function formatExamples(examples: unknown[], category: string): string {
  const lines = ['USAGE EXAMPLES', '--------------', ''];

  for (const [idx, example] of examples.entries()) {
    // Rules can have structured examples
    if (
      category === 'rules' &&
      typeof example === 'object' &&
      example !== null &&
      'title' in example
    ) {
      const ex = example as Record<string, unknown>;
      lines.push(`${idx + 1}. ${ex.title}`);
      if (ex.description) lines.push(`   ${ex.description}`);
      if (ex.prompt) lines.push(`   Prompt: ${ex.prompt}`);
      if (ex.expectedOutcome) lines.push(`   Expected: ${ex.expectedOutcome}`);
      lines.push('');
    }
    // Simple string examples
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
