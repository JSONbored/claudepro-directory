/**
 * HeyClaude MCP Server - Cloudflare Workers Entry Point
 *
 * Exposes the Claude Pro Directory through the Model Context Protocol (MCP).
 * Provides real-time access to prompts, agents, MCP servers, rules, commands,
 * and more through a standardized MCP interface.
 *
 * @version 1.1.0
 * @transport Streamable HTTP (MCP Protocol 2025-11-25)
 * @endpoint https://mcp.claudepro.directory/mcp
 */

// agents/mcp is a Cloudflare runtime module - use dynamic import to avoid bundling issues
// This will be resolved at runtime by Cloudflare Workers
import { createPrismaClient } from '@heyclaude/cloudflare-runtime/prisma/client';
import { createSupabaseServiceRoleClient, requireAuthUser } from '@heyclaude/cloudflare-runtime/auth/supabase';
import { createLogger } from '@heyclaude/cloudflare-runtime/logging/pino';

// Import MCP server setup from package
import { createMcpServer } from '@heyclaude/mcp-server';
import { convertMcpServerOptions } from '@heyclaude/mcp-server/adapters/cloudflare-worker';

// Import route handlers from package and Cloudflare Workers adapters
import { handleHealth, handleOAuthMetadata, handleOpenAPI } from '@heyclaude/mcp-server';
import { handleOAuthToken } from './routes/oauth-token.js';
import { handleOAuthAuthorize } from './routes/oauth-authorize.js';
import { handleOAuthRevoke } from './routes/oauth-revoke.js';
import { handleOAuthIntrospect } from './routes/oauth-introspect.js';
import { handleOAuthRegister } from './routes/oauth-register.js';

// Import Cloudflare-specific types
import type { ExtendedEnv } from '@heyclaude/cloudflare-runtime/config/env';

// Import middleware from package
import { checkRateLimit, addRateLimitHeaders, createRateLimitErrorResponse } from '@heyclaude/mcp-server';

// Import OpenTelemetry instrumentation (Cloudflare-specific, lives in Worker app)
import { instrumentHandler } from './observability/axiom.js';

/**
 * Main Worker fetch handler
 *
 * Routes requests to:
 * - `/` - Health check
 * - `/.well-known/oauth-*` - OAuth metadata endpoints
 * - `/mcp` - MCP protocol endpoint (requires authentication)
 */
