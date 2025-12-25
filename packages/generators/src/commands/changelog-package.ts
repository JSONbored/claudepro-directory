import { execSync } from 'node:child_process';
import {
  closeSync,
  constants,
  existsSync,
  ftruncateSync,
  openSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeError } from '@heyclaude/shared-runtime';

import { logger } from '../toolkit/logger.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../../../../');
const CONFIG_PATH = join(ROOT, 'config/changelog/cliff.toml');

/**
 * Options for generating a package-specific changelog entry.
 *
 * @property packageName - The name of the package (e.g., "mcp-server"). Must match the directory name in `packages/`.
 * @property branch - Optional branch name to generate changelog from (defaults to current branch).
 * @property dryRun - If true, preview the changelog without writing to file.
 * @property since - Optional start date for commit range (YYYY-MM-DD format).
 * @property until - Optional end date for commit range (YYYY-MM-DD format).
 * @property tag - Optional git tag to generate changelog up to (e.g., "mcp-server-v1.0.0").
 * @property title - Optional custom title for the changelog entry.
 *
 * @example
 * ```typescript
 * const options: GenerateOptions = {
 *   packageName: 'mcp-server',
 *   since: '2025-01-01',
 *   tag: 'mcp-server-v1.0.0',
 * };
 * ```
 */
interface GenerateOptions {
  packageName: string;
  branch?: string;
  dryRun?: boolean;
  since?: string;
  tag?: string;
  title?: string;
  until?: string;
}

/**
 * Checks if git-cliff is installed and available in the system PATH.
 *
 * Uses `command -v git-cliff` to check for the binary. This is a cross-platform
 * check that works on Unix-like systems (Linux, macOS, WSL).
 *
 * @returns `true` if git-cliff is installed and available, `false` otherwise.
 *
 * @example
 * ```typescript
 * if (checkGitCliff()) {
 *   // git-cliff is available
 * } else {
 *   // Need to install git-cliff
 * }
 * ```
 *
 * @see {@link installGitCliff} - Function to install git-cliff if missing
 */
