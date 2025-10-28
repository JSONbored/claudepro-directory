/**
 * Generate SQL Migration from Redis Export
 *
 * Transforms Redis view counts into Supabase user_interactions INSERT statements
 *
 * Usage:
 *   npx tsx scripts/generate-redis-import-sql.ts
 *
 * Output:
 *   supabase/migrations/TIMESTAMP_import_redis_view_counts.sql
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

interface RedisExportEntry {
  key: string;
  value: number | unknown;
}

interface ViewCountEntry {
  category: string;
  slug: string;
  count: number;
}

const REDIS_EXPORT_FILE = 'redis-export-2025-10-27.json';
const DAYS_TO_SPREAD = 30; // Spread views over past 30 days

/**
 * Parse Redis key into category and slug
 * Format: views:{category}:{slug}
 */
function parseViewKey(key: string): { category: string; slug: string } | null {
  const match = key.match(/^views:([^:]+):(.+)$/);
  if (!match) return null;

  return {
    category: match[1],
    slug: match[2],
  };
}

/**
 * Generate random timestamp within past N days
 */
function randomPastTimestamp(daysAgo: number): string {
  const now = Date.now();
  const maxAge = daysAgo * 24 * 60 * 60 * 1000; // days in ms
  const randomAge = Math.random() * maxAge;
  const timestamp = new Date(now - randomAge);
  return timestamp.toISOString();
}

/**
 * Generate SQL INSERT statements for view counts
 */
function generateInsertStatements(viewCounts: ViewCountEntry[]): string {
  const statements: string[] = [];

  // Header
  statements.push(
    '-- ============================================================================'
  );
  statements.push('-- Redis View Counts Import');
  statements.push(
    '-- ============================================================================'
  );
  statements.push('--');
  statements.push('-- Imports historical view counts from Redis into user_interactions table');
  statements.push('-- Strategy: Create individual interaction records with timestamps spread');
  statements.push('--           over the past 30 days to simulate historical activity');
  statements.push('--');
  statements.push(`-- Source: ${REDIS_EXPORT_FILE}`);
  statements.push(`-- Generated: ${new Date().toISOString()}`);
  statements.push(`-- Total view count keys: ${viewCounts.length}`);
  statements.push(
    `-- Total interactions to insert: ${viewCounts.reduce((sum, v) => sum + v.count, 0).toLocaleString()}`
  );
  statements.push('--');
  statements.push(
    '-- ============================================================================'
  );
  statements.push('');

  // Batch inserts (1000 rows per INSERT for performance)
  const BATCH_SIZE = 1000;
  let totalInserted = 0;

  for (const entry of viewCounts) {
    const { category, slug, count } = entry;

    if (count === 0) continue;

    // Generate N individual view records
    const values: string[] = [];

    for (let i = 0; i < count; i++) {
      const timestamp = randomPastTimestamp(DAYS_TO_SPREAD);

      values.push(`  ('${category}', '${slug}', 'view', '${timestamp}')`);

      // Flush batch when full
      if (values.length >= BATCH_SIZE) {
        statements.push(`-- Batch insert for ${category}:${slug} (${values.length} rows)`);
        statements.push(
          'INSERT INTO user_interactions (content_type, content_slug, interaction_type, created_at)'
        );
        statements.push('VALUES');
        statements.push(values.join(',\n'));
        statements.push('ON CONFLICT DO NOTHING;');
        statements.push('');

        totalInserted += values.length;
        values.length = 0; // Clear array
      }
    }

    // Flush remaining values for this entry
    if (values.length > 0) {
      statements.push(`-- Insert for ${category}:${slug} (${values.length} rows)`);
      statements.push(
        'INSERT INTO user_interactions (content_type, content_slug, interaction_type, created_at)'
      );
      statements.push('VALUES');
      statements.push(values.join(',\n'));
      statements.push('ON CONFLICT DO NOTHING;');
      statements.push('');

      totalInserted += values.length;
    }
  }

  // Footer
  statements.push(
    '-- ============================================================================'
  );
  statements.push('-- Summary');
  statements.push(
    '-- ============================================================================'
  );
  statements.push(`-- Total rows inserted: ${totalInserted.toLocaleString()}`);
  statements.push('--');
  statements.push('-- Next steps:');
  statements.push('-- 1. Run this migration in Supabase SQL editor');
  statements.push(
    '-- 2. Refresh materialized view: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_featured_scores;'
  );
  statements.push(
    '-- 3. Verify data: SELECT content_type, COUNT(*) FROM user_interactions GROUP BY content_type;'
  );
  statements.push(
    '-- ============================================================================'
  );

  return statements.join('\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Redis → Supabase SQL Migration Generator');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Read Redis export
  const exportPath = path.join(process.cwd(), REDIS_EXPORT_FILE);

  if (!fs.existsSync(exportPath)) {
    console.error(`❌ ERROR: ${REDIS_EXPORT_FILE} not found`);
    console.error(`   Expected at: ${exportPath}`);
    process.exit(1);
  }

  console.log(`📦 Reading ${REDIS_EXPORT_FILE}...`);
  const exportData: RedisExportEntry[] = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

  // Filter and parse view count keys
  const viewCounts: ViewCountEntry[] = [];

  for (const entry of exportData) {
    const parsed = parseViewKey(entry.key);
    if (!parsed) continue;

    const count = typeof entry.value === 'number' ? entry.value : 0;
    if (count > 0) {
      viewCounts.push({
        category: parsed.category,
        slug: parsed.slug,
        count,
      });
    }
  }

  console.log(`✅ Found ${viewCounts.length} view count keys\n`);

  // Calculate stats
  const totalViews = viewCounts.reduce((sum, v) => sum + v.count, 0);
  const byCategory = viewCounts.reduce(
    (acc, v) => {
      acc[v.category] = (acc[v.category] || 0) + v.count;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log('📊 View counts by category:');
  for (const [category, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${category}: ${count.toLocaleString()} views`);
  }
  console.log(`   TOTAL: ${totalViews.toLocaleString()} views\n`);

  // Generate SQL
  console.log('🔨 Generating SQL INSERT statements...\n');
  const sql = generateInsertStatements(viewCounts);

  // Write to migration file
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const migrationFile = `supabase/migrations/${timestamp}_import_redis_view_counts.sql`;
  const migrationPath = path.join(process.cwd(), migrationFile);

  fs.writeFileSync(migrationPath, sql, 'utf-8');

  console.log('✅ SQL migration generated!\n');
  console.log(`📄 File: ${migrationFile}`);
  console.log(`📊 Total INSERT statements: ${viewCounts.length}`);
  console.log(`📊 Total rows to insert: ${totalViews.toLocaleString()}`);
  console.log(`📊 File size: ${(fs.statSync(migrationPath).size / 1024 / 1024).toFixed(2)} MB\n`);

  console.log('🚀 Next steps:');
  console.log('   1. Review the migration file');
  console.log('   2. Run in Supabase SQL editor (copy/paste or upload)');
  console.log('   3. REFRESH MATERIALIZED VIEW CONCURRENTLY mv_featured_scores;');
  console.log(
    '   4. Verify: SELECT content_type, COUNT(*) FROM user_interactions GROUP BY content_type;\n'
  );

  console.log('🎉 Done!');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
