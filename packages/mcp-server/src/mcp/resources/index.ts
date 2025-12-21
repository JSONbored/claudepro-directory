/**
 * MCP Resources Registration
 *
 * Registers all MCP resource templates with the server instance.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolContext } from '../tools/index.js';

import { registerAllResources as registerAllResourcesImpl } from './register.js';

/**
 * Register all resources on the MCP server
 *
 * @param mcpServer - MCP server instance
 * @param context - Resource handler context (same as ToolContext)
 */
export function registerAllResources(mcpServer: McpServer, context: ToolContext): void {
  registerAllResourcesImpl(mcpServer, context);
}
