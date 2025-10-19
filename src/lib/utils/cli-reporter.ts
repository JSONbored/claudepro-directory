/**
 * CLI Reporter Utility
 *
 * Production-safe CLI output for scripts, CI/CD, and debugging.
 * Uses process.stdout.write() instead of console.log for proper stream handling.
 *
 * **Why This Exists:**
 * - console.log is for debugging, not production CLI output
 * - process.stdout.write() is the proper Node.js way for CLI tools
 * - Provides consistent formatting across all CLI scripts
 * - Type-safe with structured output methods
 *
 * **Usage:**
 * ```typescript
 * import { cliReporter } from '@/src/lib/utils/cli-reporter';
 *
 * cliReporter.header('Build Report');
 * cliReporter.info('Processing files...');
 * cliReporter.success('Build complete!');
 * cliReporter.error('Build failed!');
 * ```
 *
 * @module lib/utils/cli-reporter
 */

/**
 * CLI Reporter Class
 *
 * Provides production-safe CLI output methods using process.stdout/stderr.
 */
class CLIReporter {
  /**
   * Write to stdout (normal output)
   */
  private write(message: string): void {
    process.stdout.write(`${message}\n`);
  }

  /**
   * Write to stderr (error output)
   */
  private writeError(message: string): void {
    process.stderr.write(`${message}\n`);
  }

  /**
   * Print section header
   */
  header(title: string): void {
    this.write(`\n=== ${title} ===\n`);
  }

  /**
   * Print section divider
   */
  divider(length = 60): void {
    this.write('='.repeat(length));
  }

  /**
   * Print info message
   */
  info(message: string): void {
    this.write(message);
  }

  /**
   * Print success message (with checkmark)
   */
  success(message: string): void {
    this.write(`✅ ${message}`);
  }

  /**
   * Print warning message
   */
  warning(message: string): void {
    this.write(`⚠️  ${message}`);
  }

  /**
   * Print error message (to stderr)
   */
  error(message: string): void {
    this.writeError(`❌ ${message}`);
  }

  /**
   * Print list item
   */
  listItem(message: string, indent = 2): void {
    this.write(`${' '.repeat(indent)}- ${message}`);
  }

  /**
   * Print indented text
   */
  indent(message: string, spaces = 2): void {
    this.write(`${' '.repeat(spaces)}${message}`);
  }

  /**
   * Print blank line
   */
  newline(): void {
    this.write('');
  }

  /**
   * Print formatted table row
   */
  tableRow(columns: string[], widths: number[]): void {
    const row = columns.map((col, i) => col.padEnd(widths[i] || 20)).join(' ');
    this.write(row);
  }
}

/**
 * Singleton CLI reporter instance
 */
export const cliReporter = new CLIReporter();
