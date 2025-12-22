/**
 * Environment Utilities for Cloudflare Workers
 *
 * Simple utilities for accessing environment variables in Cloudflare Workers.
 */

/**
 * Abstract environment interface for Cloudflare Workers
 */
interface RuntimeEnv {
  [key: string]: unknown;
}

/**
 * Get environment variable with default fallback
 *
 * @param env - Runtime environment object
 * @param key - Environment variable key
 * @param defaultValue - Default value if key not found
 * @returns Environment variable value or default
 */
export function getEnvOrDefault(env: RuntimeEnv, key: string, defaultValue: string): string {
  const value = env[key];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return defaultValue;
}

