#!/usr/bin/env tsx

/**
 * Version Bump CLI Entry Point
 *
 * Command-line interface for bumping the application version.
 * This is the executable entry point that calls the main bump-version command.
 *
 * **Usage:**
 * ```bash
 * pnpm exec heyclaude-bump-version [major|minor|patch]
 * ```
 *
 * **Shortcuts:**
 * ```bash
 * pnpm bump:patch    # Bump patch version (1.2.3 → 1.2.4)
 * pnpm bump:minor    # Bump minor version (1.2.3 → 1.3.0)
 * pnpm bump:major    # Bump major version (1.2.3 → 2.0.0)
 * ```
 *
 * @see {@link ../commands/bump-version.ts | runBumpVersion} - Main implementation
 * @see {@link ../../../../.github/workflows/release.yml | GitHub Release Workflow}
 */

import { normalizeError } from '@heyclaude/shared-runtime';

import { runBumpVersion } from '../commands/bump-version.js';
import { logger } from '../toolkit/logger.js';

runBumpVersion().catch((error) => {
  logger.error(
    '❌ Unhandled error in main',
    normalizeError(error, 'Version bump failed'),
    { command: 'bump-version' }
  );
  process.exit(1);
});
