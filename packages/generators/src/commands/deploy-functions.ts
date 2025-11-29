import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { logger } from '../toolkit/logger.js';

// Use global supabase CLI if available, otherwise fall back to npx
const USE_GLOBAL_CLI = true;
const IGNORED_DIRECTORIES = new Set(['_shared', 'node_modules']);

/**
 * Load environment variables from .env files (simple sync loader)
 */
function loadEnvFiles(repoRoot: string): void {
  const envFiles = ['.env.local', '.env'];
  
  for (const file of envFiles) {
    const filePath = path.join(repoRoot, file);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        for (const line of content.split('\n')) {
          if (!line || line.startsWith('#')) continue;
          const [key, ...values] = line.split('=');
          if (key && !process.env[key]) {
            // Remove surrounding quotes if present
            const value = values.join('=').replace(/^["']|["']$/g, '');
            process.env[key] = value;
          }
        }
      } catch {
        // Ignore errors reading env files
      }
    }
  }
}

// Paths relative to this file (dist/commands/deploy-functions.js) -> root
// This file is in packages/generators/src/commands/deploy-functions.ts
// Compiled to packages/generators/dist/commands/deploy-functions.js
const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../../../../');
const EDGE_ROOT = path.join(REPO_ROOT, 'apps', 'edge');
const FUNCTIONS_DIR = path.join(EDGE_ROOT, 'supabase', 'functions');
const IMPORT_MAP_PATH = path.posix.join('supabase', 'deno.json');

function ensurePaths() {
  if (!existsSync(EDGE_ROOT)) {
    logger.error('apps/edge directory is missing. Run this from the repository root.', undefined, {
      script: 'deploy-functions',
    });
    process.exit(1);
  }

  if (!existsSync(FUNCTIONS_DIR)) {
    logger.error('apps/edge/functions directory is missing.', undefined, {
      script: 'deploy-functions',
    });
    process.exit(1);
  }

  const importMapAbsolute = path.join(EDGE_ROOT, IMPORT_MAP_PATH);
  if (!existsSync(importMapAbsolute)) {
    logger.error(`Import map not found at ${importMapAbsolute}.`, undefined, {
      script: 'deploy-functions',
    });
    process.exit(1);
  }
}

function discoverFunctions(): string[] {
  return readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name) && !entry.name.startsWith('.')
    )
    .map((entry) => entry.name)
    .sort();
}

function validateRequestedFunctions(allFunctions: string[], requested: string[]): string[] {
  const available = new Set(allFunctions);
  const missing = requested.filter((fn) => !available.has(fn));

  if (missing.length > 0) {
    logger.error(
      `Unknown function${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
      undefined,
      {
        script: 'deploy-functions',
      }
    );
    logger.error(`Available functions: ${allFunctions.join(', ')}`, undefined, {
      script: 'deploy-functions',
    });
    process.exit(1);
  }

  return [...new Set(requested)];
}

function resolveProjectRef(): string | undefined {
  const explicit = process.env['SUPABASE_PROJECT_REF']?.trim();
  if (explicit) {
    return explicit;
  }

  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']?.trim();
  if (!supabaseUrl) {
    return undefined;
  }

  const match = supabaseUrl.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match?.[1];
}

function verifySupabaseCli() {
  const result = spawnSync('supabase', ['--version'], {
    stdio: 'ignore',
  });

  if (result.status !== 0) {
    logger.error(
      'Supabase CLI is required. Install via "brew install supabase/tap/supabase" or "npm install -g supabase".',
      undefined,
      { script: 'deploy-functions' }
    );
    process.exit(result.status ?? 1);
  }
}

function printHelp() {
  console.log(`Usage:
  pnpm exec heyclaude-deploy-edge              # Deploy all edge functions
  pnpm exec heyclaude-deploy-edge data-api og-image   # Deploy selected functions

Environment variables:
  SUPABASE_PROJECT_REF          # Preferred explicit project ref
  NEXT_PUBLIC_SUPABASE_URL      # Fallback for deriving the project ref

Notes:
  - The script runs Supabase CLI from apps/edge.
  - Provide function names to deploy a subset.`);
}

export function runDeployFunctions() {
  ensurePaths();

  const [, , ...rawArgs] = process.argv;
  if (rawArgs.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  // Load environment variables from .env.local
  loadEnvFiles(REPO_ROOT);

  const allFunctions = discoverFunctions();
  if (allFunctions.length === 0) {
    logger.error('No edge functions found under apps/edge/supabase/functions.', undefined, {
      script: 'deploy-functions',
    });
    process.exit(1);
  }

  const requestedFunctions = rawArgs.filter((arg) => !arg.startsWith('--'));
  const functionsToDeploy =
    requestedFunctions.length > 0
      ? validateRequestedFunctions(allFunctions, requestedFunctions)
      : allFunctions;

  const projectRef = resolveProjectRef();
  if (!projectRef) {
    logger.error(
      'Supabase project ref is required. Set SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL.',
      undefined,
      { script: 'deploy-functions' }
    );
    process.exit(1);
  }

  verifySupabaseCli();

  for (const fnName of functionsToDeploy) {
    logger.info(`🚀 Deploying edge function "${fnName}"...`, { script: 'deploy-functions' });
    const result = spawnSync(
      'supabase',
      [
        'functions',
        'deploy',
        fnName,
        '--project-ref',
        projectRef,
        '--import-map',
        IMPORT_MAP_PATH,
      ],
      {
        cwd: EDGE_ROOT,
        stdio: 'inherit',
        env: process.env,
      }
    );

    if (result.status !== 0) {
      logger.error(`❌ Deployment failed for "${fnName}".`, undefined, {
        script: 'deploy-functions',
      });
      process.exit(result.status ?? 1);
    }

    logger.info(`✅ "${fnName}" deployed successfully.`, { script: 'deploy-functions' });
  }

  logger.info('\n✨ All requested edge functions deployed.', { script: 'deploy-functions' });
}
