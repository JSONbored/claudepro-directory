#!/usr/bin/env tsx
/**
 * Changelog Entry Generator
 *
 * Fully automated changelog generation using git-cliff.
 * Generates CHANGELOG.md entries from git commit history with smart filtering.
 *
 * **Usage:**
 *   npm run changelog:generate              # Generate from commits since last tag
 *   npm run changelog:generate -- --branch dev  # Generate from specific branch
 *   npm run changelog:generate -- --since "2025-10-01"  # Generate from date
 *   npm run changelog:generate -- --help    # Show all options
 *
 * **Workflow:**
 * 1. Reads git commit history using git-cliff
 * 2. Filters commits by conventional commit format (feat, fix, refactor, etc.)
 * 3. Generates Keep a Changelog 1.0.0 format entry
 * 4. Prepends to CHANGELOG.md
 * 5. Triggers cache invalidation and rebuild
 *
 * **Output Format:**
 * - Date: YYYY-MM-DD (commit date or current date)
 * - Title: Inferred from commit messages or provided via --title
 * - TL;DR: Auto-generated summary from first commit
 * - Sections: Added, Changed, Fixed (from conventional commits)
 * - Technical Details: File changes, validation status
 * - Deployment: Standard deployment notes
 *
 * @module scripts/changelog/generate-entry
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../..');
const CHANGELOG_PATH = join(ROOT, 'CHANGELOG.md');
const CONFIG_PATH = join(ROOT, 'config/changelog/cliff.toml');

interface GenerateOptions {
  branch?: string;
  since?: string;
  until?: string;
  title?: string;
  tag?: string;
  dryRun?: boolean;
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
  console.log('📦 Installing git-cliff via Homebrew...\n');

  try {
    execSync('brew install git-cliff', { stdio: 'inherit' });
    console.log('\n✅ git-cliff installed successfully!\n');
  } catch {
    console.error('❌ Failed to install git-cliff');
    console.error('   Please install manually: https://git-cliff.org/docs/installation\n');
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

  console.log('🔨 Generating changelog...\n');

  try {
    const output = execSync(command, {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    return output.trim();
  } catch (error) {
    console.error('❌ Failed to generate changelog');
    throw error;
  }
}

/**
 * Prepend new entry to CHANGELOG.md
 */
function prependToChangelog(newEntry: string): void {
  // Read existing CHANGELOG.md
  const existingContent = existsSync(CHANGELOG_PATH)
    ? readFileSync(CHANGELOG_PATH, 'utf-8')
    : '# Changelog\n';

  // Remove header from git-cliff output (we already have one)
  const entryWithoutHeader = newEntry.replace(/^#\s+Changelog\s*\n/, '');

  // Find where to insert (after the main header)
  const lines = existingContent.split('\n');
  const headerIndex = lines.findIndex((line) => line.startsWith('# Changelog'));

  if (headerIndex === -1) {
    // No header found, prepend everything
    const newContent = `# Changelog\n${entryWithoutHeader}\n${existingContent}`;
    writeFileSync(CHANGELOG_PATH, newContent, 'utf-8');
  } else {
    // Insert after header
    lines.splice(headerIndex + 1, 0, entryWithoutHeader);
    writeFileSync(CHANGELOG_PATH, lines.join('\n'), 'utf-8');
  }

  console.log('✅ Updated CHANGELOG.md\n');
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
      case '--branch':
        current = argsIterator.next();
        options.branch = current.value;
        break;
      case '--since':
        current = argsIterator.next();
        options.since = current.value;
        break;
      case '--until':
        current = argsIterator.next();
        options.until = current.value;
        break;
      case '--title':
        current = argsIterator.next();
        options.title = current.value;
        break;
      case '--tag':
        current = argsIterator.next();
        options.tag = current.value;
        break;
      case '--dry-run':
      case '--dry':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${arg}\n`);
        showHelp();
        process.exit(1);
    }

    current = argsIterator.next();
  }

  return options;
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
Changelog Entry Generator

Usage:
  npm run changelog:generate [options]

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
  npm run changelog:generate

  # Generate from specific branch
  npm run changelog:generate -- --branch feature/new-ui

  # Generate from date range
  npm run changelog:generate -- --since "2025-10-01" --until "2025-10-18"

  # Preview without writing
  npm run changelog:generate -- --dry-run

Documentation: https://git-cliff.org/docs/usage
`);
}

/**
 * Main
 */
async function main() {
  console.log('📝 Changelog Entry Generator\n');

  // Parse options
  const options = parseArgs();

  // Check if git-cliff is installed
  if (!checkGitCliff()) {
    console.log('⚠️  git-cliff not found\n');
    installGitCliff();
  }

  // Verify config exists
  if (!existsSync(CONFIG_PATH)) {
    console.error(`❌ Configuration not found: ${CONFIG_PATH}`);
    console.error('   Run: npm run changelog:init\n');
    process.exit(1);
  }

  try {
    // Generate changelog entry
    const newEntry = generateChangelog(options);

    if (!newEntry || newEntry.length === 0) {
      console.log('ℹ️  No commits found matching criteria\n');
      console.log('   Tip: Ensure commits follow conventional format (feat:, fix:, etc.)\n');
      return;
    }

    if (options.dryRun) {
      console.log('🔍 Dry Run - Generated Entry:\n');
      console.log('─'.repeat(80));
      console.log(newEntry);
      console.log('─'.repeat(80));
      console.log('\n✅ Preview complete (no files modified)\n');
      return;
    }

    // Prepend to CHANGELOG.md
    prependToChangelog(newEntry);

    console.log('✅ Changelog generation complete!\n');
    console.log('Next steps:');
    console.log('  1. Review CHANGELOG.md for accuracy');
    console.log('  2. Enhance TL;DR and Technical Details sections');
    console.log('  3. Run: npm run build:content (triggers cache invalidation)');
    console.log('  4. Commit: git add CHANGELOG.md && git commit -m "chore: update changelog"\n');
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unhandled error in main:', error);
  process.exit(1);
});
