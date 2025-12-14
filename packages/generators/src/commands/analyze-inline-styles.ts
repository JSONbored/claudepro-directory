#!/usr/bin/env tsx
/**
 * Inline Styles Analysis Command
 * 
 * Analyzes TSX/TS files to find:
 * - Inline Tailwind classes that should use design system utilities
 * - Patterns that match design system utility patterns
 * - Opportunities for migration to semantic utilities
 * 
 * This is a read-only analysis tool.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { logger } from '../toolkit/logger.js';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = join(__filename, '..');
const PROJECT_ROOT = join(SCRIPT_DIR, '../../../../');

interface InlineStylePattern {
  pattern: string;
  file: string;
  line: number;
  className: string;
  recommended: string;
  reason: string;
}

interface InlineStyleReport {
  marginBottom: InlineStylePattern[];
  marginTop: InlineStylePattern[];
  spaceY: InlineStylePattern[];
  flexColGap: InlineStylePattern[];
  flexCenterGap: InlineStylePattern[];
  mutedText: InlineStylePattern[];
  iconSizing: InlineStylePattern[];
  rounded: InlineStylePattern[];
  hoverBg: InlineStylePattern[];
  totalFiles: number;
  totalPatterns: number;
}

// Design system patterns to detect
const PATTERNS = {
  marginBottom: {
    regex: /\bmb-(\d+|auto|px|py)\b/g,
    recommended: 'marginBottom.*',
    reason: 'Use marginBottom utility from design system',
  },
  marginTop: {
    regex: /\bmt-(\d+|auto|px|py)\b/g,
    recommended: 'marginTop.*',
    reason: 'Use marginTop utility from design system',
  },
  spaceY: {
    regex: /\bspace-y-(\d+)\b/g,
    recommended: 'spaceY.*',
    reason: 'Use spaceY utility from design system',
  },
  flexColGap: {
    regex: /\bflex\s+flex-col\s+gap-(\d+)\b/g,
    recommended: 'stack.*',
    reason: 'Use stack utility from design system',
  },
  flexCenterGap: {
    regex: /\bflex\s+items-center\s+gap-(\d+)\b/g,
    recommended: 'cluster.*',
    reason: 'Use cluster utility from design system',
  },
  mutedText: {
    regex: /\btext-muted-foreground\b/g,
    recommended: 'muted.default',
    reason: 'Use muted utility from design system',
  },
  iconSizing: {
    regex: /\b(h-\d+|w-\d+)\s+(h-\d+|w-\d+)\b/g,
    recommended: 'iconSize.*',
    reason: 'Use iconSize utility from design system (when used on icons)',
  },
  rounded: {
    regex: /\brounded-(sm|md|lg|xl|full|2xl|3xl)\b/g,
    recommended: 'radius.*',
    reason: 'Use radius utility from design system',
  },
  hoverBg: {
    regex: /\bhover:bg-[\w-]+\b/g,
    recommended: 'hoverBg.*',
    reason: 'Use hoverBg utility from design system',
  },
};

// Find all TSX/TS files
function findTSXFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        findTSXFiles(filePath, fileList);
      }
    } else if (extname(file) === '.tsx' || extname(file) === '.ts') {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Extract className values from TSX/TS files
function extractClassNames(content: string, file: string): InlineStylePattern[] {
  const patterns: InlineStylePattern[] = [];
  const lines = content.split('\n');

  // Match className="..." or className={`...`} or className={...}
  const classNameRegex = /className\s*=\s*{?["'`]([^"'`]+)["'`]}?/g;
  const classNameTemplateRegex = /className\s*=\s*{`([^`]+)`}/g;
  const classNameExpressionRegex = /className\s*=\s*{([^}]+)}/g;

  // Check all patterns
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    
    // Extract className values
    const classNames: string[] = [];
    
    // String literals
    let match;
    while ((match = classNameRegex.exec(line)) !== null) {
      classNames.push(match[1]);
    }
    
    // Template literals
    while ((match = classNameTemplateRegex.exec(line)) !== null) {
      classNames.push(match[1]);
    }
    
    // Expressions (cn(), etc.) - extract string parts
    while ((match = classNameExpressionRegex.exec(line)) !== null) {
      // Extract string literals from expressions
      const expr = match[1];
      const stringMatches = expr.match(/["']([^"']+)["']/g);
      if (stringMatches) {
        for (const str of stringMatches) {
          classNames.push(str.slice(1, -1)); // Remove quotes
        }
      }
    }

    // Check each className against patterns
    for (const className of classNames) {
      // Check marginBottom
      const mbMatches = className.matchAll(PATTERNS.marginBottom.regex);
      for (const mbMatch of mbMatches) {
        patterns.push({
          pattern: 'marginBottom',
          file,
          line: lineNum + 1,
          className: mbMatch[0],
          recommended: PATTERNS.marginBottom.recommended,
          reason: PATTERNS.marginBottom.reason,
        });
      }

      // Check marginTop
      const mtMatches = className.matchAll(PATTERNS.marginTop.regex);
      for (const mtMatch of mtMatches) {
        patterns.push({
          pattern: 'marginTop',
          file,
          line: lineNum + 1,
          className: mtMatch[0],
          recommended: PATTERNS.marginTop.recommended,
          reason: PATTERNS.marginTop.reason,
        });
      }

      // Check spaceY
      const spaceYMatches = className.matchAll(PATTERNS.spaceY.regex);
      for (const spaceYMatch of spaceYMatches) {
        patterns.push({
          pattern: 'spaceY',
          file,
          line: lineNum + 1,
          className: spaceYMatch[0],
          recommended: PATTERNS.spaceY.recommended,
          reason: PATTERNS.spaceY.reason,
        });
      }

      // Check flex flex-col gap
      const flexColMatches = className.matchAll(PATTERNS.flexColGap.regex);
      for (const flexColMatch of flexColMatches) {
        patterns.push({
          pattern: 'flexColGap',
          file,
          line: lineNum + 1,
          className: flexColMatch[0],
          recommended: PATTERNS.flexColGap.recommended,
          reason: PATTERNS.flexColGap.reason,
        });
      }

      // Check flex items-center gap
      const flexCenterMatches = className.matchAll(PATTERNS.flexCenterGap.regex);
      for (const flexCenterMatch of flexCenterMatches) {
        patterns.push({
          pattern: 'flexCenterGap',
          file,
          line: lineNum + 1,
          className: flexCenterMatch[0],
          recommended: PATTERNS.flexCenterGap.recommended,
          reason: PATTERNS.flexCenterGap.reason,
        });
      }

      // Check muted text
      const mutedMatches = className.matchAll(PATTERNS.mutedText.regex);
      for (const mutedMatch of mutedMatches) {
        patterns.push({
          pattern: 'mutedText',
          file,
          line: lineNum + 1,
          className: mutedMatch[0],
          recommended: PATTERNS.mutedText.recommended,
          reason: PATTERNS.mutedText.reason,
        });
      }

      // Check icon sizing (h-X w-X)
      const iconMatches = className.matchAll(PATTERNS.iconSizing.regex);
      for (const iconMatch of iconMatches) {
        // Only flag if it's likely an icon (heuristic: small sizes or in icon context)
        const iconSize = iconMatch[0];
        if (/\b(h-[3-6]|w-[3-6])\b/.test(iconSize)) {
          patterns.push({
            pattern: 'iconSizing',
            file,
            line: lineNum + 1,
            className: iconMatch[0],
            recommended: PATTERNS.iconSizing.recommended,
            reason: PATTERNS.iconSizing.reason,
          });
        }
      }

      // Check rounded
      const roundedMatches = className.matchAll(PATTERNS.rounded.regex);
      for (const roundedMatch of roundedMatches) {
        patterns.push({
          pattern: 'rounded',
          file,
          line: lineNum + 1,
          className: roundedMatch[0],
          recommended: PATTERNS.rounded.recommended,
          reason: PATTERNS.rounded.reason,
        });
      }

      // Check hover:bg
      const hoverBgMatches = className.matchAll(PATTERNS.hoverBg.regex);
      for (const hoverBgMatch of hoverBgMatches) {
        patterns.push({
          pattern: 'hoverBg',
          file,
          line: lineNum + 1,
          className: hoverBgMatch[0],
          recommended: PATTERNS.hoverBg.recommended,
          reason: PATTERNS.hoverBg.reason,
        });
      }
    }
  }

  return patterns;
}

// Main analysis function
async function analyzeInlineStyles(): Promise<InlineStyleReport> {
  const tsxFiles = findTSXFiles(join(PROJECT_ROOT, 'apps/web/src'));
  
  logger.info(`Analyzing ${tsxFiles.length} TSX/TS files for inline styles...`);

  const report: InlineStyleReport = {
    marginBottom: [],
    marginTop: [],
    spaceY: [],
    flexColGap: [],
    flexCenterGap: [],
    mutedText: [],
    iconSizing: [],
    rounded: [],
    hoverBg: [],
    totalFiles: tsxFiles.length,
    totalPatterns: 0,
  };

  for (const file of tsxFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const relativePath = file.replace(PROJECT_ROOT, '');
      const patterns = extractClassNames(content, relativePath);

      for (const pattern of patterns) {
        switch (pattern.pattern) {
          case 'marginBottom':
            report.marginBottom.push(pattern);
            break;
          case 'marginTop':
            report.marginTop.push(pattern);
            break;
          case 'spaceY':
            report.spaceY.push(pattern);
            break;
          case 'flexColGap':
            report.flexColGap.push(pattern);
            break;
          case 'flexCenterGap':
            report.flexCenterGap.push(pattern);
            break;
          case 'mutedText':
            report.mutedText.push(pattern);
            break;
          case 'iconSizing':
            report.iconSizing.push(pattern);
            break;
          case 'rounded':
            report.rounded.push(pattern);
            break;
          case 'hoverBg':
            report.hoverBg.push(pattern);
            break;
        }
      }
    } catch (error) {
      logger.error(`Error analyzing ${file}`, { error });
    }
  }

  report.totalPatterns = 
    report.marginBottom.length +
    report.marginTop.length +
    report.spaceY.length +
    report.flexColGap.length +
    report.flexCenterGap.length +
    report.mutedText.length +
    report.iconSizing.length +
    report.rounded.length +
    report.hoverBg.length;

  return report;
}

// Generate markdown report
function generateReport(report: InlineStyleReport): string {
  let md = '# Inline Styles Analysis Report\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `- **Files Analyzed:** ${report.totalFiles}\n`;
  md += `- **Total Patterns Found:** ${report.totalPatterns}\n\n`;

  md += `## Pattern Breakdown\n\n`;
  md += `- **marginBottom patterns:** ${report.marginBottom.length}\n`;
  md += `- **marginTop patterns:** ${report.marginTop.length}\n`;
  md += `- **spaceY patterns:** ${report.spaceY.length}\n`;
  md += `- **flex flex-col gap patterns:** ${report.flexColGap.length}\n`;
  md += `- **flex items-center gap patterns:** ${report.flexCenterGap.length}\n`;
  md += `- **text-muted-foreground patterns:** ${report.mutedText.length}\n`;
  md += `- **icon sizing patterns:** ${report.iconSizing.length}\n`;
  md += `- **rounded patterns:** ${report.rounded.length}\n`;
  md += `- **hover:bg patterns:** ${report.hoverBg.length}\n\n`;

  // Group by file for easier review
  const byFile = new Map<string, InlineStylePattern[]>();
  for (const category of [
    report.marginBottom,
    report.marginTop,
    report.spaceY,
    report.flexColGap,
    report.flexCenterGap,
    report.mutedText,
    report.iconSizing,
    report.rounded,
    report.hoverBg,
  ]) {
    for (const pattern of category) {
      if (!byFile.has(pattern.file)) {
        byFile.set(pattern.file, []);
      }
      byFile.get(pattern.file)!.push(pattern);
    }
  }

  md += `## Files with Inline Style Patterns\n\n`;
  for (const [file, patterns] of Array.from(byFile.entries()).sort()) {
    md += `### \`${file}\` (${patterns.length} pattern(s))\n\n`;
    for (const pattern of patterns.slice(0, 10)) { // Limit to 10 per file
      md += `- **Line ${pattern.line}:** \`${pattern.className}\`\n`;
      md += `  - Recommended: \`${pattern.recommended}\`\n`;
      md += `  - Reason: ${pattern.reason}\n`;
    }
    if (patterns.length > 10) {
      md += `  - ... and ${patterns.length - 10} more\n`;
    }
    md += `\n`;
  }

  return md;
}

// Main execution
export async function runAnalyzeInlineStyles(): Promise<void> {
  try {
    const report = await analyzeInlineStyles();
    const markdown = generateReport(report);
    
    console.log(markdown);
    
    // Write report to file
    const { writeFileSync, mkdirSync } = await import('node:fs');
    const { dirname, join } = await import('node:path');
    const reportPath = join(PROJECT_ROOT, '.cursor/tailwind-cleanup/inline-styles-report.md');
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, markdown, 'utf-8');
    
    logger.info(`Analysis complete! Report saved to: ${reportPath}`);
  } catch (error) {
    logger.error('Analysis failed', { error });
    throw error;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  runAnalyzeInlineStyles().catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}
