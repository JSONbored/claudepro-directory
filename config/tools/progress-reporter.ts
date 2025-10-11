/**
 * Minimal Progress Bar Reporter for Playwright
 *
 * Shows only:
 * - Real-time updating progress bar
 * - Live counters: passed/failed/flaky/skipped/total
 * - Percentage complete
 * - Estimated time remaining
 *
 * No error output, no verbose logs - just progress tracking.
 * All test details visible in HTML report.
 */

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

class ProgressReporter implements Reporter {
  private totalTests = 0;
  private passed = 0;
  private failed = 0;
  private flaky = 0;
  private skipped = 0;
  private startTime = 0;
  private originalWrite: typeof process.stdout.write;
  private originalErrWrite: typeof process.stderr.write;

  constructor() {
    // Intercept stdout/stderr to suppress Playwright's default output
    this.originalWrite = process.stdout.write.bind(process.stdout);
    this.originalErrWrite = process.stderr.write.bind(process.stderr);

    // Suppress all output except our progress bar
    process.stdout.write = ((chunk: any, encoding?: any, callback?: any) => {
      // Only allow our own output (progress bar and summary)
      if (typeof chunk === 'string' && (
        chunk.includes('█') ||
        chunk.includes('📊') ||
        chunk.includes('🧪') ||
        chunk.includes('✅') ||
        chunk.includes('❌')
      )) {
        return this.originalWrite(chunk, encoding, callback);
      }
      // Suppress everything else
      return true;
    }) as any;

    process.stderr.write = (() => {
      // Suppress all stderr (Playwright error output)
      return true;
    }) as any;
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.totalTests = suite.allTests().length;
    this.startTime = Date.now();
    this.originalWrite(`\n🧪 Running ${this.totalTests} SEO tests...\n\n`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Update counters based on test result
    if (result.status === 'passed') {
      this.passed++;
    } else if (result.status === 'failed') {
      this.failed++;
    } else if (result.status === 'skipped') {
      this.skipped++;
    } else if (result.status === 'timedOut') {
      this.failed++;
    }

    // Check if test is flaky (passed on retry)
    if (test.results.length > 1 && result.status === 'passed') {
      this.flaky++;
    }

    // Update progress display
    this.updateProgress();
  }

  private updateProgress() {
    const completed = this.passed + this.failed + this.skipped;
    const percentage = Math.round((completed / this.totalTests) * 100);
    const elapsed = Date.now() - this.startTime;
    const estimatedTotal = (elapsed / completed) * this.totalTests;
    const remaining = Math.max(0, estimatedTotal - elapsed);

    // Create progress bar (50 chars wide)
    const barWidth = 50;
    const filledWidth = Math.round((completed / this.totalTests) * barWidth);
    const emptyWidth = barWidth - filledWidth;
    const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);

    // Format time remaining
    const remainingSeconds = Math.round(remaining / 1000);
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    const remainingSecondsDisplay = remainingSeconds % 60;
    const timeRemaining =
      remainingMinutes > 0
        ? `${remainingMinutes}m ${remainingSecondsDisplay}s`
        : `${remainingSecondsDisplay}s`;

    // Clear line and write progress
    this.originalWrite('\r\x1b[K'); // Clear current line
    this.originalWrite(
      `${bar} ${percentage}% | ` +
        `✅ ${this.passed} ` +
        `❌ ${this.failed} ` +
        `⚠️  ${this.flaky} ` +
        `⏭️  ${this.skipped} ` +
        `| ${completed}/${this.totalTests} ` +
        `| ⏱️  ${timeRemaining} remaining`
    );
  }

  onEnd(result: FullResult) {
    const elapsed = Date.now() - this.startTime;
    const elapsedSeconds = Math.round(elapsed / 1000);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const elapsedSecondsDisplay = elapsedSeconds % 60;
    const timeElapsed =
      elapsedMinutes > 0
        ? `${elapsedMinutes}m ${elapsedSecondsDisplay}s`
        : `${elapsedSecondsDisplay}s`;

    // Restore original stdout/stderr
    process.stdout.write = this.originalWrite;
    process.stderr.write = this.originalErrWrite;

    // Final summary
    this.originalWrite('\n\n📊 Test Summary:\n');
    this.originalWrite(`   ✅ Passed:  ${this.passed}\n`);
    this.originalWrite(`   ❌ Failed:  ${this.failed}\n`);
    this.originalWrite(`   ⚠️  Flaky:   ${this.flaky}\n`);
    this.originalWrite(`   ⏭️  Skipped: ${this.skipped}\n`);
    this.originalWrite(`   📈 Total:   ${this.totalTests}\n`);
    this.originalWrite(`   ⏱️  Time:    ${timeElapsed}\n`);
    this.originalWrite(`\n📄 Full report: npx playwright show-report\n\n`);

    // Exit code based on result
    if (this.failed > 0) {
      this.originalWrite('❌ Tests failed. See HTML report for details.\n\n');
    } else if (this.flaky > 0) {
      this.originalWrite('⚠️  Tests passed but some were flaky.\n\n');
    } else {
      this.originalWrite('✅ All tests passed!\n\n');
    }
  }

  // Suppress all error printing
  printsToStdio() {
    return false;
  }
}

export default ProgressReporter;
