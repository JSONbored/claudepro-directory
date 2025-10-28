/**
 * Template Configuration System
 *
 * Config-driven template management for form pre-fill.
 * Templates are defined in JSON files for easy maintenance.
 *
 * Architecture:
 * - JSON files contain template data (agents, mcp, rules, commands, hooks, statuslines, skills)
 * - Zod schemas validate runtime data and provide TypeScript types
 * - Type-safe exports for consumption by template-selector component
 *
 * Benefits:
 * - Configuration-driven: Non-developers can add templates via JSON
 * - Maintainability: Separate data from logic
 * - Scalability: Easy to add hundreds of templates
 * - Type Safety: Runtime validation + compile-time types
 * - Future-Proofing: Can be migrated to CMS/database later
 */

import { z } from 'zod';

// Import JSON files
import agentsTemplatesRaw from './agents.json';
import commandsTemplatesRaw from './commands.json';
import hooksTemplatesRaw from './hooks.json';
import mcpTemplatesRaw from './mcp.json';
import rulesTemplatesRaw from './rules.json';
import skillsTemplatesRaw from './skills.json';
import statuslinesTemplatesRaw from './statuslines.json';

// ============================================================================
// ZOD SCHEMAS - Runtime Validation + TypeScript Types
// ============================================================================

/**
 * Base template fields shared across all template types
 */
const baseTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.string(),
});

/**
 * Agent template schema
 * System prompt configuration with temperature and token controls
 */
const agentTemplateSchema = baseTemplateSchema.extend({
  type: z.literal('agent'),
  systemPrompt: z.string(),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().int().positive(),
});

/**
 * MCP server template schema
 * NPM package configuration for Model Context Protocol servers
 */
const mcpTemplateSchema = baseTemplateSchema.extend({
  type: z.literal('mcp'),
  npmPackage: z.string(),
  serverType: z.enum(['stdio', 'sse', 'websocket']),
  installCommand: z.string(),
  configCommand: z.string(),
  toolsDescription: z.string(),
  envVars: z.string().optional(),
});

/**
 * Rules template schema
 * Claude expertise rules configuration
 */
const rulesTemplateSchema = baseTemplateSchema.extend({
  type: z.literal('rules'),
  rulesContent: z.string(),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().int().positive(),
});

/**
 * Command template schema
 * Slash command configuration with markdown content
 */
const commandTemplateSchema = baseTemplateSchema.extend({
  type: z.literal('command'),
  commandContent: z.string(),
});

/**
 * Hook template schema
 * Bash hook script configuration with trigger patterns
 */
const hookTemplateSchema = baseTemplateSchema.extend({
  type: z.literal('hook'),
  hookScript: z.string(),
  hook_type: z.enum(['pre-tool-use', 'post-tool-use', 'pre-command', 'post-command']),
  triggeredBy: z.string().optional(),
});

/**
 * Statusline template schema
 * Custom statusline script configuration with refresh and position
 */
const statuslineTemplateSchema = baseTemplateSchema.extend({
  type: z.literal('statusline'),
  statuslineScript: z.string(),
  statusline_type: z.enum(['custom', 'minimal', 'extended']),
  refreshInterval: z.string(),
  position: z.enum(['left', 'right']),
});

/**
 * Skill template schema
 * Skill guide configuration with content and installation instructions
 */
const skillTemplateSchema = baseTemplateSchema.extend({
  type: z.literal('skill'),
  skillContent: z.string(),
  requirements: z.string().optional(),
  installation: z.string().optional(),
});

/**
 * Discriminated union of all template types
 * Type-safe template handling with exhaustive type checking
 */
export const templateSchema = z.discriminatedUnion('type', [
  agentTemplateSchema,
  mcpTemplateSchema,
  rulesTemplateSchema,
  commandTemplateSchema,
  hookTemplateSchema,
  statuslineTemplateSchema,
  skillTemplateSchema,
]);

// ============================================================================
// RUNTIME VALIDATION - Parse and validate JSON data
// ============================================================================

/**
 * Validates and exports agents templates
 * Runtime type checking ensures data integrity
 */
export const AGENTS_TEMPLATES = z.array(agentTemplateSchema).parse(agentsTemplatesRaw);

/**
 * Validates and exports MCP templates
 */
export const MCP_TEMPLATES = z.array(mcpTemplateSchema).parse(mcpTemplatesRaw);

/**
 * Validates and exports rules templates
 */
export const RULES_TEMPLATES = z.array(rulesTemplateSchema).parse(rulesTemplatesRaw);

/**
 * Validates and exports command templates
 */
export const COMMANDS_TEMPLATES = z.array(commandTemplateSchema).parse(commandsTemplatesRaw);

/**
 * Validates and exports hook templates
 */
export const HOOKS_TEMPLATES = z.array(hookTemplateSchema).parse(hooksTemplatesRaw);

/**
 * Validates and exports statusline templates
 */
export const STATUSLINES_TEMPLATES = z
  .array(statuslineTemplateSchema)
  .parse(statuslinesTemplatesRaw);

/**
 * Validates and exports skill templates
 */
export const SKILLS_TEMPLATES = z.array(skillTemplateSchema).parse(skillsTemplatesRaw);

// ============================================================================
// TEMPLATE EXPORTS - Organized by content type
// ============================================================================

/**
 * All templates organized by content type
 * Used by TemplateSelector component for dropdown rendering
 */
export const TEMPLATES = {
  agents: AGENTS_TEMPLATES,
  mcp: MCP_TEMPLATES,
  rules: RULES_TEMPLATES,
  commands: COMMANDS_TEMPLATES,
  hooks: HOOKS_TEMPLATES,
  statuslines: STATUSLINES_TEMPLATES,
  skills: SKILLS_TEMPLATES,
} as const;

// ============================================================================
// TYPE EXPORTS - TypeScript type inference from Zod schemas
// ============================================================================

/**
 * TypeScript type for any template
 * Inferred from Zod schema for single source of truth
 */
export type Template = z.infer<typeof templateSchema>;

/**
 * TypeScript type for agent templates
 */
export type AgentTemplate = z.infer<typeof agentTemplateSchema>;

/**
 * TypeScript type for MCP templates
 */
export type MCPTemplate = z.infer<typeof mcpTemplateSchema>;

/**
 * TypeScript type for rules templates
 */
export type RulesTemplate = z.infer<typeof rulesTemplateSchema>;

/**
 * TypeScript type for command templates
 */
export type CommandTemplate = z.infer<typeof commandTemplateSchema>;

/**
 * TypeScript type for hook templates
 */
export type HookTemplate = z.infer<typeof hookTemplateSchema>;

/**
 * TypeScript type for statusline templates
 */
export type StatuslineTemplate = z.infer<typeof statuslineTemplateSchema>;

/**
 * TypeScript type for skill templates
 */
export type SkillTemplate = z.infer<typeof skillTemplateSchema>;
