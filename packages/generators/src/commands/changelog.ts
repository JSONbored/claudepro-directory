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

import { logger } from '../toolkit/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../../../../'); // Adjust path to root based on dist structure
const CHANGELOG_PATH = join(ROOT, 'CHANGELOG.md');
const CONFIG_PATH = join(ROOT, 'config/changelog/cliff.toml');

interface GenerateOptions {
  branch?: string;
  dryRun?: boolean;
  since?: string;
  tag?: string;
  title?: string;
  until?: string;
}

/**
 * Check if git-cliff is installed
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
 * Install git-cliff via Homebrew (macOS)
 */
function installGitCliff(): void {
  logger.info('📦 Installing git-cliff via Homebrew...\n', { script: 'changelog-generate-entry' });

  try {
    execSync('brew install git-cliff', { stdio: 'inherit' });
    logger.info('\n✅ git-cliff installed successfully!\n', { script: 'changelog-generate-entry' });
  } catch {
    logger.error('❌ Failed to install git-cliff', undefined, {
      script: 'changelog-generate-entry',
    });
    logger.error(
      '   Please install manually: https://git-cliff.org/docs/installation\n',
      undefined,
      {
        script: 'changelog-generate-entry',
      }
    );
    process.exit(1);
  }
}

/**
 * Generate changelog entry using git-cliff
 */
function generateChangelog(options: GenerateOptions): string {
  const args: string[] = [];

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

  logger.info('🔨 Generating changelog...\n', { script: 'changelog-generate-entry' });

  try {
    const output = execSync(command, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    return output.trim();
  } catch (error) {
    logger.error(
      '❌ Failed to generate changelog',
      normalizeError(error, 'Changelog generation failed'),
      {
        script: 'changelog-generate-entry',
      }
    );
    throw error;
  }
}

/**
 * Prepend new entry to CHANGELOG.md
 * Uses file descriptors to avoid race conditions between read and write operations
 */
function prependToChangelog(newEntry: string): void {
  // Remove header from git-cliff output (we already have one)
  const entryWithoutHeader = newEntry.replace(/^#\s+Changelog\s*\n/, '');

  // Open file with file descriptor to avoid race conditions
  // Use O_CREAT | O_RDWR to atomically create if it doesn't exist, or open for read-write
  // This eliminates the race condition from existsSync check
  const fd = openSync(CHANGELOG_PATH, constants.O_CREAT | constants.O_RDWR, 0o644);

  try {
    // Read existing content using file descriptor
    // readFileSync with fd reads from position 0 (beginning of file)
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
    logger.error(
      'Error writing to CHANGELOG.md',
      normalizeError(error, 'Changelog file write failed'),
      {
        script: 'changelog-generate-entry',
      }
    );
    throw error;
  } finally {
    // Always close file descriptor
    closeSync(fd);
  }

  logger.info('✅ Updated CHANGELOG.md\n', { script: 'changelog-generate-entry' });
}

/**
 * Parse command line arguments
 */
function parseArgs(): GenerateOptions {
  const args = process.argv.slice(2);
  const options: GenerateOptions = {};

  // Use iterator to properly handle argument values
  const argsIterator = args[Symbol.iterator]();
  let current = argsIterator.next();

  while (!current.done) {
    const arg = current.value;

    switch (arg) {
      case '--branch': {
        current = argsIterator.next();
        if (current.done || !current.value) {
          logger.error('Missing value for --branch', undefined, {
            script: 'changelog-generate-entry',
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
            script: 'changelog-generate-entry',
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
            script: 'changelog-generate-entry',
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
            script: 'changelog-generate-entry',
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
            script: 'changelog-generate-entry',
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
      case '--help':
      case '-h': {
        showHelp();
        process.exit(0);
        // @ts-expect-error - break is unreachable but required by Biome's noFallthroughSwitchClause rule
        break;
      }
      default: {
        logger.error(`Unknown option: ${arg}\n`, undefined, {
          script: 'changelog-generate-entry',
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
 * Show help message
 */
function showHelp(): void {
  logger.info(
    `
Changelog Entry Generator

Usage:
  pnpm exec heyclaude-changelog [options]

Options:
  --branch <name>       Generate from specific branch
  --since <date>        Generate from commits after date (YYYY-MM-DD)
  --until <date>        Generate from commits before date (YYYY-MM-DD)
  --tag <version>       Tag the release with version
  --title <text>        Custom title for the entry
  --dry-run            Preview without writing to CHANGELOG.md
  --help, -h           Show this help message

Examples:
  # Generate from commits since last tag
  pnpm exec heyclaude-changelog

  # Generate from specific branch
  pnpm exec heyclaude-changelog --branch feature/new-ui

  # Generate from date range
  pnpm exec heyclaude-changelog --since "2025-10-01" --until "2025-10-18"

  # Preview without writing
  pnpm exec heyclaude-changelog --dry-run

Documentation: https://git-cliff.org/docs/usage
`,
    { script: 'changelog-generate-entry' }
  );
}

/**
 * Main
 */
export async function runGenerateChangelog() {
  logger.info('📝 Changelog Entry Generator\n', { script: 'changelog-generate-entry' });

  // Parse options
  const options = parseArgs();

  // Check if git-cliff is installed
  if (!checkGitCliff()) {
    logger.warn('⚠️  git-cliff not found\n', { script: 'changelog-generate-entry' });
    installGitCliff();
  }

  // Verify config exists
  if (!existsSync(CONFIG_PATH)) {
    logger.error(`❌ Configuration not found: ${CONFIG_PATH}`, undefined, {
      script: 'changelog-generate-entry',
      configPath: CONFIG_PATH,
    });
    logger.error('   Run: npm run changelog:init\n', undefined, {
      script: 'changelog-generate-entry',
    });
    process.exit(1);
  }

  try {
    // Generate changelog entry
    const newEntry = generateChangelog(options);

    if (!newEntry || newEntry.length === 0) {
      logger.info('ℹ️  No commits found matching criteria\n', {
        script: 'changelog-generate-entry',
      });
      logger.info('   Tip: Ensure commits follow conventional format (feat:, fix:, etc.)\n', {
        script: 'changelog-generate-entry',
      });
      return;
    }

    if (options.dryRun) {
      logger.info('🔍 Dry Run - Generated Entry:\n', { script: 'changelog-generate-entry' });
      logger.info('─'.repeat(80), { script: 'changelog-generate-entry' });
      logger.info(newEntry, { script: 'changelog-generate-entry' });
      logger.info('─'.repeat(80), { script: 'changelog-generate-entry' });
      logger.info('\n✅ Preview complete (no files modified)\n', {
        script: 'changelog-generate-entry',
      });
      return;
    }

    // Prepend to CHANGELOG.md
    prependToChangelog(newEntry);

    logger.info('✅ Changelog generation complete!\n', { script: 'changelog-generate-entry' });
    logger.info('Next steps:');
    logger.info('  1. Review CHANGELOG.md for accuracy');
    logger.info('  2. Enhance TL;DR and Technical Details sections');
    logger.info('  3. Run: npm run build:content (triggers cache invalidation)');
    logger.info('  4. Commit: git add CHANGELOG.md && git commit -m "chore: update changelog"\n', {
      script: 'changelog-generate-entry',
    });
  } catch (error) {
    logger.error(
      '❌ Generation failed',
      normalizeError(error, 'Changelog generation failed'),
      {
        script: 'changelog-generate-entry',
      }
    );
    process.exit(1);
  }
}
