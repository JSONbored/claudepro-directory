/**
 * MCP Server Factory
 *
 * Creates and configures the MCP server instance with all tools and resources.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { MCP_SERVER_VERSION } from '../lib/types.js';
import type { McpServerOptions, ToolContext } from '../types/runtime.js';
import { registerAllTools } from './tools/index.js';
import { registerAllResources } from './resources/index.js';
import { registerAllPrompts } from './prompts/index.js';

// Re-export types for convenience
export type { McpServerOptions } from '../types/runtime.js';

/**
 * Create and configure MCP server instance
 *
 * @param options - Server configuration options
 * @returns Configured MCP server instance
 */
export function createMcpServer(options: McpServerOptions): McpServer {
  const { prisma, user, token, env, logger, kvCache } = options;

  // Create MCP server instance
  // Note: capabilities are declared via registerTool/registerResource/registerPrompt calls
  // The SDK automatically infers capabilities from what's registered
  const mcpServer = new McpServer({
    name: 'heyclaude-mcp',
    version: MCP_SERVER_VERSION,
    // Note: schemaAdapter is not needed with @modelcontextprotocol/sdk
    // The SDK handles Zod schema conversion automatically
  });

  // Create context with KV cache (ensure kvCache is null if undefined)
  const context: ToolContext = { prisma, user, token, env, logger, kvCache: kvCache ?? null };

  // Register all tools
  registerAllTools(mcpServer, context);

  // Register all resources
  registerAllResources(mcpServer, context);

  // Register all prompts
  registerAllPrompts(mcpServer, context);

  return mcpServer;
}
