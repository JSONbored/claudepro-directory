/**
 * OAuth 2.1 Token Introspection Endpoint (RFC 7662)
 *
 * Proxies token introspection requests to Supabase Auth OAuth 2.1 Server.
 * Allows resource servers to validate access tokens and retrieve token metadata.
 *
 * **IMPORTANT:** This requires OAuth 2.1 Server to be enabled in your Supabase project.
 *
 * The introspection endpoint:
 * 1. Receives token introspection request from resource server
 * 2. Forwards to Supabase Auth OAuth 2.1 Server
 * 3. Returns token metadata (active, scope, exp, etc.)
 */

import type { RuntimeEnv, RuntimeLogger } from '../types/runtime.js';
import { parseSimpleEnv } from '../lib/env-config.js';
import { createSimpleLogger } from '../lib/logger-utils.js';
import { handleOAuthIntrospectShared, type OAuthAdapter } from './oauth/shared.js';

/**
 * Proxies OAuth token introspection requests to Supabase Auth OAuth 2.1 Server.
 *
 * **IMPORTANT:** This requires OAuth 2.1 Server to be enabled in your Supabase project.
 *
 * @param request - Request object
 * @param env - Runtime environment
 * @param logger - Optional logger (defaults to simple logger)
 * @returns Introspection response from Supabase Auth or error response
 */
export async function handleOAuthIntrospect(
  request: Request,
  env: RuntimeEnv,
  logger?: RuntimeLogger
): Promise<Response> {
  // Create adapter with simple logger and sync env parsing
  const adapter: OAuthAdapter = {
    parseEnv: (e) => parseSimpleEnv(e),
    createLogger: () => logger || createSimpleLogger(),
  };

  return handleOAuthIntrospectShared(request, env, adapter);
}

