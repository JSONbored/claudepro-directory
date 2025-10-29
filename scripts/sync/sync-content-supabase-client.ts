#!/usr/bin/env tsx

/**
 * Supabase Content Sync Script - Category-Specific Tables
 *
 * Syncs content from /content/*.json files AND CHANGELOG.md to category-specific Supabase tables.
 * Works locally and in GitHub Actions (no psql dependency).
 *
 * Features:
 * - Direct insert into typed tables (agents, mcp, rules, commands, changelog_entries, etc.)
 * - Incremental sync via git diff (CHANGED_FILES env var)
 * - Full sync mode (scans all files + CHANGELOG.md)
 * - File deletion handling (DELETED_FILES env var)
 * - Service role bypasses RLS automatically
 * - Cross-platform (works on Windows, macOS, Linux)
 * - Type-safe with Supabase JS client
 *
 * Usage:
 *   pnpm sync:content              # Incremental sync (default)
 *   pnpm sync:content:full         # Full sync (all files + changelog)
 *
 * Environment Variables:
 *   SUPABASE_URL              - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (bypasses RLS)
 *   CHANGED_FILES             - Space-separated file paths (from git diff)
 *   DELETED_FILES             - Space-separated deleted file paths
 *
 * @see .github/workflows/sync-content.yml
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { parseChangelog } from '../../src/lib/changelog/parser.js';

// ============================================
// CONFIGURATION
// ============================================

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '../..');
const CONTENT_DIR = join(ROOT_DIR, 'content');
const ENV_LOCAL = join(ROOT_DIR, '.env.local');

// Valid categories
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
  'changelog', // Parsed from CHANGELOG.md
] as const;

type CategoryId = (typeof VALID_CATEGORIES)[number];

interface FileInfo {
  category: CategoryId;
  slug: string;
  path: string;
  hash: string;
  data: Record<string, unknown>;
}

interface SyncStats {
  scanned: number;
  inserted: number;
  updated: number;
  deleted: number;
  errors: number;
}

// ============================================
// SUPABASE CLIENT
// ============================================

/**
 * Pull environment variables from Vercel if not already set
 * Same approach as generate:types script
 */
