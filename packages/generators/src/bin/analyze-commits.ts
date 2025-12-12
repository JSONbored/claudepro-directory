#!/usr/bin/env tsx

/**
 * Commit Analysis CLI Entry Point
 *
 * Command-line interface for analyzing commits to determine version bump type.
 *
 * **Usage:**
 * ```bash
 * git log --pretty=format:"%s" | pnpm exec heyclaude-analyze-commits
 * ```
 *
 * **Output:**
 * - `major` - Breaking changes detected
 * - `minor` - New features detected
 * - `patch` - Bug fixes or other changes
 *
 * @see {@link ../commands/analyze-commits.ts | runAnalyzeCommits} - Main implementation
 */

import { normalizeError } from '@heyclaude/shared-runtime';

import { runAnalyzeCommits } from '../commands/analyze-commits.js';
import { logger } from '../toolkit/logger.js';

runAnalyzeCommits().catch((error) => {
  logger.error(
    '❌ Unhandled error in main',
    normalizeError(error, 'Commit analysis failed'),
    { command: 'analyze-commits' }
  );
  process.exit(1);
});
