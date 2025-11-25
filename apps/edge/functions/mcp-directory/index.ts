/**
 * HeyClaude MCP Server
 *
 * Exposes the Claude Pro Directory through the Model Context Protocol (MCP).
 * Provides real-time access to prompts, agents, MCP servers, rules, commands,
 * and more through a standardized MCP interface.
 *
 * @version 1.0.0
 * @transport Streamable HTTP (MCP Protocol 2025-06-18)
 * @endpoints
 *   - Primary: https://mcp.heyclau.de/mcp
 *   - Legacy: https://mcp.claudepro.directory/mcp
 *   - Direct: https://hgtjdifxfapoltfflowc.supabase.co/functions/v1/mcp-directory/mcp
 */

import { zodToJsonSchema } from 'npm:zod-to-json-schema@3';
import { supabaseServiceRole } from '@heyclaude/edge-runtime';
import { createDataApiContext, logError } from '@heyclaude/shared-runtime';
import { Hono } from 'hono';
import { McpServer, StreamableHttpTransport } from 'mcp-lite';
import type { z } from 'zod';
import {
  GetContentByTagInputSchema,
  GetContentDetailInputSchema,
  GetFeaturedInputSchema,
  GetMcpServersInputSchema,
  GetPopularInputSchema,
  GetRecentInputSchema,
  GetRelatedContentInputSchema,
  GetTemplatesInputSchema,
  GetTrendingInputSchema,
  ListCategoriesInputSchema,
  MCP_PROTOCOL_VERSION,
  MCP_SERVER_VERSION,
  SearchContentInputSchema,
} from './lib/types.ts';

// Import tool handlers
import { handleListCategories } from './routes/categories.ts';
import { handleGetContentDetail } from './routes/detail.ts';
import { handleGetFeatured } from './routes/featured.ts';
import { handleGetMcpServers } from './routes/mcp-servers.ts';
import { handleGetPopular } from './routes/popular.ts';
import { handleGetRecent } from './routes/recent.ts';
import { handleGetRelatedContent } from './routes/related.ts';
import { handleSearchContent } from './routes/search.ts';
import { handleGetContentByTag } from './routes/tags.ts';
import { handleGetTemplates } from './routes/templates.ts';
import { handleGetTrending } from './routes/trending.ts';

/**
 * Outer Hono app - matches function name (/mcp-directory)
 * Required by Supabase routing: all requests go to /<function-name>/*
 */
const app = new Hono();

/**
 * Inner MCP app - handles actual MCP protocol endpoints
 * Mounted at /mcp-directory, serves /mcp endpoint
 */
const mcpApp = new Hono();

/**
 * CORS configuration for MCP protocol
 * Must allow Mcp-Session-Id and MCP-Protocol-Version headers
 */
mcpApp.use('/*', async (c, next) => {
  // Handle preflight
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Mcp-Session-Id, MCP-Protocol-Version',
      'Access-Control-Expose-Headers': 'Mcp-Session-Id, MCP-Protocol-Version',
      'Access-Control-Max-Age': '86400',
    });
  }

  // Add CORS headers to response
  await next();
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Expose-Headers', 'Mcp-Session-Id, MCP-Protocol-Version');
  return;
});

/**
 * Create MCP server instance
 */
const mcp = new McpServer({
  name: 'heyclaude-mcp',
  version: MCP_SERVER_VERSION,
  /**
   * Schema adapter: Convert Zod schemas to JSON Schema for MCP
   * mcp-lite requires this for tool input validation
   */
  schemaAdapter: (schema) => {
    return zodToJsonSchema(schema as z.ZodType);
  },
});

/**
 * Get Supabase client for tool handlers
 * supabaseServiceRole is already a client instance, not a factory function
 */
const getSupabase = () => supabaseServiceRole;

/**
 * Register Core Tools (Phase 2)
 */

// 1. listCategories - List all directory categories
mcp.tool('listCategories', {
  description:
    'List all content categories in the HeyClaude directory with counts and descriptions',
  inputSchema: ListCategoriesInputSchema,
  handler: async (args) => {
    return await handleListCategories(getSupabase(), args);
  },
});

// 2. searchContent - Search with filters and pagination
mcp.tool('searchContent', {
  description:
    'Search directory content with filters, pagination, and tag support. Returns matching items with metadata.',
  inputSchema: SearchContentInputSchema,
  handler: async (args) => {
    return await handleSearchContent(getSupabase(), args);
  },
});

