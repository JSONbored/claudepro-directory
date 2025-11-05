/**
 * Shared environment variable loading utility
 * Conditionally pulls from Vercel only when required vars are missing (saves 300-500ms).
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

  console.log(`📥 Loading environment variables (missing: ${missingVars.join(', ')})...`);
  execSync('vercel env pull .env.local --yes', { stdio: 'inherit' });

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
