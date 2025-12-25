/**
 * OAuth 2.1 Token Revocation Endpoint (RFC 7009)
 *
 * Proxies token revocation requests to Supabase Auth OAuth 2.1 Server.
 * Allows clients to revoke access tokens and refresh tokens.
 *
 * **IMPORTANT:** This requires OAuth 2.1 Server to be enabled in your Supabase project.
 *
 * The revocation endpoint:
 * 1. Receives token revocation request from client
 * 2. Forwards to Supabase Auth OAuth 2.1 Server
 * 3. Returns success response (always returns 200 per RFC 7009)
 */

import type { RuntimeEnv, RuntimeLogger } from '../types/runtime.js';
import { parseSimpleEnv } from '../lib/env-config.js';
import { createSimpleLogger } from '../lib/logger-utils.js';
import { handleOAuthRevokeShared, type OAuthAdapter } from './oauth/shared.js';

/**
 * Proxies OAuth token revocation requests to Supabase Auth OAuth 2.1 Server.
 *
 * **IMPORTANT:** This requires OAuth 2.1 Server to be enabled in your Supabase project.
 *
 * @param request - Request object
 * @param env - Runtime environment
 * @param logger - Optional logger (defaults to simple logger)
 * @returns Revocation response from Supabase Auth or error response
 */
export async function handleOAuthRevoke(
  request: Request,
  env: RuntimeEnv,
  logger?: RuntimeLogger
): Promise<Response> {
  // Create adapter with simple logger and sync env parsing
  const adapter: OAuthAdapter = {
    parseEnv: (e) => parseSimpleEnv(e),
    createLogger: () => logger || createSimpleLogger(),
  };

  return handleOAuthRevokeShared(request, env, adapter);
}
