#!/usr/bin/env tsx

/**
 * SEO Title Verification Script
 * Verifies that all page titles meet SEO character requirements (<60 chars)
 */

import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import type { MetadataContext } from '@/src/lib/seo/metadata-registry';
import { getDisplayTitle } from '@/src/lib/utils';

interface TitleResult {
  route: string;
  title: string;
  length: number;
  status: 'pass' | 'warn' | 'fail';
  type: string;
}

const results: TitleResult[] = [];
const MAX_CHARS = 60;
const WARN_CHARS = 55;

async function verifyTitle(route: string, context: MetadataContext, type: string) {
  try {
    const metadata = await generatePageMetadata(route, context);
    const title = metadata.title?.toString() || '';
    const length = title.length;

    let status: 'pass' | 'warn' | 'fail' = 'pass';
    if (length > MAX_CHARS) {
      status = 'fail';
    } else if (length < WARN_CHARS) {
      status = 'warn';
    }

    results.push({
      route,
      title,
      length,
      status,
      type,
    });
  } catch (error) {
    console.error(`Error verifying ${route}:`, error);
  }
}

async function main() {
  console.log('🔍 Verifying SEO Titles for All Pages\n');
  console.log('='.repeat(80));

  // 1. Home page
  await verifyTitle('/', {}, 'home');

  // 2. Section pages
  const sections = [
    'guides',
    'collections',
    'community',
    'jobs',
    'partner',
    'submit',
    'trending',
    'api-docs',
  ];
  for (const section of sections) {
    await verifyTitle(`/${section}`, {}, 'section');
  }

  // 3. Category pages
  const contentDir = path.join(process.cwd(), 'public/static-api/generated');

  // Load all content types
  const categories = ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines'];

  for (const category of categories) {
    // Category page
    await verifyTitle(
      `/${category}`,
      {
        categoryConfig: {
          title: getDisplayTitle({ slug: category, category }) as string,
          slug: category,
        },
      },
      'category'
    );

    // Load content items
    const apiFile = path.join(contentDir, `${category}.json`);
    if (existsSync(apiFile)) {
      const items = JSON.parse(await fs.readFile(apiFile, 'utf-8'));

      // Content pages
      for (const item of items) {
        await verifyTitle(
          `/${category}/${item.slug}`,
          {
            item: {
              ...item,
              category,
            },
            categoryConfig: {
              title: getDisplayTitle({ slug: category, category }) as string,
              slug: category,
            },
          },
          'content'
        );
      }
    }
  }

  // 4. Collections
  const collectionsFile = path.join(contentDir, 'collections.json');
  if (existsSync(collectionsFile)) {
    const collections = JSON.parse(await fs.readFile(collectionsFile, 'utf-8'));
    for (const collection of collections) {
      await verifyTitle(
        `/collections/${collection.slug}`,
        {
          item: collection,
        },
        'collection'
      );
    }
  }

  // 5. Guides
  const guidesDir = path.join(process.cwd(), 'content/guides');
  const guideCategories = await fs.readdir(guidesDir);

  for (const guideCategory of guideCategories) {
    const categoryPath = path.join(guidesDir, guideCategory);
    const stat = await fs.stat(categoryPath);

    if (stat.isDirectory()) {
      // Guide category page
      await verifyTitle(`/guides/${guideCategory}`, {}, 'guide-category');

      // Guide pages
      const files = await fs.readdir(categoryPath);
      for (const file of files) {
        if (file.endsWith('.mdx')) {
          const content = await fs.readFile(path.join(categoryPath, file), 'utf-8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

          if (frontmatterMatch) {
            const frontmatter: { title?: string; seoTitle?: string } = {};
            const lines = frontmatterMatch[1].split('\n');

            for (const line of lines) {
              const match = line.match(/^(\w+):\s*(.+)$/);
              if (match) {
                const [, key, value] = match;
                frontmatter[key] = value.replace(/^["']|["']$/g, '');
              }
            }

            const slug = file.replace('.mdx', '');
            await verifyTitle(
              `/guides/${guideCategory}/${slug}`,
              {
                params: {
                  category: guideCategory,
                  slug,
                },
                item: {
                  title: frontmatter.title || '',
                  seoTitle: frontmatter.seoTitle,
                  description: frontmatter.description || '',
                  tags: [],
                },
              },
              'guide'
            );
          }
        }
      }
    }
  }

  // Print results
  console.log('\n📊 VERIFICATION RESULTS\n');
  console.log('='.repeat(80));

  const failures = results.filter((r) => r.status === 'fail');
  const warnings = results.filter((r) => r.status === 'warn');
  const passes = results.filter((r) => r.status === 'pass');

  console.log(`\n❌ FAILURES (>${MAX_CHARS} chars): ${failures.length}`);
  if (failures.length > 0) {
    for (const result of failures) {
      console.log(`   ${result.length} chars | ${result.route}`);
      console.log(`   "${result.title}"`);
      console.log('');
    }
  }

  console.log(`\n⚠️  WARNINGS (<${WARN_CHARS} chars): ${warnings.length}`);
  if (warnings.length > 0) {
    for (const result of warnings.slice(0, 10)) {
      console.log(`   ${result.length} chars | ${result.route}`);
      console.log(`   "${result.title}"`);
      console.log('');
    }
    if (warnings.length > 10) {
      console.log(`   ... and ${warnings.length - 10} more`);
    }
  }

  console.log(`\n✅ PASSES (${WARN_CHARS}-${MAX_CHARS} chars): ${passes.length}`);
  if (passes.length > 0) {
    for (const result of passes.slice(0, 10)) {
      console.log(`   ${result.length} chars | ${result.route}`);
      console.log(`   "${result.title}"`);
      console.log('');
    }
    if (passes.length > 10) {
      console.log(`   ... and ${passes.length - 10} more`);
    }
  }

  // Summary by type
  console.log('\n📈 SUMMARY BY TYPE\n');
  console.log('='.repeat(80));

  const types = [...new Set(results.map((r) => r.type))];
  for (const type of types) {
    const typeResults = results.filter((r) => r.type === type);
    const typeFails = typeResults.filter((r) => r.status === 'fail').length;
    const typeWarns = typeResults.filter((r) => r.status === 'warn').length;
    const typePasses = typeResults.filter((r) => r.status === 'pass').length;

    console.log(`${type.toUpperCase()}: ${typeResults.length} total`);
    console.log(`   ✅ ${typePasses} pass | ⚠️  ${typeWarns} warn | ❌ ${typeFails} fail`);
  }

  // Final summary
  console.log(`\n${'='.repeat(80)}`);
  console.log(`\n📊 OVERALL: ${results.length} pages verified`);
  console.log(
    `   ✅ ${passes.length} pass (${((passes.length / results.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `   ⚠️  ${warnings.length} warn (${((warnings.length / results.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `   ❌ ${failures.length} fail (${((failures.length / results.length) * 100).toFixed(1)}%)`
  );

  if (failures.length === 0) {
    console.log('\n✨ All page titles meet SEO requirements!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some page titles exceed 60 characters. Please review.\n');
    process.exit(1);
  }
}

main().catch(console.error);