function ensureEnvVars(): void {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return; // Already set (GitHub Actions or local .env)
  }

  console.log('📥 Pulling environment variables from Vercel...');
  try {
    execSync('vercel env pull .env.local --yes', {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });

    if (!existsSync(ENV_LOCAL)) {
      throw new Error('Failed to create .env.local from Vercel');
    }

    // Load env vars from .env.local
    const envContent = readFileSync(ENV_LOCAL, 'utf-8');

    const supabaseUrlMatch = envContent.match(/(?:SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL)=(.+)/);
    const serviceKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

    if (supabaseUrlMatch) {
      process.env.SUPABASE_URL = supabaseUrlMatch[1].trim().replace(/^["']|["']$/g, '');
    }
    if (serviceKeyMatch) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKeyMatch[1].trim().replace(/^["']|["']$/g, '');
    }

    console.log('✅ Environment variables loaded from Vercel');
  } catch (error) {
    throw new Error(`Failed to pull environment variables from Vercel: ${error}`);
  }
}

function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

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
// HASH UTILITIES
// ============================================

function hashContent(data: Record<string, unknown>): string {
  const jsonString = JSON.stringify(data, Object.keys(data).sort());
  return createHash('sha256').update(jsonString, 'utf8').digest('hex');
}

// ============================================
// FIELD MAPPING (JSON → PostgreSQL)
// ============================================

/**
 * Map JSON content to category-specific table row
 * Handles camelCase → snake_case conversion and category-specific fields
 */
// ============================================
// TABLE MAPPING
// ============================================

/**
 * Map category to table name
 * Most categories match their table name, but some differ
 */
function getTableName(category: CategoryId): string {
  return category === 'changelog' ? 'changelog_entries' : category;
}

// ============================================
// ROW MAPPING
// ============================================

function mapToTableRow(file: FileInfo): Record<string, unknown> {
  const { data, hash, slug, category } = file;
  const now = new Date().toISOString();

  // Base fields (shared across most tables)
  const base = {
    slug,
    description: data.description || `Content for ${slug}`,
    category: data.category || category,
    author: data.author,
    author_profile_url: data.authorProfileUrl || null,
    date_added: data.dateAdded,
    tags: data.tags || [],
    git_hash: hash,
    synced_at: now,
  };

  // Category-specific mappings
  switch (category) {
    case 'agents':
    case 'mcp':
    case 'rules':
    case 'commands':
      return {
        ...base,
        content: data.content,
        title: data.title || null,
        display_title: data.displayTitle || null,
        seo_title: data.seoTitle || null,
        source: data.source || null,
        documentation_url: data.documentationUrl || null,
        features: data.features || [],
        use_cases: data.useCases || [],
        examples: data.examples || [],
        discovery_metadata: data.discoveryMetadata || null,
        troubleshooting: data.troubleshooting || [],
        configuration: data.configuration || null,
        ...(category === 'mcp' || category === 'commands'
          ? { installation: data.installation || null }
          : {}),
      };

    case 'hooks':
      return {
        ...base,
        content: data.content,
        title: data.title || null,
        display_title: data.displayTitle || null,
        seo_title: data.seoTitle || null,
        source: data.source || null,
        documentation_url: data.documentationUrl || null,
        features: data.features || [],
        use_cases: data.useCases || [],
        examples: data.examples || [],
        discovery_metadata: data.discoveryMetadata || null,
        troubleshooting: data.troubleshooting || [],
        installation: data.installation || null,
        event_types: data.eventTypes || null,
      };

    case 'statuslines':
      return {
        ...base,
        content: data.content,
        title: data.title || null,
        display_title: data.displayTitle || null,
        seo_title: data.seoTitle || null,
        source: data.source || null,
        documentation_url: data.documentationUrl || null,
        features: data.features || [],
        use_cases: data.useCases || [],
        examples: data.examples || [],
        discovery_metadata: data.discoveryMetadata || null,
        troubleshooting: data.troubleshooting || [],
        preview: data.preview || null,
        refresh_rate_ms: data.refreshRateMs || null,
        installation: data.installation || null,
      };

    case 'skills':
      return {
        ...base,
        content: data.content,
        title: data.title || null,
        display_title: data.displayTitle || null,
        seo_title: data.seoTitle || null,
        source: data.source || null,
        documentation_url: data.documentationUrl || null,
        features: data.features || [],
        use_cases: data.useCases || [],
        examples: data.examples || [],
        discovery_metadata: data.discoveryMetadata || null,
        troubleshooting: data.troubleshooting || [],
        dependencies: data.dependencies || null,
        difficulty: data.difficulty || null,
        estimated_time: data.estimatedTime || null,
      };

    case 'collections': {
      // Extract only slugs from items array of objects
      const items = data.items as Array<{ slug: string }> | null;
      const itemSlugs = items ? items.map((item) => item.slug) : null;

      return {
        ...base,
        content: data.content,
        title: data.title || null,
        display_title: data.displayTitle || null,
        seo_title: data.seoTitle || null,
        source: data.source || null,
        documentation_url: data.documentationUrl || null,
        features: data.features || [],
        use_cases: data.useCases || [],
        examples: data.examples || [],
        discovery_metadata: data.discoveryMetadata || null,
        troubleshooting: data.troubleshooting || [],
        items: itemSlugs,
        collection_type: data.collectionType || null,
      };
    }

    case 'guides':
      return {
        slug,
        title: data.title,
        description: data.description,
        category: 'guides',
        subcategory: data.subcategory,
        author: data.author,
        author_profile_url: data.authorProfileUrl || null,
        date_added: data.dateAdded,
        tags: data.tags || [],
        keywords: data.keywords || null,
        sections: data.sections || [],
        seo_title: data.seoTitle || null,
        source: data.source || null,
        related_guides: data.relatedContent || null,
        reading_time: data.estimatedReadTime || null,
        difficulty: data.difficulty || null,
        date_updated: data.lastUpdated || null,
        git_hash: hash,
        synced_at: now,
      };

    case 'changelog': {
      // Changelog entries already parsed to correct format
      // Don't add git_hash/synced_at as table doesn't have these columns
      // Remove id field (let DB auto-generate) and any empty/undefined fields
      const { id, created_at, updated_at, description, ...cleanData } = data as any;

      // Generate description from tldr/content if needed (must be 50-160 chars or NULL)
      let validDescription: string | null = null;
      if (description && description.length >= 50) {
        validDescription = description.slice(0, 160);
      } else if (cleanData.tldr && cleanData.tldr.length >= 50) {
        validDescription = cleanData.tldr.slice(0, 160);
      } else if (cleanData.content) {
        // Extract first substantial paragraph
        const firstPara = cleanData.content.split('\n').find((line: string) => {
          const trimmed = line.trim();
          return trimmed.length > 50 && !trimmed.startsWith('#') && !trimmed.startsWith('**');
        });
        if (firstPara && firstPara.length >= 50) {
          validDescription = firstPara.slice(0, 160);
        }
      }

      return {
        ...cleanData,
        description: validDescription,
      };
    }

    default:
      throw new Error(`Unknown category: ${category}`);
  }
}

// ============================================
// FILE SCANNING
// ============================================

async function parseContentFile(filePath: string): Promise<FileInfo | null> {
  try {
    // Extract category and slug from path
    const match = filePath.match(/content\/([^/]+)\/(?:([^/]+)\/)?([^/]+)\.json$/);
    if (!match) {
      console.warn(`⚠️  Invalid file path format: ${filePath}`);
      return null;
    }

    const category = match[1] as CategoryId;
    const slug = match[3].replace(/\.json$/, '');

    // Read and parse file
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as Record<string, unknown>;
    const hash = hashContent(data);

    return { category, slug, path: filePath, hash, data };
  } catch (error) {
    console.error(`❌ Failed to parse ${filePath}:`, error);
    return null;
  }
}

async function scanIncrementalFiles(): Promise<FileInfo[]> {
  const changedFilesEnv = process.env.CHANGED_FILES || '';
  const changedFiles = changedFilesEnv
    .split(/\s+/)
    .filter((f) => f.trim().length > 0 && f.endsWith('.json'));

  if (changedFiles.length === 0) {
    console.log('ℹ️  No changed content files detected');
    return [];
  }

  console.log(`📦 Processing ${changedFiles.length} changed files...`);

  const files: FileInfo[] = [];
  for (const filePath of changedFiles) {
    const fileInfo = await parseContentFile(join(ROOT_DIR, filePath));
    if (fileInfo) {
      files.push(fileInfo);
    }
  }

  return files;
}

async function scanAllFiles(): Promise<FileInfo[]> {
  console.log('🔄 Full sync mode - scanning all content files...');
  const files: FileInfo[] = [];

  for (const category of VALID_CATEGORIES.filter((c) => c !== 'changelog')) {
    const categoryDir = join(CONTENT_DIR, category);

    try {
      if (category === 'guides') {
        // Guides have subdirectories
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

            const content = await readFile(path, 'utf-8');
            const data = JSON.parse(content) as Record<string, unknown>;
            const hash = hashContent(data);

            files.push({ category, slug, path, hash, data });
            guideCount++;
          }
        }

        console.log(`📂 ${category}: ${guideCount} files`);
      } else {
        // Regular categories: flat structure
        const filenames = await readdir(categoryDir);
        const jsonFiles = filenames.filter((f) => f.endsWith('.json') && !f.includes('template'));

        for (const filename of jsonFiles) {
          const slug = filename.replace(/\.json$/, '');
          const path = join(categoryDir, filename);

          const content = await readFile(path, 'utf-8');
          const data = JSON.parse(content) as Record<string, unknown>;
          const hash = hashContent(data);

          files.push({ category, slug, path, hash, data });
        }

        console.log(`📂 ${category}: ${jsonFiles.length} files`);
      }
    } catch (error) {
      console.warn(`Skipping missing category directory: ${category}`);
    }
  }

  // Parse CHANGELOG.md
  try {
    const changelogPath = join(ROOT_DIR, 'CHANGELOG.md');
    if (existsSync(changelogPath)) {
      console.log('📄 Parsing CHANGELOG.md...');
      const parsed = await parseChangelog(changelogPath);

      for (const entry of parsed.entries) {
        const hash = hashContent(entry);
        files.push({
          category: 'changelog',
          slug: entry.slug,
          path: changelogPath,
          hash,
          data: entry as unknown as Record<string, unknown>,
        });
      }

      console.log(`📂 changelog: ${parsed.entries.length} entries`);
    }
  } catch (error) {
    console.warn('⚠️  Failed to parse CHANGELOG.md:', error);
  }

  return files;
}

