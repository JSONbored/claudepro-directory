#!/usr/bin/env tsx

/**
 * MDX H1 Tag Validator
 *
 * Validates that MDX files have exactly ONE H1 tag (outside code blocks).
 * This script properly parses MDX to exclude code block comments from being counted as headings.
 *
 * **SEO Impact**: Multiple H1 tags confuse search engines about page hierarchy.
 * **Standard**: One H1 per page, use H2-H6 for subsections.
 *
 * Usage:
 *   npm run validate:h1-tags
 *   npm run validate:h1-tags -- content/guides/specific-file.mdx
 *
 * Exit Codes:
 *   0 - All files pass
 *   1 - Validation errors found
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

interface ValidationResult {
  file: string;
  h1Count: number;
  h1Lines: number[];
  passed: boolean;
}

/**
 * Parse MDX content and extract H1 headings (excluding code blocks)
 */
function extractH1Headings(content: string): { count: number; lines: number[] } {
  const lines = content.split('\n');
  const h1Lines: number[] = [];
  let inCodeBlock = false;
  let inFrontmatter = false;
  let inJSXCodeProp = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Track frontmatter (first --- block)
    if (line.trim() === '---') {
      if (i === 0) {
        inFrontmatter = true;
        continue;
      }
      if (inFrontmatter) {
        inFrontmatter = false;
        continue;
      }
    }

    // Skip frontmatter lines
    if (inFrontmatter) {
      continue;
    }

    // Track code blocks (``` with optional language identifier)
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip lines inside code blocks
    if (inCodeBlock) {
      continue;
    }

    // Detect JSX code props (code: ` or code={`)
    // Multi-line template literals in JSX props
    if (/code[:=]\s*[{`]?`/.test(line) && !inJSXCodeProp) {
      inJSXCodeProp = true;
      continue;
    }

    // Check if exiting JSX code prop (closing backtick)
    if (inJSXCodeProp) {
      // Look for closing backtick with optional comma/brace/whitespace
      if (/`[\s,}]/.test(line) || line.trim() === '`' || line.trim().endsWith('`}')) {
        inJSXCodeProp = false;
      }
      continue; // Skip all lines inside JSX code prop
    }

    // Detect H1 headings (# at start, followed by space)
    if (/^# [^#]/.test(line)) {
      h1Lines.push(lineNum);
    }
  }

  return {
    count: h1Lines.length,
    lines: h1Lines,
  };
}

/**
 * Recursively find all MDX files in a directory
 */
function findMdxFiles(dir: string): string[] {
  const files: string[] = [];

  function traverse(currentDir: string) {
    const entries = readdirSync(currentDir);

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules, .next, etc.
        if (!entry.startsWith('.') && entry !== 'node_modules') {
          traverse(fullPath);
        }
      } else if (entry.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Validate a single MDX file
 */
function validateFile(filePath: string): ValidationResult {
  const content = readFileSync(filePath, 'utf-8');
  const { count, lines } = extractH1Headings(content);

  return {
    file: relative(process.cwd(), filePath),
    h1Count: count,
    h1Lines: lines,
    passed: count === 1, // Exactly one H1 required
  };
}

/**
 * Main validation function
 */
function main() {
  const args = process.argv.slice(2);
  const targetPath = args[0] || 'content';

  console.log('🔍 MDX H1 Tag Validator');
  console.log('═'.repeat(60));
  console.log(`📂 Scanning: ${targetPath}\n`);

  // Find all MDX files
  const stat = statSync(targetPath);
  const files = stat.isDirectory() ? findMdxFiles(targetPath) : [targetPath];

  console.log(`📄 Found ${files.length} MDX files\n`);

  // Validate each file
  const results: ValidationResult[] = files.map(validateFile);

  // Separate passed and failed
  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  // Display results
  if (failed.length > 0) {
    console.log('❌ FAILED FILES:\n');

    for (const result of failed.sort((a, b) => b.h1Count - a.h1Count)) {
      console.log(`  ${result.file}`);
      console.log(`    H1 Count: ${result.h1Count} (expected: 1)`);

      if (result.h1Count > 0) {
        console.log(`    Lines: ${result.h1Lines.join(', ')}`);
      } else {
        console.log('    ⚠️  No H1 tag found - add page title');
      }
      console.log('');
    }
  }

  // Summary
  console.log('═'.repeat(60));
  console.log(`✅ Passed: ${passed.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`📊 Total:  ${results.length}`);
  console.log('═'.repeat(60));

  if (failed.length > 0) {
    console.log('\n💡 Fix Instructions:');
    console.log('  • Keep ONLY the main page title as H1 (# ...)');
    console.log('  • Convert section headings to H2 (## ...)');
    console.log('  • Use H3-H6 for subsections (###, ####, etc.)');
    console.log('  • SEO Best Practice: One H1 per page\n');

    process.exit(1);
  }

  console.log('\n✨ All files passed!\n');
  process.exit(0);
}

main();
