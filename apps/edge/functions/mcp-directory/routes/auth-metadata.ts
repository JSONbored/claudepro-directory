/**
 * MCP Authorization Metadata Routes
 *
 * Implements OAuth 2.0 Protected Resource Metadata (RFC 9728)
 * and provides authorization server discovery information.
 */

import { edgeEnv, initRequestLogging, jsonResponse, traceStep } from '@heyclaude/edge-runtime';
import { createDataApiContext, getEnvVar, logError, logger } from '@heyclaude/shared-runtime';
import type { Context } from 'hono';

const MCP_SERVER_URL = getEnvVar('MCP_SERVER_URL') ?? 'https://mcp.heyclau.de';
const MCP_RESOURCE_URL = `${MCP_SERVER_URL}/mcp`;
const SUPABASE_URL = edgeEnv.supabase.url;
const SUPABASE_AUTH_URL = `${SUPABASE_URL}/auth/v1`;

/**
 * Create and initialize a logging context for metadata endpoints and bind it to the global logger.
 *
 * @param action - The name of the logging action or operation for this request
 * @param method - The HTTP method associated with the request; defaults to `'GET'`
 * @returns The created logging context for the request
 */
function setupMetadataLogging(action: string, method: string = 'GET') {
  const logContext = createDataApiContext(action, {
    app: 'mcp-directory',
    method,
  });

  // Initialize request logging with trace and bindings (Phase 1 & 2)
  initRequestLogging(logContext);
  traceStep(`${action} request received`, logContext);
  
  // Set bindings for this request - mixin will automatically inject these into all subsequent logs
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : action,
    function: typeof logContext['function'] === "string" ? logContext['function'] : "unknown",
    method,
  });

  return logContext;
}

/**
 * Provide RFC 9728 protected-resource metadata for this MCP server.
 *
 * @returns A Response with the protected resource metadata JSON (HTTP 200) on success, or an error JSON (HTTP 500) on failure.
 */
export async function handleProtectedResourceMetadata(_c: Context): Promise<Response> {
  const logContext = setupMetadataLogging('oauth-protected-resource-metadata');

  try {
    const metadata = {
      resource: MCP_RESOURCE_URL,
      authorization_servers: [
        SUPABASE_AUTH_URL, // Supabase Auth acts as our authorization server
      ],
      scopes_supported: [
        'mcp:tools', // Access to MCP tools
        'mcp:resources', // Access to MCP resources (if we add them)
      ],
      bearer_methods_supported: ['header'],
      resource_documentation: 'https://heyclau.de/mcp/heyclaude-mcp',
      // Indicate that resource parameter (RFC 8707) is supported
      resource_parameter_supported: true,
    };

    return jsonResponse(metadata, 200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
  } catch (error) {
    await logError('Failed to generate protected resource metadata', logContext, error);
    return jsonResponse({ error: 'Internal server error' }, 500, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    });
  }
}

/**
 * Serves OAuth 2.0 / OIDC authorization server metadata for this service.
 *
 * Returns metadata that advertises the issuer and endpoints, points clients to Supabase's OIDC discovery for full configuration, and exposes the service's proxy authorization endpoint to support the resource parameter.
 *
 * @returns The HTTP Response containing the authorization server metadata JSON
 */
export async function handleAuthorizationServerMetadata(_c: Context): Promise<Response> {
  const logContext = setupMetadataLogging('oauth-authorization-server-metadata');

  try {
    // Supabase Auth provides OIDC discovery at:
    // https://<project>.supabase.co/.well-known/openid-configuration
    //
    // For OAuth 2.0 Authorization Server Metadata (RFC 8414), we can either:
    // 1. Proxy to Supabase's OIDC discovery and transform it
    // 2. Return a redirect to Supabase's endpoint
    // 3. Return metadata pointing to Supabase

    // Option: Return metadata that points clients to Supabase's OIDC discovery
    // Clients should use Supabase's OIDC discovery endpoint directly
    // For OAuth 2.1 with resource parameter (RFC 8707), we need to use our proxy endpoint
    // which ensures the resource parameter is included and tokens have correct audience
    const authorizationEndpoint = `${MCP_SERVER_URL}/oauth/authorize`;

    const metadata = {
      issuer: SUPABASE_AUTH_URL,
      authorization_endpoint: authorizationEndpoint, // Our proxy endpoint
      token_endpoint: `${SUPABASE_AUTH_URL}/token`,
      // Supabase Auth supports OIDC Discovery, so clients should use that
      // This is a fallback for OAuth 2.0-only clients
      jwks_uri: `${SUPABASE_AUTH_URL}/.well-known/jwks.json`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'], // PKCE support (required for OAuth 2.1)
      scopes_supported: ['openid', 'email', 'profile', 'mcp:tools'],
      token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
      // Resource Indicators (RFC 8707) - MCP spec requires this
      resource_parameter_supported: true,
      // Point to OIDC discovery for full metadata
      oidc_discovery_url: `${SUPABASE_URL}/.well-known/openid-configuration`,
    };

    return jsonResponse(metadata, 200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
  } catch (error) {
    await logError('Failed to generate authorization server metadata', logContext, error);
    return jsonResponse({ error: 'Internal server error' }, 500, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    });
  }
}