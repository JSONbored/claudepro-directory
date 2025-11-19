#!/usr/bin/env tsx
/**
 * Filter ts-prune output to show only real type system issues
 * Filters out Next.js framework exports, component defaults, and used types
 */

import { execSync } from 'child_process';

const EXCLUDE_PATTERNS = [
  // Next.js framework exports
  /:\d+ - (default|metadata|generateMetadata|revalidate|generateStaticParams|middleware|runtime|config)$/,
  // Component default exports (used by Next.js routing)
  /components\/.*:\d+ - default$/,
  // App route exports (used by Next.js)
  /app\/.*:\d+ - (default|metadata|generateMetadata|revalidate|generateStaticParams|GET|POST)$/,
  // Types marked as used
  /\(used in module\)$/,
  // Next.js generated types
  /\.next\/types\//,
];

const INCLUDE_PATTERNS = [
  // Unused type guards
  /is[A-Z]\w+$/,
  // Unused RPC return types
  /GetGet.*Return$/,
  // Unused type aliases
  /(ContentItem|FullContentItem)$/,
  // Unused type values
  /_VALUES$/,
];

function filterUnusedTypes() {
  try {
    const output = execSync('pnpm type-check:unused', { encoding: 'utf-8' });
    const lines = output.split('\n').filter((line) => line.trim());

    const filtered = lines.filter((line) => {
      // Exclude if matches exclude patterns
      if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(line))) {
        return false;
      }

      // Include if matches include patterns (type system issues)
      if (INCLUDE_PATTERNS.some((pattern) => pattern.test(line))) {
        return true;
      }

      // Include if it's a type definition in database-overrides.ts
      if (line.includes('database-overrides.ts') && !line.includes('(used in module)')) {
        return true;
      }

      return false;
    });

    if (filtered.length === 0) {
      console.log('✅ No unused type system issues found!');
      return;
    }

    console.log(`\n🔍 Found ${filtered.length} unused type system issues:\n`);
    console.log(filtered.join('\n'));
    console.log('\n');

    // Group by category
    const typeGuards = filtered.filter((l) => /is[A-Z]\w+$/.test(l));
    const rpcReturns = filtered.filter((l) => /GetGet.*Return$/.test(l));
    const typeAliases = filtered.filter((l) => /(ContentItem|FullContentItem)$/.test(l));
    const typeValues = filtered.filter((l) => /_VALUES$/.test(l));

    console.log('📊 Summary:');
    console.log(`   Type Guards: ${typeGuards.length}`);
    console.log(`   RPC Return Types: ${rpcReturns.length}`);
    console.log(`   Type Aliases: ${typeAliases.length}`);
    console.log(`   Type Values: ${typeValues.length}`);
    console.log(
      `   Other: ${filtered.length - typeGuards.length - rpcReturns.length - typeAliases.length - typeValues.length}\n`
    );

    process.exit(0);
  } catch (error) {
    console.error('Error running ts-prune:', error);
    process.exit(1);
  }
}

filterUnusedTypes();
