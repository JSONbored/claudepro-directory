/**
 * Runtime-Agnostic Environment Utilities
 *
 * Provides environment variable access that works across different runtimes
 * (Cloudflare Workers, Node.js, etc.)
 */

import type { RuntimeEnv } from '../types/runtime.js';

/**
 * Get environment variable value
 *
 * @param env - Runtime environment object
 * @param key - Environment variable key
 * @returns Environment variable value or undefined
 */
export function getEnvVar(env: RuntimeEnv, key: string): string | undefined {
  const value = env[key];
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
}

/**
 * Get environment variable with default value
 *
 * @param env - Runtime environment object
 * @param key - Environment variable key
 * @param fallback - Default value if variable is missing
 * @returns Environment variable value or fallback
 */
export function getEnvOrDefault(env: RuntimeEnv, key: string, fallback: string): string {
  return getEnvVar(env, key) ?? fallback;
}

/**
 * Get number environment variable
 *
 * @param env - Runtime environment object
 * @param key - Environment variable key
 * @param fallback - Default value if variable is missing or invalid
 * @returns Number value or fallback
 */
export function getNumberEnv(env: RuntimeEnv, key: string, fallback?: number): number | undefined {
  const value = getEnvVar(env, key);
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Require environment variable (throws if missing)
 *
 * @param env - Runtime environment object
 * @param key - Environment variable key
 * @param message - Optional error message
 * @returns Environment variable value
 * @throws Error if variable is missing
 */
export function requireEnvVar(env: RuntimeEnv, key: string, message?: string): string {
  const value = getEnvVar(env, key);
  if (!value) {
    throw new Error(message ?? `Environment variable ${key} is required`);
  }
  return value;
}
