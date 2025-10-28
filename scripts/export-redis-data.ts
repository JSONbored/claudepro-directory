/**
 * Redis Data Export Script - READ-ONLY
 *
 * Purpose: Export all view count data from Vercel KV (Upstash Redis) to JSON
 * for migration to Supabase user_interactions table.
 *
 * ⚠️ SAFETY GUARANTEES:
 * - READ-ONLY operations (SCAN, GET commands only)
 * - NO write/delete commands (no SET, DEL, FLUSHDB, etc.)
 * - NO production data modification
 * - Outputs to local JSON file only
 *
 * Usage:
 *   npx tsx scripts/export-redis-data.ts
 *
 * Output:
 *   redis-export-YYYY-MM-DD.json (in project root)
 *
 * Environment Variables Required (from .env.local):
 *   KV_REST_API_URL - Vercel KV REST API URL
 *   KV_REST_API_TOKEN - Vercel KV REST API token
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// Load .env.local file manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

import { statsRedis } from '@/src/lib/cache.server';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface RedisViewData {
  key: string;
  category: string;
  slug: string;
  date?: string; // For daily keys like "mcp:github-mcp:2025-10-27"
  viewCount: number;
  keyType: 'total' | 'daily';
}

interface ExportSummary {
  exportDate: string;
  totalKeys: number;
  totalViewCount: number;
  categoryCounts: Record<string, number>;
  dailyKeys: number;
  totalKeys_aggregated: number;
  data: RedisViewData[];
}

// ============================================
// REDIS SCANNING (READ-ONLY)
// ============================================

/**
 * Scan all Redis keys matching content view patterns
 *
 * SAFETY: Uses SCAN command (read-only, cursor-based iteration)
 * - Does NOT use KEYS (which can block Redis in production)
 * - Does NOT modify any data
 *
 * @returns Array of all Redis keys
 */
async function scanAllKeys(): Promise<string[]> {
  const allKeys: string[] = [];
  let cursor = 0;

  console.log('🔍 Scanning Redis keys (read-only)...\n');

  do {
    try {
      // SCAN is safe: read-only, non-blocking, cursor-based
      const result = await statsRedis.client.scan(cursor, {
        match: '*:*', // Match category:slug or category:slug:date patterns
        count: 100,
      });

      cursor = result[0];
      const keys = result[1];

      allKeys.push(...keys);

      if (keys.length > 0) {
        console.log(`  Found ${keys.length} keys (cursor: ${cursor})`);
      }
    } catch (error) {
      console.error('Error scanning Redis:', error);
      throw error;
    }
  } while (cursor !== 0);

  console.log(`\n✅ Scan complete: ${allKeys.length} total keys found\n`);
  return allKeys;
}

/**
 * Parse Redis key into structured data
 *
 * Key patterns:
 * - "category:slug" → total views
 * - "category:slug:YYYY-MM-DD" → daily views
 *
 * @param key - Redis key
 * @returns Parsed key data or null if invalid pattern
 */
function parseRedisKey(
  key: string
): { category: string; slug: string; date?: string; keyType: 'total' | 'daily' } | null {
  const parts = key.split(':');

  if (parts.length === 2) {
    // Total views key: "category:slug"
    return {
      category: parts[0],
      slug: parts[1],
      keyType: 'total',
    };
  }
  if (parts.length === 3) {
    // Daily views key: "category:slug:YYYY-MM-DD"
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (datePattern.test(parts[2])) {
      return {
        category: parts[0],
        slug: parts[1],
        date: parts[2],
        keyType: 'daily',
      };
    }
  }

  // Unknown pattern, skip
  return null;
}

/**
 * Fetch view count for a Redis key
 *
 * SAFETY: Uses GET command (read-only)
 *
 * @param key - Redis key
 * @returns View count (number) or 0 if not found
 */
async function getViewCount(key: string): Promise<number> {
  try {
    // GET is safe: read-only
    const value = await statsRedis.client.get(key);
    return value ? Number.parseInt(value as string, 10) : 0;
  } catch (error) {
    console.warn(`Warning: Failed to get value for key "${key}":`, error);
    return 0;
  }
}

// ============================================
// EXPORT LOGIC
// ============================================

/**
 * Export all Redis view data to JSON
 *
 * SAFETY CHECKLIST:
 * ✅ Only uses SCAN (read-only, cursor-based)
 * ✅ Only uses GET (read-only)
 * ✅ NO write operations (SET, DEL, FLUSHDB, etc.)
 * ✅ NO destructive operations
 * ✅ Outputs to local file only
 *
 * @returns Export summary with all data
 */
