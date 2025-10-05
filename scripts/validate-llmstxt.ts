#!/usr/bin/env tsx
/**
 * LLMs.txt Validation Script
 * Validates that all llms.txt routes return proper format and content
 *
 * Usage:
 *   npm run validate:llmstxt
 *   tsx scripts/validate-llmstxt.ts
 *
 * Checks:
 * - All routes return 200 status
 * - Content-Type is text/plain; charset=utf-8
 * - Content follows llms.txt format
 * - PII sanitization is working
 * - Proper cache headers are set
 */

import fs from 'fs/promises';
import path from 'path';

const DEV_SERVER_URL = process.env.DEV_SERVER_URL || 'http://localhost:3000';
const TIMEOUT_MS = 10000;

/**
 * Color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Validation result interface
 */
interface ValidationResult {
  url: string;
  success: boolean;
  errors: string[];
  warnings: string[];
  contentLength: number;
  cacheControl?: string;
}

/**
 * Test route configuration
 */
interface TestRoute {
  path: string;
  description: string;
  type: 'site' | 'category' | 'item' | 'guide' | 'collection';
}

/**
 * PII patterns to check for (should NOT be in output)
 */
const PII_PATTERNS = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, name: 'Email addresses' },
  { pattern: /\b\d{3}-\d{3}-\d{4}\b/g, name: 'Phone numbers' },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, name: 'SSN' },
  { pattern: /\b4\d{3}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, name: 'Credit card (Visa)' },
  { pattern: /\bsk-[a-zA-Z0-9]{32,}\b/g, name: 'API keys (sk- prefix)' },
  { pattern: /\bAKIA[0-9A-Z]{16}\b/g, name: 'AWS Access Key' },
  {
    pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    name: 'Private keys',
  },
];

/**
 * Get all content files from a directory
 */
async function getContentFiles(directory: string): Promise<string[]> {
  try {
    const files = await fs.readdir(directory);
    return files.filter((file) => file.endsWith('.mdx') || file.endsWith('.json'));
  } catch {
    return [];
  }
}

/**
 * Generate test routes for validation
 */
async function generateTestRoutes(): Promise<TestRoute[]> {
  const routes: TestRoute[] = [
    // Site-wide llms.txt
    {
      path: '/llms.txt',
      description: 'Site-wide LLMs.txt index',
      type: 'site',
    },
  ];

  // Category routes
  const categories = ['agents', 'mcp', 'hooks', 'commands', 'rules', 'statuslines'];
  for (const category of categories) {
    routes.push({
      path: `/${category}/llms.txt`,
      description: `${category} category LLMs.txt`,
      type: 'category',
    });

    // Sample items from each category (first 2 items)
    const contentPath = path.join(process.cwd(), 'content', category);
    const files = await getContentFiles(contentPath);
    for (const file of files.slice(0, 2)) {
      const slug = file.replace(/\.(mdx|json)$/, '');
      routes.push({
        path: `/${category}/${slug}/llms.txt`,
        description: `${category}/${slug} item LLMs.txt`,
        type: 'item',
      });
    }
  }

  // Guide routes (sample from each guide category)
  const guideCategories = [
    'use-cases',
    'tutorials',
    'collections',
    'categories',
    'workflows',
    'comparisons',
    'troubleshooting',
  ];
  for (const guideCategory of guideCategories) {
    const guidePath = path.join(process.cwd(), 'content', 'guides', guideCategory);
    const files = await getContentFiles(guidePath);
    if (files.length > 0) {
      const slug = files[0].replace(/\.mdx$/, '');
      routes.push({
        path: `/guides/${guideCategory}/${slug}/llms.txt`,
        description: `guides/${guideCategory}/${slug} LLMs.txt`,
        type: 'guide',
      });
    }
  }

  // Collection routes (sample first 2)
  const collectionsPath = path.join(process.cwd(), 'content', 'collections');
  const collectionFiles = await getContentFiles(collectionsPath);
  for (const file of collectionFiles.slice(0, 2)) {
    const slug = file.replace(/\.json$/, '');
    routes.push({
      path: `/collections/${slug}/llms.txt`,
      description: `collections/${slug} LLMs.txt`,
      type: 'collection',
    });
  }

  return routes;
}

/**
 * Validate a single llms.txt route
 */
