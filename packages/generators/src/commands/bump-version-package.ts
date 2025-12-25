import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeError } from '@heyclaude/shared-runtime';

import { logger } from '../toolkit/logger.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * Path to repository root from this file location.
 *
 * From `packages/generators/src/commands/bump-version-package.ts`:
 * - `../../../../` = 4 levels up to repository root
 * - Resolves to root directory containing `package.json`
 */
const ROOT = join(__dirname, '../../../../');

/**
 * Bumps the version in a specific package's package.json following semantic versioning.
 *
 * This function reads the current version from the package's package.json file,
 * increments it based on the provided type (major, minor, or patch), and writes
 * the updated version back to the file atomically.
 *
 * **How It Works:**
 * 1. Reads `packages/{packageName}/package.json`
 * 2. Parses current version (e.g., "1.2.3")
 * 3. Increments based on bump type:
 *    - Major: increments major, resets minor and patch to 0
 *    - Minor: increments minor, resets patch to 0
 *    - Patch: increments patch only
 * 4. Writes updated version back to package.json
 *
 * **Semantic Versioning Rules:**
 * - **Major** (1.0.0 → 2.0.0): Breaking changes, major redesigns, architecture changes
 * - **Minor** (1.0.0 → 1.1.0): New features, new pages/sections, significant improvements
 * - **Patch** (1.0.0 → 1.0.1): Bug fixes, small improvements, documentation updates
 *
 * **File Location:**
 * - Reads/writes: `packages/{packageName}/package.json`
 * - Updates only the `version` field
 * - Preserves all other package.json content and formatting
 *
 * @param packageName - The name of the package (e.g., "mcp-server").
 *   Must match the directory name in `packages/`.
 * @param type - The type of version bump: 'major', 'minor', or 'patch'.
 *   Determines which version component to increment.
 *
 * @returns The new version string (e.g., "1.2.3") after the bump.
 *
 * @throws {Error} If:
 * - Package directory doesn't exist
 * - package.json cannot be read or parsed
 * - package.json cannot be written
 * - Current version is invalid format
 *
 * @example
 * ```typescript
 * // Bump minor version (1.1.0 → 1.2.0)
 * const newVersion = bumpPackageVersion('mcp-server', 'minor');
 * console.log(newVersion); // "1.2.0"
 *
 * // Bump patch version (1.2.0 → 1.2.1)
 * const newVersion = bumpPackageVersion('mcp-server', 'patch');
 * console.log(newVersion); // "1.2.1"
 *
 * // Bump major version (1.2.1 → 2.0.0)
 * const newVersion = bumpPackageVersion('mcp-server', 'major');
 * console.log(newVersion); // "2.0.0"
 * ```
 *
 * @see {@link https://semver.org/ | Semantic Versioning Specification}
 * @see {@link runBumpPackageVersion} - Main entry point that uses this function
 */
function bumpPackageVersion(packageName: string, type: 'major' | 'minor' | 'patch'): string {
  const packageJsonPath = join(ROOT, 'packages', packageName, 'package.json');

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const [major, minor, patch] = packageJson.version.split('.').map(Number);

    let newVersion: string;
    if (type === 'major') {
      newVersion = `${major + 1}.0.0`;
    } else if (type === 'minor') {
      newVersion = `${major}.${minor + 1}.0`;
    } else {
      newVersion = `${major}.${minor}.${patch + 1}`;
    }

    packageJson.version = newVersion;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    return newVersion;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to bump package version');
    logger.error('Failed to bump package version', normalized, {
      script: 'bump-version-package',
      packageName,
      packageJsonPath,
    });
    throw normalized;
  }
}

