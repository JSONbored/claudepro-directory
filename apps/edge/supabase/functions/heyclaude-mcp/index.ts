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
 *   - Primary: https://mcp.claudepro.directory/mcp
 *   - Direct: https://hgtjdifxfapoltfflowc.supabase.co/functions/v1/heyclaude-mcp/mcp
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import type { Database } from '@heyclaude/database-types';
import { edgeEnv } from '@heyclaude/edge-runtime/config/env.ts';
import { initRequestLogging, traceRequestComplete, traceStep } from '@heyclaude/edge-runtime/utils/logger-helpers.ts';
import { requireAuthUser } from '@heyclaude/edge-runtime/utils/auth.ts';
import { createDataApiContext, logError, logger } from '@heyclaude/shared-runtime/logging.ts';
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
  CreateAccountInputSchema,
  DownloadContentForPlatformInputSchema,
  GetCategoryConfigsInputSchema,
  GetChangelogInputSchema,
  GetContentByTagInputSchema,
  GetContentDetailInputSchema,
  GetFeaturedInputSchema,
  GetMcpServersInputSchema,
  GetPopularInputSchema,
  GetRecentInputSchema,
  GetRelatedContentInputSchema,
  GetSearchFacetsInputSchema,
  GetSearchSuggestionsInputSchema,
  GetSocialProofStatsInputSchema,
  GetTemplatesInputSchema,
  GetTrendingInputSchema,
  ListCategoriesInputSchema,
  MCP_PROTOCOL_VERSION,
  MCP_SERVER_VERSION,
  SearchContentInputSchema,
  SubmitContentInputSchema,
  SubscribeNewsletterInputSchema,
} from './lib/types.ts';
import { checkRateLimit } from './lib/rate-limit.ts';
import { McpErrorCode, createErrorResponse, errorToMcpError } from './lib/errors.ts';
import { withTimeout } from './lib/utils.ts';
import {
  handleAuthorizationServerMetadata,
  handleProtectedResourceMetadata,
} from './routes/auth-metadata.ts';
// Import tool handlers
import { handleListCategories } from './routes/categories.ts';
import { handleCreateAccount } from './routes/account.ts';
import { handleGetCategoryConfigs } from './routes/category-configs.ts';
import { handleGetChangelog } from './routes/changelog.ts';
import { handleGetContentDetail } from './routes/detail.ts';
import { handleDownloadContentForPlatform } from './routes/download-platform.ts';
import { handleGetFeatured } from './routes/featured.ts';
import { handleGetMcpServers } from './routes/mcp-servers.ts';
import { handleOAuthAuthorize } from './routes/oauth-authorize.ts';
import { handleSubscribeNewsletter } from './routes/newsletter.ts';
import { handleSubmitContent } from './routes/submit-content.ts';
import { handleGetPopular } from './routes/popular.ts';
import { handleGetRecent } from './routes/recent.ts';
import { handleGetRelatedContent } from './routes/related.ts';
import { handleGetSearchFacets } from './routes/search-facets.ts';
import { handleGetSearchSuggestions } from './routes/search-suggestions.ts';
import { handleSearchContent } from './routes/search.ts';
import { handleGetSocialProofStats } from './routes/social-proof.ts';
import { handleGetContentByTag } from './routes/tags.ts';
import { handleGetTemplates } from './routes/templates.ts';
import { handleGetTrending } from './routes/trending.ts';
// Import resource handlers
import {
  handleContentResource,
  handleCategoryResource,
  handleSitewideResource,
} from './resources/content.ts';

/**
 * Outer Hono app - matches function name (/heyclaude-mcp)
 * Required by Supabase routing: all requests go to /<function-name>/*
 */
const app = new Hono();

/**
 * Inner MCP app - handles actual MCP protocol endpoints
 * Mounted at /heyclaude-mcp, serves /mcp endpoint
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
 * Create a Supabase client that sends the provided user access token with every request.
 *
 * @param token - Access token to include as `Authorization: Bearer <token>` on each request
 * @returns A Supabase client instance configured to include the provided token on outbound requests
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
 * Register the HeyClaude directory MCP tools on the provided server using the given per-request Supabase client.
 *
 * Registers the directory toolset and binds each tool's handler to the supplied authenticated Supabase client so
 * all tool operations run in the context of the current request's user/token. Tools registered include listing
 * categories, searching content, retrieving content details, trending/featured/templates, MCP servers listing,
 * related content, content-by-tag, popular, and recent endpoints.
 *
 * All tool handlers are wrapped with timeout protection (60s default) to prevent hanging requests.
 *
 * @param mcpServer - MCP server instance to register tools on
 * @param supabase - Authenticated, per-request Supabase client bound to the request's user/token
 */
