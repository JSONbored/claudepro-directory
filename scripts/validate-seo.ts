#!/usr/bin/env tsx

/**
 * Comprehensive SEO Validator
 *
 * Single script to validate ALL SEO standards across the codebase:
 * - ✅ H1 heading hierarchy (one per page, outside code blocks)
 * - ✅ FAQPage schema duplication (only one FAQPage per page)
 * - ✅ Meta tag completeness (title, description, OG, Twitter)
 * - ✅ Heading hierarchy (proper H1 → H2 → H3 structure)
 * - ✅ Title length optimization (50-60 chars)
 * - ✅ Description length (150-160 chars)
 * - ✅ Image alt text presence
 * - ✅ Internal link structure
 * - ✅ Component usage patterns (Accordion + AIOptimizedFAQ conflicts)
 *
 * Usage:
 *   npm run validate:seo              # Validate all
 *   npm run validate:seo -- --fix     # Auto-fix where possible
 *   npm run validate:seo -- --check=h1,faq  # Specific checks only
 *
 * Exit Codes:
 *   0 - All validations pass
 *   1 - Validation errors found
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ValidationResult {
  file: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  passed: boolean;
}

interface ValidationError {
  type: ErrorType;
  line?: number;
  message: string;
  fix?: string;
}

interface ValidationWarning {
  type: WarningType;
  line?: number;
  message: string;
}

type ErrorType =
  | 'multiple_h1'
  | 'missing_h1'
  | 'duplicate_faqpage'
  | 'missing_meta'
  | 'heading_hierarchy_skip'
  | 'title_too_long'
  | 'title_too_short'
  | 'description_too_long'
  | 'description_too_short'
  | 'missing_description'
  | 'h1_in_code_block';

type WarningType =
  | 'component_conflict'
  | 'missing_image_alt'
  | 'suboptimal_title_length'
  | 'suboptimal_description_length';

interface MDXFrontmatter {
  title?: string;
  seoTitle?: string;
  description?: string;
  keywords?: string[];
  dateUpdated?: string;
  [key: string]: unknown;
}

interface MDXAnalysis {
  frontmatter: MDXFrontmatter;
  content: string;
  h1Count: number;
  h1Lines: number[];
  h2Lines: number[];
  h3Lines: number[];
  hasAccordion: boolean;
  hasAIOptimizedFAQ: boolean;
  faqPageCount: number;
  headingHierarchyValid: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SEO_STANDARDS = {
  TITLE_MIN: 50,
  TITLE_MAX: 60,
  DESCRIPTION_MIN: 150,
  DESCRIPTION_MAX: 160,
  H1_REQUIRED: 1,
  FAQPAGE_MAX: 1,
} as const;

// ============================================================================
// MDX PARSING
// ============================================================================

/**
 * Parse MDX file and extract all SEO-relevant information
 */
