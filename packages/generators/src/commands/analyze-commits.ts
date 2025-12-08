#!/usr/bin/env tsx

/**
 * Commit Analysis Script
 *
 * Analyzes conventional commits to determine the appropriate semantic version bump type.
 * Reads commit messages from stdin (one per line) and outputs: major, minor, or patch
 *
 * **Semantic Versioning Rules:**
 * - **Major** (1.0.0 → 2.0.0): Breaking changes (`feat!:`, `BREAKING CHANGE:`)
 * - **Minor** (1.0.0 → 1.1.0): New features (`feat:`)
 * - **Patch** (1.0.0 → 1.0.1): Bug fixes (`fix:`), refactors, performance, style
 *
 * **Conventional Commit Types:**
 * - `feat!:` or `feat:` with `BREAKING CHANGE:` → MAJOR
 * - `feat:` → MINOR
 * - `fix:`, `perf:`, `refactor:`, `style:` → PATCH
 * - `chore:`, `docs:`, `test:`, `ci:`, `build:` → Ignored (no version bump)
 *
 * @example
 * ```bash
 * # Analyze commits from git log
 * git log --pretty=format:"%s" | pnpm exec heyclaude-analyze-commits
 *
 * # Or pipe directly
 * echo -e "feat: add search\nfix: resolve bug" | pnpm exec heyclaude-analyze-commits
 * ```
 *
 * @see {@link https://www.conventionalcommits.org/ | Conventional Commits}
 * @see {@link https://semver.org/ | Semantic Versioning}
 * @see {@link ../bump-version.ts | Version Bump Script}
 */

import { normalizeError } from '@heyclaude/shared-runtime';

import { logger } from '../toolkit/logger.js';

/**
 * Analyzes commit messages and determines version bump type.
 *
 * @param commitMessages - Array of commit message strings (one per line)
 * @returns 'major', 'minor', or 'patch'
 */
function analyzeCommits(commitMessages: string[]): 'major' | 'minor' | 'patch' {
  let hasBreakingChange = false;
  let hasFeature = false;
  let hasFix = false;

  for (const message of commitMessages) {
    const trimmed = message.trim();
    if (!trimmed) continue;

    // Check for breaking changes
    if (trimmed.startsWith('feat!:') || trimmed.includes('BREAKING CHANGE:')) {
      hasBreakingChange = true;
      continue;
    }

    // Check for features
    if (trimmed.startsWith('feat:')) {
      hasFeature = true;
      continue;
    }

    // Check for fixes
    if (
      trimmed.startsWith('fix:') ||
      trimmed.startsWith('perf:') ||
      trimmed.startsWith('refactor:') ||
      trimmed.startsWith('style:')
    ) {
      hasFix = true;
      continue;
    }

    // Ignore: chore, docs, test, ci, build
    // These don't trigger version bumps
  }

  // Determine bump type based on priority
  if (hasBreakingChange) {
    return 'major';
  }
  if (hasFeature) {
    return 'minor';
  }
  if (hasFix) {
    return 'patch';
  }

  // Default to patch if no conventional commits found
  return 'patch';
}

/**
 * Main entry point for commit analysis.
 *
 * Reads commit messages from stdin and outputs the version bump type.
 */
export async function runAnalyzeCommits() {
  try {
    // Read from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }

    const input = Buffer.concat(chunks).toString('utf8');
    const commitMessages = input
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (commitMessages.length === 0) {
      logger.warn('No commit messages found in input', { script: 'analyze-commits' });
      // Default to patch if no commits
      process.stdout.write('patch\n');
      process.exit(0);
    }

    const bumpType = analyzeCommits(commitMessages);

    logger.info(`Analyzed ${commitMessages.length} commits, determined: ${bumpType}`, {
      script: 'analyze-commits',
      commitCount: commitMessages.length,
      bumpType,
    });

    // Output to stdout (for use in scripts)
    process.stdout.write(`${bumpType}\n`);
    process.exit(0);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to analyze commits');
    logger.error('❌ Failed to analyze commits', normalized, {
      script: 'analyze-commits',
    });
    // Default to patch on error
    process.stdout.write('patch\n');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAnalyzeCommits();
}