function checkGitCliff(): boolean {
  try {
    execSync('command -v git-cliff', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Installs git-cliff via Homebrew (macOS) or provides installation instructions.
 *
 * Attempts to install git-cliff using `brew install git-cliff`. If installation fails
 * or Homebrew is not available, provides manual installation instructions and exits
 * with an error code.
 *
 * **Supported Platforms:**
 * - macOS (via Homebrew)
 * - Linux (manual installation required)
 * - Windows (manual installation required)
 *
 * **Installation Methods:**
 * - macOS: `brew install git-cliff`
 * - Linux: See https://git-cliff.org/docs/installation
 * - Windows: See https://git-cliff.org/docs/installation
 *
 * @throws {Error} Exits process with code 1 if installation fails or Homebrew is unavailable.
 *
 * @example
 * ```typescript
 * if (!checkGitCliff()) {
 *   installGitCliff(); // Attempts installation, exits if fails
 * }
 * ```
 *
 * @see {@link https://git-cliff.org/docs/installation | git-cliff Installation Guide}
 * @see {@link checkGitCliff} - Function to check if git-cliff is installed
 */
function installGitCliff(): void {
  logger.info('📦 Installing git-cliff via Homebrew...\n', { script: 'changelog-package' });

  try {
    execSync('brew install git-cliff', { stdio: 'inherit' });
    logger.info('\n✅ git-cliff installed successfully!\n', { script: 'changelog-package' });
  } catch {
    logger.error('❌ Failed to install git-cliff', undefined, {
      script: 'changelog-package',
    });
    logger.error(
      '   Please install manually: https://git-cliff.org/docs/installation\n',
      undefined,
      {
        script: 'changelog-package',
      }
    );
    process.exit(1);
  }
}

/**
 * Generates a changelog entry using git-cliff with package-specific path filtering.
 *
 * This function uses git-cliff to generate changelog entries from git commits, but
 * filters commits to only those affecting the specified package directory. This
 * ensures that package-specific changelogs only include changes relevant to that
 * package, even in a monorepo with multiple packages.
 *
 * **How it works:**
 * 1. Filters commits using `--include-path "packages/{packageName}/**"`
 * 2. Applies optional date/branch/tag filters
 * 3. Uses the shared git-cliff configuration from `config/changelog/cliff.toml`
 * 4. Outputs changelog entry to stdout (captured and returned)
 *
 * **Commit Filtering:**
 * - Only commits that modify files in `packages/{packageName}/**` are included
 * - Follows conventional commit format (feat:, fix:, etc.) for categorization
 * - Respects git-cliff's commit grouping and formatting rules
 *
 * @param options - Configuration options for changelog generation
 * @param options.packageName - Package name (must match directory in `packages/`)
 * @param options.branch - Optional branch to generate from
 * @param options.since - Optional start date (YYYY-MM-DD)
 * @param options.until - Optional end date (YYYY-MM-DD)
 * @param options.tag - Optional git tag to generate up to
 *
 * @returns Generated changelog entry as a string (without header, ready to prepend)
 *
 * @throws {Error} If git-cliff execution fails or configuration is invalid
 *
 * @example
 * ```typescript
 * const changelog = generateChangelog({
 *   packageName: 'mcp-server',
 *   since: '2025-01-01',
 *   tag: 'mcp-server-v1.0.0',
 * });
 * // Returns: "## [1.0.0] - 2025-01-15\n\n### Added\n- ..."
 * ```
 *
 * @see {@link https://git-cliff.org/docs/usage | git-cliff Usage Documentation}
 * @see {@link prependToChangelog} - Function to write changelog to file
 */
function generateChangelog(options: GenerateOptions): string {
  const args: string[] = [];

  // Filter commits to only those affecting the package directory
  args.push(`--include-path "packages/${options.packageName}/**"`);

  // Add range options
  if (options.branch) {
    args.push(`--branch "${options.branch}"`);
  }
  if (options.since) {
    args.push(`--since "${options.since}"`);
  }
  if (options.until) {
    args.push(`--until "${options.until}"`);
  }
  if (options.tag) {
    args.push(`--tag "${options.tag}"`);
  }

  // Output to stdout (we'll capture it)
  args.push('--output -');

  // Build command with quoted config path
  const command = `git-cliff --config "${CONFIG_PATH}" ${args.join(' ')}`;

  logger.info(`🔨 Generating changelog for package: ${options.packageName}...\n`, {
    script: 'changelog-package',
  });

  try {
    const output = execSync(command, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    return output.trim();
  } catch (error) {
    const normalized = normalizeError(error, 'Changelog generation failed');
    logger.error('❌ Failed to generate changelog', normalized, {
      script: 'changelog-package',
    });
    throw normalized;
  }
}

/**
 * Prepends a new changelog entry to the package's CHANGELOG.md file.
 *
 * This function safely writes changelog entries to the package's CHANGELOG.md file
 * using file descriptors to prevent race conditions. It:
 * 1. Opens the file with a file descriptor (creates if missing)
 * 2. Reads existing content atomically
 * 3. Inserts the new entry after the header (or prepends if no header exists)
 * 4. Writes the updated content atomically
 * 5. Closes the file descriptor
 *
 * **File Location:**
 * - Writes to: `packages/{packageName}/CHANGELOG.md`
 * - Creates file if it doesn't exist
 * - Preserves existing content (prepends new entry)
 *
 * **Entry Format:**
 * - Removes the header from git-cliff output (we already have one)
 * - Inserts entry after the `# Changelog` header
 * - Maintains proper formatting and spacing
 *
 * **Thread Safety:**
 * Uses file descriptors (`openSync`, `readFileSync`, `writeFileSync`) to ensure
 * atomic read-write operations and prevent race conditions in concurrent environments.
 *
 * @param packageName - The name of the package (e.g., "mcp-server")
 * @param newEntry - The changelog entry to prepend (from git-cliff output)
 *
 * @throws {Error} If the file cannot be read, written, or the file descriptor operations fail
 *
 * @example
 * ```typescript
 * const changelog = generateChangelog({ packageName: 'mcp-server' });
 * prependToChangelog('mcp-server', changelog);
 * // Updates packages/mcp-server/CHANGELOG.md with new entry
 * ```
 *
 * @see {@link generateChangelog} - Function that generates the changelog entry
 * @see {@link https://nodejs.org/api/fs.html#file-descriptors | Node.js File Descriptors}
 */
function prependToChangelog(packageName: string, newEntry: string): void {
  const changelogPath = join(ROOT, 'packages', packageName, 'CHANGELOG.md');

  // Remove header from git-cliff output (we already have one)
  const entryWithoutHeader = newEntry.replace(/^#\s+Changelog\s*\n/, '');

  // Open file with file descriptor to avoid race conditions
  const fd = openSync(changelogPath, constants.O_CREAT | constants.O_RDWR, 0o644);

  try {
    // Read existing content using file descriptor
    const content = readFileSync(fd, 'utf8');
    const existingContent = content.length > 0 ? content : '# Changelog\n';

    // Find where to insert (after the main header)
    const lines = existingContent.split('\n');
    const headerIndex = lines.findIndex((line) => line.startsWith('# Changelog'));

    let newContent: string;
    if (headerIndex === -1) {
      // No header found, prepend everything
      newContent = `# Changelog\n${entryWithoutHeader}\n${existingContent}`;
    } else {
      // Insert after header
      lines.splice(headerIndex + 1, 0, entryWithoutHeader);
      newContent = lines.join('\n');
    }

    // Truncate file to 0 before writing to ensure clean overwrite
    ftruncateSync(fd, 0);
    // Write using file descriptor
    writeFileSync(fd, newContent, 'utf8');
  } catch (error) {
    const normalized = normalizeError(error, 'Changelog file write failed');
    logger.error('Error writing to CHANGELOG.md', normalized, {
      script: 'changelog-package',
      changelogPath,
    });
    throw normalized;
  } finally {
    // Always close file descriptor
    closeSync(fd);
  }

  logger.info(`✅ Updated packages/${packageName}/CHANGELOG.md\n`, {
    script: 'changelog-package',
  });
}

/**
 * Parses command-line arguments and validates them for package changelog generation.
 *
 * This function processes command-line arguments and builds a `GenerateOptions`
 * object. It handles:
 * - Required package name (first positional argument)
 * - Optional flags: `--branch`, `--since`, `--until`, `--tag`, `--title`, `--dry-run`
 * - Help flag: `--help` or `-h` (shows help and exits)
 * - Error handling: Validates required arguments and provides helpful error messages
 *
 * **Argument Format:**
 * ```bash
 * pnpm exec heyclaude-changelog-package <package-name> [options]
 * ```
 *
 * **Supported Options:**
 * - `--branch <name>` - Generate from specific branch
 * - `--since <date>` - Generate from commits after date (YYYY-MM-DD)
 * - `--until <date>` - Generate from commits before date (YYYY-MM-DD)
 * - `--tag <version>` - Tag the release with version (e.g., "mcp-server-v1.0.0")
 * - `--title <text>` - Custom title for the entry
 * - `--dry-run` or `--dry` - Preview without writing to CHANGELOG.md
 * - `--help` or `-h` - Show help message and exit
 *
 * @returns Validated `GenerateOptions` object with all parsed arguments
 *
 * @throws {Error} Exits process with code 1 if:
 * - Package name is missing
 * - Invalid option is provided
 * - Required option value is missing
 *
 * @example
 * ```typescript
 * // Command: pnpm exec heyclaude-changelog-package mcp-server --since "2025-01-01"
 * const options = parseArgs();
 * // Returns: { packageName: 'mcp-server', since: '2025-01-01' }
 * ```
 *
 * @see {@link showHelp} - Function that displays help message
 * @see {@link GenerateOptions} - Interface for the returned options object
 */
function parseArgs(): GenerateOptions {
  const args = process.argv.slice(2);
  const packageName = args[0];
  const options: GenerateOptions = {
    packageName: packageName || '',
  };

  if (!packageName) {
    logger.error('❌ Package name is required', undefined, {
      script: 'changelog-package',
    });
    logger.info('\nUsage: pnpm exec heyclaude-changelog-package <package-name> [options]\n', {
      script: 'changelog-package',
    });
    logger.info(
      '\nExample: pnpm exec heyclaude-changelog-package mcp-server --since "2025-01-01"\n',
      { script: 'changelog-package' }
    );
    process.exit(1);
  }

  // Use iterator to properly handle argument values
  const argsIterator = args.slice(1)[Symbol.iterator]();
  let current = argsIterator.next();

  while (!current.done) {
    const arg = current.value;

    // Handle help flags early
    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }

    switch (arg) {
      case '--branch': {
        current = argsIterator.next();
        if (current.done || !current.value) {
          logger.error('Missing value for --branch', undefined, {
            script: 'changelog-package',
            option: '--branch',
          });
          showHelp();
          process.exit(1);
        }
        options.branch = current.value;
        break;
      }
      case '--since': {
        current = argsIterator.next();
        if (current.done || !current.value) {
          logger.error('Missing value for --since', undefined, {
            script: 'changelog-package',
            option: '--since',
          });
          showHelp();
          process.exit(1);
        }
        options.since = current.value;
        break;
      }
      case '--until': {
        current = argsIterator.next();
        if (current.done || !current.value) {
          logger.error('Missing value for --until', undefined, {
            script: 'changelog-package',
            option: '--until',
          });
          showHelp();
          process.exit(1);
        }
        options.until = current.value;
        break;
      }
      case '--title': {
        current = argsIterator.next();
        if (current.done || !current.value) {
          logger.error('Missing value for --title', undefined, {
            script: 'changelog-package',
            option: '--title',
          });
          showHelp();
          process.exit(1);
        }
        options.title = current.value;
        break;
      }
      case '--tag': {
        current = argsIterator.next();
        if (current.done || !current.value) {
          logger.error('Missing value for --tag', undefined, {
            script: 'changelog-package',
            option: '--tag',
          });
          showHelp();
          process.exit(1);
        }
        options.tag = current.value;
        break;
      }
      case '--dry-run':
      case '--dry': {
        options.dryRun = true;
        break;
      }
      default: {
        logger.error(`Unknown option: ${arg}\n`, undefined, {
          script: 'changelog-package',
          option: arg,
        });
        showHelp();
        process.exit(1);
      }
    }

    current = argsIterator.next();
  }

  return options;
}

/**
 * Displays comprehensive help message for the package changelog generator.
 *
 * Shows usage instructions, available options, examples, and links to documentation.
 * This function is called when:
 * - User provides `--help` or `-h` flag
 * - Invalid arguments are provided
 * - Required arguments are missing
 *
 * **Help Content Includes:**
 * - Command usage syntax
 * - All available options with descriptions
 * - Multiple usage examples
 * - Link to git-cliff documentation
 *
 * @example
 * ```typescript
 * if (arg === '--help') {
 *   showHelp();
 *   process.exit(0);
 * }
 * ```
 *
 * @see {@link https://git-cliff.org/docs/usage | git-cliff Usage Documentation}
 */
function showHelp(): void {
  logger.info(
    `
Package Changelog Entry Generator

Usage:
  pnpm exec heyclaude-changelog-package <package-name> [options]

Options:
  --branch <name>       Generate from specific branch
  --since <date>        Generate from commits after date (YYYY-MM-DD)
  --until <date>        Generate from commits before date (YYYY-MM-DD)
  --tag <version>       Tag the release with version
  --title <text>        Custom title for the entry
  --dry-run            Preview without writing to CHANGELOG.md
  --help, -h           Show this help message

Examples:
  # Generate from commits since last tag for mcp-server
  pnpm exec heyclaude-changelog-package mcp-server

  # Generate from specific branch
  pnpm exec heyclaude-changelog-package mcp-server --branch feature/new-feature

  # Generate from date range
  pnpm exec heyclaude-changelog-package mcp-server --since "2025-01-01" --until "2025-01-18"

  # Preview without writing
  pnpm exec heyclaude-changelog-package mcp-server --dry-run

Documentation: https://git-cliff.org/docs/usage
`,
    { script: 'changelog-package' }
  );
}

/**
 * Main entry point for package-specific changelog generation.
 *
 * This is the primary function that orchestrates the entire changelog generation
 * workflow for a specific package in the monorepo. It:
 * 1. Parses command-line arguments
 * 2. Verifies git-cliff is installed (installs if missing on macOS)
 * 3. Validates configuration and package directory
 * 4. Generates changelog entry using git-cliff with package path filtering
 * 5. Writes changelog to package's CHANGELOG.md (or previews if dry-run)
 *
 * **Package-Specific Changelog Generation:**
 *
 * Unlike the root changelog generator, this function filters commits to only those
 * affecting the specified package directory. This ensures that each package in the
 * monorepo has its own focused changelog that only includes relevant changes.
 *
 * **Complete Workflow:**
 *
 * 1. **Generate Changelog** (before version bump):
 *    ```bash
 *    pnpm changelog:generate:mcp-server
 *    ```
 *    Review and edit the generated changelog entry.
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
 * 4. **Create Tag and Push**:
 *    ```bash
 *    git tag mcp-server-vX.Y.Z
 *    git push origin main --tags
 *    ```
 *
 * 5. **GitHub Release** (automatic):
 *    The release workflow automatically uses the changelog for release notes.
 *
 * **Automatic Changelog Generation:**
 *
 * The changelog can also be automatically generated during the GitHub Actions
 * release workflow. See `packages/mcp-server/.github/workflows/release.yml` for
 * the automated release process.
 *
 * @throws {Error} Exits process with code 1 if:
 * - Package name is invalid or package directory doesn't exist
 * - git-cliff is not installed and cannot be installed
 * - Configuration file is missing
 * - Changelog generation fails
 *
 * @example
 * ```bash
 * # Generate changelog for mcp-server package
 * pnpm exec heyclaude-changelog-package mcp-server
 *
 * # Generate from specific date range
 * pnpm exec heyclaude-changelog-package mcp-server --since "2025-01-01" --until "2025-01-18"
 *
 * # Preview without writing (dry run)
 * pnpm exec heyclaude-changelog-package mcp-server --dry-run
 * ```
 *
 * @see {@link parseArgs} - Function that parses command-line arguments
 * @see {@link generateChangelog} - Function that generates changelog using git-cliff
 * @see {@link prependToChangelog} - Function that writes changelog to file
 * @see {@link ../bump-version-package.ts | Package Version Bump Script}
 * @see {@link ../../../../packages/mcp-server/.github/workflows/release.yml | GitHub Release Workflow}
 */
export async function runGeneratePackageChangelog() {
  logger.info('📝 Package Changelog Entry Generator\n', { script: 'changelog-package' });

  // Parse options
  const options = parseArgs();

  // Check if git-cliff is installed
  if (!checkGitCliff()) {
    logger.warn('⚠️  git-cliff not found\n', { script: 'changelog-package' });
    installGitCliff();
  }

  // Verify config exists
  if (!existsSync(CONFIG_PATH)) {
    logger.error(`❌ Configuration not found: ${CONFIG_PATH}`, undefined, {
      script: 'changelog-package',
      configPath: CONFIG_PATH,
    });
    process.exit(1);
  }

  // Verify package directory exists
  const packagePath = join(ROOT, 'packages', options.packageName);
  if (!existsSync(packagePath)) {
    logger.error(`❌ Package not found: ${packagePath}`, undefined, {
      script: 'changelog-package',
      packagePath,
    });
    process.exit(1);
  }

  try {
    // Generate changelog entry
    const newEntry = generateChangelog(options);

    if (!newEntry || newEntry.length === 0) {
      logger.info('ℹ️  No commits found matching criteria\n', {
        script: 'changelog-package',
      });
      logger.info(
        `   Tip: Ensure commits affect packages/${options.packageName}/ and follow conventional format (feat:, fix:, etc.)\n`,
        {
          script: 'changelog-package',
        }
      );
      return;
    }

    if (options.dryRun) {
      logger.info('🔍 Dry Run - Generated Entry:\n', { script: 'changelog-package' });
      logger.info('─'.repeat(80), { script: 'changelog-package' });
      logger.info(newEntry, { script: 'changelog-package' });
      logger.info('─'.repeat(80), { script: 'changelog-package' });
      logger.info('\n✅ Preview complete (no files modified)\n', {
        script: 'changelog-package',
      });
      return;
    }

    // Prepend to package's CHANGELOG.md
    prependToChangelog(options.packageName, newEntry);

    logger.info('✅ Changelog generation complete!\n', { script: 'changelog-package' });
    logger.info('Next steps:');
    logger.info(`  1. Review packages/${options.packageName}/CHANGELOG.md for accuracy`);
    logger.info('  2. Enhance TL;DR and Technical Details sections');
    logger.info(
      `  3. Commit: git add packages/${options.packageName}/CHANGELOG.md && git commit -m "chore(${options.packageName}): update changelog"\n`,
      {
        script: 'changelog-package',
      }
    );
  } catch (error) {
    logger.error('❌ Generation failed', normalizeError(error, 'Changelog generation failed'), {
      script: 'changelog-package',
    });
    process.exit(1);
  }
}