async function validateRoute(route: TestRoute): Promise<ValidationResult> {
  const url = `${DEV_SERVER_URL}${route.path}`;
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'llmstxt-validator/1.0',
      },
    });

    clearTimeout(timeoutId);

    // Check status code
    if (response.status !== 200) {
      errors.push(`Expected 200, got ${response.status}`);
      return {
        url,
        success: false,
        errors,
        warnings,
        contentLength: 0,
      };
    }

    // Check Content-Type
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/plain')) {
      errors.push(`Invalid Content-Type: ${contentType}`);
    }
    if (!contentType?.includes('charset=utf-8')) {
      warnings.push('Missing charset=utf-8 in Content-Type');
    }

    // Get content
    const content = await response.text();

    // Check minimum content length
    if (content.length < 50) {
      errors.push(`Content too short: ${content.length} bytes`);
    }

    // Check for required llms.txt format elements
    if (route.type === 'site') {
      // Site-wide should list categories
      if (!content.includes('# Claude Pro Directory')) {
        warnings.push('Missing site title');
      }
    } else if (route.type === 'category') {
      // Category pages should list items
      if (!content.includes('# Category:')) {
        warnings.push('Missing category header');
      }
    } else if (route.type === 'item' || route.type === 'guide' || route.type === 'collection') {
      // Individual items should have metadata
      if (!content.includes('Title:')) {
        warnings.push('Missing title metadata');
      }
      if (!content.includes('URL:')) {
        warnings.push('Missing URL metadata');
      }
    }

    // Check for PII leakage
    for (const { pattern, name } of PII_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        errors.push(`PII LEAK: Found ${name} - ${matches.length} occurrence(s)`);
      }
    }

    // Check cache headers
    const cacheControl = response.headers.get('cache-control');
    if (!cacheControl) {
      warnings.push('Missing Cache-Control header');
    } else if (!cacheControl.includes('public')) {
      warnings.push('Cache-Control missing "public"');
    }

    return {
      url,
      success: errors.length === 0,
      errors,
      warnings,
      contentLength: content.length,
      cacheControl: cacheControl || undefined,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errors.push(`Timeout after ${TIMEOUT_MS}ms`);
      } else {
        errors.push(`Fetch error: ${error.message}`);
      }
    } else {
      errors.push('Unknown error occurred');
    }

    return {
      url,
      success: false,
      errors,
      warnings,
      contentLength: 0,
    };
  }
}

/**
 * Print validation result
 */
function printResult(result: ValidationResult, index: number, total: number): void {
  const prefix = `[${index + 1}/${total}]`;
  const status = result.success
    ? `${colors.green}✓${colors.reset}`
    : `${colors.red}✗${colors.reset}`;

  console.log(`${prefix} ${status} ${result.url}`);

  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.log(`  ${colors.red}ERROR:${colors.reset} ${error}`);
    }
  }

  if (result.warnings.length > 0) {
    for (const warning of result.warnings) {
      console.log(`  ${colors.yellow}WARNING:${colors.reset} ${warning}`);
    }
  }

  if (result.success) {
    console.log(
      `  ${colors.cyan}Size:${colors.reset} ${result.contentLength} bytes | ${colors.cyan}Cache:${colors.reset} ${result.cacheControl || 'none'}`
    );
  }

  console.log('');
}

/**
 * Print summary statistics
 */
function printSummary(results: ValidationResult[]): void {
  const total = results.length;
  const successful = results.filter((r) => r.success).length;
  const failed = total - successful;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const totalSize = results.reduce((sum, r) => sum + r.contentLength, 0);

  console.log(`${colors.bright}=== Validation Summary ===${colors.reset}`);
  console.log(`Total routes tested: ${total}`);
  console.log(
    `Successful: ${colors.green}${successful}${colors.reset} | Failed: ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`
  );
  console.log(
    `Total errors: ${totalErrors > 0 ? colors.red : colors.green}${totalErrors}${colors.reset}`
  );
  console.log(
    `Total warnings: ${totalWarnings > 0 ? colors.yellow : colors.green}${totalWarnings}${colors.reset}`
  );
  console.log(`Total content size: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log('');

  if (failed > 0) {
    console.log(`${colors.red}${colors.bright}Validation FAILED${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bright}All validations PASSED${colors.reset}`);
    process.exit(0);
  }
}

/**
 * Main validation function
 */
async function main(): Promise<void> {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║        LLMs.txt Route Validation Script              ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);

  console.log(`${colors.cyan}Server:${colors.reset} ${DEV_SERVER_URL}`);
  console.log(`${colors.cyan}Timeout:${colors.reset} ${TIMEOUT_MS}ms\n`);

  // Check if dev server is running
  try {
    const healthCheck = await fetch(DEV_SERVER_URL, {
      signal: AbortSignal.timeout(5000),
    });
    if (!healthCheck.ok) {
      console.error(`${colors.red}ERROR: Dev server returned ${healthCheck.status}${colors.reset}`);
      process.exit(1);
    }
  } catch {
    console.error(
      `${colors.red}ERROR: Dev server not accessible at ${DEV_SERVER_URL}${colors.reset}`
    );
    console.error('Please start the dev server with: npm run dev\n');
    process.exit(1);
  }

  // Generate test routes
  console.log('Generating test routes...');
  const routes = await generateTestRoutes();
  console.log(`Found ${routes.length} routes to test\n`);

  // Run validations
  const results: ValidationResult[] = [];
  for (let i = 0; i < routes.length; i++) {
    const result = await validateRoute(routes[i]);
    results.push(result);
    printResult(result, i, routes.length);
  }

  // Print summary
  printSummary(results);
}

// Run validation
main().catch((error: unknown) => {
  console.error(`${colors.red}FATAL ERROR:${colors.reset}`, error);
  process.exit(1);
});
