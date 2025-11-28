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
import type { Database } from '@heyclaude/database-types';
import { edgeEnv, initRequestLogging, requireAuthUser, traceRequestComplete, traceStep } from '@heyclaude/edge-runtime';
import { createDataApiContext, logError, logger } from '@heyclaude/shared-runtime';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { Hono } from 'hono';
import { McpServer, StreamableHttpTransport } from 'mcp-lite';
import type { z } from 'zod';

/**
 * Authentication error for typed error handling
 */
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

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
import {
  handleAuthorizationServerMetadata,
  handleProtectedResourceMetadata,
} from './routes/auth-metadata.ts';
// Import tool handlers
import { handleListCategories } from './routes/categories.ts';
import { handleGetContentDetail } from './routes/detail.ts';
import { handleGetFeatured } from './routes/featured.ts';
import { handleGetMcpServers } from './routes/mcp-servers.ts';
import { handleOAuthAuthorize } from './routes/oauth-authorize.ts';
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
 * MCP server configuration
 * Note: A new McpServer instance is created per request (see requestMcp below)
 * This allows each request to have its own authenticated Supabase client
 */

/**
 * Create a Supabase client scoped to the provided authentication token.
 *
 * @param token - The user's access token used to set the `Authorization: Bearer <token>` header for row-level security
 * @returns A Supabase client instance configured to send the provided token with every request
 */
function getAuthenticatedSupabase(_user: User, token: string) {
  const {
    supabase: { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY },
  } = edgeEnv;

  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}

/**
 * Register Core Tools (Phase 2)
 */

/**
 * Register all MCP tools on the provided server using the given per-request Supabase client.
 *
 * Registers the directory tools (listCategories, searchContent, getContentDetail, getTrending, getFeatured,
 * getTemplates, getMcpServers, getRelatedContent, getContentByTag, getPopular, getRecent) to operate
 * against the authenticated Supabase instance for the current request.
 *
 * @param mcpServer - MCP server instance to register tools on
 * @param supabase - Authenticated per-request Supabase client bound to the request's user/token
 */
function registerAllTools(
  mcpServer: McpServer,
  supabase: ReturnType<typeof getAuthenticatedSupabase>
) {
  // 1. listCategories - List all directory categories
  mcpServer.tool('listCategories', {
    description:
      'List all content categories in the HeyClaude directory with counts and descriptions',
    inputSchema: ListCategoriesInputSchema,
    handler: async (args) => await handleListCategories(supabase, args),
  });

  // 2. searchContent - Search with filters and pagination
  mcpServer.tool('searchContent', {
    description:
      'Search directory content with filters, pagination, and tag support. Returns matching items with metadata.',
    inputSchema: SearchContentInputSchema,
    handler: async (args) => await handleSearchContent(supabase, args),
  });

  // 3. getContentDetail - Get complete content metadata
  mcpServer.tool('getContentDetail', {
    description:
      'Get complete metadata for a specific content item by slug and category. Includes full description, tags, author info, and stats.',
    inputSchema: GetContentDetailInputSchema,
    handler: async (args) => await handleGetContentDetail(supabase, args),
  });

  // 4. getTrending - Get trending content
  mcpServer.tool('getTrending', {
    description:
      'Get trending content across categories or within a specific category. Sorted by popularity and engagement.',
    inputSchema: GetTrendingInputSchema,
    handler: async (args) => await handleGetTrending(supabase, args),
  });

  // 5. getFeatured - Get featured/highlighted content
  mcpServer.tool('getFeatured', {
    description:
      'Get featured and highlighted content from the homepage. Includes hero items, latest additions, and popular content.',
    inputSchema: GetFeaturedInputSchema,
    handler: async (args) => await handleGetFeatured(supabase, args),
  });

  // 6. getTemplates - Get submission templates
  mcpServer.tool('getTemplates', {
    description:
      'Get submission templates for creating new content. Returns required fields and validation rules by category.',
    inputSchema: GetTemplatesInputSchema,
    handler: async (args) => await handleGetTemplates(supabase, args),
  });

  // 7. getMcpServers - List all MCP servers with download URLs
  mcpServer.tool('getMcpServers', {
    description:
      'List all MCP servers in the directory with download URLs and configuration details',
    inputSchema: GetMcpServersInputSchema,
    handler: async (args) => await handleGetMcpServers(supabase, args),
  });

  // 8. getRelatedContent - Find related/similar content
  mcpServer.tool('getRelatedContent', {
    description: 'Find related or similar content based on tags, category, and semantic similarity',
    inputSchema: GetRelatedContentInputSchema,
    handler: async (args) => await handleGetRelatedContent(supabase, args),
  });

  // 9. getContentByTag - Filter content by tags with AND/OR logic
  mcpServer.tool('getContentByTag', {
    description: 'Get content filtered by specific tags with AND/OR logic support',
    inputSchema: GetContentByTagInputSchema,
    handler: async (args) => await handleGetContentByTag(supabase, args),
  });

  // 10. getPopular - Get popular content by views and engagement
  mcpServer.tool('getPopular', {
    description: 'Get most popular content by views and engagement metrics',
    inputSchema: GetPopularInputSchema,
    handler: async (args) => await handleGetPopular(supabase, args),
  });

  // 11. getRecent - Get recently added content
  mcpServer.tool('getRecent', {
    description: 'Get recently added content sorted by date',
    inputSchema: GetRecentInputSchema,
    handler: async (args) => await handleGetRecent(supabase, args),
  });
}

