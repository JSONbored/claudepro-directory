/**
 * OAuth Authorization Proxy Endpoint
 *
 * Proxies OAuth authorization requests to Supabase Auth with the resource parameter
 * (RFC 8707) to ensure tokens include the MCP server URL in the audience claim.
 *
 * This endpoint enables full OAuth 2.1 flow for MCP clients:
 * 1. Client initiates OAuth with resource parameter
 * 2. User authenticates via Supabase Auth
 * 3. Token issued with correct audience claim
 * 4. Client uses token with MCP server
 */

import { edgeEnv, initRequestLogging, traceStep } from '@heyclaude/edge-runtime';
import { createDataApiContext, getEnvVar, logError, logger } from '@heyclaude/shared-runtime';
import type { Context } from 'hono';

const SUPABASE_URL = edgeEnv.supabase.url;
const SUPABASE_AUTH_URL = `${SUPABASE_URL}/auth/v1`;
// Use getEnvVar for consistency with edgeEnv pattern (could be moved to edgeEnv config in future)
const MCP_SERVER_URL = getEnvVar('MCP_SERVER_URL') ?? 'https://mcp.heyclau.de';
const MCP_RESOURCE_URL = `${MCP_SERVER_URL}/mcp`;

/**
 * Build a standardized OAuth JSON error response and set JSON and CORS headers.
 *
 * @param c - Request/response context used to construct the response
 * @param error - OAuth error code to return (e.g., `invalid_request`, `server_error`)
 * @param description - Human-readable text to include as `error_description`
 * @param status - HTTP status code to send (400 or 500); defaults to 400
 * @returns A Response with a JSON body `{ error, error_description }` and headers `Content-Type: application/json` and `Access-Control-Allow-Origin: *`
 */
function jsonError(
  c: Context,
  error: string,
  description: string,
  status: 400 | 500 = 400
): Response {
  return c.json({ error, error_description: description }, status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
}

/**
 * Proxies incoming OAuth authorization requests to Supabase Auth, injecting the RFC 8707 `resource` parameter for MCP audience and preserving required OAuth and PKCE parameters.
 *
 * Performs required validation for `client_id`, `response_type` (must be `code`), `redirect_uri`, and PKCE (`code_challenge` / `code_challenge_method` must be `S256`) and returns appropriate JSON OAuth error responses on validation failure.
 *
 * @returns A redirect Response to the Supabase Auth `/authorize` endpoint when the request is valid, or a JSON error Response describing the validation or server error.
 */
export async function handleOAuthAuthorize(c: Context): Promise<Response> {
  const logContext = createDataApiContext('oauth-authorize', {
    app: 'mcp-directory',
    method: 'GET',
  });

  // Initialize request logging with trace and bindings (Phase 1 & 2)
  initRequestLogging(logContext);
  traceStep('OAuth authorization request received', logContext);
  
  // Set bindings for this request - mixin will automatically inject these into all subsequent logs
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'oauth-authorize',
    function: typeof logContext['function'] === "string" ? logContext['function'] : "unknown",
    method: 'GET',
  });

  try {
    // Get query parameters from Hono request
    const query = c.req.query();

    // Extract OAuth parameters from request
    // Hono query() returns Record<string, string | string[]>, so we need to handle arrays
    const getQueryParam = (key: string): string | undefined => {
      const value = query[key];
      if (Array.isArray(value)) {
        return value[0]; // Take first value if array
      }
      return value;
    };

    const clientId = getQueryParam('client_id');
    const responseType = getQueryParam('response_type');
    const redirectUri = getQueryParam('redirect_uri');
    const scope = getQueryParam('scope');
    const state = getQueryParam('state');
    const codeChallenge = getQueryParam('code_challenge');
    const codeChallengeMethod = getQueryParam('code_challenge_method');

    // Validate required parameters
    if (!(clientId && responseType && redirectUri)) {
      return jsonError(c, 'invalid_request', 'Missing required OAuth parameters', 400);
    }

    // Basic URL validation for redirect_uri to prevent open redirect attacks
    // Note: Supabase Auth also validates registered redirect URIs, but we add
    // an extra layer of defense here
    // redirectUri is guaranteed to be truthy from the check above
    try {
      new URL(redirectUri);
    } catch {
      return jsonError(c, 'invalid_request', 'Invalid redirect_uri format', 400);
    }

    // Validate response_type (OAuth 2.1 requires 'code')
    if (responseType !== 'code') {
      return jsonError(c, 'unsupported_response_type', 'Only "code" response type is supported', 400);
    }

    // Validate PKCE (OAuth 2.1 requires PKCE)
    if (!(codeChallenge && codeChallengeMethod)) {
      return jsonError(c, 'invalid_request', 'PKCE (code_challenge) is required', 400);
    }

    if (codeChallengeMethod !== 'S256') {
      return jsonError(c, 'invalid_request', 'Only S256 code challenge method is supported', 400);
    }

    // Build Supabase Auth authorization URL
    // Include resource parameter (RFC 8707) to ensure token has correct audience
    const supabaseAuthUrl = new URL(`${SUPABASE_AUTH_URL}/authorize`);

    // Preserve all OAuth parameters
    supabaseAuthUrl.searchParams.set('client_id', clientId);
    supabaseAuthUrl.searchParams.set('response_type', responseType);
    supabaseAuthUrl.searchParams.set('redirect_uri', redirectUri);

    // Add resource parameter (RFC 8707) - CRITICAL for MCP spec compliance
    // This tells Supabase Auth to include the MCP server URL in the token's audience claim
    supabaseAuthUrl.searchParams.set('resource', MCP_RESOURCE_URL);

    // Preserve optional parameters
    if (scope) {
      supabaseAuthUrl.searchParams.set('scope', scope);
    }
    if (state) {
      supabaseAuthUrl.searchParams.set('state', state);
    }
    // PKCE parameters are validated as required above, so they're always present here
    supabaseAuthUrl.searchParams.set('code_challenge', codeChallenge);
    supabaseAuthUrl.searchParams.set('code_challenge_method', codeChallengeMethod);

    // Redirect to Supabase Auth with all parameters including resource
    return c.redirect(supabaseAuthUrl.toString(), 302);
  } catch (error) {
    await logError('OAuth authorization proxy failed', logContext, error);
    return jsonError(c, 'server_error', 'Internal server error', 500);
  }
}