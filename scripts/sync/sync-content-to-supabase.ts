#!/usr/bin/env tsx
/**
 * Supabase Content Sync Script
 *
 * Syncs content from /content/*.json files to Supabase content_items table.
 * Uses SHA256 hashing for incremental sync (only update changed files).
 *
 * Architecture:
 * - Hash-based change detection (compare git_hash column)
 * - Batch upserts for performance (50 items per batch)
 * - Atomic transactions with rollback on error
 * - Comprehensive validation and reporting
 * - Idempotent (safe to run multiple times)
 *
 * Performance:
 * - First sync: ~275 files = ~6 upserts (Supabase limit: 10K/day)
 * - Incremental: Only changed files = 1-10 upserts typically
 * - Parallel file reading with batched database writes
 *
 * Usage:
 *   pnpm sync:content              # Sync all content
 *   pnpm sync:content --dry-run    # Preview changes without syncing
 *   pnpm sync:content --force      # Force re-sync all files (ignore hashes)
 *
 * @see supabase/migrations/20251027000000_create_content_items_table.sql
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAllChangelogEntries as parseAllEntries } from '../../src/lib/changelog/parser.js';

// ============================================
// CONFIGURATION
// ============================================

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '../..');
const CONTENT_DIR = join(ROOT_DIR, 'content');
const ENV_LOCAL = join(ROOT_DIR, '.env.local');

const BATCH_SIZE = 50; // Supabase recommended batch size

// Parse CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

// Valid categories (from UNIFIED_CATEGORY_REGISTRY)
const VALID_CATEGORIES = [
  'agents',
  'mcp',
  'commands',
  'rules',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
  'jobs',
  'changelog',
] as const;

type CategoryId = (typeof VALID_CATEGORIES)[number];

// ============================================
// TYPES
// ============================================

type ContentItemRow = Database['public']['Tables']['content_items']['Insert'];

interface SyncStats {
  readonly scanned: number;
  readonly unchanged: number;
  readonly inserted: number;
  readonly updated: number;
  readonly deleted: number;
  readonly errors: number;
  readonly startTime: number;
}

interface FileInfo {
  readonly category: CategoryId;
  readonly slug: string;
  readonly path: string;
  readonly hash: string;
  readonly data: Record<string, unknown>;
}

// ============================================
// SUPABASE CLIENT
// ============================================

function getDatabaseUrl(): string | null {
  // Try environment variable first
  let dbUrl = process.env.POSTGRES_URL_NON_POOLING;

  // If not in env, pull from Vercel (same as generate:types script)
  if (!dbUrl) {
    console.log('📥 Pulling environment variables from Vercel...');
    try {
      execSync('vercel env pull .env.local --yes', {
        cwd: ROOT_DIR,
        stdio: 'inherit',
      });

      if (!existsSync(ENV_LOCAL)) {
        console.error('❌ Failed to pull environment variables from Vercel');
        return null;
      }

      const envContent = readFileSync(ENV_LOCAL, 'utf-8');
      const match = envContent.match(/POSTGRES_URL_NON_POOLING=(.+)/);

      if (match) dbUrl = match[1].trim().replace(/^["']|["']$/g, '');
    } catch (error) {
      console.error('❌ Failed to pull credentials from Vercel:', error);
      return null;
    }
  }

  if (!dbUrl) {
    console.error('❌ Missing database URL');
    console.error('Required environment variable: POSTGRES_URL_NON_POOLING');
    return null;
  }

  return dbUrl;
}

/**
 * Execute SQL query using psql (bypasses RLS, uses direct postgres connection)
 */
