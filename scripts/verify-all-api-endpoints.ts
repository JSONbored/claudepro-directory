#!/usr/bin/env tsx
/**
 * Verify ALL API endpoints return complete data
 * Tests every single piece of content against expected fields
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const API_BASE = 'http://localhost:3055';

interface VerificationResult {
  category: string;
  slug: string;
  status: 'pass' | 'fail';
  missingFields: string[];
  nullFields: string[];
  errors: string[];
}

async function getAllContentSlugs(): Promise<Map<string, string[]>> {
  const contentDir = join(process.cwd(), 'content');
  const categories = await readdir(contentDir, { withFileTypes: true });
  const byCategory = new Map<string, string[]>();

  for (const categoryEntry of categories) {
    if (!categoryEntry.isDirectory()) continue;

    const category = categoryEntry.name;
    const categoryPath = join(contentDir, category);
    const categoryFiles = await readdir(categoryPath);
    const slugs: string[] = [];

    for (const fileName of categoryFiles) {
      if (!fileName.endsWith('.json')) continue;

      const filePath = join(categoryPath, fileName);
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      slugs.push(data.slug || fileName.replace('.json', ''));
    }

    byCategory.set(category, slugs);
  }

  return byCategory;
}

async function verifyEndpoint(
  category: string,
  slug: string
): Promise<VerificationResult> {
  const result: VerificationResult = {
    category,
    slug,
    status: 'pass',
    missingFields: [],
    nullFields: [],
    errors: [],
  };

  try {
    const response = await fetch(`${API_BASE}/${category}/${slug}.json`);

    if (!response.ok) {
      result.status = 'fail';
      result.errors.push(`HTTP ${response.status}: ${response.statusText}`);
      return result;
    }

    const data = await response.json();

    // Required fields for all categories
    const requiredFields = [
      'slug',
      'title',
      'description',
      'author',
      'date_added',
      'tags',
    ];

    // Check for missing fields
    for (const field of requiredFields) {
      if (!(field in data)) {
        result.missingFields.push(field);
        result.status = 'fail';
      } else if (data[field] === null) {
        result.nullFields.push(field);
        result.status = 'fail';
      }
    }

    // Category-specific checks
    // Content field: agents, commands, mcp, rules, skills, statuslines have content (hooks do NOT)
    if (['agents', 'commands', 'mcp', 'rules', 'skills', 'statuslines'].includes(category)) {
      if (!('content' in data) || data.content === null) {
        result.nullFields.push('content');
        result.status = 'fail';
      }
    }

    // Features field: agents, hooks, mcp, skills, statuslines have features (commands, rules do NOT)
    if (['agents', 'hooks', 'mcp', 'skills', 'statuslines'].includes(category)) {
      if (!('features' in data) || data.features === null || data.features.length === 0) {
        result.nullFields.push('features');
        result.status = 'fail';
      }
    }

    // Check metadata for configuration and troubleshooting
    // Configuration: commands, hooks, mcp, rules, statuslines have it (agents, skills, collections do NOT)
    if (['commands', 'hooks', 'mcp', 'rules', 'statuslines'].includes(category)) {
      if (!data.metadata || !data.metadata.configuration) {
        result.nullFields.push('metadata.configuration');
        result.status = 'fail';
      }
    }

    // Troubleshooting: ALL categories except collections have it
    if (category !== 'collections') {
      if (!data.metadata || !data.metadata.troubleshooting) {
        result.nullFields.push('metadata.troubleshooting');
        result.status = 'fail';
      }
    }

  } catch (error) {
    result.status = 'fail';
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

async function main() {
  console.log('🔍 Verifying ALL API Endpoints\n');
  console.log('═'.repeat(80));

  const byCategory = await getAllContentSlugs();
  const allResults: VerificationResult[] = [];

  for (const [category, slugs] of byCategory.entries()) {
    console.log(`\n📁 ${category.toUpperCase()} (${slugs.length} items)`);
    console.log('─'.repeat(80));

    let passed = 0;
    let failed = 0;

    for (const slug of slugs) {
      const result = await verifyEndpoint(category, slug);
      allResults.push(result);

      if (result.status === 'pass') {
        console.log(`✅ ${slug}`);
        passed++;
      } else {
        console.log(`❌ ${slug}`);
        if (result.missingFields.length > 0) {
          console.log(`   Missing: ${result.missingFields.join(', ')}`);
        }
        if (result.nullFields.length > 0) {
          console.log(`   Null: ${result.nullFields.join(', ')}`);
        }
        if (result.errors.length > 0) {
          console.log(`   Errors: ${result.errors.join(', ')}`);
        }
        failed++;
      }
    }

    console.log(`\n📊 ${category}: ${passed} passed, ${failed} failed`);
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  const totalPassed = allResults.filter((r) => r.status === 'pass').length;
  const totalFailed = allResults.filter((r) => r.status === 'fail').length;
  const total = allResults.length;

  console.log('\n📊 FINAL SUMMARY:');
  console.log(`   Total: ${total}`);
  console.log(`   Passed: ${totalPassed} (${((totalPassed / total) * 100).toFixed(1)}%)`);
  console.log(`   Failed: ${totalFailed} (${((totalFailed / total) * 100).toFixed(1)}%)`);

  if (totalFailed > 0) {
    console.log('\n❌ VERIFICATION FAILED - Issues found');
    process.exit(1);
  } else {
    console.log('\n✅ VERIFICATION PASSED - All endpoints working correctly');
  }
}

main().catch(console.error);