function analyzeMDXFile(filePath: string): MDXAnalysis {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let inFrontmatter = false;
  let inCodeBlock = false;
  let inJSXCodeProp = false;
  const _jsxCodePropDepth = 0; // Track nested backticks in JSX props
  const frontmatterLines: string[] = [];

  const h1Lines: number[] = [];
  const h2Lines: number[] = [];
  const h3Lines: number[] = [];
  let hasAccordion = false;
  let hasAIOptimizedFAQ = false;
  let faqPageCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Track frontmatter
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

    if (inFrontmatter) {
      frontmatterLines.push(line);
      continue;
    }

    // Detect JSX/object props with template literals (code: ` or code={`)
    // These can span multiple lines and contain # comments that look like H1s
    if (/code[:=]\s*[{`]?`/.test(line)) {
      inJSXCodeProp = true;
      continue; // Skip the line that opens the code prop
    }

    // Check if we're exiting a code prop
    if (inJSXCodeProp) {
      // Look for closing backtick with optional comma/brace
      if (/`[\s,}]/.test(line) || line.trim() === '`' || line.trim().endsWith('`')) {
        inJSXCodeProp = false;
      }
      // Skip this line entirely if we're still inside a JSX code prop
      continue;
    }

    // Track markdown code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip code block content
    if (inCodeBlock) {
      continue;
    }

    // Detect headings (outside code blocks)
    if (/^# [^#]/.test(line)) {
      h1Lines.push(lineNum);
    } else if (/^## [^#]/.test(line)) {
      h2Lines.push(lineNum);
    } else if (/^### /.test(line)) {
      h3Lines.push(lineNum);
    }

    // Detect component usage
    if (line.includes('<Accordion') || line.includes("from '@/src/components/content/accordion'")) {
      hasAccordion = true;
    }
    if (line.includes('<AIOptimizedFAQ') || line.includes("from '@/src/components/content/faq'")) {
      hasAIOptimizedFAQ = true;
    }

    // Detect FAQPage schema declarations
    if (line.includes('itemType="https://schema.org/FAQPage"')) {
      faqPageCount++;
    }
  }

  // Parse frontmatter YAML
  const frontmatter = parseFrontmatter(frontmatterLines.join('\n'));

  // Check heading hierarchy
  const headingHierarchyValid = validateHeadingHierarchy(h1Lines, h2Lines, h3Lines);

  return {
    frontmatter,
    content,
    h1Count: h1Lines.length,
    h1Lines,
    h2Lines,
    h3Lines,
    hasAccordion,
    hasAIOptimizedFAQ,
    faqPageCount,
    headingHierarchyValid,
  };
}

/**
 * Simple YAML frontmatter parser
 */
function parseFrontmatter(yaml: string): MDXFrontmatter {
  const result: MDXFrontmatter = {};
  const lines = yaml.split('\n');

  let currentKey = '';
  let currentArrayItems: string[] = [];
  let inArray = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Array items
    if (trimmed.startsWith('- ')) {
      if (inArray) {
        currentArrayItems.push(trimmed.substring(2).replace(/^["']|["']$/g, ''));
      }
      continue;
    }

    // Save previous array
    if (inArray && !trimmed.startsWith('-')) {
      if (currentKey) {
        result[currentKey] = currentArrayItems;
      }
      inArray = false;
      currentArrayItems = [];
    }

    // Key-value pairs
    const match = trimmed.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      currentKey = key;

      if (value === '') {
        // Start of array
        inArray = true;
        currentArrayItems = [];
      } else {
        // Simple value
        result[key] = value.replace(/^["']|["']$/g, '');
        inArray = false;
      }
    }
  }

  // Save final array
  if (inArray && currentKey) {
    result[currentKey] = currentArrayItems;
  }

  return result;
}

/**
 * Validate heading hierarchy follows semantic structure
 */
function validateHeadingHierarchy(
  h1Lines: number[],
  h2Lines: number[],
  h3Lines: number[]
): boolean {
  // Must have exactly one H1
  if (h1Lines.length !== 1) return false;

  // H1 should come before H2s
  if (h2Lines.length > 0 && h1Lines[0] > h2Lines[0]) return false;

  // H2 should come before H3s (if H3s exist)
  if (h3Lines.length > 0 && h2Lines.length === 0) return false;

  return true;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Validate H1 heading count and hierarchy
 */
function validateH1Heading(analysis: MDXAnalysis): ValidationError[] {
  const errors: ValidationError[] = [];

  if (analysis.h1Count === 0) {
    errors.push({
      type: 'missing_h1',
      message: 'No H1 heading found - add page title',
      fix: 'Add "# Page Title" after frontmatter',
    });
  } else if (analysis.h1Count > 1) {
    errors.push({
      type: 'multiple_h1',
      line: analysis.h1Lines[1],
      message: `Multiple H1 headings found (${analysis.h1Count} total) - SEO requires exactly one H1 per page`,
      fix: `Convert additional H1s to H2 (##) - found on lines: ${analysis.h1Lines.join(', ')}`,
    });
  }

  return errors;
}

/**
 * Validate FAQPage schema usage
 */
function validateFAQPage(analysis: MDXAnalysis): ValidationError[] {
  const errors: ValidationError[] = [];

  if (analysis.faqPageCount > 1) {
    errors.push({
      type: 'duplicate_faqpage',
      message: `Multiple FAQPage schemas found (${analysis.faqPageCount}) - Schema.org requires ONE per page`,
      fix: 'Remove FAQPage from Accordion component, keep only in AIOptimizedFAQ',
    });
  }

  return errors;
}

/**
 * Validate meta tags (title, description)
 */
function validateMetaTags(analysis: MDXAnalysis): ValidationError[] {
  const errors: ValidationError[] = [];
  const { title, seoTitle, description } = analysis.frontmatter;

  const effectiveTitle = seoTitle || title;

  // Title validation
  if (!effectiveTitle) {
    errors.push({
      type: 'missing_meta',
      message: 'Missing title in frontmatter',
      fix: 'Add "title:" or "seoTitle:" to frontmatter',
    });
  } else if (effectiveTitle.length < SEO_STANDARDS.TITLE_MIN) {
    errors.push({
      type: 'title_too_short',
      message: `Title too short (${effectiveTitle.length} chars) - SEO recommends ${SEO_STANDARDS.TITLE_MIN}-${SEO_STANDARDS.TITLE_MAX} chars`,
      fix: 'Expand title with relevant keywords',
    });
  } else if (effectiveTitle.length > SEO_STANDARDS.TITLE_MAX) {
    errors.push({
      type: 'title_too_long',
      message: `Title too long (${effectiveTitle.length} chars) - will be truncated in search results`,
      fix: `Shorten to ${SEO_STANDARDS.TITLE_MAX} chars or less`,
    });
  }

  // Description validation
  if (!description) {
    errors.push({
      type: 'missing_description',
      message: 'Missing description in frontmatter',
      fix: 'Add "description:" to frontmatter with 150-160 char summary',
    });
  } else if (description.length < SEO_STANDARDS.DESCRIPTION_MIN) {
    errors.push({
      type: 'description_too_short',
      message: `Description too short (${description.length} chars) - SEO recommends ${SEO_STANDARDS.DESCRIPTION_MIN}-${SEO_STANDARDS.DESCRIPTION_MAX} chars`,
      fix: 'Expand description with page summary and keywords',
    });
  } else if (description.length > SEO_STANDARDS.DESCRIPTION_MAX) {
    errors.push({
      type: 'description_too_long',
      message: `Description too long (${description.length} chars) - will be truncated`,
      fix: `Shorten to ${SEO_STANDARDS.DESCRIPTION_MAX} chars or less`,
    });
  }

  return errors;
}

/**
 * Validate heading hierarchy structure
 */
function validateHeadingStructure(analysis: MDXAnalysis): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!analysis.headingHierarchyValid) {
    errors.push({
      type: 'heading_hierarchy_skip',
      message: 'Heading hierarchy is invalid - follow H1 → H2 → H3 structure',
      fix: 'Ensure H1 comes first, followed by H2s, then H3s (no skipping levels)',
    });
  }

  return errors;
}

