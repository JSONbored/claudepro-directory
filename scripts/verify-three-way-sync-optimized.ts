#!/usr/bin/env tsx
/**
 * OPTIMIZED Three-Way Verification: Content Files vs Database vs API
 * Single DB query, parallel API fetches with concurrency limit
 */

import { execSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
console.log('📥 Pulling environment variables from Vercel...');
execSync('vercel env pull .env.local --yes', { stdio: 'inherit' });

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
const CONCURRENCY = 10; // Parallel API requests
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log('✅ Environment variables loaded\n');

interface ContentItem {
  category: string;
  slug: string;
  data: any;
}

// Deep equality (order-independent)
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

// 1. Load ALL content files at once
async function loadAllContentFiles(): Promise<ContentItem[]> {
  const contentDir = join(process.cwd(), 'content');
  const categories = await readdir(contentDir, { withFileTypes: true });
  const allItems: ContentItem[] = [];

  for (const categoryEntry of categories) {
    if (!categoryEntry.isDirectory()) continue;
    const category = categoryEntry.name;
    const categoryPath = join(contentDir, category);
    const files = await readdir(categoryPath);

    for (const fileName of files) {
      if (!fileName.endsWith('.json')) continue;
      const filePath = join(categoryPath, fileName);
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      allItems.push({
        category,
        slug: data.slug || fileName.replace('.json', ''),
        data,
      });
    }
  }

  return allItems;
}

// 2. Fetch ALL database content in SINGLE query
async function loadAllDatabaseContent(): Promise<Map<string, any>> {
  console.log('📊 Fetching ALL content from database (single query)...');
  const { data, error } = await supabase.from('content').select('*');

  if (error) throw new Error(`Database query failed: ${error.message}`);

  const dbMap = new Map<string, any>();
  for (const row of data || []) {
    const key = `${row.category}:${row.slug}`;
    dbMap.set(key, row);
  }

  console.log(`✅ Loaded ${dbMap.size} items from database\n`);
  return dbMap;
}

// 3. Fetch API data with concurrency limit
async function fetchWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<any>
): Promise<any[]> {
  const results: any[] = [];
  const queue = [...items];
  const inProgress: Promise<void>[] = [];

  while (queue.length > 0 || inProgress.length > 0) {
    while (inProgress.length < concurrency && queue.length > 0) {
      const item = queue.shift()!;
      const promise = fn(item).then(
        (result) => {
          results.push(result);
          return result;
        },
        (error) => {
          results.push({ error });
          return error;
        }
      );
      inProgress.push(promise as Promise<void>);
    }

    if (inProgress.length > 0) {
      await Promise.race(inProgress);
      const finishedIndex = inProgress.findIndex((p) => {
        let finished = false;
        p.then(() => {
          finished = true;
        });
        return finished;
      });
      if (finishedIndex !== -1) {
        inProgress.splice(finishedIndex, 1);
      }
    }
  }

  return results;
}

async function loadAllAPIContent(contentItems: ContentItem[]): Promise<Map<string, any>> {
  console.log(`🌐 Fetching ${contentItems.length} items from API (${CONCURRENCY} concurrent)...`);

  const apiMap = new Map<string, any>();
  let completed = 0;

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async (_, batchIndex) => {
      for (let i = batchIndex; i < contentItems.length; i += CONCURRENCY) {
        const item = contentItems[i];
        try {
          const response = await fetch(`${API_BASE}/${item.category}/${item.slug}.json`);
          if (response.ok) {
            const data = await response.json();
            apiMap.set(`${item.category}:${item.slug}`, data);
          }
        } catch (error) {
          // API fetch failed
        }
        completed++;
        if (completed % 50 === 0) {
          process.stdout.write(`\r   Progress: ${completed}/${contentItems.length}`);
        }
      }
    })
  );

  console.log(`\r✅ Loaded ${apiMap.size} items from API\n`);
  return apiMap;
}

