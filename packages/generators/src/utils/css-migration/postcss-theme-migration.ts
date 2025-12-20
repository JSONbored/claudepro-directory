/**
 * PostCSS Plugin: Theme Migration (data-theme → .dark)
 *
 * Safely migrates theme system from data-theme attribute to .dark class
 *
 * Transformations:
 * - [data-theme="dark"] → .dark
 * - [data-theme="light"] → .light (if needed)
 * - html[data-theme="dark"] → html.dark
 *
 * Safety features:
 * - Only transforms selectors, not values
 * - Preserves all other CSS
 * - Logs all transformations for review
 */

import type { Plugin } from 'postcss';

interface ThemeMigrationOptions {
  /** Dry run mode - analyze only, don't modify */
  dryRun?: boolean;
  /** Log all transformations */
  verbose?: boolean;
}

interface Transformation {
  file?: string;
  original: string;
  transformed: string;
  line?: number;
}

const transformations: Transformation[] = [];

function themeMigrationPlugin(options: ThemeMigrationOptions = {}): Plugin {
  const { dryRun = false, verbose = false } = options;

  return {
    postcssPlugin: 'theme-migration',
    Rule(rule) {
      const originalSelector = rule.selector;
      let newSelector = originalSelector;

      // Transform [data-theme="dark"] to .dark
      if (originalSelector.includes('[data-theme="dark"]')) {
        // Handle :root:not([data-theme="dark"]) → :root:not(.dark) (no space)
        newSelector = originalSelector.replace(
          /:root:not\(\[data-theme="dark"\]\)/g,
          ':root:not(.dark)'
        );

        // Handle :root[data-theme="dark"] → :root.dark
        newSelector = newSelector.replace(/:root\[data-theme="dark"\]/g, ':root.dark');

        // Handle [data-theme="dark"] followed by space (most common case)
        // This preserves the space after the attribute selector
        newSelector = newSelector.replace(/\[data-theme="dark"\]\s+/g, '.dark ');

        // Handle [data-theme="dark"] at end of selector
        newSelector = newSelector.replace(/\[data-theme="dark"\]$/g, '.dark');

        // Handle [data-theme="dark"] at start of selector
        newSelector = newSelector.replace(/^\[data-theme="dark"\]/g, '.dark');

        // Clean up: ensure html.dark format (not html .dark)
        newSelector = newSelector.replace(/html\s+\.dark/g, 'html.dark');

        if (newSelector !== originalSelector) {
          const transformation: Transformation = {
            original: originalSelector,
            transformed: newSelector,
            ...(rule.source?.start?.line !== undefined ? { line: rule.source.start.line } : {}),
          };

          transformations.push(transformation);

          if (verbose) {
            console.log(`  [${transformation.line ?? '?'}] ${originalSelector} → ${newSelector}`);
          }

          if (!dryRun) {
            rule.selector = newSelector;
          }
        }
      }

      // Transform [data-theme="light"] to .light
      if (originalSelector.includes('[data-theme="light"]')) {
        // Handle [data-theme="light"] followed by space
        newSelector = originalSelector.replace(/\[data-theme="light"\]\s+/g, '.light ');

        // Handle [data-theme="light"] at end
        newSelector = newSelector.replace(/\[data-theme="light"\]$/g, '.light');

        // Handle [data-theme="light"] at start
        newSelector = newSelector.replace(/^\[data-theme="light"\]/g, '.light');

        // Clean up: ensure html.light format
        newSelector = newSelector.replace(/html\s+\.light/g, 'html.light');

        if (newSelector !== originalSelector) {
          const transformation: Transformation = {
            original: originalSelector,
            transformed: newSelector,
            ...(rule.source?.start?.line !== undefined ? { line: rule.source.start.line } : {}),
          };

          transformations.push(transformation);

          if (verbose) {
            console.log(`  [${transformation.line ?? '?'}] ${originalSelector} → ${newSelector}`);
          }

          if (!dryRun) {
            rule.selector = newSelector;
          }
        }
      }
    },
  };
}

themeMigrationPlugin.postcss = true;

export default themeMigrationPlugin;
export { transformations, type Transformation };
