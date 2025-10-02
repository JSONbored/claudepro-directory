/**
 * Redis Cache Testing Script
 * Tests content-loaders.ts caching implementation
 *
 * Usage: tsx scripts/test-cache.ts
 */

import { performance } from 'node:perf_hooks';
import { getContentByCategory, getContentBySlug } from '../lib/content-loaders';
import { contentCache } from '../lib/redis';

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatTime(ms: number): string {
  return `${ms.toFixed(2)}ms`;
}

async function testCategoryCache() {
  log('\n━━━ TEST 1: Category Cache (getContentByCategory) ━━━', 'blue');

  const category = 'agents';

  // Clear cache first
  log('\n→ Clearing cache...', 'gray');
  await contentCache.invalidatePattern(`content:${category}:*`);

  // First call (cache miss)
  log('\n→ First call (expect MISS - file system load)...', 'gray');
  const start1 = performance.now();
  const result1 = await getContentByCategory(category);
  const time1 = performance.now() - start1;

  log(
    `  ✓ Loaded ${result1.length} items in ${formatTime(time1)}`,
    time1 > 50 ? 'yellow' : 'green'
  );

  // Small delay to ensure cache write completes
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Second call (cache hit)
  log('\n→ Second call (expect HIT - Redis cache)...', 'gray');
  const start2 = performance.now();
  const result2 = await getContentByCategory(category);
  const time2 = performance.now() - start2;

  log(
    `  ✓ Loaded ${result2.length} items in ${formatTime(time2)}`,
    time2 < 10 ? 'green' : 'yellow'
  );

  // Verify results match
  const match = JSON.stringify(result1) === JSON.stringify(result2);
  log(`  ${match ? '✓' : '✗'} Data integrity: ${match ? 'PASS' : 'FAIL'}`, match ? 'green' : 'red');

  // Performance improvement
  const speedup = (((time1 - time2) / time1) * 100).toFixed(1);
  log(
    `  📊 Cache speedup: ${speedup}% faster (${formatTime(time1)} → ${formatTime(time2)})`,
    'blue'
  );

  return {
    test: 'Category Cache',
    pass: match && time2 < time1,
    cacheMissTime: time1,
    cacheHitTime: time2,
    speedup: Number(speedup),
  };
}

async function testItemCache() {
  log('\n━━━ TEST 2: Item Cache (getContentBySlug) ━━━', 'blue');

  const category = 'agents';
  const slug = 'code-reviewer-agent';

  // Clear cache
  log('\n→ Clearing cache...', 'gray');
  await contentCache.invalidatePattern(`content:${category}:item:*`);

  // First call (cache miss)
  log('\n→ First call (expect MISS - file system load)...', 'gray');
  const start1 = performance.now();
  const result1 = await getContentBySlug(category, slug);
  const time1 = performance.now() - start1;

  log(
    `  ✓ Loaded item '${result1?.slug}' in ${formatTime(time1)}`,
    time1 > 20 ? 'yellow' : 'green'
  );

  // Small delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Second call (cache hit)
  log('\n→ Second call (expect HIT - Redis cache)...', 'gray');
  const start2 = performance.now();
  const result2 = await getContentBySlug(category, slug);
  const time2 = performance.now() - start2;

  log(`  ✓ Loaded item '${result2?.slug}' in ${formatTime(time2)}`, time2 < 5 ? 'green' : 'yellow');

  // Verify results match
  const match = JSON.stringify(result1) === JSON.stringify(result2);
  log(`  ${match ? '✓' : '✗'} Data integrity: ${match ? 'PASS' : 'FAIL'}`, match ? 'green' : 'red');

  // Performance improvement
  const speedup = (((time1 - time2) / time1) * 100).toFixed(1);
  log(
    `  📊 Cache speedup: ${speedup}% faster (${formatTime(time1)} → ${formatTime(time2)})`,
    'blue'
  );

  return {
    test: 'Item Cache',
    pass: match && time2 < time1,
    cacheMissTime: time1,
    cacheHitTime: time2,
    speedup: Number(speedup),
  };
}

