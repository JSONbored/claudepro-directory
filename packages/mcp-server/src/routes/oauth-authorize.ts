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
import { parseSimpleEnv } from '../lib/env-config.js';
import { createSimpleLogger } from '../lib/logger-utils.js';
import { handleOAuthAuthorizeShared, type OAuthAdapter } from './oauth/shared.js';

/**
 * Proxies incoming OAuth authorization requests to Supabase Auth OAuth 2.1 Server, injecting the RFC 8707 `resource` parameter for MCP audience and preserving required OAuth and PKCE parameters.
 *
 * **IMPORTANT:** This requires OAuth 2.1 Server to be enabled in your Supabase project.
 * Enable it in: Authentication > OAuth Server in the Supabase dashboard.
 *
 * Performs required validation for `client_id`, `response_type` (must be `code`), `redirect_uri`, and PKCE (`code_challenge` / `code_challenge_method` must be `S256`) and returns appropriate JSON OAuth error responses on validation failure.
 *
 * @param _request - Request object
 * @param env - Runtime environment
 * @param url - Parsed URL object
 * @param logger - Optional logger (defaults to simple logger)
 * @returns A redirect Response to the Supabase Auth `/oauth/authorize` endpoint (OAuth 2.1 Server) when the request is valid, or a JSON error Response describing the validation or server error.
 */
export async function handleOAuthAuthorize(
  _request: Request,
  env: RuntimeEnv,
  url: URL,
  logger?: RuntimeLogger
): Promise<Response> {
  // Create adapter with simple logger and sync env parsing
  const adapter: OAuthAdapter = {
    parseEnv: (e) => parseSimpleEnv(e),
    createLogger: () => logger || createSimpleLogger(),
  };

  return handleOAuthAuthorizeShared(_request, env, url, adapter);
}