/**
 * Main entry point for the package-specific version bump command.
 *
 * Parses command-line arguments, validates the package name and version bump type,
 * bumps the version in the package's package.json, and provides next steps for
 * completing the release workflow.
 *
 * **Complete Release Workflow for Package:**
 *
 * 1. **Generate Changelog** (recommended):
 *    ```bash
 *    pnpm changelog:generate:mcp-server
 *    ```
 *    Review and edit the generated changelog entry before proceeding.
 *
 * 2. **Bump Version**:
 *    ```bash
 *    pnpm bump:mcp-server:patch    # For bug fixes
 *    pnpm bump:mcp-server:minor    # For new features
 *    pnpm bump:mcp-server:major    # For breaking changes
 *    ```
 *
 * 3. **Commit Changes**:
 *    ```bash
 *    git add packages/mcp-server/package.json packages/mcp-server/CHANGELOG.md
 *    git commit -m "chore(mcp-server): bump version to X.Y.Z"
 *    ```
 *
 * 4. **Create Git Tag** (namespaced):
 *    ```bash
 *    git tag mcp-server-vX.Y.Z
 *    git push origin main --tags
 *    ```
 *
 * 5. **GitHub Release** (automatic):
 *    When you push a tag matching `mcp-server-v*.*.*`, GitHub Actions automatically
 *    creates a release using packages/mcp-server/CHANGELOG.md as release notes.
 *
 * **When to Bump:**
 * - **Patch**: Bug fixes, small improvements, documentation, internal refactoring
 * - **Minor**: New features, new pages/sections, significant improvements, new functionality
 * - **Major**: Breaking changes, major redesigns, architecture changes, API changes
 *
 * @throws {Error} If the package name or version type is invalid, or if package.json cannot be read/written
 *
 * @example
 * ```bash
 * # Bump minor version for mcp-server (1.1.0 → 1.2.0)
 * pnpm exec heyclaude-bump-version-package mcp-server minor
 * ```
 *
 * @see {@link bumpPackageVersion} - Core version bumping logic
 * @see {@link ../changelog-package.ts | Package Changelog Generation}
 * @see {@link ../../../../packages/mcp-server/.github/workflows/release.yml | GitHub Release Workflow}
 */
export async function runBumpPackageVersion() {
  logger.info('📦 Package Version Bump Script\n', { script: 'bump-version-package' });

  // Parse command line arguments
  const args = process.argv.slice(2);
  const packageName = args[0];
  const type = args[1] as 'major' | 'minor' | 'patch';

  if (!packageName) {
    logger.error('❌ Package name is required', undefined, {
      script: 'bump-version-package',
    });
    logger.info(
      '\nUsage: pnpm exec heyclaude-bump-version-package <package-name> [major|minor|patch]\n',
      {
        script: 'bump-version-package',
      }
    );
    logger.info('\nExample: pnpm exec heyclaude-bump-version-package mcp-server minor\n', {
      script: 'bump-version-package',
    });
    process.exit(1);
  }

  if (!['major', 'minor', 'patch'].includes(type)) {
    logger.error('❌ Invalid version type. Use: major, minor, or patch', undefined, {
      script: 'bump-version-package',
      providedType: type,
    });
    logger.info(
      '\nUsage: pnpm exec heyclaude-bump-version-package <package-name> [major|minor|patch]\n',
      {
        script: 'bump-version-package',
      }
    );
    logger.info('\nExample: pnpm exec heyclaude-bump-version-package mcp-server minor\n', {
      script: 'bump-version-package',
    });
    process.exit(1);
  }

  try {
    const newVersion = bumpPackageVersion(packageName, type);
    logger.info(`✅ Version bumped to ${newVersion} for package: ${packageName}\n`, {
      script: 'bump-version-package',
      packageName,
      newVersion,
    });

    logger.info('📝 Next Steps:\n', { script: 'bump-version-package' });
    logger.info(`1. Review and commit changes: git add packages/${packageName}/package.json\n`, {
      script: 'bump-version-package',
    });
    logger.info(`2. Create namespaced tag: git tag ${packageName}-v${newVersion}\n`, {
      script: 'bump-version-package',
    });
    logger.info(`3. Push tag: git push origin main --tags\n`, { script: 'bump-version-package' });
    logger.info(`4. GitHub Actions will automatically publish to npm and create a release\n`, {
      script: 'bump-version-package',
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Version bump failed');
    logger.error('Version bump failed', normalized, {
      script: 'bump-version-package',
      packageName,
      type,
    });
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBumpPackageVersion().catch((error) => {
    const normalized = normalizeError(error, 'Unexpected error');
    logger.error('Unexpected error', normalized, {
      script: 'bump-version-package',
    });
    process.exit(1);
  });
}
