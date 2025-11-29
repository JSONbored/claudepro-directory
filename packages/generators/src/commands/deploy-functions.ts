import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as TOML from '@iarna/toml';

import { logger } from '../toolkit/logger.js';

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
        const content = readFileSync(filePath, 'utf8');
        for (const line of content.split('\n')) {
          if (!line || line.startsWith('#')) continue;
          const [key, ...values] = line.split('=');
          if (key) {
            // Remove surrounding quotes if present, only set if not already set
            const value = values.join('=').replaceAll(/^["']|["']$/g, '');
            process.env[key] ??= value;
          }
        }
      } catch {
        // Silently ignore errors reading env files - they're optional
        // The env variables may be provided through other means (CI, shell)
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
const CONFIG_TOML_PATH = path.join(EDGE_ROOT, 'supabase', 'config.toml');
const DEFAULT_IMPORT_MAP_PATH = path.posix.join('supabase', 'deno.json');

/**
 * Parse config.toml to extract import_map for each function.
 * Returns a map of function name -> import_map path (relative to supabase directory).
 */
function parseConfigToml(): Map<string, string> {
  const importMaps = new Map<string, string>();
  
  if (!existsSync(CONFIG_TOML_PATH)) {
    logger.warn(`config.toml not found at ${CONFIG_TOML_PATH}, using default import map.`, {
      command: 'deploy-functions',
    });
    return importMaps;
  }

  try {
    const content = readFileSync(CONFIG_TOML_PATH, 'utf8');
    const config = TOML.parse(content) as {
      functions?: Record<string, { import_map?: string }>;
    };
    
    if (config.functions && typeof config.functions === 'object') {
      for (const [functionName, functionConfig] of Object.entries(config.functions)) {
        if (functionConfig && typeof functionConfig === 'object' && functionConfig.import_map) {
          const importMapPath = functionConfig.import_map;
          if (typeof importMapPath === 'string') {
            // Paths in config.toml are relative to supabase directory
            importMaps.set(functionName, importMapPath);
          }
        }
      }
    }
  } catch (error) {
    logger.warn(`Failed to parse config.toml: ${error instanceof Error ? error.message : String(error)}. Using default import map.`, {
      command: 'deploy-functions',
    });
  }
  
  return importMaps;
}

/**
 * Get the import_map path for a function, falling back to default if not found in config.toml.
 */
function getImportMapPath(functionName: string, configImportMaps: Map<string, string>): string {
  const customPath = configImportMaps.get(functionName);
  if (customPath) {
    // Prevent path traversal - ensure the path doesn't escape supabase directory
    const normalizedPath = path.normalize(customPath);
    if (normalizedPath.startsWith('..') || path.isAbsolute(normalizedPath)) {
      logger.warn(
        `Invalid import map path in config.toml for "${functionName}": path must be relative and within supabase directory.`,
        { command: 'deploy-functions', fnName: functionName, customPath }
      );
      return DEFAULT_IMPORT_MAP_PATH;
    }

    // Verify the import map file exists
    const absolutePath = path.join(EDGE_ROOT, 'supabase', normalizedPath);
    if (existsSync(absolutePath)) {
      return path.posix.join('supabase', normalizedPath);
    }
    logger.warn(
      `Import map specified in config.toml for "${functionName}" not found at ${absolutePath}, using default.`,
      { command: 'deploy-functions', fnName: functionName, customPath: normalizedPath }
    );
  }
  return DEFAULT_IMPORT_MAP_PATH;
}

function ensurePaths(): void {
  if (!existsSync(EDGE_ROOT)) {
    logger.error('apps/edge directory is missing. Run this from the repository root.', undefined, {
      command: 'deploy-functions',
    });
    throw new Error('apps/edge directory is missing');
  }

  if (!existsSync(FUNCTIONS_DIR)) {
    logger.error('apps/edge/functions directory is missing.', undefined, {
      command: 'deploy-functions',
    });
    throw new Error('apps/edge/functions directory is missing');
  }
}

function discoverFunctions(): string[] {
  return readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name) && !entry.name.startsWith('.')
    )
    .map((entry) => entry.name)
    .toSorted();
}

function validateRequestedFunctions(allFunctions: string[], requested: string[]): string[] {
  const available = new Set(allFunctions);
  const missing = requested.filter((fn) => !available.has(fn));

  if (missing.length > 0) {
    logger.error(
      `Unknown function${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
      undefined,
      {
        command: 'deploy-functions',
        missing,
        available: allFunctions,
      }
    );
    logger.error(`Available functions: ${allFunctions.join(', ')}`, undefined, {
      command: 'deploy-functions',
    });
    throw new Error(`Unknown functions: ${missing.join(', ')}`);
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

function verifySupabaseCli(): void {
  const result = spawnSync('supabase', ['--version'], {
    stdio: 'ignore',
  });

  if (result.status !== 0) {
    logger.error(
      'Supabase CLI is required. Install via "brew install supabase/tap/supabase" or "npm install -g supabase".',
      undefined,
      { command: 'deploy-functions' }
    );
    throw new Error('Supabase CLI not found');
  }
}

function printHelp(): void {
  logger.log(`Usage:
  pnpm exec heyclaude-deploy-edge              # Deploy all edge functions
  pnpm exec heyclaude-deploy-edge data-api og-image   # Deploy selected functions

Environment variables:
  SUPABASE_PROJECT_REF          # Preferred explicit project ref
  NEXT_PUBLIC_SUPABASE_URL      # Fallback for deriving the project ref

Notes:
  - The script runs Supabase CLI from apps/edge.
  - Provide function names to deploy a subset.`);
}

/**
 * Deploy edge functions to Supabase.
 * This is a CLI entry point - throws errors on failure.
 */
export function runDeployFunctions(): void {
  ensurePaths();

  const rawArgs = process.argv.slice(2);
  if (rawArgs.includes('--help')) {
    printHelp();
    return;
  }

  // Load environment variables from .env.local
  loadEnvFiles(REPO_ROOT);

  const allFunctions = discoverFunctions();
  if (allFunctions.length === 0) {
    logger.error('No edge functions found under apps/edge/supabase/functions.', undefined, {
      command: 'deploy-functions',
    });
    throw new Error('No edge functions found');
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
      { command: 'deploy-functions' }
    );
    throw new Error('Supabase project ref is required');
  }

  // Parse config.toml to get function-specific import maps
  const configImportMaps = parseConfigToml();

  verifySupabaseCli();

  for (const fnName of functionsToDeploy) {
    const importMapPath = getImportMapPath(fnName, configImportMaps);
    
    logger.info(`🚀 Deploying edge function "${fnName}" with import map: ${importMapPath}...`, {
      command: 'deploy-functions',
      fnName,
      importMapPath,
    });
    
    const result = spawnSync(
      'supabase',
      [
        'functions',
        'deploy',
        fnName,
        '--project-ref',
        projectRef,
        '--import-map',
        importMapPath,
      ],
      {
        cwd: EDGE_ROOT,
        stdio: 'inherit',
        env: process.env,
      }
    );

    if (result.status !== 0) {
      logger.error(`❌ Deployment failed for "${fnName}".`, undefined, {
        command: 'deploy-functions',
        fnName,
        exitCode: result.status,
      });
      throw new Error(`Deployment failed for "${fnName}"`);
    }

    logger.info(`✅ "${fnName}" deployed successfully.`, { command: 'deploy-functions', fnName });
  }

  logger.info('✨ All requested edge functions deployed.', { command: 'deploy-functions', count: functionsToDeploy.length });
}
