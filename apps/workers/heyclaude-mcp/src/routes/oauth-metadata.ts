/**
 * OAuth 2.1 Metadata Endpoints
 *
 * Implements OAuth 2.1 metadata endpoints per MCP specification (RFC 9728):
 * - /.well-known/oauth-authorization-server
 * - /.well-known/oauth-protected-resource
 */

import type { ExtendedEnv } from '@heyclaude/cloudflare-runtime/config/env';
import { parseEnv, getEnvOrDefault } from '@heyclaude/cloudflare-runtime/config/env';

/**
 * Handle OAuth metadata endpoint request
 *
 * @param request - Request object
 * @param env - Cloudflare Workers env
 * @param pathname - Request pathname
 * @returns OAuth metadata response
 */
export async function handleOAuthMetadata(_request: Request, env: ExtendedEnv, pathname: string): Promise<Response> {
  const config = await parseEnv(env);
  const mcpServerUrl = getEnvOrDefault(env, 'MCP_SERVER_URL', 'https://mcp.claudepro.directory');
  const mcpResourceUrl = `${mcpServerUrl}/mcp`;
  const supabaseUrl = config.supabase.url;
  const supabaseAuthUrl = `${supabaseUrl}/auth/v1`;

  // OAuth Authorization Server Metadata (RFC 8414)
  if (pathname === '/.well-known/oauth-authorization-server') {
    return new Response(
      JSON.stringify({
        issuer: supabaseAuthUrl,
        authorization_endpoint: `${mcpServerUrl}/oauth/authorize`, // Our proxy endpoint (adds resource parameter)
        token_endpoint: `${supabaseAuthUrl}/oauth/token`, // OAuth 2.1 token endpoint (requires OAuth 2.1 Server)
        jwks_uri: `${supabaseAuthUrl}/.well-known/jwks.json`,
        // OAuth 2.1 specific fields
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256'], // PKCE support (required for OAuth 2.1)
        scopes_supported: ['openid', 'email', 'profile', 'phone', 'mcp:tools', 'mcp:resources'],
        token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
        // Resource Indicators (RFC 8707) - MCP spec requires this
        resource_parameter_supported: true,
        // Point to Supabase's OAuth 2.1 discovery endpoint (requires OAuth 2.1 Server to be enabled)
        oauth_discovery_url: `${supabaseUrl}/.well-known/oauth-authorization-server/auth/v1`,
        // Point to OIDC discovery for full metadata
        oidc_discovery_url: `${supabaseUrl}/auth/v1/.well-known/openid-configuration`,
        // MCP-specific
        mcp_version: '2025-11-25',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }

  // OAuth Protected Resource Metadata (RFC 8707)
  if (pathname === '/.well-known/oauth-protected-resource') {
    return new Response(
      JSON.stringify({
        resource: mcpResourceUrl,
        authorization_servers: [
          supabaseAuthUrl, // Supabase Auth acts as our authorization server
        ],
        scopes_supported: [
          'mcp:tools', // Access to MCP tools
          'mcp:resources', // Access to MCP resources
        ],
        bearer_methods_supported: ['header'],
        resource_documentation: 'https://claudepro.directory/mcp/heyclaude-mcp',
        // Indicate that resource parameter (RFC 8707) is supported
        resource_parameter_supported: true,
        // MCP-specific
        mcp_version: '2025-11-25',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }

  return new Response('Not Found', { status: 404 });
}
