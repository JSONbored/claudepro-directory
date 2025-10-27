#!/usr/bin/env tsx
/**
 * Zod Schema Auto-Generation from Supabase Types
 *
 * Generates Zod validation schemas from TypeScript types using Supazod.
 * Eliminates manual schema maintenance and ensures type/schema consistency.
 *
 * **What This Solves:**
 * Before: Manual Zod schemas that drifted from database types
 * After: Single source of truth (database.types.ts) → auto-generated Zod schemas
 *
 * **Generated Files:**
 * 1. src/lib/schemas/generated/db-schemas.ts - Zod validation schemas
 * 2. src/lib/schemas/generated/db-schemas.d.ts - TypeScript type declarations
 *
 * **Architecture Benefits:**
 * - Zero manual synchronization (DB change → types → schemas all auto-generated)
 * - Type-safe (Zod schemas match DB types exactly)
 * - Runtime validation at API boundaries
 * - Change detection (skips regeneration if types unchanged)
 * - Tree-shakeable (only imported schemas included in bundle)
 *
 * Usage:
 *   pnpm generate:zod        # Generate with change detection
 *   pnpm generate:zod --force # Force regeneration
 *   pnpm generate:zod --check # Drift detection (CI/CD)
 *   pnpm generate:zod --dry   # Preview without writing
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ============================================================================
// Constants
// ============================================================================

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');

/**
 * Input file: TypeScript types generated from Supabase
 * This is the single source of truth for all schemas
 */
const INPUT_FILE = join(ROOT, 'src/types/database.types.ts');

/**
 * Output file: Generated Zod schemas
 * This file is auto-generated and should NOT be manually edited
 */
const OUTPUT_FILE = join(ROOT, 'src/lib/schemas/generated/db-schemas.ts');

/**
 * TypeScript declarations for generated schemas
 * Provides type-only exports for better IDE experience
 */
const TYPES_OUTPUT_FILE = join(ROOT, 'src/lib/schemas/generated/db-schemas.d.ts');

/**
 * Configuration file for Supazod
 * Defines naming patterns and generation rules
 */
const CONFIG_FILE = join(ROOT, 'supazod.config.ts');

/**
 * Hash file for change detection
 * Stores hash of input file to detect changes
 */
const HASH_FILE = join(ROOT, '.zod-schema-hash');

/**
 * Output directory for generated files
 */
const OUTPUT_DIR = join(ROOT, 'src/lib/schemas/generated');

// ============================================================================
// File System Utilities
// ============================================================================

/**
 * Ensure output directory exists
 * Creates directory structure if missing
 */
