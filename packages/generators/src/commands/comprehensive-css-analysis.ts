#!/usr/bin/env tsx
/**
 * Comprehensive CSS Analysis Command
 * 
 * Exhaustively analyzes:
 * 1. All CSS variables (old system vs new tweakcn theme)
 * 2. All design tokens (what actually exists)
 * 3. Exact duplicates and overlaps
 * 4. Variable mappings and consolidation opportunities
 * 5. Spacing value comparisons (CSS vs design tokens)
 * 6. Color value comparisons (CSS vs design tokens)
 * 7. Typography value comparisons (CSS vs design tokens)
 * 
 * This is a read-only analysis tool - it doesn't modify files.
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname, dirname, relative } from 'node:path';
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
  context: 'old' | 'new' | 'both' | 'unknown';
}

interface DesignToken {
  category: string;
  path: string;
  value: string | object;
  type: 'spacing' | 'color' | 'typography' | 'shadow' | 'other';
}

interface DuplicateValue {
  value: string;
  variables: CSSVariable[];
  recommendation: string;
}

interface VariableMapping {
  oldName: string;
  newName: string;
  oldValue: string;
  newValue: string;
  exactMatch: boolean;
  recommendation: string;
}

interface ConsolidationOpportunity {
  type: 'duplicate' | 'mapping' | 'unused' | 'conflict';
  description: string;
  variables: string[];
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

interface ComprehensiveReport {
  cssVariables: {
    total: number;
    old: number;
    new: number;
    both: number;
    unknown: number;
    byFile: Map<string, CSSVariable[]>;
  };
  designTokens: {
    spacing: DesignToken[];
    colors: DesignToken[];
    typography: DesignToken[];
    shadows: DesignToken[];
    other: DesignToken[];
  };
  duplicates: DuplicateValue[];
  mappings: VariableMapping[];
  opportunities: ConsolidationOpportunity[];
  conflicts: Array<{
    oldName: string;
    newName: string;
    oldValue: string;
    newValue: string;
    reason: string;
  }>;
  spacingComparison: Array<{
    cssValue: string;
    tokenValue: string;
    match: boolean;
    cssVariable?: string;
    tokenPath?: string;
  }>;
  colorComparison: Array<{
    cssValue: string;
    tokenValue?: string;
    match: boolean;
    cssVariable?: string;
    tokenPath?: string;
  }>;
}

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

// Extract all CSS variables from a file
function extractCSSVariables(css: string, file: string): CSSVariable[] {
  const root = postcss.default.parse(css);
  const variables: CSSVariable[] = [];

  root.walkRules((rule) => {
    rule.walkDecls((decl) => {
      if (decl.prop.startsWith('--')) {
        const name = decl.prop;
        const value = decl.value.trim();
        
        // Determine context (old vs new)
        let context: 'old' | 'new' | 'both' | 'unknown' = 'unknown';
        
        // Old system patterns
        if (name.startsWith('--color-') || 
            name.startsWith('--dark-') || 
            name.startsWith('--light-') ||
            name.startsWith('--claude-') ||
            name.startsWith('--font-size-') ||
            name.startsWith('--font-weight-') ||
            name.startsWith('--leading-') ||
            name.startsWith('--tracking-') ||
            name.startsWith('--spacing-') ||
            name.startsWith('--radius-') ||
            name.startsWith('--duration-') ||
            name.startsWith('--ease-') ||
            name.startsWith('--shadow-') && !name.startsWith('--shadow-color')) {
          context = 'old';
        }
        
        // New tweakcn theme patterns
        if (name === '--background' ||
            name === '--foreground' ||
            name === '--card' ||
            name === '--card-foreground' ||
            name === '--popover' ||
            name === '--popover-foreground' ||
            name === '--primary' ||
            name === '--primary-foreground' ||
            name === '--secondary' ||
            name === '--secondary-foreground' ||
            name === '--muted' ||
            name === '--muted-foreground' ||
            name === '--accent' ||
            name === '--accent-foreground' ||
            name === '--destructive' ||
            name === '--destructive-foreground' ||
            name === '--border' ||
            name === '--input' ||
            name === '--ring' ||
            name.startsWith('--chart-') ||
            name.startsWith('--sidebar') ||
            name === '--radius' ||
            name.startsWith('--shadow-') && (name.includes('xs') || name.includes('sm') || name.includes('md') || name.includes('lg') || name.includes('xl') || name.includes('2xl')) ||
            name === '--tracking-normal' ||
            name === '--spacing' ||
            name === '--font-sans' ||
            name === '--font-serif' ||
            name === '--font-mono') {
          context = 'new';
        }
        
        // Both (in @theme inline)
        if (name.startsWith('--color-') && (name.includes('background') || name.includes('foreground') || name.includes('primary') || name.includes('secondary'))) {
          context = 'both';
        }

        variables.push({
          name,
          value,
          file: relative(PROJECT_ROOT, file),
          line: decl.source?.start?.line,
          context,
        });
      }
    });
  });

  return variables;
}

// Load design tokens from actual files
async function loadDesignTokens(): Promise<{
  spacing: DesignToken[];
  colors: DesignToken[];
  typography: DesignToken[];
  shadows: DesignToken[];
  other: DesignToken[];
}> {
  const tokens = {
    spacing: [] as DesignToken[],
    colors: [] as DesignToken[],
    typography: [] as DesignToken[],
    shadows: [] as DesignToken[],
    other: [] as DesignToken[],
  };

  try {
    // Load spacing tokens
    const spacingScalePath = join(PROJECT_ROOT, 'packages/web-runtime/src/design-tokens/spacing/scale.ts');
    const spacingScaleContent = readFileSync(spacingScalePath, 'utf-8');
    
    // Extract SPACING_SCALE values
    const spacingScaleMatch = spacingScaleContent.match(/export const SPACING_SCALE = \{([^}]+)\}/s);
    if (spacingScaleMatch) {
      const scaleContent = spacingScaleMatch[1];
      const scaleEntries = scaleContent.matchAll(/(\w+):\s*['"]([^'"]+)['"]/g);
      for (const match of scaleEntries) {
        tokens.spacing.push({
          category: 'spacing-scale',
          path: `SPACING.scale.${match[1]}`,
          value: match[2],
          type: 'spacing',
        });
      }
    }

    // Load semantic spacing
    const semanticSpacingPath = join(PROJECT_ROOT, 'packages/web-runtime/src/design-tokens/spacing/semantic.ts');
    const semanticSpacingContent = readFileSync(semanticSpacingPath, 'utf-8');
    
    // Extract marginBottom, marginTop, etc.
    const marginBottomMatch = semanticSpacingContent.match(/marginBottom:\s*\{([^}]+)\}/s);
    if (marginBottomMatch) {
      const mbContent = marginBottomMatch[1];
      const mbEntries = mbContent.matchAll(/(\w+):\s*SPACING_SCALE\.(\w+)/g);
      for (const match of mbEntries) {
        // Find the actual value from SPACING_SCALE
        const scaleValue = tokens.spacing.find(t => t.path.includes(`.${match[2]}`));
        if (scaleValue) {
          tokens.spacing.push({
            category: 'margin-bottom',
            path: `SPACING.marginBottom.${match[1]}`,
            value: scaleValue.value,
            type: 'spacing',
          });
        }
      }
    }

    // Load typography tokens
    const typographyPath = join(PROJECT_ROOT, 'packages/web-runtime/src/design-tokens/typography/font-sizes.ts');
    const typographyContent = readFileSync(typographyPath, 'utf-8');
    
    // Extract font sizes
    const fontSizeMatch = typographyContent.match(/export const FONT_SIZES = \{([^}]+)\}/s);
    if (fontSizeMatch) {
      const fontSizeContent = fontSizeMatch[1];
      const fontSizeEntries = fontSizeContent.matchAll(/(\w+):\s*['"]([^'"]+)['"]/g);
      for (const match of fontSizeEntries) {
        tokens.typography.push({
          category: 'font-size',
          path: `TYPOGRAPHY.fontSizes.${match[1]}`,
          value: match[2],
          type: 'typography',
        });
      }
    }

    // Load shadow tokens - extract actual values
    const shadowsElevationPath = join(PROJECT_ROOT, 'packages/web-runtime/src/design-tokens/shadows/elevation.ts');
    const shadowsElevationContent = readFileSync(shadowsElevationPath, 'utf-8');
    
    // Extract dark shadows
    const darkShadowsMatch = shadowsElevationContent.match(/dark:\s*\{([^}]+)\}/s);
    if (darkShadowsMatch) {
      const darkContent = darkShadowsMatch[1];
      const darkShadowEntries = darkContent.matchAll(/(\w+):\s*['"]([^'"]+)['"]/g);
      for (const match of darkShadowEntries) {
        tokens.shadows.push({
          category: 'shadow-elevation-dark',
          path: `SHADOWS.elevation.dark.${match[1]}`,
          value: match[2],
          type: 'shadow',
        });
      }
    }

    // Extract light shadows
    const lightShadowsMatch = shadowsElevationContent.match(/light:\s*\{([^}]+)\}/s);
    if (lightShadowsMatch) {
      const lightContent = lightShadowsMatch[1];
      const lightShadowEntries = lightContent.matchAll(/(\w+):\s*['"]([^'"]+)['"]/g);
      for (const match of lightShadowEntries) {
        tokens.shadows.push({
          category: 'shadow-elevation-light',
          path: `SHADOWS.elevation.light.${match[1]}`,
          value: match[2],
          type: 'shadow',
        });
      }
    }

    // Load color tokens - extract actual OKLCH values from palette
    const colorsPalettePath = join(PROJECT_ROOT, 'packages/web-runtime/src/design-tokens/colors/palette.ts');
    if (statSync(colorsPalettePath).isFile()) {
      const colorsPaletteContent = readFileSync(colorsPalettePath, 'utf-8');
      
      // Extract BRAND_COLORS
      const brandColorsMatch = colorsPaletteContent.match(/export const BRAND_COLORS = \{([^}]+)\}/s);
      if (brandColorsMatch) {
        const brandContent = brandColorsMatch[1];
        const brandEntries = brandContent.matchAll(/(\w+):\s*['"]([^'"]+)['"]/g);
        for (const match of brandEntries) {
          tokens.colors.push({
            category: 'brand-color',
            path: `COLORS.palette.brand.${match[1]}`,
            value: match[2],
            type: 'color',
          });
        }
      }
    }

  } catch (error) {
    logger.warn('Error loading design tokens', { error });
  }

  return tokens;
}

// Compare CSS spacing values with design tokens
function compareSpacingValues(
  cssVariables: CSSVariable[],
  designTokens: DesignToken[]
): ComprehensiveReport['spacingComparison'] {
  const comparison: ComprehensiveReport['spacingComparison'] = [];
  
  // Extract spacing values from CSS (look for --spacing-* variables)
  const cssSpacingVars = cssVariables.filter(v => 
    v.name.startsWith('--spacing-') || 
    v.name === '--spacing'
  );

  // Extract spacing tokens
  const spacingTokens = designTokens.filter(t => t.type === 'spacing');

  for (const cssVar of cssSpacingVars) {
    // Parse CSS value to get numeric value
    const parsed = valueParser(cssVar.value);
    let numericValue: string | null = null;
    
    parsed.walk((node) => {
      if (node.type === 'word' && /^\d+(\.\d+)?(rem|px|em)$/.test(node.value)) {
        numericValue = node.value;
      }
    });

    if (numericValue) {
      // Normalize to rem for comparison
      const normalizedValue = numericValue.endsWith('px') 
        ? `${parseFloat(numericValue) / 16}rem`
        : numericValue;

      // Find matching token
      const matchingToken = spacingTokens.find(t => {
        const tokenValue = typeof t.value === 'string' ? t.value : '';
        return tokenValue === normalizedValue || tokenValue === numericValue;
      });

      comparison.push({
        cssValue: numericValue,
        tokenValue: matchingToken ? (typeof matchingToken.value === 'string' ? matchingToken.value : '') : undefined,
        match: !!matchingToken,
        cssVariable: cssVar.name,
        tokenPath: matchingToken?.path,
      });
    }
  }

  return comparison;
}

// Compare CSS color values with design tokens
function compareColorValues(
  cssVariables: CSSVariable[],
  designTokens: DesignToken[]
): ComprehensiveReport['colorComparison'] {
  const comparison: ComprehensiveReport['colorComparison'] = [];
  
  // Extract color values from CSS (look for OKLCH colors)
  const cssColorVars = cssVariables.filter(v => 
    v.value.includes('oklch') || 
    v.name.includes('color') ||
    v.name.includes('accent') ||
    v.name.includes('primary') ||
    v.name.includes('background') ||
    v.name.includes('foreground')
  );

  // Extract color tokens
  const colorTokens = designTokens.filter(t => t.type === 'color');

  for (const cssVar of cssColorVars.slice(0, 50)) { // Limit to first 50 for performance
    // Extract OKLCH value
    const oklchMatch = cssVar.value.match(/oklch\([^)]+\)/);
    if (oklchMatch) {
      const oklchValue = oklchMatch[0];
      
      // Find matching token
      const matchingToken = colorTokens.find(t => {
        const tokenValue = typeof t.value === 'string' ? t.value : '';
        return tokenValue.includes(oklchValue) || tokenValue === oklchValue;
      });

      comparison.push({
        cssValue: oklchValue,
        tokenValue: matchingToken ? (typeof matchingToken.value === 'string' ? matchingToken.value : '') : undefined,
        match: !!matchingToken,
        cssVariable: cssVar.name,
        tokenPath: matchingToken?.path,
      });
    }
  }

  return comparison;
}

// Find duplicate values
function findDuplicates(variables: CSSVariable[]): DuplicateValue[] {
  const valueMap = new Map<string, CSSVariable[]>();

  for (const variable of variables) {
    const normalizedValue = variable.value.trim();
    if (!valueMap.has(normalizedValue)) {
      valueMap.set(normalizedValue, []);
    }
    valueMap.get(normalizedValue)!.push(variable);
  }

  const duplicates: DuplicateValue[] = [];
  for (const [value, vars] of valueMap.entries()) {
    if (vars.length > 1) {
      // Only include if variables have different names
      const uniqueNames = new Set(vars.map(v => v.name));
      if (uniqueNames.size > 1) {
        // Recommend shortest or most semantic name
        const recommended = vars.reduce((prev, curr) => {
          if (curr.context === 'new') return curr; // Prefer new theme
          if (prev.context === 'new') return prev;
          return curr.name.length < prev.name.length ? curr : prev;
        });
        
        duplicates.push({
          value: value.substring(0, 100) + (value.length > 100 ? '...' : ''),
          variables: vars,
          recommendation: `Use ${recommended.name} (${recommended.context} system)`,
        });
      }
    }
  }

  return duplicates;
}

// Find variable mappings (old → new)
function findMappings(
  oldVariables: CSSVariable[],
  newVariables: CSSVariable[]
): VariableMapping[] {
  const mappings: VariableMapping[] = [];

  // Known mappings
  const mappingRules: Array<{
    oldPattern: RegExp;
    newName: string;
  }> = [
    { oldPattern: /^--color-bg-primary$/, newName: '--background' },
    { oldPattern: /^--color-bg-secondary$/, newName: '--card' },
    { oldPattern: /^--color-text-primary$/, newName: '--foreground' },
    { oldPattern: /^--color-text-secondary$/, newName: '--muted-foreground' },
    { oldPattern: /^--color-accent$/, newName: '--accent' },
    { oldPattern: /^--color-accent-foreground$/, newName: '--accent-foreground' },
    { oldPattern: /^--color-primary$/, newName: '--primary' },
    { oldPattern: /^--color-primary-foreground$/, newName: '--primary-foreground' },
    { oldPattern: /^--color-secondary$/, newName: '--secondary' },
    { oldPattern: /^--color-secondary-foreground$/, newName: '--secondary-foreground' },
    { oldPattern: /^--color-muted$/, newName: '--muted' },
    { oldPattern: /^--color-muted-foreground$/, newName: '--muted-foreground' },
    { oldPattern: /^--color-destructive$/, newName: '--destructive' },
    { oldPattern: /^--color-destructive-foreground$/, newName: '--destructive-foreground' },
    { oldPattern: /^--color-border-default$/, newName: '--border' },
    { oldPattern: /^--color-input$/, newName: '--input' },
    { oldPattern: /^--color-ring$/, newName: '--ring' },
    { oldPattern: /^--color-card$/, newName: '--card' },
    { oldPattern: /^--color-card-foreground$/, newName: '--card-foreground' },
    { oldPattern: /^--color-popover$/, newName: '--popover' },
    { oldPattern: /^--color-popover-foreground$/, newName: '--popover-foreground' },
  ];

  for (const oldVar of oldVariables) {
    for (const rule of mappingRules) {
      if (rule.oldPattern.test(oldVar.name)) {
        const newVar = newVariables.find(v => v.name === rule.newName);
        if (newVar) {
          const exactMatch = oldVar.value === newVar.value;
          mappings.push({
            oldName: oldVar.name,
            newName: rule.newName,
            oldValue: oldVar.value,
            newValue: newVar.value,
            exactMatch,
            recommendation: exactMatch 
              ? `Exact match - can safely replace ${oldVar.name} with ${rule.newName}`
              : `Values differ - need to decide which to keep or merge`,
          });
        }
      }
    }
  }

  return mappings;
}

// Generate comprehensive report
async function generateComprehensiveReport(): Promise<ComprehensiveReport> {
  const cssFiles = findCSSFiles(join(PROJECT_ROOT, 'apps/web/src'));
  
  logger.info(`Analyzing ${cssFiles.length} CSS files...`);

  // Extract all CSS variables
  const allVariables: CSSVariable[] = [];
  const variablesByFile = new Map<string, CSSVariable[]>();

  for (const file of cssFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const relativePath = relative(PROJECT_ROOT, file);
      const variables = extractCSSVariables(content, file);
      allVariables.push(...variables);
      variablesByFile.set(relativePath, variables);
    } catch (error) {
      logger.error(`Error reading ${file}`, { error });
    }
  }

  // Separate old and new
  const oldVariables = allVariables.filter(v => v.context === 'old');
  const newVariables = allVariables.filter(v => v.context === 'new');
  const bothVariables = allVariables.filter(v => v.context === 'both');
  const unknownVariables = allVariables.filter(v => v.context === 'unknown');

  // Load design tokens
  const designTokens = await loadDesignTokens();

  // Find duplicates
  const duplicates = findDuplicates(allVariables);

  // Find mappings
  const mappings = findMappings(oldVariables, newVariables);

  // Compare spacing values
  const spacingComparison = compareSpacingValues(allVariables, designTokens.spacing);

  // Compare color values
  const colorComparison = compareColorValues(allVariables, designTokens.colors);

  // Find conflicts
  const conflicts = mappings
    .filter(m => !m.exactMatch)
    .map(m => ({
      oldName: m.oldName,
      newName: m.newName,
      oldValue: m.oldValue,
      newValue: m.newValue,
      reason: 'Values differ between old and new systems',
    }));

  // Generate opportunities
  const opportunities: ConsolidationOpportunity[] = [];

  // Duplicate opportunities
  for (const dup of duplicates.slice(0, 50)) { // Limit to top 50
    opportunities.push({
      type: 'duplicate',
      description: `${dup.variables.length} variables use the same value`,
      variables: dup.variables.map(v => v.name),
      recommendation: dup.recommendation,
      priority: dup.variables.length > 3 ? 'high' : 'medium',
    });
  }

  // Mapping opportunities
  for (const mapping of mappings) {
    if (mapping.exactMatch) {
      opportunities.push({
        type: 'mapping',
        description: `Map ${mapping.oldName} → ${mapping.newName}`,
        variables: [mapping.oldName, mapping.newName],
        recommendation: mapping.recommendation,
        priority: 'high',
      });
    } else {
      opportunities.push({
        type: 'conflict',
        description: `Conflict: ${mapping.oldName} vs ${mapping.newName}`,
        variables: [mapping.oldName, mapping.newName],
        recommendation: mapping.recommendation,
        priority: 'high',
      });
    }
  }

  return {
    cssVariables: {
      total: allVariables.length,
      old: oldVariables.length,
      new: newVariables.length,
      both: bothVariables.length,
      unknown: unknownVariables.length,
      byFile: variablesByFile,
    },
    designTokens,
    duplicates,
    mappings,
    opportunities,
    conflicts,
    spacingComparison,
    colorComparison,
  };
}

// Generate markdown report
function generateMarkdownReport(report: ComprehensiveReport): string {
  let md = '# Comprehensive CSS Analysis Report\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;

  md += `## Executive Summary\n\n`;
  md += `- **Total CSS Variables:** ${report.cssVariables.total}\n`;
  md += `  - Old system: ${report.cssVariables.old}\n`;
  md += `  - New tweakcn theme: ${report.cssVariables.new}\n`;
  md += `  - Both/overlap: ${report.cssVariables.both}\n`;
  md += `  - Unknown: ${report.cssVariables.unknown}\n`;
  md += `- **Design Tokens Available:**\n`;
  md += `  - Spacing: ${report.designTokens.spacing.length} tokens\n`;
  md += `  - Colors: ${report.designTokens.colors.length} token categories\n`;
  md += `  - Typography: ${report.designTokens.typography.length} tokens\n`;
  md += `  - Shadows: ${report.designTokens.shadows.length} token categories\n`;
  md += `- **Duplicate Values:** ${report.duplicates.length}\n`;
  md += `- **Variable Mappings:** ${report.mappings.length}\n`;
  md += `- **Conflicts:** ${report.conflicts.length}\n`;
  md += `- **Consolidation Opportunities:** ${report.opportunities.length}\n\n`;

  md += `## CSS Variables by Context\n\n`;
  md += `### Old System Variables (${report.cssVariables.old})\n\n`;
  const oldVars = Array.from(report.cssVariables.byFile.values())
    .flat()
    .filter(v => v.context === 'old')
    .slice(0, 30);
  for (const var_ of oldVars) {
    md += `- \`${var_.name}\` = \`${var_.value.substring(0, 60)}${var_.value.length > 60 ? '...' : ''}\` (${var_.file})\n`;
  }
  if (report.cssVariables.old > 30) {
    md += `\n... and ${report.cssVariables.old - 30} more old variables\n`;
  }

  md += `\n### New Tweakcn Theme Variables (${report.cssVariables.new})\n\n`;
  const newVars = Array.from(report.cssVariables.byFile.values())
    .flat()
    .filter(v => v.context === 'new')
    .slice(0, 30);
  for (const var_ of newVars) {
    md += `- \`${var_.name}\` = \`${var_.value.substring(0, 60)}${var_.value.length > 60 ? '...' : ''}\` (${var_.file})\n`;
  }
  if (report.cssVariables.new > 30) {
    md += `\n... and ${report.cssVariables.new - 30} more new variables\n`;
  }

  md += `\n## Design Tokens Available\n\n`;
  md += `### Spacing Tokens (${report.designTokens.spacing.length})\n\n`;
  for (const token of report.designTokens.spacing.slice(0, 20)) {
    md += `- \`${token.path}\` = \`${typeof token.value === 'string' ? token.value : JSON.stringify(token.value)}\`\n`;
  }
  if (report.designTokens.spacing.length > 20) {
    md += `\n... and ${report.designTokens.spacing.length - 20} more spacing tokens\n`;
  }

  md += `\n### Typography Tokens (${report.designTokens.typography.length})\n\n`;
  for (const token of report.designTokens.typography.slice(0, 20)) {
    md += `- \`${token.path}\` = \`${typeof token.value === 'string' ? token.value : JSON.stringify(token.value)}\`\n`;
  }
  if (report.designTokens.typography.length > 20) {
    md += `\n... and ${report.designTokens.typography.length - 20} more typography tokens\n`;
  }

  md += `\n## Duplicate Values (Top 20)\n\n`;
  for (const dup of report.duplicates.slice(0, 20)) {
    md += `### Value: \`${dup.value}\`\n\n`;
    md += `- **Variables:** ${dup.variables.map(v => `\`${v.name}\``).join(', ')}\n`;
    md += `- **Recommendation:** ${dup.recommendation}\n\n`;
  }

  md += `\n## Variable Mappings (Old → New)\n\n`;
  md += `| Old Variable | New Variable | Exact Match? | Recommendation |\n`;
  md += `|-------------|-------------|--------------|---------------|\n`;
  for (const mapping of report.mappings.slice(0, 30)) {
    md += `| \`${mapping.oldName}\` | \`${mapping.newName}\` | ${mapping.exactMatch ? '✅' : '❌'} | ${mapping.recommendation.substring(0, 50)}... |\n`;
  }
  if (report.mappings.length > 30) {
    md += `\n... and ${report.mappings.length - 30} more mappings\n`;
  }

  md += `\n## ⚠️ Conflicts (Values Differ)\n\n`;
  for (const conflict of report.conflicts.slice(0, 20)) {
    md += `### \`${conflict.oldName}\` → \`${conflict.newName}\`\n\n`;
    md += `- **Old value:** \`${conflict.oldValue.substring(0, 60)}...\`\n`;
    md += `- **New value:** \`${conflict.newValue.substring(0, 60)}...\`\n`;
    md += `- **Reason:** ${conflict.reason}\n\n`;
  }

  md += `\n## Spacing Value Comparison (CSS vs Design Tokens)\n\n`;
  md += `| CSS Value | Token Value | Match | CSS Variable | Token Path |\n`;
  md += `|-----------|-------------|-------|--------------|------------|\n`;
  for (const comp of report.spacingComparison.slice(0, 30)) {
    md += `| \`${comp.cssValue}\` | \`${comp.tokenValue || 'N/A'}\` | ${comp.match ? '✅' : '❌'} | \`${comp.cssVariable}\` | \`${comp.tokenPath || 'N/A'}\` |\n`;
  }
  if (report.spacingComparison.length > 30) {
    md += `\n... and ${report.spacingComparison.length - 30} more comparisons\n`;
  }

  md += `\n## Color Value Comparison (CSS vs Design Tokens)\n\n`;
  md += `| CSS Value | Token Value | Match | CSS Variable | Token Path |\n`;
  md += `|-----------|-------------|-------|--------------|------------|\n`;
  for (const comp of report.colorComparison.slice(0, 30)) {
    md += `| \`${comp.cssValue.substring(0, 40)}...\` | \`${comp.tokenValue ? comp.tokenValue.substring(0, 40) + '...' : 'N/A'}\` | ${comp.match ? '✅' : '❌'} | \`${comp.cssVariable}\` | \`${comp.tokenPath || 'N/A'}\` |\n`;
  }
  if (report.colorComparison.length > 30) {
    md += `\n... and ${report.colorComparison.length - 30} more comparisons\n`;
  }

  md += `\n## Consolidation Opportunities (Priority Order)\n\n`;
  const highPriority = report.opportunities.filter(o => o.priority === 'high');
  const mediumPriority = report.opportunities.filter(o => o.priority === 'medium');
  const lowPriority = report.opportunities.filter(o => o.priority === 'low');

  md += `### High Priority (${highPriority.length})\n\n`;
  for (const opp of highPriority.slice(0, 20)) {
    md += `- **[${opp.type.toUpperCase()}]** ${opp.description}\n`;
    md += `  - Variables: ${opp.variables.map(v => `\`${v}\``).join(', ')}\n`;
    md += `  - Recommendation: ${opp.recommendation}\n\n`;
  }

  md += `### Medium Priority (${mediumPriority.length})\n\n`;
  for (const opp of mediumPriority.slice(0, 10)) {
    md += `- **[${opp.type.toUpperCase()}]** ${opp.description}\n`;
    md += `  - Variables: ${opp.variables.map(v => `\`${v}\``).join(', ')}\n`;
    md += `  - Recommendation: ${opp.recommendation}\n\n`;
  }

  md += `\n## Files with CSS Variables\n\n`;
  for (const [file, vars] of Array.from(report.cssVariables.byFile.entries()).sort()) {
    md += `### \`${file}\` (${vars.length} variables)\n\n`;
    const oldCount = vars.filter(v => v.context === 'old').length;
    const newCount = vars.filter(v => v.context === 'new').length;
    const bothCount = vars.filter(v => v.context === 'both').length;
    md += `- Old: ${oldCount}, New: ${newCount}, Both: ${bothCount}\n\n`;
  }

  return md;
}

// Main execution
export async function runComprehensiveAnalysis(): Promise<void> {
  try {
    logger.info('Starting comprehensive CSS analysis...');
    const report = await generateComprehensiveReport();
    const markdown = generateMarkdownReport(report);
    
    // Write report to file
    const reportPath = join(PROJECT_ROOT, '.cursor/tailwind-cleanup/comprehensive-css-analysis.md');
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, markdown, 'utf-8');
    
    console.log(markdown);
    
    logger.info(`Comprehensive analysis complete! Report saved to: ${reportPath}`);
    logger.info(`Found ${report.cssVariables.total} CSS variables, ${report.duplicates.length} duplicates, ${report.mappings.length} mappings`);
  } catch (error) {
    logger.error('Comprehensive analysis failed', { error });
    throw error;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveAnalysis().catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}
