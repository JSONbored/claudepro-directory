/**
 * Shared OAuth Route Implementation
 *
 * Runtime-agnostic OAuth route logic that works across different environments
 * (Cloudflare Workers, Node.js, etc.) via adapter functions.
 */

import type { RuntimeEnv, RuntimeLogger } from '../../types/runtime.js';
import { normalizeError } from '@heyclaude/shared-runtime';
import { sanitizeString } from '../../lib/utils.js';
import { getEnvOrDefault } from '../../lib/env-utils.js';

/**
 * Environment configuration interface (matches SimpleEnvConfig from env-config.ts)
 */
export interface OAuthEnvConfig {
  supabase: {
    url: string;
  };
}

/**
 * OAuth adapter interface
 * Handles runtime-specific differences (env parsing, logger creation)
 */
export interface OAuthAdapter {
  /**
   * Parse environment variables
   * Can be sync (parseSimpleEnv) or async (parseEnv)
   */
  parseEnv(env: RuntimeEnv): OAuthEnvConfig | Promise<OAuthEnvConfig>;

  /**
   * Create logger instance
   */
  createLogger(env?: RuntimeEnv): RuntimeLogger;
}

/**
 * Create an OAuth-style JSON error response
 *
 * @param error - OAuth error code to return (e.g., `invalid_request`, `server_error`)
 * @param description - Human-readable error description
 * @param status - HTTP status code to send (400 or 500); defaults to 400
 * @param allowedMethods - Allowed HTTP methods for CORS header
 * @returns A Response with JSON body containing `error` and `error_description`
 */
export function jsonError(
  error: string,
  description: string,
  status: 400 | 500 = 400,
  allowedMethods: 'GET, OPTIONS' | 'POST, OPTIONS' = 'POST, OPTIONS'
): Response {
  return new Response(
    JSON.stringify({ error, error_description: description }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': allowedMethods,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

/**
 * Shared OAuth token exchange handler implementation
 *
 * @param request - Request object
 * @param env - Runtime environment
 * @param adapter - OAuth adapter for runtime-specific operations
 * @returns Token response from Supabase Auth or error response
 */
export async function handleOAuthTokenShared(
  request: Request,
  env: RuntimeEnv,
  adapter: OAuthAdapter
): Promise<Response> {
  const log = adapter.createLogger(env);

  try {
    const config = await Promise.resolve(adapter.parseEnv(env));
    const supabaseAuthUrl = `${config.supabase.url}/auth/v1`;

    // Only allow POST requests
    if (request.method !== 'POST') {
      return jsonError('invalid_request', 'Only POST method is supported', 400);
    }

    // Parse request body (form-encoded)
    const formData = await request.formData();
    const grantType = formData.get('grant_type');
    const code = formData.get('code');
    const redirectUri = formData.get('redirect_uri');
    const clientId = formData.get('client_id');
    const codeVerifier = formData.get('code_verifier');

    // Validate required parameters
    if (!grantType || grantType !== 'authorization_code') {
      return jsonError('unsupported_grant_type', 'Only authorization_code grant type is supported', 400);
    }

    if (!code || !redirectUri || !clientId || !codeVerifier) {
      log.warn('Missing required token exchange parameters', {
        code: !!code,
        redirectUri: !!redirectUri,
        clientId: !!clientId,
        codeVerifier: !!codeVerifier,
      });
      return jsonError('invalid_request', 'Missing required parameters: code, redirect_uri, client_id, code_verifier', 400);
    }

    // Build Supabase Auth token endpoint URL
    const tokenUrl = `${supabaseAuthUrl}/oauth/token`;

    // Forward request to Supabase Auth OAuth 2.1 Server
    const tokenRequest = new Request(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: sanitizeString(code as string),
        redirect_uri: sanitizeString(redirectUri as string),
        client_id: sanitizeString(clientId as string),
        code_verifier: sanitizeString(codeVerifier as string),
      }).toString(),
    });

    log.info('Forwarding token exchange to Supabase Auth', { tokenUrl });

    const tokenResponse = await fetch(tokenRequest);

    // Get response body
    const responseBody = await tokenResponse.text();

    // Forward response from Supabase Auth
    return new Response(responseBody, {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // Forward any additional headers from Supabase
        ...Object.fromEntries(
          Array.from(tokenResponse.headers.entries()).filter(([key]) =>
            !['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())
          )
        ),
      },
    });
  } catch (error) {
    const normalized = normalizeError(error, 'OAuth token exchange failed');
    log.error('OAuth token exchange error', normalized);
    return jsonError('server_error', 'Internal server error', 500);
  }
}

/**
 * Shared OAuth authorization handler implementation
 *
 * @param _request - Request object (not used, but kept for consistency)
 * @param env - Runtime environment
 * @param url - Parsed URL object
 * @param adapter - OAuth adapter for runtime-specific operations
 * @returns A redirect Response to Supabase Auth or error response
 */
export async function handleOAuthAuthorizeShared(
  _request: Request,
  env: RuntimeEnv,
  url: URL,
  adapter: OAuthAdapter
): Promise<Response> {
  const log = adapter.createLogger(env);

  try {
    const config = await Promise.resolve(adapter.parseEnv(env));
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
      return jsonError('invalid_request', 'Missing required OAuth parameters', 400, 'GET, OPTIONS');
    }

    // Basic URL validation for redirect_uri to prevent open redirect attacks
    // Note: Supabase Auth also validates registered redirect URIs, but we add
    // an extra layer of defense here
    try {
      const redirectUrl = new URL(redirectUri);
      if (!['http:', 'https:'].includes(redirectUrl.protocol)) {
        return jsonError('invalid_request', 'Invalid redirect_uri protocol', 400, 'GET, OPTIONS');
      }
    } catch {
      return jsonError('invalid_request', 'Invalid redirect_uri format', 400, 'GET, OPTIONS');
    }

    // Validate response_type (OAuth 2.1 requires 'code')
    if (responseType !== 'code') {
      return jsonError(
        'unsupported_response_type',
        'Only "code" response type is supported',
        400,
        'GET, OPTIONS'
      );
    }

    // Validate PKCE (OAuth 2.1 requires PKCE)
    if (!(codeChallenge && codeChallengeMethod)) {
      return jsonError('invalid_request', 'PKCE (code_challenge) is required', 400, 'GET, OPTIONS');
    }

    if (codeChallengeMethod !== 'S256') {
      return jsonError('invalid_request', 'Only S256 code challenge method is supported', 400, 'GET, OPTIONS');
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
    return jsonError('server_error', 'Internal server error', 500, 'GET, OPTIONS');
  }
}

