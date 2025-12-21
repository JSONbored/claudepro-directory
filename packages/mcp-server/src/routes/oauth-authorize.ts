/**
 * OAuth 2.1 Authorization Endpoint
 *
 * Proxies OAuth authorization requests to Supabase Auth OAuth 2.1 Server with the resource parameter
 * (RFC 8707) to ensure tokens include the MCP server URL in the audience claim.
 *
 * **IMPORTANT:** This requires OAuth 2.1 Server to be enabled in your Supabase project.
 * Enable it in: Authentication > OAuth Server in the Supabase dashboard.
 *
 * This endpoint enables full OAuth 2.1 flow for MCP clients:
 * 1. Client initiates OAuth with resource parameter
 * 2. Supabase Auth OAuth 2.1 Server validates and redirects to authorization UI
 * 3. User authenticates (using existing account) and approves/denies
 * 4. Token issued with correct audience claim (from resource parameter)
 * 5. Client uses token with MCP server
 */

import type { RuntimeEnv, RuntimeLogger } from '../types/runtime.js';
import { parseSimpleEnv, getEnvOrDefault } from '../lib/env-config.js';
import { createSimpleLogger } from '../lib/logger-utils.js';
import { normalizeError } from '@heyclaude/shared-runtime';
import { sanitizeString } from '../lib/utils.js';

/**
 * Create an OAuth-style JSON error response
 *
 * @param error - OAuth error code to return (e.g., `invalid_request`, `server_error`)
 * @param description - Human-readable error description
 * @param status - HTTP status code to send (400 or 500); defaults to 400
 * @returns A Response with JSON body containing `error` and `error_description`
 */
function jsonError(
  error: string,
  description: string,
  status: 400 | 500 = 400
): Response {
  return new Response(
    JSON.stringify({ error, error_description: description }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

/**
 * Proxies incoming OAuth authorization requests to Supabase Auth OAuth 2.1 Server, injecting the RFC 8707 `resource` parameter for MCP audience and preserving required OAuth and PKCE parameters.
 *
 * **IMPORTANT:** This requires OAuth 2.1 Server to be enabled in your Supabase project.
 * Enable it in: Authentication > OAuth Server in the Supabase dashboard.
 *
 * Performs required validation for `client_id`, `response_type` (must be `code`), `redirect_uri`, and PKCE (`code_challenge` / `code_challenge_method` must be `S256`) and returns appropriate JSON OAuth error responses on validation failure.
 *
 * @param request - Request object
 * @param env - Cloudflare Workers env
 * @param url - Parsed URL object
 * @returns A redirect Response to the Supabase Auth `/oauth/authorize` endpoint (OAuth 2.1 Server) when the request is valid, or a JSON error Response describing the validation or server error.
 */
export async function handleOAuthAuthorize(
  _request: Request,
  env: RuntimeEnv,
  url: URL,
  logger?: RuntimeLogger
): Promise<Response> {
  // Create simple logger if not provided
  const log = logger || createSimpleLogger();

  try {
    const config = parseSimpleEnv(env);
    const supabaseAuthUrl = `${config.supabase.url}/auth/v1`;
    const mcpServerUrl = getEnvOrDefault(env, 'MCP_SERVER_URL', 'https://mcp.claudepro.directory');
    const mcpResourceUrl = `${mcpServerUrl}/mcp`;

    // Get query parameters
    const clientId = url.searchParams.get('client_id');
    const responseType = url.searchParams.get('response_type');
    const redirectUri = url.searchParams.get('redirect_uri');
    const scope = url.searchParams.get('scope');
    const state = url.searchParams.get('state');
    const codeChallenge = url.searchParams.get('code_challenge');
    const codeChallengeMethod = url.searchParams.get('code_challenge_method');

    // Validate required parameters
    if (!(clientId && responseType && redirectUri)) {
      log.warn('Missing required OAuth parameters', { clientId: !!clientId, responseType, redirectUri: !!redirectUri });
      return jsonError('invalid_request', 'Missing required OAuth parameters', 400);
    }

    // Basic URL validation for redirect_uri to prevent open redirect attacks
    // Note: Supabase Auth also validates registered redirect URIs, but we add
    // an extra layer of defense here
    try {
      const redirectUrl = new URL(redirectUri);
      if (!['http:', 'https:'].includes(redirectUrl.protocol)) {
        return jsonError('invalid_request', 'Invalid redirect_uri protocol', 400);
      }
    } catch {
      return jsonError('invalid_request', 'Invalid redirect_uri format', 400);
    }

    // Validate response_type (OAuth 2.1 requires 'code')
    if (responseType !== 'code') {
      return jsonError(
        'unsupported_response_type',
        'Only "code" response type is supported',
        400
      );
    }

    // Validate PKCE (OAuth 2.1 requires PKCE)
    if (!(codeChallenge && codeChallengeMethod)) {
      return jsonError('invalid_request', 'PKCE (code_challenge) is required', 400);
    }

    if (codeChallengeMethod !== 'S256') {
      return jsonError('invalid_request', 'Only S256 code challenge method is supported', 400);
    }

    // Build Supabase Auth OAuth 2.1 authorization URL
    // Use /oauth/authorize endpoint (requires OAuth 2.1 Server to be enabled)
    // Include resource parameter (RFC 8707) to ensure token has correct audience
    const supabaseAuthUrlObj = new URL(`${supabaseAuthUrl}/oauth/authorize`);

    // Preserve all OAuth parameters
    supabaseAuthUrlObj.searchParams.set('client_id', sanitizeString(clientId));
    supabaseAuthUrlObj.searchParams.set('response_type', responseType);
    supabaseAuthUrlObj.searchParams.set('redirect_uri', redirectUri);

    // Add resource parameter (RFC 8707) - CRITICAL for MCP spec compliance
    // This tells Supabase Auth to include the MCP server URL in the token's audience claim
    supabaseAuthUrlObj.searchParams.set('resource', mcpResourceUrl);

    // Preserve optional parameters
    if (scope) {
      supabaseAuthUrlObj.searchParams.set('scope', sanitizeString(scope));
    }
    if (state) {
      supabaseAuthUrlObj.searchParams.set('state', sanitizeString(state));
    }
    // PKCE parameters are validated as required above, so they're always present here
    supabaseAuthUrlObj.searchParams.set('code_challenge', sanitizeString(codeChallenge));
    supabaseAuthUrlObj.searchParams.set('code_challenge_method', codeChallengeMethod);

    log.info('Redirecting to Supabase Auth OAuth 2.1', { supabaseAuthUrl: supabaseAuthUrlObj.toString() });

    // Redirect to Supabase Auth with all parameters including resource
    return Response.redirect(supabaseAuthUrlObj.toString(), 302);
  } catch (error) {
    const normalized = normalizeError(error, 'OAuth authorization proxy failed');
    log.error('OAuth authorization proxy error', normalized);
    return jsonError('server_error', 'Internal server error', 500);
  }
}
