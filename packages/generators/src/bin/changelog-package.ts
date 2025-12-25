#!/usr/bin/env tsx

/**
 * Package Changelog CLI Entry Point
 *
 * Command-line interface for generating changelog entries for a specific package
 * in the monorepo. This is the executable entry point that calls the main
 * changelog-package command implementation.
 *
 * **Purpose:**
 * Generates package-specific changelog entries using git-cliff, filtering commits
 * to only those affecting the specified package directory. This enables each
 * package in the monorepo to maintain its own focused changelog.
 *
 * **Usage:**
 * ```bash
 * pnpm exec heyclaude-changelog-package <package-name> [options]
 * ```
 *
 * **Arguments:**
 * - `<package-name>` (required) - The name of the package (e.g., "mcp-server").
 *   Must match the directory name in `packages/`.
 *
 * **Options:**
 * - `--branch <name>` - Generate from specific branch
 * - `--since <date>` - Generate from commits after date (YYYY-MM-DD)
 * - `--until <date>` - Generate from commits before date (YYYY-MM-DD)
 * - `--tag <version>` - Tag the release with version (e.g., "mcp-server-v1.0.0")
 * - `--title <text>` - Custom title for the entry
 * - `--dry-run` or `--dry` - Preview without writing to CHANGELOG.md
 * - `--help` or `-h` - Show help message
 *
 * **Examples:**
 * ```bash
 * # Generate changelog for mcp-server (from last tag to HEAD)
 * pnpm exec heyclaude-changelog-package mcp-server
 *
 * # Generate from specific date range
 * pnpm exec heyclaude-changelog-package mcp-server --since "2025-01-01" --until "2025-01-18"
 *
 * # Generate from specific branch
 * pnpm exec heyclaude-changelog-package mcp-server --branch feature/new-feature
 *
 * # Preview without writing (dry run)
 * pnpm exec heyclaude-changelog-package mcp-server --dry-run
 * ```
 *
 * **Output:**
 * - Writes to: `packages/{package-name}/CHANGELOG.md`
 * - Prepends new entry after the `# Changelog` header
 * - Creates file if it doesn't exist
 *
 * **Integration:**
 * - Used in GitHub Actions release workflow for automatic changelog generation
 * - Can be run manually before version bumps
 * - Supports dry-run mode for previewing changes
 *
 * @throws {Error} Exits process with code 1 if:
 * - Package name is missing or invalid
 * - Package directory doesn't exist
 * - git-cliff is not installed and cannot be installed
 * - Changelog generation fails
 *
 * @see {@link ../commands/changelog-package.ts | runGeneratePackageChangelog} - Main implementation
 * @see {@link ../bump-version-package.ts | Package Version Bump Script}
 * @see {@link ../../../../packages/mcp-server/.github/workflows/release.yml | GitHub Release Workflow}
 * @see {@link https://git-cliff.org/docs/usage | git-cliff Usage Documentation}
 */

import { normalizeError } from '@heyclaude/shared-runtime';

import { runGeneratePackageChangelog } from '../commands/changelog-package.ts';
import { logger } from '../toolkit/logger.ts';

runGeneratePackageChangelog().catch((error) => {
  logger.error(
    '❌ Unhandled error in main',
    normalizeError(error, 'Package changelog generation failed'),
    {
      command: 'changelog-package',
    }
  );
  process.exit(1);
});