/**
 * Note: MCP transport is created per-request in the /mcp endpoint handler
 * to ensure each request has its own authenticated Supabase client context
 * Tools are registered on each per-request instance with the authenticated Supabase client
 * to enforce Row-Level Security (RLS) policies.
 */

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
      protectedResourceMetadata: '/mcp-directory/.well-known/oauth-protected-resource',
      authorizationServerMetadata: '/mcp-directory/.well-known/oauth-authorization-server',
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
 * OAuth Protected Resource Metadata (RFC 9728)
 * Endpoint: GET /.well-known/oauth-protected-resource
 *
 * MCP clients use this to discover the authorization server
 */
mcpApp.get('/.well-known/oauth-protected-resource', handleProtectedResourceMetadata);

/**
 * OAuth Authorization Server Metadata (RFC 8414)
 * Endpoint: GET /.well-known/oauth-authorization-server
 *
 * Provides metadata about Supabase Auth as the authorization server
 */
mcpApp.get('/.well-known/oauth-authorization-server', handleAuthorizationServerMetadata);

/**
 * OAuth Authorization Endpoint Proxy
 * Endpoint: GET /oauth/authorize
 *
 * Proxies OAuth authorization requests to Supabase Auth with resource parameter (RFC 8707)
 * This ensures tokens include the MCP server URL in the audience claim.
 */
mcpApp.get('/oauth/authorize', handleOAuthAuthorize);

/**
 * Provide the MCP server resource URL used to validate token audience.
 *
 * @returns The MCP server resource URL — the value of the `MCP_SERVER_URL` environment variable if set, otherwise `https://mcp.heyclau.de/mcp`.
 */
function getMcpServerResourceUrl(): string {
  // Use environment variable if set, otherwise default to production URL
  return Deno.env.get('MCP_SERVER_URL') || 'https://mcp.heyclau.de/mcp';
}

/**
 * Check whether a JWT's audience includes the MCP resource or a compatible Supabase audience.
 *
 * Decodes the token payload without performing signature verification (assumes the token was verified earlier).
 *
 * @param token - The JWT string to inspect
 * @param expectedAudience - The MCP resource URL expected to be present in the token's `aud` claim
 * @returns `true` if the token's `aud` includes `expectedAudience` or a compatible Supabase audience, `false` otherwise
 */
function validateTokenAudience(token: string, expectedAudience: string): boolean {
  try {
    // Decode JWT without verification (we already verified via Supabase)
    // We just need to check the audience claim
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Decode payload (base64url)
    const payloadPart = parts[1];
    if (!payloadPart) {
      return false;
    }
    // Add padding if needed (base64 requires length to be multiple of 4)
    const base64String = payloadPart
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(payloadPart.length + ((4 - (payloadPart.length % 4)) % 4), '=');
    const payload = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(base64String), (c) => c.charCodeAt(0))
      )
    );

    // Check audience claim
    // Per MCP spec (RFC 8707), tokens MUST include the resource in the audience claim
    const aud = payload.aud;
    if (!aud) {
      // OAuth 2.1 with resource parameter requires audience claim
      // Reject tokens without audience for security
      return false;
    }

    // Audience can be string or array
    const audiences = Array.isArray(aud) ? aud : [aud];

    // For OAuth 2.1 with resource parameter, the audience MUST match the MCP server URL
    // This prevents token passthrough attacks
    const hasMcpServerAudience = audiences.some((a) => a === expectedAudience);

    if (hasMcpServerAudience) {
      return true;
    }

    // Fallback: Accept Supabase project URL as audience for backward compatibility
    // This allows existing tokens to work while we transition to full OAuth 2.1
    // TODO: Remove this fallback by 2025-06-30 / v2.0.0
    // See https://github.com/heyclaude/claudepro-directory/issues/ISSUE_NUMBER for migration status
    // NOTE: Replace ISSUE_NUMBER with actual GitHub issue number after creating tracking issue
    const supabaseUrl = edgeEnv.supabase.url;
    const hasSupabaseAudience = audiences.some((a) => {
      return a === supabaseUrl || a === `${supabaseUrl}/auth/v1`;
    });

    return hasSupabaseAudience;
  } catch (error) {
    // If we can't decode, reject (shouldn't happen since Supabase already validated)
    // Log for debugging but don't expose error details
    // Fire-and-forget error logging (non-blocking)
    const logContext = createDataApiContext('validate-token-audience', {
      app: 'mcp-directory',
    });
    logError('Failed to decode JWT token for audience validation', logContext, error).catch(() => {
      // Swallow errors from logging itself - best effort
    });
    return false;
  }
}

