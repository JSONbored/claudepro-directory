#!/usr/bin/env tsx
/**
 * Content Loader Validation Script
 *
 * Validates that the E2E test content loader correctly discovers all content
 * from generated TypeScript files and filesystem.
 *
 * This ensures the comprehensive SEO testing system has full coverage.
 */

import {
  getAllCategoryContent,
  getAllChangelogs,
  getAllCollections,
  getAllGuides,
  getAllStaticRoutes,
  getContentByCategory,
} from '../tests/e2e/helpers/content-loader';

console.log('🔍 Validating Content Loader Discovery...\n');

// 1. Validate category content from generated files
console.log('📦 Category Content (from generated/*.ts):');
const allContent = getAllCategoryContent();
console.log(`   Total: ${allContent.length} pages`);

const categories = ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'collections'];
for (const category of categories) {
  const content = getContentByCategory(category);
  console.log(`   - ${category}: ${content.length} items`);
}

console.log('');

// 2. Validate guides from filesystem
console.log('📚 Guides (from content/guides/):');
const allGuides = getAllGuides();
console.log(`   Total: ${allGuides.length} guides`);

// Group by category
const guidesByCategory = allGuides.reduce(
  (acc, guide) => {
    const cat = guide.category || 'uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

for (const [category, count] of Object.entries(guidesByCategory)) {
  console.log(`   - ${category}: ${count} guides`);
}

console.log('');

// 3. Validate collections from generated files
console.log('🗂️  Collections (from generated/collections-metadata.ts):');
const allCollections = getAllCollections();
console.log(`   Total: ${allCollections.length} collections`);
console.log('');

// 4. Validate changelogs from filesystem
console.log('📝 Changelogs (from content/changelog/):');
const allChangelogs = getAllChangelogs();
console.log(`   Total: ${allChangelogs.length} changelog entries`);
console.log('');

// 5. Validate static routes
console.log('📄 Static Routes:');
const allStaticRoutes = getAllStaticRoutes();
console.log(`   Total: ${allStaticRoutes.length} static pages`);
console.log('');

// Calculate total testable pages
const totalPages =
  allContent.length +
  allGuides.length +
  allCollections.length +
  allChangelogs.length +
  allStaticRoutes.length;

console.log('✅ Validation Complete!\n');
console.log('📊 Total Coverage:');
console.log(`   ${totalPages} pages will be tested automatically`);
console.log('');
console.log('🎯 Dynamic Testing Benefits:');
console.log('   - Zero hardcoded numbers');
console.log('   - Automatic coverage of new content');
console.log('   - Tests actual production content (generated files)');
console.log('   - 100% type-safe with compile-time validation');
console.log('');

// Validation checks
let hasErrors = false;

if (allContent.length === 0) {
  console.error('❌ ERROR: No category content discovered!');
  console.error('   Run `npm run build` to generate content metadata files.');
  hasErrors = true;
}

if (allGuides.length === 0) {
  console.warn('⚠️  WARNING: No guides discovered in content/guides/');
}

if (allCollections.length === 0) {
  console.warn('⚠️  WARNING: No collections discovered!');
}

if (allStaticRoutes.length === 0) {
  console.error('❌ ERROR: No static routes defined!');
  hasErrors = true;
}

if (hasErrors) {
  console.error('\n❌ Validation failed! Please fix errors above.');
  process.exit(1);
}

console.log('✨ All content discovery working correctly!');
console.log('');
console.log('Next steps:');
console.log('   1. Run Playwright tests: npx playwright test --ui');
console.log('   2. View at: http://localhost:9323');
console.log('   3. All pages will be tested automatically');