function registerAllTools(
  mcpServer: McpServer,
  supabase: ReturnType<typeof getAuthenticatedSupabase>
) {
  // Helper to wrap tool handlers with timeout
  const wrapWithTimeout = <T extends unknown[], R>(
    handler: (...args: T) => Promise<R>,
    toolName: string,
    timeoutMs: number = 60000
  ) => {
    return async (...args: T): Promise<R> => {
      return withTimeout(
        handler(...args),
        timeoutMs,
        `Tool ${toolName} timed out after ${timeoutMs}ms`
      );
    };
  };
  // 1. listCategories - List all directory categories
  mcpServer.tool('listCategories', {
    description:
      'List all content categories in the HeyClaude directory with counts and descriptions',
    inputSchema: ListCategoriesInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleListCategories(supabase, args),
      'listCategories',
      30000 // 30s timeout
    ),
  });

  // 2. searchContent - Search with filters and pagination
  mcpServer.tool('searchContent', {
    description:
      'Search directory content with filters, pagination, and tag support. Returns matching items with metadata.',
    inputSchema: SearchContentInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleSearchContent(supabase, args),
      'searchContent',
      45000 // 45s timeout (can be slower with complex queries)
    ),
  });

  // 3. getContentDetail - Get complete content metadata
  mcpServer.tool('getContentDetail', {
    description:
      'Get complete metadata for a specific content item by slug and category. Includes full description, tags, author info, and stats.',
    inputSchema: GetContentDetailInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleGetContentDetail(supabase, args),
      'getContentDetail',
      30000
    ),
  });

  // 4. getTrending - Get trending content
  mcpServer.tool('getTrending', {
    description:
      'Get trending content across categories or within a specific category. Sorted by popularity and engagement.',
    inputSchema: GetTrendingInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleGetTrending(supabase, args),
      'getTrending',
      30000
    ),
  });

  // 5. getFeatured - Get featured/highlighted content
  mcpServer.tool('getFeatured', {
    description:
      'Get featured and highlighted content from the homepage. Includes hero items, latest additions, and popular content.',
    inputSchema: GetFeaturedInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleGetFeatured(supabase, args),
      'getFeatured',
      45000 // Can be slower due to multiple RPC calls
    ),
  });

  // 6. getTemplates - Get submission templates
  mcpServer.tool('getTemplates', {
    description:
      'Get submission templates for creating new content. Returns required fields and validation rules by category.',
    inputSchema: GetTemplatesInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleGetTemplates(supabase, args),
      'getTemplates',
      30000
    ),
  });

  // 7. getMcpServers - List all MCP servers with download URLs
  mcpServer.tool('getMcpServers', {
    description:
      'List all MCP servers in the directory with download URLs and configuration details',
    inputSchema: GetMcpServersInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleGetMcpServers(supabase, args),
      'getMcpServers',
      30000
    ),
  });

  // 8. getRelatedContent - Find related/similar content
  mcpServer.tool('getRelatedContent', {
    description: 'Find related or similar content based on tags, category, and semantic similarity',
    inputSchema: GetRelatedContentInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleGetRelatedContent(supabase, args),
      'getRelatedContent',
      30000
    ),
  });

  // 9. getContentByTag - Filter content by tags with AND/OR logic
  mcpServer.tool('getContentByTag', {
    description: 'Get content filtered by specific tags with AND/OR logic support',
    inputSchema: GetContentByTagInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleGetContentByTag(supabase, args),
      'getContentByTag',
      30000
    ),
  });

  // 10. getPopular - Get popular content by views and engagement
  mcpServer.tool('getPopular', {
    description: 'Get most popular content by views and engagement metrics',
    inputSchema: GetPopularInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleGetPopular(supabase, args),
      'getPopular',
      30000
    ),
  });

  // 11. getRecent - Get recently added content
  mcpServer.tool('getRecent', {
    description: 'Get recently added content sorted by date',
    inputSchema: GetRecentInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleGetRecent(supabase, args),
      'getRecent',
      30000
    ),
  });

  // 12. downloadContentForPlatform - Download content formatted for platform
  mcpServer.tool('downloadContentForPlatform', {
    description:
      'Download content formatted for your platform (Claude Code, Cursor, etc.) with installation instructions. Returns ready-to-use configuration files.',
    inputSchema: DownloadContentForPlatformInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleDownloadContentForPlatform(supabase, args),
      'downloadContentForPlatform',
      45000 // Can be slower due to formatting
    ),
  });

  // 13. subscribeNewsletter - Subscribe to newsletter
  mcpServer.tool('subscribeNewsletter', {
    description:
      'Subscribe an email address to the Claude Pro Directory newsletter. Handles email validation, Resend sync, welcome email, and drip campaign enrollment via Inngest.',
    inputSchema: SubscribeNewsletterInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleSubscribeNewsletter(supabase, args),
      'subscribeNewsletter',
      30000
    ),
  });

  // 14. createAccount - Create account with OAuth
  mcpServer.tool('createAccount', {
    description:
      'Create a new account on Claude Pro Directory using OAuth (GitHub, Google, or Discord). Returns OAuth authorization URL and step-by-step instructions. Supports newsletter opt-in during account creation.',
    inputSchema: CreateAccountInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleCreateAccount(supabase, args),
      'createAccount',
      30000
    ),
  });

  // 15. submitContent - Submit content for review
  mcpServer.tool('submitContent', {
    description:
      'Submit content (agents, rules, MCP servers, etc.) to Claude Pro Directory for review. Collects submission data and provides instructions for completing submission via web interface. Requires authentication - use createAccount tool first if needed.',
    inputSchema: SubmitContentInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleSubmitContent(supabase, args),
      'submitContent',
      45000 // Can be slower due to data collection
    ),
  });

  // 16. getSearchSuggestions - Get search autocomplete suggestions
  mcpServer.tool('getSearchSuggestions', {
    description:
      'Get search suggestions based on query history. Helps discover popular searches and provides autocomplete functionality for AI agents. Returns suggestions with search counts and popularity indicators.',
    inputSchema: GetSearchSuggestionsInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleGetSearchSuggestions(supabase, args),
      'getSearchSuggestions',
      30000
    ),
  });

  // 17. getSearchFacets - Get available search facets
  mcpServer.tool('getSearchFacets', {
    description:
      'Get available search facets (categories, tags, authors) for filtering content. Helps AI agents understand what filters are available and enables dynamic filter discovery.',
    inputSchema: GetSearchFacetsInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleGetSearchFacets(supabase),
      'getSearchFacets',
      30000
    ),
  });

  // 18. getChangelog - Get content changelog
  mcpServer.tool('getChangelog', {
    description:
      'Get changelog of content updates in LLMs.txt format. Helps AI agents understand recent changes and stay current with the latest content additions and updates.',
    inputSchema: GetChangelogInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleGetChangelog(supabase, args),
      'getChangelog',
      30000
    ),
  });

  // 19. getSocialProofStats - Get community statistics
  mcpServer.tool('getSocialProofStats', {
    description:
      'Get community statistics including top contributors, recent submissions, success rate, and total user count. Provides social proof data for engagement and helps understand community activity.',
    inputSchema: GetSocialProofStatsInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleGetSocialProofStats(supabase),
      'getSocialProofStats',
      30000
    ),
  });

  // 20. getCategoryConfigs - Get category configurations
  mcpServer.tool('getCategoryConfigs', {
    description:
      'Get category-specific configurations and features. Helps understand category-specific requirements, submission guidelines, and configuration options for each content category.',
    inputSchema: GetCategoryConfigsInputSchema,
    handler: wrapWithTimeout(
      async (args) => await handleGetCategoryConfigs(supabase, args),
      'getCategoryConfigs',
      30000
    ),
  });
}