/**
 * Build a WWW-Authenticate header value for MCP-compliant bearer authentication.
 *
 * @param resourceMetadataUrl - The URL to the protected-resource metadata (resource_metadata) to include in the header
 * @param scope - Optional space-delimited scope string to include in the header
 * @returns A WWW-Authenticate header string containing `Bearer`, `realm="mcp"`, `resource_metadata="<url>"`, and optionally `scope="<scopes>"`
 */
function createWwwAuthenticateHeader(resourceMetadataUrl: string, scope?: string): string {
  const params = [`realm="mcp"`, `resource_metadata="${resourceMetadataUrl}"`];

  if (scope) {
    params.push(`scope="${scope}"`);
  }

  return `Bearer ${params.join(', ')}`;
}

/**
 * MCP protocol endpoint
 * Handles all MCP requests (tool calls, resource requests, etc.)
 * Requires authentication - JWT token must be provided in Authorization header
 *
 * Implements MCP OAuth 2.1 authorization per specification:
 * - Returns 401 with WWW-Authenticate header for unauthenticated requests
 * - Validates token audience (RFC 8707)
 * - Enforces Row-Level Security via authenticated Supabase client
 */
mcpApp.all('/mcp', async (c) => {
  const logContext = createDataApiContext('mcp-protocol', {
    app: 'mcp-directory',
    method: c.req.method,
  });

  // Initialize request logging with trace and bindings (Phase 1 & 2)
  initRequestLogging(logContext);
  traceStep('MCP protocol request received', logContext);
  
  // Set bindings for this request - mixin will automatically inject these into all subsequent logs
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'mcp-protocol',
    function: typeof logContext['function'] === "string" ? logContext['function'] : "unknown",
    method: c.req.method,
  });

  const mcpServerUrl = getMcpServerResourceUrl();
  const resourceMetadataUrl = `${mcpServerUrl.replace('/mcp', '')}/.well-known/oauth-protected-resource`;

  try {
    // Require authentication for all MCP requests
    const authResult = await requireAuthUser(c.req.raw, {
      cors: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version',
      },
      errorMessage:
        'Authentication required. Please provide a valid JWT token in the Authorization header.',
    });

    if ('response' in authResult) {
      // Add WWW-Authenticate header per MCP spec (RFC 9728)
      const wwwAuthHeader = createWwwAuthenticateHeader(resourceMetadataUrl, 'mcp:tools');

      // Clone response and add WWW-Authenticate header
      const response = authResult.response;
      const newHeaders = new Headers(response.headers);
      newHeaders.set('WWW-Authenticate', wwwAuthHeader);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    // Validate token audience (RFC 8707 - Resource Indicators)
    // This ensures tokens were issued specifically for this MCP server
    if (!validateTokenAudience(authResult.token, mcpServerUrl)) {
      await logError(
        'Token audience validation failed',
        logContext,
        new Error('Token audience mismatch')
      );

      const wwwAuthHeader = createWwwAuthenticateHeader(resourceMetadataUrl, 'mcp:tools');
      return c.json(
        {
          jsonrpc: '2.0',
          error: {
            code: -32001, // Invalid token
            message: 'Token audience mismatch. Token was not issued for this resource.',
          },
          id: null,
        },
        401,
        {
          'WWW-Authenticate': wwwAuthHeader,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version',
        }
      );
    }

    // Create authenticated Supabase client for this request
    const authenticatedSupabase = getAuthenticatedSupabase(authResult.user, authResult.token);

    // Create a new MCP server instance with authenticated client for this request
    const requestMcp = new McpServer({
      name: 'heyclaude-mcp',
      version: MCP_SERVER_VERSION,
      schemaAdapter: (schema) => zodToJsonSchema(schema as z.ZodType),
    });

    // Register all tools with authenticated client
    registerAllTools(requestMcp, authenticatedSupabase);

    // Create handler for this authenticated request
    const requestTransport = new StreamableHttpTransport();
    const requestHandler = requestTransport.bind(requestMcp);

    // Get the raw Request object from Hono context
    const request = c.req.raw;

    // Pass to MCP handler
    const response = await requestHandler(request);

    // Trace successful request completion
    traceRequestComplete(logContext);

    return response;
  } catch (error) {
    await logError('MCP protocol error handling request', logContext, error);

    // Return MCP-formatted error
    const isAuthError =
      error instanceof AuthenticationError ||
      (error instanceof Error && error.name === 'AuthenticationError');

    const statusCode = isAuthError ? 401 : 500;
    const wwwAuthHeader = isAuthError
      ? createWwwAuthenticateHeader(resourceMetadataUrl, 'mcp:tools')
      : undefined;

    return c.json(
      {
        jsonrpc: '2.0',
        error: {
          code: isAuthError ? -32001 : -32603, // Invalid token or Internal error
          message: isAuthError
            ? 'Authentication required. Please provide a valid JWT token in the Authorization header.'
            : 'Internal server error',
        },
        id: null,
      },
      statusCode,
      {
        ...(wwwAuthHeader && { 'WWW-Authenticate': wwwAuthHeader }),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version',
      }
    );
  }
});

// Mount mcpApp at /mcp-directory path
app.route('/mcp-directory', mcpApp);

// Export the Deno serve handler
// This is the required export for Supabase Edge Functions
Deno.serve(app.fetch);