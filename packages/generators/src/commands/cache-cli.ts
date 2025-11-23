import {
  clearAllHashes,
  clearHash,
  getCacheKeys,
  getCacheStats,
  printCache,
} from '../toolkit/cache.js';
import { logger } from '../toolkit/logger.js';

export type CacheCommand = 'info' | 'clear' | 'help';

export interface CacheCliOptions {
  command?: CacheCommand;
  pattern?: string;
}

export function showCacheCliHelp(): void {
  logger.info(
    `
🔧 Build Cache CLI - Introspection and Management Tool

Usage:
  heyclaude-cache <command> [options]

Commands:
  info                Show all cache entries with metadata
  clear               Clear all caches
  clear <pattern>     Clear caches matching glob pattern

Examples:
  heyclaude-cache info
  heyclaude-cache clear
  heyclaude-cache clear "skill:*"
  heyclaude-cache clear "db-*"
`,
    { script: 'build-cache-cli' }
  );
}

export function runCacheCli(options: CacheCliOptions = {}): void {
  const command = options.command;
  const arg = options.pattern;

  if (!command || command === 'help') {
    showCacheCliHelp();
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
      throw new Error(`Unknown cache CLI command: ${command}`);
    }
  }
}
