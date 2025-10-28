/**
 * Changelog → Supabase Sync Script
 *
 * Build-time script that parses CHANGELOG.md and syncs entries to Supabase database.
 * CHANGELOG.md remains the source of truth, database is the query layer.
 *
 * Architecture:
 * - Parse CHANGELOG.md using existing parser
 * - Upsert entries to changelog_entries table (idempotent by slug)
 * - Generate SEO description from tldr or first paragraph
 * - Extract keywords from title and categories
 * - All entries published by default
 *
 * Usage:
 *   pnpm sync:changelog        # Sync all entries
 *   pnpm sync:changelog --dry  # Dry run (show what would be synced)
 *
 * Database-first: Uses generated publicChangelogEntriesInsertSchema
 */

import { parseChangelog } from '@/src/lib/changelog/parser';
import { logger } from '@/src/lib/logger';
import { publicChangelogEntriesInsertSchema } from '@/src/lib/schemas/generated/db-schemas';
import { createClient } from '@/src/lib/supabase/server';

interface SyncStats {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Generate SEO description from changelog entry
 * Extracts first 50-160 chars from tldr or content
 */
function generateDescription(entry: { tldr?: string; content: string; title: string }): string {
  // Use tldr if available
  if (entry.tldr && entry.tldr.length >= 50) {
    const truncated = entry.tldr.slice(0, 160);
    return truncated.length === 160 ? `${truncated}...` : truncated;
  }

  // Extract first paragraph from content (after title/headers)
  const firstParagraph = entry.content.split('\n').find((line) => {
    const trimmed = line.trim();
    return trimmed.length > 50 && !trimmed.startsWith('#') && !trimmed.startsWith('**');
  });

  if (firstParagraph && firstParagraph.length >= 50) {
    const truncated = firstParagraph.slice(0, 160);
    return truncated.length === 160 ? `${truncated}...` : truncated;
  }

  // Fallback: use title with date
  return `Changelog entry: ${entry.title}`.slice(0, 160);
}

/**
 * Extract keywords from title and category changes
 * Max 10 keywords, lowercase, deduplicated
 */
function extractKeywords(entry: {
  title: string;
  categories: {
    Added: Array<{ content: string }>;
    Changed: Array<{ content: string }>;
    Fixed: Array<{ content: string }>;
    Deprecated: Array<{ content: string }>;
    Removed: Array<{ content: string }>;
    Security: Array<{ content: string }>;
  };
}): string[] {
  const keywords = new Set<string>();

  // Extract from title (remove common words)
  const titleWords = entry.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !['from', 'with', 'that', 'this', 'have'].includes(word));

  for (const word of titleWords) {
    keywords.add(word);
    if (keywords.size >= 10) break;
  }

  // Extract from category names if they have content
  const categories = ['Added', 'Changed', 'Fixed', 'Security', 'Deprecated', 'Removed'] as const;
  for (const category of categories) {
    if (entry.categories[category].length > 0) {
      keywords.add(category.toLowerCase());
      if (keywords.size >= 10) break;
    }
  }

  return Array.from(keywords).slice(0, 10);
}

/**
 * Sync single changelog entry to database
 * Returns true if inserted/updated, false if skipped/error
 */
async function syncEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entry: {
    date: string;
    title: string;
    slug: string;
    tldr?: string;
    categories: {
      Added: Array<{ content: string }>;
      Changed: Array<{ content: string }>;
      Fixed: Array<{ content: string }>;
      Deprecated: Array<{ content: string }>;
      Removed: Array<{ content: string }>;
      Security: Array<{ content: string }>;
    };
    content: string;
    rawContent: string;
  },
  dryRun: boolean
): Promise<'inserted' | 'updated' | 'skipped' | 'error'> {
  try {
    // Check if entry already exists
    const { data: existing } = await supabase
      .from('changelog_entries')
      .select('id, updated_at')
      .eq('slug', entry.slug)
      .single();

    // Prepare insert/update data
    const description = generateDescription(entry);
    const keywords = extractKeywords(entry);

    const entryData = {
      release_date: entry.date,
      title: entry.title,
      slug: entry.slug,
      tldr: entry.tldr || null,
      changes: entry.categories, // JSONB - same structure as ChangelogCategories
      content: entry.content,
      raw_content: entry.rawContent,
      description,
      keywords,
      published: true,
      featured: false,
    };

    // Validate with generated schema
    const validated = publicChangelogEntriesInsertSchema.parse(entryData);

    if (dryRun) {
      logger.info(`[DRY RUN] Would ${existing ? 'update' : 'insert'} entry: ${entry.slug}`, {
        description,
        keywords,
      });
      return existing ? 'updated' : 'inserted';
    }

    if (existing) {
      // Update existing entry
      const { error } = await supabase
        .from('changelog_entries')
        .update(validated)
        .eq('slug', entry.slug);

      if (error) throw error;

      logger.info(`✅ Updated entry: ${entry.slug}`);
      return 'updated';
    }
    // Insert new entry
    const { error } = await supabase.from('changelog_entries').insert(validated);

    if (error) throw error;

    logger.info(`✅ Inserted entry: ${entry.slug}`);
    return 'inserted';
  } catch (error) {
    logger.error(
      `❌ Failed to sync entry: ${entry.slug}`,
      error instanceof Error ? error : new Error(String(error))
    );
    return 'error';
  }
}

/**
 * Main sync function
 * Parses CHANGELOG.md and syncs all entries to database
 */
async function syncChangelogToSupabase(dryRun = false): Promise<SyncStats> {
  const stats: SyncStats = {
    total: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    logger.info('🔄 Starting changelog sync...');
    if (dryRun) {
      logger.info('🌵 DRY RUN MODE - No database changes will be made');
    }

    // Parse CHANGELOG.md (source of truth)
    const parsed = await parseChangelog();
    stats.total = parsed.entries.length;

    logger.info(`📄 Parsed ${stats.total} entries from CHANGELOG.md`);

    // Get Supabase client
    const supabase = await createClient();

    // Sync each entry
    for (const entry of parsed.entries) {
      const result = await syncEntry(supabase, entry, dryRun);

      switch (result) {
        case 'inserted':
          stats.inserted++;
          break;
        case 'updated':
          stats.updated++;
          break;
        case 'skipped':
          stats.skipped++;
          break;
        case 'error':
          stats.errors++;
          break;
      }
    }

    // Summary
    logger.info('✅ Changelog sync complete!', {
      total: stats.total,
      inserted: stats.inserted,
      updated: stats.updated,
      skipped: stats.skipped,
      errors: stats.errors,
    });

    if (stats.errors > 0) {
      logger.warn(`⚠️  ${stats.errors} entries failed to sync`);
    }

    return stats;
  } catch (error) {
    logger.error(
      '❌ Changelog sync failed',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--dry');

  syncChangelogToSupabase(dryRun)
    .then((stats) => {
      if (stats.errors > 0) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

export { syncChangelogToSupabase };