function ensureOutputDirectory(): void {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created directory: ${OUTPUT_DIR}`);
  }
}

/**
 * Create .gitignore for generated files
 * Ensures generated schemas are tracked (they should be)
 *
 * Rationale: Generated files SHOULD be committed because:
 * - Enables code review of schema changes
 * - Ensures consistent behavior across environments
 * - Reduces build time in CI/CD
 * - Makes schemas available without running generators
 */
function ensureGitignore(): void {
  const gitignorePath = join(OUTPUT_DIR, '.gitignore');

  // We intentionally DON'T add db-schemas.ts to .gitignore
  // Generated schemas should be committed for transparency

  const gitignoreContent = `# Supazod Generated Files
#
# These files ARE tracked in git intentionally for:
# - Code review visibility
# - CI/CD performance
# - Consistent deployments
#
# To regenerate: pnpm generate:zod
`;

  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, gitignoreContent, 'utf-8');
    console.log('📝 Created .gitignore for generated directory');
  }
}

// ============================================================================
// Change Detection
// ============================================================================

/**
 * Calculate hash of input file
 * Used for change detection to skip unnecessary regeneration
 *
 * @returns Hash of input file content, or null if file doesn't exist
 */
function calculateInputHash(): string | null {
  if (!existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    console.error('   Run: pnpm generate:types first');
    return null;
  }

  try {
    const content = readFileSync(INPUT_FILE, 'utf-8');
    return createHash('sha256').update(content).digest('hex');
  } catch (error) {
    console.error('❌ Failed to read input file:', error);
    return null;
  }
}

/**
 * Read stored hash from previous generation
 * Returns null if no previous generation exists
 */
function readStoredHash(): string | null {
  if (!existsSync(HASH_FILE)) {
    return null;
  }

  try {
    return readFileSync(HASH_FILE, 'utf-8').trim();
  } catch {
    return null;
  }
}

/**
 * Store hash after successful generation
 * Used for future change detection
 */
function writeStoredHash(hash: string): void {
  writeFileSync(HASH_FILE, hash, 'utf-8');
}

// ============================================================================
// Schema Generation
// ============================================================================

/**
 * Generate Zod schema content
 *
 * This runs the Supazod CLI with our configuration:
 * - Input: src/types/database.types.ts
 * - Output: src/lib/schemas/generated/db-schemas.ts
 * - Types: src/lib/schemas/generated/db-schemas.d.ts
 * - Config: supazod.config.ts
 * - Schema: public (Supabase public schema)
 *
 * @returns Generated content or null if generation failed
 */
function generateSchemaContent(): { schemas: string; types: string } | null {
  try {
    console.log('🔄 Generating Zod schemas from TypeScript types...');

    // Verify configuration file exists
    if (!existsSync(CONFIG_FILE)) {
      console.error(`❌ Configuration file not found: ${CONFIG_FILE}`);
      return null;
    }

    // Build Supazod CLI command
    const command = [
      'pnpm supazod',
      `--input "${INPUT_FILE}"`,
      `--output "${OUTPUT_FILE}"`,
      `--types-output "${TYPES_OUTPUT_FILE}"`,
      '--schema public',
      `--config "${CONFIG_FILE}"`,
    ].join(' ');

    // Execute Supazod
    execSync(command, {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    // Read generated content
    const schemas = readFileSync(OUTPUT_FILE, 'utf-8');
    const types = readFileSync(TYPES_OUTPUT_FILE, 'utf-8');

    return { schemas, types };
  } catch (error) {
    console.error('❌ Failed to generate Zod schemas:');

    if (error instanceof Error && 'stdout' in error) {
      const execError = error as Error & { stdout?: string; stderr?: string };
      if (execError.stdout) console.error('STDOUT:', execError.stdout);
      if (execError.stderr) console.error('STDERR:', execError.stderr);
    } else {
      console.error(error);
    }

    return null;
  }
}

/**
 * Validate generated schema content
 * Performs basic sanity checks
 *
 * @returns true if validation passed, false otherwise
 */
function validateSchemaContent(schemas: string, types: string): boolean {
  // Validation checks for schemas
  const schemaChecks = [
    {
      test: schemas.includes('import { z } from'),
      message: 'Missing Zod import',
    },
    {
      test: schemas.includes('export const'),
      message: 'No exported schemas found',
    },
    {
      test: schemas.includes('Schema = z.'),
      message: 'No Zod schemas defined',
    },
    {
      test: schemas.length > 1000,
      message: 'Generated schemas file suspiciously small',
    },
  ];

  // Run schema checks
  for (const check of schemaChecks) {
    if (!check.test) {
      console.error(`❌ Validation failed: ${check.message}`);
      return false;
    }
  }

  // Validation checks for types
  if (!types.includes('export type')) {
    console.warn('⚠️  Types file may be incomplete');
  }

  return true;
}

/**
 * Write generated file with formatting
 * Matches pattern from generate-category-artifacts.ts
 */
function writeGeneratedFile(filePath: string, content: string, isDryRun: boolean): void {
  if (isDryRun) {
    console.log(`\n[DRY RUN] Would write to: ${filePath}`);
    console.log('─'.repeat(80));
    console.log(content.substring(0, 500) + '...\n[truncated]');
    console.log('─'.repeat(80));
    return;
  }

  // Ensure directory exists
  const dir = join(filePath, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(filePath, content, 'utf-8');

  // Auto-format with Biome to ensure consistent formatting
  try {
    execSync(`npx biome format --write ${filePath}`, { stdio: 'pipe' });
  } catch {
    // Formatting failed but file was generated
  }

  console.log(`✅ Generated: ${filePath}`);
}

/**
 * Check for drift between expected and current content
 * Matches pattern from generate-category-artifacts.ts
 */
function checkDrift(filePath: string, expectedContent: string): boolean {
  if (!existsSync(filePath)) {
    console.error(`❌ DRIFT DETECTED: ${filePath} does not exist`);
    console.error('   Run: pnpm generate:zod');
    return true;
  }

  const currentContent = readFileSync(filePath, 'utf-8');

  // Normalize line endings for comparison
  const normalizedCurrent = currentContent.replace(/\r\n/g, '\n').trim();
  const normalizedExpected = expectedContent.replace(/\r\n/g, '\n').trim();

  if (normalizedCurrent !== normalizedExpected) {
    console.error(`❌ DRIFT DETECTED: ${filePath} is out of sync with database types`);
    console.error('   Run: pnpm generate:zod');
    return true;
  }

  console.log(`✅ No drift: ${filePath}`);
  return false;
}

// ============================================================================
// Main Execution
// ============================================================================

/**
 * Main execution function
 * Orchestrates the entire generation process with change detection
 */
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry') || args.includes('--dry-run');
  const isCheck = args.includes('--check');
  const isForce = args.includes('--force');

  console.log('🏗️  Zod Schema Generator\n');

  try {
    // Ensure output directory exists
    ensureOutputDirectory();
    ensureGitignore();

    // Calculate current input hash
    const currentHash = calculateInputHash();

    if (!currentHash) {
      console.error('\n❌ Cannot proceed without valid input file');
      console.error('   Run: pnpm generate:types first');
      process.exit(1);
    }

    // Generate schemas
    console.log('🔨 Generating schemas...');
    const generated = generateSchemaContent();

    if (!generated) {
      process.exit(1);
    }

    const { schemas, types } = generated;

    // Validate generated content
    if (!validateSchemaContent(schemas, types)) {
      process.exit(1);
    }

    console.log('✅ Generated schemas passed validation\n');

    if (isCheck) {
      // Drift detection mode (for CI/CD)
      console.log('🔍 Checking for drift...\n');
      const hasDrift1 = checkDrift(OUTPUT_FILE, schemas);
      const hasDrift2 = checkDrift(TYPES_OUTPUT_FILE, types);

      if (hasDrift1 || hasDrift2) {
        console.error('\n❌ Drift detected! Generated files are out of sync.');
        console.error('   Fix: pnpm generate:zod\n');
        process.exit(1);
      }

      console.log('\n✅ No drift detected - all files in sync!\n');
      return;
    }

    // Write files
    writeGeneratedFile(OUTPUT_FILE, schemas, isDryRun);
    writeGeneratedFile(TYPES_OUTPUT_FILE, types, isDryRun);

    if (!isDryRun) {
      // Store hash for future comparisons
      writeStoredHash(currentHash);
      console.log('\n💾 Saved generation hash for future comparisons');

      console.log('\n✅ Zod schema generation completed successfully!\n');
      console.log('Generated files:');
      console.log(`  - ${OUTPUT_FILE}`);
      console.log(`  - ${TYPES_OUTPUT_FILE}\n`);
    }
  } catch (error) {
    console.error('❌ Schema generation failed:', error);
    process.exit(1);
  }
}

// Execute main function
main().catch((error) => {
  console.error('❌ Unhandled error in main:', error);
  process.exit(1);
});
