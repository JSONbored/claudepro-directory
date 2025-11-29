import { execFileSync, execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ora from 'ora';
import { normalizeError } from '@heyclaude/shared-runtime';
import { computeHash, hasHashChanged, setHash } from '../toolkit/cache.js';
import { ensureEnvVars } from '../toolkit/env.js';
import { logger } from '../toolkit/logger.js';

// ============================================================================
// Constants
// ============================================================================

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));

// Output files
const SCHEMA_FILE = join(ROOT, 'apps/edge/schema.sql');
const TYPES_FILE = join(ROOT, 'packages/database-types/src/index.ts');

const DEFAULT_SCHEMA = 'public';

interface PackageBuildConfig {
  name: string;
  tsconfigPath: string;
  description: string;
}

const PACKAGE_BUILDS: readonly PackageBuildConfig[] = [
  {
    name: '@heyclaude/data-layer',
    tsconfigPath: 'packages/data-layer/tsconfig.json',
    description: 'Emit data-layer declarations consumed by web-runtime + server actions',
  },
  {
    name: '@heyclaude/shared-runtime',
    tsconfigPath: 'packages/shared-runtime/tsconfig.json',
    description: 'Emit shared runtime declarations consumed across apps/web + scripts',
  },
  {
    name: '@heyclaude/web-runtime',
    tsconfigPath: 'packages/web-runtime/tsconfig.json',
    description: 'Emit Next runtime declarations used by apps/web',
  },
] as const;

/**
 * Comprehensive schema query covering all database objects
 */
