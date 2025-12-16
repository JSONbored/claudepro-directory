#!/usr/bin/env tsx

/**
 * Changelog Entry Extractor CLI Entry Point
 *
 * Command-line interface for extracting the latest changelog entry as JSON.
 *
 * **Usage:**
 * ```bash
 * pnpm exec heyclaude-extract-changelog-entry
 * ```
 *
 * **Output:**
 * JSON object with changelog entry data (version, date, tldr, sections, content)
 *
 * @see {@link ../commands/extract-changelog-entry.ts | runExtractChangelogEntry} - Main implementation
 */

import { normalizeError } from '@heyclaude/shared-runtime';

import { runExtractChangelogEntry } from '../commands/extract-changelog-entry.ts';
import { logger } from '../toolkit/logger.ts';

runExtractChangelogEntry().catch((error) => {
  logger.error(
    '❌ Unhandled error in main',
    normalizeError(error, 'Changelog extraction failed'),
    { command: 'extract-changelog-entry' }
  );
  process.exit(1);
});
