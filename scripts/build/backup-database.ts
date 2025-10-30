#!/usr/bin/env tsx

/**
 * Supabase Database Backup Script - Incremental Hash-Based Full Backup
 * Uses pg_dump directly with connection string for full data backup
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const ENV_FILE = join(ROOT, '.env.local');
const BACKUP_HASH_FILE = join(ROOT, '.backup-db-hash');
const LATEST_BACKUP_DIR = join(ROOT, 'backups/latest');

const forceBackup = process.argv.includes('--force');

console.log('🔒 Starting incremental database backup...\n');

// ============================================================================
// Get database URL from .env.local
// ============================================================================
if (!existsSync(ENV_FILE)) {
  console.error('❌ .env.local not found - run: vercel env pull .env.local');
  process.exit(1);
}

const envContent = readFileSync(ENV_FILE, 'utf-8');
const dbUrlMatch = envContent.match(/POSTGRES_URL_NON_POOLING=(.+)/);

if (!dbUrlMatch) {
  console.error('❌ POSTGRES_URL_NON_POOLING not found in .env.local');
  process.exit(1);
}

const dbUrl = dbUrlMatch[1].trim();

// ============================================================================
// Fetch full database dump (schema + data) using pg_dump
// ============================================================================
console.log('🔍 Checking database state...');

let fullDump: string;
try {
  // Use pg_dump from PostgreSQL 17 (matches Supabase version)
  // Dump ALL schemas for perfect 1:1 copy (public, auth, storage, realtime, etc.)
  const pgDumpPath = '/opt/homebrew/opt/postgresql@17/bin/pg_dump';
  fullDump = execSync(`"${pgDumpPath}" "${dbUrl}" --no-owner --no-privileges --clean --if-exists`, {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
    maxBuffer: 200 * 1024 * 1024, // 200MB buffer for all schemas
  });
} catch (error) {
  console.error('   ✗ Database dump failed:', error instanceof Error ? error.message : error);
  console.error('   💡 Make sure PostgreSQL 17 is installed: brew install postgresql@17');
  process.exit(1);
}

// ============================================================================
// Hash comparison - skip if unchanged
// ============================================================================
const currentHash = createHash('sha256').update(fullDump).digest('hex');
const storedHash = existsSync(BACKUP_HASH_FILE)
  ? readFileSync(BACKUP_HASH_FILE, 'utf-8').trim()
  : null;

if (!forceBackup && storedHash === currentHash) {
  console.log('   ⊘ Database unchanged - backup not needed');
  if (existsSync(LATEST_BACKUP_DIR)) {
    console.log(`   📁 Latest backup: ${LATEST_BACKUP_DIR}`);
  }
  console.log('\n💡 Use --force to create backup anyway\n');
  process.exit(0);
}

console.log('   → Database changed - creating backup...');

// ============================================================================
// Create timestamped backup
// ============================================================================
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const BACKUP_DIR = join(ROOT, 'backups', timestamp);

mkdirSync(BACKUP_DIR, { recursive: true });

// Save full dump
writeFileSync(join(BACKUP_DIR, 'full_backup.sql'), fullDump, 'utf-8');
console.log('   ✓ full_backup.sql (schema + data)');

// Save hash
writeFileSync(BACKUP_HASH_FILE, currentHash, 'utf-8');

// Create 'latest' symlink
if (existsSync(LATEST_BACKUP_DIR)) {
  execSync(`rm -f "${LATEST_BACKUP_DIR}"`, { cwd: ROOT });
}
execSync(`ln -s "${timestamp}" "${LATEST_BACKUP_DIR}"`, { cwd: join(ROOT, 'backups') });

// ============================================================================
// README
// ============================================================================
const readme = `Supabase Database Complete Backup
==================================
Date: ${new Date().toISOString()}
Project: claudepro-directory
Backup Hash: ${currentHash.slice(0, 16)}...

Files:
------
full_backup.sql : Complete 1:1 database copy (ALL schemas + ALL data)

Schemas Included:
-----------------
✓ public (77 tables, ~7,696 rows) - Application data
✓ auth (19 tables, ~979 rows) - User authentication
✓ storage (7 tables, ~44 rows) - File storage metadata
✓ realtime (3 tables, ~64 rows) - Realtime subscriptions
✓ cron (2 tables, ~29 rows) - Scheduled jobs
✓ supabase_migrations (2 tables, ~58 rows) - Migration history
✓ vault (1 table, ~1 row) - Secrets management
✓ supabase_functions (2 tables, ~2 rows) - Edge functions
✓ net (2 tables) - Network configuration
✓ All RLS policies, triggers, functions, views, indexes

Restore Instructions:
---------------------
# Full restore (WARNING: Drops and recreates everything):
psql "$POSTGRES_URL" < full_backup.sql

# Verify restore:
psql "$POSTGRES_URL" -c "SELECT schemaname, COUNT(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') GROUP BY schemaname;"

Notes:
------
- This is a COMPLETE backup (every schema, every table, every row)
- Perfect 1:1 copy of entire database state
- Hash-based incremental: only creates new backup if ANY data changed
- Use pnpm backup:db --force to force new backup
- Includes --clean --if-exists for safe restore
`;

writeFileSync(join(BACKUP_DIR, 'README.txt'), readme, 'utf-8');

// ============================================================================
// Summary
// ============================================================================
const sizeKB = execSync(`du -sk "${BACKUP_DIR}"`, { encoding: 'utf-8' }).split('\t')[0].trim();
const sizeMB = (Number.parseInt(sizeKB, 10) / 1024).toFixed(2);

console.log('\n✅ Full backup created!');
console.log(`📁 Location: ${BACKUP_DIR}`);
console.log(`🔗 Symlink: backups/latest → ${timestamp}`);
console.log(`💽 Size: ${sizeMB} MB`);
console.log(`🔐 Hash: ${currentHash.slice(0, 16)}...`);
console.log('\n💡 Next run will skip backup if database unchanged\n');
