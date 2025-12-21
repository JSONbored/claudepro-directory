/**
 * OAuth 2.1 Token Endpoint
 *
 * Proxies OAuth token exchange requests to Supabase Auth OAuth 2.1 Server.
 * This endpoint handles the authorization code exchange for access tokens.
 *
 * **IMPORTANT:** This requires OAuth 2.1 Server to be enabled in your Supabase project.
 * Enable it in: Authentication > OAuth Server in the Supabase dashboard.
 *
 * The token endpoint:
 * 1. Receives authorization code from client
 * 2. Forwards to Supabase Auth OAuth 2.1 Server
 * 3. Returns access token with correct audience claim (from resource parameter)
 */

import type { RuntimeEnv, RuntimeLogger } from '../types/runtime.js';
import { parseSimpleEnv } from '../lib/env-config.js';
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

/**
 * Proxies OAuth token exchange requests to Supabase Auth OAuth 2.1 Server.
 *
 * **IMPORTANT:** This requires OAuth 2.1 Server to be enabled in your Supabase project.
 *
 * @param request - Request object
 * @param env - Cloudflare Workers env
 * @returns Token response from Supabase Auth or error response
 */
export async function handleOAuthToken(
  request: Request,
  env: RuntimeEnv,
  logger?: RuntimeLogger
): Promise<Response> {
  // Create simple logger if not provided
  const log = logger || createSimpleLogger();

  try {
    const config = parseSimpleEnv(env);
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
