import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeError } from '@heyclaude/shared-runtime';

import { logger } from '../toolkit/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * Path to repository root from this file location.
 *
 * From `packages/generators/src/commands/bump-version.ts`:
 * - `../../../../` = 4 levels up to repository root
 * - Resolves to root directory containing `package.json`
 */
const ROOT = join(__dirname, '../../../../');
const PACKAGE_JSON_PATH = join(ROOT, 'package.json');

/**
 * Bumps the version in the root package.json following semantic versioning.
 *
 * This function reads the current version from the root package.json, increments it
 * based on the provided type (major, minor, or patch), and writes the updated version
 * back to the file.
 *
 * **Semantic Versioning Rules:**
 * - **Major** (1.0.0 → 2.0.0): Breaking changes, major redesigns, architecture changes
 * - **Minor** (1.0.0 → 1.1.0): New features, new pages/sections, significant improvements
 * - **Patch** (1.0.0 → 1.0.1): Bug fixes, small improvements, documentation updates
 *
 * @param type - The type of version bump: 'major', 'minor', 'patch', or 'auto'
 * @returns The new version string (e.g., "1.2.3")
 *
 * @example
 * ```typescript
 * const newVersion = bumpVersion('minor'); // "1.1.0" → "1.2.0"
 * ```
 *
 * @see {@link https://semver.org/ | Semantic Versioning Specification}
 * @see {@link runBumpVersion} - Main entry point that uses this function
 * @see {@link ../../../../.github/workflows/release.yml | GitHub Release Workflow}
 * @see {@link ../analyze-commits.ts | Commit Analysis} - Used for 'auto' mode
 */
function bumpVersion(type: 'major' | 'minor' | 'patch' | 'auto'): string {
  const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const [major, minor, patch] = packageJson.version.split('.').map(Number);

  let newVersion: string;
  if (type === 'major') {
    newVersion = `${major + 1}.0.0`;
  } else if (type === 'minor') {
    newVersion = `${major}.${minor + 1}.0`;
  } else if (type === 'patch') {
    newVersion = `${major}.${minor}.${patch + 1}`;
  } else {
    // 'auto' mode - default to patch if not determined externally
    // In practice, 'auto' should be resolved to major/minor/patch before calling this function
    logger.warn('Auto-bump mode not fully implemented, defaulting to patch', {
      script: 'bump-version',
    });
    newVersion = `${major}.${minor}.${patch + 1}`;
  }

  packageJson.version = newVersion;
  writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');

  return newVersion;
}

/**
 * Main entry point for the version bump command.
 *
 * Parses command-line arguments, validates the version bump type, bumps the version
 * in package.json, and provides next steps for completing the release workflow.
 *
 * **Complete Release Workflow:**
 *
 * 1. **Generate Changelog** (recommended):
 *    ```bash
 *    pnpm changelog:generate
 *    ```
 *    Review and edit the generated changelog entry before proceeding.
 *
 * 2. **Bump Version**:
 *    ```bash
 *    pnpm bump:patch    # For bug fixes
 *    pnpm bump:minor    # For new features
 *    pnpm bump:major    # For breaking changes
 *    ```
 *
 * 3. **Commit Changes**:
 *    ```bash
 *    git add package.json CHANGELOG.md
 *    git commit -m "chore: bump version to X.Y.Z"
 *    ```
 *
 * 4. **Create Git Tag**:
 *    ```bash
 *    git tag vX.Y.Z
 *    git push origin main --tags
 *    ```
 *
 * 5. **GitHub Release** (automatic):
 *    When you push a tag matching `v*.*.*`, GitHub Actions automatically creates
 *    a release using CHANGELOG.md as release notes.
 *
 * **When to Bump:**
 * - **Patch**: Bug fixes, small improvements, documentation, internal refactoring
 * - **Minor**: New features, new pages/sections, significant improvements, new functionality
 * - **Major**: Breaking changes, major redesigns, architecture changes, API changes
 *
 * @throws {Error} If the version type is invalid or if package.json cannot be read/written
 *
 * @example
 * ```bash
 * # Bump minor version (1.1.0 → 1.2.0)
 * pnpm exec heyclaude-bump-version minor
 * ```
 *
 * @see {@link bumpVersion} - Core version bumping logic
 * @see {@link ../changelog.ts | Changelog Generation}
 * @see {@link ../../../../.github/workflows/release.yml | GitHub Release Workflow}
 */
export async function runBumpVersion() {
  logger.info('📦 Version Bump Script\n', { script: 'bump-version' });

  // Parse command line arguments
  const args = process.argv.slice(2);
  const type = args[0] as 'major' | 'minor' | 'patch' | 'auto';

  if (!['major', 'minor', 'patch', 'auto'].includes(type)) {
    logger.error('❌ Invalid version type. Use: major, minor, or patch', undefined, {
      script: 'bump-version',
      providedType: type,
    });
    logger.info(
      '\nUsage: pnpm exec heyclaude-bump-version [major|minor|patch]\n',
      { script: 'bump-version' }
    );
    logger.info(
      '\nOr use shortcuts: pnpm bump:patch | pnpm bump:minor | pnpm bump:major | pnpm bump:auto\n',
      { script: 'bump-version' }
    );
    process.exit(1);
  }

  try {
    const newVersion = bumpVersion(type);
    logger.info(`✅ Version bumped to ${newVersion}\n`, { script: 'bump-version' });
    logger.info('📝 Next steps:', { script: 'bump-version' });
    logger.info(`   1. git add package.json`, { script: 'bump-version' });
    logger.info(`   2. git commit -m "chore: bump version to ${newVersion}"`, {
      script: 'bump-version',
    });
    logger.info(`   3. git tag v${newVersion}`, { script: 'bump-version' });
    logger.info(`   4. git push origin main --tags\n`, { script: 'bump-version' });
    logger.info(
      '💡 Tip: Run "pnpm changelog:generate" before committing to update CHANGELOG.md\n',
      { script: 'bump-version' }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to bump version');
    logger.error('❌ Failed to bump version', normalized, {
      script: 'bump-version',
    });
    process.exit(1);
  }
}
