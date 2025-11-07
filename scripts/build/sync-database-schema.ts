#!/usr/bin/env tsx
/**
 * Database Schema Sync Script
 *
 * Handles database-related artifact generation:
 * 1. Schema dump (supabase/schema.sql) - OPTIONAL, for version control only
 * 2. TypeScript types (src/types/database.types.ts) - queries database directly
 *
 * Features:
 * - Smart defaults: skips schema.sql by default (not needed for type generation)
 * - Comprehensive change detection (tables, views, functions, indexes, triggers)
 * - Individual operation support (--only-dump, --only-types)
 * - Skip flags (--skip-dump, --skip-types)
 * - Force regeneration (--force)
 * - Hash-based caching for performance
 *
 * Usage:
 *   pnpm sync:db                # Fast mode: types only (~10-15s)
 *   pnpm sync:db:full           # Complete sync including schema.sql (~60s)
 *   pnpm sync:db --force        # Force regeneration (respects skip flags)
 *   pnpm sync:db:types          # Only regenerate TypeScript types
 *
 * Performance:
 * - Fast mode (types): ~10-15 seconds ⚡
 * - Full sync (with schema.sql): ~60 seconds
 * - No changes: ~200-500ms (early exit after hash check)
 *
 * Note: schema.sql is NOT required for type generation. Types are generated
 * directly from the database using --db-url. Use sync:db:full when you need
 * to update schema.sql for version control or documentation purposes.
 */

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ora from 'ora';
import { computeHash, hasHashChanged, setHash } from '../utils/build-cache.js';
import { ensureEnvVars } from '../utils/env.js';

// ============================================================================
// Constants
// ============================================================================

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');

// Output files
const SCHEMA_FILE = join(ROOT, 'supabase/schema.sql');
const TYPES_FILE = join(ROOT, 'src/types/database.types.ts');

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

async function getDatabaseUrl(): Promise<string | null> {
  try {
    await ensureEnvVars(['POSTGRES_URL_NON_POOLING']);
    return process.env.POSTGRES_URL_NON_POOLING || null;
  } catch (error) {
    console.error('❌ Failed to load environment variables:', error);
    return null;
  }
}

