/**
 * Shared environment variable loading utility.
 * For local development: Use Infisical (run commands with `infisical run --env=dev -- <command>`).
 * In CI/Build (Vercel/GitHub): Environment variables are provided by platform.
 * 
 * This utility does NOT load .env files - all secrets must come from Infisical or platform env vars.
 */

import { normalizeError } from '@heyclaude/shared-runtime';

import { logger } from './logger.ts';


export async function ensureEnvVars(
  requiredVars: string[],
  optionalVars: string[] = []
): Promise<void> {
  const missingVars = requiredVars.filter((v) => !process.env[v]);
  const missingOptionalVars = optionalVars.filter((v) => !process.env[v]);

  if (missingVars.length === 0) {
    const source = process.env['VERCEL'] || process.env['CI']
      ? 'Platform (Vercel/CI)'
      : 'Infisical';
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

  const isCI =
    process.env['CI'] === 'true' ||
    process.env['GITHUB_ACTIONS'] === 'true' ||
    process.env['VERCEL'] === '1' ||
    (process.env['VERCEL_ENV'] !== undefined && process.env['VERCEL_ENV'] !== '');

  if (isCI) {
    const environment = process.env['VERCEL']
      ? 'vercel'
      : process.env['GITHUB_ACTIONS']
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
  logger.error(
    `❌ Missing required environment variables: ${missingVars.join(', ')}`,
    {
      command: 'env',
      missingVarsCount: missingVars.length,
    }
  );
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}. ` +
      `For local development, use Infisical: infisical run --env=dev -- <command>. ` +
      `Add missing secrets to Infisical: infisical secrets set <SECRET_NAME> "<value>" --env=dev`
  );
}
