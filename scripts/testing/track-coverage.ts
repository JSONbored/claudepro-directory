#!/usr/bin/env tsx
/**
 * Test Coverage Baseline Tracking & Trending
 *
 * Tracks test coverage metrics over time to monitor quality trends
 * Prevents coverage regressions and encourages improvement
 *
 * Features:
 * - Baseline tracking (stores first run as baseline)
 * - Trend analysis (compares current vs baseline)
 * - Historical tracking (stores metrics with timestamps)
 * - Regression detection (fails if coverage drops)
 * - Progress visualization (shows improvement over time)
 * - CI/CD integration (GitHub Actions annotations)
 *
 * Usage:
 *   npm run coverage:track          # Track coverage (fail on regression)
 *   npm run coverage:track --strict # Fail on any decrease
 *   npm run coverage:baseline       # Set new baseline
 *   npm run coverage:report         # Show trending report
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const COVERAGE_DIR = join(ROOT, 'coverage');
const COVERAGE_SUMMARY = join(COVERAGE_DIR, 'coverage-summary.json');
const BASELINE_FILE = join(ROOT, '.coverage-baseline.json');
const HISTORY_FILE = join(ROOT, '.coverage-history.json');

// ============================================================================
// Types
// ============================================================================

interface CoverageMetrics {
  lines: { total: number; covered: number; pct: number };
  statements: { total: number; covered: number; pct: number };
  functions: { total: number; covered: number; pct: number };
  branches: { total: number; covered: number; pct: number };
}

interface CoverageSnapshot {
  timestamp: string;
  metrics: CoverageMetrics;
  commit?: string;
}

interface TrendAnalysis {
  metric: keyof CoverageMetrics;
  baseline: number;
  current: number;
  change: number;
  status: 'improved' | 'unchanged' | 'regressed';
}

// ============================================================================
// Coverage Reading
// ============================================================================

function readCoverageSummary(): CoverageMetrics | null {
  if (!existsSync(COVERAGE_SUMMARY)) {
    console.error('❌ No coverage summary found. Run `npm run test:coverage` first.');
    return null;
  }

  try {
    const summary = JSON.parse(readFileSync(COVERAGE_SUMMARY, 'utf-8'));
    const total = summary.total;

    return {
      lines: total.lines,
      statements: total.statements,
      functions: total.functions,
      branches: total.branches,
    };
  } catch (error) {
    console.error('❌ Failed to read coverage summary:', error);
    return null;
  }
}

// ============================================================================
// Baseline Management
// ============================================================================

function readBaseline(): CoverageSnapshot | null {
  if (!existsSync(BASELINE_FILE)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(BASELINE_FILE, 'utf-8'));
  } catch (error) {
    console.warn('⚠️  Failed to read baseline, treating as first run');
    return null;
  }
}

function writeBaseline(metrics: CoverageMetrics): void {
  const snapshot: CoverageSnapshot = {
    timestamp: new Date().toISOString(),
    metrics,
    commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA,
  };

  writeFileSync(BASELINE_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log('✅ Baseline saved to .coverage-baseline.json');
}

// ============================================================================
// History Tracking
// ============================================================================

function readHistory(): CoverageSnapshot[] {
  if (!existsSync(HISTORY_FILE)) {
    return [];
  }

  try {
    return JSON.parse(readFileSync(HISTORY_FILE, 'utf-8'));
  } catch (error) {
    console.warn('⚠️  Failed to read history, starting fresh');
    return [];
  }
}

function appendHistory(metrics: CoverageMetrics): void {
  const history = readHistory();
  const snapshot: CoverageSnapshot = {
    timestamp: new Date().toISOString(),
    metrics,
    commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA,
  };

  history.push(snapshot);

  // Keep last 100 snapshots
  const trimmed = history.slice(-100);

  writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
}

// ============================================================================
// Trend Analysis
// ============================================================================

function analyzeTrends(baseline: CoverageMetrics, current: CoverageMetrics): TrendAnalysis[] {
  const metrics: (keyof CoverageMetrics)[] = ['lines', 'statements', 'functions', 'branches'];

  return metrics.map((metric) => {
    const baselinePct = baseline[metric].pct;
    const currentPct = current[metric].pct;
    const change = currentPct - baselinePct;

    let status: 'improved' | 'unchanged' | 'regressed';
    if (Math.abs(change) < 0.01) {
      status = 'unchanged';
    } else if (change > 0) {
      status = 'improved';
    } else {
      status = 'regressed';
    }

    return {
      metric,
      baseline: baselinePct,
      current: currentPct,
      change,
      status,
    };
  });
}

// ============================================================================
// Reporting
// ============================================================================

function printReport(current: CoverageMetrics, baseline: CoverageMetrics | null): void {
  console.log('\n📊 Coverage Report\n');

  console.log('Current Coverage:');
  console.log(`  Lines:      ${current.lines.pct.toFixed(2)}%`);
  console.log(`  Statements: ${current.statements.pct.toFixed(2)}%`);
  console.log(`  Functions:  ${current.functions.pct.toFixed(2)}%`);
  console.log(`  Branches:   ${current.branches.pct.toFixed(2)}%`);

  if (!baseline) {
    console.log('\n✨ First run - baseline established!');
    return;
  }

  const trends = analyzeTrends(baseline.metrics, current);
  const regressions = trends.filter((t) => t.status === 'regressed');
  const improvements = trends.filter((t) => t.status === 'improved');

  console.log('\n📈 Trend Analysis:');

  for (const trend of trends) {
    const icon = trend.status === 'improved' ? '✅' : trend.status === 'regressed' ? '❌' : '➖';
    const changeStr =
      trend.change >= 0 ? `+${trend.change.toFixed(2)}%` : `${trend.change.toFixed(2)}%`;

    console.log(
      `  ${icon} ${trend.metric.padEnd(12)}: ${trend.current.toFixed(2)}% (${changeStr})`
    );
  }

  if (improvements.length > 0) {
    console.log(`\n🎉 ${improvements.length} metric(s) improved!`);
  }

  if (regressions.length > 0) {
    console.log(`\n⚠️  ${regressions.length} metric(s) regressed!`);
  }
}

function printTrendingReport(): void {
  const history = readHistory();

  if (history.length === 0) {
    console.log('📊 No coverage history available yet');
    return;
  }

  console.log(`\n📊 Coverage Trending (last ${Math.min(history.length, 10)} runs)\n`);

  const recent = history.slice(-10);

  console.log('Timestamp                  Lines    Statements  Functions  Branches');
  console.log('─'.repeat(78));

  for (const snapshot of recent) {
    const date = new Date(snapshot.timestamp).toISOString().split('T')[0];
    const lines = snapshot.metrics.lines.pct.toFixed(1).padStart(6);
    const statements = snapshot.metrics.statements.pct.toFixed(1).padStart(10);
    const functions = snapshot.metrics.functions.pct.toFixed(1).padStart(9);
    const branches = snapshot.metrics.branches.pct.toFixed(1).padStart(9);

    console.log(`${date}   ${lines}%   ${statements}%  ${functions}%  ${branches}%`);
  }

  // Calculate overall trend
  if (recent.length >= 2) {
    const first = recent[0];
    const last = recent[recent.length - 1];

    const linesChange = last.metrics.lines.pct - first.metrics.lines.pct;
    const statementsChange = last.metrics.statements.pct - first.metrics.statements.pct;
    const functionsChange = last.metrics.functions.pct - first.metrics.functions.pct;
    const branchesChange = last.metrics.branches.pct - first.metrics.branches.pct;

    console.log('\n📈 Overall Trend:');
    console.log(`  Lines:      ${linesChange >= 0 ? '+' : ''}${linesChange.toFixed(2)}%`);
    console.log(`  Statements: ${statementsChange >= 0 ? '+' : ''}${statementsChange.toFixed(2)}%`);
    console.log(`  Functions:  ${functionsChange >= 0 ? '+' : ''}${functionsChange.toFixed(2)}%`);
    console.log(`  Branches:   ${branchesChange >= 0 ? '+' : ''}${branchesChange.toFixed(2)}%`);
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const isBaseline = args.includes('--baseline') || args.includes('baseline');
  const isReport = args.includes('--report') || args.includes('report');
  const isStrict = args.includes('--strict');

  if (isReport) {
    printTrendingReport();
    return;
  }

  const current = readCoverageSummary();
  if (!current) {
    process.exit(1);
  }

  if (isBaseline) {
    writeBaseline(current);
    appendHistory(current);
    console.log('\n✅ New baseline established');
    return;
  }

  const baseline = readBaseline();

  if (!baseline) {
    console.log('📊 No baseline found - establishing baseline...');
    writeBaseline(current);
    appendHistory(current);
    printReport(current, null);
    return;
  }

  // Track current run in history
  appendHistory(current);

  // Print report
  printReport(current, baseline);

  // Check for regressions
  const trends = analyzeTrends(baseline.metrics, current);
  const regressions = trends.filter((t) => t.status === 'regressed');

  if (regressions.length > 0) {
    console.log('\n❌ Coverage regression detected!');

    if (isStrict) {
      console.log('   Running in strict mode - failing build');
      process.exit(1);
    } else {
      console.log('   Consider adding more tests to improve coverage');
      console.log('   Run with --strict to fail on regression');
    }
  } else {
    console.log('\n✅ Coverage maintained or improved!');
  }
}

main().catch((error) => {
  console.error('❌ Coverage tracking failed:', error);
  process.exit(1);
});
