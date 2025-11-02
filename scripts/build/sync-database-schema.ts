#!/usr/bin/env tsx
/**
 * Unified Database Schema Sync Script
 *
 * Single script that handles all database-related artifact generation:
 * 1. Schema dump (supabase/schema.sql)
 * 2. TypeScript types (src/types/database.types.ts)
 * 3. Zod schemas (src/lib/schemas/generated/db-schemas.ts)
 *
 * Features:
 * - Comprehensive change detection (tables, views, functions, indexes, triggers)
 * - Smart execution order (dump → types → zod)
 * - Individual operation support (--only-dump, --only-types, --only-zod)
 * - Skip flags (--skip-dump, --skip-types, --skip-zod)
 * - Force regeneration (--force)
 * - Hash-based caching for performance
 *
 * Usage:
 *   pnpm sync:db                # Sync all artifacts with change detection
 *   pnpm sync:db --force        # Force regeneration of all artifacts
 *   pnpm sync:db --only-types   # Only regenerate TypeScript types
 *   pnpm sync:db --only-zod     # Only regenerate Zod schemas
 *   pnpm sync:db --only-dump    # Only dump schema.sql
 *   pnpm sync:db --skip-dump    # Skip schema dump
 *
 * Performance:
 * - Full sync (all changed): ~8-12 seconds
 * - Partial sync (some changed): ~4-8 seconds
 * - No changes: ~200-500ms (early exit after hash check)
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ora from 'ora';

// ============================================================================
// Constants
// ============================================================================

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const ENV_LOCAL = join(ROOT, '.env.local');

// Output files
const SCHEMA_FILE = join(ROOT, 'supabase/schema.sql');
const TYPES_FILE = join(ROOT, 'src/types/database.types.ts');
const ZOD_OUTPUT_FILE = join(ROOT, 'src/lib/schemas/generated/db-schemas.ts');
const ZOD_TYPES_FILE = join(ROOT, 'src/lib/schemas/generated/db-schemas.d.ts');
const ZOD_CONFIG_FILE = join(ROOT, 'supazod.config.ts');
const ZOD_OUTPUT_DIR = join(ROOT, 'src/lib/schemas/generated');

// Hash files
const SCHEMA_HASH_FILE = join(ROOT, '.schema-dump-hash');
const TYPES_HASH_FILE = join(ROOT, '.db-schema-hash');
const ZOD_HASH_FILE = join(ROOT, '.zod-schema-hash');

/**
 * Comprehensive schema query covering all database objects
 */
const SCHEMA_QUERY = `
  -- Table columns
  SELECT 'table_column' as object_type, table_name, column_name, data_type, is_nullable, column_default, NULL as definition
  FROM information_schema.columns
  WHERE table_schema = 'public'

  UNION ALL

  -- Views
  SELECT 'view' as object_type, table_name, NULL as column_name, NULL as data_type, NULL as is_nullable, NULL as column_default, view_definition as definition
  FROM information_schema.views
  WHERE table_schema = 'public'

  UNION ALL

  -- Materialized views
  SELECT 'materialized_view' as object_type, schemaname || '.' || matviewname as table_name, NULL, NULL, NULL, NULL, definition
  FROM pg_matviews
  WHERE schemaname = 'public'

  UNION ALL

  -- Functions (RPC)
  SELECT 'function' as object_type, routine_name as table_name, NULL, data_type, NULL, NULL, routine_definition as definition
  FROM information_schema.routines
  WHERE routine_schema = 'public'

  UNION ALL

  -- Indexes
  SELECT 'index' as object_type, indexname as table_name, NULL, NULL, NULL, NULL, indexdef as definition
  FROM pg_indexes
  WHERE schemaname = 'public'

  UNION ALL

  -- Triggers
  SELECT 'trigger' as object_type, trigger_name as table_name, event_object_table as column_name, NULL, NULL, NULL, action_statement as definition
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'

  ORDER BY object_type, table_name, column_name;
`;

// ============================================================================
// Types
// ============================================================================

interface StepResult {
  step: string;
  success: boolean;
  skipped: boolean;
  duration_ms: number;
  reason?: string;
}

// ============================================================================
// Progress Indicator Utilities
// ============================================================================

// ============================================================================
// Shared Utilities
// ============================================================================

function hasRequiredEnvVars(): boolean {
  if (!existsSync(ENV_LOCAL)) {
    return false;
  }

  try {
    const envContent = readFileSync(ENV_LOCAL, 'utf-8');
    return envContent.includes('POSTGRES_URL_NON_POOLING=');
  } catch {
    return false;
  }
}