async function exportRedisData(): Promise<ExportSummary> {
  console.log('📦 Starting Redis export (READ-ONLY)...\n');
  console.log('⚠️  SAFETY: This script only READS data, never writes/deletes\n');

  // Step 1: Scan all keys
  const allKeys = await scanAllKeys();

  if (allKeys.length === 0) {
    console.log('⚠️  No keys found in Redis. Nothing to export.');
    return {
      exportDate: new Date().toISOString(),
      totalKeys: 0,
      totalViewCount: 0,
      categoryCounts: {},
      dailyKeys: 0,
      totalKeys_aggregated: 0,
      data: [],
    };
  }

  // Step 2: Parse and fetch view counts
  console.log('📊 Fetching view counts (read-only)...\n');
  const exportData: RedisViewData[] = [];
  const categoryCounts: Record<string, number> = {};
  let totalViews = 0;
  let dailyKeysCount = 0;
  let totalKeysCount = 0;

  for (const key of allKeys) {
    const parsed = parseRedisKey(key);
    if (!parsed) {
      console.log(`  ⏭️  Skipping unknown key pattern: ${key}`);
      continue;
    }

    const viewCount = await getViewCount(key);

    if (viewCount > 0) {
      exportData.push({
        key,
        category: parsed.category,
        slug: parsed.slug,
        date: parsed.date,
        viewCount,
        keyType: parsed.keyType,
      });

      // Track stats
      totalViews += viewCount;
      categoryCounts[parsed.category] = (categoryCounts[parsed.category] || 0) + viewCount;

      if (parsed.keyType === 'daily') {
        dailyKeysCount++;
      } else {
        totalKeysCount++;
      }

      // Log progress every 50 keys
      if (exportData.length % 50 === 0) {
        console.log(`  Processed ${exportData.length} keys...`);
      }
    }
  }

  console.log(`\n✅ Fetched ${exportData.length} keys with view counts\n`);

  return {
    exportDate: new Date().toISOString(),
    totalKeys: exportData.length,
    totalViewCount: totalViews,
    categoryCounts,
    dailyKeys: dailyKeysCount,
    totalKeys_aggregated: totalKeysCount,
    data: exportData,
  };
}

/**
 * Write export data to JSON file
 *
 * @param summary - Export summary with data
 */
function writeExportFile(summary: ExportSummary): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `redis-export-${timestamp}.json`;
  const filepath = path.join(process.cwd(), filename);

  console.log(`💾 Writing export to ${filename}...\n`);

  fs.writeFileSync(filepath, JSON.stringify(summary, null, 2), 'utf-8');

  console.log('✅ Export complete!\n');
  console.log(`📄 File: ${filepath}`);
  console.log('📊 Summary:');
  console.log(`   - Total keys: ${summary.totalKeys}`);
  console.log(`   - Total views: ${summary.totalViewCount.toLocaleString()}`);
  console.log(`   - Daily keys: ${summary.dailyKeys}`);
  console.log(`   - Total (aggregated) keys: ${summary.totalKeys_aggregated}`);
  console.log('\n📦 Category breakdown:');

  for (const [category, count] of Object.entries(summary.categoryCounts).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`   - ${category}: ${count.toLocaleString()} views`);
  }

  console.log(`\n✅ Safe to commit: redis-export-${timestamp}.json\n`);
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Redis Data Export - READ-ONLY');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Verify environment variables (Vercel KV)
  if (!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)) {
    console.error('❌ ERROR: Missing required environment variables:\n');
    console.error('   KV_REST_API_URL');
    console.error('   KV_REST_API_TOKEN\n');
    console.error('💡 These should already be in your .env.local file\n');
    console.error('   (from Vercel KV integration)\n');
    process.exit(1);
  }

  console.log('✅ Environment variables found\n');
  console.log(`   KV_REST_API_URL: ${process.env.KV_REST_API_URL}\n`);

  try {
    // Export data
    const summary = await exportRedisData();

    // Write to file
    writeExportFile(summary);

    console.log('🎉 Export successful! No data was modified in Redis.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Export failed:', error);
    console.error('\n⚠️  No data was modified (read-only script)\n');
    process.exit(1);
  }
}

// Run main
main();