function calculateSchemaHash(dbUrl: string): string | null {
  try {
    const result = execSync(`psql "${dbUrl}" -c "${SCHEMA_QUERY.replace(/\n/g, ' ')}" -t -A`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    return computeHash(result);
  } catch {
    console.warn('⚠️  Could not query database schema');
    return null;
  }
}

// Cache schema hash to avoid redundant queries
// OPTIMIZATION: Single query per script run (was 3 queries before)
let cachedSchemaHash: string | null | undefined;
let cacheInitialized = false;

async function getSchemaHash(forceRefresh = false): Promise<string | null> {
  // Return cached value if available and not forcing refresh
  if (cacheInitialized && !forceRefresh && cachedSchemaHash !== undefined) {
    return cachedSchemaHash;
  }

  const dbUrl = await getDatabaseUrl();
  if (!dbUrl) {
    cachedSchemaHash = null;
    cacheInitialized = true;
    return null;
  }

  cachedSchemaHash = calculateSchemaHash(dbUrl);
  cacheInitialized = true;
  return cachedSchemaHash;
}

function cleanup(): void {
  // DO NOT delete .env.local - it's a persistent development file
  // Other scripts (backup-database.ts) depend on it existing
  // The file is already gitignored for security
}

// ============================================================================
// Step 1: Schema Dump
// ============================================================================

async function generateSchemaDump(
  isForce: boolean,
  cachedHash?: string | null
): Promise<StepResult> {
  const startTime = performance.now();
  const spinner = ora();

  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🗂️  STEP 1: Schema Dump (supabase/schema.sql)');
    console.log(`${'='.repeat(80)}\n`);

    // Check if regeneration needed
    if (!isForce) {
      spinner.start('Checking for schema changes...');
      // OPTIMIZATION: Use cached hash if provided (avoids redundant database query)
      const currentHash = cachedHash !== undefined ? cachedHash : await getSchemaHash();

      if (currentHash && !hasHashChanged('schema-dump', currentHash)) {
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

    // Store hash (refresh cache after successful dump)
    const currentHash = await getSchemaHash(true);
    const duration = Math.round(performance.now() - startTime);

    if (currentHash) {
      setHash('schema-dump', currentHash, {
        reason: 'Schema dump generated',
        duration,
      });
    }

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

async function generateTypes(isForce: boolean, cachedHash?: string | null): Promise<StepResult> {
  const startTime = performance.now();
  const spinner = ora();

  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log('📘 STEP 2: TypeScript Types (src/types/database.types.ts)');
    console.log(`${'='.repeat(80)}\n`);

    // Check if regeneration needed
    if (!isForce) {
      spinner.start('Checking for schema changes...');
      // OPTIMIZATION: Use cached hash if provided (avoids redundant database query)
      const currentHash = cachedHash !== undefined ? cachedHash : await getSchemaHash();

      if (currentHash && !hasHashChanged('db-schema', currentHash)) {
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

    const dbUrl = await getDatabaseUrl();
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

    // Store hash (use cached value, no need to refresh)
    const currentHash = cachedHash !== undefined ? cachedHash : await getSchemaHash();
    const duration = Math.round(performance.now() - startTime);

    if (currentHash) {
      setHash('db-schema', currentHash, {
        reason: 'Database types regenerated',
        duration,
      });
    }

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
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const isForce = args.includes('--force');
  const onlyDump = args.includes('--only-dump');
  const onlyTypes = args.includes('--only-types');
  const skipDump = args.includes('--skip-dump');
  const skipTypes = args.includes('--skip-types');

  // Determine which operations to run
  const runDump = onlyDump || !(onlyTypes || skipDump);
  const runTypes = onlyTypes || !(onlyDump || skipTypes);

  console.log('🔄 Database Schema Sync\n');
  console.log('Configuration:');
  console.log(`  Force regeneration: ${isForce ? 'Yes' : 'No'}`);
  console.log(`  Schema dump: ${runDump ? 'Yes' : 'No'}`);
  console.log(`  Type generation: ${runTypes ? 'Yes' : 'No'}\n`);

  const overallStartTime = performance.now();
  const results: StepResult[] = [];

  try {
    // OPTIMIZATION: Single schema hash query for all checks
    let cachedSchemaHashForRun: string | null | undefined;

    // Early exit optimization: Check if anything needs regeneration
    if (!isForce && runDump && runTypes) {
      console.log('🔍 Checking if database schema has changed...\n');
      cachedSchemaHashForRun = await getSchemaHash();

      if (cachedSchemaHashForRun) {
        const schemaUpToDate = !(
          hasHashChanged('schema-dump', cachedSchemaHashForRun) ||
          hasHashChanged('db-schema', cachedSchemaHashForRun)
        );

        if (schemaUpToDate) {
          console.log('✅ Database schema unchanged - all artifacts up to date');
          console.log('   Use --force to regenerate anyway\n');
          cleanup();
          return;
        }

        console.log('📊 Database schema has changed - syncing artifacts\n');
      }
    } else if (!isForce && (runDump || runTypes)) {
      // Pre-fetch schema hash if we'll need it (single query for both dump and types)
      cachedSchemaHashForRun = await getSchemaHash();
    }

    // Run operations in order, passing cached hash to avoid redundant queries
    if (runDump) {
      results.push(await generateSchemaDump(isForce, cachedSchemaHashForRun));
      if (!results[results.length - 1].success) {
        throw new Error('Schema dump failed - aborting');
      }
    }

    if (runTypes) {
      results.push(await generateTypes(isForce, cachedSchemaHashForRun));
      if (!results[results.length - 1].success) {
        throw new Error('Type generation failed - aborting');
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
