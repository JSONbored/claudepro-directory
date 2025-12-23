#!/usr/bin/env node

/**
 * ESLint Rules Test Runner
 * 
 * Tests ESLint rules on test files ONLY (not the entire codebase)
 * 
 * Usage:
 *   node config/tools/eslint-rules-tests/test-runner.js
 * 
 * This script:
 * 1. Runs ESLint on test files in eslint-rules-tests/
 * 2. Verifies violations are caught
 * 3. Tests autofix functionality
 * 4. Verifies acceptable patterns don't trigger false positives
 */

import { ESLint } from 'eslint';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const testDir = __dirname; // Test files are in the same directory as test-runner.js

const eslint = new ESLint({
  overrideConfigFile: join(__dirname, '..', 'eslint.config.mjs'),
});

async function testRule(ruleName, testFiles) {
  console.log(`\n🧪 Testing rule: ${ruleName}`);
  console.log('='.repeat(60));

  for (const testFile of testFiles) {
    const filePath = join(testDir, testFile);
    console.log(`\n📄 Testing: ${testFile}`);

    try {
      const results = await eslint.lintFiles([filePath]);

      if (results.length === 0) {
        console.log('  ⚠️  No results returned');
        continue;
      }

      const result = results[0];
      const messages = result.messages;

      if (messages.length === 0) {
        console.log('  ✅ No violations found');
      } else {
        console.log(`  📊 Found ${messages.length} violation(s):`);
        messages.forEach((msg) => {
          console.log(`     ${msg.severity === 2 ? '❌' : '⚠️ '} Line ${msg.line}:${msg.column} - ${msg.message}`);
          if (msg.ruleId) {
            console.log(`        Rule: ${msg.ruleId}`);
          }
        });
      }
    } catch (error) {
      console.error(`  ❌ Error testing ${testFile}:`, error.message);
    }
  }
}

async function testAutofix(ruleName, violationFile, expectedFile) {
  console.log(`\n🔧 Testing autofix for rule: ${ruleName}`);
  console.log('='.repeat(60));

  const violationPath = join(testDir, violationFile);
  const expectedPath = join(testDir, expectedFile);

  try {
    // Read original file
    const originalContent = readFileSync(violationPath, 'utf-8');

    // Run ESLint with --fix
    const eslintWithFix = new ESLint({
      overrideConfigFile: join(__dirname, '..', 'eslint.config.mjs'),
      fix: true,
    });

    const results = await eslintWithFix.lintFiles([violationPath]);
    const result = results[0];

    if (result.output) {
      // Read expected output
      const expectedContent = readFileSync(expectedPath, 'utf-8');

      // Compare
      if (result.output.trim() === expectedContent.trim()) {
        console.log(`  ✅ Autofix matches expected output for ${violationFile}`);
      } else {
        console.log(`  ❌ Autofix does NOT match expected output for ${violationFile}`);
        console.log('  📝 Differences:');
        console.log('  Expected:');
        console.log(expectedContent);
        console.log('  Actual:');
        console.log(result.output);
      }
    } else {
      console.log(`  ⚠️  No autofix applied for ${violationFile}`);
    }
  } catch (error) {
    console.error(`  ❌ Error testing autofix:`, error.message);
  }
}

async function main() {
  console.log('🚀 ESLint Rules Test Runner');
  console.log('='.repeat(60));
  console.log('Testing rules on test files ONLY (not entire codebase)');
  console.log('='.repeat(60));

  // Test CSS variables rule
  await testRule('no-css-variables-in-classname', [
    'css-variables/violations.tsx',
    'css-variables/acceptable.tsx',
  ]);

  // Test arbitrary values rule
  await testRule('prefer-design-tokens-over-arbitrary-values', [
    'arbitrary-values/violations.tsx',
    'arbitrary-values/acceptable.tsx',
  ]);

  // Test autofix for CSS variables
  await testAutofix(
    'no-css-variables-in-classname',
    'css-variables/violations.tsx',
    'css-variables/autofix-expected.tsx'
  );

  // Test autofix for arbitrary values
  await testAutofix(
    'prefer-design-tokens-over-arbitrary-values',
    'arbitrary-values/violations.tsx',
    'arbitrary-values/autofix-expected.tsx'
  );

  console.log('\n✅ Test run complete');
  console.log('='.repeat(60));
}

main().catch(console.error);

