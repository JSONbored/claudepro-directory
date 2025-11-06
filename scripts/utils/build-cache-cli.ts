#!/usr/bin/env tsx
/**
 * Build Cache CLI - Introspection and Management Tool
 *
 * Usage:
 *   pnpm cache:info                 # Show all cache entries
 *   pnpm cache:clear                # Clear all caches
 *   pnpm cache:clear -- <pattern>   # Clear caches matching pattern (e.g., "skill:*")
 *
 * Examples:
 *   pnpm cache:info
 *   pnpm cache:clear
 *   pnpm cache:clear -- "skill:*"
 *   pnpm cache:clear -- "db-*"
 */

import {
  clearAllHashes,
  clearHash,
  getCacheKeys,
  getCacheStats,
  printCache,
} from './build-cache.js';

const command = process.argv[2];
const arg = process.argv[3];

function showHelp(): void {
  console.log(`
🔧 Build Cache CLI - Introspection and Management Tool

Usage:
  tsx scripts/utils/build-cache-cli.ts <command> [options]

Commands:
  info                Show all cache entries with metadata
  clear               Clear all caches
  clear <pattern>     Clear caches matching glob pattern

Examples:
  tsx scripts/utils/build-cache-cli.ts info
  tsx scripts/utils/build-cache-cli.ts clear
  tsx scripts/utils/build-cache-cli.ts clear "skill:*"
  tsx scripts/utils/build-cache-cli.ts clear "db-*"

Package.json shortcuts:
  pnpm cache:info
  pnpm cache:clear
  pnpm cache:clear -- "skill:*"
`);
}

function main() {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  switch (command) {
    case 'info': {
      printCache();
      const stats = getCacheStats();

      if (stats.totalEntries > 0) {
        console.log('📊 Statistics:');
        console.log(`   Total Entries: ${stats.totalEntries}`);
        console.log(`   Oldest: ${stats.oldestEntry || 'N/A'}`);
        console.log(`   Newest: ${stats.newestEntry || 'N/A'}`);
        console.log(`   Total Build Time Saved: ${(stats.totalDuration / 1000).toFixed(1)}s`);
        console.log('');
      }
      break;
    }

    case 'clear': {
      if (arg) {
        // Clear specific pattern (e.g., "skill:*" or "db-*")
        // Escape regex metacharacters before substituting wildcards
        const WILDCARD_PLACEHOLDER = '___WILDCARD___';
        const escapeForRegex = (value: string) =>
          value.replace(/[\\^$.*+?()[\]{}|]/g, (match) =>
            match === '*' ? WILDCARD_PLACEHOLDER : `\\${match}`
          );
        const patternSource = escapeForRegex(arg).replace(
          new RegExp(WILDCARD_PLACEHOLDER, 'g'),
          '.*'
        );
        const pattern = new RegExp(`^${patternSource}$`);
        const keys = getCacheKeys();
        const matchingKeys = keys.filter((k) => pattern.test(k));

        if (matchingKeys.length === 0) {
          console.log(`ℹ️  No caches matching pattern: ${arg}`);
          return;
        }

        console.log(`🗑️  Clearing ${matchingKeys.length} cache(s) matching: ${arg}`);
        for (const key of matchingKeys) {
          clearHash(key);
          console.log(`   ✓ Cleared: ${key}`);
        }
        console.log('');
      } else {
        // Clear all caches
        const stats = getCacheStats();
        if (stats.totalEntries === 0) {
          console.log('ℹ️  Cache already empty\n');
          return;
        }

        clearAllHashes();
        console.log(`✅ Cleared all ${stats.totalEntries} cache(s)\n`);
      }
      break;
    }

    default: {
      console.error(`❌ Unknown command: ${command}`);
      console.error('   Run with --help to see available commands\n');
      process.exit(1);
    }
  }
}

main();
