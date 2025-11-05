/**
 * Shared environment variable loading utility
 * Conditionally pulls from Vercel only when required vars are missing (saves 300-500ms).
 * In CI environments, expects variables to be set via secrets/environment.
 */

import { execSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

/**
 * Load required environment variables, pulling from Vercel only if missing
 */
export async function ensureEnvVars(requiredVars: string[]): Promise<void> {
  const missingVars = requiredVars.filter((v) => !process.env[v]);

  if (missingVars.length === 0) {
    console.log('✅ Environment variables already loaded');
    return;
  }

  // In CI environments, variables should be set via GitHub Secrets or platform env vars
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  if (isCI) {
    console.log(`⚠️  Missing environment variables in CI: ${missingVars.join(', ')}`);
    console.log('These should be set as GitHub Secrets or Vercel Environment Variables');
    throw new Error(
      `Missing required environment variables in CI: ${missingVars.join(', ')}\n` +
        'Set these in your CI environment or deployment platform.'
    );
  }

  // Only try vercel env pull in local development
  console.log(`📥 Loading environment variables (missing: ${missingVars.join(', ')})...`);

  try {
    execSync('vercel env pull .env.local --yes', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to pull environment variables from Vercel');
    console.error('Make sure Vercel CLI is installed: npm i -g vercel');
    console.error('Or manually create .env.local with required variables');
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
  console.log('✅ Environment variables loaded');
}
