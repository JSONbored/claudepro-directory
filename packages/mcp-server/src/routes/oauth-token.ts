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
import { handleOAuthTokenShared, type OAuthAdapter } from './oauth/shared.js';

/**
 * Proxies OAuth token exchange requests to Supabase Auth OAuth 2.1 Server.
 *
 * **IMPORTANT:** This requires OAuth 2.1 Server to be enabled in your Supabase project.
 *
 * @param request - Request object
 * @param env - Runtime environment
 * @param logger - Optional logger (defaults to simple logger)
 * @returns Token response from Supabase Auth or error response
 */
export async function handleOAuthToken(
  request: Request,
  env: RuntimeEnv,
  logger?: RuntimeLogger
): Promise<Response> {
  // Create adapter with simple logger and sync env parsing
  const adapter: OAuthAdapter = {
    parseEnv: (e) => parseSimpleEnv(e),
    createLogger: () => logger || createSimpleLogger(),
  };

  return handleOAuthTokenShared(request, env, adapter);
}
