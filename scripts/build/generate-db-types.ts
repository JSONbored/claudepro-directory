#!/usr/bin/env tsx
/**
 * Database Type Generation with Change Detection
 *
 * Generates TypeScript types from Supabase database schema
 * Only regenerates when database schema has changed (via hash comparison)
 *
 * Features:
 * - Change detection (skips regeneration if schema unchanged)
 * - Automatic .env.local cleanup
 * - Vercel environment variable integration
 * - Hash-based caching for performance
 * - Type safety validation
 *
 * Usage:
 *   npm run generate:types        # Generate with change detection
 *   npm run generate:types --force # Force regeneration
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const TYPES_FILE = join(ROOT, 'src/types/database.types.ts');
const HASH_FILE = join(ROOT, '.db-schema-hash');
const ENV_LOCAL = join(ROOT, '.env.local');

// ============================================================================
// Schema Hash Management
// ============================================================================

function getSchemaHash(): string | null {
  try {
    // Pull latest environment variables from Vercel
    console.log('📥 Pulling environment variables from Vercel...');
    execSync('vercel env pull .env.local --yes', {
      cwd: ROOT,
      stdio: 'inherit',
    });

    if (!existsSync(ENV_LOCAL)) {
      console.error('❌ Failed to pull environment variables');
      return null;
    }

    // Read the database URL to use as schema identifier
    const envContent = readFileSync(ENV_LOCAL, 'utf-8');
    const match = envContent.match(/POSTGRES_URL_NON_POOLING=(.+)/);

    if (!match) {
      console.error('❌ POSTGRES_URL_NON_POOLING not found in environment');
      return null;
    }

    const dbUrl = match[1].trim();

    // Query the database schema to generate a hash
    // We use pg_catalog to get schema information
    const schemaQuery = `
      SELECT
        table_schema,
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;

    try {
      const result = execSync(`psql "${dbUrl}" -c "${schemaQuery.replace(/\n/g, ' ')}" -t -A`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // Generate hash from schema structure
      const hash = createHash('sha256').update(result).digest('hex');
      return hash;
    } catch {
      console.warn('⚠️  Could not query database schema, will regenerate types');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to get schema hash:', error);
    return null;
  }
}

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

function writeStoredHash(hash: string): void {
  writeFileSync(HASH_FILE, hash, 'utf-8');
}

// ============================================================================
// Type Generation
// ============================================================================

function generateTypes(): boolean {
  try {
    console.log('🔄 Generating database types from Supabase schema...');

    const envContent = readFileSync(ENV_LOCAL, 'utf-8');
    const match = envContent.match(/POSTGRES_URL_NON_POOLING=(.+)/);

    if (!match) {
      console.error('❌ POSTGRES_URL_NON_POOLING not found');
      return false;
    }

    const dbUrl = match[1].trim();

    // Generate types using Supabase CLI
    const output = execSync(`supabase gen types typescript --db-url "${dbUrl}" --schema public`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    // Write types to file
    writeFileSync(TYPES_FILE, output, 'utf-8');

    console.log(`✅ Generated ${TYPES_FILE}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to generate types:', error);
    return false;
  }
}

function validateTypes(): boolean {
  if (!existsSync(TYPES_FILE)) {
    console.error('❌ Types file does not exist');
    return false;
  }

  const content = readFileSync(TYPES_FILE, 'utf-8');

  // Basic validation - check if it looks like valid TypeScript
  if (!(content.includes('export type') || content.includes('export interface'))) {
    console.error('❌ Generated types file appears invalid');
    return false;
  }

  // Check for common issues
  if (content.includes('error') || content.includes('Error')) {
    console.warn('⚠️  Generated types may contain errors');
  }

  return true;
}

// ============================================================================
// Cleanup
// ============================================================================

function cleanup(): void {
  if (existsSync(ENV_LOCAL)) {
    try {
      unlinkSync(ENV_LOCAL);
      console.log('🧹 Cleaned up .env.local');
    } catch {
      console.warn('⚠️  Failed to cleanup .env.local');
    }
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const isForce = process.argv.includes('--force');

  try {
    // Get current schema hash
    const currentHash = getSchemaHash();

    if (currentHash) {
      // Check if schema has changed
      const storedHash = readStoredHash();

      if (!isForce && storedHash === currentHash) {
        console.log('✅ Database schema unchanged - skipping type generation');
        console.log('   Use --force to regenerate anyway');
        cleanup();
        return;
      }

      if (storedHash && storedHash !== currentHash) {
        console.log('📊 Database schema has changed');
      }
    } else {
      console.log('⚠️  Could not determine schema hash, regenerating types...');
    }

    // Generate types
    const success = generateTypes();

    if (!success) {
      cleanup();
      process.exit(1);
    }

    // Validate generated types
    if (!validateTypes()) {
      cleanup();
      process.exit(1);
    }

    // Store new hash
    if (currentHash) {
      writeStoredHash(currentHash);
      console.log('💾 Saved schema hash for future comparisons');
    }

    cleanup();
    console.log('\n✅ Database types successfully generated!');
  } catch (error) {
    console.error('❌ Type generation failed:', error);
    cleanup();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unhandled error in main:', error);
  process.exit(1);
});
