#!/usr/bin/env tsx
/**
 * Theme Migration Command
 *
 * Safely migrates CSS files from data-theme to .dark class system
 *
 * Usage:
 *   pnpm exec heyclaude-migrate-theme --dry-run  # Analyze only
 *   pnpm exec heyclaude-migrate-theme              # Apply changes
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as postcss from 'postcss';

import { logger } from '../toolkit/logger.ts';
import themeMigrationPlugin, {
  transformations,
} from '../utils/css-migration/postcss-theme-migration.ts';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = join(__filename, '..');
const PROJECT_ROOT = join(SCRIPT_DIR, '../../../../');

// Find all CSS files
function findCSSFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        findCSSFiles(filePath, fileList);
      }
    } else if (extname(file) === '.css') {
      fileList.push(filePath);
    }
  }

  return fileList;
}

export async function runMigrateTheme(dryRun: boolean = false): Promise<void> {
  const cssFiles = findCSSFiles(join(PROJECT_ROOT, 'apps/web/src'));

  logger.info(`Found ${cssFiles.length} CSS files`);

  if (dryRun) {
    logger.info('DRY RUN MODE - No files will be modified');
  } else {
    logger.warn('LIVE MODE - Files will be modified');
  }

  let totalTransformations = 0;
  const fileResults: Array<{ file: string; count: number }> = [];

  for (const file of cssFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const relativePath = relative(PROJECT_ROOT, file);

      // Clear transformations for this file
      transformations.length = 0;

      const result = await postcss
        .default([themeMigrationPlugin({ dryRun, verbose: true })])
        .process(content, {
          from: file,
          to: file,
        });

      const fileTransformations = transformations.length;
      totalTransformations += fileTransformations;

      if (fileTransformations > 0) {
        fileResults.push({ file: relativePath, count: fileTransformations });
        logger.info(`${relativePath}: ${fileTransformations} transformation(s)`);
      }

      if (!dryRun && fileTransformations > 0) {
        // Create backup
        const backupPath = `${file}.backup`;
        writeFileSync(backupPath, content, 'utf-8');
        logger.info(`Backup created: ${backupPath}`);

        // Write transformed content
        writeFileSync(file, result.css, 'utf-8');
        logger.info(`File updated`);
      }
    } catch (error) {
      logger.error(`Error processing ${file}`, { error });
    }
  }

  logger.info('Summary', {
    filesProcessed: cssFiles.length,
    filesWithChanges: fileResults.length,
    totalTransformations,
  });

  if (fileResults.length > 0) {
    logger.info('Files modified', { files: fileResults });
  }

  if (dryRun) {
    logger.info('Run without --dry-run to apply changes');
  } else {
    logger.info('Migration complete!');
    logger.info('Backup files created with .backup extension');
    logger.info('Review changes and remove .backup files when satisfied');
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');

  runMigrateTheme(dryRun).catch((error) => {
    logger.error('Migration failed', { error });
    process.exit(1);
  });
}