// ExtendedEnv type is from @heyclaude/cloudflare-runtime/config/env
// Type annotations are stripped during compilation, safe for JavaScript deployment
const handler = {
  async fetch(request: Request, env: Record<string, unknown>, ctx: ExecutionContext): Promise<Response> {
    const logger = createLogger({ name: 'heyclaude-mcp' });
    const url = new URL(request.url);

    try {
      // Handle CORS preflight (OPTIONS) requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version',
            'Access-Control-Max-Age': '86400', // 24 hours
          },
        });
      }

      // Health check endpoint (no auth required)
      if (url.pathname === '/') {
        // Note: handleHealth now requires prisma for dependency checks
        // For health check without auth, we pass undefined
        return await handleHealth({ prisma: undefined });
      }

      // OpenAPI spec endpoint (no auth required)
      if (url.pathname === '/mcp/openapi.json' || url.pathname === '/api/v1/openapi-mcp.json') {
        return await handleOpenAPI();
      }

      // OAuth metadata endpoints (no auth required)
      if (url.pathname === '/.well-known/oauth-authorization-server' || url.pathname === '/.well-known/oauth-protected-resource') {
        return await handleOAuthMetadata(request, env, url.pathname);
      }

      // OAuth authorization endpoint (proxy to Supabase with resource parameter)
      if (url.pathname === '/oauth/authorize') {
        return await handleOAuthAuthorize(request, env, url);
      }

      // OAuth token endpoint (proxy to Supabase)
      if (url.pathname === '/oauth/token') {
        return await handleOAuthToken(request, env);
      }

      // OAuth token revocation endpoint (RFC 7009) - proxy to Supabase
      if (url.pathname === '/oauth/revoke') {
        return await handleOAuthRevoke(request, env);
      }

      // OAuth token introspection endpoint (RFC 7662) - proxy to Supabase
      if (url.pathname === '/oauth/introspect') {
        return await handleOAuthIntrospect(request, env);
      }

      // OAuth dynamic client registration endpoint (RFC 7591) - proxy to Supabase
      if (url.pathname === '/oauth/register') {
        return await handleOAuthRegister(request, env);
      }

      // MCP protocol endpoint (requires authentication)
      if (url.pathname === '/mcp') {
        // Validate authentication (async - retrieves secrets from Secrets Store)
        const supabaseClient = await createSupabaseServiceRoleClient(env);
        const authResult = await requireAuthUser(supabaseClient, request, {
          cors: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version',
          },
          errorMessage: 'Missing or invalid Authorization header',
        });

        // Check if authentication failed
        if ('response' in authResult) {
          return authResult.response;
        }

        // Check rate limit (per user)
        // Determine rate limit binding name based on environment
        const isDev = env['NODE_ENV'] === 'development' || env['INFISICAL_ENV'] === 'dev';
        const rateLimitName = isDev ? 'MCP_RATE_LIMITER_DEV' : 'MCP_RATE_LIMITER_PROD';
        const rateLimitConfig = isDev
          ? { limit: 200, period: 60 } // Dev: 200 req/min
          : { limit: 100, period: 60 }; // Prod: 100 req/min

        // Rate limit utilities are already imported from package

        // Use user ID as identifier for rate limiting
        const rateLimitResult = await checkRateLimit(env, rateLimitName, authResult.user.id);

        // If rate limited, return 429 with headers
        if (!rateLimitResult.success) {
          return createRateLimitErrorResponse(rateLimitResult, rateLimitConfig, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version',
          });
        }

        // Create Prisma client with Hyperdrive
        // Hyperdrive binding from env (type provided by @cloudflare/workers-types at compile time)
        const hyperdriveRaw = env['HYPERDRIVE'];
        if (!hyperdriveRaw) {
          return new Response('Hyperdrive binding not configured', { status: 500 });
        }
        // Type assertion: Hyperdrive is provided by Cloudflare Workers runtime
        // TypeScript type-checking happens at compile time, runtime is untyped
        const hyperdrive = hyperdriveRaw as unknown as Parameters<typeof createPrismaClient>[0];
        
        const prisma = createPrismaClient(hyperdrive);

        // Get KV cache binding from env (MCP_CACHE)
        const kvCacheBinding = env['MCP_CACHE'] as { get(key: string, options?: { type?: 'text' | 'json' }): Promise<string | null>; put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>; delete(key: string): Promise<void> } | undefined;

        // Create MCP server instance using package
        // Convert Cloudflare-specific types to runtime-agnostic types
        const mcpServerOptions = convertMcpServerOptions({
          prisma,
          user: authResult.user,
          token: authResult.token,
          env: env as ExtendedEnv,
          logger,
          kvCache: kvCacheBinding ?? null,
        });
        const mcpServer = createMcpServer(mcpServerOptions);

        // Create MCP handler using dynamic import (agents/mcp is a runtime module)
        const { createMcpHandler } = await import('agents/mcp');
        const mcpHandler = createMcpHandler(mcpServer);

        // Handle MCP request
        const response = await mcpHandler(request, env, ctx);

        // Add rate limit headers to successful response
        addRateLimitHeaders(response, rateLimitResult, rateLimitConfig);

        return response;
      }

      // 404 for unknown routes
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      logger.error({ error }, 'Unhandled error in Worker');
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          ...(process.env['NODE_ENV'] === 'development' ? { stack: error instanceof Error ? error.stack : undefined } : {}),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

// Export instrumented handler with OpenTelemetry tracing
export default instrumentHandler(handler);
