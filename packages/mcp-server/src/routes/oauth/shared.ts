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

    // Validate and preserve scope parameter
    // Defense in depth: validate scopes before forwarding to Supabase
    // Supabase Auth also validates, but we add an extra layer
    if (scope) {
      const requestedScopes = scope.split(' ').filter((s) => s.length > 0);
      const supportedScopes = [
        'openid',
        'email',
        'profile',
        'phone',
        'mcp:tools',
        'mcp:resources',
      ];

      // Check if all requested scopes are supported
      const invalidScopes = requestedScopes.filter((s) => !supportedScopes.includes(s));
      if (invalidScopes.length > 0) {
        log.warn('Invalid scopes requested', { invalidScopes, requestedScopes });
        return jsonError(
          'invalid_scope',
          `Invalid scopes requested: ${invalidScopes.join(', ')}. Supported scopes: ${supportedScopes.join(', ')}`,
          400,
          'GET, OPTIONS'
        );
      }

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

/**
 * Shared OAuth token revocation handler implementation (RFC 7009)
 *
 * Proxies token revocation requests to Supabase Auth OAuth 2.1 Server.
 * Always returns 200 per RFC 7009 (even if token doesn't exist).
 *
 * @param request - Request object
 * @param env - Runtime environment
 * @param adapter - OAuth adapter for runtime-specific operations
 * @returns Revocation response from Supabase Auth (always 200 per RFC 7009)
 */
export async function handleOAuthRevokeShared(
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
    const token = formData.get('token');
    const tokenTypeHint = formData.get('token_type_hint'); // Optional: 'access_token' or 'refresh_token'
    const clientId = formData.get('client_id'); // Optional for public clients

    // Validate required parameters
    if (!token) {
      return jsonError('invalid_request', 'Missing required parameter: token', 400);
    }

    // Build Supabase Auth revocation endpoint URL
    // Note: Supabase may use /oauth/revoke or /auth/v1/oauth/revoke
    const revokeUrl = `${supabaseAuthUrl}/oauth/revoke`;

    // Forward request to Supabase Auth OAuth 2.1 Server
    const revokeRequest = new Request(revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: sanitizeString(token as string),
        ...(tokenTypeHint && { token_type_hint: sanitizeString(tokenTypeHint as string) }),
        ...(clientId && { client_id: sanitizeString(clientId as string) }),
      }).toString(),
    });

    log.info('Forwarding token revocation to Supabase Auth', { revokeUrl });

    const revokeResponse = await fetch(revokeRequest);

    // RFC 7009: Always return 200, even if token doesn't exist
    // This prevents token enumeration attacks
    return new Response(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    const normalized = normalizeError(error, 'OAuth token revocation failed');
    log.error('OAuth token revocation error', normalized);
    // RFC 7009: Always return 200, even on error
    return new Response(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
}

/**
 * Shared OAuth token introspection handler implementation (RFC 7662)
 *
 * Proxies token introspection requests to Supabase Auth OAuth 2.1 Server.
 * Allows resource servers to validate tokens and retrieve token metadata.
 *
 * @param request - Request object
 * @param env - Runtime environment
 * @param adapter - OAuth adapter for runtime-specific operations
 * @returns Introspection response from Supabase Auth or error response
 */
export async function handleOAuthIntrospectShared(
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
    const token = formData.get('token');
    const tokenTypeHint = formData.get('token_type_hint'); // Optional: 'access_token' or 'refresh_token'

    // Validate required parameters
    if (!token) {
      return jsonError('invalid_request', 'Missing required parameter: token', 400);
    }

    // Build Supabase Auth introspection endpoint URL
    // Note: Supabase may use /oauth/introspect or /auth/v1/oauth/introspect
    const introspectUrl = `${supabaseAuthUrl}/oauth/introspect`;

    // Forward request to Supabase Auth OAuth 2.1 Server
    const introspectRequest = new Request(introspectUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: sanitizeString(token as string),
        ...(tokenTypeHint && { token_type_hint: sanitizeString(tokenTypeHint as string) }),
      }).toString(),
    });

    log.info('Forwarding token introspection to Supabase Auth', { introspectUrl });

    const introspectResponse = await fetch(introspectRequest);

    // Get response body
    const responseBody = await introspectResponse.text();

    // Forward response from Supabase Auth
    return new Response(responseBody, {
      status: introspectResponse.status,
      statusText: introspectResponse.statusText,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // Forward any additional headers from Supabase
        ...Object.fromEntries(
          Array.from(introspectResponse.headers.entries()).filter(([key]) =>
            !['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())
          )
        ),
      },
    });
  } catch (error) {
    const normalized = normalizeError(error, 'OAuth token introspection failed');
    log.error('OAuth token introspection error', normalized);
    return jsonError('server_error', 'Internal server error', 500);
  }
}

/**
 * Shared OAuth dynamic client registration handler implementation (RFC 7591)
 *
 * Proxies client registration requests to Supabase Auth OAuth 2.1 Server.
 * Allows clients to register themselves automatically.
 *
 * @param request - Request object
 * @param env - Runtime environment
 * @param adapter - OAuth adapter for runtime-specific operations
 * @returns Registration response from Supabase Auth or error response
 */
export async function handleOAuthRegisterShared(
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

    // Parse request body (JSON for DCR per RFC 7591)
    const registrationData = await request.json();

    // Validate required fields per RFC 7591
    if (!registrationData.redirect_uris || !Array.isArray(registrationData.redirect_uris) || registrationData.redirect_uris.length === 0) {
      return jsonError('invalid_client_metadata', 'Missing or invalid redirect_uris', 400);
    }

    // Validate each redirect_uri is a valid URL format
    for (const redirectUri of registrationData.redirect_uris) {
      if (typeof redirectUri !== 'string') {
        return jsonError('invalid_client_metadata', 'redirect_uris must be an array of strings', 400);
      }
      try {
        const redirectUrl = new URL(redirectUri);
        if (!['http:', 'https:'].includes(redirectUrl.protocol)) {
          return jsonError('invalid_client_metadata', 'Invalid redirect_uri protocol (must be http or https)', 400);
        }
      } catch {
        return jsonError('invalid_client_metadata', `Invalid redirect_uri format: ${redirectUri}`, 400);
      }
    }

    // Build Supabase Auth registration endpoint URL
    // Note: Supabase may use /oauth/register or /auth/v1/oauth/register
    const registerUrl = `${supabaseAuthUrl}/oauth/register`;

    // Forward request to Supabase Auth OAuth 2.1 Server
    const registerRequest = new Request(registerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
    });

    log.info('Forwarding client registration to Supabase Auth', { registerUrl });

    const registerResponse = await fetch(registerRequest);

    // Get response body
    const responseBody = await registerResponse.text();

    // Forward response from Supabase Auth
    return new Response(responseBody, {
      status: registerResponse.status,
      statusText: registerResponse.statusText,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // Forward any additional headers from Supabase
        ...Object.fromEntries(
          Array.from(registerResponse.headers.entries()).filter(([key]) =>
            !['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())
          )
        ),
      },
    });
  } catch (error) {
    const normalized = normalizeError(error, 'OAuth client registration failed');
    log.error('OAuth client registration error', normalized);
    return jsonError('server_error', 'Internal server error', 500);
  }
}