async function testMultipleCategories() {
  log('\n━━━ TEST 3: Multiple Categories Performance ━━━', 'blue');

  const categories = ['agents', 'mcp', 'commands', 'rules', 'hooks', 'statuslines'];

  log('\n→ Loading all 6 categories (cold cache)...', 'gray');
  const start1 = performance.now();
  const results1 = await Promise.all(categories.map((cat) => getContentByCategory(cat)));
  const time1 = performance.now() - start1;
  const totalItems1 = results1.reduce((sum, items) => sum + items.length, 0);

  log(`  ✓ Loaded ${totalItems1} items across 6 categories in ${formatTime(time1)}`, 'yellow');

  // Small delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  log('\n→ Loading all 6 categories (warm cache)...', 'gray');
  const start2 = performance.now();
  const results2 = await Promise.all(categories.map((cat) => getContentByCategory(cat)));
  const time2 = performance.now() - start2;
  const totalItems2 = results2.reduce((sum, items) => sum + items.length, 0);

  log(
    `  ✓ Loaded ${totalItems2} items across 6 categories in ${formatTime(time2)}`,
    time2 < 50 ? 'green' : 'yellow'
  );

  const speedup = (((time1 - time2) / time1) * 100).toFixed(1);
  log(
    `  📊 Cache speedup: ${speedup}% faster (${formatTime(time1)} → ${formatTime(time2)})`,
    'blue'
  );

  return {
    test: 'Multiple Categories',
    pass: totalItems1 === totalItems2 && time2 < time1,
    cacheMissTime: time1,
    cacheHitTime: time2,
    speedup: Number(speedup),
    itemsProcessed: totalItems1,
  };
}

async function main() {
  log('\n╔═══════════════════════════════════════════════╗', 'blue');
  log('║   Redis Cache Implementation Test Suite    ║', 'blue');
  log('╚═══════════════════════════════════════════════╝', 'blue');

  // Check Redis status
  if (!contentCache.isEnabled()) {
    log('\n⚠️  WARNING: Redis cache is disabled!', 'red');
    log('   Tests will run but caching will not be tested.', 'yellow');
  } else {
    log('\n✓ Redis cache is enabled and ready', 'green');
  }

  const results = [];

  try {
    // Run all tests
    results.push(await testCategoryCache());
    results.push(await testItemCache());
    results.push(await testMultipleCategories());

    // Summary
    log('\n╔═══════════════════════════════════════════════╗', 'blue');
    log('║              Test Summary                   ║', 'blue');
    log('╚═══════════════════════════════════════════════╝', 'blue');

    const allPassed = results.every((r) => r.pass);
    const avgSpeedup = (results.reduce((sum, r) => sum + r.speedup, 0) / results.length).toFixed(1);

    results.forEach((r) => {
      const status = r.pass ? '✓ PASS' : '✗ FAIL';
      const color = r.pass ? 'green' : 'red';
      log(`\n  ${status}: ${r.test}`, color);
      log(`    Cache Miss: ${formatTime(r.cacheMissTime)}`, 'gray');
      log(`    Cache Hit:  ${formatTime(r.cacheHitTime)}`, 'gray');
      log(`    Speedup:    ${r.speedup}%`, 'gray');
    });

    log(`\n  Average speedup: ${avgSpeedup}%`, 'blue');
    log(
      `  Overall: ${allPassed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`,
      allPassed ? 'green' : 'red'
    );

    // Performance targets
    log('\n━━━ Performance Targets ━━━', 'blue');
    log('  Cache Hit: <10ms (target <5ms for items)', 'gray');
    log('  Cache Miss: <100ms (acceptable <150ms)', 'gray');
    log('  Speedup: >80% (target >90%)', 'gray');

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    log('\n✗ Test suite failed with error:', 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