// 4. Compare all three sources
function verifyItem(
  item: ContentItem,
  dbData: any | undefined,
  apiData: any | undefined
): { status: 'pass' | 'fail'; issues: string[] } {
  const issues: string[] = [];

  if (!dbData) {
    return { status: 'fail', issues: ['❌ Missing in database'] };
  }
  if (!apiData) {
    return { status: 'fail', issues: ['❌ Missing in API'] };
  }

  // Compare fields
  const checkField = (field: string, contentVal: any, dbVal: any, apiVal: any) => {
    if (!deepEqual(contentVal, dbVal)) {
      issues.push(`⚠️  ${field}: Content ≠ Database`);
    }
    if (!deepEqual(contentVal, apiVal)) {
      issues.push(`⚠️  ${field}: Content ≠ API`);
    }
  };

  // Required fields
  checkField('description', item.data.description, dbData.description, apiData.description);
  checkField('author', item.data.author, dbData.author, apiData.author);
  checkField('tags', item.data.tags, dbData.tags, apiData.tags);

  // Optional fields
  if (item.data.content) checkField('content', item.data.content, dbData.content, apiData.content);
  if (item.data.features)
    checkField('features', item.data.features, dbData.features, apiData.features);
  if (item.data.useCases)
    checkField('use_cases', item.data.useCases, dbData.use_cases, apiData.use_cases);

  // Metadata
  if (item.data.configuration) {
    checkField(
      'configuration',
      item.data.configuration,
      dbData.metadata?.configuration,
      apiData.metadata?.configuration
    );
  }
  if (item.data.troubleshooting) {
    checkField(
      'troubleshooting',
      item.data.troubleshooting,
      dbData.metadata?.troubleshooting,
      apiData.metadata?.troubleshooting
    );
  }

  return { status: issues.length === 0 ? 'pass' : 'fail', issues };
}

async function main() {
  console.log('🔍 OPTIMIZED Three-Way Verification\n');
  console.log('═'.repeat(80));

  const startTime = Date.now();

  // Load all data sources in parallel
  const [contentItems, dbMap, apiMap] = await Promise.all([
    loadAllContentFiles(),
    loadAllDatabaseContent(),
    loadAllContentFiles().then((items) => loadAllAPIContent(items)),
  ]);

  console.log('🔄 Comparing content files vs database vs API...\n');

  const resultsByCategory = new Map<string, { passed: number; failed: number; items: any[] }>();

  for (const item of contentItems) {
    const key = `${item.category}:${item.slug}`;
    const dbData = dbMap.get(key);
    const apiData = apiMap.get(key);

    const result = verifyItem(item, dbData, apiData);

    if (!resultsByCategory.has(item.category)) {
      resultsByCategory.set(item.category, { passed: 0, failed: 0, items: [] });
    }
    const catResults = resultsByCategory.get(item.category)!;

    if (result.status === 'pass') {
      catResults.passed++;
    } else {
      catResults.failed++;
      catResults.items.push({ slug: item.slug, issues: result.issues });
    }
  }

  // Print results
  for (const [category, results] of resultsByCategory.entries()) {
    console.log(`\n📁 ${category.toUpperCase()}: ${results.passed + results.failed} items`);
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);

    if (results.failed > 0 && results.failed <= 5) {
      for (const item of results.items) {
        console.log(`\n   ${item.slug}:`);
        for (const issue of item.issues) {
          console.log(`     ${issue}`);
        }
      }
    } else if (results.failed > 5) {
      console.log('   (Showing first 3 failures)');
      for (const item of results.items.slice(0, 3)) {
        console.log(`\n   ${item.slug}:`);
        for (const issue of item.issues) {
          console.log(`     ${issue}`);
        }
      }
    }
  }

  // Summary
  const totalPassed = Array.from(resultsByCategory.values()).reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = Array.from(resultsByCategory.values()).reduce((sum, r) => sum + r.failed, 0);
  const total = totalPassed + totalFailed;
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '═'.repeat(80));
  console.log(`\n📊 FINAL SUMMARY (completed in ${duration}s):`);
  console.log(`   Total: ${total}`);
  console.log(`   Passed: ${totalPassed} (${((totalPassed / total) * 100).toFixed(1)}%)`);
  console.log(`   Failed: ${totalFailed} (${((totalFailed / total) * 100).toFixed(1)}%)`);

  if (totalFailed > 0) {
    console.log('\n❌ VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ VERIFICATION PASSED - Perfect 3-way sync!');
  }
}

main().catch(console.error);
