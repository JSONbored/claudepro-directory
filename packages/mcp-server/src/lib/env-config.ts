/**
 * Runtime-Agnostic Environment Configuration
 *
 * Provides a simplified environment configuration parser that works across runtimes.
 * For Cloudflare Workers, use the full parseEnv from @heyclaude/cloudflare-runtime
 * which includes Infisical secrets support.
 */

import type { RuntimeEnv } from '../types/runtime.js';
import { getEnvVar, getEnvOrDefault, getNumberEnv } from './env-utils.js';

// Re-export for convenience
export { getEnvOrDefault } from './env-utils.js';

/**
 * Simplified environment configuration (runtime-agnostic)
 * 
 * This is a minimal version that reads from env directly.
 * For Cloudflare Workers, the full parseEnv includes Infisical secrets.
 */
export interface SimpleEnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  site: {
    siteUrl: string;
    appUrl: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  inngest: {
    eventKey?: string;
    signingKey?: string;
    url?: string;
  };
  newsletter: {
    countTtlSeconds: number;
  };
}

/**
 * Parse environment variables from RuntimeEnv (runtime-agnostic)
 * 
 * This version reads directly from env without accessing secrets store.
 * For Cloudflare Workers, use parseEnv from @heyclaude/cloudflare-runtime instead.
 *
 * @param env - Runtime environment object
 * @returns Validated environment configuration
 * @throws Error if required variables are missing
 */
export function parseSimpleEnv(env: RuntimeEnv): SimpleEnvConfig {
  return {
    nodeEnv: (getEnvVar(env, 'NODE_ENV') || 'production') as 'development' | 'production' | 'test',
    site: {
      siteUrl: getEnvOrDefault(env, 'NEXT_PUBLIC_SITE_URL', 'https://claudepro.directory'),
      appUrl: getEnvOrDefault(env, 'APP_URL', 'https://claudepro.directory'),
    },
    supabase: {
      url: getEnvVar(env, 'SUPABASE_URL') || getEnvVar(env, 'NEXT_PUBLIC_SUPABASE_URL') || '',
      anonKey: getEnvVar(env, 'SUPABASE_ANON_KEY') || getEnvVar(env, 'NEXT_PUBLIC_SUPABASE_ANON_KEY') || '',
      serviceRoleKey: getEnvVar(env, 'SUPABASE_SERVICE_ROLE_KEY') || '',
    },
    inngest: {
      ...(getEnvVar(env, 'INNGEST_EVENT_KEY') ? { eventKey: getEnvVar(env, 'INNGEST_EVENT_KEY')! } : {}),
      ...(getEnvVar(env, 'INNGEST_SIGNING_KEY') ? { signingKey: getEnvVar(env, 'INNGEST_SIGNING_KEY')! } : {}),
      ...(getEnvVar(env, 'INNGEST_URL') ? { url: getEnvVar(env, 'INNGEST_URL')! } : {}),
    },
    newsletter: {
      countTtlSeconds: getNumberEnv(env, 'NEWSLETTER_COUNT_TTL_S') || 300,
    },
  };
}

