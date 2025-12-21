/**
 * @heyclaude/mcp-server - Main Export
 *
 * HeyClaude MCP Server - Model Context Protocol server for Claude Pro Directory
 *
 * This package provides the core MCP server logic that can be used in:
 * - Cloudflare Workers (via apps/workers/heyclaude-mcp)
 * - Node.js HTTP server (self-hosted via CLI)
 * - Other runtime environments
 *
 * @packageDocumentation
 */

// Main MCP server factory
export { createMcpServer, type McpServerOptions } from './mcp/server.js';

// Tool registration
export { registerAllTools, type ToolContext } from './mcp/tools/index.js';

// Re-export runtime types
export type { RuntimeEnv, RuntimeLogger } from './types/runtime.js';

// Resource registration
export { registerAllResources } from './mcp/resources/index.js';

// Prompt registration
export { registerAllPrompts } from './mcp/prompts/index.js';

// Types and schemas
export * from './lib/types.js';

// Route handlers (for use in both Cloudflare Workers and Node.js server)
export { handleHealth } from './routes/health.js';
export { handleOAuthMetadata } from './routes/oauth-metadata.js';
export { handleOAuthAuthorize } from './routes/oauth-authorize.js';
export { handleOAuthToken } from './routes/oauth-token.js';
export { handleOpenAPI } from './routes/openapi.js';

// Middleware
export * from './middleware/rate-limit.js';

// Observability
// Axiom observability is Cloudflare-specific and lives in apps/workers/heyclaude-mcp
// Not exported from runtime-agnostic package

// Utilities
export * from './lib/utils.js';
export * from './lib/errors.js';

