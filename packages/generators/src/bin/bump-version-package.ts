#!/usr/bin/env tsx

/**
 * Package Version Bump CLI Entry Point
 *
 * Command-line interface for bumping a specific package's version in the monorepo.
 * This is the executable entry point that calls the main bump-version-package
 * command implementation.
 *
 * **Purpose:**
 * Enables independent versioning for packages within the monorepo. Each package
 * can have its own version number and release cycle, independent of other packages
 * or the root project version.
 *
 * **Usage:**
 * ```bash
 * pnpm exec heyclaude-bump-version-package <package-name> [major|minor|patch]
 * ```
 *
 * **Arguments:**
 * - `<package-name>` (required) - The name of the package (e.g., "mcp-server").
 *   Must match the directory name in `packages/`.
 * - `[major|minor|patch]` (required) - The type of version bump:
 *   - `major` - Breaking changes (1.0.0 → 2.0.0)
 *   - `minor` - New features (1.0.0 → 1.1.0)
 *   - `patch` - Bug fixes (1.0.0 → 1.0.1)
 *
 * **Semantic Versioning:**
 * Follows [Semantic Versioning 2.0.0](https://semver.org/) specification:
 * - **MAJOR** (X.0.0): Breaking changes, major redesigns, architecture changes
 * - **MINOR** (0.X.0): New features, new pages/sections, significant improvements
 * - **PATCH** (0.0.X): Bug fixes, small improvements, documentation updates
 *
 * **Examples:**
 * ```bash
 * # Bump minor version for mcp-server (1.0.0 → 1.1.0)
 * pnpm exec heyclaude-bump-version-package mcp-server minor
 *
 * # Bump patch version for mcp-server (1.0.0 → 1.0.1)
 * pnpm exec heyclaude-bump-version-package mcp-server patch
 *
 * # Bump major version for mcp-server (1.0.0 → 2.0.0)
 * pnpm exec heyclaude-bump-version-package mcp-server major
 * ```
 *
 * **Complete Release Workflow:**
 *
 * 1. **Generate Changelog** (recommended):
 *    ```bash
 *    pnpm changelog:generate:mcp-server
 *    ```
 *
 * 2. **Bump Version**:
 *    ```bash
 *    pnpm bump:mcp-server:minor
 *    ```
 *
 * 3. **Commit Changes**:
 *    ```bash
 *    git add packages/mcp-server/package.json packages/mcp-server/CHANGELOG.md
 *    git commit -m "chore(mcp-server): bump version to X.Y.Z"
 *    ```
 *
 * 4. **Create Namespaced Tag**:
 *    ```bash
 *    git tag mcp-server-vX.Y.Z
 *    git push origin main --tags
 *    ```
 *
 * 5. **GitHub Release** (automatic):
 *    GitHub Actions automatically publishes to npm and creates a release.
 *
 * **What This Script Does:**
 * - Reads current version from `packages/{package-name}/package.json`
 * - Increments version based on bump type (major/minor/patch)
 * - Writes updated version back to `package.json`
 * - Provides next steps for completing the release
 *
 * **Output:**
 * - Updates: `packages/{package-name}/package.json` (version field)
 * - Provides next steps: commit, tag, push instructions
 *
 * @throws {Error} Exits process with code 1 if:
 * - Package name is missing or invalid
 * - Version type is missing or invalid (not major/minor/patch)
 * - Package directory doesn't exist
 * - package.json cannot be read or written
 *
 * @see {@link ../commands/bump-version-package.ts | runBumpPackageVersion} - Main implementation
 * @see {@link ../changelog-package.ts | Package Changelog Generation}
 * @see {@link ../../../../packages/mcp-server/.github/workflows/release.yml | GitHub Release Workflow}
 * @see {@link https://semver.org/ | Semantic Versioning Specification}
 */

import { normalizeError } from '@heyclaude/shared-runtime';

import { runBumpPackageVersion } from '../commands/bump-version-package.ts';
import { logger } from '../toolkit/logger.ts';

runBumpPackageVersion().catch((error) => {
  logger.error('❌ Unhandled error in main', normalizeError(error, 'Package version bump failed'), {
    command: 'bump-version-package',
  });
  process.exit(1);
});
