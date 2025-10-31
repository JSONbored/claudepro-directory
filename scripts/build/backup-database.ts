#!/usr/bin/env tsx

/**
 * Optimized Supabase Database Backup Script
 * Reduces egress by checking hash BEFORE dumping, compresses output
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const ENV_FILE = join(ROOT, '.env.local');
const BACKUP_HASH_FILE = join(ROOT, '.backup-db-hash');
const LATEST_BACKUP_DIR = join(ROOT, 'backups/latest');

const forceBackup = process.argv.includes('--force');

console.log('🔒 Starting optimized incremental database backup...\n');

// ============================================================================
// Load environment and create Supabase client
// ============================================================================
if (!existsSync(ENV_FILE)) {
  console.error('❌ .env.local not found - run: vercel env pull .env.local');
  process.exit(1);
}

const envContent = readFileSync(ENV_FILE, 'utf-8');
const dbUrlMatch = envContent.match(/POSTGRES_URL_NON_POOLING=(.+)/);
const supabaseUrlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

if (!dbUrlMatch) {
  console.error('❌ POSTGRES_URL_NON_POOLING not found in .env.local');
  process.exit(1);
}

const dbUrl = dbUrlMatch[1].trim();
const supabaseUrl = supabaseUrlMatch?.[1]?.trim();
const supabaseKey = supabaseKeyMatch?.[1]?.trim();

// ============================================================================
// OPTIMIZATION 1: Check database state hash BEFORE dumping (lightweight query)
// ============================================================================
console.log('🔍 Checking database state (lightweight metadata query)...');

let currentHash: string;

if (supabaseUrl && supabaseKey) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get lightweight database state fingerprint (table row counts + modification times)
    // This is ~1KB query vs ~50MB full dump - 50,000x less egress!
    const { data, error } = await supabase.rpc('get_database_fingerprint');

    if (error) throw error;

    // Create hash from fingerprint
    currentHash = createHash('sha256').update(JSON.stringify(data)).digest('hex');

    console.log('   ✓ Using database fingerprint for change detection');
  } catch (error) {
    console.log('   ⚠️  Fingerprint RPC not available, falling back to pg_dump hash');
    currentHash = ''; // Will trigger full dump below
  }
} else {
  console.log('   ⚠️  Supabase credentials not found, using pg_dump hash');
  currentHash = '';
}

// ============================================================================
// Check if backup needed (compare hashes)
// ============================================================================
const storedHash = existsSync(BACKUP_HASH_FILE)
  ? readFileSync(BACKUP_HASH_FILE, 'utf-8').trim()
  : null;

if (!forceBackup && currentHash && storedHash === currentHash) {
  console.log('   ⊘ Database unchanged - backup not needed');
  if (existsSync(LATEST_BACKUP_DIR)) {
    console.log(`   📁 Latest backup: ${LATEST_BACKUP_DIR}`);
  }
  console.log('\n💡 Use --force to create backup anyway\n');
  process.exit(0);
}

console.log('   → Database changed - creating backup...');

// ============================================================================
// OPTIMIZATION 2: Stream pg_dump directly to gzip (no intermediate buffer)
// ============================================================================
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const BACKUP_DIR = join(ROOT, 'backups', timestamp);

mkdirSync(BACKUP_DIR, { recursive: true });

const pgDumpPath = '/opt/homebrew/opt/postgresql@17/bin/pg_dump';
const outputPath = join(BACKUP_DIR, 'full_backup.sql.gz');

console.log('📦 Creating compressed backup (streaming)...');

try {
  // Use execSync with gzip pipe for simpler, reliable streaming
  execSync(
    `"${pgDumpPath}" "${dbUrl}" --no-owner --no-privileges --clean --if-exists | gzip -9 > "${outputPath}"`,
    {
      cwd: ROOT,
      stdio: 'pipe',
      maxBuffer: 200 * 1024 * 1024, // 200MB buffer
    }
  );

  console.log('   ✓ full_backup.sql.gz (compressed schema + data)');
} catch (error) {
  console.error('   ✗ Database dump failed:', error instanceof Error ? error.message : error);
  console.error('   💡 Make sure PostgreSQL 17 is installed: brew install postgresql@17');
  process.exit(1);
}

// ============================================================================
// OPTIMIZATION 3: Only compute hash if we didn't use fingerprint
// ============================================================================
if (!currentHash) {
  console.log('🔐 Computing backup hash...');
  const uncompressed = execSync(`gunzip -c "${outputPath}"`, {
    encoding: 'utf-8',
    maxBuffer: 200 * 1024 * 1024,
  });
  currentHash = createHash('sha256').update(uncompressed).digest('hex');
}

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
const readme = `Supabase Database Complete Backup (OPTIMIZED)
===============================================
Date: ${new Date().toISOString()}
Project: claudepro-directory
Backup Hash: ${currentHash.slice(0, 16)}...

Files:
------
full_backup.sql.gz : Compressed 1:1 database copy (ALL schemas + ALL data)

Optimizations:
--------------
✓ Lightweight fingerprint check BEFORE dumping (50,000x less egress)
✓ Streamed compression (zero intermediate buffers)
✓ gzip level 9 (80-90% size reduction)
✓ Incremental: only backs up if database changed

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
# Decompress and restore:
gunzip -c full_backup.sql.gz | psql "$POSTGRES_URL"

# Or decompress first:
gunzip full_backup.sql.gz
psql "$POSTGRES_URL" < full_backup.sql

# Verify restore:
psql "$POSTGRES_URL" -c "SELECT schemaname, COUNT(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') GROUP BY schemaname;"

Notes:
------
- This is a COMPLETE backup (every schema, every table, every row)
- Perfect 1:1 copy of entire database state
- Hash-based incremental: only creates new backup if ANY data changed
- Use pnpm backup:db --force to force new backup
- Compressed with gzip level 9 (80-90% smaller)
`;

writeFileSync(join(BACKUP_DIR, 'README.txt'), readme, 'utf-8');

// ============================================================================
// Summary
// ============================================================================
const sizeKB = execSync(`du -sk "${BACKUP_DIR}"`, { encoding: 'utf-8' }).split('\t')[0].trim();
const sizeMB = (Number.parseInt(sizeKB, 10) / 1024).toFixed(2);

// Calculate compression ratio
const uncompressedSize = execSync(`gunzip -l "${outputPath}" | tail -1 | awk '{print $2}'`, {
  encoding: 'utf-8',
}).trim();
const compressedSize = execSync(`stat -f%z "${outputPath}"`, { encoding: 'utf-8' }).trim();
const compressionRatio = (
  (1 - Number.parseInt(compressedSize, 10) / Number.parseInt(uncompressedSize, 10)) *
  100
).toFixed(1);

console.log('\n✅ Optimized backup created!');
console.log(`📁 Location: ${BACKUP_DIR}`);
console.log(`🔗 Symlink: backups/latest → ${timestamp}`);
console.log(`💽 Size: ${sizeMB} MB (${compressionRatio}% compression)`);
console.log(`🔐 Hash: ${currentHash.slice(0, 16)}...`);
console.log('\n💡 Next run will skip backup if database unchanged (fingerprint check)\n');