function pullVercelEnv(): boolean {
  // Skip if .env.local exists with required vars
  // Note: .env.local is persistent and shared across scripts (backup, sync, etc.)
  if (hasRequiredEnvVars()) {
    return true;
  }

  try {
    console.log('📥 Pulling environment variables from Vercel...');
    execSync('vercel env pull .env.local --yes', {
      cwd: ROOT,
      stdio: 'inherit',
    });

    if (!existsSync(ENV_LOCAL)) {
      console.error('❌ Failed to pull environment variables');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to pull Vercel environment:', error);
    return false;
  }
}

function getDatabaseUrl(): string | null {
  if (!existsSync(ENV_LOCAL)) {
    console.error('❌ .env.local not found');
    return null;
  }

  try {
    const envContent = readFileSync(ENV_LOCAL, 'utf-8');
    const match = envContent.match(/POSTGRES_URL_NON_POOLING=(.+)/);

    if (!match) {
      console.error('❌ POSTGRES_URL_NON_POOLING not found in environment');
      return null;
    }

    return match[1].trim();
  } catch (error) {
    console.error('❌ Failed to read .env.local:', error);
    return null;
  }
}

function calculateSchemaHash(dbUrl: string): string | null {
  try {
    const result = execSync(`psql "${dbUrl}" -c "${SCHEMA_QUERY.replace(/\n/g, ' ')}" -t -A`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    return createHash('sha256').update(result).digest('hex');
  } catch {
    console.warn('⚠️  Could not query database schema');
    return null;
  }
}

// Cache schema hash to avoid redundant queries (saves 3 queries per run)
let cachedSchemaHash: string | null | undefined;

function getSchemaHash(): string | null {
  if (cachedSchemaHash !== undefined) {
    return cachedSchemaHash;
  }

  if (!pullVercelEnv()) {
    cachedSchemaHash = null;
    return null;
  }

  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    cachedSchemaHash = null;
    return null;
  }

  cachedSchemaHash = calculateSchemaHash(dbUrl);
  return cachedSchemaHash;
}

function cleanup(): void {
  // DO NOT delete .env.local - it's a persistent development file
  // Other scripts (backup-database.ts) depend on it existing
  // The file is already gitignored for security
}

function readHash(filePath: string): string | null {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    return readFileSync(filePath, 'utf-8').trim();
  } catch {
    return null;
  }
}

function writeHash(filePath: string, hash: string): void {
  writeFileSync(filePath, hash, 'utf-8');
}

// ============================================================================
// Step 1: Schema Dump
// ============================================================================

