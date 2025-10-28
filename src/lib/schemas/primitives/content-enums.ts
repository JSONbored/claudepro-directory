/**
 * Content Enums - Central Definitions
 * Single source of truth for all content-related enums
 * SHA-2101: Consolidation effort
 *
 * DO NOT duplicate these enums elsewhere.
 */

import { z } from 'zod';

/**
 * Hook Type Enum - Hook Lifecycle Events
 * Used in: hook.schema.ts, content-item.schema.ts, form.schema.ts
 */
export const hook_typeSchema = z.enum([
  'PostToolUse',
  'PreToolUse',
  'SessionStart',
  'SessionEnd',
  'UserPromptSubmit',
  'Notification',
  'PreCompact',
  'Stop',
  'SubagentStop',
]);

export type HookType = z.infer<typeof hook_typeSchema>;

/**
 * Hook Type Form Schema - Kebab-case variant for forms
 */
export const hook_typeFormSchema = z.enum([
  'post-tool-use',
  'pre-tool-use',
  'session-start',
  'session-end',
  'user-prompt-submit',
  'notification',
  'pre-compact',
  'stop',
  'subagent-stop',
]);

export type HookTypeForm = z.infer<typeof hook_typeFormSchema>;

/**
 * Statusline Type Enum
 */
export const statusline_typeSchema = z.enum([
  'minimal',
  'powerline',
  'custom',
  'rich',
  'simple',
  'extended',
]);

export type StatuslineType = z.infer<typeof statusline_typeSchema>;

export const statusline_typeFormSchema = statusline_typeSchema
  .extract(['custom', 'minimal', 'extended'])
  .default('custom');

/**
 * MCP Server Type Enum
 */
export const mcpServerTypeSchema = z.enum(['stdio', 'http', 'sse', 'websocket']);

export type McpServerType = z.infer<typeof mcpServerTypeSchema>;

/**
 * Authentication Type Enum
 */
export const authTypeSchema = z.enum(['api_key', 'oauth', 'connection_string', 'basic_auth']);

export type AuthType = z.infer<typeof authTypeSchema>;

/**
 * Difficulty Level Enum (lowercase for consistency)
 */
export const difficultyLevelSchema = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);

export type DifficultyLevel = z.infer<typeof difficultyLevelSchema>;

/**
 * Trend Direction Enum
 */
export const trendDirectionSchema = z.enum(['up', 'down', 'neutral', '+']);

export type TrendDirection = z.infer<typeof trendDirectionSchema>;

/**
 * Recommendation Source Enum
 */
export const recommendationSourceSchema = z.enum([
  'affinity',
  'collaborative',
  'trending',
  'interest',
  'similar',
  'usage',
]);

export type RecommendationSource = z.infer<typeof recommendationSourceSchema>;
