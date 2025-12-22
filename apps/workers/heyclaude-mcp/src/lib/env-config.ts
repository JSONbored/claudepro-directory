/**
 * Environment Configuration Parser for Cloudflare Workers
 *
 * Simple environment configuration parser for Cloudflare Workers.
 */

/**
 * Abstract environment interface for Cloudflare Workers
 */
interface RuntimeEnv {
  [key: string]: unknown;
}

/**
 * Parse simple environment configuration
 *
 * @param env - Runtime environment object
 * @returns Parsed configuration object
 */
export function parseSimpleEnv(env: RuntimeEnv): {
  supabase?: {
    url?: string | undefined;
    anonKey?: string | undefined;
    serviceRoleKey?: string | undefined;
  };
  app?: {
    url?: string | undefined;
  };
} {
  return {
    supabase: {
      url: typeof env['SUPABASE_URL'] === 'string' ? env['SUPABASE_URL'] : undefined,
      anonKey: typeof env['SUPABASE_ANON_KEY'] === 'string' ? env['SUPABASE_ANON_KEY'] : undefined,
      serviceRoleKey: typeof env['SUPABASE_SERVICE_ROLE_KEY'] === 'string' ? env['SUPABASE_SERVICE_ROLE_KEY'] : undefined,
    },
    app: {
      url: typeof env['APP_URL'] === 'string' ? env['APP_URL'] : undefined,
    },
  };
}

