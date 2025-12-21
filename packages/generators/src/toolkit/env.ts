/**
 * Shared environment variable loading utility.
 * For local development: Use Infisical (run commands with `infisical run --env=dev -- <command>`).
 * In CI/Build (Vercel/GitHub): Environment variables are provided by platform.
 *
 * This utility does NOT load .env files - all secrets must come from Infisical or platform env vars.
 *
 * Uses isomorphic `env` schema from @heyclaude/shared-runtime/schemas/env for type-safe, validated access.
 * This ensures 100% isomorphic, type-safe environment variable access across all platforms.
 */

import { env } from '@heyclaude/shared-runtime/schemas/env';

import { logger } from './logger.ts';

/**
 * Helper to get env var value from env schema (type-safe, validated)
 * Falls back to undefined if not in schema (for dynamic access)
 */
function getEnvValue(key: string): string | undefined {
  // Type-safe access to env schema
  // @ts-expect-error - Dynamic key access for validation utility
  return env[key];
}

export async function ensureEnvVars(
  requiredVars: string[],
  optionalVars: string[] = []
): Promise<void> {
  const missingVars = requiredVars.filter((v) => !getEnvValue(v));
  const missingOptionalVars = optionalVars.filter((v) => !getEnvValue(v));

  if (missingVars.length === 0) {
    const source =
      env.VERCEL || env.VERCEL_ENV ? 'Platform (Vercel/CI)' : 'Infisical';
    if (missingOptionalVars.length > 0) {
      logger.info(
        `✅ Required environment variables loaded from ${source} (${missingOptionalVars.length} optional vars missing)`,
        { command: 'env', missingOptionalVarsCount: missingOptionalVars.length, source }
      );
    } else {
      logger.info(`✅ Environment variables already loaded from ${source}`, {
        command: 'env',
        source,
      });
    }
    return;
  }

  // Check CI environment (need to use getEnvValue for dynamic keys not in schema)
  const isCI =
    getEnvValue('CI') === 'true' ||
    getEnvValue('GITHUB_ACTIONS') === 'true' ||
    env.VERCEL === '1' ||
    env.VERCEL_ENV !== undefined;

  if (isCI) {
    const environment = env.VERCEL
      ? 'vercel'
      : getEnvValue('GITHUB_ACTIONS')
        ? 'github'
        : 'ci';
    logger.warn(`⚠️  Missing environment variables in CI/Build: ${missingVars.join(', ')}`, {
      command: 'env',
      missingVarsCount: missingVars.length,
      environment,
    });
    throw new Error(
      `Missing required environment variables in CI/Build: ${missingVars.join(', ')}`
    );
  }

  // Local development: Must use Infisical (no .env file fallback)
  logger.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`, {
    command: 'env',
    missingVarsCount: missingVars.length,
  });
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}. ` +
      `For local development, use Infisical: infisical run --env=dev -- <command>. ` +
      `Add missing secrets to Infisical: infisical secrets set <SECRET_NAME> "<value>" --env=dev`
  );
}