function executeSql(dbUrl: string, sql: string): string {
  try {
    return execSync(`psql "${dbUrl}" -c "${sql.replace(/"/g, '\\"')}" -t -A`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error) {
    throw new Error(`SQL execution failed: ${error}`);
  }
}

// ============================================
// HASH UTILITIES
// ============================================

/**
 * Calculate SHA256 hash of JSON content
 * Used for change detection (compare with database git_hash)
 */
function hashContent(data: Record<string, unknown>): string {
  const jsonString = JSON.stringify(data, Object.keys(data).sort());
  return createHash('sha256').update(jsonString, 'utf8').digest('hex');
}

// ============================================
// FILE SCANNING
// ============================================

/**
 * Scan all content files and calculate hashes
 * Validates category exists and JSON is parseable
 *
 * Special handling:
 * - Filters out template files (*-template.json)
 * - Changelog: Parses from CHANGELOG.md instead of JSON files
 * - Jobs: Empty directory (no files yet)
 */
async function scanContentFiles(): Promise<FileInfo[]> {
  const files: FileInfo[] = [];

  // Process regular JSON-based categories (exclude changelog)
  const jsonCategories = VALID_CATEGORIES.filter((cat) => cat !== 'changelog');

  for (const category of jsonCategories) {
    const categoryDir = join(CONTENT_DIR, category);

    try {
      // Special handling for guides: has subdirectories (tutorials, comparisons, etc)
      if (category === 'guides') {
        const subdirs = await readdir(categoryDir, { withFileTypes: true });
        let guideCount = 0;

        for (const dirent of subdirs) {
          if (!dirent.isDirectory()) continue;

          const subdirPath = join(categoryDir, dirent.name);
          const subfiles = await readdir(subdirPath);
          const jsonFiles = subfiles.filter((f) => f.endsWith('.json') && !f.includes('template'));

          for (const filename of jsonFiles) {
            const slug = filename.replace(/\.json$/, '');
            const path = join(subdirPath, filename);

            try {
              const content = await readFile(path, 'utf-8');
              const data = JSON.parse(content) as Record<string, unknown>;
              const hash = hashContent(data);

              files.push({ category, slug, path, hash, data });
              guideCount++;
            } catch (error) {
              console.error(`Failed to parse ${category}/${dirent.name}/${filename}:`, error);
            }
          }
        }

        console.log(`📂 ${category}: ${guideCount} files`);
      } else {
        // Regular categories: flat structure
        const filenames = await readdir(categoryDir);

        // Filter: only .json files, exclude templates
        const jsonFiles = filenames.filter((f) => f.endsWith('.json') && !f.includes('template'));

        for (const filename of jsonFiles) {
          const slug = filename.replace(/\.json$/, '');
          const path = join(categoryDir, filename);

          try {
            const content = await readFile(path, 'utf-8');
            const data = JSON.parse(content) as Record<string, unknown>;
            const hash = hashContent(data);

            files.push({ category, slug, path, hash, data });
          } catch (error) {
            console.error(`Failed to parse ${category}/${filename}:`, error);
          }
        }

        console.log(`📂 ${category}: ${jsonFiles.length} files`);
      }
    } catch (error) {
      // Category directory might not exist (e.g., no jobs yet)
      console.warn(`Skipping missing category directory: ${category}`);
    }
  }

  // Special handling for changelog - parse from CHANGELOG.md
  try {
    console.log('📋 Parsing changelog from CHANGELOG.md...');
    const changelogPath = join(ROOT_DIR, 'CHANGELOG.md');
    const changelogContent = await readFile(changelogPath, 'utf-8');
    const changelogEntries = await parseAllEntries();

    // Store each changelog entry as a separate database row
    for (const entry of changelogEntries) {
      const hash = hashContent(entry);
      files.push({
        category: 'changelog',
        slug: entry.slug,
        path: changelogPath,
        hash,
        data: entry as unknown as Record<string, unknown>,
      });
    }

    console.log(`📂 changelog: ${changelogEntries.length} entries`);
  } catch (error) {
    console.error('Failed to parse CHANGELOG.md:', error);
  }

  return files;
}

// ============================================
// DATABASE SYNC
// ============================================

/**
 * Get existing content hashes from database using direct psql query
 * Returns Map<"category:slug", hash> for fast lookup
 */
function getExistingHashes(dbUrl: string): Map<string, string> {
  const sql = 'SELECT category, slug, git_hash FROM public.content_items';

  try {
    const result = executeSql(dbUrl, sql);
    const hashMap = new Map<string, string>();

    // Parse psql output (pipe-delimited by -A flag)
    const lines = result.trim().split('\n');
    for (const line of lines) {
      if (!line) continue;
      const [category, slug, gitHash] = line.split('|');
      if (category && slug && gitHash) {
        hashMap.set(`${category}:${slug}`, gitHash);
      }
    }

    return hashMap;
  } catch (error) {
    // Table might be empty on first run
    console.warn('Could not fetch existing hashes (table may be empty)');
    return new Map();
  }
}

/**
 * Upsert content items to database in batches using psql
 * Uses (category, slug) unique constraint for conflict resolution
 *
 * Uses temp file approach to avoid shell escaping issues with JSON data
 */
function upsertContentBatch(dbUrl: string, items: ContentItemRow[]): void {
  // Build INSERT ... ON CONFLICT UPDATE query
  const values = items
    .map((item) => {
      // Escape single quotes for SQL ('' is the SQL escape for ')
      // Do NOT escape backslashes - JSON already has them escaped
      const dataJson = JSON.stringify(item.data).replace(/'/g, "''");
      return `('${item.category}', '${item.slug}', '${dataJson}', '${item.git_hash}', '${item.synced_at}')`;
    })
    .join(',\n  ');

  const sql = `
BEGIN;
INSERT INTO public.content_items (category, slug, data, git_hash, synced_at)
VALUES ${values}
ON CONFLICT (category, slug)
DO UPDATE SET
  data = EXCLUDED.data,
  git_hash = EXCLUDED.git_hash,
  synced_at = EXCLUDED.synced_at;
COMMIT;
  `;

  // Write SQL to temp file to avoid shell escaping issues
  const tempFile = join(tmpdir(), `supabase-sync-${Date.now()}.sql`);

  try {
    writeFileSync(tempFile, sql, 'utf-8');

    // Execute SQL file using psql -f with error stopping enabled
    // -v ON_ERROR_STOP=1: Exit immediately if any command fails
    const result = execSync(`psql "${dbUrl}" -v ON_ERROR_STOP=1 -f "${tempFile}"`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    if (result) {
      console.log('psql output:', result);
    }

    // Clean up temp file
    unlinkSync(tempFile);
  } catch (error) {
    // Clean up temp file on error
    if (existsSync(tempFile)) {
      unlinkSync(tempFile);
    }

    // Show the actual error from psql
    if (error instanceof Error && 'stderr' in error) {
      console.error('psql stderr:', (error as any).stderr?.toString());
      console.error('psql stdout:', (error as any).stdout?.toString());
    }

    throw new Error(`Batch upsert failed: ${error}`);
  }
}

/**
 * Delete content items that no longer exist in Git using psql
 * Removes orphaned database rows
 */
function deleteOrphanedContent(
  dbUrl: string,
  existingKeys: Set<string>,
  fileKeys: Set<string>
): number {
  const toDelete = Array.from(existingKeys).filter((key) => !fileKeys.has(key));

  if (toDelete.length === 0) return 0;

  let deletedCount = 0;
  for (const key of toDelete) {
    const [category, slug] = key.split(':');
    const sql = `DELETE FROM public.content_items WHERE category = '${category}' AND slug = '${slug}'`;

    try {
      executeSql(dbUrl, sql);
      deletedCount++;
      console.log(`Deleted orphaned content: ${key}`);
    } catch (error) {
      console.error(`Failed to delete ${key}:`, error);
    }
  }

  return deletedCount;
}

// ============================================
// CLEANUP
// ============================================

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

// ============================================
// MAIN SYNC LOGIC
// ============================================

async function syncContent() {
  const stats: SyncStats = {
    scanned: 0,
    unchanged: 0,
    inserted: 0,
    updated: 0,
    deleted: 0,
    errors: 0,
    startTime: Date.now(),
  };

  console.info('🔄 Starting Supabase content sync...');
  if (isDryRun) console.info('🔍 DRY RUN MODE - No changes will be made');
  if (isForce) console.info('🔨 FORCE MODE - Ignoring hash check');

  // Scan files
  console.info('📂 Scanning content files...');
  const files = await scanContentFiles();
  stats.scanned = files.length;
  console.info(`Found ${files.length} content files`);

  if (files.length === 0) {
    console.warn('No content files found. Exiting.');
    return;
  }

  // Get database connection
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    cleanup();
    process.exit(1);
  }

  // Get existing hashes
  console.log('🔍 Fetching existing content hashes...');
  const existingHashes = getExistingHashes(dbUrl);
  console.log(`Found ${existingHashes.size} existing items in database`);

  // Determine what needs syncing
  const toSync: FileInfo[] = [];
  const fileKeys = new Set<string>();

  for (const file of files) {
    const key = `${file.category}:${file.slug}`;
    fileKeys.add(key);

    const existingHash = existingHashes.get(key);

    if (isForce || !existingHash) {
      // Force mode or new file
      toSync.push(file);
      if (!existingHash) {
        console.info(`➕ New: ${key}`);
      }
    } else if (existingHash !== file.hash) {
      // Hash changed
      toSync.push(file);
      console.info(`🔄 Changed: ${key}`);
    } else {
      // Unchanged
      stats.unchanged++;
    }
  }

  console.info(`Sync plan: ${toSync.length} to sync, ${stats.unchanged} unchanged`);

  // Delete orphaned content
  if (!isDryRun) {
    console.log('🗑️  Checking for orphaned content...');
    const existingKeys = new Set(existingHashes.keys());
    stats.deleted = deleteOrphanedContent(dbUrl, existingKeys, fileKeys);
    if (stats.deleted > 0) {
      console.log(`Deleted ${stats.deleted} orphaned items`);
    }
  }

  // Batch sync
  if (toSync.length > 0 && !isDryRun) {
    console.log(`📤 Syncing ${toSync.length} items in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < toSync.length; i += BATCH_SIZE) {
      const batch = toSync.slice(i, i + BATCH_SIZE);
      const items: ContentItemRow[] = batch.map((file) => ({
        category: file.category,
        slug: file.slug,
        data: file.data as never, // JSONB type
        git_hash: file.hash,
        synced_at: new Date().toISOString(),
      }));

      try {
        upsertContentBatch(dbUrl, items);

        // Count inserts vs updates
        for (const file of batch) {
          const key = `${file.category}:${file.slug}`;
          if (existingHashes.has(key)) {
            stats.updated++;
          } else {
            stats.inserted++;
          }
        }

        console.info(
          `✅ Synced batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toSync.length / BATCH_SIZE)}`
        );
      } catch (error) {
        console.error('❌ Batch sync failed:', error);
        stats.errors += batch.length;
      }
    }
  }

  // Report
  const duration = Date.now() - stats.startTime;
  console.info('\n📊 Sync Summary:');
  console.info(`   Scanned:   ${stats.scanned} files`);
  console.info(`   Unchanged: ${stats.unchanged}`);
  console.info(`   Inserted:  ${stats.inserted}`);
  console.info(`   Updated:   ${stats.updated}`);
  console.info(`   Deleted:   ${stats.deleted}`);
  console.info(`   Errors:    ${stats.errors}`);
  console.info(`   Duration:  ${(duration / 1000).toFixed(2)}s`);

  if (isDryRun) {
    console.info('\n🔍 DRY RUN - No changes were made');
  } else {
    console.info('\n✅ Sync complete!');
  }

  if (stats.errors > 0) {
    console.error('\n⚠️  Some items failed to sync. Check logs above.');
    cleanup();
    process.exit(1);
  }

  cleanup();
}

// ============================================
// ENTRY POINT
// ============================================

syncContent().catch((error) => {
  console.error('Fatal sync error:', error);
  cleanup();
  process.exit(1);
});
