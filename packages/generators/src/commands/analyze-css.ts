#!/usr/bin/env tsx
/**
 * CSS Analysis Command - Read-Only Analysis Tool
 *
 * Analyzes all CSS files to extract:
 * - CSS variables and their values
 * - Color values (OKLCH, hex, RGB, HSL)
 * - Spacing values
 * - Theme system patterns (data-theme usage)
 * - Duplicate values
 *
 * This script does NOT modify any files - it's purely for analysis.
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as postcss from 'postcss';
import valueParser from 'postcss-value-parser';

import { logger } from '../toolkit/logger.ts';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(__filename);
const PROJECT_ROOT = join(SCRIPT_DIR, '../../../../');

interface CSSVariable {
  name: string;
  value: string;
  file: string;
  line?: number;
}

interface ColorValue {
  value: string;
  format: 'oklch' | 'hex' | 'rgb' | 'hsl' | 'var' | 'unknown';
  file: string;
  context: string;
}

interface SpacingValue {
  value: string;
  unit: string;
  file: string;
  context: string;
}

interface ThemePattern {
  type: 'data-theme' | 'dark:' | 'light:';
  selector: string;
  file: string;
  line?: number;
}

interface AnalysisResult {
  variables: CSSVariable[];
  colors: ColorValue[];
  spacing: SpacingValue[];
  themePatterns: ThemePattern[];
  duplicates: {
    colors: Map<string, string[]>;
    spacing: Map<string, string[]>;
    variables: Map<string, CSSVariable[]>;
  };
}

// Find all CSS files recursively
function findCSSFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        findCSSFiles(filePath, fileList);
      }
    } else if (extname(file) === '.css') {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Extract CSS variables
function extractVariables(css: string, file: string): CSSVariable[] {
  const variables: CSSVariable[] = [];
  const root = postcss.default.parse(css);

  root.walkRules((rule) => {
    rule.walkDecls((decl) => {
      if (decl.prop.startsWith('--')) {
        variables.push({
          name: decl.prop,
          value: decl.value,
          file,
          line: decl.source?.start?.line,
        });
      }
    });
  });

  return variables;
}

// Extract color values
function extractColors(css: string, file: string): ColorValue[] {
  const colors: ColorValue[] = [];
  const root = postcss.default.parse(css);

  root.walkDecls((decl) => {
    if (
      decl.prop.includes('color') ||
      decl.prop.includes('background') ||
      decl.prop.includes('border')
    ) {
      const value = decl.value.toLowerCase().trim();

      let format: ColorValue['format'] = 'unknown';
      if (value.startsWith('oklch(')) format = 'oklch';
      else if (value.startsWith('#')) format = 'hex';
      else if (value.startsWith('rgb(') || value.startsWith('rgba(')) format = 'rgb';
      else if (value.startsWith('hsl(') || value.startsWith('hsla(')) format = 'hsl';
      else if (value.startsWith('var(--')) format = 'var';

      if (format !== 'unknown') {
        colors.push({
          value,
          format,
          file,
          context: `${decl.prop}: ${value}`,
        });
      }
    }
  });

  return colors;
}

// Extract spacing values
function extractSpacing(css: string, file: string): SpacingValue[] {
  const spacing: SpacingValue[] = [];
  const root = postcss.default.parse(css);

  root.walkDecls((decl) => {
    const props = ['margin', 'padding', 'gap', 'top', 'right', 'bottom', 'left', 'width', 'height'];
    if (props.some((prop) => decl.prop.includes(prop))) {
      const parsed = valueParser(decl.value);

      parsed.walk((node) => {
        if (node.type === 'word' && /^\d+(\.\d+)?(px|rem|em|ch|vh|vw|%)$/.test(node.value)) {
          const match = node.value.match(/^(\d+(?:\.\d+)?)(px|rem|em|ch|vh|vw|%)$/);
          if (match) {
            spacing.push({
              value: match[1],
              unit: match[2],
              file,
              context: `${decl.prop}: ${decl.value}`,
            });
          }
        }
      });
    }
  });

  return spacing;
}

// Extract theme patterns
function extractThemePatterns(css: string, file: string): ThemePattern[] {
  const patterns: ThemePattern[] = [];
  const root = postcss.default.parse(css);

  root.walkRules((rule) => {
    const selector = rule.selector;

    if (selector.includes('[data-theme')) {
      patterns.push({
        type: 'data-theme',
        selector,
        file,
        line: rule.source?.start?.line,
      });
    } else if (selector.includes('.dark')) {
      patterns.push({
        type: 'dark:',
        selector,
        file,
        line: rule.source?.start?.line,
      });
    } else if (selector.includes('.light')) {
      patterns.push({
        type: 'light:',
        selector,
        file,
        line: rule.source?.start?.line,
      });
    }
  });

  return patterns;
}

// Find duplicates
function findDuplicates(result: AnalysisResult): AnalysisResult['duplicates'] {
  const colorMap = new Map<string, string[]>();
  const spacingMap = new Map<string, string[]>();
  const variableMap = new Map<string, CSSVariable[]>();

  // Group colors by normalized value
  for (const color of result.colors) {
    const normalized = color.value.toLowerCase().trim();
    if (!colorMap.has(normalized)) {
      colorMap.set(normalized, []);
    }
    colorMap.get(normalized)!.push(color.file);
  }

  // Group spacing by value+unit
  for (const space of result.spacing) {
    const key = `${space.value}${space.unit}`;
    if (!spacingMap.has(key)) {
      spacingMap.set(key, []);
    }
    spacingMap.get(key)!.push(space.file);
  }

  // Group variables by value
  for (const variable of result.variables) {
    const normalized = variable.value.trim();
    if (!variableMap.has(normalized)) {
      variableMap.set(normalized, []);
    }
    variableMap.get(normalized)!.push(variable);
  }

  // Filter to only show duplicates (appearing in multiple files or multiple times)
  const duplicateColors = new Map<string, string[]>();
  const duplicateSpacing = new Map<string, string[]>();
  const duplicateVariables = new Map<string, CSSVariable[]>();

  for (const [value, files] of colorMap.entries()) {
    const uniqueFiles = [...new Set(files)];
    if (uniqueFiles.length > 1) {
      duplicateColors.set(value, uniqueFiles);
    }
  }

  for (const [key, files] of spacingMap.entries()) {
    const uniqueFiles = [...new Set(files)];
    if (uniqueFiles.length > 1) {
      duplicateSpacing.set(key, uniqueFiles);
    }
  }

  for (const [value, variables] of variableMap.entries()) {
    if (variables.length > 1) {
      duplicateVariables.set(value, variables);
    }
  }

  return {
    colors: duplicateColors,
    spacing: duplicateSpacing,
    variables: duplicateVariables,
  };
}

// Main analysis function
async function analyzeCSS(): Promise<AnalysisResult> {
  const cssFiles = findCSSFiles(join(PROJECT_ROOT, 'apps/web/src'));

  logger.info(`Analyzing ${cssFiles.length} CSS files...`);

  const result: AnalysisResult = {
    variables: [],
    colors: [],
    spacing: [],
    themePatterns: [],
    duplicates: {
      colors: new Map(),
      spacing: new Map(),
      variables: new Map(),
    },
  };

  for (const file of cssFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const relativePath = file.replace(PROJECT_ROOT, '');

      result.variables.push(...extractVariables(content, relativePath));
      result.colors.push(...extractColors(content, relativePath));
      result.spacing.push(...extractSpacing(content, relativePath));
      result.themePatterns.push(...extractThemePatterns(content, relativePath));
    } catch (error) {
      logger.error(`Error analyzing ${file}`, { error });
    }
  }

  result.duplicates = findDuplicates(result);

  return result;
}

// Generate report
function generateReport(result: AnalysisResult): string {
  let report = '# CSS Analysis Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;

  report += `## Summary\n\n`;
  report += `- **CSS Files Analyzed:** ${new Set(result.variables.map((v) => v.file)).size}\n`;
  report += `- **CSS Variables Found:** ${result.variables.length}\n`;
  report += `- **Color Values Found:** ${result.colors.length}\n`;
  report += `- **Spacing Values Found:** ${result.spacing.length}\n`;
  report += `- **Theme Patterns Found:** ${result.themePatterns.length}\n\n`;

  report += `## Theme System Analysis\n\n`;
  const themeTypes = result.themePatterns.reduce(
    (acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  for (const [type, count] of Object.entries(themeTypes)) {
    report += `- **${type}**: ${count} occurrences\n`;
  }
  report += `\n### Files Using data-theme\n\n`;
  const dataThemeFiles = [
    ...new Set(result.themePatterns.filter((p) => p.type === 'data-theme').map((p) => p.file)),
  ];
  for (const file of dataThemeFiles) {
    report += `- \`${file}\`\n`;
  }

  report += `\n## Duplicate Values\n\n`;
  report += `### Duplicate Colors (${result.duplicates.colors.size})\n\n`;
  for (const [value, files] of Array.from(result.duplicates.colors.entries()).slice(0, 20)) {
    report += `- \`${value}\` appears in: ${files.join(', ')}\n`;
  }

  report += `\n### Duplicate Spacing (${result.duplicates.spacing.size})\n\n`;
  for (const [key, files] of Array.from(result.duplicates.spacing.entries()).slice(0, 20)) {
    report += `- \`${key}\` appears in: ${files.join(', ')}\n`;
  }

  report += `\n### Duplicate Variable Values (${result.duplicates.variables.size})\n\n`;
  for (const [value, variables] of Array.from(result.duplicates.variables.entries()).slice(0, 20)) {
    report += `- Value \`${value.substring(0, 50)}...\` used by:\n`;
    for (const variable of variables) {
      report += `  - \`${variable.name}\` in \`${variable.file}\`\n`;
    }
  }

  report += `\n## All CSS Variables\n\n`;
  const uniqueVars = new Map<string, CSSVariable>();
  for (const variable of result.variables) {
    if (!uniqueVars.has(variable.name)) {
      uniqueVars.set(variable.name, variable);
    }
  }

  for (const variable of Array.from(uniqueVars.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    report += `- \`${variable.name}\`: \`${variable.value.substring(0, 80)}${variable.value.length > 80 ? '...' : ''}\`\n`;
  }

  return report;
}

// Main execution
export async function runAnalyzeCSS(): Promise<void> {
  try {
    const result = await analyzeCSS();
    const report = generateReport(result);

    console.log(report);

    // Write report to file
    const reportPath = join(PROJECT_ROOT, '.cursor/tailwind-cleanup/css-analysis-report.md');
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, report, 'utf-8');

    logger.info(`Analysis complete! Report saved to: ${reportPath}`);
  } catch (error) {
    logger.error('Analysis failed', { error });
    throw error;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  runAnalyzeCSS().catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}