// ============================================
// DATABASE SYNC
// ============================================

async function upsertContent(
  supabase: ReturnType<typeof createSupabaseClient>,
  files: FileInfo[],
  stats: SyncStats
): Promise<void> {
  if (files.length === 0) {
    console.log('ℹ️  No files to sync');
    return;
  }

  console.log(`📤 Checking ${files.length} items for changes...`);

  // Group files by category for batch processing
  const filesByCategory = files.reduce(
    (acc, file) => {
      if (!acc[file.category]) {
        acc[file.category] = [];
      }
      acc[file.category].push(file);
      return acc;
    },
    {} as Record<CategoryId, FileInfo[]>
  );

  // Fetch all existing hashes per category in parallel (1 query per category instead of 315 queries)
  const hashMapPromises = Object.entries(filesByCategory).map(async ([category, categoryFiles]) => {
    const slugs = categoryFiles.map((f) => f.slug);
    const { data, error } = await supabase
      .from(category as CategoryId)
      .select('slug, git_hash')
      .in('slug', slugs);

    if (error) {
      console.error(`❌ Failed to fetch hashes for ${category}:`, error.message);
      return { category: category as CategoryId, hashMap: new Map<string, string>() };
    }

    const hashMap = new Map<string, string>();
    for (const row of data || []) {
      if (row.slug && row.git_hash) {
        hashMap.set(row.slug, row.git_hash);
      }
    }

    return { category: category as CategoryId, hashMap };
  });

  const hashMaps = await Promise.all(hashMapPromises);
  const hashMapByCategory = new Map<CategoryId, Map<string, string>>();
  for (const { category, hashMap } of hashMaps) {
    hashMapByCategory.set(category, hashMap);
  }

  console.log('✅ Fetched existing hashes');

  // Determine what needs to be synced
  const toInsert: FileInfo[] = [];
  const toUpdate: FileInfo[] = [];

  for (const file of files) {
    const categoryHashMap = hashMapByCategory.get(file.category);
    const existingHash = categoryHashMap?.get(file.slug);

    if (existingHash === file.hash) {
      // Content unchanged, skip
      continue;
    }

    if (existingHash) {
      toUpdate.push(file);
    } else {
      toInsert.push(file);
    }
  }

  const totalChanges = toInsert.length + toUpdate.length;

  if (totalChanges === 0) {
    console.log('✅ No changes detected - all content up to date!');
    return;
  }

  console.log(`📝 Changes detected: ${toInsert.length} new, ${toUpdate.length} updated`);

  // Batch upsert in parallel (batch size: 50)
  const BATCH_SIZE = 50;
  const allChanges = [...toInsert, ...toUpdate];
  const batches: FileInfo[][] = [];

  for (let i = 0; i < allChanges.length; i += BATCH_SIZE) {
    batches.push(allChanges.slice(i, i + BATCH_SIZE));
  }

  console.log(`📤 Syncing ${allChanges.length} items in ${batches.length} batches...`);

  // Process batches in parallel
  await Promise.all(
    batches.map(async (batch, batchIndex) => {
      for (const file of batch) {
        try {
          const row = mapToTableRow(file);
          const tableName = getTableName(file.category);
          const { error } = await supabase.from(tableName).upsert(row, { onConflict: 'slug' });

          if (error) {
            console.error(`❌ Failed to sync ${file.category}:${file.slug}:`, error.message);
            stats.errors++;
          } else {
            const isUpdate = toUpdate.includes(file);
            if (isUpdate) {
              stats.updated++;
              console.log(`  ✏️  Updated ${file.category}:${file.slug}`);
            } else {
              stats.inserted++;
              console.log(`  ➕ Inserted ${file.category}:${file.slug}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error syncing ${file.category}:${file.slug}:`, error);
          stats.errors++;
        }
      }
    })
  );
}

async function deleteRemovedContent(
  supabase: ReturnType<typeof createSupabaseClient>,
  stats: SyncStats
): Promise<void> {
  const deletedFilesEnv = process.env.DELETED_FILES || '';
  const deletedFiles = deletedFilesEnv
    .split(/\s+/)
    .filter((f) => f.trim().length > 0 && f.endsWith('.json'));

  if (deletedFiles.length === 0) {
    return;
  }

  console.log(`🗑️  Deleting ${deletedFiles.length} removed files...`);

  for (const filePath of deletedFiles) {
    try {
      const match = filePath.match(/content\/([^/]+)\/(?:([^/]+)\/)?([^/]+)\.json$/);
      if (!match) {
        console.warn(`⚠️  Invalid deleted file path: ${filePath}`);
        continue;
      }

      const category = match[1] as CategoryId;
      const slug = match[3].replace(/\.json$/, '');
      const tableName = getTableName(category);

      const { error } = await supabase.from(tableName).delete().match({ slug });

      if (error) {
        console.error(`❌ Failed to delete ${category}:${slug}:`, error.message);
        stats.errors++;
      } else {
        console.log(`🗑️  Deleted ${category}:${slug}`);
        stats.deleted++;
      }
    } catch (error) {
      console.error(`❌ Error deleting ${filePath}:`, error);
      stats.errors++;
    }
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  const startTime = Date.now();
  const stats: SyncStats = {
    scanned: 0,
    inserted: 0,
    updated: 0,
    deleted: 0,
    errors: 0,
  };

  try {
    console.log('🔄 Starting Supabase content sync (category-specific tables)...');

    const args = process.argv.slice(2);
    const mode = args.includes('--full') ? 'full' : 'incremental';

    // Incremental mode requires CHANGED_FILES env var
    if (mode === 'incremental' && !process.env.CHANGED_FILES && !process.env.DELETED_FILES) {
      console.log('ℹ️  Incremental mode with no CHANGED_FILES or DELETED_FILES env vars');
      console.log('ℹ️  This likely means all content is already synced - nothing to do');
      process.exit(0);
    }

    console.log(
      `📋 Mode: ${mode === 'full' ? 'Full sync (all files)' : 'Incremental sync (changed files only)'}`
    );

    // Ensure environment variables are available
    ensureEnvVars();

    const supabase = createSupabaseClient();

    const files = mode === 'incremental' ? await scanIncrementalFiles() : await scanAllFiles();
    stats.scanned = files.length;

    await upsertContent(supabase, files, stats);

    if (mode === 'incremental') {
      await deleteRemovedContent(supabase, stats);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n📊 Sync Summary:');
    console.log(`   Scanned:   ${stats.scanned} files`);
    console.log(`   Inserted:  ${stats.inserted}`);
    console.log(`   Updated:   ${stats.updated}`);
    console.log(`   Deleted:   ${stats.deleted}`);
    console.log(`   Errors:    ${stats.errors}`);
    console.log(`   Duration:  ${duration}s`);

    if (stats.errors > 0) {
      console.error('\n⚠️  Some items failed to sync. Check logs above.');
      cleanup();
      process.exit(1);
    } else {
      console.log('\n✅ Sync complete!');
      cleanup();
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    cleanup();
    process.exit(1);
  }
}

main();
