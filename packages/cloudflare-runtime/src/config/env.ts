/**
 * Environment Variable Configuration for Cloudflare Workers
 *
 * Cloudflare Workers receive environment variables via the `env` parameter
 * in the fetch handler. This module provides type-safe access to environment
 * variables with validation.
 *
 * IMPORTANT: Uses Infisical SDK for most secrets (single name, environment-specific values).
 * Only Infisical authentication credentials are stored in Cloudflare Secrets Store.
 *
 * Non-sensitive values (NODE_ENV, URLs) use `vars` in wrangler.jsonc.
 */

import { z } from 'zod';

/**
 * Base Env type for Cloudflare Workers
 * 
 * Cloudflare Workers env is a Record<string, unknown> with bindings.
 * We extend this with Secrets Store bindings in ExtendedEnv.
 */
type Env = Record<string, unknown>;

/**
 * Extended Env interface with Secrets Store bindings
 *
 * Secrets Store bindings have a `get()` method that returns a Promise<string>.
 * 
 * IMPORTANT: We use Infisical SDK for most secrets (single name, environment-specific values).
 * Only Infisical authentication credentials are stored in Cloudflare Secrets Store.
 * All other secrets (Supabase, Inngest) are fetched from Infisical at runtime.
 */
export interface ExtendedEnv extends Env {
  // Infisical authentication (stored in Cloudflare Secrets Store)
  // These are the only secrets in Secrets Store - everything else comes from Infisical
  INFISICAL_CLIENT_ID_SECRET?: {
    get(): Promise<string>;
  };
  INFISICAL_CLIENT_SECRET_SECRET?: {
    get(): Promise<string>;
  };
  
  // Optional: Explicit environment override (dev, staging, prod)
  // If not set, determined from NODE_ENV or worker name
  INFISICAL_ENV?: string;
}

/**
 * Environment variable schema for Cloudflare Workers
 */
const envSchema = z.object({
  // Node environment (from vars)
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),

  // Site configuration (from vars - non-sensitive)
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://claudepro.directory'),
  APP_URL: z.string().url().default('https://claudepro.directory'),

  // Supabase configuration (from Infisical - sensitive)
  // Note: Using NEXT_PUBLIC_ prefix to match existing Infisical secret names
  SUPABASE_URL: z.string().url(), // Maps from NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_ANON_KEY: z.string().min(1), // Maps from NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Database configuration (via Hyperdrive)
  // DATABASE_URL is provided by Hyperdrive binding, not env var
  // We'll use the Hyperdrive connection string instead

  // Optional: Newsletter (from vars)
  NEWSLETTER_COUNT_TTL_S: z.coerce.number().int().positive().optional().default(300),

  // Inngest configuration (from Infisical - sensitive, optional)
  // Single secret name in Infisical with different values per environment
  INNGEST_EVENT_KEY: z.string().min(1).optional(),
  INNGEST_SIGNING_KEY: z.string().min(1).optional(),
  INNGEST_URL: z.string().url().optional(),
});

// EnvConfig type is inferred from schema but not used directly
// We return CloudflareEnv instead which has a cleaner structure

/**
 * Get environment variable from Cloudflare Workers env object (vars only)
 *
 * For Secrets Store bindings, use `getSecret()` instead.
 *
 * @param env - Cloudflare Workers env object
 * @param key - Environment variable key
 * @returns Environment variable value or undefined
 */
export function getEnvVar(env: Env, key: string): string | undefined {
  return env[key as keyof Env] as string | undefined;
}

/**
 * Get secret from Secrets Store binding
 *
 * @param binding - Secrets Store binding (has `get()` method)
 * @param secretName - Name of the secret (for error messages)
 * @returns Secret value
 * @throws Error if binding is missing or secret cannot be retrieved
 */
export async function getSecret(
  binding: { get(): Promise<string> } | undefined,
  secretName: string
): Promise<string> {
  if (!binding) {
    throw new Error(`Secrets Store binding for ${secretName} is not configured`);
  }
  const value = await binding.get();
  if (!value) {
    throw new Error(`Secret ${secretName} is empty or not found in Secrets Store`);
  }
  return value;
}

/**
 * Require an environment variable from Cloudflare Workers env object (vars only)
 *
 * For Secrets Store bindings, use `getSecret()` instead.
 *
 * @param env - Cloudflare Workers env object
 * @param key - Environment variable key
 * @param message - Error message if variable is missing
 * @returns Environment variable value
 * @throws Error if variable is missing
 */
export function requireEnvVar(env: Env, key: string, message?: string): string {
  const value = getEnvVar(env, key);
  if (!value) {
    throw new Error(message || `Environment variable ${key} is required`);
  }
  return value;
}

/**
 * Get optional environment variable with default value (vars only)
 *
 * @param env - Cloudflare Workers env object
 * @param key - Environment variable key
 * @param fallback - Default value if variable is missing
 * @returns Environment variable value or fallback
 */
export function getEnvOrDefault(env: Env, key: string, fallback: string): string {
  return getEnvVar(env, key) ?? fallback;
}