function generateSchemaDump(isForce: boolean): StepResult {
  const startTime = performance.now();
  const spinner = ora();

  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🗂️  STEP 1: Schema Dump (supabase/schema.sql)');
    console.log(`${'='.repeat(80)}\n`);

    // Check if regeneration needed
    if (!isForce) {
      spinner.start('Checking for schema changes...');
      const currentHash = getSchemaHash();
      const storedHash = readHash(SCHEMA_HASH_FILE);

      if (currentHash && storedHash === currentHash) {
        spinner.info('Schema unchanged - skipping dump');
        return {
          step: 'Schema Dump',
          success: true,
          skipped: true,
          duration_ms: Math.round(performance.now() - startTime),
          reason: 'No changes detected',
        };
      }
      spinner.succeed('Schema changed - dumping...');
    }

    spinner.start('Dumping database schema...');

    const output = execSync('npx supabase db dump --linked', {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    writeFileSync(SCHEMA_FILE, output, 'utf-8');

    // Validate
    if (!(output.includes('CREATE TABLE') || output.includes('CREATE MATERIALIZED VIEW'))) {
      throw new Error('Generated schema appears invalid');
    }

    // Store hash
    const currentHash = getSchemaHash();
    if (currentHash) {
      writeHash(SCHEMA_HASH_FILE, currentHash);
    }

    const duration = Math.round(performance.now() - startTime);
    spinner.succeed(`Schema dump complete (${duration}ms)`);

    return {
      step: 'Schema Dump',
      success: true,
      skipped: false,
      duration_ms: duration,
    };
  } catch (error) {
    spinner.fail('Schema dump failed');
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    return {
      step: 'Schema Dump',
      success: false,
      skipped: false,
      duration_ms: Math.round(performance.now() - startTime),
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Step 2: TypeScript Types
// ============================================================================

function generateTypes(isForce: boolean): StepResult {
  const startTime = performance.now();
  const spinner = ora();

  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log('📘 STEP 2: TypeScript Types (src/types/database.types.ts)');
    console.log(`${'='.repeat(80)}\n`);

    // Check if regeneration needed
    if (!isForce) {
      spinner.start('Checking for schema changes...');
      const currentHash = getSchemaHash();
      const storedHash = readHash(TYPES_HASH_FILE);

      if (currentHash && storedHash === currentHash) {
        spinner.info('Schema unchanged - skipping type generation');
        return {
          step: 'TypeScript Types',
          success: true,
          skipped: true,
          duration_ms: Math.round(performance.now() - startTime),
          reason: 'No changes detected',
        };
      }
      spinner.succeed('Schema changed - generating types...');
    }

    spinner.start('Generating TypeScript types from Supabase...');

    const dbUrl = getDatabaseUrl();
    if (!dbUrl) {
      throw new Error('Database URL not found');
    }

    const output = execSync(`supabase gen types typescript --db-url "${dbUrl}" --schema public`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    writeFileSync(TYPES_FILE, output, 'utf-8');

    // Validate
    if (!(output.includes('export type') || output.includes('export interface'))) {
      throw new Error('Generated types appear invalid');
    }

    // Store hash
    const currentHash = getSchemaHash();
    if (currentHash) {
      writeHash(TYPES_HASH_FILE, currentHash);
    }

    const duration = Math.round(performance.now() - startTime);
    spinner.succeed(`Type generation complete (${duration}ms)`);

    return {
      step: 'TypeScript Types',
      success: true,
      skipped: false,
      duration_ms: duration,
    };
  } catch (error) {
    spinner.fail('Type generation failed');
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    return {
      step: 'TypeScript Types',
      success: false,
      skipped: false,
      duration_ms: Math.round(performance.now() - startTime),
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Step 3: Zod Schemas
// ============================================================================

function generateZodSchemas(isForce: boolean): StepResult {
  const startTime = performance.now();
  const spinner = ora();

  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🔷 STEP 3: Zod Schemas (src/lib/schemas/generated/db-schemas.ts)');
    console.log(`${'='.repeat(80)}\n`);

    // Ensure output directory exists
    if (!existsSync(ZOD_OUTPUT_DIR)) {
      mkdirSync(ZOD_OUTPUT_DIR, { recursive: true });
    }

    // Check if regeneration needed
    if (!isForce) {
      spinner.start('Checking for type changes...');

      if (!existsSync(TYPES_FILE)) {
        throw new Error('TypeScript types file not found - run type generation first');
      }

      const typesContent = readFileSync(TYPES_FILE, 'utf-8');
      const currentHash = createHash('sha256').update(typesContent).digest('hex');
      const storedHash = readHash(ZOD_HASH_FILE);

      if (storedHash === currentHash) {
        spinner.info('Types unchanged - skipping Zod generation');
        return {
          step: 'Zod Schemas',
          success: true,
          skipped: true,
          duration_ms: Math.round(performance.now() - startTime),
          reason: 'No changes detected',
        };
      }
      spinner.succeed('Types changed - generating Zod schemas...');
    }

    spinner.start('Generating Zod schemas from TypeScript types...');

    // Verify config exists
    if (!existsSync(ZOD_CONFIG_FILE)) {
      throw new Error(`Configuration file not found: ${ZOD_CONFIG_FILE}`);
    }

    // Run Supazod
    const command = [
      'pnpm supazod',
      `--input "${TYPES_FILE}"`,
      `--output "${ZOD_OUTPUT_FILE}"`,
      `--types-output "${ZOD_TYPES_FILE}"`,
      '--schema public',
      `--config "${ZOD_CONFIG_FILE}"`,
    ].join(' ');

    execSync(command, {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    // Validate
    const schemasContent = readFileSync(ZOD_OUTPUT_FILE, 'utf-8');
    if (
      !(schemasContent.includes('import { z } from') && schemasContent.includes('export const'))
    ) {
      throw new Error('Generated Zod schemas appear invalid');
    }

    // Store hash
    const typesContent = readFileSync(TYPES_FILE, 'utf-8');
    const currentHash = createHash('sha256').update(typesContent).digest('hex');
    writeHash(ZOD_HASH_FILE, currentHash);

    const duration = Math.round(performance.now() - startTime);
    spinner.succeed(`Zod schema generation complete (${duration}ms)`);

    return {
      step: 'Zod Schemas',
      success: true,
      skipped: false,
      duration_ms: duration,
    };
  } catch (error) {
    spinner.fail('Zod generation failed');
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    return {
      step: 'Zod Schemas',
      success: false,
      skipped: false,
      duration_ms: Math.round(performance.now() - startTime),
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const isForce = args.includes('--force');
  const onlyDump = args.includes('--only-dump');
  const onlyTypes = args.includes('--only-types');
  const onlyZod = args.includes('--only-zod');
  const skipDump = args.includes('--skip-dump');
  const skipTypes = args.includes('--skip-types');
  const skipZod = args.includes('--skip-zod');

  // Determine which operations to run
  const runDump = onlyDump || !(onlyTypes || onlyZod || skipDump);
  const runTypes = onlyTypes || !(onlyDump || onlyZod || skipTypes);
  const runZod = onlyZod || !(onlyDump || onlyTypes || skipZod);

  console.log('🔄 Database Schema Sync\n');
  console.log('Configuration:');
  console.log(`  Force regeneration: ${isForce ? 'Yes' : 'No'}`);
  console.log(`  Schema dump: ${runDump ? 'Yes' : 'No'}`);
  console.log(`  Type generation: ${runTypes ? 'Yes' : 'No'}`);
  console.log(`  Zod generation: ${runZod ? 'Yes' : 'No'}\n`);

  const overallStartTime = performance.now();
  const results: StepResult[] = [];

  try {
    // Early exit optimization: Check if anything needs regeneration
    if (!isForce && runDump && runTypes && runZod) {
      console.log('🔍 Checking if database schema has changed...\n');
      const currentSchemaHash = getSchemaHash();

      if (currentSchemaHash) {
        const schemaUpToDate =
          readHash(SCHEMA_HASH_FILE) === currentSchemaHash &&
          readHash(TYPES_HASH_FILE) === currentSchemaHash;

        // Check Zod separately (depends on types content, not schema)
        let zodUpToDate = false;
        if (existsSync(TYPES_FILE)) {
          const typesContent = readFileSync(TYPES_FILE, 'utf-8');
          const typesHash = createHash('sha256').update(typesContent).digest('hex');
          zodUpToDate = readHash(ZOD_HASH_FILE) === typesHash;
        }

        if (schemaUpToDate && zodUpToDate) {
          console.log('✅ Database schema unchanged - all artifacts up to date');
          console.log('   Use --force to regenerate anyway\n');
          cleanup();
          return;
        }

        console.log('📊 Database schema has changed - syncing artifacts\n');
      }
    }

    // Run operations in order
    if (runDump) {
      results.push(generateSchemaDump(isForce));
      if (!results[results.length - 1].success) {
        throw new Error('Schema dump failed - aborting');
      }
    }

    if (runTypes) {
      results.push(generateTypes(isForce));
      if (!results[results.length - 1].success) {
        throw new Error('Type generation failed - aborting');
      }
    }

    if (runZod) {
      results.push(generateZodSchemas(isForce));
      if (!results[results.length - 1].success) {
        throw new Error('Zod generation failed - aborting');
      }
    }

    // Summary
    const overallDuration = Math.round(performance.now() - overallStartTime);
    const completedSteps = results.filter((r) => r.success && !r.skipped).length;
    const skippedSteps = results.filter((r) => r.skipped).length;
    const failedSteps = results.filter((r) => !r.success).length;

    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 Sync Summary');
    console.log(`${'='.repeat(80)}\n`);

    for (const result of results) {
      const icon = result.success ? '✅' : '❌';
      const status = result.skipped ? 'SKIPPED' : result.success ? 'SUCCESS' : 'FAILED';
      const duration = result.duration_ms > 0 ? `(${result.duration_ms}ms)` : '';

      console.log(`  ${icon} ${result.step}: ${status} ${duration}`);
      if (result.reason) {
        console.log(`     ${result.reason}`);
      }
    }

    console.log(`\nTotal Duration: ${overallDuration}ms (${(overallDuration / 1000).toFixed(2)}s)`);
    console.log(
      `Completed: ${completedSteps} | Skipped: ${skippedSteps} | Failed: ${failedSteps}\n`
    );

    if (failedSteps === 0) {
      console.log('✅ Database schema sync completed successfully!\n');
    } else {
      console.error('❌ Database schema sync completed with errors\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Sync failed:', error instanceof Error ? error.message : String(error));
    cleanup();
    process.exit(1);
  } finally {
    cleanup();
  }
}

main().catch((error) => {
  console.error('❌ Unhandled error in main:', error);
  cleanup();
  process.exit(1);
});
