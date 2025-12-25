#!/usr/bin/env tsx
/**
 * Knip Plugin: Design System Analysis
 *
 * Finds deprecated semantic utility usage and flags files that need migration to Direct Tailwind.
 *
 * Analyzes:
 * - Files importing from @heyclaude/web-runtime/design-system (deprecated semantic utilities)
 * - Files using old constants (DIMENSIONS, ANIMATION_CONSTANTS, etc.)
 * - CSS variables in @theme block (for reference)
 *
 * Usage:
 *   knip --plugins packages/generators/src/knip-plugins/design-system.ts
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(__filename);
const PROJECT_ROOT = join(SCRIPT_DIR, '../../../../');

interface DeprecatedUsage {
  file: string;
  type: 'semantic-utility' | 'old-constant';
  imports: string[];
  line?: number;
}

interface CSSVariable {
  name: string;
  file: string;
  line?: number;
}

/**
 * Find all files using deprecated semantic utilities
 */
function findSemanticUtilityUsage(): DeprecatedUsage[] {
  const usages: DeprecatedUsage[] = [];
  const searchPaths = [
    join(PROJECT_ROOT, 'apps/web/src'),
    join(PROJECT_ROOT, 'packages/web-runtime/src'),
  ];

  function scanDirectory(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDirectory(fullPath);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          const relPath = fullPath.replace(PROJECT_ROOT, '');

          // Check for imports from design-system (deprecated semantic utilities)
          const designSystemImportMatch = content.match(
            /import\s+(?:\{([^}]+)\}|\*\s+as\s+\w+)\s+from\s+['"]@heyclaude\/web-runtime\/design-system['"]/
          );

          if (designSystemImportMatch) {
            const namedImports = designSystemImportMatch[1] || '';
            const imports: string[] = [];

            if (namedImports) {
              // Parse named imports
              const namedList = namedImports
                .split(',')
                .map((imp) => {
                  const parts = imp.trim().split(/\s+as\s+/);
                  return parts[0]?.trim() || '';
                })
                .filter(Boolean);

              imports.push(...namedList);
            }

            // Filter to only style utilities (not animations/microinteractions)
            const styleUtilities = imports.filter((imp) => {
              const styleUtils = [
                'marginBottom',
                'marginTop',
                'spaceY',
                'spaceX',
                'padding',
                'stack',
                'cluster',
                'row',
                'center',
                'between',
                'wrap',
                'muted',
                'size',
                'weight',
                'leading',
                'tracking',
                'truncate',
                'iconSize',
                'iconSizeRect',
                'iconLeading',
                'border',
                'radius',
                'hoverBg',
                'hoverText',
                'focusRing',
                'transition',
                'interactive',
                'link',
                'animate',
                'animateIn',
                'animateDuration',
              ];
              return styleUtils.includes(imp);
            });

            if (styleUtilities.length > 0) {
              usages.push({
                file: relPath,
                type: 'semantic-utility',
                imports: styleUtilities,
              });
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }

  for (const searchPath of searchPaths) {
    if (statSync(searchPath).isDirectory()) {
      scanDirectory(searchPath);
    }
  }

  return usages;
}

/**
 * Find all files using old constants
 */
function findOldConstantUsage(): DeprecatedUsage[] {
  const usages: DeprecatedUsage[] = [];
  const searchPaths = [
    join(PROJECT_ROOT, 'apps/web/src'),
    join(PROJECT_ROOT, 'packages/web-runtime/src'),
  ];

  const oldConstants = [
    'DIMENSIONS',
    'ANIMATION_CONSTANTS',
    'POSITION_PATTERNS',
    'STATE_PATTERNS',
    'UI_CLASSES',
  ];

  function scanDirectory(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDirectory(fullPath);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          const relPath = fullPath.replace(PROJECT_ROOT, '');
          const lines = content.split('\n');

          const foundConstants: string[] = [];

          // Check for imports
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line) {
              for (const constant of oldConstants) {
                if (line.includes(constant) && line.includes('import')) {
                  foundConstants.push(constant);
                }
              }
            }
          }

          // Check for usage
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line) {
              for (const constant of oldConstants) {
                if (line.includes(`${constant}.`) && !foundConstants.includes(constant)) {
                  foundConstants.push(constant);
                }
              }
            }
          }

          // Whitelist: OG route files use DIMENSIONS for image generation (legitimate use case)
          const isOGRoute =
            relPath.includes('/api/og/route.tsx') ||
            relPath.includes('/seo/og.ts') ||
            relPath.includes('/seo/generator.ts');

          if (foundConstants.length > 0 && !isOGRoute) {
            usages.push({
              file: relPath,
              type: 'old-constant',
              imports: foundConstants,
            });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }

  for (const searchPath of searchPaths) {
    if (statSync(searchPath).isDirectory()) {
      scanDirectory(searchPath);
    }
  }

  return usages;
}

/**
 * Load CSS variables from globals.css @theme block (for reference)
 */
function loadCSSVariables(): CSSVariable[] {
  const variables: CSSVariable[] = [];
  const globalsPath = join(PROJECT_ROOT, 'apps/web/src/app/globals.css');

  try {
    const content = readFileSync(globalsPath, 'utf-8');
    const lines = content.split('\n');

    // Find @theme block
    let inThemeBlock = false;
    for (let i = 0; i < lines.length; i++) {
      const lineContent = lines[i];
      if (!lineContent) continue;

      if (lineContent.includes('@theme')) {
        inThemeBlock = true;
        continue;
      }

      if (inThemeBlock && lineContent.trim().startsWith('}') && lineContent.includes('@')) {
        // End of @theme block (next @ rule)
        break;
      }

      if (inThemeBlock) {
        // Match CSS variable definitions: --variable-name: value;
        const varMatch = lineContent.match(/--([\w-]+):\s*[^;]+;/);
        if (varMatch && varMatch[1]) {
          variables.push({
            name: `--${varMatch[1]}`,
            file: 'apps/web/src/app/globals.css',
            line: i + 1,
          });
        }
      }
    }
  } catch (error) {
    // Skip if file can't be read
  }

  return variables;
}

/**
 * Main plugin function for Knip
 */
export default {
  name: 'design-system',
  check: async () => {
    const semanticUtilityUsage = findSemanticUtilityUsage();
    const oldConstantUsage = findOldConstantUsage();
    const cssVariables = loadCSSVariables();

    // Generate report
    const report = {
      deprecatedSemanticUtilities: semanticUtilityUsage,
      deprecatedOldConstants: oldConstantUsage,
      cssVariables: cssVariables.map((v) => ({
        name: v.name,
        file: v.file,
        line: v.line ?? undefined,
      })),
      summary: {
        filesUsingSemanticUtilities: semanticUtilityUsage.length,
        filesUsingOldConstants: oldConstantUsage.length,
        totalFilesNeedingMigration: new Set([
          ...semanticUtilityUsage.map((u) => u.file),
          ...oldConstantUsage.map((u) => u.file),
        ]).size,
        totalCSSVariables: cssVariables.length,
      },
    };

    return report;
  },
};
