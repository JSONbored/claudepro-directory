/**
 * Type definitions for Cloudflare's built-in agents/mcp module
 *
 * This module is provided by Cloudflare Workers runtime and provides
 * the createMcpHandler function for MCP server integration.
 */

declare module 'agents/mcp' {
  import type { ExportedHandler } from '@cloudflare/workers-types';
  import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

  /**
   * Create an MCP handler for Cloudflare Workers
   *
   * @param mcpServer - The MCP server instance
   * @returns A fetch handler that processes MCP protocol requests
   */
  export function createMcpHandler(
    mcpServer: McpServer
  ): (
    request: Request,
    env: unknown,
    ctx: ExecutionContext
  ) => Promise<Response>;
}
