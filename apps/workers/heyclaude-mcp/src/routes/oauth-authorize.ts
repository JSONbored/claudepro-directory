/**
 * OAuth 2.1 Authorization Endpoint - Cloudflare Workers Adapter
 *
 * Cloudflare Workers-specific adapter for OAuth authorization.
 * Uses Cloudflare-specific env parsing (async with Infisical) and Pino logger.
 */

import type { ExtendedEnv } from '@heyclaude/cloudflare-runtime/config/env';
import { parseEnv } from '@heyclaude/cloudflare-runtime/config/env';
import { createLogger } from '@heyclaude/cloudflare-runtime/logging/pino';
import { handleOAuthAuthorizeShared, type OAuthAdapter } from '@heyclaude/mcp-server';

/**
 * Proxies incoming OAuth authorization requests to Supabase Auth OAuth 2.1 Server, injecting the RFC 8707 `resource` parameter for MCP audience and preserving required OAuth and PKCE parameters.
 *
 * **IMPORTANT:** This requires OAuth 2.1 Server to be enabled in your Supabase project.
 * Enable it in: Authentication > OAuth Server in the Supabase dashboard.
 *
 * Performs required validation for `client_id`, `response_type` (must be `code`), `redirect_uri`, and PKCE (`code_challenge` / `code_challenge_method` must be `S256`) and returns appropriate JSON OAuth error responses on validation failure.
 *
 * @param _request - Request object
 * @param env - Cloudflare Workers env
 * @param url - Parsed URL object
 * @returns A redirect Response to the Supabase Auth `/oauth/authorize` endpoint (OAuth 2.1 Server) when the request is valid, or a JSON error Response describing the validation or server error.
 */
export async function handleOAuthAuthorize(
  _request: Request,
  env: ExtendedEnv,
  url: URL
): Promise<Response> {
  // Create adapter with Cloudflare-specific async env parsing and Pino logger
  const adapter: OAuthAdapter = {
    parseEnv: async (e: ExtendedEnv) => {
      const config = await parseEnv(e as ExtendedEnv);
      return {
        supabase: {
          url: config.supabase.url,
        },
      };
    },
    createLogger: () => {
      const pinoLogger = createLogger({ name: 'heyclaude-mcp' });
      // Convert Pino logger (meta-first) to RuntimeLogger (message-first)
      return {
        info: (message: string, meta?: Record<string, unknown>) => {
          pinoLogger.info(meta || {}, message);
        },
        error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
          pinoLogger.error({ error, ...meta }, message);
        },
        warn: (message: string, meta?: Record<string, unknown>) => {
          pinoLogger.warn(meta || {}, message);
        },
        debug: (message: string, meta?: Record<string, unknown>) => {
          pinoLogger.debug(meta || {}, message);
        },
        child: (meta: Record<string, unknown>) => {
          const childLogger = pinoLogger.child(meta);
          return {
            info: (msg: string, m?: Record<string, unknown>) => {
              childLogger.info(m || {}, msg);
            },
            error: (msg: string, err?: Error | unknown, m?: Record<string, unknown>) => {
              childLogger.error({ error: err, ...m }, msg);
            },
            warn: (msg: string, m?: Record<string, unknown>) => {
              childLogger.warn(m || {}, msg);
            },
            debug: (msg: string, m?: Record<string, unknown>) => {
              childLogger.debug(m || {}, msg);
            },
            child: () => adapter.createLogger().child({}),
          };
        },
      };
    },
  };

  return handleOAuthAuthorizeShared(_request, env, url, adapter);
}
