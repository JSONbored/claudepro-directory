#!/usr/bin/env tsx

/**
 * Knip Design System Plugin Runner
 *
 * Runs the design system Knip plugin to find deprecated semantic utility usage.
 *
 * Usage:
 *   pnpm exec heyclaude-knip-design-system
 */

// Removed unused imports and variables: fileURLToPath, __filename, SCRIPT_DIR, PROJECT_ROOT

import designSystemPlugin from '../knip-plugins/design-system.ts';

async function main() {
  try {
    console.log('Running design system analysis...\n');
    console.log(
      '⚠️  Looking for deprecated semantic utility usage (should migrate to Direct Tailwind)\n'
    );

    const result = await designSystemPlugin.check();

    console.log('\n=== Design System Migration Report ===\n');
    console.log(
      `Files using deprecated semantic utilities: ${result.summary.filesUsingSemanticUtilities}`
    );
    console.log(`Files using deprecated old constants: ${result.summary.filesUsingOldConstants}`);
    console.log(`Total files needing migration: ${result.summary.totalFilesNeedingMigration}`);
    console.log(`Total CSS variables in @theme: ${result.summary.totalCSSVariables}\n`);

    if (result.deprecatedSemanticUtilities.length > 0) {
      console.log('\n=== Files Using Deprecated Semantic Utilities ===\n');
      console.log(
        'These files import from @heyclaude/web-runtime/design-system (style utilities).'
      );
      console.log('They should be migrated to Direct Tailwind classes.\n');

      for (const usage of result.deprecatedSemanticUtilities.slice(0, 50)) {
        console.log(`- ${usage.file}`);
        console.log(`  Imports: ${usage.imports.join(', ')}`);
      }
      if (result.deprecatedSemanticUtilities.length > 50) {
        console.log(`\n... and ${result.deprecatedSemanticUtilities.length - 50} more files`);
      }
    }

    if (result.deprecatedOldConstants.length > 0) {
      console.log('\n=== Files Using Deprecated Old Constants ===\n');
      console.log('These files use old constants (DIMENSIONS, ANIMATION_CONSTANTS, etc.).');
      console.log('They should be migrated to Direct Tailwind classes.\n');

      for (const usage of result.deprecatedOldConstants.slice(0, 50)) {
        console.log(`- ${usage.file}`);
        console.log(`  Constants: ${usage.imports.join(', ')}`);
      }
      if (result.deprecatedOldConstants.length > 50) {
        console.log(`\n... and ${result.deprecatedOldConstants.length - 50} more files`);
      }
    }

    if (
      result.deprecatedSemanticUtilities.length === 0 &&
      result.deprecatedOldConstants.length === 0
    ) {
      console.log('\n✅ No deprecated design system usage found!');
      console.log('All files are using Direct Tailwind with @theme as the design system.');
    } else {
      console.log(
        '\n⚠️  Migration needed: See migration plan at .cursor/design-system-migration-plan.md'
      );
    }

    process.exit(0);
  } catch (error) {
    console.error('Error running design system analysis:', error);
    process.exit(1);
  }
}

main();
