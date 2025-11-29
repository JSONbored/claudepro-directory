/**
 * Shared environment variable loading utility.
 * Only attempts to read from .env.local in local dev (no implicit Vercel CLI usage).
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { normalizeError } from '@heyclaude/shared-runtime';

import { logger } from './logger.js';

const ENV_FILES = ['.env.edge.local', '.env.local', '.env.db.local', '.env'];

function parseEnvContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    
    const [key, ...values] = trimmedLine.split('=');
    const trimmedKey = key?.trim();
    if (trimmedKey) {
      // Remove surrounding quotes and trim value
      const rawValue = values.join('=');
      result[trimmedKey] = rawValue.replaceAll(/^["']|["']$/g, '').trim();
    }
  }
  
  return result;
}

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
        { command: 'env', missingOptionalVarsCount: missingOptionalVars.length }
      );
    } else {
      logger.info('✅ Environment variables already loaded', { command: 'env' });
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
      : (process.env['GITHUB_ACTIONS']
        ? 'github'
        : 'ci');
    logger.warn(`⚠️  Missing environment variables in CI/Build: ${missingVars.join(', ')}`, {
      command: 'env',
      missingVarsCount: missingVars.length,
      environment,
    });
    throw new Error(
      `Missing required environment variables in CI/Build: ${missingVars.join(', ')}`
    );
  }

  logger.info(`📥 Loading environment variables (missing: ${missingVars.join(', ')})...`, {
    command: 'env',
    missingVarsCount: missingVars.length,
  });

  let loadedFiles = 0;
  for (const file of ENV_FILES) {
    if (existsSync(file)) {
      try {
        const content = await readFile(file, 'utf8');
        const envVars = parseEnvContent(content);

        // Only set if not already set (priority: process.env > earlier files > later files)
        for (const [key, value] of Object.entries(envVars)) {
          process.env[key] ??= value;
        }
        loadedFiles++;
      } catch (error) {
        const errorObj = normalizeError(error, 'Failed to read env file');
        logger.warn(`Failed to read ${file}`, { command: 'env', file, err: errorObj });
      }
    }
  }

  if (loadedFiles === 0) {
    logger.warn(
      'No .env files found (.env.edge.local, .env.local, .env.db.local). Export the required variables in your shell.',
      { command: 'env' }
    );
  }

  // Re-check missing vars
  const stillMissing = requiredVars.filter((v) => !process.env[v]);
  if (stillMissing.length > 0) {
    throw new Error(
      `Missing required environment variables after loading env files: ${stillMissing.join(', ')}`
    );
  }

  logger.info('✅ Environment variables loaded', { command: 'env' });
}