// 3. getContentDetail - Get complete content metadata
mcp.tool('getContentDetail', {
  description:
    'Get complete metadata for a specific content item by slug and category. Includes full description, tags, author info, and stats.',
  inputSchema: GetContentDetailInputSchema,
  handler: async (args) => {
    return await handleGetContentDetail(getSupabase(), args);
  },
});

// 4. getTrending - Get trending content
mcp.tool('getTrending', {
  description:
    'Get trending content across categories or within a specific category. Sorted by popularity and engagement.',
  inputSchema: GetTrendingInputSchema,
  handler: async (args) => {
    return await handleGetTrending(getSupabase(), args);
  },
});

// 5. getFeatured - Get featured/highlighted content
mcp.tool('getFeatured', {
  description:
    'Get featured and highlighted content from the homepage. Includes hero items, latest additions, and popular content.',
  inputSchema: GetFeaturedInputSchema,
  handler: async (args) => {
    return await handleGetFeatured(getSupabase(), args);
  },
});

// 6. getTemplates - Get submission templates
mcp.tool('getTemplates', {
  description:
    'Get submission templates for creating new content. Returns required fields and validation rules by category.',
  inputSchema: GetTemplatesInputSchema,
  handler: async (args) => {
    return await handleGetTemplates(getSupabase(), args);
  },
});

/**
 * Register Advanced Tools (Phase 3)
 */

// 7. getMcpServers - List all MCP servers with download URLs
mcp.tool('getMcpServers', {
  description: 'List all MCP servers in the directory with download URLs and configuration details',
  inputSchema: GetMcpServersInputSchema,
  handler: async (args) => {
    return await handleGetMcpServers(getSupabase(), args);
  },
});

// 8. getRelatedContent - Find related/similar content
mcp.tool('getRelatedContent', {
  description: 'Find related or similar content based on tags, category, and semantic similarity',
  inputSchema: GetRelatedContentInputSchema,
  handler: async (args) => {
    return await handleGetRelatedContent(getSupabase(), args);
  },
});

// 9. getContentByTag - Filter content by tags with AND/OR logic
mcp.tool('getContentByTag', {
  description: 'Get content filtered by specific tags with AND/OR logic support',
  inputSchema: GetContentByTagInputSchema,
  handler: async (args) => {
    return await handleGetContentByTag(getSupabase(), args);
  },
});

// 10. getPopular - Get popular content by views and engagement
mcp.tool('getPopular', {
  description: 'Get most popular content by views and engagement metrics',
  inputSchema: GetPopularInputSchema,
  handler: async (args) => {
    return await handleGetPopular(getSupabase(), args);
  },
});

// 11. getRecent - Get recently added content
mcp.tool('getRecent', {
  description: 'Get recently added content sorted by date',
  inputSchema: GetRecentInputSchema,
  handler: async (args) => {
    return await handleGetRecent(getSupabase(), args);
  },
});

/**
 * Bind StreamableHttpTransport to MCP server
 * This creates the handler that processes MCP protocol requests
 */
const transport = new StreamableHttpTransport();
const mcpHandler = transport.bind(mcp);

/**
 * Health check endpoint
 * Returns server information and available endpoints
 */
mcpApp.get('/', (c) => {
  return c.json({
    name: 'heyclaude-mcp',
    version: MCP_SERVER_VERSION,
    protocol: MCP_PROTOCOL_VERSION,
    description: 'HeyClaude MCP Server - Access the Claude Pro Directory via MCP',
    endpoints: {
      mcp: '/mcp-directory/mcp',
      health: '/mcp-directory/',
    },
    documentation: 'https://heyclau.de/mcp/heyclaude-mcp',
    status: 'operational',
    tools: {
      core: 6, // Phase 2 complete
      advanced: 5, // Phase 3 complete
      total: 11, // All tools implemented
    },
  });
});

/**
 * MCP protocol endpoint
 * Handles all MCP requests (tool calls, resource requests, etc.)
 */
mcpApp.all('/mcp', async (c) => {
  const logContext = createDataApiContext('mcp-protocol', {
    app: 'mcp-directory',
    method: c.req.method,
  });

  try {
    // Get the raw Request object from Hono context
    const request = c.req.raw;

    // Pass to MCP handler
    const response = await mcpHandler(request);

    return response;
  } catch (error) {
    logError('MCP protocol error handling request', logContext, error);

    // Return MCP-formatted error
    return c.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603, // Internal error
          message: 'Internal server error',
        },
        id: null,
      },
      500
    );
  }
});

// Mount mcpApp at /mcp-directory path
app.route('/mcp-directory', mcpApp);

// Export the Deno serve handler
// This is the required export for Supabase Edge Functions
Deno.serve(app.fetch);
