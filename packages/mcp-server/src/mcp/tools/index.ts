/**
 * MCP Tools Registration
 *
 * Registers all MCP tools with the server instance.
 * This module centralizes tool registration and provides context to handlers.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerAllTools as registerAllToolsImpl } from './register.js';
import type { ToolContext } from '../../types/runtime.js';

/**
 * Register all tools on the MCP server
 *
 * @param mcpServer - MCP server instance
 * @param context - Tool handler context
 */
export function registerAllTools(mcpServer: McpServer, context: ToolContext): void {
  // Call the actual registration implementation
  registerAllToolsImpl(mcpServer, context);
}

// Export ToolContext type
export type { ToolContext } from '../../types/runtime.js';
