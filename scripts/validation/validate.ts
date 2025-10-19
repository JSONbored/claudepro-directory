#!/usr/bin/env tsx
/**
 * Unified Validation System - Main Entry Point
 *
 * Single command to run all validation checks with smart orchestration
 *
 * Usage:
 *   npm run validate                    # Run all validators
 *   npm run validate -- --type=content  # Only content validation
 *   npm run validate -- --quick         # Quick mode
 *   npm run validate -- --fix           # Auto-fix issues
 *   npm run validate -- --parallel      # Run in parallel
 *   npm run validate -- --ci            # CI-friendly output
 */

import { parseArgs } from 'node:util';
import { formatCIResults } from './core/formatter';
import { ValidationRunner } from './core/runner';
import { ContentValidator } from './validators/content-validator';
import { LLMSTxtValidator } from './validators/llmstxt-validator';
import { MetadataValidator } from './validators/metadata-validator';
import { SEOValidator } from './validators/seo-validator';
import { TitleValidator } from './validators/title-validator';

// ============================================================================
// Parse CLI Arguments
// ============================================================================

const { values } = parseArgs({
  options: {
    type: {
      type: 'string',
      short: 't',
      default: undefined,
    },
    quick: {
      type: 'boolean',
      short: 'q',
      default: false,
    },
    fix: {
      type: 'boolean',
      short: 'f',
      default: false,
    },
    parallel: {
      type: 'boolean',
      short: 'p',
      default: true,
    },
    ci: {
      type: 'boolean',
      default: false,
    },
    verbose: {
      type: 'boolean',
      short: 'v',
      default: false,
    },
    help: {
      type: 'boolean',
      short: 'h',
      default: false,
    },
  },
  allowPositionals: true,
});

// Show help
if (values.help) {
  console.log(`
Unified Validation System

Usage:
  npm run validate [options]

Options:
  -t, --type <type>      Run specific validator(s): content, seo, metadata, titles, llmstxt
                         Can specify multiple: --type=content,seo
  -q, --quick            Run in quick mode (faster, less thorough)
  -f, --fix              Auto-fix issues where possible
  -p, --parallel         Run validators in parallel (default: true)
  --ci                   CI-friendly output format (GitHub Actions)
  -v, --verbose          Show detailed error messages
  -h, --help             Show this help message

Examples:
  npm run validate                          # Run all validators
  npm run validate -- --type=content        # Only content validation
  npm run validate -- --type=content,seo    # Content and SEO only
  npm run validate -- --quick               # Quick mode (all validators)
  npm run validate -- --fix                 # Auto-fix issues
  npm run validate -- --ci                  # CI-friendly format
  npm run validate -- --verbose             # Show detailed errors
`);
  process.exit(0);
}

// ============================================================================
// Create Validation Runner
// ============================================================================

const runner = new ValidationRunner({
  validators: [
    new ContentValidator(),
    new SEOValidator(),
    new MetadataValidator(),
    new TitleValidator(),
    new LLMSTxtValidator(),
  ],
  parallel: values.parallel ?? true,
  stopOnError: false,
  quiet: values.ci ?? false,
});

// ============================================================================
// Run Validation
// ============================================================================

async function main() {
  try {
    // Parse type filter
    const typeFilter = values.type ? values.type.split(',').map((t) => t.trim()) : undefined;

    // Run validators
    const result = await runner.run({
      type: typeFilter,
      quick: values.quick ?? false,
      fix: values.fix ?? false,
      ci: values.ci ?? false,
      parallel: values.parallel ?? true,
      verbose: values.verbose ?? false,
    });

    // CI output
    if (values.ci) {
      const ciOutput = formatCIResults(result);
      if (ciOutput) {
        console.log(ciOutput);
      }
    }

    // Exit with appropriate code
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed with error:');
    console.error(error);
    process.exit(1);
  }
}

main();
