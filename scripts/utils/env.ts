/**
 * Shared environment variable loading utility
 * Conditionally pulls from Vercel only when required vars are missing (saves 300-500ms).
 * In CI environments, expects variables to be set via secrets/environment.
 */

import { execSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { logger } from '@/src/lib/logger';

/**
 * Load required environment variables, pulling from Vercel only if missing
 * @param requiredVars - Array of required environment variable names
 * @param optionalVars - Array of optional environment variable names (won't throw if missing in CI)
 */
export async function ensureEnvVars(
  requiredVars: string[],
  optionalVars: string[] = []
): Promise<void> {
  const missingVars = requiredVars.filter((v) => !process.env[v]);
  const missingOptionalVars = optionalVars.filter((v) => !process.env[v]);

  if (missingVars.length === 0) {
    if (missingOptionalVars.length > 0) {
      logger.info(
        `✅ Required environment variables loaded (${missingOptionalVars.length} optional vars missing)`,
        { script: 'env', missingOptionalVarsCount: missingOptionalVars.length }
      );
    } else {
      logger.info('✅ Environment variables already loaded', { script: 'env' });
    }
    return;
  }

  // In CI environments, variables should be set via GitHub Secrets or platform env vars
  // Detect Vercel builds: VERCEL=1 or VERCEL_ENV is set
  // Detect GitHub Actions: GITHUB_ACTIONS=true or CI=true
  const isCI =
    process.env.CI === 'true' ||
    process.env.GITHUB_ACTIONS === 'true' ||
    process.env.VERCEL === '1' ||
    Boolean(process.env.VERCEL_ENV);

  if (isCI) {
    const environment = process.env.VERCEL
      ? 'vercel'
      : process.env.GITHUB_ACTIONS
        ? 'github'
        : 'ci';
    logger.warn(`⚠️  Missing environment variables in CI/Build: ${missingVars.join(', ')}`, {
      script: 'env',
      missingVarsCount: missingVars.length,
      environment,
    });

    if (process.env.VERCEL) {
      logger.warn(
        'For Vercel deployments, ensure these variables are set in your Vercel project settings:',
        { script: 'env' }
      );
      logger.warn(
        'Project Settings → Environment Variables → Add the missing variables for Production, Preview, and Development environments',
        { script: 'env' }
      );
    } else {
      logger.warn('These should be set as GitHub Secrets or CI Environment Variables', {
        script: 'env',
      });
    }

    throw new Error(
      `Missing required environment variables in CI/Build: ${missingVars.join(', ')}\n` +
        (process.env.VERCEL
          ? 'Set these in Vercel Project Settings → Environment Variables for all environments (Production, Preview, Development).'
          : 'Set these in your CI environment or deployment platform.')
    );
  }

  // Only try vercel env pull in local development
  logger.info(`📥 Loading environment variables (missing: ${missingVars.join(', ')})...`, {
    script: 'env',
    missingVarsCount: missingVars.length,
  });

  try {
    execSync('vercel env pull .env.local --yes', { stdio: 'inherit' });
  } catch (error) {
    logger.error(
      '❌ Failed to pull environment variables from Vercel',
      error instanceof Error ? error : new Error(String(error)),
      {
        script: 'env',
      }
    );
    logger.error('Make sure Vercel CLI is installed: npm i -g vercel', undefined, {
      script: 'env',
    });
    logger.error('Or manually create .env.local with required variables', undefined, {
      script: 'env',
    });
    throw new Error(
      `Failed to load environment variables: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  const envContent = await readFile('.env.local', 'utf-8');
  const envVars = Object.fromEntries(
    envContent
      .split('\n')
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const [key, ...values] = line.split('=');
        return [key, values.join('=').replace(/^["']|["']$/g, '')];
      })
  );

  Object.assign(process.env, envVars);
  logger.info('✅ Environment variables loaded', { script: 'env' });
}
