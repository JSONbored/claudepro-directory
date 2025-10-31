#!/usr/bin/env tsx
/**
 * Three-Way Verification: Content Files vs Database vs API
 * Ensures perfect sync between all 3 sources
 */

import { execSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from Vercel
console.log('📥 Pulling environment variables from Vercel...');
execSync('vercel env pull .env.local --yes', { stdio: 'inherit' });

// Now read from .env.local file
const envContent = await readFile('.env.local', 'utf-8');
const envVars = Object.fromEntries(
  envContent
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [key, ...values] = line.split('=');
      return [key, values.join('=').replace(/^["']|["']$/g, '')];
    })
);

Object.assign(process.env, envVars);

const API_BASE = 'http://localhost:3055';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log('✅ Environment variables loaded from Vercel\n');
const supabase = createClient(supabaseUrl, supabaseKey);

interface VerificationResult {
  category: string;
  slug: string;
  status: 'pass' | 'fail';
  issues: string[];
}

async function getAllContentFiles(): Promise<Map<string, Array<{ slug: string; data: any }>>> {
  const contentDir = join(process.cwd(), 'content');
  const categories = await readdir(contentDir, { withFileTypes: true });
  const byCategory = new Map<string, Array<{ slug: string; data: any }>>();

  for (const categoryEntry of categories) {
    if (!categoryEntry.isDirectory()) continue;

    const category = categoryEntry.name;
    const categoryPath = join(contentDir, category);
    const files = await readdir(categoryPath);
    const items: Array<{ slug: string; data: any }> = [];

    for (const fileName of files) {
      if (!fileName.endsWith('.json')) continue;

      const filePath = join(categoryPath, fileName);
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      items.push({ slug: data.slug || fileName.replace('.json', ''), data });
    }

    byCategory.set(category, items);
  }

  return byCategory;
}

async function verify3Way(category: string, slug: string, contentData: any): Promise<VerificationResult> {
  const result: VerificationResult = {
    category,
    slug,
    status: 'pass',
    issues: [],
  };

  try {
    // 1. Fetch from DATABASE
    const { data: dbData, error: dbError } = await supabase
      .from('content')
      .select('*')
      .eq('category', category)
      .eq('slug', slug)
      .single();

    if (dbError || !dbData) {
      result.status = 'fail';
      result.issues.push(`❌ DATABASE: ${dbError?.message || 'Not found'}`);
      return result;
    }

    // 2. Fetch from API
    let apiData: any;
    try {
      const response = await fetch(`${API_BASE}/${category}/${slug}.json`);
      if (!response.ok) {
        result.status = 'fail';
        result.issues.push(`❌ API: HTTP ${response.status}`);
        return result;
      }
      apiData = await response.json();
    } catch (error) {
      result.status = 'fail';
      result.issues.push(`❌ API: ${error instanceof Error ? error.message : 'Fetch failed'}`);
      return result;
    }

    // Deep equality comparison (handles nested objects, arrays, order-independent)
    const deepEqual = (a: any, b: any): boolean => {
      if (a === b) return true;
      if (a == null || b == null) return false;
      if (typeof a !== typeof b) return false;

      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
      }

      if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a).sort();
        const keysB = Object.keys(b).sort();

        if (keysA.length !== keysB.length) return false;
        if (!deepEqual(keysA, keysB)) return false;

        for (const key of keysA) {
          if (!deepEqual(a[key], b[key])) return false;
        }
        return true;
      }

      return false;
    };

    // 3. COMPARE: Content File vs Database vs API
    const checkField = (field: string, contentValue: any, dbValue: any, apiValue: any) => {
      if (!deepEqual(contentValue, dbValue)) {
        result.status = 'fail';
        result.issues.push(`⚠️  ${field}: Content ≠ Database`);
        result.issues.push(`   Content: ${JSON.stringify(contentValue).substring(0, 100)}...`);
        result.issues.push(`   Database: ${JSON.stringify(dbValue).substring(0, 100)}...`);
      }
      if (!deepEqual(contentValue, apiValue)) {
        result.status = 'fail';
        result.issues.push(`⚠️  ${field}: Content ≠ API`);
        result.issues.push(`   Content: ${JSON.stringify(contentValue).substring(0, 100)}...`);
        result.issues.push(`   API: ${JSON.stringify(apiValue).substring(0, 100)}...`);
      }
      if (!deepEqual(dbValue, apiValue)) {
        result.status = 'fail';
        result.issues.push(`⚠️  ${field}: Database ≠ API`);
        result.issues.push(`   Database: ${JSON.stringify(dbValue).substring(0, 100)}...`);
        result.issues.push(`   API: ${JSON.stringify(apiValue).substring(0, 100)}...`);
      }
    };

    // Required fields for all categories (only check fields that exist in content files)
    // Title is generated from slug, so skip it in comparison
    checkField('description', contentData.description, dbData.description, apiData.description);
    checkField('author', contentData.author, dbData.author, apiData.author);
    checkField('tags', contentData.tags, dbData.tags, apiData.tags);

    // Optional common fields
    if (contentData.content !== undefined) {
      checkField('content', contentData.content, dbData.content, apiData.content);
    }
    if (contentData.features !== undefined) {
      checkField('features', contentData.features, dbData.features, apiData.features);
    }
    if (contentData.useCases !== undefined) {
      checkField('use_cases', contentData.useCases, dbData.use_cases, apiData.use_cases);
    }

    // Metadata fields - only check if content file has them
    if (contentData.configuration !== undefined) {
      const dbConfig = dbData.metadata?.configuration;
      const apiConfig = apiData.metadata?.configuration;
      if (dbConfig !== undefined && apiConfig !== undefined) {
        checkField('configuration', contentData.configuration, dbConfig, apiConfig);
      } else {
        result.status = 'fail';
        if (dbConfig === undefined) result.issues.push('⚠️  configuration: Missing in database metadata');
        if (apiConfig === undefined) result.issues.push('⚠️  configuration: Missing in API metadata');
      }
    }
    if (contentData.troubleshooting !== undefined) {
      const dbTrouble = dbData.metadata?.troubleshooting;
      const apiTrouble = apiData.metadata?.troubleshooting;
      if (dbTrouble !== undefined && apiTrouble !== undefined) {
        checkField('troubleshooting', contentData.troubleshooting, dbTrouble, apiTrouble);
      } else {
        result.status = 'fail';
        if (dbTrouble === undefined) result.issues.push('⚠️  troubleshooting: Missing in database metadata');
        if (apiTrouble === undefined) result.issues.push('⚠️  troubleshooting: Missing in API metadata');
      }
    }

  } catch (error) {
    result.status = 'fail';
    result.issues.push(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

async function main() {
  console.log('🔍 Three-Way Verification: Content → Database → API\n');
  console.log('═'.repeat(80));

  const byCategory = await getAllContentFiles();
  const allResults: VerificationResult[] = [];

  for (const [category, items] of byCategory.entries()) {
    console.log(`\n📁 ${category.toUpperCase()} (${items.length} items)`);
    console.log('─'.repeat(80));

    let passed = 0;
    let failed = 0;

    for (const { slug, data } of items) {
      const result = await verify3Way(category, slug, data);
      allResults.push(result);

      if (result.status === 'pass') {
        console.log(`✅ ${slug}`);
        passed++;
      } else {
        console.log(`❌ ${slug}`);
        for (const issue of result.issues) {
          console.log(`   ${issue}`);
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
    console.log('\n❌ VERIFICATION FAILED - Sync issues detected');
    console.log('Content files, database, and API endpoints are NOT perfectly synced');
    process.exit(1);
  } else {
    console.log('\n✅ VERIFICATION PASSED - Perfect 3-way sync!');
    console.log('Content files = Database = API endpoints');
  }
}

main().catch(console.error);
