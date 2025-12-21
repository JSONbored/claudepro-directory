/**
 * Prompts Registration
 *
 * Registers all MCP prompts with the server.
 * Prompts provide pre-defined templates for common workflows.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolContext } from '../../types/runtime.js';

import { registerAllPrompts as registerAllPromptsImpl } from './register.js';

/**
 * Register all prompts on the MCP server
 *
 * @param mcpServer - MCP server instance
 * @param context - Tool handler context
 */
export function registerAllPrompts(mcpServer: McpServer, context: ToolContext): void {
  registerAllPromptsImpl(mcpServer, context);
}