/**
 * Get number environment variable (vars only)
 *
 * @param env - Cloudflare Workers env object
 * @param key - Environment variable key
 * @param fallback - Default value if variable is missing or invalid
 * @returns Number value or fallback
 */
export function getNumberEnv(env: Env, key: string, fallback?: number): number | undefined {
  const value = getEnvVar(env, key);
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Validated environment configuration for Cloudflare Workers
 *
 * This interface represents the validated and typed environment variables
 * that the MCP server requires.
 */
export interface CloudflareEnv {
  nodeEnv: string;
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
 * Parse and validate environment variables from Cloudflare Workers env object
 *
 * IMPORTANT: This function is async because it retrieves secrets from Secrets Store.
 * Secrets Store bindings require async `get()` calls for security.
 *
 * @param env - Cloudflare Workers env object (with Secrets Store bindings)
 * @returns Validated environment configuration
 * @throws Error if required variables are missing or invalid
 */
// Note: getOptionalSecret is no longer used (replaced by Infisical SDK)
// Kept for potential future use or backward compatibility

export async function parseEnv(env: ExtendedEnv): Promise<CloudflareEnv> {
  // Import Infisical utilities (dynamic import to avoid circular dependencies)
  const { getInfisicalSecret, getInfisicalEnvironment } = await import('../infisical/client.js');
  
  // Determine environment (dev, staging, prod) from worker config
  const infisicalEnv = getInfisicalEnvironment(env);

  // Retrieve secrets from Infisical (async, recursive search)
  // Supabase secrets are required
  // Note: Using exact secret names that exist in Infisical
  const [supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey] = await Promise.all([
    getInfisicalSecret(env, 'NEXT_PUBLIC_SUPABASE_URL', infisicalEnv),
    getInfisicalSecret(env, 'NEXT_PUBLIC_SUPABASE_ANON_KEY', infisicalEnv),
    getInfisicalSecret(env, 'SUPABASE_SERVICE_ROLE_KEY', infisicalEnv),
  ]);

  // Validate required Supabase secrets
  if (!supabaseUrl) {
    throw new Error(`Missing NEXT_PUBLIC_SUPABASE_URL secret in Infisical (environment: ${infisicalEnv})`);
  }
  if (!supabaseAnonKey) {
    throw new Error(`Missing NEXT_PUBLIC_SUPABASE_ANON_KEY secret in Infisical (environment: ${infisicalEnv})`);
  }
  if (!supabaseServiceRoleKey) {
    throw new Error(`Missing SUPABASE_SERVICE_ROLE_KEY secret in Infisical (environment: ${infisicalEnv})`);
  }

  // Inngest secrets are optional
  const [inngestEventKey, inngestSigningKey, inngestUrl] = await Promise.all([
    getInfisicalSecret(env, 'INNGEST_EVENT_KEY', infisicalEnv),
    getInfisicalSecret(env, 'INNGEST_SIGNING_KEY', infisicalEnv),
    getInfisicalSecret(env, 'INNGEST_URL', infisicalEnv),
  ]);

  // Extract non-sensitive environment variables from vars
  const rawEnv = {
    NODE_ENV: getEnvVar(env, 'NODE_ENV') || 'production',
    NEXT_PUBLIC_SITE_URL: getEnvVar(env, 'NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory',
    APP_URL: getEnvVar(env, 'APP_URL') || 'https://claudepro.directory',
    SUPABASE_URL: supabaseUrl, // From Infisical (NEXT_PUBLIC_SUPABASE_URL)
    SUPABASE_ANON_KEY: supabaseAnonKey, // From Infisical (NEXT_PUBLIC_SUPABASE_ANON_KEY)
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey, // From Infisical
    INNGEST_EVENT_KEY: inngestEventKey, // From Infisical (optional)
    INNGEST_SIGNING_KEY: inngestSigningKey, // From Infisical (optional)
    INNGEST_URL: inngestUrl, // From Infisical (optional)
    NEWSLETTER_COUNT_TTL_S: getNumberEnv(env, 'NEWSLETTER_COUNT_TTL_S')?.toString() || '300',
  };

  // Validate using Zod schema
  const validated = envSchema.parse(rawEnv);

  return {
    nodeEnv: validated.NODE_ENV,
    site: {
      siteUrl: validated.NEXT_PUBLIC_SITE_URL,
      appUrl: validated.APP_URL,
    },
    supabase: {
      url: validated.SUPABASE_URL,
      anonKey: validated.SUPABASE_ANON_KEY,
      serviceRoleKey: validated.SUPABASE_SERVICE_ROLE_KEY,
    },
    inngest: {
      ...(validated.INNGEST_EVENT_KEY ? { eventKey: validated.INNGEST_EVENT_KEY } : {}),
      ...(validated.INNGEST_SIGNING_KEY ? { signingKey: validated.INNGEST_SIGNING_KEY } : {}),
      ...(validated.INNGEST_URL ? { url: validated.INNGEST_URL } : {}),
    },
    newsletter: {
      countTtlSeconds: validated.NEWSLETTER_COUNT_TTL_S,
    },
  };
}
