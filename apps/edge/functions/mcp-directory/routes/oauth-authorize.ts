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

import { edgeEnv } from '@heyclaude/edge-runtime';
import { createDataApiContext, getEnvVar, logError } from '@heyclaude/shared-runtime';
import type { Context } from 'hono';

const SUPABASE_URL = edgeEnv.supabase.url;
const SUPABASE_AUTH_URL = `${SUPABASE_URL}/auth/v1`;
// Use getEnvVar for consistency with edgeEnv pattern (could be moved to edgeEnv config in future)
const MCP_SERVER_URL = getEnvVar('MCP_SERVER_URL') ?? 'https://mcp.heyclau.de';
const MCP_RESOURCE_URL = `${MCP_SERVER_URL}/mcp`;

/**
 * OAuth Authorization Endpoint Proxy
 *
 * GET /oauth/authorize
 *
 * Proxies to Supabase Auth's /authorize endpoint, ensuring:
 * 1. Resource parameter (RFC 8707) is included
 * 2. PKCE parameters are preserved
 * 3. All OAuth 2.1 requirements are met
 */
export async function handleOAuthAuthorize(c: Context): Promise<Response> {
  const logContext = createDataApiContext('oauth-authorize', {
    app: 'mcp-directory',
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
      return c.json(
        { error: 'invalid_request', error_description: 'Missing required OAuth parameters' },
        400,
        {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      );
    }

    // Validate response_type (OAuth 2.1 requires 'code')
    if (responseType !== 'code') {
      return c.json(
        {
          error: 'unsupported_response_type',
          error_description: 'Only "code" response type is supported',
        },
        400,
        {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      );
    }

    // Validate PKCE (OAuth 2.1 requires PKCE)
    if (!(codeChallenge && codeChallengeMethod)) {
      return c.json(
        { error: 'invalid_request', error_description: 'PKCE (code_challenge) is required' },
        400,
        {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      );
    }

    if (codeChallengeMethod !== 'S256') {
      return c.json(
        {
          error: 'invalid_request',
          error_description: 'Only S256 code challenge method is supported',
        },
        400,
        {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      );
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
    logError('OAuth authorization proxy failed', logContext, error);
    return c.json({ error: 'server_error', error_description: 'Internal server error' }, 500, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
  }
}
