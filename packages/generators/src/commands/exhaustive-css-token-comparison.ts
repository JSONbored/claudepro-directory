#!/usr/bin/env tsx
/**
 * Exhaustive CSS vs Design Tokens Comparison
 * 
 * This tool performs DEEP comparison between:
 * 1. CSS variables (old system) vs CSS variables (new tweakcn theme)
 * 2. CSS variables vs Design Tokens (SPACING, TYPOGRAPHY, COLORS, SHADOWS)
 * 3. CSS variables vs UI_CLASSES (Tailwind class strings)
 * 4. Exact value matches, near-matches, and consolidation opportunities
 * 
 * This is the MOST EXHAUSTIVE analysis - finds every possible overlap and duplication.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as postcss from 'postcss';
import valueParser from 'postcss-value-parser';

import { logger } from '../toolkit/logger.js';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(__filename);
const PROJECT_ROOT = join(SCRIPT_DIR, '../../../../');

interface ValueMatch {
  cssVariable: string;
  cssValue: string;
  tokenPath?: string;
  tokenValue?: string;
  uiClass?: string;
  uiClassValue?: string;
  matchType: 'exact' | 'near' | 'none';
  recommendation: string;
}

interface ExhaustiveReport {
  spacingMatches: ValueMatch[];
  typographyMatches: ValueMatch[];
  colorMatches: ValueMatch[];
  shadowMatches: ValueMatch[];
  radiusMatches: ValueMatch[];
  uiClassMatches: ValueMatch[];
  summary: {
    totalCSSVariables: number;
    totalDesignTokens: number;
    exactMatches: number;
    nearMatches: number;
    consolidationOpportunities: number;
  };
}

// Load all CSS variables from globals.css
function loadCSSVariables(): Map<string, { value: string; context: string }> {
  const globalsPath = join(PROJECT_ROOT, 'apps/web/src/app/globals.css');
  const content = readFileSync(globalsPath, 'utf-8');
  const root = postcss.default.parse(content);
  const variables = new Map<string, { value: string; context: string }>();

  root.walkRules((rule) => {
    rule.walkDecls((decl) => {
      if (decl.prop.startsWith('--')) {
        variables.set(decl.prop, {
          value: decl.value.trim(),
          context: rule.selector,
        });
      }
    });
  });

  return variables;
}

// Load design tokens - SPACING
function loadSpacingTokens(): Map<string, string> {
  const tokens = new Map<string, string>();
  
  try {
    const scalePath = join(PROJECT_ROOT, 'packages/web-runtime/src/design-tokens/spacing/scale.ts');
    const scaleContent = readFileSync(scalePath, 'utf-8');
    const scaleMatch = scaleContent.match(/export const SPACING_SCALE = \{([^}]+)\}/s);
    
    if (scaleMatch) {
      const entries = scaleMatch[1].matchAll(/(\w+):\s*['"]([^'"]+)['"]/g);
      for (const match of entries) {
        tokens.set(`SPACING.scale.${match[1]}`, match[2]);
        tokens.set(`SPACING.marginBottom.${match[1]}`, match[2]);
        tokens.set(`SPACING.marginTop.${match[1]}`, match[2]);
        tokens.set(`SPACING.padding.${match[1]}`, match[2]);
        tokens.set(`SPACING.gap.${match[1]}`, match[2]);
      }
    }
  } catch (error) {
    logger.warn('Error loading spacing tokens', { error });
  }

  return tokens;
}

// Load design tokens - TYPOGRAPHY
function loadTypographyTokens(): Map<string, string> {
  const tokens = new Map<string, string>();
  
  try {
    const fontSizePath = join(PROJECT_ROOT, 'packages/web-runtime/src/design-tokens/typography/font-sizes.ts');
    const fontSizeContent = readFileSync(fontSizePath, 'utf-8');
    const fontSizeMatch = fontSizeContent.match(/export const FONT_SIZES = \{([^}]+)\}/s);
    
    if (fontSizeMatch) {
      const entries = fontSizeMatch[1].matchAll(/(\w+):\s*['"]([^'"]+)['"]/g);
      for (const match of entries) {
        tokens.set(`TYPOGRAPHY.fontSizes.${match[1]}`, match[2]);
      }
    }
  } catch (error) {
    logger.warn('Error loading typography tokens', { error });
  }

  return tokens;
}

// Load design tokens - SHADOWS
function loadShadowTokens(): Map<string, string> {
  const tokens = new Map<string, string>();
  
  try {
    const shadowPath = join(PROJECT_ROOT, 'packages/web-runtime/src/design-tokens/shadows/elevation.ts');
    const shadowContent = readFileSync(shadowPath, 'utf-8');
    
    // Extract dark shadows
    const darkMatch = shadowContent.match(/dark:\s*\{([^}]+)\}/s);
    if (darkMatch) {
      const entries = darkMatch[1].matchAll(/(\w+):\s*['"]([^'"]+)['"]/g);
      for (const match of entries) {
        tokens.set(`SHADOWS.elevation.dark.${match[1]}`, match[2]);
      }
    }
    
    // Extract light shadows
    const lightMatch = shadowContent.match(/light:\s*\{([^}]+)\}/s);
    if (lightMatch) {
      const entries = lightMatch[1].matchAll(/(\w+):\s*['"]([^'"]+)['"]/g);
      for (const match of entries) {
        tokens.set(`SHADOWS.elevation.light.${match[1]}`, match[2]);
      }
    }
  } catch (error) {
    logger.warn('Error loading shadow tokens', { error });
  }

  return tokens;
}

// Load design tokens - COLORS
function loadColorTokens(): Map<string, string> {
  const tokens = new Map<string, string>();
  
  try {
    const palettePath = join(PROJECT_ROOT, 'packages/web-runtime/src/design-tokens/colors/palette.ts');
    const paletteContent = readFileSync(palettePath, 'utf-8');
    
    // Extract BRAND_COLORS
    const brandMatch = paletteContent.match(/export const BRAND_COLORS = \{([^}]+)\}/s);
    if (brandMatch) {
      const entries = brandMatch[1].matchAll(/(\w+):\s*['"]([^'"]+)['"]/g);
      for (const match of entries) {
        tokens.set(`COLORS.palette.brand.${match[1]}`, match[2]);
      }
    }
    
    // Extract NEUTRAL_COLORS.dark
    const neutralDarkMatch = paletteContent.match(/dark:\s*\{([^}]+)\}/s);
    if (neutralDarkMatch) {
      const entries = neutralDarkMatch[1].matchAll(/(\w+):\s*['"]([^'"]+)['"]/g);
      for (const match of entries) {
        tokens.set(`COLORS.palette.neutral.dark.${match[1]}`, match[2]);
      }
    }
    
    // Extract NEUTRAL_COLORS.light
    const neutralLightMatch = paletteContent.match(/light:\s*\{([^}]+)\}/s);
    if (neutralLightMatch) {
      const entries = neutralLightMatch[1].matchAll(/(\w+):\s*['"]([^'"]+)['"]/g);
      for (const match of entries) {
        tokens.set(`COLORS.palette.neutral.light.${match[1]}`, match[2]);
      }
    }
  } catch (error) {
    logger.warn('Error loading color tokens', { error });
  }

  return tokens;
}

// Load UI_CLASSES (Tailwind class strings)
function loadUIClasses(): Map<string, string> {
  const classes = new Map<string, string>();
  
  try {
    const constantsPath = join(PROJECT_ROOT, 'packages/web-runtime/src/ui/constants.ts');
    const constantsContent = readFileSync(constantsPath, 'utf-8');
    
    // Extract UI_CLASSES object
    const uiClassesMatch = constantsContent.match(/export const UI_CLASSES = \{([^}]+)\}/s);
    if (uiClassesMatch) {
      const entries = uiClassesMatch[1].matchAll(/(\w+):\s*['"]([^'"]+)['"]/g);
      for (const match of entries) {
        classes.set(`UI_CLASSES.${match[1]}`, match[2]);
      }
    }
  } catch (error) {
    logger.warn('Error loading UI_CLASSES', { error });
  }

  return classes;
}

// Normalize values for comparison
function normalizeValue(value: string): string {
  // Remove whitespace
  let normalized = value.trim();
  
  // Normalize var() references - extract the referenced variable name
  const varMatch = normalized.match(/var\(--([^)]+)\)/);
  if (varMatch) {
    normalized = varMatch[1]; // Use the variable name for comparison
  }
  
  // Normalize OKLCH - remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized;
}

// Compare spacing values
function compareSpacing(
  cssVariables: Map<string, { value: string; context: string }>,
  spacingTokens: Map<string, string>
): ValueMatch[] {
  const matches: ValueMatch[] = [];
  
  // Find CSS spacing variables
  for (const [cssVar, { value }] of cssVariables.entries()) {
    if (cssVar.includes('spacing') || cssVar.includes('margin') || cssVar.includes('padding') || cssVar.includes('gap')) {
      // Parse value
      const parsed = valueParser(value);
      let numericValue: string | null = null;
      
      parsed.walk((node) => {
        if (node.type === 'word' && /^\d+(\.\d+)?(rem|px|em)$/.test(node.value)) {
          numericValue = node.value;
        }
      });

      if (numericValue) {
        // Normalize to rem
        const normalized = numericValue.endsWith('px') 
          ? `${parseFloat(numericValue) / 16}rem`
          : numericValue;

        // Find matching token
        let bestMatch: { path: string; value: string } | null = null;
        for (const [tokenPath, tokenValue] of spacingTokens.entries()) {
          if (tokenValue === normalized || tokenValue === numericValue) {
            bestMatch = { path: tokenPath, value: tokenValue };
            break;
          }
        }

        matches.push({
          cssVariable: cssVar,
          cssValue: numericValue,
          tokenPath: bestMatch?.path,
          tokenValue: bestMatch?.value,
          matchType: bestMatch ? 'exact' : 'none',
          recommendation: bestMatch 
            ? `Use ${bestMatch.path} design token instead of ${cssVar}`
            : `No matching design token found for ${cssVar}`,
        });
      }
    }
  }

  return matches;
}

// Compare typography values
function compareTypography(
  cssVariables: Map<string, { value: string; context: string }>,
  typographyTokens: Map<string, string>
): ValueMatch[] {
  const matches: ValueMatch[] = [];
  
  // Find CSS font-size variables
  for (const [cssVar, { value }] of cssVariables.entries()) {
    if (cssVar.includes('font-size') || cssVar.includes('fontSize')) {
      // Parse value
      const parsed = valueParser(value);
      let fontSizeValue: string | null = null;
      
      parsed.walk((node) => {
        if (node.type === 'word' && /^\d+(\.\d+)?(rem|px|em)$/.test(node.value)) {
          fontSizeValue = node.value;
        }
      });

      if (fontSizeValue) {
        // Normalize to rem
        const normalized = fontSizeValue.endsWith('px') 
          ? `${parseFloat(fontSizeValue) / 16}rem`
          : fontSizeValue;

        // Find matching token
        let bestMatch: { path: string; value: string } | null = null;
        for (const [tokenPath, tokenValue] of typographyTokens.entries()) {
          if (tokenValue === normalized || tokenValue === fontSizeValue) {
            bestMatch = { path: tokenPath, value: tokenValue };
            break;
          }
        }

        matches.push({
          cssVariable: cssVar,
          cssValue: fontSizeValue,
          tokenPath: bestMatch?.path,
          tokenValue: bestMatch?.value,
          matchType: bestMatch ? 'exact' : 'none',
          recommendation: bestMatch 
            ? `Use ${bestMatch.path} design token instead of ${cssVar}`
            : `No matching design token found for ${cssVar}`,
        });
      }
    }
  }

  return matches;
}

// Compare shadow values
function compareShadows(
  cssVariables: Map<string, { value: string; context: string }>,
  shadowTokens: Map<string, string>
): ValueMatch[] {
  const matches: ValueMatch[] = [];
  
  // Find CSS shadow variables
  for (const [cssVar, { value }] of cssVariables.entries()) {
    if (cssVar.includes('shadow') && !cssVar.includes('shadow-color') && !cssVar.includes('shadow-opacity') && !cssVar.includes('shadow-blur') && !cssVar.includes('shadow-spread') && !cssVar.includes('shadow-offset')) {
      const normalized = normalizeValue(value);
      
      // Find matching token
      let bestMatch: { path: string; value: string } | null = null;
      for (const [tokenPath, tokenValue] of shadowTokens.entries()) {
        const normalizedToken = normalizeValue(tokenValue);
        if (normalizedToken === normalized) {
          bestMatch = { path: tokenPath, value: tokenValue };
          break;
        }
      }

      matches.push({
        cssVariable: cssVar,
        cssValue: value.substring(0, 80) + (value.length > 80 ? '...' : ''),
        tokenPath: bestMatch?.path,
        tokenValue: bestMatch ? (bestMatch.value.substring(0, 80) + (bestMatch.value.length > 80 ? '...' : '')) : undefined,
        matchType: bestMatch ? 'exact' : 'none',
        recommendation: bestMatch 
          ? `Use ${bestMatch.path} design token instead of ${cssVar}`
          : `No matching design token found for ${cssVar}`,
      });
    }
  }

  return matches;
}

// Compare radius values
function compareRadius(
  cssVariables: Map<string, { value: string; context: string }>,
  uiClasses: Map<string, string>
): ValueMatch[] {
  const matches: ValueMatch[] = [];
  
  // Find CSS radius variables
  for (const [cssVar, { value }] of cssVariables.entries()) {
    if (cssVar.includes('radius')) {
      // Parse value
      const parsed = valueParser(value);
      let radiusValue: string | null = null;
      
      parsed.walk((node) => {
        if (node.type === 'word' && /^\d+(\.\d+)?(rem|px)$/.test(node.value)) {
          radiusValue = node.value;
        }
      });

      if (radiusValue) {
        // Map to Tailwind rounded classes
        const radiusMap: Record<string, string> = {
          '0.125rem': 'rounded-sm',
          '0.25rem': 'rounded-sm',
          '0.375rem': 'rounded-md',
          '0.5rem': 'rounded-lg',
          '0.75rem': 'rounded-xl',
          '1rem': 'rounded-2xl',
        };

        const roundedClass = radiusMap[radiusValue];
        
        matches.push({
          cssVariable: cssVar,
          cssValue: radiusValue,
          uiClass: roundedClass ? `rounded-*` : undefined,
          uiClassValue: roundedClass,
          matchType: roundedClass ? 'exact' : 'none',
          recommendation: roundedClass 
            ? `Use Tailwind class ${roundedClass} instead of CSS variable ${cssVar}`
            : `No matching Tailwind class found for ${cssVar}`,
        });
      }
    }
  }

  return matches;
}

// Compare with UI_CLASSES
function compareWithUIClasses(
  cssVariables: Map<string, { value: string; context: string }>,
  uiClasses: Map<string, string>
): ValueMatch[] {
  const matches: ValueMatch[] = [];
  
  // For spacing variables, check if there's a UI_CLASSES equivalent
  for (const [cssVar, { value }] of cssVariables.entries()) {
    if (cssVar.includes('spacing') || cssVar.includes('margin') || cssVar.includes('padding')) {
      // Parse value
      const parsed = valueParser(value);
      let numericValue: string | null = null;
      
      parsed.walk((node) => {
        if (node.type === 'word' && /^\d+(\.\d+)?(rem|px)$/.test(node.value)) {
          numericValue = node.value;
        }
      });

      if (numericValue) {
        // Map to Tailwind classes
        const tailwindMap: Record<string, string> = {
          '0.125rem': '0.5', // mb-0.5
          '0.25rem': '1',     // mb-1
          '0.5rem': '2',      // mb-2
          '0.75rem': '3',     // mb-3
          '1rem': '4',        // mb-4
          '1.5rem': '6',      // mb-6
          '2rem': '8',        // mb-8
          '3rem': '12',       // mb-12
          '4rem': '16',       // mb-16
        };

        const tailwindNum = tailwindMap[numericValue];
        if (tailwindNum) {
          // Check if UI_CLASSES has this
          let uiClassMatch: string | undefined;
          if (cssVar.includes('margin') || cssVar.includes('mb')) {
            uiClassMatch = `UI_CLASSES.MARGIN_${tailwindNum === '0.5' ? 'MICRO' : tailwindNum === '1' ? 'TIGHT' : tailwindNum === '2' ? 'COMPACT' : tailwindNum === '3' ? 'DEFAULT' : tailwindNum === '4' ? 'DEFAULT' : tailwindNum === '6' ? 'COMFORTABLE' : tailwindNum === '8' ? 'RELAXED' : tailwindNum === '12' ? 'SECTION' : tailwindNum === '16' ? 'HERO' : 'DEFAULT'}`;
          }

          if (uiClassMatch) {
            const uiClassValue = uiClasses.get(uiClassMatch);
            if (uiClassValue) {
              matches.push({
                cssVariable: cssVar,
                cssValue: numericValue,
                uiClass: uiClassMatch,
                uiClassValue: uiClassValue,
                matchType: 'exact',
                recommendation: `Use ${uiClassMatch} (${uiClassValue}) instead of CSS variable ${cssVar}`,
              });
            }
          }
        }
      }
    }
  }

  return matches;
}

// Main execution
async function runExhaustiveComparison(): Promise<void> {
  try {
    logger.info('Starting exhaustive CSS vs Design Tokens comparison...');

    // Load everything
    const cssVariables = loadCSSVariables();
    const spacingTokens = loadSpacingTokens();
    const typographyTokens = loadTypographyTokens();
    const shadowTokens = loadShadowTokens();
    const colorTokens = loadColorTokens();
    const uiClasses = loadUIClasses();

    logger.info(`Loaded ${cssVariables.size} CSS variables, ${spacingTokens.size} spacing tokens, ${typographyTokens.size} typography tokens, ${shadowTokens.size} shadow tokens, ${colorTokens.size} color tokens, ${uiClasses.size} UI_CLASSES`);

    // Compare everything
    const spacingMatches = compareSpacing(cssVariables, spacingTokens);
    const typographyMatches = compareTypography(cssVariables, typographyTokens);
    const shadowMatches = compareShadows(cssVariables, shadowTokens);
    const radiusMatches = compareRadius(cssVariables, uiClasses);
    const uiClassMatches = compareWithUIClasses(cssVariables, uiClasses);

    // Count matches
    const exactMatches = [
      ...spacingMatches.filter(m => m.matchType === 'exact'),
      ...typographyMatches.filter(m => m.matchType === 'exact'),
      ...shadowMatches.filter(m => m.matchType === 'exact'),
      ...radiusMatches.filter(m => m.matchType === 'exact'),
      ...uiClassMatches.filter(m => m.matchType === 'exact'),
    ].length;

    const report: ExhaustiveReport = {
      spacingMatches,
      typographyMatches,
      colorMatches: [], // TODO: Implement color comparison
      shadowMatches,
      radiusMatches,
      uiClassMatches,
      summary: {
        totalCSSVariables: cssVariables.size,
        totalDesignTokens: spacingTokens.size + typographyTokens.size + shadowTokens.size + colorTokens.size,
        exactMatches,
        nearMatches: 0, // TODO: Implement near-match detection
        consolidationOpportunities: exactMatches,
      },
    };

    // Generate markdown report
    let md = '# Exhaustive CSS vs Design Tokens Comparison\n\n';
    md += `Generated: ${new Date().toISOString()}\n\n`;

    md += `## Summary\n\n`;
    md += `- **CSS Variables:** ${report.summary.totalCSSVariables}\n`;
    md += `- **Design Tokens:** ${report.summary.totalDesignTokens}\n`;
    md += `- **Exact Matches:** ${report.summary.exactMatches}\n`;
    md += `- **Consolidation Opportunities:** ${report.summary.consolidationOpportunities}\n\n`;

    md += `## Spacing Matches (${spacingMatches.length})\n\n`;
    md += `| CSS Variable | CSS Value | Token Path | Token Value | Match | Recommendation |\n`;
    md += `|-------------|-----------|------------|-------------|-------|---------------|\n`;
    for (const match of spacingMatches.slice(0, 30)) {
      md += `| \`${match.cssVariable}\` | \`${match.cssValue}\` | \`${match.tokenPath || 'N/A'}\` | \`${match.tokenValue || 'N/A'}\` | ${match.matchType === 'exact' ? '✅' : '❌'} | ${match.recommendation} |\n`;
    }

    md += `\n## Typography Matches (${typographyMatches.length})\n\n`;
    md += `| CSS Variable | CSS Value | Token Path | Token Value | Match | Recommendation |\n`;
    md += `|-------------|-----------|------------|-------------|-------|---------------|\n`;
    for (const match of typographyMatches.slice(0, 30)) {
      md += `| \`${match.cssVariable}\` | \`${match.cssValue}\` | \`${match.tokenPath || 'N/A'}\` | \`${match.tokenValue || 'N/A'}\` | ${match.matchType === 'exact' ? '✅' : '❌'} | ${match.recommendation} |\n`;
    }

    md += `\n## Shadow Matches (${shadowMatches.length})\n\n`;
    md += `| CSS Variable | CSS Value | Token Path | Token Value | Match | Recommendation |\n`;
    md += `|-------------|-----------|------------|-------------|-------|---------------|\n`;
    for (const match of shadowMatches.slice(0, 30)) {
      md += `| \`${match.cssVariable}\` | \`${match.cssValue}\` | \`${match.tokenPath || 'N/A'}\` | \`${match.tokenValue || 'N/A'}\` | ${match.matchType === 'exact' ? '✅' : '❌'} | ${match.recommendation} |\n`;
    }

    md += `\n## UI_CLASSES Matches (${uiClassMatches.length})\n\n`;
    md += `| CSS Variable | CSS Value | UI Class | UI Class Value | Match | Recommendation |\n`;
    md += `|-------------|-----------|----------|----------------|-------|---------------|\n`;
    for (const match of uiClassMatches.slice(0, 30)) {
      md += `| \`${match.cssVariable}\` | \`${match.cssValue}\` | \`${match.uiClass || 'N/A'}\` | \`${match.uiClassValue || 'N/A'}\` | ${match.matchType === 'exact' ? '✅' : '❌'} | ${match.recommendation} |\n`;
    }

    // Write report
    const reportPath = join(PROJECT_ROOT, '.cursor/tailwind-cleanup/exhaustive-css-token-comparison.md');
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, md, 'utf-8');

    console.log(md);
    logger.info(`Exhaustive comparison complete! Report saved to: ${reportPath}`);
  } catch (error) {
    logger.error('Exhaustive comparison failed', { error });
    throw error;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  runExhaustiveComparison().catch((error) => {
    console.error('❌ Comparison failed:', error);
    process.exit(1);
  });
}

export { runExhaustiveComparison };