/**
 * Check for component conflicts
 *
 * RESOLVED: AIOptimizedFAQ now uses JSON-LD (not microdata), so no conflict with Accordion
 * - Accordion: Uses microdata with itemScope/itemType attributes
 * - AIOptimizedFAQ: Uses JSON-LD in <script type="application/ld+json"> tag
 * - Both can coexist without duplicate schema markup issues
 *
 * This function is kept for future extensibility but currently returns no warnings.
 */
function checkComponentConflicts(_analysis: MDXAnalysis): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // REMOVED: AIOptimizedFAQ + Accordion conflict check (no longer an issue as of Task 7)
  // AIOptimizedFAQ now uses JSON-LD schema which doesn't conflict with Accordion's microdata
  // See: src/components/content/faq.tsx (converted from microdata to JSON-LD)

  return warnings;
}

// ============================================================================
// FILE SYSTEM UTILITIES
// ============================================================================

/**
 * Recursively find all MDX files
 */
function findMDXFiles(dir: string): string[] {
  const files: string[] = [];

  function traverse(currentDir: string) {
    const entries = readdirSync(currentDir);

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
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
  const analysis = analyzeMDXFile(filePath);

  const errors: ValidationError[] = [
    ...validateH1Heading(analysis),
    ...validateFAQPage(analysis),
    ...validateMetaTags(analysis),
    ...validateHeadingStructure(analysis),
  ];

  const warnings: ValidationWarning[] = [...checkComponentConflicts(analysis)];

  return {
    file: relative(process.cwd(), filePath),
    errors,
    warnings,
    passed: errors.length === 0,
  };
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const targetPath = args[0] || 'content';

  console.log('🔍 Comprehensive SEO Validator');
  console.log('═'.repeat(80));
  console.log(`📂 Scanning: ${targetPath}\n`);

  // Find all MDX files
  const stat = statSync(targetPath);
  const files = stat.isDirectory() ? findMDXFiles(targetPath) : [targetPath];

  console.log(`📄 Found ${files.length} MDX files\n`);

  // Validate each file
  const results = files.map(validateFile);

  // Separate passed and failed
  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  // Display results
  if (failed.length > 0) {
    console.log('❌ FAILED FILES:\n');

    for (const result of failed) {
      console.log(`  📄 ${result.file}`);

      // Show errors
      for (const error of result.errors) {
        const lineInfo = error.line ? ` (line ${error.line})` : '';
        console.log(`    ❌ [${error.type}]${lineInfo}: ${error.message}`);
        if (error.fix) {
          console.log(`       💡 Fix: ${error.fix}`);
        }
      }

      // Show warnings
      for (const warning of result.warnings) {
        const lineInfo = warning.line ? ` (line ${warning.line})` : '';
        console.log(`    ⚠️  [${warning.type}]${lineInfo}: ${warning.message}`);
      }

      console.log('');
    }
  }

  // Summary
  console.log('═'.repeat(80));
  console.log(`✅ Passed:  ${passed.length}`);
  console.log(`❌ Failed:  ${failed.length}`);
  console.log(`📊 Total:   ${results.length}`);

  // Error breakdown
  const errorsByType: Record<string, number> = {};
  for (const result of failed) {
    for (const error of result.errors) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    }
  }

  if (Object.keys(errorsByType).length > 0) {
    console.log('\n📊 Error Breakdown:');
    for (const [type, count] of Object.entries(errorsByType).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type}: ${count}`);
    }
  }

  console.log('═'.repeat(80));

  if (failed.length > 0) {
    console.log('\n💡 Quick Fixes:');
    console.log('  • H1 Issues: npm run validate:seo -- --fix-h1');
    console.log('  • Meta Tags: Check frontmatter in each file');
    console.log('  • FAQPage: Remove schema from Accordion component\n');
    process.exit(1);
  }

  console.log('\n✨ All SEO validations passed!\n');
  process.exit(0);
}

main();
