/**
 * OAuth 2.1 Dynamic Client Registration Endpoint (RFC 7591)
 *
 * Proxies dynamic client registration requests to Supabase Auth OAuth 2.1 Server.
 * Allows clients to register themselves automatically without manual setup.
 *
 * **IMPORTANT:** This requires OAuth 2.1 Server with DCR enabled in your Supabase project.
 *
 * The registration endpoint:
 * 1. Receives client registration request
 * 2. Forwards to Supabase Auth OAuth 2.1 Server
 * 3. Returns client credentials (client_id, client_secret, etc.)
 */

import type { RuntimeEnv, RuntimeLogger } from '../types/runtime.js';
import { parseSimpleEnv } from '../lib/env-config.js';
import { createSimpleLogger } from '../lib/logger-utils.js';
import { handleOAuthRegisterShared, type OAuthAdapter } from './oauth/shared.js';

/**
 * Proxies OAuth dynamic client registration requests to Supabase Auth OAuth 2.1 Server.
 *
 * **IMPORTANT:** This requires OAuth 2.1 Server with DCR enabled in your Supabase project.
 *
 * @param request - Request object
 * @param env - Runtime environment
 * @param logger - Optional logger (defaults to simple logger)
 * @returns Registration response from Supabase Auth or error response
 */
export async function handleOAuthRegister(
  request: Request,
  env: RuntimeEnv,
  logger?: RuntimeLogger
): Promise<Response> {
  // Create adapter with simple logger and sync env parsing
  const adapter: OAuthAdapter = {
    parseEnv: (e) => parseSimpleEnv(e),
    createLogger: () => logger || createSimpleLogger(),
  };

  return handleOAuthRegisterShared(request, env, adapter);
}

