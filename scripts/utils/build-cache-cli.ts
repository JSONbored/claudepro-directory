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

import { logger } from '@/src/lib/logger';
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
  logger.info(
    `
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
`,
    { script: 'build-cache-cli' }
  );
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
        logger.info('📊 Statistics:', { script: 'build-cache-cli' });
        logger.info(`   Total Entries: ${stats.totalEntries}`, {
          script: 'build-cache-cli',
          totalEntries: stats.totalEntries,
        });
        logger.info(`   Oldest: ${stats.oldestEntry || 'N/A'}`, {
          script: 'build-cache-cli',
          oldestEntry: stats.oldestEntry || 'N/A',
        });
        logger.info(`   Newest: ${stats.newestEntry || 'N/A'}`, {
          script: 'build-cache-cli',
          newestEntry: stats.newestEntry || 'N/A',
        });
        logger.info(`   Total Build Time Saved: ${(stats.totalDuration / 1000).toFixed(1)}s`, {
          script: 'build-cache-cli',
          totalDuration: `${(stats.totalDuration / 1000).toFixed(1)}s`,
        });
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
          logger.info(`ℹ️  No caches matching pattern: ${arg}`, {
            script: 'build-cache-cli',
            pattern: arg,
          });
          return;
        }

        logger.info(`🗑️  Clearing ${matchingKeys.length} cache(s) matching: ${arg}`, {
          script: 'build-cache-cli',
          pattern: arg,
          count: matchingKeys.length,
        });
        for (const key of matchingKeys) {
          clearHash(key);
          logger.info(`   ✓ Cleared: ${key}`, { script: 'build-cache-cli', clearedKey: key });
        }
      } else {
        // Clear all caches
        const stats = getCacheStats();
        if (stats.totalEntries === 0) {
          logger.info('ℹ️  Cache already empty\n', { script: 'build-cache-cli' });
          return;
        }

        clearAllHashes();
        logger.info(`✅ Cleared all ${stats.totalEntries} cache(s)\n`, {
          script: 'build-cache-cli',
          clearedCount: stats.totalEntries,
        });
      }
      break;
    }

    default: {
      logger.error(`❌ Unknown command: ${command}`, undefined, {
        script: 'build-cache-cli',
        command,
      });
      logger.error('   Run with --help to see available commands\n', undefined, {
        script: 'build-cache-cli',
      });
      process.exit(1);
    }
  }
}

main();
