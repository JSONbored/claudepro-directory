#!/usr/bin/env tsx
/**
 * Apply CSS Variable Consolidation Command
 * 
 * Applies CSS variable consolidation using PostCSS plugin:
 * - Deduplicates variables with same value
 * - Maps old variable names to new tweakcn theme names
 * - Updates all variable references
 * - Removes old/duplicate variables
 * 
 * Usage:
 *   pnpm exec heyclaude-apply-variable-consolidation --dry-run  # Analyze only
 *   pnpm exec heyclaude-apply-variable-consolidation              # Apply changes
 */

import { readFileSync, writeFileSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as postcss from 'postcss';

import { logger } from '../toolkit/logger.ts';
import {
  analyzeVariableConsolidation,
  findVariableMappings,
  findRemovableVariables,
  findConflicts,
  type ConsolidationReport,
} from '../utils/css-migration/variable-consolidation.ts';
import variableConsolidationPlugin, { transformations } from '../utils/css-migration/postcss-variable-consolidation.ts';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = join(__filename, '..');
const PROJECT_ROOT = join(SCRIPT_DIR, '../../../../');

// Find all CSS files
function findCSSFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        findCSSFiles(filePath, fileList);
      }
    } else if (extname(file) === '.css') {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Generate consolidation report for CSS files
 */
async function generateConsolidationReport(): Promise<ConsolidationReport> {
  const cssFiles = findCSSFiles(join(PROJECT_ROOT, 'apps/web/src'));
  
  logger.info(`Analyzing ${cssFiles.length} CSS files for consolidation...`);

  // Analyze globals.css (main file with both old and new variables)
  const globalsPath = join(PROJECT_ROOT, 'apps/web/src/app/globals.css');
  const globalsContent = readFileSync(globalsPath, 'utf-8');
  
  const { variables, duplicates } = analyzeVariableConsolidation(globalsContent, globalsPath);
  const mappings = findVariableMappings(variables);
  const removable = findRemovableVariables(variables, mappings);

  // Separate old and new variables
  const oldVariables = new Map<string, { value: string; line?: number }>();
  const newVariables = new Map<string, { value: string; line?: number }>();

  for (const [name, data] of variables.entries()) {
    if (name.startsWith('--color-') || name.startsWith('--dark-') || name.startsWith('--light-')) {
      oldVariables.set(name, data);
    } else if (
      name.startsWith('--background') || name.startsWith('--foreground') || 
      name.startsWith('--primary') || name.startsWith('--secondary') ||
      name.startsWith('--muted') || name.startsWith('--accent') ||
      name.startsWith('--destructive') || name.startsWith('--border') ||
      name.startsWith('--input') || name.startsWith('--ring') ||
      name.startsWith('--card') || name.startsWith('--popover') ||
      name.startsWith('--sidebar') || name.startsWith('--chart-')
    ) {
      newVariables.set(name, data);
    }
  }

  const conflicts = findConflicts(oldVariables, newVariables, mappings);

  // Convert duplicates to opportunities
  const duplicateOpportunities = [];
  for (const [value, vars] of duplicates.entries()) {
    if (vars.length > 1) {
      // Prefer new theme variable names over old ones
      const newThemeVar = vars.find(v => 
        !v.name.startsWith('--color-') && 
        !v.name.startsWith('--dark-') && 
        !v.name.startsWith('--light-')
      );
      
      const recommended = newThemeVar || vars.reduce((prev, curr) => 
        curr.name.length < prev.name.length ? curr : prev
      );
      
      duplicateOpportunities.push({
        variables: vars.map(v => v.name),
        value: value.substring(0, 80) + (value.length > 80 ? '...' : ''),
        recommendedName: recommended.name,
        files: [relative(PROJECT_ROOT, globalsPath)],
      });
    }
  }

  return {
    mappings,
    duplicates: duplicateOpportunities,
    removable,
    conflicts,
  };
}

/**
 * Apply consolidation to CSS files
 */
export async function applyVariableConsolidation(dryRun: boolean = false): Promise<void> {
  logger.info('=== CSS Variable Consolidation ===');
  
  if (dryRun) {
    logger.info('DRY RUN MODE - Analysis only, no files will be modified');
  } else {
    logger.warn('LIVE MODE - Files will be modified');
  }

  // Step 1: Generate consolidation report
  logger.info('Step 1: Analyzing CSS variables...');
  const report = await generateConsolidationReport();

  logger.info(`Found:`);
  logger.info(`  - ${report.mappings.length} variable mappings (old → new)`);
  logger.info(`  - ${report.duplicates.length} duplicate groups`);
  logger.info(`  - ${report.removable.length} removable variables`);
  logger.info(`  - ${report.conflicts.length} conflicts (need manual review)`);

  if (report.conflicts.length > 0) {
    logger.info('⚠️  Conflicts found - new tweakcn values will take precedence:');
    for (const conflict of report.conflicts) {
      logger.info(`  - ${conflict.oldName} → ${conflict.newName} (using new tweakcn value)`);
    }
    logger.info('Continuing with consolidation - new tweakcn values take precedence as requested.');
  }

  // Step 2: Find all CSS files
  const cssFiles = findCSSFiles(join(PROJECT_ROOT, 'apps/web/src'));
  logger.info(`Step 2: Processing ${cssFiles.length} CSS files...`);

  // Step 3: Apply consolidation to each file
  let totalTransformations = 0;
  const fileResults: Array<{
    file: string;
    transformations: number;
    errors?: string[];
  }> = [];

  for (const filePath of cssFiles) {
    const relativePath = relative(PROJECT_ROOT, filePath);
    
    try {
      // Clear transformations for this file
      transformations.length = 0;

      const css = readFileSync(filePath, 'utf-8');
      
      // Create PostCSS processor with consolidation plugin
      const processor = postcss.default([
        variableConsolidationPlugin({
          report,
          dryRun,
          verbose: false, // Set to true for detailed logging
        }),
      ]);

      // Process CSS
      const result = await processor.process(css, {
        from: filePath,
        to: filePath,
      });

      const fileTransformations = transformations.length;
      totalTransformations += fileTransformations;

      if (fileTransformations > 0) {
        logger.info(`  ${relativePath}: ${fileTransformations} transformations`);

        if (!dryRun) {
          // Create backup
          const backupPath = `${filePath}.backup`;
          copyFileSync(filePath, backupPath);
          logger.info(`    Backup created: ${backupPath}`);

          // Write consolidated CSS
          writeFileSync(filePath, result.css, 'utf-8');
          logger.info(`    ✅ Consolidated`);
        }
      }

      fileResults.push({
        file: relativePath,
        transformations: fileTransformations,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error processing ${relativePath}:`, { error: errorMessage });
      
      fileResults.push({
        file: relativePath,
        transformations: 0,
        errors: [errorMessage],
      });
    }
  }

  // Step 4: Summary
  logger.info('\n=== Consolidation Summary ===');
  logger.info(`Total transformations: ${totalTransformations}`);
  logger.info(`Files processed: ${cssFiles.length}`);
  logger.info(`Files modified: ${fileResults.filter(r => r.transformations > 0).length}`);

  if (dryRun) {
    logger.info('\n✅ DRY RUN complete - no files were modified');
    logger.info('Run without --dry-run to apply changes');
  } else {
    logger.info('\n✅ Consolidation complete!');
    logger.info('Backup files created with .backup extension');
  }

  // Generate detailed report
  const reportPath = join(PROJECT_ROOT, '.cursor/tailwind-cleanup/consolidation-application-report.md');
  let md = '# CSS Variable Consolidation Application Report\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `- **Mode:** ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (changes applied)'}\n`;
  md += `- **Total Transformations:** ${totalTransformations}\n`;
  md += `- **Files Processed:** ${cssFiles.length}\n`;
  md += `- **Files Modified:** ${fileResults.filter(r => r.transformations > 0).length}\n\n`;

  md += `## File Results\n\n`;
  md += `| File | Transformations | Status |\n`;
  md += `|------|----------------|--------|\n`;
  for (const result of fileResults) {
    const status = result.errors ? `❌ Error: ${result.errors[0]}` : 
                   result.transformations > 0 ? '✅ Modified' : '⏭️  No changes';
    md += `| \`${result.file}\` | ${result.transformations} | ${status} |\n`;
  }

  // Write report
  const { mkdirSync } = await import('node:fs');
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, md, 'utf-8');

  logger.info(`\nDetailed report saved to: ${reportPath}`);
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');

  applyVariableConsolidation(dryRun).catch((error) => {
    logger.error('Consolidation failed', { error });
    process.exit(1);
  });
}