/**
 * Register MCP Resources (Phase 1: Content Delivery)
 *
 * Registers resource templates for content access in various formats.
 * Resources are accessed via URI templates and handled by onResourceRequest.
 *
 * @param mcpServer - MCP server instance to register resources on
 */
function registerAllResources(mcpServer: McpServer) {
  // Template 1: Individual content items
  mcpServer.resource({
    uriTemplate: 'claudepro://content/{category}/{slug}/{format}',
    name: 'Content Export',
    description:
      'Access any content item in LLMs.txt, Markdown, JSON, or download format',
    mimeType: 'text/plain', // Varies by format
  });

  // Template 2: Category exports
  mcpServer.resource({
    uriTemplate: 'claudepro://category/{category}/{format}',
    name: 'Category Export',
    description:
      'Export all content in a category (LLMs.txt, RSS, Atom, JSON)',
    mimeType: 'text/plain',
  });

  // Template 3: Sitewide exports
  mcpServer.resource({
    uriTemplate: 'claudepro://sitewide/{format}',
    name: 'Sitewide Export',
    description:
      'Export all directory content (LLMs.txt, README JSON, complete JSON)',
    mimeType: 'text/plain',
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
      mcp: '/heyclaude-mcp/mcp',
      health: '/heyclaude-mcp/',
      protectedResourceMetadata: '/heyclaude-mcp/.well-known/oauth-protected-resource',
      authorizationServerMetadata: '/heyclaude-mcp/.well-known/oauth-authorization-server',
    },
      documentation: 'https://claudepro.directory/mcp/heyclaude-mcp',
    status: 'operational',
    tools: {
      core: 6, // listCategories, searchContent, getContentDetail, getTrending, getFeatured, getTemplates
      advanced: 5, // getMcpServers, getRelatedContent, getContentByTag, getPopular, getRecent
      platform: 1, // downloadContentForPlatform
      growth: 3, // subscribeNewsletter, createAccount, submitContent
      enhancements: 5, // getSearchSuggestions, getSearchFacets, getChangelog, getSocialProofStats, getCategoryConfigs
      total: 20, // All tools implemented
    },
    resources: {
      templates: 3, // Phase 1: Content Delivery
      formats: ['llms', 'markdown', 'json', 'rss', 'atom', 'download'],
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
 * Gets the MCP server resource URL used to validate token audience.
 *
 * @returns The MCP server resource URL — the value of the `MCP_SERVER_URL` environment variable if set, otherwise `https://mcp.claudepro.directory/mcp`.
 */
function getMcpServerResourceUrl(): string {
  // Use environment variable if set, otherwise default to production URL
  return Deno.env.get('MCP_SERVER_URL') || 'https://mcp.claudepro.directory/mcp';
}

/**
 * Determine whether a JWT's `aud` claim includes the MCP resource URL.
 *
 * Inspects the token's `aud` claim (string or array) and returns `true` if it contains `expectedAudience`;
 * returns `false` if `aud` is missing or does not match.
 *
 * Per OAuth 2.1 with resource indicators (RFC 8707), tokens MUST include the resource URL in the audience claim.
 * This prevents token passthrough attacks by ensuring tokens are issued specifically for this MCP server.
 *
 * @param token - The JWT string to inspect (already verified by Supabase)
 * @param expectedAudience - The MCP resource URL that must be present in the token's `aud` claim
 * @returns `true` if the token's `aud` includes `expectedAudience`, `false` otherwise
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
    // This prevents token passthrough attacks (RFC 8707 - Resource Indicators)
    // Removed Supabase audience fallback (2025-01-XX) - all tokens must include MCP server URL in audience
    const hasMcpServerAudience = audiences.some((a) => a === expectedAudience);

    return hasMcpServerAudience;
  } catch (error) {
    // If we can't decode, reject (shouldn't happen since Supabase already validated)
    // Log for debugging but don't expose error details
    // Fire-and-forget error logging (non-blocking)
    const logContext = createDataApiContext('validate-token-audience', {
      app: 'heyclaude-mcp',
    });
    logError('Failed to decode JWT token for audience validation', logContext, error).catch(() => {
      // Swallow errors from logging itself - best effort
    });
    return false;
  }
}

/**
 * Builds the value for a WWW-Authenticate header used for MCP Bearer authentication.
 *
 * @param resourceMetadataUrl - URL of the protected-resource metadata to include as `resource_metadata`
 * @param scope - Optional space-delimited scope string to include as `scope`
 * @returns The WWW-Authenticate header value starting with `Bearer ` and containing `realm="mcp"`, `resource_metadata="<url>"`, and optionally `scope="<scopes>"`
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
    app: 'heyclaude-mcp',
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

    // Check global rate limiting before processing request
    // Note: We can't parse the body here because it's consumed by MCP handler
    // Per-tool rate limiting would require parsing the request body, which conflicts with MCP handler
    // Global rate limit provides protection against abuse
    const rateLimitResult = checkRateLimit(authResult.user.id);
    if (!rateLimitResult.allowed) {
      await logError('Rate limit exceeded', logContext, new Error('Rate limit exceeded'), {
        userId: authResult.user.id,
        retryAfter: rateLimitResult.retryAfter,
      });

      const wwwAuthHeader = createWwwAuthenticateHeader(resourceMetadataUrl, 'mcp:tools');
      return c.json(
        {
          jsonrpc: '2.0',
          error: {
            code: -32029, // Rate limit exceeded (custom MCP error code)
            message: `Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds.`,
            data: {
              errorCode: McpErrorCode.RATE_LIMIT_EXCEEDED,
              retryAfter: rateLimitResult.retryAfter,
              requestId: typeof logContext['request_id'] === 'string' ? logContext['request_id'] : undefined,
            },
          },
          id: null,
        },
        429,
        {
          'WWW-Authenticate': wwwAuthHeader,
          'Retry-After': String(rateLimitResult.retryAfter || 60),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining || 0),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version',
        }
      );
    }

    // Create a new MCP server instance with authenticated client for this request
    const requestMcp = new McpServer({
      name: 'heyclaude-mcp',
      version: MCP_SERVER_VERSION,
      schemaAdapter: (schema) => zodToJsonSchema(schema as z.ZodType),
    });

    // Register all tools with authenticated client (wrapped with timeout)
    registerAllTools(requestMcp, authenticatedSupabase);

    // Register all resources
    registerAllResources(requestMcp);

    // Register resource request handler
    requestMcp.onResourceRequest(async (uri) => {
      if (uri.startsWith('claudepro://content/')) {
        return handleContentResource(uri);
      }
      if (uri.startsWith('claudepro://category/')) {
        return handleCategoryResource(uri);
      }
      if (uri.startsWith('claudepro://sitewide/')) {
        return handleSitewideResource(uri);
      }
      throw new Error(`Unknown resource URI: ${uri}`);
    });

    // Create handler for this authenticated request
    const requestTransport = new StreamableHttpTransport();
    const requestHandler = requestTransport.bind(requestMcp);

    // Get the raw Request object from Hono context
    const request = c.req.raw;

    // Pass to MCP handler with timeout protection
    const response = await withTimeout(
      requestHandler(request),
      60000, // 60s timeout for entire MCP request
      'MCP request timed out after 60 seconds'
    );

    // Trace successful request completion
    traceRequestComplete(logContext);

    // Add rate limit and request ID headers to response
    const responseHeaders = new Headers(response.headers);
    const requestId = typeof logContext['request_id'] === 'string' ? logContext['request_id'] : undefined;
    
    if (rateLimitResult.allowed && rateLimitResult.remaining !== undefined) {
      responseHeaders.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
      responseHeaders.set('X-RateLimit-Reset', String(Math.ceil((Date.now() + 60000) / 1000))); // Approximate
    }
    
    if (requestId) {
      responseHeaders.set('X-Request-ID', requestId);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    await logError('MCP protocol error handling request', logContext, error);

    // Convert error to structured MCP error response
    const requestId = typeof logContext['request_id'] === 'string' ? logContext['request_id'] : undefined;
    const mcpError = errorToMcpError(error, McpErrorCode.INTERNAL_ERROR, requestId);

    // Determine status code and error code
    const isAuthError =
      error instanceof AuthenticationError ||
      (error instanceof Error && error.name === 'AuthenticationError') ||
      mcpError.code === McpErrorCode.AUTHENTICATION_REQUIRED ||
      mcpError.code === McpErrorCode.TOKEN_INVALID ||
      mcpError.code === McpErrorCode.TOKEN_AUDIENCE_MISMATCH;

    const isTimeoutError =
      error instanceof Error &&
      (error.message.includes('timed out') || error.message.includes('timeout'));

    const isRateLimitError = mcpError.code === McpErrorCode.RATE_LIMIT_EXCEEDED;

    let statusCode = 500;
    let mcpErrorCode = -32603; // Internal error

    if (isAuthError) {
      statusCode = 401;
      mcpErrorCode = -32001; // Invalid token
    } else if (isTimeoutError) {
      statusCode = 504; // Gateway timeout
      mcpErrorCode = -32000; // Server error (timeout)
    } else if (isRateLimitError) {
      statusCode = 429; // Too many requests
      mcpErrorCode = -32029; // Rate limit exceeded
    }

    const wwwAuthHeader = isAuthError
      ? createWwwAuthenticateHeader(resourceMetadataUrl, 'mcp:tools')
      : undefined;

    return c.json(
      {
        jsonrpc: '2.0',
        error: {
          code: mcpErrorCode,
          message: mcpError.message,
          data: {
            errorCode: mcpError.code,
            ...(mcpError.details && { details: mcpError.details }),
            ...(mcpError.recovery && { recovery: mcpError.recovery }),
            ...(mcpError.requestId && { requestId: mcpError.requestId }),
          },
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
        ...(requestId && { 'X-Request-ID': requestId }),
      }
    );
  }
});

// Mount mcpApp at /heyclaude-mcp path
app.route('/heyclaude-mcp', mcpApp);

// Export the Deno serve handler
// This is the required export for Supabase Edge Functions
Deno.serve(app.fetch);