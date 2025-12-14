#!/usr/bin/env tsx
/**
 * CSS Variable Consolidation Command
 * 
 * Analyzes and consolidates duplicate CSS variables, mapping old names to new tweakcn theme names.
 * 
 * Usage:
 *   pnpm exec heyclaude-consolidate-variables --dry-run  # Analyze only
 *   pnpm exec heyclaude-consolidate-variables              # Apply changes (when ready)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as postcss from 'postcss';

import { logger } from '../toolkit/logger.js';
import {
  analyzeVariableConsolidation,
  findVariableMappings,
  findRemovableVariables,
  findConflicts,
  type ConsolidationReport,
} from '../utils/css-migration/variable-consolidation.js';

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
 * Generate consolidation report for all CSS files
 */
export async function runConsolidateVariables(dryRun: boolean = false): Promise<ConsolidationReport> {
  const cssFiles = findCSSFiles(join(PROJECT_ROOT, 'apps/web/src'));
  
  logger.info(`Found ${cssFiles.length} CSS files`);

  if (dryRun) {
    logger.info('DRY RUN MODE - Analysis only, no files will be modified');
  } else {
    logger.warn('LIVE MODE - Files will be modified (NOT IMPLEMENTED YET)');
  }

  // Analyze globals.css (main file with both old and new variables)
  const globalsPath = join(PROJECT_ROOT, 'apps/web/src/app/globals.css');
  const globalsContent = readFileSync(globalsPath, 'utf-8');
  
  const { variables, duplicates } = analyzeVariableConsolidation(globalsContent, globalsPath);
  const mappings = findVariableMappings(variables);
  const removable = findRemovableVariables(variables, mappings);

  // Separate old and new variables (heuristic: new theme variables are in :root and .dark blocks)
  const oldVariables = new Map<string, { value: string; line?: number }>();
  const newVariables = new Map<string, { value: string; line?: number }>();

  for (const [name, data] of variables.entries()) {
    // New theme variables are typically: --background, --foreground, --primary, etc.
    // Old variables are typically: --color-*, --dark-*, --light-*
    if (name.startsWith('--color-') || name.startsWith('--dark-') || name.startsWith('--light-')) {
      oldVariables.set(name, data);
    } else if (name.startsWith('--background') || name.startsWith('--foreground') || 
               name.startsWith('--primary') || name.startsWith('--secondary') ||
               name.startsWith('--muted') || name.startsWith('--accent') ||
               name.startsWith('--destructive') || name.startsWith('--border') ||
               name.startsWith('--input') || name.startsWith('--ring') ||
               name.startsWith('--card') || name.startsWith('--popover') ||
               name.startsWith('--sidebar') || name.startsWith('--chart-')) {
      newVariables.set(name, data);
    }
  }

  const conflicts = findConflicts(oldVariables, newVariables, mappings);

  // Convert duplicates to opportunities
  const duplicateOpportunities = [];
  for (const [value, vars] of duplicates.entries()) {
    if (vars.length > 1) {
      const recommended = vars.reduce((prev, curr) => 
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

  const report: ConsolidationReport = {
    mappings,
    duplicates: duplicateOpportunities,
    removable,
    conflicts,
  };

  // Generate markdown report
  let md = '# CSS Variable Consolidation Report\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `- **Variable Mappings Found:** ${mappings.length}\n`;
  md += `- **Duplicate Variables:** ${duplicateOpportunities.length}\n`;
  md += `- **Removable Variables:** ${removable.length}\n`;
  md += `- **Conflicts (old vs new):** ${conflicts.length}\n\n`;

  if (mappings.length > 0) {
    md += `## Variable Mappings (Old → New)\n\n`;
    md += `| Old Variable | New Variable | Reason |\n`;
    md += `|-------------|-------------|--------|\n`;
    for (const mapping of mappings.slice(0, 20)) {
      md += `| \`${mapping.oldName}\` | \`${mapping.newName}\` | ${mapping.reason} |\n`;
    }
    if (mappings.length > 20) {
      md += `\n... and ${mappings.length - 20} more mappings\n`;
    }
    md += `\n`;
  }

  if (duplicateOpportunities.length > 0) {
    md += `## Duplicate Variables (Can Be Consolidated)\n\n`;
    for (const dup of duplicateOpportunities.slice(0, 20)) {
      md += `### Value: \`${dup.value}\`\n\n`;
      md += `- **Variables using this value:** ${dup.variables.join(', ')}\n`;
      md += `- **Recommended name:** \`${dup.recommendedName}\`\n`;
      md += `- **Files:** ${dup.files.join(', ')}\n\n`;
    }
    if (duplicateOpportunities.length > 20) {
      md += `\n... and ${duplicateOpportunities.length - 20} more duplicates\n`;
    }
  }

  if (removable.length > 0) {
    md += `## Removable Variables (Mapped to New Theme)\n\n`;
    for (const varName of removable.slice(0, 30)) {
      md += `- \`${varName}\`\n`;
    }
    if (removable.length > 30) {
      md += `\n... and ${removable.length - 30} more\n`;
    }
    md += `\n`;
  }

  if (conflicts.length > 0) {
    md += `## ⚠️ Conflicts (Old vs New Values Differ)\n\n`;
    md += `These variables have different values in old and new systems. Manual review required.\n\n`;
    for (const conflict of conflicts) {
      md += `### \`${conflict.oldName}\` → \`${conflict.newName}\`\n\n`;
      md += `- **Old value:** \`${conflict.oldValue.substring(0, 60)}...\`\n`;
      md += `- **New value:** \`${conflict.newValue.substring(0, 60)}...\`\n`;
      md += `- **Recommendation:** ${conflict.recommendation}\n\n`;
    }
  }

  console.log(md);

  // Write report to file
  const reportPath = join(PROJECT_ROOT, '.cursor/tailwind-cleanup/variable-consolidation-report.md');
  const { mkdirSync } = await import('node:fs');
  const { dirname } = await import('node:path');
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, md, 'utf-8');

  logger.info(`Consolidation analysis complete! Report saved to: ${reportPath}`);

  if (dryRun) {
    logger.info('Run without --dry-run to apply changes (when consolidation plugin is ready)');
  }

  return report;
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');

  runConsolidateVariables(dryRun).catch((error) => {
    logger.error('Consolidation failed', { error });
    process.exit(1);
  });
}