function buildSchemaQuery(schema: string): string {
  const safeSchema = schema.replace(/'/g, "''");
  return `
    -- Table columns
    SELECT 'table_column' as object_type, table_name, column_name, data_type, is_nullable, column_default, NULL as definition
    FROM information_schema.columns
    WHERE table_schema = '${safeSchema}'

    UNION ALL

    -- Views
    SELECT 'view' as object_type, table_name, NULL as column_name, NULL as data_type, NULL as is_nullable, NULL as column_default, view_definition as definition
    FROM information_schema.views
    WHERE table_schema = '${safeSchema}'

    UNION ALL

    -- Materialized views
    SELECT 'materialized_view' as object_type, schemaname || '.' || matviewname as table_name, NULL, NULL, NULL, NULL, definition
    FROM pg_matviews
    WHERE schemaname = '${safeSchema}'

    UNION ALL

    -- Functions (RPC)
    SELECT 'function' as object_type, routine_name as table_name, NULL, data_type, NULL, NULL, routine_definition as definition
    FROM information_schema.routines
    WHERE routine_schema = '${safeSchema}'

    UNION ALL

    -- Indexes
    SELECT 'index' as object_type, indexname as table_name, NULL, NULL, NULL, NULL, indexdef as definition
    FROM pg_indexes
    WHERE schemaname = '${safeSchema}'

    UNION ALL

    -- Triggers
    SELECT 'trigger' as object_type, trigger_name as table_name, event_object_table as column_name, NULL, NULL, NULL, action_statement as definition
    FROM information_schema.triggers
    WHERE trigger_schema = '${safeSchema}'

    UNION ALL

    ORDER BY object_type, table_name, column_name;
  `;
}

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

interface EnvConfig {
  projectId: string | null;
  dbUrl: string | null;
}

const schemaHashCache = new Map<string, string | null>();

// ============================================================================
// Shared Utilities
// ============================================================================

function requireEnvVar(value: string | null, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function ensureSupabaseCli(): void {
  try {
    execSync('npx supabase --version', { stdio: 'pipe' });
  } catch (error) {
    throw new Error(
      `Supabase CLI not found. Install via "npm install -g supabase" or use "npx supabase login".\n${
        (error as Error).message
      }`
    );
  }
}

function formatDuration(ms: number): string {
  return `${ms}ms (${(ms / 1000).toFixed(2)}s)`;
}

function writeReport(reportPath: string, data: unknown): void {
  try {
    writeFileSync(reportPath, JSON.stringify(data, null, 2), 'utf-8');
    logger.info(`📝 Report written to ${reportPath}`);
  } catch (error) {
    logger.warn(`Failed to write report to ${reportPath}: ${(error as Error).message}`, {
      reportPath,
    });
  }
}

function getOptionValue(args: string[], flag: string): string | null {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Flag ${flag} requires a value`);
  }
  return value;
}

function calculateSchemaHash(dbUrl: string, schema: string): string | null {
  try {
    const query = buildSchemaQuery(schema).replace(/\n/g, ' ');
    const result = execFileSync('psql', ['-d', dbUrl, '-c', query, '-t', '-A'], {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    return computeHash(result);
  } catch (error) {
    logger.warn('⚠️  Could not query database schema', {
      script: 'sync-database-schema',
      error: (error as Error).message,
    });
    return null;
  }
}

// Cache schema hash to avoid redundant queries
function getSchemaHash(schema: string, envConfig: EnvConfig, forceRefresh = false): string | null {
  if (!forceRefresh && schemaHashCache.has(schema)) {
    return schemaHashCache.get(schema) ?? null;
  }

  const dbUrl = envConfig.dbUrl;
  if (!dbUrl) {
    schemaHashCache.set(schema, null);
    return null;
  }

  const hash = calculateSchemaHash(dbUrl, schema);
  schemaHashCache.set(schema, hash);
  return hash;
}

// ============================================================================
// Step 1: Schema Dump
// ============================================================================

function generateSchemaDump(params: {
  isForce: boolean;
  cachedHash?: string | null | undefined;
  schema: string;
  dbUrl: string;
  dryRun: boolean;
  envConfig: EnvConfig;
}): StepResult {
  const { isForce, cachedHash, schema, dbUrl, dryRun, envConfig } = params;
  const startTime = performance.now();
  const spinner = ora();

  try {
    logger.info(`\n${'='.repeat(80)}`, { script: 'sync-database-schema' });
    logger.info(`🗂️  STEP 1: Schema Dump (${schema}) -> ${SCHEMA_FILE}`, {
      script: 'sync-database-schema',
    });
    logger.info(`${'='.repeat(80)}\n`, { script: 'sync-database-schema' });

    // Check if regeneration needed
    if (!isForce) {
      spinner.start('Checking for schema changes...');
      // OPTIMIZATION: Use cached hash if provided (avoids redundant database query)
      const currentHash = cachedHash !== undefined ? cachedHash : getSchemaHash(schema, envConfig);

      if (currentHash && !hasHashChanged(`schema-dump:${schema}`, currentHash)) {
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

    const dumpArgs = ['supabase', 'db', 'dump', '--db-url', dbUrl, '--schema', schema];
    const dumpCommandStr = `npx ${dumpArgs.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg)).join(' ')}`;
    if (dryRun) {
      spinner.info('[dry-run] Skipping schema dump execution');
      logger.info(`Would run: ${dumpCommandStr}`);
    } else {
      const output = execFileSync('npx', dumpArgs, {
        cwd: ROOT,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      writeFileSync(SCHEMA_FILE, output, 'utf-8');

      // Validate
      if (!(output.includes('CREATE TABLE') || output.includes('CREATE MATERIALIZED VIEW'))) {
        throw new Error('Generated schema appears invalid');
      }
    }

    // Store hash (refresh cache after successful dump)
    const currentHash = dryRun ? null : getSchemaHash(schema, envConfig, true);
    const duration = Math.round(performance.now() - startTime);

    if (currentHash) {
      setHash(`schema-dump:${schema}`, currentHash, {
        reason: 'Schema dump generated',
        duration,
      });
    }

    spinner.succeed(
      `Schema dump ${dryRun ? 'validated (dry run)' : 'complete'} (${formatDuration(duration)})`
    );

    return {
      step: 'Schema Dump',
      success: true,
      skipped: dryRun,
      duration_ms: duration,
      ...(dryRun ? { reason: 'Dry run' } : {}),
    };
  } catch (error) {
    spinner.fail('Schema dump failed');
    const schemaError = normalizeError(error, 'Schema dump failed');
    logger.error(
      `   ${schemaError.message}`,
      schemaError,
      {
        script: 'sync-database-schema',
        step: 'Schema Dump',
      }
    );
    return {
      step: 'Schema Dump',
      success: false,
      skipped: false,
      duration_ms: Math.round(performance.now() - startTime),
      reason: normalizeError(error, "Operation failed").message,
    };
  }
}

// ============================================================================
// Step 2: TypeScript Types
// ============================================================================

function generateTypes(params: {
  isForce: boolean;
  cachedHash?: string | null | undefined;
  schema: string;
  projectId: string;
  dryRun: boolean;
  envConfig: EnvConfig;
}): StepResult {
  const { isForce, cachedHash, schema, projectId, dryRun, envConfig } = params;
  const startTime = performance.now();
  const spinner = ora();

  try {
    logger.info(`\n${'='.repeat(80)}`, { script: 'sync-database-schema' });
    logger.info(`📘 STEP 2: TypeScript Types (${schema}) -> ${TYPES_FILE}`, {
      script: 'sync-database-schema',
    });
    logger.info(`${'='.repeat(80)}\n`, { script: 'sync-database-schema' });

    // Check if regeneration needed
    if (!isForce) {
      spinner.start('Checking for schema changes...');
      // OPTIMIZATION: Use cached hash if provided (avoids redundant database query)
      const currentHash = cachedHash !== undefined ? cachedHash : getSchemaHash(schema, envConfig);

      if (currentHash && !hasHashChanged(`db-schema:${schema}`, currentHash)) {
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

    // Use --project-id instead of --db-url (handles SSL automatically via Supabase API)
    const typeCommandArgs = [
      'supabase',
      'gen',
      'types',
      'typescript',
      '--project-id',
      projectId,
      '--schema',
      schema,
    ];
    const typeCommandStr = `npx ${typeCommandArgs.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg)).join(' ')}`;
    let output = '';
    if (dryRun) {
      spinner.info('[dry-run] Skipping type generation execution');
      logger.info(`Would run: ${typeCommandStr}`);
    } else {
      output = execFileSync('npx', typeCommandArgs, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      writeFileSync(TYPES_FILE, output, 'utf-8');

      logger.info('🛠️  Emitting declaration artifacts (packages/database-types/dist)...', {
        script: 'sync-database-schema',
      });
      execSync('pnpm tsc -b packages/database-types/tsconfig.json', {
        cwd: ROOT,
        stdio: 'pipe',
      });

      // Validate
      if (!(output.includes('export type') || output.includes('export interface'))) {
        throw new Error('Generated types appear invalid');
      }
    }

    // Store hash (use cached value, no need to refresh)
    const currentHash =
      dryRun || cachedHash !== undefined ? (cachedHash ?? null) : getSchemaHash(schema, envConfig);
    const duration = Math.round(performance.now() - startTime);

    if (currentHash) {
      setHash(`db-schema:${schema}`, currentHash, {
        reason: 'Database types regenerated',
        duration,
      });
    }

    spinner.succeed(
      `Type generation ${dryRun ? 'validated (dry run)' : 'complete'} (${formatDuration(duration)})`
    );

    return {
      step: 'TypeScript Types',
      success: true,
      skipped: dryRun,
      duration_ms: Math.round(performance.now() - startTime),
      ...(dryRun ? { reason: 'Dry run' } : {}),
    };
  } catch (error) {
    spinner.fail('Type generation failed');
    const typeGenError = normalizeError(error, 'Type generation failed');
    logger.error(
      `   ${typeGenError.message}`,
      typeGenError,
      {
        script: 'sync-database-schema',
        step: 'TypeScript Types',
      }
    );
    return {
      step: 'TypeScript Types',
      success: false,
      skipped: false,
      duration_ms: Math.round(performance.now() - startTime),
      reason: normalizeError(error, "Operation failed").message,
    };
  }
}

function runPackageBuilds(params: {
  packages: readonly PackageBuildConfig[];
  dryRun: boolean;
}): StepResult {
  const { packages, dryRun } = params;
  const startTime = performance.now();

  if (packages.length === 0) {
    return {
      step: 'Package Builds',
      success: true,
      skipped: true,
      duration_ms: Math.round(performance.now() - startTime),
      reason: 'No packages configured',
    };
  }

  const spinner = ora();

  try {
    logger.info(`\n${'='.repeat(80)}`, { script: 'sync-database-schema' });
    logger.info('📦 STEP 3: Package builds', { script: 'sync-database-schema' });
    logger.info(`${'='.repeat(80)}\n`, { script: 'sync-database-schema' });

    for (const pkg of packages) {
      const command = `pnpm tsc -b ${pkg.tsconfigPath}`;
      spinner.start(`Building ${pkg.name}...`);

      if (dryRun) {
        spinner.info(`[dry-run] Skipping build for ${pkg.name}`);
        logger.info(`Would run: ${command}`, {
          script: 'sync-database-schema',
          package: pkg.name,
          tsconfig: pkg.tsconfigPath,
        });
        continue;
      }

      execSync(command, { cwd: ROOT, stdio: 'pipe' });
      spinner.succeed(`Built ${pkg.name}`);
    }

    const duration = Math.round(performance.now() - startTime);
    return {
      step: 'Package Builds',
      success: true,
      skipped: dryRun,
      duration_ms: duration,
      ...(dryRun ? { reason: 'Dry run' } : {}),
    };
  } catch (error) {
    spinner.fail('Package builds failed');
    const buildError = normalizeError(error, 'Package builds failed');
    logger.error(
      `   ${buildError.message}`,
      buildError,
      {
        script: 'sync-database-schema',
        step: 'Package Builds',
      }
    );
    return {
      step: 'Package Builds',
      success: false,
      skipped: false,
      duration_ms: Math.round(performance.now() - startTime),
      reason: normalizeError(error, "Operation failed").message,
    };
  }
}

function runTypeVerification(dryRun: boolean): StepResult {
  const startTime = performance.now();
  const commands = ['pnpm type-check:packages', 'pnpm type-check:web'];
  try {
    for (const command of commands) {
      if (dryRun) {
        logger.info(`[dry-run] Would run: ${command}`);
      } else {
        logger.info(`Running ${command}...`);
        execSync(command, { cwd: ROOT, stdio: 'inherit' });
      }
    }

    const duration = Math.round(performance.now() - startTime);
    return {
      step: 'Type Verification',
      success: true,
      skipped: dryRun,
      duration_ms: duration,
      ...(dryRun ? { reason: 'Dry run' } : {}),
    };
  } catch (error) {
    return {
      step: 'Type Verification',
      success: false,
      skipped: false,
      duration_ms: Math.round(performance.now() - startTime),
      reason: normalizeError(error, "Operation failed").message,
    };
  }
}

// ============================================================================
// Main
// ============================================================================

export async function runSyncDb() {
  const args = process.argv.slice(2);
  const isForce = args.includes('--force');
  const onlyDump = args.includes('--only-dump');
  const onlyTypes = args.includes('--only-types');
  const skipDump = args.includes('--skip-dump');
  const skipTypes = args.includes('--skip-types');
  const skipPackageBuilds = args.includes('--skip-package-builds');
  const schemaArg = getOptionValue(args, '--schema');
  const reportPath = getOptionValue(args, '--report');
  const verify = args.includes('--verify');
  const dryRun = args.includes('--dry-run');
  const schema = (schemaArg ?? DEFAULT_SCHEMA).trim() || DEFAULT_SCHEMA;

  // Determine which operations to run
  const runDump = onlyDump || !(onlyTypes || skipDump);
  const runTypes = onlyTypes || !(onlyDump || skipTypes);
  const runPackageBuildsStep = runTypes && !skipPackageBuilds;

  // Ensure env vars are loaded
  await ensureEnvVars(['SUPABASE_PROJECT_ID', 'POSTGRES_URL_NON_POOLING']);

  const envConfig: EnvConfig = {
    projectId: process.env['SUPABASE_PROJECT_ID'] || null,
    dbUrl: process.env['POSTGRES_URL_NON_POOLING'] || null,
  };

  const projectId =
    runTypes || verify
      ? requireEnvVar(envConfig.projectId, 'SUPABASE_PROJECT_ID')
      : (envConfig.projectId ?? '');
  const dbUrl = runDump
    ? requireEnvVar(envConfig.dbUrl, 'POSTGRES_URL_NON_POOLING')
    : envConfig.dbUrl;
  const effectiveEnvConfig: EnvConfig = {
    ...envConfig,
    projectId,
    dbUrl: dbUrl ?? null,
  };

  logger.info('🔄 Database Schema Sync\n', { script: 'sync-database-schema' });
  logger.info('Configuration:', { script: 'sync-database-schema' });
  logger.info(`  Force regeneration: ${isForce ? 'Yes' : 'No'}`, {
    script: 'sync-database-schema',
    force: isForce,
  });
  logger.info(`  Schema dump: ${runDump ? 'Yes' : 'No'}`, {
    script: 'sync-database-schema',
    runDump,
  });
  logger.info(`  Type generation: ${runTypes ? 'Yes' : 'No'}`, {
    script: 'sync-database-schema',
    runTypes,
  });
  logger.info(
    `  Package builds: ${runPackageBuildsStep ? 'Yes' : 'No'}${
      skipPackageBuilds ? ' (skipped via flag)' : ''
    }\n`,
    {
      script: 'sync-database-schema',
      runPackageBuilds: runPackageBuildsStep,
      skipPackageBuilds,
    }
  );
  logger.info(`  Schema: ${schema}`, { schema });
  logger.info(`  Dry run: ${dryRun ? 'Yes' : 'No'}`, { dryRun });
  logger.info(`  Verify: ${verify ? 'Yes' : 'No'}`, { verify });

  const overallStartTime = performance.now();
  const results: StepResult[] = [];

  try {
    if (!dryRun && (runDump || runTypes)) {
      ensureSupabaseCli();
    }

    // OPTIMIZATION: Single schema hash query for all checks
    let cachedSchemaHashForRun: string | null | undefined;

    if (!isForce && effectiveEnvConfig.dbUrl) {
      if (runDump && runTypes) {
        logger.info('🔍 Checking if database schema has changed...\n', {
          script: 'sync-database-schema',
        });
        cachedSchemaHashForRun = getSchemaHash(schema, effectiveEnvConfig);

        if (cachedSchemaHashForRun) {
          const schemaUpToDate = !(
            hasHashChanged(`schema-dump:${schema}`, cachedSchemaHashForRun) ||
            hasHashChanged(`db-schema:${schema}`, cachedSchemaHashForRun)
          );

          if (schemaUpToDate) {
            logger.info('✅ Database schema unchanged - all artifacts up to date');
            logger.info('   Use --force to regenerate anyway\n');
            return;
          }

          logger.info('📊 Database schema has changed - syncing artifacts\n');
        }
      } else if (runDump || runTypes) {
        cachedSchemaHashForRun = getSchemaHash(schema, effectiveEnvConfig);
      }
    }

    // Run operations in order, passing cached hash to avoid redundant queries
    if (runDump) {
      results.push(
        generateSchemaDump({
          isForce,
          cachedHash: cachedSchemaHashForRun ?? undefined,
          schema,
          dbUrl: requireEnvVar(effectiveEnvConfig.dbUrl, 'POSTGRES_URL_NON_POOLING'),
          dryRun,
          envConfig: effectiveEnvConfig,
        })
      );
      const dumpResult = results[results.length - 1];
      if (!dumpResult?.success) {
        throw new Error('Schema dump failed - aborting');
      }
    }

    if (runTypes) {
      results.push(
        generateTypes({
          isForce,
          cachedHash: cachedSchemaHashForRun ?? undefined,
          schema,
          projectId: requireEnvVar(effectiveEnvConfig.projectId, 'SUPABASE_PROJECT_ID'),
          dryRun,
          envConfig: effectiveEnvConfig,
        })
      );
      const typesResult = results[results.length - 1];
      if (!typesResult?.success) {
        throw new Error('Type generation failed - aborting');
      }
    }

    if (runPackageBuildsStep) {
      results.push(
        runPackageBuilds({
          packages: PACKAGE_BUILDS,
          dryRun,
        })
      );
      const packageBuildResult = results[results.length - 1];
      if (!packageBuildResult?.success) {
        throw new Error('Package builds failed - aborting');
      }
    }

    if (verify) {
      const verifyResult = runTypeVerification(dryRun);
      results.push(verifyResult);
      if (!verifyResult.success) {
        throw new Error('Type verification failed - aborting');
      }
    }

    // Summary
    const overallDuration = Math.round(performance.now() - overallStartTime);
    const completedSteps = results.filter((r) => r.success && !r.skipped).length;
    const skippedSteps = results.filter((r) => r.skipped).length;
    const failedSteps = results.filter((r) => !r.success).length;

    logger.info(`\n${'='.repeat(80)}`, { script: 'sync-database-schema' });
    logger.info('📊 Sync Summary', { script: 'sync-database-schema' });
    logger.info(`${'='.repeat(80)}\n`, { script: 'sync-database-schema' });

    const summaryRows = results.map((result) => ({
      step: result.step,
      status: result.skipped ? 'SKIPPED' : result.success ? 'SUCCESS' : 'FAILED',
      duration: result.duration_ms > 0 ? `${result.duration_ms}ms` : '—',
      notes: result.reason ?? '',
    }));

    const summaryColumns = [
      { key: 'step', label: 'Step' },
      { key: 'status', label: 'Status' },
      { key: 'duration', label: 'Duration' },
      { key: 'notes', label: 'Notes' },
    ] as const;

    const colWidths = summaryColumns.map((col) => {
      const valueLengths = summaryRows.map((row) => String(row[col.key]).length);
      return Math.max(col.label.length, ...valueLengths);
    });

    const formatRow = (row: Record<string, string>) =>
      summaryColumns
        .map((col, idx) => {
          const width = colWidths[idx] ?? col.label.length;
          return String(row[col.key]).padEnd(width);
        })
        .join('  |  ');

    const headerLine = formatRow(
      summaryColumns.reduce<Record<string, string>>((acc, col) => {
        acc[col.key] = col.label;
        return acc;
      }, {})
    );
    const separatorLine = summaryColumns
      .map((_, idx) => ''.padEnd(colWidths[idx] ?? 0, '-'))
      .join('--+--');

    logger.info(headerLine);
    logger.info(separatorLine);
    for (const row of summaryRows) {
      logger.info(formatRow(row));
    }

    logger.info(`\nTotal Duration: ${overallDuration}ms (${(overallDuration / 1000).toFixed(2)}s)`);
    logger.info(
      `Completed: ${completedSteps} | Skipped: ${skippedSteps} | Failed: ${failedSteps}\n`,
      {
        completed: completedSteps,
        skipped: skippedSteps,
        failed: failedSteps,
        duration: `${overallDuration}ms`,
      }
    );

    if (failedSteps === 0) {
      logger.info('✅ Database schema sync completed successfully!\n');
    } else {
      logger.error('❌ Database schema sync completed with errors\n', undefined, { failedSteps });
      process.exit(1);
    }

    if (reportPath) {
      writeReport(reportPath, {
        schema,
        duration_ms: overallDuration,
        steps: results,
        timestamp: new Date().toISOString(),
        options: { force: isForce, verify, dryRun },
      });
    }
  } catch (error) {
    logger.error('\n❌ Sync failed', normalizeError(error, 'Database sync failed'), {
      script: 'sync-database-schema',
    });
    process.exit(1);
  }
}
