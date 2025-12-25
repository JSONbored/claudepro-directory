/**
 * OAuth 2.1 Token Introspection Endpoint - Cloudflare Workers Adapter
 *
 * Cloudflare Workers-specific adapter for OAuth token introspection.
 * Uses Cloudflare-specific env parsing (async with Infisical) and Pino logger.
 */

import type { ExtendedEnv } from '@heyclaude/cloudflare-runtime/config/env';
import { parseEnv } from '@heyclaude/cloudflare-runtime/config/env';
import { createLogger } from '@heyclaude/cloudflare-runtime/logging/pino';
import { handleOAuthIntrospectShared, type OAuthAdapter } from '@heyclaude/mcp-server';

/**
 * Proxies OAuth token introspection requests to Supabase Auth OAuth 2.1 Server.
 *
 * **IMPORTANT:** This requires OAuth 2.1 Server to be enabled in your Supabase project.
 *
 * @param request - Request object
 * @param env - Cloudflare Workers env
 * @returns Introspection response from Supabase Auth or error response
 */
export async function handleOAuthIntrospect(request: Request, env: ExtendedEnv): Promise<Response> {
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

  return handleOAuthIntrospectShared(request, env, adapter);
}
